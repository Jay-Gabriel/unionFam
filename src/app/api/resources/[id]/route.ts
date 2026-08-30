import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/current-user';

export const dynamic = 'force-dynamic';

function fail(error: unknown, fallback: string) {
  if (error instanceof Error && error.message === 'AUTH_REQUIRED') return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  console.error(fallback, error instanceof Error ? error.name : 'UnknownError');
  return NextResponse.json({ error: fallback }, { status: 503 });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.name === 'string') {
      const name = body.name.trim();
      if (!name || name.length > 240) return NextResponse.json({ error: 'INVALID_RESOURCE' }, { status: 422 });
      patch.name = name;
    }
    if (typeof body.description === 'string') patch.description = body.description.trim().slice(0, 2000);
    if (typeof body.dimension === 'string') patch.dimension = body.dimension.slice(0, 64);
    if (typeof body.resourceType === 'string') patch.resource_type = body.resourceType;
    if (typeof body.confidence === 'number' && Number.isFinite(body.confidence) && body.confidence >= 0 && body.confidence <= 1) patch.confidence = body.confidence;
    if (Object.keys(patch).length === 1) return NextResponse.json({ error: 'NO_CHANGES' }, { status: 400 });

    const { data, error } = await createClient()
      .from('resources')
      .update(patch)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .select('id, dimension, resource_type, name, description, confidence, source_insight_id, created_at, updated_at')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'RESOURCE_NOT_FOUND' }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    return fail(error, 'RESOURCE_UPDATE_FAILED');
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { data, error } = await createClient()
      .from('resources')
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'RESOURCE_NOT_FOUND' }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch (error) {
    return fail(error, 'RESOURCE_DELETE_FAILED');
  }
}
