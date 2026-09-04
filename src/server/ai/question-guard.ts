/**
 * Guard for conversational questions preventing semantic repetition.
 *
 * Enforces product invariants:
 * 1. A user must not receive duplicate or reworded questions on topics already answered.
 * 2. Questions must create forward progression (e.g. ESCAPE -> LIFE VISION).
 * 3. Generic question rotation is replaced with state-aware progression.
 */

export interface QuestionHistoryMessage {
  role: string;
  content: string;
}

export interface ConversationSemanticState {
  answeredTopics?: string[];
  knownFacts?: string[];
  currentFocus?: string;
  nextInformationNeed?: string;
}

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

export function tokenSimilarity(left: string, right: string): number {
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

/**
 * Detects semantic duplicate questions (same target intent even with different phrasing).
 */
export function isRepeatedQuestion(
  candidate: string,
  previousQuestions: string[],
  answeredTopics: string[] = []
): boolean {
  const normalizedCandidate = normalizeQuestion(candidate);
  if (!normalizedCandidate) return false;

  // Exact or near-duplicate string match
  const stringMatch = previousQuestions.some((previous) => {
    const normalizedPrevious = normalizeQuestion(previous);
    return (
      normalizedPrevious === normalizedCandidate ||
      tokenSimilarity(normalizedPrevious, normalizedCandidate) >= 0.78
    );
  });
  if (stringMatch) return true;

  // Semantic intent checks
  const candidateLower = candidate.toLowerCase();

  // Intent: Asking about pressure source / situation when pressure source is already answered
  const isAskingPressureSource =
    (candidateLower.includes('áp lực') || candidateLower.includes('stress') || candidateLower.includes('mệt mỏi')) &&
    (candidateLower.includes('tình huống') || candidateLower.includes('khoảnh khắc') || candidateLower.includes('điều gì tạo') || candidateLower.includes('từ đâu'));
  
  if (isAskingPressureSource) {
    const alreadyAskedPressure = previousQuestions.some((q) => {
      const ql = q.toLowerCase();
      return (ql.includes('áp lực') || ql.includes('stress')) && (ql.includes('tình huống') || ql.includes('khoảnh khắc') || ql.includes('điều gì'));
    });
    const alreadyAnsweredPressure = answeredTopics.some((t) => t.includes('pressure') || t.includes('stress'));
    if (alreadyAskedPressure || alreadyAnsweredPressure) return true;
  }

  return false;
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

/**
 * Generate an adaptive follow-up progression question based on conversation history.
 */
export function generateProgressionQuestion(
  recentMessages: QuestionHistoryMessage[],
  state?: ConversationSemanticState
): string {
  const userTexts = recentMessages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.toLowerCase())
    .join(' ');
  const asked = collectAskedQuestions(recentMessages);

  // If user mentioned stress/pressure, move to ESCAPE vs LIFE VISION
  if (userTexts.includes('stress') || userTexts.includes('áp lực') || userTexts.includes('mệt') || userTexts.includes('nghỉ việc')) {
    const q = 'Nếu áp lực hiện tại tạm thời không còn, bạn muốn thời gian và năng lượng của mình được dành cho điều gì?';
    if (!isRepeatedQuestion(q, asked)) return q;
  }

  // If user mentioned wanting time/family/freedom, explore value or concrete day
  if (userTexts.includes('gia đình') || userTexts.includes('tự do') || userTexts.includes('thời gian')) {
    const q = 'Trong một ngày bạn cảm thấy trọn vẹn nhất, khoảnh khắc nào là điều bạn muốn giữ lại nhất?';
    if (!isRepeatedQuestion(q, asked)) return q;
  }

  // Next information need from state if available
  if (state?.nextInformationNeed && !isRepeatedQuestion(state.nextInformationNeed, asked)) {
    return state.nextInformationNeed;
  }

  const fallbackProgression = [
    'Nếu có một điều nhỏ bạn muốn bắt đầu thử nghiệm trong tuần này, đó sẽ là gì?',
    'Điều gì là quan trọng nhất bạn muốn bảo vệ trong giai đoạn này?',
    'Ranh giới hay sự hỗ trợ nào có thể giúp bạn tiến gần hơn tới mong muốn đó?',
  ];

  return fallbackProgression.find((q) => !isRepeatedQuestion(q, asked)) || fallbackProgression[0];
}

/**
 * Ensure responseText does not repeat previous questions and advances the conversation.
 */
export function ensureNonRepeatingQuestion(
  responseText: string,
  recentMessages: QuestionHistoryMessage[],
  state?: ConversationSemanticState
): string {
  const trimmed = responseText.replace(/\s+/g, ' ').trim();
  const existingQuestion = extractQuestion(trimmed);
  const askedQuestions = collectAskedQuestions(recentMessages);
  const answeredTopics = state?.answeredTopics || [];

  if (existingQuestion && !isRepeatedQuestion(existingQuestion, askedQuestions, answeredTopics)) {
    return trimmed;
  }

  const replacement = generateProgressionQuestion(recentMessages, state);
  if (existingQuestion) {
    const questionIndex = trimmed.lastIndexOf(existingQuestion);
    const acknowledgement = trimmed
      .slice(0, questionIndex)
      .trim()
      .replace(/[.!?！？]+$/, '');
    if (!acknowledgement) return replacement;
    return `${acknowledgement}. ${replacement}`.trim();
  }

  const acknowledgement = trimmed.replace(/[.!?！？]+$/, '').trim();
  return `${acknowledgement}. ${replacement}`.trim();
}

/** Build a natural, progressive mock response without canned templates. */
export function buildMockResponse(
  latestUserMessage: string,
  recentMessages: QuestionHistoryMessage[] = [],
  state?: ConversationSemanticState
): string {
  const text = latestUserMessage.toLowerCase();

  // Reflection / Completed experiment results
  if (
    text.includes('làm thử') ||
    text.includes('đã làm') ||
    text.includes('đã thử') ||
    text.includes('nhận ra') ||
    text.includes('kết quả') ||
    text.includes('rút ra') ||
    text.includes('bài học') ||
    text.includes('ngày đầu')
  ) {
    return 'Tuyệt vời! Chúc mừng bạn đã hoàn thành bước thử nghiệm đầu tiên và rút ra được bài học rất giá trị. Mình đã tự động lưu ghi nhận và bài học này vào nhật ký của bạn. Bạn muốn tiếp tục duy trì bước này vào ngày mai hay muốn điều chỉnh thêm điều gì không?';
  }

  // Turn 1: Short vague stress/pressure
  if ((text.includes('stress') || text.includes('áp lực') || text.includes('mệt')) && !text.includes('công việc') && !text.includes('tiền')) {
    return 'Nghe như hiện tại bạn đang chịu khá nhiều áp lực. Điều gì đang tạo áp lực cho bạn nhiều nhất lúc này?';
  }

  // Turn 2: Work & Money pressure (Escape) -> Move to Life Vision
  if (text.includes('công việc') || text.includes('tiền') || text.includes('nghỉ việc')) {
    return 'Có vẻ thứ làm bạn mệt không chỉ là công việc, mà còn là cảm giác phải liên tục chạy theo áp lực kiếm tiền. Nếu áp lực này tạm thời không còn, bạn muốn thời gian và năng lượng của mình được dành cho điều gì?';
  }

  // Progression question
  const followUp = generateProgressionQuestion([...recentMessages, { role: 'user', content: latestUserMessage }], state);
  return `Cảm ơn bạn đã cởi mở chia sẻ điều này. ${followUp}`;
}
