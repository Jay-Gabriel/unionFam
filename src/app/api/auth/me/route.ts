import { NextResponse } from 'next/server';
import { requireUser } from '@/server/auth/current-user';

export const dynamic = 'force-dynamic';

/** Small role endpoint used by the app shell to expose only the tools that
 * belong to the signed-in account. It never returns service credentials. */
export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ data: user });
  } catch (error) {
    if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }
    return NextResponse.json({ error: 'AUTH_UNAVAILABLE' }, { status: 503 });
  }
}
