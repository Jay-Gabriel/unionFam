import { SchemaParseResult, parseStrictAIOutput } from './schemas';
import { buildContextPayload, ContextBudgetParams } from './context';

export class GeminiConversationProvider {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
  }

  async generateResponse(
    contextParams: ContextBudgetParams,
    latestUserMessage: string,
    allowedQuestionIds: string[] = []
  ): Promise<SchemaParseResult> {
    const contextText = buildContextPayload(contextParams);

    if (!this.apiKey || this.apiKey === 'replace_with_server_only_gemini_api_key') {
      // Deterministic Mock Provider for dev/test
      const mockRawJSON = JSON.stringify({
        responseText: `Life Lab lắng nghe chia sẻ của bạn: "${latestUserMessage}". Bạn có muốn trích xuất nhận thức này thành mục tiêu trên Life Design Map?`,
        nextStage: 'discovery',
        requiresPermission: true,
        safety: { isSafe: true },
        nextQuestionId: allowedQuestionIds[0],
        observationProposal: {
          dimension: 'what_matters',
          observationType: 'insight_candidate',
          contentOriginal: `Tự do thời gian và chiều sâu cuộc sống là ưu tiên bạn đang quan tâm: "${latestUserMessage}".`,
          confidence: 0.9,
        },
      });

      return parseStrictAIOutput(mockRawJSON, allowedQuestionIds);
    }

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.AI_MODEL || 'gemini-1.5-flash',
      });

      const prompt = `System Context:\n${contextText}\n\n<<<CURRENT_USER_MESSAGE>>>\n${latestUserMessage.slice(0, 4000)}\n<<<END_CURRENT_USER_MESSAGE>>>\n\nRespond ONLY with one JSON object conforming strictly to AIStructuredOutputSchema. Use only a nextQuestionId from this allowlist: ${JSON.stringify(allowedQuestionIds)}.`;
      const timeoutMs = Math.max(3000, Number(process.env.AI_TIMEOUT_MS || 15000));
      const result = await withTimeout(model.generateContent(prompt), timeoutMs);
      const text = result.response.text();
      const firstAttempt = parseStrictAIOutput(text, allowedQuestionIds);
      if (firstAttempt.success) return firstAttempt;

      // One bounded repair attempt: remove markdown fences or surrounding prose
      // without sending the invalid provider payload back to the browser.
      const repaired = extractJSONObject(text);
      if (repaired && repaired !== text) {
        return parseStrictAIOutput(repaired, allowedQuestionIds);
      }
      return firstAttempt;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '';
      return {
        success: false,
        errorCode: errorMessage === 'AI_PROVIDER_TIMEOUT' ? 'AI_PROVIDER_TIMEOUT' : 'AI_PROVIDER_UNAVAILABLE',
        errorMessage: 'AI provider không phản hồi. Bạn có thể thử lại sau.',
      };
    }
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('AI_PROVIDER_TIMEOUT')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function extractJSONObject(raw: string) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const candidate = (fenced || raw).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  return candidate.slice(start, end + 1);
}
