export interface ContextBudgetParams {
  userId: string;
  conversationId: string;
  recentMessages: { role: string; content: string }[];
  confirmedInsights: string[];
  userAnswersSummary: string;
}

export function buildContextPayload(params: ContextBudgetParams): string {
  const { confirmedInsights, userAnswersSummary, recentMessages } = params;

  const safetyNote = 'SAFETY: Life Lab AI is a reflective assistant. Do not provide medical/psychological diagnosis.';
  const insightsChunk = confirmedInsights.length > 0 ? `Confirmed Facts: ${confirmedInsights.join('; ')}` : '';
  const answersChunk = userAnswersSummary ? `User Questionnaire Answers: ${userAnswersSummary}` : '';
  const recentChat = recentMessages.slice(-6).map((m) => `${m.role}: ${m.content}`).join('\n');

  // Enforce context budget trimming if needed
  return `${safetyNote}\n${insightsChunk}\n${answersChunk}\n\nRecent Conversation:\n${recentChat}`;
}
