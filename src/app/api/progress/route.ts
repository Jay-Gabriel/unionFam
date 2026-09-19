import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/current-user';
import { computeEligibleQuestions, type BranchRule, type QuestionItem } from '@/server/domain/questions';
import { isDemoMode } from '@/lib/demo-mode';

export const dynamic = 'force-dynamic';

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({
      data: {
        streak: 5,
        answers: 6,
        conversations: 3,
        experiments: 2,
        questionnaireProgress: 100,
        activeDays: 5,
        activeExperimentProgress: 60,
        completedExperiments: 1,
        confirmedInsights: 1,
        confirmedProfiles: 1,
        reflections: 1,
        confirmedLearnings: 1,
        resources: 2,
      },
    });
  }

  try {
    const user = await requireUser();
    const supabase = createClient();
    const [
      { count: answerCount, error: answerError },
      { count: conversationCount, error: conversationError },
      { count: experimentCount, error: experimentError },
      { data: events, error: eventsError },
      { data: flow, error: flowError },
      { data: experimentRows, error: experimentsError },
      { count: confirmedInsightCount, error: insightError },
      { count: confirmedProfileCount, error: profileError },
      { count: reflectionCount, error: reflectionError },
      { count: confirmedLearningCount, error: learningError },
      { count: resourceCount, error: resourceError },
    ] = await Promise.all([
      supabase.from('user_answers').select('id', { count: 'exact', head: true }).eq('user_id', user.id).is('deleted_at', null),
      supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', user.id).is('deleted_at', null),
      supabase.from('experiments').select('id', { count: 'exact', head: true }).eq('user_id', user.id).is('deleted_at', null),
      supabase.from('activity_events').select('event_date').eq('user_id', user.id).order('event_date', { ascending: false }).limit(400),
      supabase.from('question_flow_versions').select('id').eq('status', 'published').order('published_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('experiments').select('status, progress_percent').eq('user_id', user.id).is('deleted_at', null),
      supabase.from('confirmed_insights').select('id', { count: 'exact', head: true }).eq('user_id', user.id).is('deleted_at', null),
      supabase.from('life_profile_versions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'confirmed').eq('is_current', true),
      supabase.from('reflections').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('learning_records').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'confirmed').is('deleted_at', null),
      supabase.from('resources').select('id', { count: 'exact', head: true }).eq('user_id', user.id).is('deleted_at', null),
    ]);
    if (answerError || conversationError || experimentError || eventsError || flowError || experimentsError || insightError || profileError || reflectionError || learningError || resourceError) {
      throw answerError || conversationError || experimentError || eventsError || flowError || experimentsError || insightError || profileError || reflectionError || learningError || resourceError;
    }
    const uniqueDays = [...new Set((events || []).map((event: { event_date: string }) => event.event_date))];
    let streak = 0;
    const cursor = new Date();
    for (const day of uniqueDays) {
      if (day === dateKey(cursor)) {
        streak += 1;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      } else if (day < dateKey(cursor)) break;
    }
    let questionnaireProgress = 0;
    if (flow) {
      const [{ data: questionRows, error: questionError }, { data: answerRows, error: flowAnswerError }] = await Promise.all([
        supabase.from('questions').select('id, question_key, answer_type, options, branch_rules, ordinal, is_required').eq('flow_version_id', flow.id).order('ordinal', { ascending: true }),
        supabase.from('user_answers').select('question_id, answer').eq('user_id', user.id).eq('flow_version_id', flow.id).is('deleted_at', null),
      ]);
      if (questionError || flowAnswerError) throw questionError || flowAnswerError;
      const rows = (questionRows || []) as Array<{ id: string; question_key: string; answer_type: string; options: unknown; branch_rules: unknown; ordinal: number; is_required: boolean }>;
      const questions = rows.map((row): QuestionItem => ({
        id: row.id,
        questionKey: row.question_key,
        title: '',
        answerType: row.answer_type as QuestionItem['answerType'],
        options: Array.isArray(row.options) ? row.options as QuestionItem['options'] : [],
        branchRules: Array.isArray(row.branch_rules) ? row.branch_rules as BranchRule[] : [],
        ordinal: row.ordinal,
        isRequired: row.is_required,
      }));
      const questionById = new Map(questions.map((question) => [question.id, question]));
      const answerMap: Record<string, unknown> = {};
      (answerRows || []).forEach((row: { question_id: string; answer: unknown }) => {
        const question = questionById.get(row.question_id);
        if (question) answerMap[question.questionKey] = row.answer;
      });
      const eligibleIds = computeEligibleQuestions(questions, answerMap);
      const answeredCount = eligibleIds.filter((id) => {
        const question = questionById.get(id);
        return question ? Object.prototype.hasOwnProperty.call(answerMap, question.questionKey) : false;
      }).length;
      questionnaireProgress = eligibleIds.length ? Math.min(100, Math.round((answeredCount / eligibleIds.length) * 100)) : 0;
    }
    const activeExperiment = (experimentRows || []).find((experiment: { status: string }) => experiment.status === 'active') as { progress_percent?: number } | undefined;
    const completedExperiments = (experimentRows || []).filter((experiment: { status: string }) => experiment.status === 'completed').length;
    return NextResponse.json({
      data: {
        streak,
        answers: answerCount || 0,
        conversations: conversationCount || 0,
        experiments: experimentCount || 0,
        questionnaireProgress,
        activeDays: uniqueDays.length,
        activeExperimentProgress: activeExperiment?.progress_percent || 0,
        completedExperiments,
        confirmedInsights: confirmedInsightCount || 0,
        confirmedProfiles: confirmedProfileCount || 0,
        reflections: reflectionCount || 0,
        confirmedLearnings: confirmedLearningCount || 0,
        resources: resourceCount || 0,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'AUTH_REQUIRED') return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    console.error('PROGRESS_UNAVAILABLE', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'PROGRESS_UNAVAILABLE' }, { status: 503 });
  }
}
