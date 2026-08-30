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
      .from('gaps')
      .select('id, dimension, title, current_state, desired_state, priority, status, source_insight_id, created_at, updated_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (error) {
    return fail(error, 'GAPS_UNAVAILABLE');
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const currentState = typeof body.currentState === 'string' ? body.currentState.trim() : '';
    const desiredState = typeof body.desiredState === 'string' ? body.desiredState.trim() : '';
    const priority = Number(body.priority ?? 3);
    if (!title || !currentState || !desiredState || title.length > 240 || currentState.length > 2000 || desiredState.length > 2000 || !Number.isInteger(priority) || priority < 1 || priority > 5) {
      return NextResponse.json({ error: 'INVALID_GAP' }, { status: 422 });
    }

    const { data, error } = await createClient()
      .from('gaps')
      .insert({
        user_id: user.id,
        dimension: typeof body.dimension === 'string' ? body.dimension.slice(0, 64) : 'other',
        title,
        current_state: currentState,
        desired_state: desiredState,
        priority,
        status: 'open',
        source_insight_id: typeof body.sourceInsightId === 'string' ? body.sourceInsightId : null,
      })
      .select('id, dimension, title, current_state, desired_state, priority, status, source_insight_id, created_at, updated_at')
      .single();
    if (error || !data) throw error || new Error('GAP_CREATE_FAILED');
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return fail(error, 'GAP_CREATE_FAILED');
  }
}
