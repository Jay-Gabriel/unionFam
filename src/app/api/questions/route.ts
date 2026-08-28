import { NextResponse } from 'next/server';
import { DefaultQuestionFlowFixture, validateAnswerPayload, calculateProgress } from '@/server/domain/questions';
import { getCurrentUserSession } from '@/server/auth/session';

// Memory persistence store for local dev
const userAnswersStore: Record<string, Record<string, any>> = {};

export async function GET() {
  const session = await getCurrentUserSession();
  const userId = session?.userId || 'guest-user';
  const userAnswers = userAnswersStore[userId] || {};

  const answeredKeys = Object.keys(userAnswers);
  const progress = calculateProgress(DefaultQuestionFlowFixture.length, answeredKeys.length);

  return NextResponse.json({
    data: {
      flowVersion: 'dev-placeholder (v1.0)',
      questions: DefaultQuestionFlowFixture,
      userAnswers,
      progress,
      resumeIndex: Math.min(answeredKeys.length, DefaultQuestionFlowFixture.length - 1),
    },
  });
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentUserSession();
    const userId = session?.userId || 'guest-user';
    const body = await request.json();
    const { questionId, answer, idempotencyKey } = body;

    const question = DefaultQuestionFlowFixture.find((q) => q.id === questionId);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const isValid = validateAnswerPayload(question.answerType, question.options, answer);
    if (!isValid) {
      return NextResponse.json({ error: 'INVALID_ANSWER_PAYLOAD' }, { status: 422 });
    }

    if (!userAnswersStore[userId]) {
      userAnswersStore[userId] = {};
    }

    userAnswersStore[userId][question.questionKey] = answer;

    const answeredKeys = Object.keys(userAnswersStore[userId]);
    const progress = calculateProgress(DefaultQuestionFlowFixture.length, answeredKeys.length);

    return NextResponse.json({
      data: {
        success: true,
        savedQuestionKey: question.questionKey,
        progress,
        idempotencyKey,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
