import { NextResponse } from 'next/server';
import {
  computeEligibleQuestions,
  calculateProgress,
  type BranchRule,
  type QuestionItem,
  validateAnswerPayload,
} from '@/server/domain/questions';
import { requireUser } from '@/server/auth/current-user';
import { createClient } from '@/lib/supabase/server';
import { consumeRateLimit } from '@/server/security/rate-limit';

export const dynamic = 'force-dynamic';

type QuestionRow = {
  id: string;
  question_key: string;
  title: string;
  helper_text: string | null;
  answer_type: string;
  options: unknown;
  branch_rules: unknown;
  ordinal: number;
  is_required: boolean;
};

function normalizeQuestion(row: QuestionRow): QuestionItem {
  const options = Array.isArray(row.options)
    ? row.options.filter(
        (option): option is { value: string; label: string } =>
          Boolean(option) &&
          typeof option === 'object' &&
          typeof (option as { value?: unknown }).value === 'string' &&
          typeof (option as { label?: unknown }).label === 'string'
      )
    : [];

  const branchRules = Array.isArray(row.branch_rules)
    ? row.branch_rules.filter((rule): rule is BranchRule => {
        if (!rule || typeof rule !== 'object') return false;
        const candidate = rule as Record<string, unknown>;
        return typeof candidate.questionKey === 'string'
          && ['equals', 'not_equals', 'includes', 'answered', 'not_answered'].includes(String(candidate.operator))
          && (candidate.action === undefined || ['include', 'exclude'].includes(String(candidate.action)));
      })
    : [];

  return {
    id: row.id,
    questionKey: row.question_key,
    title: row.title,
    helperText: row.helper_text || undefined,
    answerType: row.answer_type as QuestionItem['answerType'],
    options,
    branchRules,
    ordinal: row.ordinal,
    isRequired: row.is_required,
  };
}

async function getPublishedFlow(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from('question_flow_versions')
    .select('id, code, name, version_no')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .order('version_no', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getFlowQuestions(supabase: ReturnType<typeof createClient>, flowVersionId: string) {
  const { data, error } = await supabase
    .from('questions')
    .select('id, question_key, title, helper_text, answer_type, options, branch_rules, ordinal, is_required')
    .eq('flow_version_id', flowVersionId)
    .order('ordinal', { ascending: true });

  if (error) throw error;
  return (data || []) as unknown as QuestionRow[];
}

export async function GET() {
  try {
    const session = await requireUser();
    const supabase = createClient();
    const flow = await getPublishedFlow(supabase);

    if (!flow) {
      return NextResponse.json({ error: 'FLOW_NOT_FOUND' }, { status: 404 });
    }

    const rows = await getFlowQuestions(supabase, flow.id);
    const questions = rows.map(normalizeQuestion);
    const { data: answers, error: answersError } = await supabase
      .from('user_answers')
      .select('question_id, answer')
      .eq('user_id', session.id)
      .eq('flow_version_id', flow.id)
      .is('deleted_at', null);

    if (answersError) throw answersError;

    const questionById = new Map(questions.map((question) => [question.id, question]));
    const userAnswers: Record<string, unknown> = {};
    (answers || []).forEach((answer: { question_id: string; answer: unknown }) => {
      const question = questionById.get(answer.question_id);
      if (question) userAnswers[question.questionKey] = answer.answer;
    });

    const eligibleIds = computeEligibleQuestions(questions, userAnswers);
    const answeredEligibleCount = eligibleIds.filter((id) => questionById.has(id) &&
      Object.prototype.hasOwnProperty.call(userAnswers, questionById.get(id)!.questionKey)).length;
    const resumeIndex = Math.max(
      0,
      eligibleIds.findIndex((id) => !Object.prototype.hasOwnProperty.call(userAnswers, questionById.get(id)!.questionKey))
    );

    return NextResponse.json({
      data: {
        flowVersion: `${flow.name} (v${flow.version_no})`,
        flowVersionId: flow.id,
        questions,
        eligibleQuestionIds: eligibleIds,
        userAnswers,
        progress: calculateProgress(eligibleIds.length, answeredEligibleCount),
        resumeIndex: resumeIndex === -1 ? Math.max(eligibleIds.length - 1, 0) : resumeIndex,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }
    console.error('QUESTION_FLOW_READ_FAILED', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'QUESTION_FLOW_UNAVAILABLE' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const rate = consumeRateLimit(`questions:${session.id}`, 60, 60_000);
    if (!rate.allowed) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 });
    }
    const questionId = typeof body.questionId === 'string' ? body.questionId : '';
    const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim() : '';

    if (!questionId || idempotencyKey.length > 128) {
      return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 });
    }

    const supabase = createClient();
    const flow = await getPublishedFlow(supabase);
    if (!flow) return NextResponse.json({ error: 'FLOW_NOT_FOUND' }, { status: 404 });

    if (idempotencyKey) {
      const { data: duplicate } = await supabase
        .from('user_answers')
        .select('id, question_id, answer')
        .eq('user_id', session.id)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (duplicate) {
        if (duplicate.question_id !== questionId) {
          return NextResponse.json({ error: 'IDEMPOTENCY_KEY_REUSED' }, { status: 409 });
        }
        if (JSON.stringify(duplicate.answer) !== JSON.stringify(body.answer)) {
          return NextResponse.json({ error: 'IDEMPOTENCY_KEY_REUSED' }, { status: 409 });
        }
        return NextResponse.json({ data: { success: true, duplicate: true, answer: duplicate } });
      }
    }

    const rows = await getFlowQuestions(supabase, flow.id);
    const questions = rows.map(normalizeQuestion);
    const question = questions.find((candidate) => candidate.id === questionId);
    if (!question) return NextResponse.json({ error: 'QUESTION_NOT_FOUND' }, { status: 404 });

    const { data: existingAnswers } = await supabase
      .from('user_answers')
      .select('question_id, answer')
      .eq('user_id', session.id)
      .eq('flow_version_id', flow.id)
      .is('deleted_at', null);
    const questionById = new Map(questions.map((candidate) => [candidate.id, candidate]));
    const answerMap: Record<string, unknown> = {};
    (existingAnswers || []).forEach((answer: { question_id: string; answer: unknown }) => {
      const candidate = questionById.get(answer.question_id);
      if (candidate) answerMap[candidate.questionKey] = answer.answer;
    });

    if (!computeEligibleQuestions(questions, answerMap).includes(question.id)) {
      return NextResponse.json({ error: 'QUESTION_NOT_ELIGIBLE' }, { status: 409 });
    }

    if (!validateAnswerPayload(question.answerType, question.options, body.answer)) {
      return NextResponse.json({ error: 'INVALID_ANSWER_PAYLOAD' }, { status: 422 });
    }

    const { error: upsertError } = await supabase
      .from('user_answers')
      .upsert(
        {
          user_id: session.id,
          flow_version_id: flow.id,
          question_id: question.id,
          answer: body.answer,
          idempotency_key: idempotencyKey || null,
          answered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        },
        { onConflict: 'user_id,flow_version_id,question_id' }
      );

    if (upsertError) throw upsertError;

    await supabase.from('activity_events').insert({
      user_id: session.id,
      event_type: 'question_answered',
      metadata: { question_id: question.id, flow_version_id: flow.id },
    });

    const eligibleIds = computeEligibleQuestions(questions, {
      ...answerMap,
      [question.questionKey]: body.answer,
    });
    const answeredEligibleCount = eligibleIds.filter((id) => {
      const candidate = questionById.get(id);
      return candidate ? Object.prototype.hasOwnProperty.call({ ...answerMap, [question.questionKey]: body.answer }, candidate.questionKey) : false;
    }).length;

    return NextResponse.json({
      data: {
        success: true,
        savedQuestionKey: question.questionKey,
        flowVersionId: flow.id,
        eligibleQuestionIds: eligibleIds,
        progress: calculateProgress(eligibleIds.length, answeredEligibleCount),
        nextQuestionId: eligibleIds[eligibleIds.indexOf(question.id) + 1] || null,
        idempotencyKey: idempotencyKey || null,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }
    console.error('QUESTION_ANSWER_SAVE_FAILED', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'QUESTION_ANSWER_SAVE_FAILED' }, { status: 503 });
  }
}
