export const MAX_TTS_TEXT_LENGTH = 3_000;
export const MAX_TTS_PCM_BYTES = 10 * 1024 * 1024;
export const TTS_MODEL = 'gemini-3.1-flash-tts-preview';
// The preview 3.1 model can have a tighter per-minute quota on free projects.
// Keep the same voice and prompt on this compatible fallback so a second
// consecutive message does not silently lose its audio.
export const TTS_FALLBACK_MODEL = 'gemini-2.5-flash-preview-tts';
export const TTS_VOICE = 'Sulafat';
export const TTS_TIMEOUT_MS = 20_000;

type GeminiPart = {
  inlineData?: {
    data?: unknown;
    mimeType?: unknown;
  };
};

export function readTtsText(body: unknown) {
  if (!body || typeof body !== 'object' || !('text' in body)) return '';
  const value = (body as { text?: unknown }).text;
  return typeof value === 'string' ? value.trim() : '';
}

export function ttsPrompt(text: string) {
  // Keep the direction compact: TTS latency grows noticeably with a long
  // director prompt, while the fixed warm voice already provides the main
  // character. The tag nudges delivery without making the model read an
  // instruction-heavy preamble.
  return `[warm, gentle female voice, calm slightly brisk pace, short pauses]\n${text}`;
}

export function ttsRequestBody(text: string) {
  return {
    contents: [{ parts: [{ text: ttsPrompt(text) }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        languageCode: 'vi-VN',
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: TTS_VOICE },
        },
      },
    },
  };
}

export function extractAudio(payload: unknown) {
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

export function sampleRateFromMimeType(mimeType: string) {
  const match = mimeType.match(/(?:rate|samplerate)\s*=\s*(\d+)/i);
  const parsed = match ? Number(match[1]) : 24_000;
  return Number.isFinite(parsed) ? parsed : 24_000;
}
