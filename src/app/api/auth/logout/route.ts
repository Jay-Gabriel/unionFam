import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) return NextResponse.json({ error: 'LOGOUT_FAILED' }, { status: 503 });
    return NextResponse.json({ data: { signedOut: true } });
  } catch (error) {
    console.error('LOGOUT_FAILED', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'LOGOUT_FAILED' }, { status: 503 });
  }
}
