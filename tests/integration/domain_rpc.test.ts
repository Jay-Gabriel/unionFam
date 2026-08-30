import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/lib/supabase/database.types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasIntegrationCredentials = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE);

describe.skipIf(!hasIntegrationCredentials)('Domain RPC transaction invariants', () => {
  let service: SupabaseClient<Database>;
  let userId = '';
  let member: SupabaseClient<Database>;

  beforeAll(async () => {
    service = createClient<Database>(SUPABASE_URL!, SUPABASE_SERVICE_ROLE!, { auth: { autoRefreshToken: false, persistSession: false } });
    const email = `rpc_${Date.now()}@example.com`;
    const { data, error } = await service.auth.admin.createUser({ email, password: 'Password123!', email_confirm: true });
    if (error || !data.user) throw error || new Error('TEST_USER_CREATE_FAILED');
    userId = data.user.id;
    member = createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
    const signIn = await member.auth.signInWithPassword({ email, password: 'Password123!' });
    if (signIn.error) throw signIn.error;
  });

  afterAll(async () => {
    if (userId) await service.auth.admin.deleteUser(userId);
  });

  it('returns one canonical profile for concurrent confirmation retries', async () => {
    const snapshot = {
      schema_version: 1,
      desire: 'Một nhịp sống đủ rộng để chăm sóc gia đình.',
      escape: '',
      life_vision: '',
      dimensions: {
        my_life: { summary: '', evidence_ids: [] },
        what_matters: { summary: '', evidence_ids: [] },
        my_ideal_day: { summary: '', evidence_ids: [] },
        what_it_takes: { summary: '', evidence_ids: [] },
        my_trade_offs: { summary: '', evidence_ids: [] },
        the_question: { summary: '', evidence_ids: [] },
      },
    };

    const results = await Promise.all([
      member.rpc('confirm_life_profile', { p_snapshot: snapshot, p_source_answer_ids: [], p_source_insight_ids: [], p_idempotency_key: 'same-profile-key' }),
      member.rpc('confirm_life_profile', { p_snapshot: snapshot, p_source_answer_ids: [], p_source_insight_ids: [], p_idempotency_key: 'same-profile-key' }),
    ]);

    expect(results.every((result) => !result.error)).toBe(true);
    expect(results[0].data).toEqual(results[1].data);
    const { data: versions, error } = await service.from('life_profile_versions').select('id').eq('user_id', userId).eq('status', 'confirmed');
    expect(error).toBeNull();
    expect(versions).toHaveLength(1);
  });

  it('rejects profile evidence owned by another user', async () => {
    const snapshot = {
      schema_version: 1,
      desire: '',
      escape: '',
      life_vision: '',
      dimensions: {
        my_life: { summary: '', evidence_ids: [] },
        what_matters: { summary: '', evidence_ids: [] },
        my_ideal_day: { summary: '', evidence_ids: [] },
        what_it_takes: { summary: '', evidence_ids: [] },
        my_trade_offs: { summary: '', evidence_ids: [] },
        the_question: { summary: '', evidence_ids: [] },
      },
    };
    const result = await member.rpc('confirm_life_profile', {
      p_snapshot: snapshot,
      p_source_answer_ids: ['11111111-1111-4111-8111-111111111111'],
      p_source_insight_ids: [],
      p_idempotency_key: 'invalid-evidence-key',
    });
    expect(result.error).not.toBeNull();
    expect(result.error?.message).toContain('INVALID_PROFILE_SOURCE_ANSWER');
  });
});
