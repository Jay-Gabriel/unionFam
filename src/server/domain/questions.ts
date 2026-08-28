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
  answerType: 'text' | 'single_choice' | 'multi_choice' | 'scale';
  options: QuestionOption[];
  ordinal: number;
  isRequired: boolean;
}

export const DefaultQuestionFlowFixture: QuestionItem[] = [
  {
    id: '22222222-2222-2222-2222-222222222201',
    questionKey: 'q1_life_focus',
    title: 'Nếu bạn được tự lựa chọn cuộc đời mình, bạn muốn dành thời gian và năng lượng của mình cho điều gì?',
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
];

export function validateAnswerPayload(answerType: string, options: QuestionOption[], payload: any): boolean {
  if (payload === undefined || payload === null || payload === '') return false;
  if (answerType === 'text') {
    return typeof payload === 'string' && payload.trim().length > 0;
  }
  if (answerType === 'single_choice') {
    return options.some((opt) => opt.value === payload);
  }
  if (answerType === 'multi_choice') {
    return Array.isArray(payload) && payload.every((val) => options.some((opt) => opt.value === val));
  }
  return true;
}

export function computeEligibleQuestions(questions: QuestionItem[], currentAnswers: Record<string, any>): string[] {
  // Deterministic branching evaluation
  return questions.map((q) => q.id);
}

export function calculateProgress(questionsCount: number, answeredCount: number): number {
  if (questionsCount === 0) return 0;
  return Math.min(100, Math.round((answeredCount / questionsCount) * 100));
}
