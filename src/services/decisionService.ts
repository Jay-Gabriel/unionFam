import { DecisionCardData, GranularMemoryPermissions } from '../types/decisionCard';
import { saveMemoryToCloud } from './supabaseService';
import { createExperimentFromSession } from './experimentService';

const LOCAL_DECISION_CARD_KEY = 'unionfam_active_decision_card';

export const DEFAULT_DECISION_CARD: DecisionCardData = {
  id: 'dec_default_01',
  version: 1,
  status: 'DRAFT',
  title: 'Bản Nháp Quyết Định',
  decisionQuestion: 'Công việc hiện tại có thể thay đổi đủ để tôi tiếp tục hay không?',
  criteria: [
    'Giữ mức thu nhập hiện tại',
    'Có ít nhất 3 buổi tối cho gia đình và bản thân',
    'Môi trường tôn trọng ranh giới giờ làm việc',
  ],
  hardConstraints: [
    'Không làm trên 50 giờ/tuần kéo dài',
    'Không nhận thêm việc đột xuất sau 20h nếu không có thỏa thuận trước',
  ],
  options: [
    {
      id: 'opt_1',
      name: 'Thương lượng lại công việc',
      description: 'Đề xuất phân bổ lại đầu việc và thống nhất ranh giới thời gian với quản lý.',
    },
    {
      id: 'opt_2',
      name: 'Tìm việc song song',
      description: 'Bắt đầu rà soát cơ hội mới trong khi vẫn duy trì công việc hiện tại.',
    },
    {
      id: 'opt_3',
      name: 'Thử giới hạn trong 7 ngày',
      description: 'Giữ nghiêm ngặt giờ nghỉ và quan sát phản ứng thực tế trước khi đưa ra quyết định lớn.',
    },
  ],
  uncertainties: [
    {
      id: 'unc_1',
      question: 'Công ty có thực sự giảm khối lượng công việc khi tôi phản ánh không?',
      verificationMethod: 'Hỏi trực tiếp người phụ trách về thứ tự ưu tiên khi nhận 2 việc mới.',
      stopRule: 'Nếu sau 2 tuần vẫn không có thay đổi, chuyển sang phương án 2.',
    },
  ],
  experiment: {
    learningQuestion: 'Khi tôi chủ động hỏi thứ tự ưu tiên, phản ứng của nhóm ra sao?',
    action: 'Với 2 việc mới giao, hỏi việc nào cần lùi lại để đảm bảo chất lượng.',
    durationDays: 7,
    observations: 'Ghi lại cảm giác bản thân và phản hồi của đồng nghiệp trong 3 ngày đầu.',
  },
  reviewDate: '27/10/2026',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Lấy Decision Card đang hoạt động
 */
export function getActiveDecisionCard(): DecisionCardData {
  try {
    const raw = localStorage.getItem(LOCAL_DECISION_CARD_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.decisionQuestion) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading active decision card:', e);
  }
  return DEFAULT_DECISION_CARD;
}

/**
 * Lưu Decision Card vào LocalStorage
 */
export function saveActiveDecisionCard(card: DecisionCardData): void {
  try {
    const payload: DecisionCardData = {
      ...card,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_DECISION_CARD_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('Error saving decision card:', e);
  }
}

/**
 * Cập nhật một trường cụ thể của Decision Card
 */
export function updateDecisionCardField<K extends keyof DecisionCardData>(
  field: K,
  value: DecisionCardData[K]
): DecisionCardData {
  const current = getActiveDecisionCard();
  const updated: DecisionCardData = {
    ...current,
    [field]: value,
    status: 'USER_REVIEW',
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
  };
  saveActiveDecisionCard(updated);
  return updated;
}

/**
 * Xử lý lưu Granular Memory theo quyền người dùng cấp
 */
export async function saveDecisionCardWithPermissions(
  card: DecisionCardData,
  perms: GranularMemoryPermissions
): Promise<{
  savedFields: string[];
  omittedFields: string[];
}> {
  const savedFields: string[] = [];
  const omittedFields: string[] = [];

  if (perms.noMemory) {
    omittedFields.push('Toàn bộ thông tin (Người dùng chọn Không lưu gì)');
    return { savedFields, omittedFields };
  }

  // 1. Quyết định đang mở
  if (perms.openDecision) {
    savedFields.push('Quyết định đang mở');
    await saveMemoryToCloud({
      id: `dec_q_${Date.now()}`,
      category: 'core_value',
      title: 'Quyết Định Đang Mở',
      reflection: card.decisionQuestion,
      date: new Date().toLocaleDateString('vi-VN'),
    });
  } else {
    omittedFields.push('Quyết định đang mở');
  }

  // 2. Tiêu chí và giới hạn
  if (perms.criteriaAndLimits) {
    savedFields.push('Tiêu chí & Giới hạn');
    const criteriaText = card.criteria.map(c => `• ${c}`).join('\n');
    const limitsText = card.hardConstraints.map(l => `• ${l}`).join('\n');
    await saveMemoryToCloud({
      id: `dec_crit_${Date.now()}`,
      category: 'boundary',
      title: 'Tiêu Chí & Giới Hạn Quyết Định',
      reflection: `Tiêu chí:\n${criteriaText}\n\nGiới hạn:\n${limitsText}`,
      date: new Date().toLocaleDateString('vi-VN'),
    });
  } else {
    omittedFields.push('Tiêu chí & Giới hạn');
  }

  // 3. Điều còn chưa biết
  if (perms.uncertainties) {
    savedFields.push('Điều còn chưa biết');
    const uncText = card.uncertainties.map(u => `• ${u.question} (Kiểm chứng: ${u.verificationMethod || 'Chưa định nghĩa'})`).join('\n');
    await saveMemoryToCloud({
      id: `dec_unc_${Date.now()}`,
      category: 'insight',
      title: 'Điều Còn Chưa Biết',
      reflection: uncText,
      date: new Date().toLocaleDateString('vi-VN'),
    });
  } else {
    omittedFields.push('Điều còn chưa biết');
  }

  // 4. Bước thử (đồng bộ sang Cổng 2)
  if (perms.experimentStep && card.experiment) {
    savedFields.push('Bước thử (Đã đồng bộ sang Cổng 2)');
    createExperimentFromSession(
      `Thử nghiệm: ${card.experiment.action}`,
      card.experiment.learningQuestion,
      {
        external: card.hardConstraints[0] || 'Kỳ vọng bên ngoài',
        internal: card.criteria[0] || 'Nhu cầu cá nhân',
      }
    );
    await saveMemoryToCloud({
      id: `dec_exp_${Date.now()}`,
      category: 'insight',
      title: 'Bước Thử Kiểm Chứng',
      reflection: `Câu hỏi học tập: ${card.experiment.learningQuestion}\nHành động: ${card.experiment.action}\nThời lượng: ${card.experiment.durationDays} ngày`,
      date: new Date().toLocaleDateString('vi-VN'),
    });
  } else {
    omittedFields.push('Bước thử');
  }

  // 5. Ngày nhìn lại
  if (perms.reviewDate && card.reviewDate) {
    savedFields.push(`Ngày nhìn lại (${card.reviewDate})`);
  } else {
    omittedFields.push('Ngày nhìn lại');
  }

  // Đánh dấu Card là CONFIRMED
  const confirmedCard: DecisionCardData = {
    ...card,
    status: 'CONFIRMED',
    version: card.version + 1,
  };
  saveActiveDecisionCard(confirmedCard);

  return { savedFields, omittedFields };
}
