import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/current-user';

export const dynamic = 'force-dynamic';

function fail(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : '';
  if (message === 'AUTH_REQUIRED') return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  if (message.includes('EXPERIMENT_NOT_FOUND')) return NextResponse.json({ error: 'EXPERIMENT_NOT_FOUND' }, { status: 404 });
  if (message.includes('INVALID_EXPERIMENT_TRANSITION')) return NextResponse.json({ error: 'INVALID_EXPERIMENT_TRANSITION' }, { status: 409 });
  if (message.includes('INVALID_EXPERIMENT_PROGRESS') || message.includes('INVALID_EXPERIMENT_STATUS') || message.includes('INVALID_IDEMPOTENCY_KEY')) return NextResponse.json({ error: 'INVALID_EXPERIMENT_UPDATE' }, { status: 422 });
  console.error(fallback, error instanceof Error ? error.name : 'UnknownError');
  return NextResponse.json({ error: fallback }, { status: 503 });
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const supabase = createClient();
    const { data, error } = await supabase
      .from('experiments')
      .select('id, gap_id, title, hypothesis, smallest_step, success_signal, observation_focus, start_date, target_date, progress_percent, status, created_at, updated_at')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'EXPERIMENT_NOT_FOUND' }, { status: 404 });
    const { data: reflection } = await supabase
      .from('reflections')
      .select('id, result, learning_candidate, feeling, next_action, rating, created_at, updated_at')
      .eq('experiment_id', params.id)
      .eq('user_id', user.id)
      .maybeSingle();
    return NextResponse.json({ data: { experiment: data, reflection: reflection || null } });
  } catch (error) {
    return fail(error, 'EXPERIMENT_UNAVAILABLE');
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const supabase = createClient();

    if (typeof body.status === 'string') {
      const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim() : null;
      if (idempotencyKey && idempotencyKey.length > 128) {
        return NextResponse.json({ error: 'INVALID_IDEMPOTENCY_KEY' }, { status: 422 });
      }
      if (body.progressPercent !== undefined && body.progressPercent !== null
        && (!Number.isInteger(body.progressPercent) || body.progressPercent < 0 || body.progressPercent > 100)) {
        return NextResponse.json({ error: 'INVALID_EXPERIMENT_UPDATE' }, { status: 422 });
      }
      const { data, error } = await supabase.rpc('transition_experiment', {
        p_experiment_id: params.id,
        p_status: body.status,
        p_progress_percent: typeof body.progressPercent === 'number' ? body.progressPercent : null,
        p_idempotency_key: idempotencyKey,
      });
      if (error) throw error;
      await supabase.from('activity_events').insert({
        user_id: user.id,
        event_type: 'experiment_status_changed',
        metadata: { experiment_id: params.id, status: body.status },
      });
      return NextResponse.json({ data });
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.title === 'string') {
      const title = body.title.trim();
      if (!title || title.length > 240) return NextResponse.json({ error: 'INVALID_EXPERIMENT_UPDATE' }, { status: 422 });
      patch.title = title;
    }
    if (typeof body.hypothesis === 'string') {
      const hypothesis = body.hypothesis.trim();
      if (!hypothesis || hypothesis.length > 2000) return NextResponse.json({ error: 'INVALID_EXPERIMENT_UPDATE' }, { status: 422 });
      patch.hypothesis = hypothesis;
    }
    if (typeof body.smallestStep === 'string') {
      const smallestStep = body.smallestStep.trim();
      if (!smallestStep || smallestStep.length > 2000) return NextResponse.json({ error: 'INVALID_EXPERIMENT_UPDATE' }, { status: 422 });
      patch.smallest_step = smallestStep;
    }
    if (typeof body.successSignal === 'string') {
      const successSignal = body.successSignal.trim();
      if (!successSignal || successSignal.length > 2000) return NextResponse.json({ error: 'INVALID_EXPERIMENT_UPDATE' }, { status: 422 });
      patch.success_signal = successSignal;
    }
    if (typeof body.progressPercent === 'number' && Number.isInteger(body.progressPercent) && body.progressPercent >= 0 && body.progressPercent <= 100) patch.progress_percent = body.progressPercent;
    if (Object.keys(patch).length === 1) return NextResponse.json({ error: 'NO_CHANGES' }, { status: 400 });

    const { data, error } = await supabase
      .from('experiments')
      .update(patch)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .select('id, gap_id, title, hypothesis, smallest_step, success_signal, observation_focus, start_date, target_date, progress_percent, status, created_at, updated_at')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'EXPERIMENT_NOT_FOUND' }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    return fail(error, 'EXPERIMENT_UPDATE_FAILED');
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { data, error } = await createClient()
      .from('experiments')
      .update({ deleted_at: new Date().toISOString(), status: 'abandoned', updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'EXPERIMENT_NOT_FOUND' }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch (error) {
    return fail(error, 'EXPERIMENT_DELETE_FAILED');
  }
}
