import { NextResponse } from 'next/server';
import { processObservationDecision } from '@/server/domain/agency';
import { requireUser } from '@/server/auth/current-user';
import { createClient } from '@/lib/supabase/server';
import {
  emptyLifeProfileSnapshot,
  LifeProfileSnapshotSchema,
  mergeInsightsIntoProfile,
} from '@/server/domain/profile';

export const dynamic = 'force-dynamic';

async function syncProfileDraftFromConfirmedInsights(
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  const [{ data: current, error: currentError }, { data: draft, error: draftError }, { data: insights, error: insightsError }] = await Promise.all([
    supabase
      .from('life_profile_versions')
      .select('snapshot, source_answer_ids')
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .eq('is_current', true)
      .maybeSingle(),
    supabase
      .from('life_profile_versions')
      .select('snapshot, source_answer_ids')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('confirmed_insights')
      .select('id, dimension, content')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('confirmed_at', { ascending: false }),
  ]);

  if (currentError || draftError || insightsError) throw currentError || draftError || insightsError;
  const parsedDraft = draft ? LifeProfileSnapshotSchema.safeParse(draft.snapshot) : null;
  const parsedCurrent = current ? LifeProfileSnapshotSchema.safeParse(current.snapshot) : null;
  const base = parsedDraft?.success
    ? parsedDraft.data
    : parsedCurrent?.success
      ? parsedCurrent.data
      : emptyLifeProfileSnapshot();
  const snapshot = mergeInsightsIntoProfile(base, insights || []);
  const sourceAnswerIds = Array.isArray(draft?.source_answer_ids)
    ? draft.source_answer_ids
    : Array.isArray(current?.source_answer_ids)
      ? current.source_answer_ids
      : [];

  const { error: saveError } = await supabase.rpc('save_life_profile_draft', {
    p_snapshot: snapshot,
    p_source_answer_ids: sourceAnswerIds,
    p_source_insight_ids: (insights || []).map((insight) => insight.id),
  });
  if (saveError) throw saveError;
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 });
    }
    const { observationId, decision, editedContent, idempotencyKey } = body;

    if (typeof observationId !== 'string' || !['accepted', 'rejected'].includes(String(decision))) {
      return NextResponse.json({ error: 'INVALID_DECISION' }, { status: 422 });
    }
    if (editedContent !== undefined && editedContent !== null && (typeof editedContent !== 'string' || editedContent.trim().length > 1200)) {
      return NextResponse.json({ error: 'EDITED_CONTENT_TOO_LONG' }, { status: 422 });
    }
    if (idempotencyKey !== undefined && idempotencyKey !== null && (typeof idempotencyKey !== 'string' || idempotencyKey.trim().length > 128)) {
      return NextResponse.json({ error: 'INVALID_IDEMPOTENCY_KEY' }, { status: 422 });
    }

    const result = await processObservationDecision({
      userId: user.id,
      observationId,
      decision: decision as 'accepted' | 'rejected',
      editedContent,
      idempotencyKey,
    }, createClient());

    if (result.status === 'accepted') {
      // The draft is a derived, user-editable projection. A sync failure must
      // not roll back an already committed agency decision, so the canonical
      // insight remains available for the next manual Life Map save.
      try {
        await syncProfileDraftFromConfirmedInsights(createClient(), user.id);
      } catch (syncError) {
        console.error('LIFE_PROFILE_DRAFT_SYNC_FAILED', syncError instanceof Error ? syncError.name : 'UnknownError');
      }
    }

    return NextResponse.json({ data: result });
  } catch (err) {
    const code = err instanceof Error && 'code' in err ? String((err as Error & { code?: string }).code) : '';
    const message = err instanceof Error ? err.message : '';
    if (message === 'AUTH_REQUIRED' || message === 'UNAUTHORIZED_USER_DECISION') return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    if (message.includes('OBSERVATION_NOT_FOUND') || code === 'PGRST202') return NextResponse.json({ error: 'OBSERVATION_NOT_FOUND' }, { status: 404 });
    if (message.includes('ALREADY_PROCESSED') || message.includes('IDEMPOTENCY_KEY_REUSED')) return NextResponse.json({ error: 'OBSERVATION_ALREADY_PROCESSED' }, { status: 409 });
    if (message.includes('EDITED_CONTENT_TOO_LONG') || message.includes('INVALID_')) return NextResponse.json({ error: 'INVALID_DECISION' }, { status: 422 });
    console.error('OBSERVATION_DECISION_FAILED', code || 'UnknownError');
    return NextResponse.json({ error: 'OBSERVATION_DECISION_FAILED' }, { status: 503 });
  }
}
