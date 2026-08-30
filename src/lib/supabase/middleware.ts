import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const isLocalUiPreview =
    process.env.NODE_ENV !== 'production' &&
    ['localhost', '127.0.0.1', '::1'].includes(request.nextUrl.hostname);

  // UI preview is intentionally limited to the local development server.
  // Production/domain/VPS requests always continue through verified Supabase Auth.
  if (isLocalUiPreview) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicPath =
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/public') ||
    pathname === '/favicon.ico';

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    url.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
