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
        nextStage: 'ideal_day_exploration',
        requiresPermission: true,
        safety: { isSafe: true },
        observationProposal: {
          dimension: 'what_matters',
          observationType: 'insight_candidate',
          contentOriginal: `Tự do thời gian và chiều sâu cuộc sống là ưu tiên cao nhất của bạn đối me: "${latestUserMessage}".`,
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

      const prompt = `System Context:\n${contextText}\n\nUser Message: ${latestUserMessage}\n\nRespond ONLY with a JSON object conforming strictly to AIStructuredOutputSchema.`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return parseStrictAIOutput(text, allowedQuestionIds);
    } catch (error) {
      return {
        success: false,
        errorCode: 'AI_SCHEMA_INVALID',
        errorMessage: error instanceof Error ? error.message : 'AI Provider unavailable',
      };
    }
  }
}
