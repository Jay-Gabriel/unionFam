import { SchemaParseResult, parseStrictAIOutput } from './schemas';
import { buildContextPayload, ContextBudgetParams } from './context';
import {
  BLUEPRINT_OPENING_QUESTION,
  buildBlueprintTurnInstruction,
  LIFE_LAB_BLUEPRINT_PROMPT,
} from './life-lab-blueprint';
import {
  buildMockResponse,
  ensureNonRepeatingQuestion,
  collectAskedQuestions,
} from './question-guard';
import { SchemaType, type ResponseSchema } from '@google/generative-ai';

export type ConversationTurnMode = 'opening' | 'message';

const GEMINI_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    responseText: {
      type: SchemaType.STRING,
      description: '2–4 câu tiếng Việt: ghi nhận cụ thể, phản chiếu có điều kiện và đúng một câu hỏi mở.',
    },
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
    experimentProposal: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: 'Tên thử nghiệm hành động vi mô' },
        hypothesis: { type: SchemaType.STRING, description: 'Giả thuyết cần kiểm chứng' },
        smallestStep: { type: SchemaType.STRING, description: 'Bước hành động nhỏ nhất có thể bắt đầu ngay' },
        successSignal: { type: SchemaType.STRING, description: 'Dấu hiệu thành công sau thử nghiệm' },
        targetDays: { type: SchemaType.INTEGER, description: 'Số ngày thực hiện thử nghiệm (mặc định 7)' },
        dimension: {
          type: SchemaType.STRING,
          enum: ['my_life', 'what_matters', 'my_ideal_day', 'what_it_takes', 'my_trade_offs', 'the_question', 'financial_life', 'other'],
        },
      },
      required: ['title', 'hypothesis', 'smallestStep', 'successSignal'],
    },
    reflectionProposal: {
      type: SchemaType.OBJECT,
      properties: {
        result: { type: SchemaType.STRING, description: 'Điều đã diễn ra sau thử nghiệm' },
        learningCandidate: { type: SchemaType.STRING, description: 'Bài học đúc kết được' },
        feeling: { type: SchemaType.STRING, description: 'Cảm xúc/trải nghiệm nhận được' },
        nextAction: { type: SchemaType.STRING, description: 'Hành động tiếp theo' },
        rating: { type: SchemaType.INTEGER, description: 'Đánh giá hữu ích 1-5' },
        experimentTitle: { type: SchemaType.STRING },
      },
      required: ['result', 'learningCandidate', 'feeling', 'nextAction'],
    },
    resourceProposal: {
      type: SchemaType.OBJECT,
      properties: {
        dimension: {
          type: SchemaType.STRING,
          enum: ['my_life', 'what_matters', 'my_ideal_day', 'what_it_takes', 'my_trade_offs', 'the_question', 'financial_life', 'other'],
        },
        resourceType: { type: SchemaType.STRING },
        name: { type: SchemaType.STRING, description: 'Tên nguồn lực hoặc kỹ năng/tài sản' },
        description: { type: SchemaType.STRING },
      },
      required: ['dimension', 'name'],
    },
    conversationState: {
      type: SchemaType.OBJECT,
      properties: {
        userSignal: { type: SchemaType.STRING },
        currentFocus: { type: SchemaType.STRING },
        answeredTopics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        newFacts: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        nextInformationNeed: { type: SchemaType.STRING },
      },
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
    allowedQuestionIds: string[] = [],
    mode: ConversationTurnMode = 'message'
  ): Promise<SchemaParseResult> {
    const contextText = buildContextPayload(contextParams);
    const semanticState = {
      answeredTopics: contextParams.answeredTopics,
      knownFacts: contextParams.knownFacts,
      currentFocus: contextParams.currentFocus,
      nextInformationNeed: contextParams.nextInformationNeed,
    };

    if (!this.apiKey || this.apiKey === 'replace_with_server_only_gemini_api_key') {
      // Deterministic Mock Provider for dev/test
      if (mode === 'opening') {
        const mockOpeningJSON = JSON.stringify({
          responseText: `Chào bạn. Mình ở đây để lắng nghe cùng bạn. ${BLUEPRINT_OPENING_QUESTION}`,
          nextStage: 'discovery',
          requiresPermission: false,
          safety: { isSafe: true },
          nextQuestionId: allowedQuestionIds[0],
          conversationState: {
            userSignal: 'neutral',
            currentFocus: 'discover_life_vision',
            nextInformationNeed: 'ideal_day_and_energy_allocation',
          },
        });
        return parseStrictAIOutput(mockOpeningJSON, allowedQuestionIds);
      }

      const lowerMsg = latestUserMessage.toLowerCase();
      const isReflectionIntent =
        lowerMsg.includes('đã làm') ||
        lowerMsg.includes('đã thử') ||
        lowerMsg.includes('thử xong') ||
        lowerMsg.includes('kết quả') ||
        lowerMsg.includes('rút ra') ||
        lowerMsg.includes('nhận ra') ||
        lowerMsg.includes('bài học') ||
        lowerMsg.includes('ngày đầu') ||
        lowerMsg.includes('ngày thứ') ||
        lowerMsg.includes('hôm nay đã') ||
        lowerMsg.includes('làm xong') ||
        lowerMsg.includes('kết thúc thử');

      const isExperimentIntent =
        !isReflectionIntent &&
        (lowerMsg.includes('thử nghiệm') ||
         lowerMsg.includes('thí nghiệm') ||
         lowerMsg.includes('đang thí nghiệm') ||
         lowerMsg.includes('đang thử') ||
         lowerMsg.includes('muốn thử') ||
         lowerMsg.includes('làm thử') ||
         lowerMsg.includes('thử làm') ||
         lowerMsg.includes('sẽ thử') ||
         lowerMsg.includes('sẽ làm') ||
         lowerMsg.includes('thực hành') ||
         lowerMsg.includes('dự định') ||
         lowerMsg.includes('bắt đầu') ||
         lowerMsg.includes('kế hoạch') ||
         lowerMsg.includes('hành động') ||
         lowerMsg.includes('bước nhỏ') ||
         lowerMsg.includes('thói quen') ||
         lowerMsg.includes('thử sức') ||
         lowerMsg.includes('test') ||
         lowerMsg.includes('thử') ||
         lowerMsg.includes('7 ngày'));

      let learningText = 'Khi bắt đầu với bước nhỏ rõ ràng, tâm trí nhẹ nhàng và tập trung hơn nhiều.';
      if (lowerMsg.includes('nhận ra')) {
        const after = latestUserMessage.slice(lowerMsg.indexOf('nhận ra') + 7).trim().replace(/^[,\s:]+/, '');
        if (after.length > 5) learningText = after.charAt(0).toUpperCase() + after.slice(1);
      } else if (lowerMsg.includes('bài học')) {
        const after = latestUserMessage.slice(lowerMsg.indexOf('bài học') + 7).trim().replace(/^[,\s:]+/, '');
        if (after.length > 5) learningText = after.charAt(0).toUpperCase() + after.slice(1);
      }

      let expTitle = 'Thử nghiệm bước nhỏ 7 ngày';
      if (lowerMsg.includes('15 phút')) {
        expTitle = 'Thử nghiệm 15 phút mỗi ngày';
      } else if (lowerMsg.includes('dậy sớm')) {
        expTitle = 'Thử nghiệm dậy sớm';
      } else if (lowerMsg.includes('chạy bộ') || lowerMsg.includes('đi bộ')) {
        expTitle = 'Thử nghiệm vận động mỗi ngày';
      } else if (lowerMsg.includes('đọc sách')) {
        expTitle = 'Thử nghiệm đọc sách 15 phút';
      } else if (lowerMsg.includes('viết nhật ký') || lowerMsg.includes('ghi chép')) {
        expTitle = 'Thử nghiệm viết nhật ký mỗi tối';
      } else if (lowerMsg.includes('thiền')) {
        expTitle = 'Thử nghiệm tĩnh tâm 10 phút';
      } else if (lowerMsg.includes('thí nghiệm') || lowerMsg.includes('thử nghiệm')) {
        expTitle = 'Thử nghiệm hành động vi mô 7 ngày';
      }

      const mockResponseText = buildMockResponse(
        latestUserMessage,
        contextParams.recentMessages,
        semanticState
      );
      const mockRawJSON = JSON.stringify({
        responseText: mockResponseText,
        nextStage: isReflectionIntent ? 'reflection' : isExperimentIntent ? 'experiment' : 'discovery',
        requiresPermission: false,
        safety: { isSafe: true },
        nextQuestionId: allowedQuestionIds[0],
        experimentProposal: isExperimentIntent ? {
          title: expTitle,
          hypothesis: 'Nếu kiên trì với bước nhỏ này trong 7 ngày, mình sẽ xây dựng được sự tự tin và nhịp điệu tích cực.',
          smallestStep: 'Chuẩn bị không gian và thực hiện đúng 15 phút đầu tiên vào ngày mai.',
          successSignal: 'Duy trì đều đặn 3 ngày liên tiếp mà không bỏ dở.',
          targetDays: 7,
          dimension: 'my_life',
        } : undefined,
        reflectionProposal: isReflectionIntent ? {
          result: 'Đã hoàn thành ngày đầu tiên và quan sát thấy kết quả rõ rệt.',
          learningCandidate: learningText,
          feeling: 'Nhẹ nhõm, tập trung và có động lực hơn.',
          nextAction: 'Tiếp tục duy trì bước nhỏ này vào ngày mai.',
          rating: 5,
        } : undefined,
        conversationState: {
          userSignal: isReflectionIntent ? 'reflection' : lowerMsg.includes('áp lực') || lowerMsg.includes('stress') || lowerMsg.includes('nghỉ việc') ? 'escape' : isExperimentIntent ? 'experiment_result' : 'desire',
          currentFocus: isReflectionIntent ? 'reflect_on_experiment' : isExperimentIntent ? 'design_experiment' : 'discover_life_vision',
          answeredTopics: ['primary_emotional_state', 'pressure_source'],
          nextInformationNeed: 'desired_life_after_pressure_removed',
        },
      });

      const mockResult = parseStrictAIOutput(mockRawJSON, allowedQuestionIds);
      if (!mockResult.success || !mockResult.data) return mockResult;
      return {
        ...mockResult,
        data: {
          ...mockResult.data,
          responseText: ensureNonRepeatingQuestion(
            mockResult.data.responseText,
            contextParams.recentMessages,
            semanticState
          ),
        },
      };
    }

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.AI_MODEL || 'gemini-flash-lite-latest',
      });

      const turnInstruction = buildBlueprintTurnInstruction(mode);
      const askedQuestions = collectAskedQuestions(contextParams.recentMessages);
      const antiRepeatInstruction = askedQuestions.length
        ? `\n\nDo not repeat or lightly paraphrase any question in ALREADY_ASKED_QUESTIONS or any topic in KNOWN_FACTS_AND_ANSWERED_TOPICS. Advance the conversation forward.`
        : '';
      const prompt = `${LIFE_LAB_BLUEPRINT_PROMPT}\n\nSYSTEM CONTEXT:\n${contextText}\n\nTURN INSTRUCTION:\n${turnInstruction}${antiRepeatInstruction}\n\n<<<CURRENT_USER_MESSAGE>>>\n${latestUserMessage.slice(0, 4000)}\n<<<END_CURRENT_USER_MESSAGE>>>\n\nReturn ONLY one JSON object with these field names: responseText (string), nextStage (one of onboarding/discovery/clarify/permission/synthesis/design/experiment/reflection/completed), requiresPermission (boolean), safety ({isSafe:boolean}), optional nextQuestionId (only from allowlist), optional observationProposal ({dimension, observationType, contentOriginal, confidence}), optional experimentProposal ({title, hypothesis, smallestStep, successSignal, targetDays, dimension}), optional reflectionProposal ({result, learningCandidate, feeling, nextAction, rating, experimentTitle}), optional resourceProposal ({dimension, resourceType, name, description}), and optional conversationState ({userSignal, currentFocus, answeredTopics, newFacts, nextInformationNeed}). Do not use aliases such as reflection, question, answer, or assistant_message. Use only a nextQuestionId from this allowlist: ${JSON.stringify(allowedQuestionIds)}. For the opening turn, responseText must contain the exact canonical opening question, all proposal fields must be omitted, and requiresPermission must be false. For a regular turn, responseText must contain 2–4 natural Vietnamese sentences, no canned phrases, and at most one open progression question.`;
      const timeoutMs = Math.max(3000, Number(process.env.AI_TIMEOUT_MS || 15000));
      const result = await withTimeout(model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: GEMINI_RESPONSE_SCHEMA,
          temperature: 0.5,
          maxOutputTokens: 1600,
        },
      }), timeoutMs);
      const text = result.response.text();
      const firstAttempt = parseStrictAIOutput(text, allowedQuestionIds);
      if (firstAttempt.success && firstAttempt.data) {
        return {
          ...firstAttempt,
          data: {
            ...firstAttempt.data,
            responseText:
              mode === 'opening'
                ? firstAttempt.data.responseText
                : ensureNonRepeatingQuestion(
                    firstAttempt.data.responseText,
                    contextParams.recentMessages,
                    semanticState
                  ),
          },
        };
      }

      // One bounded repair attempt: remove markdown fences or surrounding prose
      // without sending the invalid provider payload back to the browser.
      const repaired = extractJSONObject(text);
      if (repaired && repaired !== text) {
        const repairedAttempt = parseStrictAIOutput(repaired, allowedQuestionIds);
        if (repairedAttempt.success && repairedAttempt.data) {
          return {
            ...repairedAttempt,
            data: {
              ...repairedAttempt.data,
              responseText:
                mode === 'opening'
                  ? repairedAttempt.data.responseText
                  : ensureNonRepeatingQuestion(
                      repairedAttempt.data.responseText,
                      contextParams.recentMessages,
                      semanticState
                    ),
            },
          };
        }
        return repairedAttempt;
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
