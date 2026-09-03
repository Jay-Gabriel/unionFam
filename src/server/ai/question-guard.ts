/**
 * Small, provider-agnostic guard for conversational questions.
 *
 * The model is still responsible for the tone and meaning of a reply, but
 * this module enforces a product invariant: a user should not receive the
 * same (or almost the same) follow-up question twice in a row.
 */

export interface QuestionHistoryMessage {
  role: string;
  content: string;
}

const FOLLOW_UP_QUESTIONS = [
  'Điều đó đang hiện ra rõ nhất trong tình huống nào gần đây?',
  'Khoảnh khắc nào khiến bạn cảm nhận điều này rõ nhất?',
  'Bạn mong điều gì sẽ khác đi trong một ngày bình thường của mình?',
  'Điều gì đang khiến bước tiếp theo trở nên khó khăn nhất với bạn?',
  'Nếu chỉ thay đổi một điều nhỏ trong tuần này, bạn muốn bắt đầu từ đâu?',
  'Bạn muốn giữ lại điều gì dù hoàn cảnh có thay đổi?',
  'Nguồn lực hay ranh giới nào có thể giúp bạn tiến gần hơn tới điều đó?',
  'Bạn nhận ra điều gì mới về mình sau khi nhìn lại chuyện này?',
];

/** Return the last sentence that is actually phrased as a question. */
export function extractQuestion(text: string): string | null {
  const matches = text.match(/[^.!?！？]*[?？]/g) || [];
  const question = matches.at(-1)?.trim();
  return question || null;
}

/** Normalize Vietnamese text enough for exact and near-duplicate checks. */
export function normalizeQuestion(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(left: string, right: string): number {
  const leftTokens = new Set(left.split(' ').filter(Boolean));
  const rightTokens = new Set(right.split(' ').filter(Boolean));
  if (!leftTokens.size || !rightTokens.size) return 0;

  let intersection = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) intersection += 1;
  }
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union ? intersection / union : 0;
}

/** Exact duplicate or a lightly reworded duplicate. */
export function isRepeatedQuestion(candidate: string, previousQuestions: string[]): boolean {
  const normalizedCandidate = normalizeQuestion(candidate);
  if (!normalizedCandidate) return false;

  return previousQuestions.some((previous) => {
    const normalizedPrevious = normalizeQuestion(previous);
    return (
      normalizedPrevious === normalizedCandidate ||
      similarity(normalizedPrevious, normalizedCandidate) >= 0.82
    );
  });
}

export function collectAskedQuestions(messages: QuestionHistoryMessage[]): string[] {
  const questions: string[] = [];
  for (const message of messages) {
    if (message.role !== 'assistant') continue;
    const question = extractQuestion(message.content);
    if (!question || isRepeatedQuestion(question, questions)) continue;
    questions.push(question);
  }
  return questions;
}

/** Pick a short, warm question that has not appeared in the current context. */
export function pickFreshQuestion(messages: QuestionHistoryMessage[]): string {
  const askedQuestions = collectAskedQuestions(messages);
  return (
    FOLLOW_UP_QUESTIONS.find((question) => !isRepeatedQuestion(question, askedQuestions)) ||
    FOLLOW_UP_QUESTIONS[askedQuestions.length % FOLLOW_UP_QUESTIONS.length]
  );
}

/**
 * Keep the model's acknowledgement, replacing only a repeated final question.
 * If the model forgot to ask a question, append one so the response contract
 * remains useful for the next turn.
 */
export function ensureNonRepeatingQuestion(
  responseText: string,
  recentMessages: QuestionHistoryMessage[]
): string {
  const trimmed = responseText.replace(/\s+/g, ' ').trim();
  const existingQuestion = extractQuestion(trimmed);
  const askedQuestions = collectAskedQuestions(recentMessages);

  if (existingQuestion && !isRepeatedQuestion(existingQuestion, askedQuestions)) {
    return trimmed;
  }

  const replacement = pickFreshQuestion(recentMessages);
  if (existingQuestion) {
    const questionIndex = trimmed.lastIndexOf(existingQuestion);
    const acknowledgement = trimmed
      .slice(0, questionIndex)
      .trim()
      .replace(/[.!?！？]+$/, '');
    return `${acknowledgement}. ${replacement}`.trim();
  }

  const acknowledgement = trimmed.replace(/[.!?！？]+$/, '').trim();
  return `${acknowledgement}. ${replacement}`.trim();
}

/** Build a deterministic development response without repeating one sentence. */
export function buildMockResponse(
  latestUserMessage: string,
  recentMessages: QuestionHistoryMessage[]
): string {
  const excerpt = latestUserMessage
    .replace(/\s+/g, ' ')
    .replace(/["“”]/g, "'")
    .trim()
    .slice(0, 180);
  const question = pickFreshQuestion(recentMessages);
  return `Mình nghe bạn đang nhắc đến “${excerpt}”. Mình chưa muốn đoán thay bạn; mình muốn hiểu trải nghiệm ấy theo cách bạn cảm nhận. ${question}`;
}
