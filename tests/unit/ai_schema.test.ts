import { describe, it, expect } from 'vitest';
import { parseStrictAIOutput, AIStructuredOutputSchema } from '../../src/server/ai/schemas';

describe('AI Structured Output & Schema Validation', () => {
  it('should parse valid structured output JSON', () => {
    const raw = JSON.stringify({
      responseText: 'Chào bạn, Life Lab đã nhận phản hồi.',
      nextStage: 'initial_exploration',
      observationProposal: {
        dimension: 'my_life',
        observationType: 'insight_candidate',
        contentOriginal: 'Bạn coi trọng tự do sáng tạo.',
        confidence: 0.9,
      },
    });

    const parsed = parseStrictAIOutput(raw);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.responseText).toContain('Life Lab');
    expect(parsed.data?.observationProposal?.dimension).toBe('my_life');
  });

  it('should reject malformed JSON without producing business record', () => {
    const raw = 'This is raw unformatted text response from AI';
    const result = parseStrictAIOutput(raw);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('AI_SCHEMA_INVALID');
  });
});
