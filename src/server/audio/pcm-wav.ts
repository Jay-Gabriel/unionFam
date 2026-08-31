const WAV_HEADER_BYTES = 44;
const PCM_FORMAT = 1;
const DEFAULT_CHANNELS = 1;
const DEFAULT_SAMPLE_RATE = 24_000;
const DEFAULT_SAMPLE_WIDTH = 2;

function safeSampleRate(sampleRate: number) {
  return Number.isFinite(sampleRate) && sampleRate >= 8_000 && sampleRate <= 96_000
    ? Math.round(sampleRate)
    : DEFAULT_SAMPLE_RATE;
}

/**
 * Gemini TTS returns raw signed 16-bit little-endian PCM. Browsers can play
 * the same bytes reliably once they are wrapped in a small RIFF/WAVE header.
 */
export function pcmToWav(
  pcm: Uint8Array,
  sampleRate = DEFAULT_SAMPLE_RATE,
  channels = DEFAULT_CHANNELS,
  sampleWidth = DEFAULT_SAMPLE_WIDTH
) {
  const normalizedSampleRate = safeSampleRate(sampleRate);
  const normalizedChannels = channels > 0 && channels <= 2 ? Math.round(channels) : DEFAULT_CHANNELS;
  const normalizedSampleWidth = sampleWidth === 2 ? sampleWidth : DEFAULT_SAMPLE_WIDTH;
  const blockAlign = normalizedChannels * normalizedSampleWidth;
  const byteRate = normalizedSampleRate * blockAlign;
  const header = Buffer.alloc(WAV_HEADER_BYTES);

  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + pcm.byteLength, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(PCM_FORMAT, 20);
  header.writeUInt16LE(normalizedChannels, 22);
  header.writeUInt32LE(normalizedSampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(normalizedSampleWidth * 8, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(pcm.byteLength, 40);

  return Buffer.concat([header, Buffer.from(pcm)]);
}
