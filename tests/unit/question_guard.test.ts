import { describe, expect, it } from 'vitest';
import {
  collectAskedQuestions,
  ensureNonRepeatingQuestion,
  isRepeatedQuestion,
  pickFreshQuestion,
} from '../../src/server/ai/question-guard';

describe('conversation question guard', () => {
  const firstQuestion = 'Điều gì đang khiến bạn cảm thấy áp lực nhất lúc này?';

  it('detects exact and lightly reworded duplicates', () => {
    expect(isRepeatedQuestion(firstQuestion, [firstQuestion])).toBe(true);
    expect(
      isRepeatedQuestion('Điều gì khiến bạn cảm thấy áp lực nhất lúc này?', [firstQuestion])
    ).toBe(true);
  });

  it('extracts assistant questions and picks a fresh follow-up', () => {
    const messages = [
      { role: 'assistant', content: `Mình hiểu bạn. ${firstQuestion}` },
      { role: 'user', content: 'Mình đang rất mệt.' },
    ];
    expect(collectAskedQuestions(messages)).toEqual([firstQuestion]);
    expect(pickFreshQuestion(messages)).not.toBe(firstQuestion);
  });

  it('replaces a repeated final question while preserving the reflection', () => {
    const messages = [{ role: 'assistant', content: `Mình hiểu bạn. ${firstQuestion}` }];
    const response = ensureNonRepeatingQuestion(
      `Mình nghe bạn đang chịu nhiều áp lực. ${firstQuestion}`,
      messages
    );
    expect(response).toContain('Mình nghe bạn đang chịu nhiều áp lực');
    expect(response).not.toContain(firstQuestion);
    expect(response).toMatch(/[?？]$/);
  });
});
