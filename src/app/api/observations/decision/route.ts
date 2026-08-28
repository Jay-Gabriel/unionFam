import { NextResponse } from 'next/server';
import { processObservationDecision } from '@/server/domain/agency';
import { requireUser } from '@/server/auth/current-user';

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const body = await request.json();
    const { observationId, decision, editedContent, idempotencyKey } = body;

    if (!observationId || !decision) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const result = await processObservationDecision({
      userId: user.id,
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
