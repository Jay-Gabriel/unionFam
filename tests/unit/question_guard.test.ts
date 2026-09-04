import { describe, expect, it } from 'vitest';
import {
  collectAskedQuestions,
  ensureNonRepeatingQuestion,
  isRepeatedQuestion,
  generateProgressionQuestion,
  buildMockResponse,
} from '../../src/server/ai/question-guard';

describe('conversation question guard', () => {
  const firstQuestion = 'Điều gì đang khiến bạn cảm thấy áp lực nhất lúc này?';

  it('detects exact and lightly reworded duplicates', () => {
    expect(isRepeatedQuestion(firstQuestion, [firstQuestion])).toBe(true);
    expect(
      isRepeatedQuestion('Điều gì khiến bạn cảm thấy áp lực nhất lúc này?', [firstQuestion])
    ).toBe(true);
  });

  it('detects semantic duplication of already answered pressure topics', () => {
    expect(
      isRepeatedQuestion(
        'Khoảnh khắc nào khiến bạn cảm nhận áp lực này rõ nhất?',
        [firstQuestion],
        ['primary_pressure_source']
      )
    ).toBe(true);
  });

  it('extracts assistant questions and generates progression follow-up', () => {
    const messages = [
      { role: 'assistant', content: `Mình hiểu bạn. ${firstQuestion}` },
      { role: 'user', content: 'Mình đang rất mệt vì công việc và tiền bạc.' },
    ];
    expect(collectAskedQuestions(messages)).toEqual([firstQuestion]);
    const nextQ = generateProgressionQuestion(messages);
    expect(nextQ).not.toBe(firstQuestion);
    expect(nextQ).toContain('áp lực');
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

  it('builds natural mock response moving from escape to life vision', () => {
    const turn1 = buildMockResponse('Tôi stress');
    expect(turn1).toContain('áp lực');
    expect(turn1).not.toContain('Mình chưa muốn đoán thay bạn');

    const turn2 = buildMockResponse('Công việc, lúc nào cũng phải kiếm tiền', [
      { role: 'user', content: 'Tôi stress' },
      { role: 'assistant', content: turn1 },
    ]);
    expect(turn2).toContain('năng lượng');
    expect(turn2).not.toContain('Mình nghe bạn đang nhắc đến');
  });
});

