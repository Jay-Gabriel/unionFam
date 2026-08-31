import { NextResponse } from 'next/server';
import { requireUser } from '@/server/auth/current-user';
import { pcmToWav } from '@/server/audio/pcm-wav';
import { consumeRateLimit } from '@/server/security/rate-limit';
import { recordApplicationError } from '@/server/observability/log';

export const dynamic = 'force-dynamic';

const MAX_TEXT_LENGTH = 3_000;
const MAX_PCM_BYTES = 10 * 1024 * 1024;
const DEFAULT_TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const DEFAULT_TTS_VOICE = 'Aoede';
const TTS_TIMEOUT_MS = 20_000;

type GeminiPart = {
  inlineData?: {
    data?: unknown;
    mimeType?: unknown;
  };
};

function errorResponse(error: string, status: number, requestId: string) {
  return NextResponse.json(
    { error, requestId },
    { status, headers: { 'X-Request-Id': requestId } }
  );
}

function readText(body: unknown) {
  if (!body || typeof body !== 'object' || !('text' in body)) return '';
  const value = (body as { text?: unknown }).text;
  return typeof value === 'string' ? value.trim() : '';
}

function extractAudio(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null;
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates)) return null;

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    const content = (candidate as { content?: unknown }).content;
    if (!content || typeof content !== 'object') continue;
    const parts = (content as { parts?: unknown }).parts;
    if (!Array.isArray(parts)) continue;
    for (const part of parts as GeminiPart[]) {
      const inlineData = part?.inlineData;
      if (
        inlineData &&
        typeof inlineData.data === 'string' &&
        inlineData.data.length > 0
      ) {
        return {
          base64: inlineData.data,
          mimeType: typeof inlineData.mimeType === 'string' ? inlineData.mimeType : '',
        };
      }
    }
  }
  return null;
}

function sampleRateFromMimeType(mimeType: string) {
  const match = mimeType.match(/(?:rate|samplerate)\s*=\s*(\d+)/i);
  const parsed = match ? Number(match[1]) : 24_000;
  return Number.isFinite(parsed) ? parsed : 24_000;
}

function ttsPrompt(text: string) {
  return [
    'Nói bằng tiếng Việt với giọng nữ ấm áp, bình tĩnh và truyền cảm.',
    'Tốc độ vừa chậm, phát âm rõ, ngắt nghỉ tự nhiên như một người đồng hành đang lắng nghe.',
    'Đọc nguyên văn nội dung bên dưới và không thêm lời dẫn, không đọc các chỉ dẫn này:',
    text,
  ].join('\n\n');
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  let userId: string | undefined;

  try {
    const user = await requireUser();
    userId = user.id;

    const rate = consumeRateLimit(`speech:${user.id}`, 20, 60_000);
    if (!rate.allowed) {
      return errorResponse('RATE_LIMITED', 429, requestId);
    }

    const body = await request.json().catch(() => null);
    const text = readText(body);
    if (!text || text.length > MAX_TEXT_LENGTH) {
      return errorResponse('INVALID_SPEECH_TEXT', 422, requestId);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'replace_with_server_only_gemini_api_key') {
      return errorResponse('TTS_NOT_CONFIGURED', 503, requestId);
    }

    const model = (process.env.GEMINI_TTS_MODEL || DEFAULT_TTS_MODEL).trim();
    const voiceName = (process.env.GEMINI_TTS_VOICE || DEFAULT_TTS_VOICE).trim();
    if (!model || !voiceName) return errorResponse('TTS_NOT_CONFIGURED', 503, requestId);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);
    let providerResponse: Response;
    try {
      providerResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: ttsPrompt(text) }] }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                languageCode: 'vi-VN',
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName },
                },
              },
            },
          }),
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    const payload = await providerResponse.json().catch(() => null);
    if (!providerResponse.ok) {
      await recordApplicationError({
        requestId,
        userId,
        errorCode: 'TTS_PROVIDER_UNAVAILABLE',
        route: '/api/speech',
        detail: { provider_status: providerResponse.status, model },
      });
      console.error('TTS provider request failed', providerResponse.status, model);
      return errorResponse('TTS_PROVIDER_UNAVAILABLE', 502, requestId);
    }

    const audio = extractAudio(payload);
    if (!audio) {
      await recordApplicationError({
        requestId,
        userId,
        errorCode: 'TTS_AUDIO_MISSING',
        route: '/api/speech',
        detail: { model },
      });
      return errorResponse('TTS_AUDIO_MISSING', 502, requestId);
    }

    const pcm = Buffer.from(audio.base64, 'base64');
    if (!pcm.length || pcm.length > MAX_PCM_BYTES) {
      return errorResponse('TTS_AUDIO_INVALID', 502, requestId);
    }

    const wav = pcmToWav(pcm, sampleRateFromMimeType(audio.mimeType));
    return new Response(wav, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': String(wav.byteLength),
        'Cache-Control': 'private, no-store',
        'X-Request-Id': requestId,
      },
    });
  } catch (error) {
    const errorCode = error instanceof Error && error.name === 'AbortError'
      ? 'TTS_PROVIDER_TIMEOUT'
      : error instanceof Error && error.message === 'AUTH_REQUIRED'
        ? 'AUTH_REQUIRED'
        : 'TTS_REQUEST_FAILED';

    if (errorCode !== 'AUTH_REQUIRED') {
      await recordApplicationError({
        requestId,
        userId,
        errorCode,
        route: '/api/speech',
      });
      console.error('TTS request failed', error instanceof Error ? error.name : 'UnknownError');
    }

    return errorResponse(errorCode, errorCode === 'AUTH_REQUIRED' ? 401 : 503, requestId);
  }
}
