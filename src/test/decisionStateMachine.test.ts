import { describe, it, expect } from 'vitest';
import {
  canDesignExperiment,
  applyProposalToCard,
  detectRevisionConflict
} from '../services/decisionStateMachine';
import { DecisionCardRecord, DecisionProposalRecord } from '../types/decisionJourney';

describe('Decision State Machine & Revision Protection', () => {
  const baseCard: DecisionCardRecord = {
    id: 'dec-1',
    title: 'Nghỉ việc hay ở lại',
    status: 'DRAFT',
    current_revision: 2,
    decision_question: 'Tôi nên ở lại điều chỉnh hay tìm việc mới?',
    criteria: ['Bảo toàn sức khỏe'],
    hard_constraints: ['Không làm ngoài giờ'],
    options: [],
    uncertainties: [],
    confirmed_fields: { decision_question: true, criteria: true }
  };

  it('should allow designing experiment when question and at least 1 criteria are confirmed', () => {
    expect(canDesignExperiment(baseCard)).toBe(true);

    const unconfirmedCard = { ...baseCard, confirmed_fields: {} };
    expect(canDesignExperiment(unconfirmedCard)).toBe(false);
  });

  it('should detect 409 conflict when client expected_revision does not match current_revision', () => {
    const isConflict = detectRevisionConflict(baseCard.current_revision, 1);
    expect(isConflict).toBe(true);

    const noConflict = detectRevisionConflict(baseCard.current_revision, 2);
    expect(noConflict).toBe(false);
  });

  it('should not mutate confirmed fields until proposal is explicitly accepted', () => {
    const proposal: DecisionProposalRecord = {
      id: 'prop-1',
      decision_id: 'dec-1',
      base_revision: 2,
      proposed_fields: { criteria: ['Bảo toàn sức khỏe', 'Lương tối thiểu 30tr'] },
      status: 'pending'
    };

    // Card remains unchanged when proposal is pending
    expect(baseCard.criteria.length).toBe(1);

    // After applying proposal: returns new revision
    const updated = applyProposalToCard(baseCard, proposal, ['criteria']);
    expect(updated.current_revision).toBe(3);
    expect(updated.criteria).toContain('Lương tối thiểu 30tr');
    expect(baseCard.criteria.length).toBe(1); // original immutable
  });
});
