import { checkCrisisSafety, getEmergencyResources } from './safetyGuardrailService';

export interface AiGatewayPayload {
  message: string;
  contextMessages: { role: 'user' | 'assistant'; text: string }[];
  cardSummary: string;
  timeoutMs?: number;
  mockLatencyMs?: number;
}

export interface AiGatewayResponse {
  reply: string;
  proposal?: any;
  safetyInterception?: boolean;
}

export const callAiGatewayTurn = async (payload: AiGatewayPayload): Promise<AiGatewayResponse> => {
  const safety = checkCrisisSafety(payload.message);
  if (safety.isCrisis) {
    const resources = getEmergencyResources();
    return {
      reply: `${safety.message}\nXin vui lòng liên hệ ngay: ${resources.hotline}`,
      safetyInterception: true
    };
  }

  const timeout = payload.timeoutMs ?? 20000;

  return new Promise<AiGatewayResponse>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('AI_REQUEST_TIMEOUT'));
    }, timeout);

    const latency = payload.mockLatencyMs ?? 200;
    setTimeout(() => {
      clearTimeout(timer);
      resolve({
        reply: 'Mình nghe thấy điều bạn đang băn khoăn. Giữa việc ở lại và tìm cơ hội mới, điều gì đang tạo áp lực lớn nhất cho bạn?',
        proposal: {
          decision_question: 'Tôi nên điều chỉnh ranh giới công việc hay chuẩn bị tìm việc mới?'
        }
      });
    }, latency);
  });
};
