import { NextResponse } from 'next/server';
import { requireUser } from '@/server/auth/current-user';
import { pcmToWav } from '@/server/audio/pcm-wav';
import {
  extractAudio,
  MAX_TTS_PCM_BYTES,
  MAX_TTS_TEXT_LENGTH,
  readTtsText,
  sampleRateFromMimeType,
  TTS_FALLBACK_MODEL,
  TTS_MODEL,
  TTS_TIMEOUT_MS,
  ttsRequestBody,
} from '@/server/audio/tts';
import { consumeRateLimit } from '@/server/security/rate-limit';
import { recordApplicationError } from '@/server/observability/log';

export const dynamic = 'force-dynamic';

function errorResponse(error: string, status: number, requestId: string) {
  return NextResponse.json(
    { error, requestId },
    { status, headers: { 'X-Request-Id': requestId } }
  );
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
    const text = readTtsText(body);
    if (!text || text.length > MAX_TTS_TEXT_LENGTH) {
      return errorResponse('INVALID_SPEECH_TEXT', 422, requestId);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'replace_with_server_only_gemini_api_key') {
      return errorResponse('TTS_NOT_CONFIGURED', 503, requestId);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);
    const models = [TTS_MODEL, TTS_FALLBACK_MODEL];
    let providerResponse: Response | null = null;
    let providerModel = TTS_MODEL;
    try {
      for (const model of models) {
        providerModel = model;
        providerResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify(ttsRequestBody(text)),
            signal: controller.signal,
          }
        );

        const canTryFallback = model === TTS_MODEL
          && (providerResponse.status === 429 || providerResponse.status >= 500);
        if (!canTryFallback) break;
        await providerResponse.body?.cancel().catch(() => undefined);
      }
    } finally {
      clearTimeout(timeout);
    }

    if (!providerResponse) throw new Error('TTS_PROVIDER_UNAVAILABLE');
    const payload = await providerResponse.json().catch(() => null);
    if (!providerResponse.ok) {
      const rateLimited = providerResponse.status === 429;
      const errorCode = rateLimited ? 'TTS_RATE_LIMITED' : 'TTS_PROVIDER_UNAVAILABLE';
      await recordApplicationError({
        requestId,
        userId,
        errorCode,
        route: '/api/speech',
        detail: {
          provider_status: providerResponse.status,
          model: providerModel,
          fallback_used: providerModel !== TTS_MODEL,
        },
      });
      console.error('TTS provider request failed', providerResponse.status, providerModel);
      return errorResponse(errorCode, rateLimited ? 429 : 502, requestId);
    }

    const audio = extractAudio(payload);
    if (!audio) {
      await recordApplicationError({
        requestId,
        userId,
        errorCode: 'TTS_AUDIO_MISSING',
        route: '/api/speech',
        detail: { model: providerModel },
      });
      return errorResponse('TTS_AUDIO_MISSING', 502, requestId);
    }

    const pcm = Buffer.from(audio.base64, 'base64');
    if (!pcm.length || pcm.length > MAX_TTS_PCM_BYTES) {
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
