import { describe, it, expect } from 'vitest';
import {
  DefaultQuestionFlowFixture,
  computeEligibleQuestions,
  validateAnswerPayload,
  calculateProgress,
} from '../../src/server/domain/questions';

describe('Question Engine Validation & Resume Progress', () => {
  it('should validate answer payload types correctly', () => {
    const qText = DefaultQuestionFlowFixture[0];
    const qChoice = DefaultQuestionFlowFixture[2];

    expect(validateAnswerPayload(qText.answerType, qText.options, 'Muốn tự do thời gian')).toBe(true);
    expect(validateAnswerPayload(qText.answerType, qText.options, '  ')).toBe(false);

    expect(validateAnswerPayload(qChoice.answerType, qChoice.options, 'work_4_days')).toBe(true);
    expect(validateAnswerPayload(qChoice.answerType, qChoice.options, 'invalid_choice')).toBe(false);
  });

  it('should calculate resume progress percentage accurately', () => {
    expect(calculateProgress(3, 0)).toBe(0);
    expect(calculateProgress(3, 1)).toBe(33);
    expect(calculateProgress(3, 3)).toBe(100);
  });

  it('should keep branch questions deterministic and answer-driven', () => {
    const withoutBranch = computeEligibleQuestions(DefaultQuestionFlowFixture, { q3_work_style: 'remote_full' });
    expect(withoutBranch).not.toContain('22222222-2222-2222-2222-222222222207');
    expect(withoutBranch).not.toContain('22222222-2222-2222-2222-222222222208');

    const entrepreneurBranch = computeEligibleQuestions(DefaultQuestionFlowFixture, { q3_work_style: 'entrepreneur' });
    expect(entrepreneurBranch).toContain('22222222-2222-2222-2222-222222222207');
    expect(entrepreneurBranch).not.toContain('22222222-2222-2222-2222-222222222208');

    const fourDayBranch = computeEligibleQuestions(DefaultQuestionFlowFixture, { q3_work_style: 'work_4_days' });
    expect(fourDayBranch).not.toContain('22222222-2222-2222-2222-222222222207');
    expect(fourDayBranch).toContain('22222222-2222-2222-2222-222222222208');
  });
});
