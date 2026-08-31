import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/current-user';
import { isDemoMode } from '@/lib/demo-mode';

export const dynamic = 'force-dynamic';

function fail(error: unknown, fallback: string) {
  if (error instanceof Error && error.message === 'AUTH_REQUIRED') return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  console.error(fallback, error instanceof Error ? error.name : 'UnknownError');
  return NextResponse.json({ error: fallback }, { status: 503 });
}

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({
      data: {
        id: 'demo-user',
        display_name: '',
        locale: 'vi',
        timezone: 'Asia/Ho_Chi_Minh',
        onboarding_status: 'completed',
        consented_at: new Date().toISOString(),
      },
      demoMode: true,
    });
  }

  try {
    const user = await requireUser();
    const { data, error } = await createClient()
      .from('profiles')
      .select('id, display_name, locale, timezone, onboarding_status, consented_at, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ data: data || { id: user.id, onboarding_status: 'not_started', consented_at: null } });
  } catch (error) {
    return fail(error, 'ONBOARDING_UNAVAILABLE');
  }
}

export async function POST(request: Request) {
  if (isDemoMode()) {
    const body = await request.json().catch(() => ({}));
    if (body?.consented !== true) return NextResponse.json({ error: 'CONSENT_REQUIRED' }, { status: 422 });
    return NextResponse.json({
      data: {
        id: 'demo-user',
        display_name: typeof body?.displayName === 'string' ? body.displayName.trim().slice(0, 120) : '',
        locale: 'vi',
        timezone: 'Asia/Ho_Chi_Minh',
        onboarding_status: 'completed',
        consented_at: new Date().toISOString(),
      },
      demoMode: true,
    });
  }

  try {
    const user = await requireUser();
    const body = await request.json();
    if (body.consented !== true) return NextResponse.json({ error: 'CONSENT_REQUIRED' }, { status: 422 });
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim().slice(0, 120) : '';
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        display_name: displayName,
        onboarding_status: 'completed',
        consented_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id, display_name, locale, timezone, onboarding_status, consented_at, created_at, updated_at')
      .single();
    if (error || !data) throw error || new Error('ONBOARDING_SAVE_FAILED');
    await supabase.from('activity_events').insert({ user_id: user.id, event_type: 'onboarding_completed', metadata: {} });
    return NextResponse.json({ data });
  } catch (error) {
    return fail(error, 'ONBOARDING_SAVE_FAILED');
  }
}
