import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/server/db/admin';

const PREVIEW_EMAIL = 'preview@lifelab.test';
const PREVIEW_PASSWORD = 'LifeLabPreview-2026!';

function previewAuthEnabled() {
  return process.env.NODE_ENV !== 'production'
    && process.env.AUTH_REQUIRED !== 'true'
    && process.env.DEV_PREVIEW_AUTH !== 'false';
}

async function ensurePreviewUser() {
  const admin = createAdminClient();
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listed.error) throw listed.error;

  let previewUser = listed.data.users.find((candidate) => candidate.email === PREVIEW_EMAIL);
  if (!previewUser) {
    const created = await admin.auth.admin.createUser({
      email: PREVIEW_EMAIL,
      password: PREVIEW_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: 'Preview User', preview: true },
    });
    if (created.error && created.error.code !== 'email_exists') throw created.error;
    previewUser = created.data.user || undefined;
  }

  // A user created by an earlier local run may have an unknown password. Keep
  // the deterministic preview credential usable without exposing it to the UI.
  if (previewUser) {
    const updated = await admin.auth.admin.updateUserById(previewUser.id, {
      password: PREVIEW_PASSWORD,
      email_confirm: true,
      user_metadata: { ...previewUser.user_metadata, display_name: 'Preview User', preview: true },
    });
    if (updated.error) throw updated.error;
    return updated.data.user || previewUser;
  }

  // Two API requests can bootstrap the preview user concurrently. Re-read
  // after an email_exists response and use the canonical row.
  const retry = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (retry.error) throw retry.error;
  const found = retry.data.users.find((candidate) => candidate.email === PREVIEW_EMAIL);
  if (!found) throw new Error('PREVIEW_USER_CREATE_FAILED');
  const updated = await admin.auth.admin.updateUserById(found.id, {
    password: PREVIEW_PASSWORD,
    email_confirm: true,
    user_metadata: { ...found.user_metadata, display_name: 'Preview User', preview: true },
  });
  if (updated.error) throw updated.error;
  return updated.data.user || found;
}

export interface VerifiedUser {
  id: string;
  email: string;
  role: 'member' | 'admin' | 'content_admin';
}

export async function requireUser(): Promise<VerifiedUser> {
  const supabase = createClient();
  let {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if ((error || !user) && previewAuthEnabled()) {
    try {
      await ensurePreviewUser();
      const previewSession = await supabase.auth.signInWithPassword({
        email: PREVIEW_EMAIL,
        password: PREVIEW_PASSWORD,
      });
      if (!previewSession.error && previewSession.data.user) {
        user = previewSession.data.user;
        error = null;
      }
    } catch {
      // Preview auth is best-effort. If the service key is unavailable, keep
      // the normal AUTH_REQUIRED contract instead of exposing setup details.
    }
  }

  if (error || !user) {
    throw new Error('AUTH_REQUIRED');
  }

  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['admin', 'content_admin']);

  // A full admin may also have the content-admin role. Keep the stronger role
  // when both rows exist so existing admin protections are never downgraded.
  const roles = (roleRows || []).map((row) => (row as { role: string }).role);
  const role: VerifiedUser['role'] = roles.includes('admin')
    ? 'admin'
    : roles.includes('content_admin')
      ? 'content_admin'
      : 'member';

  return {
    id: user.id,
    email: user.email || '',
    role,
  };
}

export async function requireAdmin(): Promise<VerifiedUser> {
  const user = await requireUser();
  if (user.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
  return user;
}

/**
 * Content administrators can manage the editorial script library, but cannot
 * inspect users, sessions, or operational logs. Full admins retain access too.
 */
export async function requireContentAdmin(): Promise<VerifiedUser> {
  const user = await requireUser();
  if (user.role !== 'admin' && user.role !== 'content_admin') {
    throw new Error('FORBIDDEN');
  }
  return user;
}
