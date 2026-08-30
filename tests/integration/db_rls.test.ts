import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Integration credentials are intentionally opt-in; unit/CI runs without them
// must skip this suite before any Supabase client is constructed.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasIntegrationCredentials = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE
);

let serviceClient: ReturnType<typeof createClient>;

// Helpers to get authenticated clients
async function createTestUserAndClient(email: string) {
  const { data: authData, error: authErr } = await serviceClient.auth.admin.createUser({
    email,
    password: 'Password123!',
    email_confirm: true,
  });

  if (authErr) throw authErr;

  const user = authData.user;
  
  // Create member client
  const client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  
  const { error: signInErr } = await client.auth.signInWithPassword({ email, password: 'Password123!' });
  if (signInErr) throw signInErr;
  
  return { user, client };
}

describe.skipIf(!hasIntegrationCredentials)('PostgreSQL RLS Integration', () => {
  let userA: any;
  let clientA: any;
  let userB: any;
  let clientB: any;

  beforeAll(async () => {
    serviceClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const resA = await createTestUserAndClient(`test_user_a_${Date.now()}@example.com`);
    userA = resA.user;
    clientA = resA.client;

    const resB = await createTestUserAndClient(`test_user_b_${Date.now()}@example.com`);
    userB = resB.user;
    clientB = resB.client;
  });

  it('should enforce user isolation and reject cross-user select/insert', async () => {
    if (!clientA) return; // Skip if no DB

    // User A creates a conversation
    const { data: convA, error: errConvA } = await clientA
      .from('conversations')
      .insert({ user_id: userA.id, title: 'User A Conversation' })
      .select('id')
      .single();

    expect(errConvA).toBeNull();
    expect(convA).toBeDefined();

    // User B tries to read User A's conversation
    const { data: readConvB } = await clientB
      .from('conversations')
      .select('*')
      .eq('id', convA.id);

    expect(readConvB).toEqual([]);

    // User B tries to insert a message into User A's conversation
    const { error: errForgeMsg } = await clientB
      .from('messages')
      .insert({
        user_id: userA.id, // Forge ID
        conversation_id: convA.id,
        role: 'user',
        content: 'Malicious message',
        sequence_no: 1,
      });

    // Should fail RLS WITH CHECK (auth.uid() = user_id)
    expect(errForgeMsg).not.toBeNull();
    expect(errForgeMsg?.code).toBe('42501');

    // User B tries to use their own user_id but User A's conversation_id
    const { error: errCrossFk } = await clientB
      .from('messages')
      .insert({
        user_id: userB.id,
        conversation_id: convA.id,
        role: 'user',
        content: 'Cross message',
        sequence_no: 1,
      });

    // Should fail Composite FK `fk_messages_conversation`
    expect(errCrossFk).not.toBeNull();
    expect(errCrossFk?.code).toBe('23503'); // foreign_key_violation
  });

  it('should restrict direct client mutations on ai_observations table', async () => {
    if (!clientA) return; // Skip if no DB

    const { error: errObs } = await clientA
      .from('ai_observations')
      .insert({
        user_id: userA.id,
        conversation_id: '11111111-1111-1111-1111-111111111111', // Fake UUID
        dimension: 'wealth',
        content_original: 'Test',
      });

    // Should fail RLS WITH CHECK (only SELECT is enabled for member)
    expect(errObs).not.toBeNull();
    expect(errObs?.code).toBe('42501');
  });
});
