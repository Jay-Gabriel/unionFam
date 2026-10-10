/**
 * Memory Service — Life Lab V8.7.2 (Phần 3 Memory write protocol + Phần 5).
 * - NO_MEMORY chặn mọi long-term write.
 * - Ghi chỉ sau checkpoint + proposal cụ thể + quyết định người dùng (per-item).
 * - Xóa/revoke KHÔNG nạp lại vào context (DB06).
 * - View/edit/revoke/delete/export.
 */
import type pg from 'pg';
import { pool, withTx } from '../db/pool.js';
import { auditEvent } from './sessionRepo.js';
import type { MemoryItemType } from '@lifelab/contract';

export interface ProposalInput {
  sessionId: string;
  itemType: MemoryItemType;
  content: string;
  sourceIds?: string[];
  reason?: string;
}

export async function createProposals(sessionId: string, items: ProposalInput[]): Promise<{ id: string; item_type: string; content: string; reason: string | null }[]> {
  if (items.length === 0) return [];
  return withTx(async (client) => {
    const created: { id: string; item_type: string; content: string; reason: string | null }[] = [];
    for (const it of items) {
      const { rows } = await client.query<{ id: string; item_type: string; content: string; reason: string | null }>(
        `INSERT INTO memory_proposals (session_id, item_type, content, source_ids, reason, decision)
         VALUES ($1,$2,$3,$4,$5,'PENDING') RETURNING id, item_type, content, reason`,
        [sessionId, it.itemType, it.content, it.sourceIds ?? [], it.reason ?? null],
      );
      created.push(rows[0]);
    }
    return created;
  });
}

export interface DecisionInput {
  proposalId: string;
  decision: 'ALLOWED' | 'DENIED';
  editedContent?: string;
}

/**
 * Áp quyết định per-item. Chỉ ALLOWED mới ghi long-term. NO_MEMORY => từ chối toàn bộ.
 * Trả danh sách item đã ghi.
 */
export async function decideProposals(
  userId: string | null,
  sessionId: string,
  memoryMode: string,
  decisions: DecisionInput[],
): Promise<{ written: string[]; blocked: boolean }> {
  if (memoryMode === 'NO_MEMORY') {
    // A09/C04: NO_MEMORY => không ghi gì cả, kể cả khi UI gửi ALLOWED.
    return withTx(async (client) => {
      for (const d of decisions) {
        await client.query(`UPDATE memory_proposals SET decision = 'DENIED' WHERE id = $1 AND session_id = $2`, [d.proposalId, sessionId]);
      }
      await auditEvent(client, { actorId: userId, action: 'MEMORY_WRITE_BLOCKED_NO_MEMORY', resourceType: 'session', resourceId: sessionId, result: 'BLOCKED' });
      return { written: [], blocked: true };
    });
  }

  return withTx(async (client) => {
    const written: string[] = [];
    for (const d of decisions) {
      const { rows } = await client.query<{ id: string; item_type: MemoryItemType; content: string; source_ids: string[] }>(
        `SELECT id, item_type, content, source_ids FROM memory_proposals WHERE id = $1 AND session_id = $2 AND decision = 'PENDING'`,
        [d.proposalId, sessionId],
      );
      const prop = rows[0];
      if (!prop) continue;

      if (d.decision === 'DENIED') {
        await client.query(`UPDATE memory_proposals SET decision = 'DENIED' WHERE id = $1`, [prop.id]);
        continue;
      }

      const content = d.editedContent ?? prop.content;
      await client.query(`UPDATE memory_proposals SET decision = 'ALLOWED', content = $2 WHERE id = $1`, [prop.id, content]);

      // Ghi vào store tương ứng với permission=ALLOWED
      const writtenId = await writeToStore(client, userId, sessionId, prop.item_type, content);
      written.push(writtenId);
      await auditEvent(client, { actorId: userId, action: 'MEMORY_WRITE', resourceType: prop.item_type, resourceId: writtenId, result: 'OK' });
    }
    return { written, blocked: false };
  });
}

async function writeToStore(
  client: pg.PoolClient,
  userId: string | null,
  sessionId: string,
  itemType: MemoryItemType,
  content: string,
): Promise<string> {
  switch (itemType) {
    case 'LIFE_MAP': {
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO life_map_items (user_id, domain, content, status, permission) VALUES ($1,'07 MY CURRENT FOCUS',$2,'CONFIRMED','ALLOWED') RETURNING id`,
        [userId, content],
      );
      return rows[0].id;
    }
    case 'RELATIONSHIP_MEMORY': {
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO relationship_memory (user_id, category, content, permission) VALUES ($1,'conversation_preference',$2,'ALLOWED') RETURNING id`,
        [userId, content],
      );
      return rows[0].id;
    }
    case 'SESSION_OUTCOME': {
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO session_outcomes (session_id, confirmed_type, content, confirmation_status) VALUES ($1,'CONFIRMED_INSIGHT',$2,'CONFIRMED') RETURNING id`,
        [sessionId, JSON.stringify({ text: content })],
      );
      return rows[0].id;
    }
    case 'EXPERIMENT': {
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO experiments (user_id, hypothesis, small_experience, time_window, signal_to_notice, return_preference, status, permission)
         VALUES ($1,$2,'(đề xuất)','7 ngày','(quan sát)','khi bạn muốn','CONFIRMED','ALLOWED') RETURNING id`,
        [userId, content],
      );
      return rows[0].id;
    }
  }
}

// ---------- View / Edit / Revoke / Delete / Export ----------
export interface MemoryItemView {
  id: string;
  type: MemoryItemType;
  content: string;
  status: string;
  permission: string;
  updated_at: string | null;
}

/** Chỉ trả item ALLOWED và chưa xóa (DB06/DB07). */
export async function listMemory(userId: string): Promise<MemoryItemView[]> {
  const lifeMap = await pool.query(
    `SELECT id, content, status, permission, updated_at FROM life_map_items
     WHERE user_id = $1 AND deleted_at IS NULL AND permission = 'ALLOWED' AND status <> 'ARCHIVED'`,
    [userId],
  );
  const relMem = await pool.query(
    `SELECT id, content, status, permission, updated_at FROM relationship_memory
     WHERE user_id = $1 AND deleted_at IS NULL AND permission = 'ALLOWED'`,
    [userId],
  );
  const exps = await pool.query(
    `SELECT id, hypothesis AS content, status, permission, updated_at FROM experiments
     WHERE user_id = $1 AND deleted_at IS NULL AND permission = 'ALLOWED'`,
    [userId],
  );
  return [
    ...lifeMap.rows.map((r) => ({ ...r, type: 'LIFE_MAP' as MemoryItemType })),
    ...relMem.rows.map((r) => ({ ...r, type: 'RELATIONSHIP_MEMORY' as MemoryItemType })),
    ...exps.rows.map((r) => ({ ...r, type: 'EXPERIMENT' as MemoryItemType })),
  ];
}

const TABLE_BY_TYPE: Record<MemoryItemType, string> = {
  LIFE_MAP: 'life_map_items',
  RELATIONSHIP_MEMORY: 'relationship_memory',
  EXPERIMENT: 'experiments',
  SESSION_OUTCOME: 'session_outcomes',
};

export async function editMemory(userId: string, type: MemoryItemType, id: string, content: string): Promise<boolean> {
  const table = TABLE_BY_TYPE[type];
  const col = type === 'EXPERIMENT' ? 'hypothesis' : 'content';
  return withTx(async (client) => {
    const { rowCount } = await client.query(
      `UPDATE ${table} SET ${col} = $1, version = version + 1, updated_at = now() WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL`,
      [content, id, userId],
    );
    await auditEvent(client, { actorId: userId, action: 'MEMORY_EDIT', resourceType: type, resourceId: id, result: rowCount ? 'OK' : 'NOT_FOUND' });
    return (rowCount ?? 0) > 0;
  });
}

/** Revoke: set permission=REVOKED → không nạp vào context (DB06). */
export async function revokeMemory(userId: string, type: MemoryItemType, id: string): Promise<boolean> {
  const table = TABLE_BY_TYPE[type];
  return withTx(async (client) => {
    const { rowCount } = await client.query(
      `UPDATE ${table} SET permission = 'REVOKED', updated_at = now() WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    await auditEvent(client, { actorId: userId, action: 'MEMORY_REVOKE', resourceType: type, resourceId: id, result: rowCount ? 'OK' : 'NOT_FOUND' });
    return (rowCount ?? 0) > 0;
  });
}

/** Delete: tombstone deleted_at. Dữ liệu đã xóa không nạp lại (DB06/AC014). */
export async function deleteMemory(userId: string, type: MemoryItemType, id: string): Promise<boolean> {
  const table = TABLE_BY_TYPE[type];
  return withTx(async (client) => {
    const { rowCount } = await client.query(
      `UPDATE ${table} SET deleted_at = now(), permission = 'REVOKED' WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    await auditEvent(client, { actorId: userId, action: 'MEMORY_DELETE', resourceType: type, resourceId: id, result: rowCount ? 'OK' : 'NOT_FOUND' });
    return (rowCount ?? 0) > 0;
  });
}

/** Export: chỉ dữ liệu của owner (SEC08). */
export async function exportMemory(userId: string): Promise<unknown> {
  const items = await listMemory(userId);
  return { user_id: userId, exported_at: new Date().toISOString(), items };
}

/**
 * Context builder helper: lấy repair rules + confirmed memory (loại REVOKED/deleted/ARCHIVED).
 * Dùng khi dựng prompt (Phần 6 memory retrieval policy).
 */
export async function getActiveRepairRules(sessionId: string): Promise<string[]> {
  const { rows } = await pool.query<{ repair_rule: string }>(
    `SELECT repair_rule FROM repairs WHERE session_id = $1 AND active = true`,
    [sessionId],
  );
  return rows.map((r) => r.repair_rule);
}

export { withTx };
