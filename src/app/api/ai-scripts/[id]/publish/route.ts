import { NextResponse } from 'next/server';
import { requireContentAdmin } from '@/server/auth/current-user';
import { createAdminClient } from '@/server/db/admin';

export const dynamic = 'force-dynamic';

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const editor = await requireContentAdmin();
    if (!isUuid(params.id)) return NextResponse.json({ error: 'SCRIPT_NOT_FOUND' }, { status: 404 });
    const service = createAdminClient();
    const { data, error } = await service.rpc('publish_ai_script', { p_script_id: params.id });
    if (error) {
      if (error.message.includes('AI_SCRIPT_NOT_FOUND')) return NextResponse.json({ error: 'SCRIPT_NOT_FOUND' }, { status: 404 });
      throw error;
    }
    const script = (
      data && typeof data === 'object' && !Array.isArray(data) ? data : {}
    ) as Record<string, unknown>;
    await service.from('admin_access_logs').insert({
      admin_id: editor.id,
      resource_type: 'ai_script_documents',
      action: 'publish',
      reason: `Publish ${String(script.script_key || params.id)} v${String(script.version_no || '')}`.slice(0, 240),
    });
    return NextResponse.json({ data: { script } });
  } catch (error) {
    if (error instanceof Error && (error.message === 'AUTH_REQUIRED' || error.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    console.error('AI_SCRIPT_PUBLISH_FAILED', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'SCRIPT_PUBLISH_UNAVAILABLE' }, { status: 503 });
  }
}
