import { NextResponse } from 'next/server';
import { processObservationDecision } from '@/server/domain/agency';
import { getCurrentUserSession } from '@/server/auth/session';

export async function POST(request: Request) {
  try {
    const session = await getCurrentUserSession();
    if (!session) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const body = await request.json();
    const { observationId, decision, editedContent, idempotencyKey } = body;

    if (!observationId || !decision) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const result = await processObservationDecision({
      userId: session.userId,
      observationId,
      decision,
      editedContent,
      idempotencyKey,
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
