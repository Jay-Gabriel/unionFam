import { describe, expect, it } from 'vitest';
import { buildContextPayload } from '../../src/server/ai/context';

describe('AI context budget', () => {
  it('keeps the bounded context and preserves the current turn', () => {
    const payload = buildContextPayload({
      userId: 'user-1',
      conversationId: 'conversation-1',
      currentStage: 'discovery',
      allowedTransitions: ['clarify', 'permission'],
      eligibleQuestionIds: ['q1', 'q2'],
      methodologyVersion: 'dev-placeholder',
      profile: 'profile '.repeat(2000),
      recentMessages: [
        { role: 'assistant', content: 'Câu hỏi trước đó' },
        { role: 'user', content: 'TURN_MARKER '.repeat(500) },
      ],
      confirmedInsights: ['insight '.repeat(1000)],
      userAnswersSummary: 'answer '.repeat(2000),
      activeResources: ['resource '.repeat(500)],
      activeGaps: ['gap '.repeat(500)],
      maxChars: 4000,
    });

    expect(payload.length).toBeLessThanOrEqual(4000);
    expect(payload).toContain('RECENT_MESSAGES');
    expect(payload).toContain('TURN_MARKER');
    expect(payload).toContain('SYSTEM_SAFETY_AND_BOUNDARIES');
  });
});
