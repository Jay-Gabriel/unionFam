import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/current-user';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    const { data, error } = await createClient()
      .from('life_profile_versions')
      .select('id, version_no, status, snapshot, source_answer_ids, source_insight_ids, created_by, is_current, created_at, updated_at')
      .eq('user_id', user.id)
      .order('version_no', { ascending: false })
      .limit(20);
    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (error) {
    if (error instanceof Error && error.message === 'AUTH_REQUIRED') return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    console.error('LIFE_PROFILE_HISTORY_FAILED', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'LIFE_PROFILE_HISTORY_UNAVAILABLE' }, { status: 503 });
  }
}
