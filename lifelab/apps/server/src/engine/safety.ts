/**
 * Safety handlers — Life Lab V8.7.2.
 * Ma trận Safety và User Stop (Phần 2 + Phần 4):
 *  - S0-S1 + stop → CLOSE ngay (không ghi đè stop).
 *  - S2 + stop → tối đa 1 câu safety → CLOSE.
 *  - S2 (không stop) → hỏi tối đa 1 câu nguy cơ tức thời; tạm dừng Life Design & Memory.
 *  - S3 → 1 thông điệp khẩn cấp ngắn → CLOSE.
 *  - USER_STOP → CLOSE, không feedback/memory/câu hỏi (trừ ngoại lệ S2/S3).
 */
import type { ClassifierOutput, SafetyResponse } from '@lifelab/contract';
import { getSafetyResources, hasConfiguredResources } from './safetyResources.js';

export interface SafetyDecision {
  nextState: 'CRISIS_SAFETY' | 'HIGH_STAKES_BOUNDARY' | 'RELATIONAL_BOUNDARY' | 'CLOSE' | null;
  safetyResponse: SafetyResponse | null;
  close: boolean;
  /** Nếu true: cấm mọi câu hỏi khác, feedback, memory. */
  blockLifeDesign: boolean;
  /** S2 đã dùng 1 câu safety trong phiên chưa (để không hỏi quá 1). */
  askedSafetyQuestion?: boolean;
}

const URGENT_MESSAGE =
  'Mình thực sự lo cho sự an toàn của bạn ngay lúc này. Nếu bạn đang gặp nguy hiểm, ' +
  'hãy liên hệ dịch vụ khẩn cấp hoặc một người ở gần bạn ngay bây giờ. Bạn không phải ở một mình với điều này.';

const S2_SAFETY_QUESTION =
  'Trước khi tiếp tục, mình muốn hỏi thẳng một điều: ngay lúc này bạn có đang nghĩ đến việc ' +
  'làm hại bản thân hoặc có ý định cụ thể nào không?';

/**
 * Quyết định Safety dựa trên classifier + trạng thái phiên.
 * @param alreadyAskedS2 phiên đã hỏi câu safety S2 chưa.
 */
export function decideSafety(
  signals: ClassifierOutput,
  opts: { userStop: boolean; alreadyAskedS2: boolean },
): SafetyDecision {
  const { userStop, alreadyAskedS2 } = opts;
  const level = signals.crisis.level;

  // S3: luôn ưu tiên — urgent short + CLOSE (kể cả có stop).
  if (level === 'S3') {
    return {
      nextState: 'CLOSE',
      safetyResponse: {
        flow: 'CRISIS_SAFETY',
        level: 'S3',
        message: URGENT_MESSAGE,
        resources: getSafetyResources(),
      },
      close: true,
      blockLifeDesign: true,
    };
  }

  // S2: tối đa 1 câu safety. Nếu đã hỏi rồi, hoặc user stop sau khi hỏi → CLOSE.
  if (level === 'S2') {
    if (userStop) {
      // S2 + stop: được 1 câu safety nếu chưa hỏi, rồi CLOSE.
      if (!alreadyAskedS2) {
        return {
          nextState: 'CRISIS_SAFETY',
          safetyResponse: { flow: 'CRISIS_SAFETY', level: 'S2', message: S2_SAFETY_QUESTION, resources: getSafetyResources() },
          close: false,
          blockLifeDesign: true,
          askedSafetyQuestion: true,
        };
      }
      return {
        nextState: 'CLOSE',
        safetyResponse: { flow: 'CRISIS_SAFETY', level: 'S2', message: 'Mình tôn trọng mong muốn dừng của bạn. Hãy giữ an toàn cho mình nhé.', resources: getSafetyResources() },
        close: true,
        blockLifeDesign: true,
      };
    }
    // S2 không stop: hỏi tối đa 1 câu; nếu đã hỏi → CLOSE (không kéo dài).
    if (alreadyAskedS2) {
      return {
        nextState: 'CLOSE',
        safetyResponse: { flow: 'CRISIS_SAFETY', level: 'S2', message: URGENT_MESSAGE, resources: getSafetyResources() },
        close: true,
        blockLifeDesign: true,
      };
    }
    return {
      nextState: 'CRISIS_SAFETY',
      safetyResponse: { flow: 'CRISIS_SAFETY', level: 'S2', message: S2_SAFETY_QUESTION, resources: getSafetyResources() },
      close: false,
      blockLifeDesign: true,
      askedSafetyQuestion: true,
    };
  }

  // S0-S1 + stop → CLOSE ngay, không ghi đè stop.
  if (userStop) {
    return {
      nextState: 'CLOSE',
      safetyResponse: null,
      close: true,
      blockLifeDesign: true,
    };
  }

  // S1 không stop: giảm áp lực, cho phép tiếp tục luồng bình thường (không block).
  return { nextState: null, safetyResponse: null, close: false, blockLifeDesign: false };
}

export function highStakesResponse(domain: string | null): SafetyResponse {
  const msg =
    'Đây là một quyết định quan trọng và nhạy cảm. Mình không thể chẩn đoán, đảm bảo kết quả ' +
    'hay quyết định thay bạn. Nhưng mình có thể giúp bạn tách dữ kiện khỏi giả định, làm rõ điều ' +
    'bạn đang cân nhắc, và chuẩn bị những câu hỏi để hỏi một chuyên gia phù hợp. Bạn muốn bắt đầu từ đâu?';
  return { flow: 'HIGH_STAKES_BOUNDARY', level: 'S0', message: msg };
}

export function relationalResponse(): SafetyResponse {
  const msg =
    'Cảm ơn bạn đã tin tưởng chia sẻ. Mình ở đây để giúp bạn phản tư, nhưng mình không nên là ' +
    'nguồn hỗ trợ duy nhất của bạn. Có một người thật nào bạn muốn kết nối hoặc trò chuyện cùng không?';
  return { flow: 'RELATIONAL_BOUNDARY', level: 'S0', message: msg };
}

export { hasConfiguredResources };
