/**
 * API routes /api/v1 — Life Lab V8.7.2 (Phần 5 Endpoints + Error contract).
 */
import { randomUUID } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { createSession, getSession } from '../services/sessionRepo.js';
import { runTurn, StateConflictError, SessionClosedError } from '../services/turnService.js';
import {
  decideProposals,
  listMemory,
  editMemory,
  revokeMemory,
  deleteMemory,
  exportMemory,
} from '../services/memory.js';
import { getEntitlement } from '../services/entitlement.js';
import { pool } from '../db/pool.js';
import type { MemoryItemType } from '@lifelab/contract';

export const api = Router();

function err(res: Response, status: number, code: string, message: string) {
  return res.status(status).json({ error: { code, message }, request_id: res.locals.requestId });
}

// Simple in-memory idempotency cache (prod: Redis/DB).
const idempotencyCache = new Map<string, { payloadHash: string; response: unknown }>();

// ---------- POST /sessions ----------
api.post('/sessions', async (req, res) => {
  const schema = z.object({
    user_id: z.string().uuid().optional(),
    memory_mode: z.enum(['NO_MEMORY', 'ASK_LATER', 'PROPOSALS_ALLOWED']).optional(),
  });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return err(res, 400, 'VALIDATION_ERROR', parsed.error.message);

  const session = await createSession({ userId: parsed.data.user_id ?? null, memoryMode: parsed.data.memory_mode });
  const ent = getEntitlement('FREE');
  return res.status(201).json({
    session_id: session.id,
    state: session.current_state,
    state_version: session.state_version,
    consent_required: true,
    limits: { turn_limit_per_session: ent.turnLimitPerSession, note: ent.note },
    request_id: res.locals.requestId,
  });
});

// ---------- GET /sessions/:id ----------
api.get('/sessions/:id', async (req, res) => {
  const session = await getSession(req.params.id);
  if (!session) return err(res, 404, 'NOT_FOUND', 'Session không tồn tại');
  return res.json({
    state: session.current_state,
    state_version: session.state_version,
    active_focus: session.active_focus_id ?? null,
    safety_level: session.safety_level,
    closed: !!session.closed_at,
    request_id: res.locals.requestId,
  });
});

// ---------- POST /sessions/:id/turns ----------
api.post('/sessions/:id/turns', async (req, res) => {
  const schema = z.object({
    message: z.string().max(8000).nullable().optional(),
    ui_action: z.object({ type: z.string(), value: z.unknown().optional() }).nullable().optional(),
    expected_state_version: z.number().int().optional(),
  });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return err(res, 400, 'VALIDATION_ERROR', parsed.error.message);

  const idemKey = req.header('Idempotency-Key');
  const payloadHash = JSON.stringify(parsed.data);
  if (idemKey) {
    const cached = idempotencyCache.get(idemKey);
    if (cached) {
      if (cached.payloadHash !== payloadHash) return err(res, 409, 'IDEMPOTENCY_CONFLICT', 'Key dùng với payload khác');
      return res.json(cached.response);
    }
  }

  try {
    const result = await runTurn({
      sessionId: req.params.id,
      message: parsed.data.message ?? null,
      uiAction: parsed.data.ui_action ?? null,
      expectedStateVersion: parsed.data.expected_state_version,
      requestId: res.locals.requestId,
    });
    if (idemKey) idempotencyCache.set(idemKey, { payloadHash, response: result });
    return res.json(result);
  } catch (e) {
    if (e instanceof StateConflictError) return err(res, 409, 'STATE_VERSION_CONFLICT', e.message);
    if (e instanceof SessionClosedError) return err(res, 409, 'SESSION_CLOSED', e.message);
    if (e instanceof Error && e.message === 'SESSION_NOT_FOUND') return err(res, 404, 'NOT_FOUND', 'Session không tồn tại');
    console.error('[turn] error', e);
    return err(res, 503, 'MODEL_UNAVAILABLE', 'Chưa thể phản hồi, vui lòng thử lại');
  }
});

// ---------- POST /sessions/:id/outcome ----------
api.post('/sessions/:id/outcome', async (req, res) => {
  const schema = z.object({
    chosen_outcome: z.enum(['CONFIRMED_INSIGHT', 'BETTER_QUESTION', 'MEANINGFUL_NEXT_STEP', 'LIFE_EXPERIMENT', 'REFLECTIVE_PAUSE']),
    edits: z.string().optional(),
    decision: z.enum(['KEEP', 'EDIT', 'CONTINUE', 'CHANGE_FOCUS', 'END']).default('KEEP'),
  });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return err(res, 400, 'VALIDATION_ERROR', parsed.error.message);

  const session = await getSession(req.params.id);
  if (!session) return err(res, 404, 'NOT_FOUND', 'Session không tồn tại');

  await pool.query(
    `INSERT INTO session_outcomes (session_id, confirmed_type, content, confirmation_status)
     VALUES ($1,$2,$3,'CONFIRMED')`,
    [session.id, parsed.data.chosen_outcome, JSON.stringify({ edits: parsed.data.edits ?? null })],
  );
  await pool.query(`UPDATE sessions SET confirmed_outcome = $2 WHERE id = $1`, [session.id, parsed.data.chosen_outcome]);

  return res.json({ confirmed_outcome: parsed.data.chosen_outcome, next_state: 'MEMORY_PERMISSION', request_id: res.locals.requestId });
});

// ---------- POST /memory/proposals/:id/decision ----------
api.post('/memory/proposals/:id/decision', async (req, res) => {
  const schema = z.object({
    session_id: z.string().uuid(),
    decision: z.enum(['ALLOWED', 'DENIED']),
    edited_content: z.string().optional(),
    user_id: z.string().uuid().nullable().optional(),
    memory_mode: z.enum(['NO_MEMORY', 'ASK_LATER', 'PROPOSALS_ALLOWED']),
  });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return err(res, 400, 'VALIDATION_ERROR', parsed.error.message);

  const result = await decideProposals(parsed.data.user_id ?? null, parsed.data.session_id, parsed.data.memory_mode, [
    { proposalId: req.params.id, decision: parsed.data.decision, editedContent: parsed.data.edited_content },
  ]);
  return res.json({ write_result: result, request_id: res.locals.requestId });
});

// ---------- GET /memory ----------
api.get('/memory', async (req, res) => {
  const userId = req.query.user_id as string | undefined;
  if (!userId) return err(res, 400, 'VALIDATION_ERROR', 'user_id bắt buộc');
  const items = await listMemory(userId);
  return res.json({ items, request_id: res.locals.requestId });
});

// ---------- PATCH /memory/:id ----------
api.patch('/memory/:id', async (req, res) => {
  const schema = z.object({
    user_id: z.string().uuid(),
    type: z.enum(['LIFE_MAP', 'RELATIONSHIP_MEMORY', 'EXPERIMENT', 'SESSION_OUTCOME']),
    content: z.string().optional(),
    revoke: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return err(res, 400, 'VALIDATION_ERROR', parsed.error.message);

  const type = parsed.data.type as MemoryItemType;
  if (parsed.data.revoke) {
    const ok = await revokeMemory(parsed.data.user_id, type, req.params.id);
    return ok ? res.json({ revoked: true, request_id: res.locals.requestId }) : err(res, 404, 'NOT_FOUND', 'Không tìm thấy');
  }
  if (parsed.data.content !== undefined) {
    const ok = await editMemory(parsed.data.user_id, type, req.params.id, parsed.data.content);
    return ok ? res.json({ updated: true, request_id: res.locals.requestId }) : err(res, 404, 'NOT_FOUND', 'Không tìm thấy');
  }
  return err(res, 400, 'VALIDATION_ERROR', 'content hoặc revoke bắt buộc');
});

// ---------- DELETE /memory/:id ----------
api.delete('/memory/:id', async (req, res) => {
  const userId = (req.query.user_id as string) || (req.body?.user_id as string);
  const type = ((req.query.type as string) || (req.body?.type as string)) as MemoryItemType;
  if (!userId || !type) return err(res, 400, 'VALIDATION_ERROR', 'user_id và type bắt buộc');
  const ok = await deleteMemory(userId, type, req.params.id);
  return ok ? res.json({ deleted_at: new Date().toISOString(), request_id: res.locals.requestId }) : err(res, 404, 'NOT_FOUND', 'Không tìm thấy');
});

// ---------- GET /memory/export ----------
api.get('/memory/export', async (req, res) => {
  const userId = req.query.user_id as string | undefined;
  if (!userId) return err(res, 400, 'VALIDATION_ERROR', 'user_id bắt buộc');
  const data = await exportMemory(userId);
  return res.json(data);
});

// ---------- GET /life-map ----------
api.get('/life-map', async (req, res) => {
  const userId = req.query.user_id as string | undefined;
  if (!userId) return err(res, 400, 'VALIDATION_ERROR', 'user_id bắt buộc');
  const { rows } = await pool.query(
    `SELECT id, domain, content, status, version, updated_at FROM life_map_items
     WHERE user_id = $1 AND deleted_at IS NULL AND status <> 'ARCHIVED' ORDER BY domain`,
    [userId],
  );
  return res.json({ domains: rows, request_id: res.locals.requestId });
});

// ---------- POST /experiments ----------
api.post('/experiments', async (req, res) => {
  const schema = z.object({
    user_id: z.string().uuid(),
    hypothesis: z.string().min(1),
    small_experience: z.string().min(1),
    time_window: z.string().min(1),
    signal_to_notice: z.string().min(1),
    return_preference: z.string().min(1),
    support_or_obstacle: z.string().optional(),
    stop_condition: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return err(res, 400, 'VALIDATION_ERROR', parsed.error.message);
  const d = parsed.data;
  const { rows } = await pool.query<{ id: string; status: string }>(
    `INSERT INTO experiments (user_id, hypothesis, small_experience, time_window, signal_to_notice, return_preference, support_or_obstacle, stop_condition, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'CONFIRMED') RETURNING id, status`,
    [d.user_id, d.hypothesis, d.small_experience, d.time_window, d.signal_to_notice, d.return_preference, d.support_or_obstacle ?? null, d.stop_condition ?? null],
  );
  return res.status(201).json({ experiment: rows[0], request_id: res.locals.requestId });
});

// ---------- POST /experiments/:id/reviews ----------
api.post('/experiments/:id/reviews', async (req, res) => {
  const schema = z.object({
    what_happened: z.string().optional(),
    noticed: z.string().optional(),
    interpretation: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return err(res, 400, 'VALIDATION_ERROR', parsed.error.message);
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO experiment_reviews (experiment_id, what_happened, noticed, interpretation)
     VALUES ($1,$2,$3,$4) RETURNING id`,
    [req.params.id, parsed.data.what_happened ?? null, parsed.data.noticed ?? null, parsed.data.interpretation ?? null],
  );
  // Learning tạo ở trạng thái UNVERIFIED, không tự ghi Life Map (E04/E05)
  return res.json({ review: rows[0], proposed_updates: [], learning_status: 'UNVERIFIED', request_id: res.locals.requestId });
});

// ---------- POST /feedback ----------
api.post('/feedback', async (req, res) => {
  const schema = z.object({
    session_id: z.string().uuid(),
    feedback: z.enum(['CLEARER', 'PARTLY_CLEARER', 'UNCHANGED', 'MORE_CONFUSED', 'SKIPPED']),
  });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return err(res, 400, 'VALIDATION_ERROR', parsed.error.message);
  await pool.query(`UPDATE sessions SET session_feedback = $2 WHERE id = $1`, [parsed.data.session_id, parsed.data.feedback]);
  return res.json({ accepted: true, request_id: res.locals.requestId });
});

// ---------- GET /entitlement ----------
api.get('/entitlement', async (req, res) => {
  const ent = getEntitlement((req.query.tier as string) ?? 'FREE');
  return res.json({ ...ent, request_id: res.locals.requestId });
});
