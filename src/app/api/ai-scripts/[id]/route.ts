import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireContentAdmin } from '@/server/auth/current-user';
import { createAdminClient } from '@/server/db/admin';
import { MAX_SCRIPT_CHARS, normaliseScriptContent } from '@/server/content/script-parser';

export const dynamic = 'force-dynamic';

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
/** Update metadata/content of a draft without changing its immutable version. */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const editor = await requireContentAdmin();
    if (!isUuid(params.id)) return NextResponse.json({ error: 'SCRIPT_NOT_FOUND' }, { status: 404 });
    const payload = await request.json().catch(() => null) as {
      title?: unknown;
      description?: unknown;
      content?: unknown;
    } | null;
    const title = typeof payload?.title === 'string' ? payload.title.trim() : '';
    const description = typeof payload?.description === 'string' ? payload.description.trim().slice(0, 500) : null;
    if (title.length < 2 || title.length > 160 || typeof payload?.content !== 'string') {
      return NextResponse.json({ error: 'INVALID_SCRIPT' }, { status: 422 });
    }
    let content: string;
    try {
      content = normaliseScriptContent(payload.content);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'INVALID_SCRIPT_CONTENT' }, { status: 422 });
    }
    if (content.length > MAX_SCRIPT_CHARS) return NextResponse.json({ error: 'SCRIPT_TOO_LONG' }, { status: 422 });

    const service = createAdminClient();
    const { data, error } = await service
      .from('ai_script_documents')
      .update({
        title,
        description: description || null,
        content,
        content_hash: createHash('sha256').update(content, 'utf8').digest('hex'),
        updated_by: editor.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('status', 'draft')
      .select('id, script_key, title, description, source_type, source_filename, content, version_no, status, published_at, created_at, updated_at')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'DRAFT_NOT_FOUND' }, { status: 404 });
    await service.from('admin_access_logs').insert({
      admin_id: editor.id,
      resource_type: 'ai_script_documents',
      action: 'update_draft',
      reason: `Update ${data.script_key} v${data.version_no}`,
    });
    return NextResponse.json({ data: { script: data } });
  } catch (error) {
    if (error instanceof Error && (error.message === 'AUTH_REQUIRED' || error.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    console.error('AI_SCRIPT_UPDATE_FAILED', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'SCRIPT_UPDATE_UNAVAILABLE' }, { status: 503 });
  }
}
