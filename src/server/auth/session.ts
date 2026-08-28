import { cookies } from 'next/headers';

export interface UserSession {
  userId: string;
  email: string;
  role: 'member' | 'admin';
}

export async function getCurrentUserSession(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('lifelab_session')?.value || cookieStore.get('sb-access-token')?.value;
  const roleCookie = cookieStore.get('lifelab_user_role')?.value;

  if (!sessionCookie) {
    return null;
  }

  const role = roleCookie === 'admin' ? 'admin' : 'member';
  const userId = sessionCookie === 'admin@unionfam.com' ? 'admin-user-001' : 'member-user-001';

  return {
    userId,
    email: sessionCookie,
    role,
  };
}

export async function requireUserSession(): Promise<UserSession> {
  const session = await getCurrentUserSession();
  if (!session) {
    throw new Error('AUTH_REQUIRED');
  }
  return session;
}

export async function requireAdminRole(): Promise<UserSession> {
  const session = await requireUserSession();
  if (session.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
  return session;
}
