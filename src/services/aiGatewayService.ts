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
      'Chiếc Lá nghe thấy sự nặng nề trong nhịp sống gần đây của bạn. Khi năng lượng xuống thấp, não bộ thường ép ta phải chọn thật nhanh để thoát khỏi áp lực — nhưng lúc này điều cần nhất lại là một ranh giới an toàn. Mình gợi ý thêm giới hạn bảo vệ năng lượng vào Thẻ Quyết Định bên phải nhé?';
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
      'Tiền bạc là chiếc neo an toàn rất thực tế, chứ không hề tầm thường. Thay vì chọn giữa "đam mê" hay "thu nhập", chúng ta thử tách riêng mức sàn sinh hoạt tối thiểu bạn cần giữ vững, để các lựa chọn khác nhẹ gánh hơn nhé?';
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
      'Đôi khi cảm giác mắc kẹt không đến từ việc bạn không biết mình muốn gì, mà đến từ nỗi sợ làm người thân thất vọng. Nếu tách riêng kỳ vọng bên ngoài ra một bên, điều bạn thực sự muốn giữ cho chính mình là gì?';
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
      'Nỗi sợ chọn sai thường khiến ta đứng yên rất lâu vì tưởng rằng mỗi quyết định đều là vĩnh viễn. Nhưng đa phần lựa chọn đều có thể thu nhỏ thành một bước thử 3 ngày đảo ngược được. Mình đặt sẵn 2 hướng cân nhắc vào Thẻ Quyết Định để bạn dễ nhìn hơn nhé?';
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
        'Rất tuyệt! Một bước thử nhỏ không đòi hỏi bạn phải đánh cược cả tương lai — nó chỉ giúp bạn thu về dữ liệu thật trong 1 đến 3 ngày tới. Bạn có thể xem lại Thẻ Quyết Định bên phải và bấm "Thiết kế bước thử" bất cứ lúc nào thấy sẵn sàng.',
      proposal: {
        criteria: ['Bảo toàn sức khỏe', 'Bước đi nhỏ có thể kiểm chứng ngay tuần này'],
      },
    };
  }

  // 6. Phản hồi mặc định sâu sắc & không lặp lại
  const fallbackPool: Pick<AiGatewayResponse, 'reply' | 'proposal'>[] = [
    {
      reply:
        'Mình nghe thấy điều bạn đang băn khoăn. Giữa những yếu tố đang giằng co nhau lúc này, điều gì là ranh giới bạn nhất định không muốn đánh đổi?',
      proposal: {
        decision_question: 'Tôi nên điều chỉnh ranh giới công việc hay chuẩn bị tìm hướng đi mới?',
        criteria: ['Bảo toàn sức khỏe', 'Không đánh mất sự chủ động thời gian'],
      },
    },
    {
      reply:
        'Cảm ơn bạn đã chia sẻ thật lòng. Nếu thử nhìn vấn đề này với sự dịu dàng như dành cho một người bạn thân, bạn thấy bước kiểm chứng nhỏ nào là an toàn nhất ngay lúc này?',
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
