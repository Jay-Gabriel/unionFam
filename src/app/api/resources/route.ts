import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/current-user';

export const dynamic = 'force-dynamic';

const RESOURCE_TYPES = ['person', 'skill', 'time', 'money', 'community', 'tool', 'other'] as const;

function fail(error: unknown, fallback: string) {
  if (error instanceof Error && error.message === 'AUTH_REQUIRED') return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  console.error(fallback, error instanceof Error ? error.name : 'UnknownError');
  return NextResponse.json({ error: fallback }, { status: 503 });
}

export async function GET() {
  try {
    const user = await requireUser();
    const { data, error } = await createClient()
      .from('resources')
      .select('id, dimension, resource_type, name, description, confidence, source_insight_id, created_at, updated_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (error) {
    return fail(error, 'RESOURCES_UNAVAILABLE');
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const resourceType = typeof body.resourceType === 'string' ? body.resourceType : 'other';
    const dimension = typeof body.dimension === 'string' ? body.dimension : 'other';
    const confidence = typeof body.confidence === 'number' ? body.confidence : 1;
    if (!name || name.length > 240 || !RESOURCE_TYPES.includes(resourceType as (typeof RESOURCE_TYPES)[number]) || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      return NextResponse.json({ error: 'INVALID_RESOURCE' }, { status: 422 });
    }

    const { data, error } = await createClient()
      .from('resources')
      .insert({
        user_id: user.id,
        dimension: dimension.slice(0, 64),
        resource_type: resourceType,
        name,
        description: typeof body.description === 'string' ? body.description.trim().slice(0, 2000) : null,
        confidence,
        source_insight_id: typeof body.sourceInsightId === 'string' ? body.sourceInsightId : null,
      })
      .select('id, dimension, resource_type, name, description, confidence, source_insight_id, created_at, updated_at')
      .single();
    if (error || !data) throw error || new Error('RESOURCE_CREATE_FAILED');
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return fail(error, 'RESOURCE_CREATE_FAILED');
  }
}
