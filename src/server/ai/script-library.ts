import { createAdminClient } from '@/server/db/admin';

export interface PublishedScript {
  id: string;
  scriptKey: string;
  title: string;
  description: string | null;
  content: string;
  versionNo: number;
  updatedAt: string;
}
const MAX_SCRIPTS = 8;
const MAX_CONTEXT_CHARS = 18_000;

/**
 * Published editorial guidance is loaded server-side only. If a preview
 * environment has not run the migration yet, chat keeps working without
 * failing the whole turn.
 */
export async function loadPublishedScripts(): Promise<PublishedScript[]> {
  try {
    const service = createAdminClient();
    const { data, error } = await service
      .from('ai_script_documents')
      .select('id, script_key, title, description, content, version_no, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(MAX_SCRIPTS);
    if (error) throw error;

    let remaining = MAX_CONTEXT_CHARS;
    return (data || []).flatMap((row) => {
      if (remaining <= 0) return [];
      const content = String(row.content || '').slice(0, Math.min(6_000, remaining));
      remaining -= content.length;
      return [{
        id: row.id,
        scriptKey: row.script_key,
        title: row.title,
        description: row.description,
        content,
        versionNo: row.version_no,
        updatedAt: row.updated_at,
      }];
    });
  } catch (error) {
    // Missing service credentials/table should not turn a normal chat into a
    // 503. The editorial layer is additive and can be enabled after deploy.
    if (process.env.NODE_ENV !== 'test') {
      console.warn('AI_SCRIPT_LIBRARY_UNAVAILABLE', error instanceof Error ? error.name : 'UnknownError');
    }
    return [];
  }
}
