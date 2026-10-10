/**
 * Turn Service — Life Lab V8.7.2.
 * Chạy một lượt hội thoại đồng bộ: persistence trong transaction (Phần 5 Pipeline).
 * - Insert user message → orchestrator → validate → persist state + assistant message + logs.
 * - Repair persistence khi user correction.
 * - Memory proposal tạo khi tới SESSION_OUTCOME_CHECKPOINT (không tự ghi).
 */
import { randomUUID } from 'node:crypto';
import type { TurnResponse, MemoryProposalView } from '@lifelab/contract';
import { config } from '../config.js';
import { withTx } from '../db/pool.js';
import {
  getSessionForUpdate,
  insertMessage,
  getRecentMessages,
  updateSession,
  logTurn,
  auditEvent,
} from './sessionRepo.js';
import { getActiveRepairRules, createProposals } from './memory.js';
import { handleTurn } from '../engine/orchestrator.js';
import { makeProvider } from '../engine/aiGateway.js';
import { classify } from '../engine/classifier.js';

const provider = makeProvider();

export class StateConflictError extends Error {
  code = 'STATE_VERSION_CONFLICT';
}
export class SessionClosedError extends Error {
  code = 'SESSION_CLOSED';
}

export async function runTurn(input: {
  sessionId: string;
  message: string | null;
  uiAction?: { type: string; value?: unknown } | null;
  expectedStateVersion?: number;
  requestId: string;
}): Promise<TurnResponse> {
  const started = Date.now();
  const recent = await getRecentMessages(input.sessionId, 8);
  const repairRules = await getActiveRepairRules(input.sessionId);

  const result = await withTx(async (client) => {
    const session = await getSessionForUpdate(client, input.sessionId);
    if (!session) throw new Error('SESSION_NOT_FOUND');
    if (session.closed_at) throw new SessionClosedError('Session đã đóng');

    if (
      input.expectedStateVersion !== undefined &&
      input.expectedStateVersion !== session.state_version
    ) {
      throw new StateConflictError(
        `expected ${input.expectedStateVersion} != ${session.state_version}`,
      );
    }

    // Insert user message (nếu có) + tạo Evidence record (Evidence Ledger, Phần 3)
    const evidenceIds: string[] = [];
    if (input.message) {
      const messageId = await insertMessage(client, {
        sessionId: session.id,
        role: 'user',
        content: input.message,
        requestId: input.requestId,
      });
      // Evidence source_type=USER_STATEMENT; permission mặc định SESSION_ONLY.
      const ev = await client.query<{ id: string }>(
        `INSERT INTO evidence (session_id, source_message_id, source_type, text, permission, sensitivity)
         VALUES ($1,$2,'USER_STATEMENT',$3,'SESSION_ONLY','NORMAL') RETURNING id`,
        [session.id, messageId, input.message],
      );
      evidenceIds.push(ev.rows[0].id);
    }

    const signals = classify(input.message);

    // Orchestrator quyết định
    const decision = await handleTurn({
      session: {
        current_state: session.current_state,
        user_requested_stop: session.user_requested_stop,
        memory_mode: session.memory_mode,
        question_count_since_reflection: session.question_count_since_reflection,
        focus_confirmation_status: session.focus_confirmation_status,
        possible_outcome: session.possible_outcome as never,
        safety_level: session.safety_level,
        advice_permission_scope: session.advice_permission_scope,
        asked_s2_question: session.current_state === 'CRISIS_SAFETY' && session.safety_level === 'S2',
      },
      message: input.message,
      uiAction: input.uiAction,
      recentTurns: recent,
      availableEvidenceIds: evidenceIds,
      repairRules,
      provider,
    });

    // Insight lifecycle: nếu model đề xuất insight_candidate hợp lệ, lưu UNVERIFIED + nối evidence.
    if (decision.insightCandidate && evidenceIds.length > 0) {
      const ins = await client.query<{ id: string }>(
        `INSERT INTO insights (user_id, session_id, text, verification_status, life_map_status, confidence, permission)
         VALUES ($1,$2,$3,'UNVERIFIED','HYPOTHESIS',$4,'PENDING') RETURNING id`,
        [session.user_id, session.id, decision.insightCandidate.text, decision.insightCandidate.confidence ?? null],
      );
      await client.query(
        `INSERT INTO insight_evidence (insight_id, evidence_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [ins.rows[0].id, evidenceIds[0]],
      );
    }

    // Khi user xác nhận tại VERIFY (CORRECT_ENOUGH) → nâng insight gần nhất lên CONFIRMED.
    if (session.current_state === 'VERIFY' && decision.event === 'CORRECT_ENOUGH') {
      await client.query(
        `UPDATE insights SET verification_status='CONFIRMED', life_map_status='CONFIRMED', last_confirmed_at=now()
         WHERE session_id=$1 AND verification_status='UNVERIFIED'`,
        [session.id],
      );
    }

    // Repair persistence: nếu user correction tại VERIFY/REPAIR
    if (signals.correction && (session.current_state === 'VERIFY' || session.current_state === 'MINI_REFLECTION')) {
      await client.query(
        `INSERT INTO repairs (session_id, rejected_text, repair_rule, scope, active)
         VALUES ($1,$2,$3,'SESSION_ONLY',true)`,
        [session.id, input.message ?? '', (input.message ?? '').slice(0, 120)],
      );
    }

    // Insert assistant message
    await insertMessage(client, {
      sessionId: session.id,
      role: 'assistant',
      content: decision.assistantMessage,
    });

    // Memory proposals: chỉ tạo khi tới checkpoint và không NO_MEMORY và không bị stop
    let proposalViews: MemoryProposalView[] = [];
    if (decision.nextState === 'MEMORY_PERMISSION' && !decision.blockMemory && !decision.close) {
      if (decision.memoryProposals.length > 0) {
        proposalViews = await createProposalsInTx(client, session.id, decision.memoryProposals);
      } else {
        // Chưa có proposal từ model → lấy insight CONFIRMED gần nhất của phiên làm proposal.
        const conf = await client.query<{ text: string }>(
          `SELECT text FROM insights WHERE session_id=$1 AND verification_status='CONFIRMED' ORDER BY last_confirmed_at DESC NULLS LAST, created_at DESC LIMIT 1`,
          [session.id],
        );
        const content = conf.rows[0]?.text
          ?? 'Điều bạn vừa làm rõ trong phiên này';
        proposalViews = await createProposalsInTx(client, session.id, [
          { item_type: 'SESSION_OUTCOME', content, reason: 'Điều bạn đã xác nhận trong phiên — lưu để lần sau tiếp nối.' },
        ]);
      }
    }

    // Cập nhật session state
    const newVersion = await updateSession(client, session.id, {
      previous_state: session.current_state,
      current_state: decision.nextState,
      safety_level: decision.safety.level,
      user_requested_stop: decision.close && decision.reasonCodes.includes('USER_STOP') ? true : session.user_requested_stop,
      possible_outcome: decision.possibleOutcome,
      question_count_since_reflection:
        decision.selectedAction === 'REFLECT' || decision.selectedAction === 'VERIFY' || decision.selectedAction === 'PAUSE'
          ? 0
          : session.question_count_since_reflection + (decision.selectedAction === 'ASK' ? 1 : 0),
      closed_at: decision.close ? new Date().toISOString() : null,
    });

    await logTurn(client, {
      requestId: input.requestId,
      sessionId: session.id,
      promptVersion: config.promptVersion,
      modelVersion: `${config.aiProvider}:${config.aiModel}`,
      stateBefore: session.current_state,
      event: decision.event,
      stateAfter: decision.nextState,
      validation: decision.guardViolation ? `GUARD:${decision.guardViolation}` : 'OK',
      latencyMs: Date.now() - started,
    });

    if (decision.guardViolation) {
      await auditEvent(client, {
        action: 'TRANSITION_REJECTED',
        resourceType: 'session',
        resourceId: session.id,
        result: 'REJECTED',
        metadata: { reason: decision.guardViolation },
      });
    }

    const response: TurnResponse = {
      request_id: input.requestId,
      assistant_message: decision.assistantMessage,
      state: decision.nextState,
      state_version: newVersion,
      ui_actions: decision.uiActions,
      possible_outcome: decision.possibleOutcome,
      memory_proposal: proposalViews.length ? { proposals: proposalViews } : null,
      safety: { ...decision.safety, level: decision.safety.level as 'S0' | 'S1' | 'S2' | 'S3' },
      server_time: new Date().toISOString(),
      closed: decision.close,
    };
    return response;
  });

  return result;
}

async function createProposalsInTx(
  client: Parameters<Parameters<typeof withTx>[0]>[0],
  sessionId: string,
  proposals: { item_type: string; content: string; reason: string }[],
): Promise<MemoryProposalView[]> {
  const views: MemoryProposalView[] = [];
  for (const p of proposals) {
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO memory_proposals (session_id, item_type, content, reason, decision)
       VALUES ($1,$2,$3,$4,'PENDING') RETURNING id`,
      [sessionId, p.item_type, p.content, p.reason],
    );
    views.push({ id: rows[0].id, item_type: p.item_type as never, content: p.content, reason: p.reason });
  }
  return views;
}

export { createProposals };
