import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/current-user';

export const dynamic = 'force-dynamic';

function fail(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : '';
  if (message === 'AUTH_REQUIRED') return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  if (message.includes('LEARNING_NOT_FOUND')) return NextResponse.json({ error: 'LEARNING_NOT_FOUND' }, { status: 404 });
  if (message.includes('LEARNING_ALREADY_PROCESSED')) return NextResponse.json({ error: 'LEARNING_ALREADY_PROCESSED' }, { status: 409 });
  if (message.includes('INVALID_LEARNING_DECISION') || message.includes('EDITED_CONTENT_TOO_LONG') || message.includes('INVALID_IDEMPOTENCY_KEY')) return NextResponse.json({ error: 'INVALID_LEARNING_DECISION' }, { status: 422 });
  console.error(fallback, error instanceof Error ? error.name : 'UnknownError');
  return NextResponse.json({ error: fallback }, { status: 503 });
}

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = createClient();
    const { data, error } = await supabase
      .from('learning_records')
      .select('id, source_reflection_id, content, status, confirmed_at, created_at, updated_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (error) {
    return fail(error, 'LEARNINGS_UNAVAILABLE');
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const learningId = typeof body.learningId === 'string' ? body.learningId : '';
    const decision = body.decision === 'confirmed' || body.decision === 'rejected' ? body.decision : '';
    if (!learningId || !decision) return NextResponse.json({ error: 'INVALID_LEARNING_DECISION' }, { status: 400 });
    const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim() : null;
    if (idempotencyKey && idempotencyKey.length > 128) return NextResponse.json({ error: 'INVALID_IDEMPOTENCY_KEY' }, { status: 422 });
    const { data, error } = await createClient().rpc('decide_learning_atomic', {
      p_learning_id: learningId,
      p_decision: decision,
      p_edited_content: typeof body.editedContent === 'string' ? body.editedContent : null,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw error;
    await createClient().from('activity_events').insert({
      user_id: user.id,
      event_type: 'learning_decided',
      metadata: { learning_id: learningId, decision },
    });
    return NextResponse.json({ data });
  } catch (error) {
    return fail(error, 'LEARNING_DECISION_FAILED');
  }
}
