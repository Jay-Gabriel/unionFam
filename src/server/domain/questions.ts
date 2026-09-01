import { z } from 'zod';

export interface QuestionOption {
  value: string;
  label: string;
}

export interface QuestionItem {
  id: string;
  questionKey: string;
  title: string;
  helperText?: string;
  answerType: 'text' | 'single_choice' | 'multi_choice' | 'scale' | 'date';
  options: QuestionOption[];
  branchRules?: BranchRule[];
  ordinal: number;
  isRequired: boolean;
}

export interface BranchRule {
  questionKey: string;
  operator: 'equals' | 'not_equals' | 'includes' | 'answered' | 'not_answered';
  value?: string | number | boolean;
  action?: 'include' | 'exclude';
}

export const DefaultQuestionFlowFixture: QuestionItem[] = [
  {
    id: '22222222-2222-2222-2222-222222222201',
    questionKey: 'q1_life_focus',
    title: 'Hãy tưởng tượng bạn đang sống một cuộc đời do chính mình lựa chọn. Trong một ngày bình thường, bạn muốn dành thời gian và năng lượng của mình cho những điều gì?',
    helperText: 'Hãy nghĩ về mong muốn chân thật nhất của bạn ở thời điểm hiện tại.',
    answerType: 'text',
    options: [],
    ordinal: 1,
    isRequired: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222202',
    questionKey: 'q2_financial_freedom',
    title: 'Điều gì trong cuộc sống mà nhiều tiền sẽ cho phép bạn làm mà hiện tại bạn chưa thể làm?',
    helperText: 'Chi tiết các dự định, ước mơ hoặc mục tiêu tài chính.',
    answerType: 'text',
    options: [],
    ordinal: 2,
    isRequired: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222203',
    questionKey: 'q3_work_style',
    title: 'Bạn mong muốn mô hình công việc lý tưởng của mình là gì?',
    helperText: 'Chọn đáp án phù hợp nhất',
    answerType: 'single_choice',
    options: [
      { value: 'work_4_days', label: 'Làm việc 4 ngày/tuần trong 1 tháng' },
      { value: 'remote_full', label: 'Tự do địa điểm toàn thời gian' },
      { value: 'entrepreneur', label: 'Kinh doanh tự do' },
    ],
    ordinal: 3,
    isRequired: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222204',
    questionKey: 'q4_ideal_day',
    title: 'Một ngày lý tưởng của bạn sẽ có nhịp điệu như thế nào?',
    helperText: 'Mô tả một ngày đủ cụ thể để bạn có thể hình dung mình đang sống trong đó.',
    answerType: 'text',
    options: [],
    ordinal: 4,
    isRequired: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222205',
    questionKey: 'q5_values',
    title: 'Điều gì đang quan trọng nhất với bạn trong giai đoạn này?',
    helperText: 'Chọn tối đa ba điều bạn muốn giữ làm điểm tựa.',
    answerType: 'multi_choice',
    options: [
      { value: 'family', label: 'Gia đình và người thân' },
      { value: 'freedom', label: 'Tự do lựa chọn' },
      { value: 'health', label: 'Sức khỏe và năng lượng' },
      { value: 'craft', label: 'Làm tốt điều mình tin' },
      { value: 'community', label: 'Đóng góp cho cộng đồng' },
    ],
    ordinal: 5,
    isRequired: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222206',
    questionKey: 'q6_energy',
    title: 'Bạn đang có bao nhiêu năng lượng để thay đổi một điều nhỏ?',
    helperText: '1 là gần như cạn năng lượng, 10 là sẵn sàng bắt đầu ngay.',
    answerType: 'scale',
    options: [],
    ordinal: 6,
    isRequired: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222207',
    questionKey: 'q7_business_experiment',
    title: 'Nếu thử một ý tưởng kinh doanh nhỏ, bạn muốn kiểm chứng điều gì trước?',
    helperText: 'Câu hỏi này mở ra khi bạn chọn hướng kinh doanh tự do.',
    answerType: 'text',
    options: [],
    branchRules: [{ questionKey: 'q3_work_style', operator: 'equals', value: 'entrepreneur', action: 'include' }],
    ordinal: 7,
    isRequired: false,
  },
  {
    id: '22222222-2222-2222-2222-222222222208',
    questionKey: 'q8_time_boundary',
    title: 'Bạn muốn dành lại khoảng thời gian nào cho chính mình?',
    helperText: 'Có thể là một khung giờ, một ngày trong tuần hoặc một mốc bắt đầu.',
    answerType: 'date',
    options: [],
    branchRules: [{ questionKey: 'q3_work_style', operator: 'equals', value: 'work_4_days', action: 'include' }],
    ordinal: 8,
    isRequired: false,
  },
  {
    id: '22222222-2222-2222-2222-222222222209',
    questionKey: 'q9_tradeoff',
    title: 'Để tiến gần hơn tới nhịp sống đó, bạn sẵn sàng thử buông điều gì?',
    helperText: 'Không cần cam kết vĩnh viễn; chỉ cần một lựa chọn có thể thử trong thời gian ngắn.',
    answerType: 'text',
    options: [],
    ordinal: 9,
    isRequired: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222210',
    questionKey: 'q10_next_step',
    title: 'Một bước nhỏ an toàn bạn có thể thử trong bảy ngày tới là gì?',
    helperText: 'Hãy chọn điều có thể quan sát được, không cần hoàn hảo.',
    answerType: 'text',
    options: [],
    ordinal: 10,
    isRequired: true,
  },
];

export function validateAnswerPayload(answerType: string, options: QuestionOption[], payload: any): boolean {
  if (payload === undefined || payload === null || payload === '') return false;
  if (answerType === 'text') {
    return typeof payload === 'string' && payload.trim().length > 0 && payload.length <= 4000;
  }
  if (answerType === 'single_choice') {
    return options.some((opt) => opt.value === payload);
  }
  if (answerType === 'multi_choice') {
    return (
      Array.isArray(payload) &&
      payload.length > 0 &&
      payload.length <= options.length &&
      new Set(payload).size === payload.length &&
      payload.every((val) => options.some((opt) => opt.value === val))
    );
  }
  if (answerType === 'scale') {
    return typeof payload === 'number' && Number.isInteger(payload) && payload >= 1 && payload <= 10;
  }
  if (answerType === 'date') {
    if (typeof payload !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(payload)) return false;
    const parsed = new Date(`${payload}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === payload;
  }
  return false;
}

export function computeEligibleQuestions(questions: QuestionItem[], currentAnswers: Record<string, any>): string[] {
  return questions
    .filter((question) => {
      const rules = question.branchRules || [];
      const includeRules = rules.filter((rule) => (rule.action || 'include') === 'include');
      const excludeRules = rules.filter((rule) => rule.action === 'exclude');

      if (excludeRules.some((rule) => evaluateBranchRule(rule, currentAnswers))) return false;
      return includeRules.length === 0 || includeRules.every((rule) => evaluateBranchRule(rule, currentAnswers));
    })
    .sort((a, b) => a.ordinal - b.ordinal)
    .map((question) => question.id);
}

export function getNextEligibleQuestionId(
  questions: QuestionItem[],
  currentAnswers: Record<string, any>,
  currentQuestionId?: string
) {
  const eligibleIds = computeEligibleQuestions(questions, currentAnswers);
  const currentIndex = currentQuestionId ? eligibleIds.indexOf(currentQuestionId) : -1;
  return eligibleIds[currentIndex + 1] || null;
}

function evaluateBranchRule(rule: BranchRule, answers: Record<string, any>) {
  const answer = answers[rule.questionKey];
  switch (rule.operator) {
    case 'answered':
      return answer !== undefined && answer !== null && answer !== '';
    case 'not_answered':
      return answer === undefined || answer === null || answer === '';
    case 'equals':
      return answer === rule.value;
    case 'not_equals':
      return answer !== rule.value;
    case 'includes':
      return Array.isArray(answer) ? answer.includes(rule.value) : String(answer || '').includes(String(rule.value || ''));
    default:
      return false;
  }
}

export function calculateProgress(questionsCount: number, answeredCount: number): number {
  if (questionsCount === 0) return 0;
  return Math.min(100, Math.round((answeredCount / questionsCount) * 100));
}
