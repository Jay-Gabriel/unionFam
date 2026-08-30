import { createClient } from '@/lib/supabase/server';

export interface VerifiedUser {
  id: string;
  email: string;
  role: 'member' | 'admin';
}

export async function requireUser(): Promise<VerifiedUser> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('AUTH_REQUIRED');
  }

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  const role = (roleRow as { role: string } | null)?.role === 'admin' ? 'admin' : 'member';

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
