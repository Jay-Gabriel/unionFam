import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/current-user';
import {
  emptyLifeProfileSnapshot,
  LifeProfileSnapshotSchema,
  mergeInsightsIntoProfile,
} from '@/server/domain/profile';

export const dynamic = 'force-dynamic';

function responseError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : '';
  if (message === 'AUTH_REQUIRED') return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  if (message.includes('INVALID_PROFILE_') || message.includes('INVALID_IDEMPOTENCY_KEY')) {
    return NextResponse.json({ error: 'INVALID_PROFILE_SNAPSHOT' }, { status: 422 });
  }
  console.error(fallback, error instanceof Error ? error.name : 'UnknownError');
  return NextResponse.json({ error: fallback }, { status: 503 });
}

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = createClient();
    const [{ data: current, error: currentError }, { data: draft, error: draftError }, { data: insights, error: insightsError }] = await Promise.all([
      supabase
        .from('life_profile_versions')
        .select('id, version_no, status, snapshot, source_answer_ids, source_insight_ids, created_by, is_current, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .eq('is_current', true)
        .maybeSingle(),
      supabase
        .from('life_profile_versions')
        .select('id, version_no, status, snapshot, source_answer_ids, source_insight_ids, created_by, is_current, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('confirmed_insights')
        .select('id, dimension, content, evidence_message_ids, confirmed_at')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('confirmed_at', { ascending: false }),
    ]);
    if (currentError || draftError || insightsError) throw currentError || draftError || insightsError;

    const parsedCurrent = current ? LifeProfileSnapshotSchema.safeParse(current.snapshot) : null;
    const parsedDraft = draft ? LifeProfileSnapshotSchema.safeParse(draft.snapshot) : null;
    let snapshot = mergeInsightsIntoProfile(emptyLifeProfileSnapshot(), insights || []);
    if (parsedCurrent?.success) snapshot = parsedCurrent.data;
    if (parsedDraft?.success) snapshot = parsedDraft.data;
    return NextResponse.json({ data: { current: current || null, draft: draft || null, snapshot, insights: insights || [] } });
  } catch (error) {
    return responseError(error, 'LIFE_PROFILE_UNAVAILABLE');
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const action = body.action === 'draft' ? 'draft' : body.action === 'confirm' ? 'confirm' : '';
    if (!action) return NextResponse.json({ error: 'INVALID_PROFILE_ACTION' }, { status: 400 });

    const parsed = LifeProfileSnapshotSchema.safeParse(body.snapshot);
    if (!parsed.success) return NextResponse.json({ error: 'INVALID_PROFILE_SNAPSHOT' }, { status: 422 });
    const supabase = createClient();
    const isUuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    const rawSourceAnswerIds = body.sourceAnswerIds === undefined ? [] : body.sourceAnswerIds;
    const rawSourceInsightIds = body.sourceInsightIds === undefined ? [] : body.sourceInsightIds;
    if (!Array.isArray(rawSourceAnswerIds) || !Array.isArray(rawSourceInsightIds) || rawSourceAnswerIds.length > 100 || rawSourceInsightIds.length > 100 || rawSourceAnswerIds.some((id) => !isUuid(id)) || rawSourceInsightIds.some((id) => !isUuid(id))) {
      return NextResponse.json({ error: 'INVALID_PROFILE_SOURCE' }, { status: 422 });
    }
    const sourceAnswerIds = rawSourceAnswerIds as string[];
    const sourceInsightIds = rawSourceInsightIds as string[];
    const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim() : null;
    if (idempotencyKey && idempotencyKey.length > 128) {
      return NextResponse.json({ error: 'INVALID_IDEMPOTENCY_KEY' }, { status: 422 });
    }

    if (action === 'confirm') {
      const { data, error } = await supabase.rpc('confirm_life_profile', {
        p_snapshot: parsed.data,
        p_source_answer_ids: sourceAnswerIds,
        p_source_insight_ids: sourceInsightIds,
        p_idempotency_key: idempotencyKey,
      });
      if (error) throw error;
      return NextResponse.json({ data }, { status: 201 });
    }

    const { data, error } = await supabase.rpc('save_life_profile_draft', {
      p_snapshot: parsed.data,
      p_source_answer_ids: sourceAnswerIds,
      p_source_insight_ids: sourceInsightIds,
    });
    if (error || !data) throw error || new Error('PROFILE_DRAFT_SAVE_FAILED');
    return NextResponse.json({ data });
  } catch (error) {
    return responseError(error, 'LIFE_PROFILE_SAVE_FAILED');
  }
}
