import { describe, expect, it } from 'vitest';
import { buildContextPayload } from '../../src/server/ai/context';

describe('AI context question catalog', () => {
  it('includes only the server-provided question metadata', () => {
    const payload = buildContextPayload({
      userId: 'user-1',
      conversationId: 'conversation-1',
      currentStage: 'discovery',
      allowedTransitions: ['discovery', 'clarify'],
      eligibleQuestionIds: ['question-1'],
      questionCatalog: [{
        id: 'question-1',
        questionKey: 'q_ideal_day',
        title: 'Một ngày bình thường đáng sống với bạn sẽ như thế nào?',
        helperText: 'Hãy mô tả một khoảnh khắc cụ thể.',
      }],
      recentMessages: [{ role: 'user', content: 'Tôi muốn có nhiều thời gian hơn.' }],
      confirmedInsights: [],
      userAnswersSummary: '',
    });

    expect(payload).toContain('ELIGIBLE_QUESTION_CATALOG');
    expect(payload).toContain('question-1 | q_ideal_day | Một ngày bình thường đáng sống với bạn sẽ như thế nào?');
    expect(payload).toContain('Hãy mô tả một khoảnh khắc cụ thể.');
  });
});
