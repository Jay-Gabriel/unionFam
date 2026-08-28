import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths allowed without session
  const isPublicPath =
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/public') ||
    pathname === '/favicon.ico';

  // Check auth session cookie
  const hasSessionCookie =
    request.cookies.has('sb-access-token') ||
    request.cookies.has('sb-auth-token') ||
    request.cookies.has('lifelab_session');

  // Protect /app and /admin routes
  if (!isPublicPath && !hasSessionCookie) {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route additional check
  if (pathname.startsWith('/admin')) {
    const adminRoleCookie = request.cookies.get('lifelab_user_role')?.value;
    if (adminRoleCookie !== 'admin') {
      // Deny non-admin users
      const appUrl = new URL('/app', request.url);
      return NextResponse.redirect(appUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/admin/:path*', '/auth'],
};
