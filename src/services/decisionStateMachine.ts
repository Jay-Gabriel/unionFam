import { DecisionCardRecord, DecisionProposalRecord } from '../types/decisionJourney';

/**
 * Kiểm tra điều kiện mở nút "Thiết kế bước thử":
 * Đã xác nhận câu hỏi quyết định và ít nhất một điều quan trọng (criteria).
 */
export const canDesignExperiment = (card: DecisionCardRecord): boolean => {
  const hasQuestion = Boolean(card.decision_question?.trim()) && Boolean(card.confirmed_fields['decision_question']);
  const hasCriteria =
    Array.isArray(card.criteria) &&
    card.criteria.length > 0 &&
    Boolean(card.confirmed_fields['criteria']);
  return hasQuestion && hasCriteria;
};

/**
 * Phát hiện xung đột phiên bản (409 Concurrency Conflict)
 */
export const detectRevisionConflict = (currentRevision: number, expectedRevision: number): boolean => {
  return currentRevision !== expectedRevision;
};

/**
 * Áp dụng đề xuất từ AI một cách bất biến, tăng revision lên 1 và xác nhận các trường được chọn
 */
export const applyProposalToCard = (
  card: DecisionCardRecord,
  proposal: DecisionProposalRecord,
  acceptedFieldKeys: (keyof DecisionCardRecord)[]
): DecisionCardRecord => {
  const nextCard: DecisionCardRecord = {
    ...card,
    current_revision: card.current_revision + 1,
    confirmed_fields: { ...card.confirmed_fields }
  };

  for (const key of acceptedFieldKeys) {
    if (proposal.proposed_fields[key] !== undefined) {
      (nextCard as any)[key] = proposal.proposed_fields[key];
      nextCard.confirmed_fields[key as string] = true;
    }
  }

  return nextCard;
};
