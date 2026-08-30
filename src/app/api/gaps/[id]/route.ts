import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/current-user';

export const dynamic = 'force-dynamic';

function fail(error: unknown, fallback: string) {
  if (error instanceof Error && error.message === 'AUTH_REQUIRED') return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  console.error(fallback, error instanceof Error ? error.name : 'UnknownError');
  return NextResponse.json({ error: fallback }, { status: 503 });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.title === 'string') {
      const title = body.title.trim();
      if (!title || title.length > 240) return NextResponse.json({ error: 'INVALID_GAP' }, { status: 422 });
      patch.title = title;
    }
    if (typeof body.currentState === 'string') {
      const currentState = body.currentState.trim();
      if (!currentState || currentState.length > 2000) return NextResponse.json({ error: 'INVALID_GAP' }, { status: 422 });
      patch.current_state = currentState;
    }
    if (typeof body.desiredState === 'string') {
      const desiredState = body.desiredState.trim();
      if (!desiredState || desiredState.length > 2000) return NextResponse.json({ error: 'INVALID_GAP' }, { status: 422 });
      patch.desired_state = desiredState;
    }
    if (typeof body.dimension === 'string') patch.dimension = body.dimension.slice(0, 64);
    if (Number.isInteger(body.priority) && body.priority >= 1 && body.priority <= 5) patch.priority = body.priority;
    if (['open', 'in_progress', 'closed', 'dismissed'].includes(body.status)) patch.status = body.status;
    if (Object.keys(patch).length === 1) return NextResponse.json({ error: 'NO_CHANGES' }, { status: 400 });

    const { data, error } = await createClient()
      .from('gaps')
      .update(patch)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .select('id, dimension, title, current_state, desired_state, priority, status, source_insight_id, created_at, updated_at')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'GAP_NOT_FOUND' }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    return fail(error, 'GAP_UPDATE_FAILED');
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { data, error } = await createClient()
      .from('gaps')
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'GAP_NOT_FOUND' }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch (error) {
    return fail(error, 'GAP_DELETE_FAILED');
  }
}
