import { NextResponse } from 'next/server';
import { requireUser } from '@/server/auth/current-user';
import {
  MAX_TTS_TEXT_LENGTH,
  readTtsText,
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

function providerStreamResponse(providerBody: ReadableStream<Uint8Array>, requestId: string) {
  return new Response(providerBody, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'X-Request-Id': requestId,
    },
  });
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  let userId: string | undefined;
  let cleanupProviderRequest: (() => void) | undefined;

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
    const onClientAbort = () => controller.abort();
    request.signal.addEventListener('abort', onClientAbort, { once: true });
    cleanupProviderRequest = () => {
      clearTimeout(timeout);
      request.signal.removeEventListener('abort', onClientAbort);
    };

    const models = [TTS_MODEL, TTS_FALLBACK_MODEL];
    let providerResponse: Response | null = null;
    let providerModel = TTS_MODEL;
    try {
      for (const model of models) {
        providerModel = model;
        providerResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,
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
    } catch (error) {
      cleanupProviderRequest();
      cleanupProviderRequest = undefined;
      throw error;
    }

    if (!providerResponse) throw new Error('TTS_PROVIDER_UNAVAILABLE');
    if (!providerResponse.ok || !providerResponse.body) {
      const rateLimited = providerResponse.status === 429;
      const errorCode = !providerResponse.body && providerResponse.ok
        ? 'TTS_STREAM_UNAVAILABLE'
        : rateLimited
          ? 'TTS_RATE_LIMITED'
          : 'TTS_PROVIDER_UNAVAILABLE';
      cleanupProviderRequest();
      cleanupProviderRequest = undefined;
      await recordApplicationError({
        requestId,
        userId,
        errorCode,
        route: '/api/speech/stream',
        detail: {
          provider_status: providerResponse.status,
          model: providerModel,
          fallback_used: providerModel !== TTS_MODEL,
        },
      });
      console.error(
        'TTS streaming provider request failed',
        providerResponse.status,
        providerResponse.body ? providerModel : 'missing_body'
      );
      return errorResponse(errorCode, rateLimited ? 429 : 502, requestId);
    }

    // Proxy the provider bytes without buffering them in the Next.js route.
    // The wrapper keeps the timeout and client-abort listener alive for the
    // entire stream, then releases both when the reader finishes or cancels.
    const providerReader = providerResponse.body.getReader();
    const stream = new ReadableStream<Uint8Array>({
      async pull(streamController) {
        try {
          const { done, value } = await providerReader.read();
          if (done) {
            cleanupProviderRequest?.();
            cleanupProviderRequest = undefined;
            streamController.close();
            providerReader.releaseLock();
            return;
          }
          if (value) streamController.enqueue(value);
        } catch (error) {
          cleanupProviderRequest?.();
          cleanupProviderRequest = undefined;
          providerReader.releaseLock();
          streamController.error(error);
        }
      },
      cancel() {
        cleanupProviderRequest?.();
        cleanupProviderRequest = undefined;
        void providerReader.cancel().catch(() => undefined);
      },
    });

    return providerStreamResponse(stream, requestId);
  } catch (error) {
    cleanupProviderRequest?.();
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
        route: '/api/speech/stream',
      });
      console.error('TTS streaming request failed', error instanceof Error ? error.name : 'UnknownError');
    }

    return errorResponse(errorCode, errorCode === 'AUTH_REQUIRED' ? 401 : 503, requestId);
  }
}
