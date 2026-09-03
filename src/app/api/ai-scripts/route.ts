import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireContentAdmin } from '@/server/auth/current-user';
import { extractScriptFile, isValidScriptKey, MAX_SCRIPT_CHARS, normaliseScriptContent, type ScriptSourceType } from '@/server/content/script-parser';
import { createAdminClient } from '@/server/db/admin';

export const dynamic = 'force-dynamic';

function jsonError(error: unknown) {
  if (error instanceof Error && (error.message === 'AUTH_REQUIRED' || error.message === 'FORBIDDEN')) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  if (error instanceof Error && error.message === 'SERVICE_ROLE_NOT_CONFIGURED') {
    return NextResponse.json({ error: 'SCRIPT_LIBRARY_UNAVAILABLE' }, { status: 503 });
  }
  console.error('AI_SCRIPT_REQUEST_FAILED', error instanceof Error ? error.name : 'UnknownError');
  return NextResponse.json({ error: 'SCRIPT_LIBRARY_UNAVAILABLE' }, { status: 503 });
}
function toClientRow(row: {
  id: string;
  script_key: string;
  title: string;
  description: string | null;
  source_type: string;
  source_filename: string | null;
  content: string;
  version_no: number;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: row.id,
    scriptKey: row.script_key,
    title: row.title,
    description: row.description,
    sourceType: row.source_type,
    sourceFilename: row.source_filename,
    content: row.content,
    versionNo: row.version_no,
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  try {
    await requireContentAdmin();
    const service = createAdminClient();
    const { data, error } = await service
      .from('ai_script_documents')
      .select('id, script_key, title, description, source_type, source_filename, content, version_no, status, published_at, created_at, updated_at')
      .order('script_key', { ascending: true })
      .order('version_no', { ascending: false })
      .limit(200);
    if (error) throw error;
    return NextResponse.json({ data: { scripts: (data || []).map(toClientRow) } });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const editor = await requireContentAdmin();
    const form = await request.formData();
    const scriptKey = String(form.get('scriptKey') || '').trim().toLowerCase();
    const title = String(form.get('title') || '').trim();
    const descriptionValue = String(form.get('description') || '').trim();
    const description = descriptionValue ? descriptionValue.slice(0, 500) : null;
    const file = form.get('file');
    const pastedContent = String(form.get('content') || '');

    if (!isValidScriptKey(scriptKey)) {
      return NextResponse.json({ error: 'INVALID_SCRIPT_KEY', detail: 'Dùng 2–81 ký tự thường: a-z, 0-9, dấu gạch ngang hoặc gạch dưới.' }, { status: 422 });
    }
    if (title.length < 2 || title.length > 160) {
      return NextResponse.json({ error: 'INVALID_SCRIPT_TITLE' }, { status: 422 });
    }

    let content: string;
    let sourceType: ScriptSourceType = 'manual';
    let sourceFilename: string | null = null;
    if (file instanceof File && file.size > 0) {
      const extracted = await extractScriptFile(file);
      content = extracted.content;
      sourceType = extracted.sourceType;
      sourceFilename = extracted.filename.slice(0, 240);
    } else {
      try {
        content = normaliseScriptContent(pastedContent);
      } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'INVALID_SCRIPT_CONTENT' }, { status: 422 });
      }
    }
    if (content.length > MAX_SCRIPT_CHARS) {
      return NextResponse.json({ error: 'SCRIPT_TOO_LONG' }, { status: 422 });
    }

    const service = createAdminClient();
    const { data: previous, error: previousError } = await service
      .from('ai_script_documents')
      .select('version_no')
      .eq('script_key', scriptKey)
      .order('version_no', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (previousError) throw previousError;

    const now = new Date().toISOString();
    const { data: row, error } = await service
      .from('ai_script_documents')
      .insert({
        script_key: scriptKey,
        title,
        description,
        source_type: sourceType,
        source_filename: sourceFilename,
        content,
        content_hash: createHash('sha256').update(content, 'utf8').digest('hex'),
        version_no: (previous?.version_no || 0) + 1,
        status: 'draft',
        created_by: editor.id,
        updated_by: editor.id,
        created_at: now,
        updated_at: now,
      })
      .select('id, script_key, title, description, source_type, source_filename, content, version_no, status, published_at, created_at, updated_at')
      .single();
    if (error || !row) throw error || new Error('SCRIPT_CREATE_FAILED');

    await service.from('admin_access_logs').insert({
      admin_id: editor.id,
      resource_type: 'ai_script_documents',
      action: 'create_draft',
      reason: `Create ${scriptKey} v${row.version_no} (${sourceType})`,
    });

    return NextResponse.json({ data: { script: toClientRow(row) } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ScriptFileError') {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    return jsonError(error);
  }
}
