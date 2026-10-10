/**
 * Session repository — Life Lab V8.7.2.
 * Quản lý session, messages, turn_logs, audit_events. State version tăng mỗi lượt (409 conflict).
 */
import type pg from 'pg';
import { pool, withTx } from '../db/pool.js';
import type { ConversationState } from '@lifelab/contract';

export interface SessionRow {
  id: string;
  user_id: string | null;
  anon_token: string | null;
  current_state: ConversationState;
  previous_state: ConversationState | null;
  state_version: number;
  safety_level: string;
  memory_mode: string;
  user_requested_stop: boolean;
  question_count_since_reflection: number;
  focus_confirmation_status: string | null;
  possible_outcome: string | null;
  confirmed_outcome: string | null;
  advice_permission_scope: string | null;
  session_feedback: string | null;
  active_focus_id: string | null;
  active_experiment_id: string | null;
  user_state_snapshot: unknown;
  created_at: string;
  closed_at: string | null;
}

export async function createSession(input: {
  userId?: string | null;
  anonToken?: string | null;
  memoryMode?: string;
}): Promise<SessionRow> {
  const { rows } = await pool.query<SessionRow>(
    `INSERT INTO sessions (user_id, anon_token, memory_mode, current_state)
     VALUES ($1, $2, $3, 'ENTRY') RETURNING *`,
    [input.userId ?? null, input.anonToken ?? null, input.memoryMode ?? 'ASK_LATER'],
  );
  return rows[0];
}

export async function getSession(id: string): Promise<SessionRow | null> {
  const { rows } = await pool.query<SessionRow>('SELECT * FROM sessions WHERE id = $1', [id]);
  return rows[0] ?? null;
}

/** Lock session row để tránh race (Pipeline Phần 5: row lock). */
export async function getSessionForUpdate(client: pg.PoolClient, id: string): Promise<SessionRow | null> {
  const { rows } = await client.query<SessionRow>('SELECT * FROM sessions WHERE id = $1 FOR UPDATE', [id]);
  return rows[0] ?? null;
}

export async function insertMessage(
  client: pg.PoolClient,
  input: { sessionId: string; role: string; content: string; requestId?: string },
): Promise<string> {
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO messages (session_id, role, content, request_id) VALUES ($1,$2,$3,$4) RETURNING id`,
    [input.sessionId, input.role, input.content, input.requestId ?? null],
  );
  return rows[0].id;
}

export async function getRecentMessages(sessionId: string, limit = 8): Promise<{ role: string; content: string }[]> {
  const { rows } = await pool.query<{ role: string; content: string }>(
    `SELECT role, content FROM messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [sessionId, limit],
  );
  return rows.reverse();
}

export interface SessionUpdate {
  current_state?: ConversationState;
  previous_state?: ConversationState;
  safety_level?: string;
  memory_mode?: string;
  user_requested_stop?: boolean;
  question_count_since_reflection?: number;
  focus_confirmation_status?: string | null;
  possible_outcome?: string | null;
  confirmed_outcome?: string | null;
  advice_permission_scope?: string | null;
  session_feedback?: string | null;
  user_state_snapshot?: unknown;
  closed_at?: string | null;
}

/** Cập nhật session + bump state_version. Trả version mới. */
export async function updateSession(
  client: pg.PoolClient,
  id: string,
  update: SessionUpdate,
): Promise<number> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const [k, v] of Object.entries(update)) {
    if (v === undefined) continue;
    fields.push(`${k} = $${i++}`);
    values.push(k === 'user_state_snapshot' ? JSON.stringify(v) : v);
  }
  fields.push(`state_version = state_version + 1`);
  values.push(id);
  const { rows } = await client.query<{ state_version: number }>(
    `UPDATE sessions SET ${fields.join(', ')} WHERE id = $${i} RETURNING state_version`,
    values,
  );
  return rows[0].state_version;
}

export async function logTurn(
  client: pg.PoolClient,
  input: {
    requestId?: string;
    sessionId: string;
    promptVersion: string;
    modelVersion: string;
    stateBefore: ConversationState;
    event: string;
    stateAfter: ConversationState;
    validation: string;
    evidenceIds?: string[];
    latencyMs?: number;
  },
): Promise<void> {
  await client.query(
    `INSERT INTO turn_logs (request_id, session_id, prompt_version, model_version, state_before, event, state_after, validation, evidence_ids, latency_ms)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      input.requestId ?? null,
      input.sessionId,
      input.promptVersion,
      input.modelVersion,
      input.stateBefore,
      input.event,
      input.stateAfter,
      input.validation,
      input.evidenceIds ?? [],
      input.latencyMs ?? null,
    ],
  );
}

export async function auditEvent(
  client: pg.PoolClient,
  input: { actorId?: string | null; action: string; resourceType: string; resourceId?: string | null; result: string; metadata?: unknown },
): Promise<void> {
  await client.query(
    `INSERT INTO audit_events (actor_id, action, resource_type, resource_id, result, metadata_redacted)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [input.actorId ?? null, input.action, input.resourceType, input.resourceId ?? null, input.result, JSON.stringify(input.metadata ?? {})],
  );
}

export { withTx };
