const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export const MAX_SCRIPT_CHARS = 60_000;

export type ScriptSourceType = 'manual' | 'txt' | 'md' | 'docx';

export class ScriptFileError extends Error {
  code: 'FILE_TOO_LARGE' | 'UNSUPPORTED_FILE_TYPE' | 'EMPTY_FILE' | 'CONTENT_TOO_LONG';

  constructor(code: ScriptFileError['code'], message: string) {
    super(message);
    this.name = 'ScriptFileError';
    this.code = code;
  }
}

export function sourceTypeFromFilename(filename: string): Exclude<ScriptSourceType, 'manual'> {
  const extension = filename.toLowerCase().split('.').pop() || '';
  if (extension === 'docx') return 'docx';
  if (extension === 'md' || extension === 'markdown') return 'md';
  if (extension === 'txt') return 'txt';
  throw new ScriptFileError('UNSUPPORTED_FILE_TYPE', 'Chỉ hỗ trợ tệp .docx, .txt hoặc .md.');
}

export function normaliseScriptContent(raw: string): string {
  const normalised = raw
    .replace(/\u0000/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .trim();

  if (!normalised) throw new ScriptFileError('EMPTY_FILE', 'Nội dung kịch bản không được để trống.');
  if (normalised.length > MAX_SCRIPT_CHARS) {
    throw new ScriptFileError('CONTENT_TOO_LONG', `Kịch bản tối đa ${MAX_SCRIPT_CHARS.toLocaleString('vi-VN')} ký tự.`);
  }
  return normalised;
}

export async function extractScriptFile(file: File): Promise<{
  content: string;
  sourceType: Exclude<ScriptSourceType, 'manual'>;
  filename: string;
}> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ScriptFileError('FILE_TOO_LARGE', 'Tệp tải lên tối đa 2 MB.');
  }

  const filename = file.name || 'uploaded-script';
  const sourceType = sourceTypeFromFilename(filename);
  const bytes = await file.arrayBuffer();

  if (sourceType === 'docx') {
    // Mammoth extracts document text without executing embedded macros or
    // returning HTML, which keeps the editorial context plain and bounded.
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return { content: normaliseScriptContent(result.value), sourceType, filename };
  }

  const decoder = new TextDecoder('utf-8', { fatal: false });
  return { content: normaliseScriptContent(decoder.decode(bytes)), sourceType, filename };
}

export function isValidScriptKey(value: string) {
  return /^[a-z0-9][a-z0-9_-]{1,80}$/.test(value);
}
