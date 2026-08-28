import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const returnUrl = searchParams.get('returnUrl') || '/onboarding';

  // Prevent open redirect vulnerabilities by checking local path
  const safeReturnUrl = returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/onboarding';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeReturnUrl}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=AUTH_CALLBACK_FAILED`);
}
