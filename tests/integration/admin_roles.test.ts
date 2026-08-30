import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasIntegrationCredentials = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE
);

let serviceClient: ReturnType<typeof createClient>;

async function createTestUserAndClient(email: string) {
  const { data: authData, error: authErr } = await serviceClient.auth.admin.createUser({
    email,
    password: 'Password123!',
    email_confirm: true,
  });

  if (authErr) throw authErr;

  const user = authData.user;

  const client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: signInErr } = await client.auth.signInWithPassword({ email, password: 'Password123!' });
  if (signInErr) throw signInErr;

  return { user, client };
}

describe.skipIf(!hasIntegrationCredentials)('Admin Roles Integration', () => {
  let adminUser: any;
  let adminClient: any;
  let memberUser: any;
  let memberClient: any;

  beforeAll(async () => {
    serviceClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const resAdmin = await createTestUserAndClient(`test_admin_${Date.now()}@example.com`);
    adminUser = resAdmin.user;
    adminClient = resAdmin.client;

    const resMember = await createTestUserAndClient(`test_member_${Date.now()}@example.com`);
    memberUser = resMember.user;
    memberClient = resMember.client;

    // Grant admin role via service client
    const { error: grantErr } = await serviceClient
      .from('user_roles')
      .insert({
        user_id: adminUser.id,
        role: 'admin',
      } as any);

    expect(grantErr).toBeNull();
  });

  it('should restrict member from accessing admin access logs', async () => {
    if (!memberClient) return;

    // Member attempts to read admin logs
    const { data, error: errMemberRead } = await memberClient
      .from('admin_access_logs')
      .select('*');

    expect(errMemberRead).toBeNull();
    expect(data).toHaveLength(0);
  });

  it('should allow admin check via RPC', async () => {
    if (!adminClient || !memberClient) return;

    // Calling is_admin RPC as admin
    const { data: isAdminAdmin, error: errAdminRPC } = await adminClient.rpc('is_admin', {
      p_user_id: adminUser.id,
    });

    expect(errAdminRPC).toBeNull();
    expect(isAdminAdmin).toBe(true);

    // Calling is_admin RPC as member for their own id
    const { data: isAdminMember, error: errMemberRPC } = await memberClient.rpc('is_admin', {
      p_user_id: memberUser.id,
    });

    expect(errMemberRPC).toBeNull();
    expect(isAdminMember).toBe(false);
  });
});
