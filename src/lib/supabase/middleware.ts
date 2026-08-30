import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function isPublicPath(pathname: string) {
  return (
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/public') ||
    pathname === '/favicon.ico'
  );
}

function hasSupabaseConfig(url: string | undefined, key: string | undefined) {
  return Boolean(
    url &&
      key &&
      !url.includes('placeholder') &&
      !url.includes('your-project') &&
      !url.includes('replace_with') &&
      !key.includes('placeholder') &&
      !key.includes('replace_with')
  );
}

function authUnavailable(request: NextRequest, reason: 'config' | 'service') {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'AUTH_SERVICE_UNAVAILABLE' },
      { status: 503 }
    );
  }

  const url = request.nextUrl.clone();
  url.pathname = '/auth';
  url.search = '';
  url.searchParams.set('returnUrl', pathname);
  url.searchParams.set('error', reason);
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  const authRequired = process.env.AUTH_REQUIRED === 'true';
  const { pathname } = request.nextUrl;
  const isLocalUiPreview =
    process.env.NODE_ENV !== 'production' &&
    ['localhost', '127.0.0.1', '::1'].includes(request.nextUrl.hostname);

  // Authentication is opt-in while the MVP UI is being reviewed. API routes keep
  // their own user checks; set AUTH_REQUIRED=true when production auth is ready.
  if (!authRequired) {
    if (pathname === '/auth') {
      const url = request.nextUrl.clone();
      url.pathname = '/app';
      url.search = '';
      return NextResponse.redirect(url);
    }

    return NextResponse.next({ request });
  }

  if (isLocalUiPreview) {
    return NextResponse.next({ request });
  }

  const publicPath = isPublicPath(pathname);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // A missing Vercel environment variable must never crash routing middleware.
  // Public pages remain reachable; protected pages receive an explicit fallback.
  if (!hasSupabaseConfig(supabaseUrl, supabaseKey)) {
    return publicPath
      ? NextResponse.next({ request })
      : authUnavailable(request, 'config');
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
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

    if (!user && !publicPath) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth';
      url.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(url);
    }
  } catch (error) {
    // Do not leak credentials or provider responses into edge logs.
    console.error(
      'AUTH_MIDDLEWARE_UNAVAILABLE',
      error instanceof Error ? error.name : 'UnknownError'
    );

    return publicPath
      ? NextResponse.next({ request })
      : authUnavailable(request, 'service');
  }

  return supabaseResponse;
}
