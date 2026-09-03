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

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const perPage = Math.min(50, Math.max(1, Number(url.searchParams.get('perPage') || 25)));
    const service = createAdminClient();

    const [{ data: authUsers, error: usersError }, { data: profiles, error: profilesError }, { data: conversations, error: conversationsError }, { data: errors, error: errorsError }, { data: aiErrors, error: aiErrorsError }, { data: auditLogs, error: auditError }] = await Promise.all([
      service.auth.admin.listUsers({ page, perPage }),
      service.from('profiles').select('id, display_name, onboarding_status, created_at, updated_at'),
      service.from('conversations').select('id, user_id, title, status, current_stage, last_message_at, created_at').is('deleted_at', null).order('last_message_at', { ascending: false }).limit(100),
      service.from('application_errors').select('id, error_code, route, created_at, request_id').order('created_at', { ascending: false }).limit(100),
      service.from('ai_run_logs').select('id, provider, model, status, error_code, latency_ms, created_at, request_id').order('created_at', { ascending: false }).limit(100),
      service.from('admin_access_logs').select('id, admin_id, target_user_id, resource_type, action, reason, created_at').order('created_at', { ascending: false }).limit(100),
    ]);
    if (usersError) throw usersError;
    if (profilesError || conversationsError || errorsError || aiErrorsError || auditError) {
      throw profilesError || conversationsError || errorsError || aiErrorsError || auditError;
    }

    const profileById = new Map((profiles || []).map((profile: { id: string; display_name: string; onboarding_status: string; created_at: string }) => [profile.id, profile]));
    const answerCounts = new Map<string, number>();
    const userIds = (authUsers?.users || []).map((user) => user.id);
    if (userIds.length) {
      const { data: answers } = await service.from('user_answers').select('user_id').in('user_id', userIds).is('deleted_at', null);
      (answers || []).forEach((answer: { user_id: string }) => answerCounts.set(answer.user_id, (answerCounts.get(answer.user_id) || 0) + 1));
    }
    const { data: roleRows, error: rolesError } = userIds.length
      ? await service.from('user_roles').select('user_id, role').in('user_id', userIds)
      : { data: [], error: null };
    if (rolesError) throw rolesError;
    // A full admin can also carry the content-admin role. Keep the stronger
    // role deterministic regardless of database row ordering.
    const roleByUserId = new Map<string, string>();
    (roleRows || []).forEach((row: { user_id: string; role: string }) => {
      const current = roleByUserId.get(row.user_id);
      if (!current || row.role === 'admin') roleByUserId.set(row.user_id, row.role);
    });

    await service.from('admin_access_logs').insert({
      admin_id: admin.id,
      resource_type: 'admin_overview',
      action: 'list',
      reason: url.searchParams.get('reason')?.slice(0, 240) || 'Operational dashboard review',
    });

    return NextResponse.json({
      data: {
        users: (authUsers?.users || []).map((user) => ({
          id: user.id,
          email: maskEmail(user.email),
          role: roleByUserId.get(user.id) || 'member',
          joinedAt: user.created_at,
          displayName: profileById.get(user.id)?.display_name || '',
          onboardingStatus: profileById.get(user.id)?.onboarding_status || 'not_started',
          answersCount: answerCounts.get(user.id) || 0,
        })),
        sessions: conversations || [],
        errors: [...(errors || []), ...(aiErrors || []).map((error: { id: string; error_code: string | null; request_id: string; created_at: string; route?: string }) => ({
          id: error.id,
          error_code: error.error_code || 'AI_ERROR',
          route: error.route || '/api/chat',
          request_id: error.request_id,
          created_at: error.created_at,
        }))],
        auditLogs: auditLogs || [],
        pagination: { page, perPage, total: authUsers?.total || authUsers?.users.length || 0 },
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message === 'AUTH_REQUIRED' || error.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    console.error('ADMIN_OVERVIEW_FAILED', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'ADMIN_OVERVIEW_UNAVAILABLE' }, { status: 503 });
  }
}
