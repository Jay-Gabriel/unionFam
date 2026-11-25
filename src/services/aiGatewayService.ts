import { checkCrisisSafety, getEmergencyResources } from './safetyGuardrailService';
import { DecisionCardRecord } from '../types/decisionJourney';

export interface AiGatewayPayload {
  message: string;
  contextMessages: { role: 'user' | 'assistant'; text: string }[];
  cardSummary: string;
  timeoutMs?: number;
  mockLatencyMs?: number;
}

export interface AiGatewayResponse {
  reply: string;
  proposal?: Partial<DecisionCardRecord>;
  safetyInterception?: boolean;
}

function buildReflectiveResponse(
  message: string,
  contextMessages: { role: 'user' | 'assistant'; text: string }[],
): Pick<AiGatewayResponse, 'reply' | 'proposal'> {
  const lower = message.toLowerCase();
  const previousReplies = new Set(
    contextMessages.filter((m) => m.role === 'assistant').map((m) => m.text),
  );

  // 1. Mệt mỏi / kiệt sức / quá tải
  if (
    lower.includes('mệt') ||
    lower.includes('kiệt sức') ||
    lower.includes('năng lượng') ||
    lower.includes('quá tải') ||
    lower.includes('áp lực')
  ) {
    const reply =
      'Chiếc Lá nghe thấy bạn đang hơi chùng xuống vì mệt. Khi mỏi mệt, mình không cần vội chọn ngay đâu — giữ cho bản thân một khoảng thở an toàn trước đã. Nếu thấy hợp lý, bạn thử xem hai gợi ý nhỏ bên Thẻ Quyết Định nhé.';
    if (!previousReplies.has(reply)) {
      return {
        reply,
        proposal: {
          criteria: ['Bảo toàn sức khỏe tinh thần', 'Có khoảng nghỉ phục hồi mỗi ngày'],
          hard_constraints: ['Không nhận thêm việc ngoài giờ gây kiệt sức'],
        },
      };
    }
  }

  // 2. Tài chính / tiền bạc / thu nhập
  if (
    lower.includes('tiền') ||
    lower.includes('lương') ||
    lower.includes('thu nhập') ||
    lower.includes('tài chính')
  ) {
    const reply =
      'Nỗi lo cơm áo là điểm tựa rất thật lòng, mình hiểu mà. Ta có thể ghi nhẹ ra mức thu nhập tối thiểu để bạn thấy yên tâm trước, rồi mọi phương án khác sẽ bớt nặng nề hơn một chút.';
    if (!previousReplies.has(reply)) {
      return {
        reply,
        proposal: {
          hard_constraints: ['Đảm bảo thu nhập tối thiểu chi trả sinh hoạt gia đình'],
          criteria: ['Bảo toàn sức khỏe', 'Thu nhập ổn định đủ mức sàn an toàn'],
        },
      };
    }
  }

  // 3. Gia đình / kỳ vọng / ranh giới
  if (
    lower.includes('gia đình') ||
    lower.includes('bố mẹ') ||
    lower.includes('kỳ vọng') ||
    lower.includes('người khác')
  ) {
    const reply =
      'Có những lúc mình chững lại không phải vì thiếu hướng đi, mà vì sợ làm người thương buồn lòng. Nếu tạm gác kỳ vọng bên ngoài sang một góc nhỏ, điều bạn muốn giữ cho mình lúc này là gì nhỉ?';
    if (!previousReplies.has(reply)) {
      return {
        reply,
        proposal: {
          criteria: ['Sống đúng với giá trị tự chủ của bản thân', 'Giữ đối thoại tôn trọng với gia đình'],
          uncertainties: [
            {
              id: `unc_${Date.now()}`,
              question: 'Phản ứng thật sự của gia đình nếu mình chia sẻ thẳng thắn giới hạn cá nhân?',
            },
          ],
        },
      };
    }
  }

  // 4. Rối bời / sợ chọn sai / hối tiếc
  if (
    lower.includes('rối') ||
    lower.includes('sợ') ||
    lower.includes('chọn sai') ||
    lower.includes('phân vân')
  ) {
    const reply =
      'Sợ chọn sai là cảm giác rất tự nhiên thôi bạn à. Đa phần mọi ngã rẽ đều có thể thu nhỏ lại thành một bước thử 3 ngày nhẹ nhàng và quay đầu được. Mình đặt thử 2 hướng nhẹ vào Thẻ Quyết Định để bạn ngắm xem sao nhé.';
    if (!previousReplies.has(reply)) {
      return {
        reply,
        proposal: {
          decision_question: 'Mình nên điều chỉnh ranh giới hiện tại hay chuẩn bị phương án chuyển hướng?',
          options: [
            {
              id: 'opt_adjust',
              name: 'Ở lại và thử thương lượng lại ranh giới công việc',
              description: 'Kiểm chứng trong 3 ngày xem môi trường có cải thiện không',
            },
            {
              id: 'opt_prepare',
              name: 'Giữ nhịp ổn định và âm thầm chuẩn bị bước chuyển mới',
              description: 'Tích lũy quỹ dự phòng và kết nối cơ hội phù hợp',
            },
          ],
        },
      };
    }
  }

  // 5. Muốn thử nhỏ / hành động
  if (lower.includes('thử') || lower.includes('bước nhỏ') || lower.includes('hành động')) {
    return {
      reply:
        'Nghe thật nhẹ nhõm. Một bước thử nhỏ không bắt bạn phải đánh cược điều gì lớn lao, chỉ để xem cảm giác của mình trong vài ngày tới ra sao thôi. Khi nào thấy vừa ý với Thẻ Quyết Định, bạn chạm "Thiết kế bước thử" nhé.',
      proposal: {
        criteria: ['Bảo toàn sức khỏe', 'Bước đi nhỏ có thể kiểm chứng ngay tuần này'],
      },
    };
  }

  // 6. Phản hồi mặc định sâu sắc & không lặp lại
  const fallbackPool: Pick<AiGatewayResponse, 'reply' | 'proposal'>[] = [
    {
      reply:
        'Chiếc Lá nghe thấy điều bạn đang nâng lên đặt xuống. Giữa những vướng bận này, có ranh giới nhỏ nào bạn muốn giữ bình yên cho riêng mình nhất không?',
      proposal: {
        decision_question: 'Tôi nên điều chỉnh ranh giới công việc hay chuẩn bị tìm hướng đi mới?',
        criteria: ['Bảo toàn sức khỏe', 'Không đánh mất sự chủ động thời gian'],
      },
    },
    {
      reply:
        'Cảm ơn bạn đã sẻ chia chậm rãi như vậy. Nếu đối xử với chính mình dịu dàng như với một người bạn thân, bạn thấy bước nhỏ nào đang vừa sức nhất lúc này?',
      proposal: {
        options: [
          {
            id: 'opt_pause',
            name: 'Thử điều chỉnh nhịp độ trong 3 ngày tới',
            description: 'Quan sát mức năng lượng trước khi đưa ra quyết định lớn',
          },
        ],
      },
    },
  ];

  return fallbackPool.find((item) => !previousReplies.has(item.reply)) || fallbackPool[0];
}

export const callAiGatewayTurn = async (payload: AiGatewayPayload): Promise<AiGatewayResponse> => {
  const safety = checkCrisisSafety(payload.message);
  if (safety.isCrisis) {
    const resources = getEmergencyResources();
    return {
      reply: `${safety.message}\nXin vui lòng liên hệ ngay: ${resources.hotline}`,
      safetyInterception: true,
    };
  }

  const timeout = payload.timeoutMs ?? 20000;

  return new Promise<AiGatewayResponse>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('AI_REQUEST_TIMEOUT'));
    }, timeout);

    const latency = payload.mockLatencyMs ?? 260;
    setTimeout(() => {
      clearTimeout(timer);
      const reflected = buildReflectiveResponse(payload.message, payload.contextMessages);
      resolve(reflected);
    }, latency);
  });
};
