import { describe, it, expect } from 'vitest';
import { parseStrictAIOutput } from '../../src/server/ai/schemas';

describe('AI Schema Strict Allowlist & Error Invariants', () => {
  it('should pass schema parse when nextQuestionId is in server allowlist', () => {
    const validJSON = JSON.stringify({
      responseText: 'Cảm ơn chia sẻ của bạn',
      nextStage: 'initial_exploration',
      nextQuestionId: 'q2_financial_freedom',
    });

    const res = parseStrictAIOutput(validJSON, ['q1_life_focus', 'q2_financial_freedom']);
    expect(res.success).toBe(true);
    expect(res.data?.nextQuestionId).toBe('q2_financial_freedom');
  });

  it('should reject schema parse when nextQuestionId is NOT in allowlist', () => {
    const invalidJSON = JSON.stringify({
      responseText: 'Cảm ơn chia sẻ của bạn',
      nextStage: 'initial_exploration',
      nextQuestionId: 'unauthorized_hacked_question_id',
    });

    const res = parseStrictAIOutput(invalidJSON, ['q1_life_focus', 'q2_financial_freedom']);
    expect(res.success).toBe(false);
    expect(res.errorCode).toBe('AI_SCHEMA_INVALID');
  });

  it('should reject invalid JSON output without producing business record', () => {
    const malformed = 'Not a json';
    const res = parseStrictAIOutput(malformed);
    expect(res.success).toBe(false);
    expect(res.errorCode).toBe('AI_SCHEMA_INVALID');
  });
});
