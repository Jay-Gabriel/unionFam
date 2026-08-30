import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/current-user';

export const dynamic = 'force-dynamic';

function fail(error: unknown, fallback: string) {
  if (error instanceof Error && error.message === 'AUTH_REQUIRED') return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  console.error(fallback, error instanceof Error ? error.name : 'UnknownError');
  return NextResponse.json({ error: fallback }, { status: 503 });
}

export async function GET() {
  try {
    const user = await requireUser();
    const { data, error } = await createClient()
      .from('experiments')
      .select('id, gap_id, title, hypothesis, smallest_step, success_signal, observation_focus, start_date, target_date, progress_percent, status, created_at, updated_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (error) {
    return fail(error, 'EXPERIMENTS_UNAVAILABLE');
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const hypothesis = typeof body.hypothesis === 'string' ? body.hypothesis.trim() : '';
    const smallestStep = typeof body.smallestStep === 'string' ? body.smallestStep.trim() : '';
    const successSignal = typeof body.successSignal === 'string' ? body.successSignal.trim() : '';
    const startDate = typeof body.startDate === 'string' ? body.startDate : '';
    const targetDate = typeof body.targetDate === 'string' ? body.targetDate : '';
    if (!title || !hypothesis || !smallestStep || !successSignal || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate) || targetDate < startDate) {
      return NextResponse.json({ error: 'INVALID_EXPERIMENT' }, { status: 422 });
    }

    const { data, error } = await createClient()
      .from('experiments')
      .insert({
        user_id: user.id,
        gap_id: typeof body.gapId === 'string' ? body.gapId : null,
        title: title.slice(0, 240),
        hypothesis: hypothesis.slice(0, 2000),
        smallest_step: smallestStep.slice(0, 2000),
        success_signal: successSignal.slice(0, 2000),
        observation_focus: Array.isArray(body.observationFocus) ? body.observationFocus.slice(0, 20) : [],
        start_date: startDate,
        target_date: targetDate,
        progress_percent: 0,
        status: 'draft',
      })
      .select('id, gap_id, title, hypothesis, smallest_step, success_signal, observation_focus, start_date, target_date, progress_percent, status, created_at, updated_at')
      .single();
    if (error || !data) throw error || new Error('EXPERIMENT_CREATE_FAILED');
    await createClient().from('activity_events').insert({
      user_id: user.id,
      event_type: 'experiment_created',
      metadata: { experiment_id: data.id },
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return fail(error, 'EXPERIMENT_CREATE_FAILED');
  }
}
