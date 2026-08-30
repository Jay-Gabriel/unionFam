import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/current-user';

export const dynamic = 'force-dynamic';

function failure(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : '';
  if (message === 'AUTH_REQUIRED') return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  console.error(fallback, error instanceof Error ? error.name : 'UnknownError');
  return NextResponse.json({ error: fallback }, { status: 503 });
}

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = createClient();
    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, status, current_stage, prompt_version, last_message_at, created_at, updated_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (error) {
    return failure(error, 'CONVERSATIONS_UNAVAILABLE');
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const title = typeof body.title === 'string' && body.title.trim().length > 0
      ? body.title.trim().slice(0, 160)
      : 'Cuộc trò chuyện mới';
    const supabase = createClient();

    const { data: flow } = await supabase
      .from('question_flow_versions')
      .select('id')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title,
        current_stage: 'onboarding',
        question_flow_version_id: flow?.id || null,
      })
      .select('id, title, status, current_stage, prompt_version, question_flow_version_id, last_message_at, created_at, updated_at')
      .single();

    if (error || !data) throw error || new Error('CONVERSATION_CREATE_FAILED');

    await supabase.from('activity_events').insert({
      user_id: user.id,
      event_type: 'conversation_created',
      metadata: { conversation_id: data.id },
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return failure(error, 'CONVERSATION_CREATE_FAILED');
  }
}
