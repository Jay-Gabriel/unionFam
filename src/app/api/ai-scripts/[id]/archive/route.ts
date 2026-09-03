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
    const { data, error } = await service
      .from('ai_script_documents')
      .update({ status: 'archived', updated_by: editor.id, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select('id, script_key, title, description, source_type, source_filename, content, version_no, status, published_at, created_at, updated_at')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'SCRIPT_NOT_FOUND' }, { status: 404 });

    await service.from('admin_access_logs').insert({
      admin_id: editor.id,
      resource_type: 'ai_script_documents',
      action: 'archive',
      reason: `Archive ${data.script_key} v${data.version_no}`,
    });
    return NextResponse.json({ data: { script: data } });
  } catch (error) {
    if (error instanceof Error && (error.message === 'AUTH_REQUIRED' || error.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    console.error('AI_SCRIPT_ARCHIVE_FAILED', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'SCRIPT_ARCHIVE_UNAVAILABLE' }, { status: 503 });
  }
}
