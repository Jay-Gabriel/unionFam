import { SchemaParseResult, parseStrictAIOutput } from './schemas';
import { buildContextPayload, ContextBudgetParams } from './context';
import { SchemaType, type ResponseSchema } from '@google/generative-ai';

const GEMINI_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    responseText: { type: SchemaType.STRING, description: 'Phản hồi phản chiếu bằng tiếng Việt.' },
    nextStage: {
      type: SchemaType.STRING,
      enum: ['onboarding', 'discovery', 'clarify', 'permission', 'synthesis', 'design', 'experiment', 'reflection', 'completed'],
    },
    requiresPermission: { type: SchemaType.BOOLEAN },
    safety: {
      type: SchemaType.OBJECT,
      properties: {
        isSafe: { type: SchemaType.BOOLEAN },
        safetyFlag: { type: SchemaType.STRING },
        userMessage: { type: SchemaType.STRING },
      },
      required: ['isSafe'],
    },
    nextQuestionId: { type: SchemaType.STRING },
    observationProposal: {
      type: SchemaType.OBJECT,
      properties: {
        dimension: {
          type: SchemaType.STRING,
          enum: ['my_life', 'what_matters', 'my_ideal_day', 'what_it_takes', 'my_trade_offs', 'the_question', 'financial_life', 'other'],
        },
        observationType: { type: SchemaType.STRING },
        contentOriginal: { type: SchemaType.STRING },
        confidence: { type: SchemaType.NUMBER },
        evidenceMessageIds: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
      required: ['dimension', 'contentOriginal'],
    },
  },
  required: ['responseText', 'nextStage', 'requiresPermission', 'safety'],
};

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
        model: process.env.AI_MODEL || 'gemini-flash-lite-latest',
      });

      const prompt = `System Context:\n${contextText}\n\n<<<CURRENT_USER_MESSAGE>>>\n${latestUserMessage.slice(0, 4000)}\n<<<END_CURRENT_USER_MESSAGE>>>\n\nReturn ONLY one JSON object with exactly these field names: responseText (string), nextStage (one of onboarding/discovery/clarify/permission/synthesis/design/experiment/reflection/completed), requiresPermission (boolean), safety ({isSafe:boolean}), optional nextQuestionId (only from the allowlist), and optional observationProposal ({dimension, observationType, contentOriginal, confidence, evidenceMessageIds}). Do not use aliases such as reflection, question, answer, or assistant_message. Use only a nextQuestionId from this allowlist: ${JSON.stringify(allowedQuestionIds)}. If no question or observation is needed, omit those optional fields.`;
      const timeoutMs = Math.max(3000, Number(process.env.AI_TIMEOUT_MS || 15000));
      const result = await withTimeout(model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: GEMINI_RESPONSE_SCHEMA,
          temperature: 0.5,
          maxOutputTokens: 1400,
        },
      }), timeoutMs);
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
