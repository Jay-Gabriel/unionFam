import { NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth/current-user';
import { createAdminClient } from '@/server/db/admin';

export const dynamic = 'force-dynamic';

function maskEmail(email: string | undefined) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${(local || '').slice(0, 2)}***@${domain}`;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Detailed admin inspection is intentionally a separate endpoint. The caller
 * must provide a reason, and the audit row is written before any answer data
 * is returned. The browser never receives the service-role client.
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!isUuid(params.id)) return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });

    const reason = new URL(request.url).searchParams.get('reason')?.trim() || '';
    if (reason.length < 3 || reason.length > 240) {
      return NextResponse.json({ error: 'AUDIT_REASON_REQUIRED' }, { status: 422 });
    }

    const service = createAdminClient();
    const [{ data: authResult, error: authError }, { data: profile, error: profileError }, { data: answers, error: answersError }, { data: conversations, error: conversationsError }] = await Promise.all([
      service.auth.admin.getUserById(params.id),
      service.from('profiles').select('id, display_name, onboarding_status, consented_at, locale, timezone, created_at, updated_at').eq('id', params.id).maybeSingle(),
      service.from('user_answers').select('id, flow_version_id, question_id, answer, answered_at, updated_at').eq('user_id', params.id).is('deleted_at', null).order('answered_at', { ascending: false }).limit(200),
      service.from('conversations').select('id, title, status, current_stage, prompt_version, last_message_at, created_at').eq('user_id', params.id).is('deleted_at', null).order('last_message_at', { ascending: false }).limit(50),
    ]);

    if (authError || !authResult.user) return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
    if (profileError || answersError || conversationsError) {
      throw profileError || answersError || conversationsError;
    }

    const questionIds = [...new Set((answers || []).map((answer: { question_id: string }) => answer.question_id))];
    const { data: questions, error: questionsError } = questionIds.length
      ? await service.from('questions').select('id, question_key, title').in('id', questionIds)
      : { data: [], error: null };
    if (questionsError) throw questionsError;
    const questionById = new Map((questions || []).map((question: { id: string; question_key: string; title: string }) => [question.id, question]));

    await service.from('admin_access_logs').insert({
      admin_id: admin.id,
      target_user_id: params.id,
      resource_type: 'user_detail',
      action: 'read_sensitive_preview',
      reason: reason.slice(0, 240),
    });

    return NextResponse.json({
      data: {
        user: {
          id: authResult.user.id,
          email: maskEmail(authResult.user.email),
          createdAt: authResult.user.created_at,
          lastSignInAt: authResult.user.last_sign_in_at || null,
        },
        profile: profile || null,
        answers: (answers || []).map((answer: { id: string; question_id: string; answer: unknown; answered_at: string; updated_at: string }) => ({
          id: answer.id,
          questionId: answer.question_id,
          questionKey: questionById.get(answer.question_id)?.question_key || '',
          questionTitle: questionById.get(answer.question_id)?.title || '',
          answer: answer.answer,
          answeredAt: answer.answered_at,
          updatedAt: answer.updated_at,
        })),
        conversations: conversations || [],
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message === 'AUTH_REQUIRED' || error.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    console.error('ADMIN_USER_DETAIL_FAILED', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'ADMIN_USER_DETAIL_UNAVAILABLE' }, { status: 503 });
  }
}
