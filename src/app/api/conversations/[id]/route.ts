import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/current-user';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = ['active', 'paused', 'completed', 'archived'] as const;

function routeError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : '';
  if (message === 'AUTH_REQUIRED') return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  console.error(fallback, error instanceof Error ? error.name : 'UnknownError');
  return NextResponse.json({ error: fallback }, { status: 503 });
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    if (!params.id || params.id === 'new') {
      return NextResponse.json({ error: 'CONVERSATION_ID_REQUIRED' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, title, status, current_stage, prompt_version, question_flow_version_id, last_message_at, created_at, updated_at')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (conversationError) throw conversationError;
    if (!conversation) return NextResponse.json({ error: 'CONVERSATION_NOT_FOUND' }, { status: 404 });

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, role, content, status, sequence_no, created_at, updated_at')
      .eq('conversation_id', params.id)
      .eq('user_id', user.id)
      .order('sequence_no', { ascending: true })
      .limit(100);

    if (messagesError) throw messagesError;

    const { data: observations, error: observationsError } = await supabase
      .from('ai_observations')
      .select('id, assistant_message_id, dimension, content_original, content_user_edited, status, confidence')
      .eq('conversation_id', params.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (observationsError) throw observationsError;

    return NextResponse.json({ data: { conversation, messages: messages || [], observations: observations || [] } });
  } catch (error) {
    return routeError(error, 'CONVERSATION_UNAVAILABLE');
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const patch: Record<string, string> = {};

    if (typeof body.title === 'string') {
      const title = body.title.trim();
      if (!title || title.length > 160) return NextResponse.json({ error: 'INVALID_TITLE' }, { status: 422 });
      patch.title = title;
    }

    if (typeof body.status === 'string') {
      if (!ALLOWED_STATUSES.includes(body.status as (typeof ALLOWED_STATUSES)[number])) {
        return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 422 });
      }
      patch.status = body.status;
    }

    if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'NO_CHANGES' }, { status: 400 });

    const supabase = createClient();
    const { data, error } = await supabase
      .from('conversations')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .select('id, title, status, current_stage, prompt_version, question_flow_version_id, last_message_at, created_at, updated_at')
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'CONVERSATION_NOT_FOUND' }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    return routeError(error, 'CONVERSATION_UPDATE_FAILED');
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const supabase = createClient();
    const { error } = await supabase
      .from('conversations')
      .update({ deleted_at: new Date().toISOString(), status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('deleted_at', null);
    if (error) throw error;
    return new Response(null, { status: 204 });
  } catch (error) {
    return routeError(error, 'CONVERSATION_DELETE_FAILED');
  }
}
