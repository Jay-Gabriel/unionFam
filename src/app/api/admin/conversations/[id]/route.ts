import { NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth/current-user';
import { createAdminClient } from '@/server/db/admin';

export const dynamic = 'force-dynamic';

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    if (!isUuid(params.id)) {
      return NextResponse.json({ error: 'CONVERSATION_NOT_FOUND' }, { status: 404 });
    }

    const reason = new URL(request.url).searchParams.get('reason')?.trim() || 'Admin customer conversation tracking';
    const service = createAdminClient();

    // 1. Fetch conversation
    const { data: conversation, error: convError } = await service
      .from('conversations')
      .select('id, user_id, title, status, current_stage, prompt_version, question_flow_version_id, last_message_at, created_at, updated_at')
      .eq('id', params.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (convError) throw convError;
    if (!conversation) {
      return NextResponse.json({ error: 'CONVERSATION_NOT_FOUND' }, { status: 404 });
    }

    // 2. Fetch user profile, auth info, messages, observations in parallel
    const [
      authResult,
      { data: profile },
      { data: messages, error: msgError },
      { data: observations, error: obsError },
    ] = await Promise.all([
      service.auth.admin.getUserById(conversation.user_id),
      service
        .from('profiles')
        .select('id, display_name, onboarding_status, locale, timezone, created_at')
        .eq('id', conversation.user_id)
        .maybeSingle(),
      service
        .from('messages')
        .select('id, role, content, status, sequence_no, created_at, updated_at')
        .eq('conversation_id', params.id)
        .order('sequence_no', { ascending: true })
        .limit(300),
      service
        .from('ai_observations')
        .select('id, assistant_message_id, dimension, content_original, content_user_edited, status, confidence, created_at')
        .eq('conversation_id', params.id)
        .order('created_at', { ascending: true }),
    ]);

    if (msgError) throw msgError;
    if (obsError) throw obsError;

    // 3. Log access audit
    await service.from('admin_access_logs').insert({
      admin_id: admin.id,
      target_user_id: conversation.user_id,
      resource_type: 'conversation_messages',
      action: 'read_conversation',
      reason: reason.slice(0, 240),
    });

    return NextResponse.json({
      data: {
        conversation,
        user: {
          id: conversation.user_id,
          email: authResult?.data?.user?.email || '—',
          displayName: profile?.display_name || '—',
          onboardingStatus: profile?.onboarding_status || 'not_started',
          createdAt: authResult?.data?.user?.created_at || profile?.created_at || null,
        },
        messages: messages || [],
        observations: observations || [],
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message === 'AUTH_REQUIRED' || error.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    console.error('ADMIN_CONVERSATION_GET_FAILED', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'ADMIN_CONVERSATION_UNAVAILABLE' }, { status: 503 });
  }
}
