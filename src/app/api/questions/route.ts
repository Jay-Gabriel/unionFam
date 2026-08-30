import { NextResponse } from 'next/server';
import { DefaultQuestionFlowFixture, validateAnswerPayload, calculateProgress } from '@/server/domain/questions';
import { requireUser } from '@/server/auth/current-user';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const session = await requireUser();
  const userId = session.id;
  const supabase = createClient();

  // Fetch the pinned/published flow version (using dev-placeholder for Week 1)
  const { data: flowVer, error: flowErr } = await supabase
    .from('question_flow_versions')
    .select('id, name')
    .eq('code', 'dev-placeholder')
    .single();

  if (flowErr || !flowVer) {
    return NextResponse.json({ error: 'FLOW_NOT_FOUND' }, { status: 404 });
  }

  // Fetch existing answers for this user
  const { data: answers, error: ansErr } = await supabase
    .from('user_answers')
    .select('question_id, answer, questions(question_key)')
    .eq('user_id', userId)
    .eq('flow_version_id', flowVer.id);

  if (ansErr) {
    return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 });
  }

  const userAnswers: Record<string, any> = {};
  answers?.forEach((a: any) => {
    if (a.questions?.question_key) {
      userAnswers[a.questions.question_key] = a.answer;
    }
  });

  const answeredKeys = Object.keys(userAnswers);
  const progress = calculateProgress(DefaultQuestionFlowFixture.length, answeredKeys.length);

  return NextResponse.json({
    data: {
      flowVersion: `${flowVer.name} (v1.0)`,
      questions: DefaultQuestionFlowFixture,
      userAnswers,
      progress,
      resumeIndex: Math.min(answeredKeys.length, DefaultQuestionFlowFixture.length - 1),
    },
  });
}

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const userId = session.id;
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

    const supabase = createClient();

    // In a real app we'd fetch this from DB, but we know we're using dev-placeholder
    const flowVersionId = '11111111-1111-1111-1111-111111111111';

    const { error: upsertErr } = await supabase
      .from('user_answers')
      .upsert({
        user_id: userId,
        flow_version_id: flowVersionId,
        question_id: questionId,
        answer,
        idempotency_key: idempotencyKey,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, flow_version_id, question_id' });

    if (upsertErr) {
      console.error(upsertErr);
      return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 });
    }

    // Recalculate progress
    const { data: currentAnswers } = await supabase
      .from('user_answers')
      .select('id')
      .eq('user_id', userId)
      .eq('flow_version_id', flowVersionId);

    const answeredCount = currentAnswers?.length || 0;
    const progress = calculateProgress(DefaultQuestionFlowFixture.length, answeredCount);

    return NextResponse.json({
      data: {
        success: true,
        savedQuestionKey: question.questionKey,
        progress,
        idempotencyKey,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
