import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/server/db/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MINIMUM_KEY_LENGTH = 24;

function constantTimeEqual(input: string, expected: string) {
  const inputBytes = Buffer.from(input);
  const expectedBytes = Buffer.from(expected);

  if (inputBytes.length !== expectedBytes.length) return false;
  return timingSafeEqual(inputBytes, expectedBytes);
}

function errorResponse(error: string, status: number) {
  return NextResponse.json(
    { error },
    {
      status,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
        'Referrer-Policy': 'no-referrer',
      },
    }
  );
}

/**
 * Signs the configured admin into a real Supabase session from a bearer URL.
 *
 * The URL is intentionally a public GET route so it can be opened by an
 * operator/agent without showing the admin login form. The bearer key is the
 * only credential accepted here; no admin identity is accepted from the
 * request itself. A real Auth session is still issued so existing middleware,
 * RLS policies and audit logs continue to see the configured admin user.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const configuredKey = process.env.ADMIN_ACCESS_KEY?.trim() || '';
  const adminEmail = process.env.ADMIN_LINK_EMAIL?.trim().toLowerCase() || '';
  const providedKey = requestUrl.searchParams.get('key')?.trim() || '';

  // Treat an unconfigured or malformed link like a missing route. This avoids
  // disclosing whether the endpoint exists or whether the server is set up.
  if (
    configuredKey.length < MINIMUM_KEY_LENGTH ||
    !adminEmail ||
    !providedKey ||
    !constantTimeEqual(providedKey, configuredKey)
  ) {
    return errorResponse('ADMIN_LINK_INVALID', 404);
  }

  try {
    const service = createAdminClient();
    const { data: usersPage, error: usersError } = await service.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (usersError) throw usersError;

    // Do not let generateLink create a new account if the operator made a
    // typo in ADMIN_LINK_EMAIL. The account must already exist in Auth.
    const adminUser = usersPage.users.find(
      (user) => user.email?.trim().toLowerCase() === adminEmail
    );
    if (!adminUser?.email) return errorResponse('ADMIN_LINK_NOT_CONFIGURED', 503);

    const { data: adminRoles, error: rolesError } = await service
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      .eq('role', 'admin')
      .limit(1);

    if (rolesError) throw rolesError;
    if (!adminRoles?.length) return errorResponse('ADMIN_LINK_NOT_CONFIGURED', 503);

    // generateLink returns a one-time hashed token without sending mail. We
    // immediately verify that token through the normal public Auth client;
    // @supabase/ssr persists the resulting session in Supabase session cookies.
    const { data: generated, error: generationError } = await service.auth.admin.generateLink({
      type: 'magiclink',
      email: adminUser.email,
    });

    if (generationError) throw generationError;
    const tokenHash = generated.properties?.hashed_token;
    if (!tokenHash) throw new Error('ADMIN_LINK_TOKEN_MISSING');

    const supabase = createClient();
    const { data: verified, error: verificationError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'magiclink',
    });

    if (verificationError) throw verificationError;
    if (!verified.session || verified.user?.id !== adminUser.id) {
      throw new Error('ADMIN_LINK_SESSION_INVALID');
    }

    const response = NextResponse.redirect(new URL('/admin', requestUrl.origin), 303);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  } catch (error) {
    // Keep provider/service details out of the response and logs. The admin
    // operator can inspect the deployment logs without exposing credentials.
    console.error(
      'ADMIN_LINK_FAILED',
      error instanceof Error ? error.name : 'UnknownError'
    );
    return errorResponse('ADMIN_LINK_UNAVAILABLE', 503);
  }
}
