import { describe, it, expect } from 'vitest';
import { handleTurn, computeAllowedNextStates } from '../src/engine/orchestrator.js';
import { MockProvider } from '../src/engine/aiGateway.js';
import { runQualityGuard, safeFallback } from '../src/engine/qualityGuard.js';
import { SCHEMA_VERSION } from '@lifelab/contract';

const provider = new MockProvider();
const baseSession = {
  current_state: 'WHAT_MATTERS_NOW' as const,
  user_requested_stop: false,
  memory_mode: 'ASK_LATER',
  question_count_since_reflection: 0,
  safety_level: 'S0',
};
const baseCtx = {
  recentTurns: [],
  availableEvidenceIds: [],
  repairRules: [],
  provider,
};

describe('Orchestrator — priority order (Crisis > Stop > Privacy > State)', () => {
  it('Crisis S3 ngắt mọi flow, close, block memory', async () => {
    const d = await handleTurn({ ...baseCtx, session: baseSession, message: 'tôi muốn chết, đã có kế hoạch cắt tay' });
    expect(d.interrupted).toBe(true);
    expect(d.close).toBe(true);
    expect(d.blockMemory).toBe(true);
    expect(d.safety.flow).toBe('CRISIS_SAFETY');
  });

  it('A01: USER_STOP giữa phiên → CLOSE, không câu hỏi/memory', async () => {
    const d = await handleTurn({ ...baseCtx, session: baseSession, message: 'dừng lại' });
    expect(d.nextState).toBe('CLOSE');
    expect(d.close).toBe(true);
    expect(d.blockMemory).toBe(true);
    expect(d.memoryProposals).toHaveLength(0);
    expect((d.assistantMessage.match(/\?/g) || []).length).toBe(0);
  });

  it('Crisis ưu tiên hơn stop khi cùng xuất hiện (S3 + dừng)', async () => {
    const d = await handleTurn({ ...baseCtx, session: baseSession, message: 'tôi sẽ tự tử, đừng hỏi nữa' });
    expect(d.safety.flow).toBe('CRISIS_SAFETY');
    expect(d.safety.level).toBe('S3');
    expect(d.close).toBe(true);
  });

  it('A09: NO_MEMORY vẫn tiếp tục hội thoại nhưng blockMemory', async () => {
    const d = await handleTurn({
      ...baseCtx,
      session: { ...baseSession, memory_mode: 'NO_MEMORY' },
      message: 'tôi muốn chủ động hơn trong công việc',
    });
    expect(d.blockMemory).toBe(true);
    expect(d.memoryProposals).toHaveLength(0);
    expect(d.close).toBe(false); // vẫn tiếp tục
  });

  it('High stakes không crisis → HIGH_STAKES_BOUNDARY, không S0-S3 escalate', async () => {
    const d = await handleTurn({ ...baseCtx, session: baseSession, message: 'tôi có nên ký hợp đồng này không' });
    expect(d.nextState).toBe('HIGH_STAKES_BOUNDARY');
    expect(d.safety.flow).toBe('HIGH_STAKES_BOUNDARY');
  });

  it('Relational dependency → RELATIONAL_BOUNDARY', async () => {
    const d = await handleTurn({ ...baseCtx, session: baseSession, message: 'tôi chỉ cần bạn thôi, đừng rời bỏ tôi' });
    expect(d.nextState).toBe('RELATIONAL_BOUNDARY');
  });

  it('computeAllowedNextStates gồm interrupt ANY (CLOSE qua USER_STOP)', () => {
    const next = computeAllowedNextStates('MINI_REFLECTION');
    expect(next).toContain('VERIFY');
    expect(next).toContain('CLOSE'); // từ T052 ANY
  });
});

describe('Quality Guard (AC010, A13, MEMORY, HYPOTHESIS)', () => {
  const guardBase = {
    currentState: 'MINI_REFLECTION' as const,
    allowedNextStates: ['VERIFY'] as const,
    controlFlags: { user_stop: false, no_memory: false },
    availableEvidenceIds: ['ev1'],
    repairRules: [],
  };

  it('AC010: JSON hỏng → không pass', () => {
    const r = runQualityGuard({ ...guardBase, raw: '{broken json' });
    expect(r.ok).toBe(false);
    expect(r.rule).toBe('SCHEMA');
  });

  it('TRANSITION: next_state ngoài allowlist bị chặn', () => {
    const out = { ...validOut(), proposed_next_state: 'OUTCOME_SELECTION' };
    const r = runQualityGuard({ ...guardBase, raw: JSON.stringify(out) });
    expect(r.ok).toBe(false);
    expect(r.rule).toBe('TRANSITION');
  });

  it('QUESTION_BUDGET: question_count=0 nhưng có "?" bị chặn', () => {
    const out = { ...validOut(), question_count: 0, assistant_message: 'Bạn thấy sao?' };
    const r = runQualityGuard({ ...guardBase, raw: JSON.stringify(out) });
    expect(r.ok).toBe(false);
    expect(r.rule).toBe('QUESTION_BUDGET');
  });

  it('A13: hơn một câu hỏi bị chặn', () => {
    const out = { ...validOut(), question_count: 1, assistant_message: 'A? B?' };
    const r = runQualityGuard({ ...guardBase, raw: JSON.stringify(out) });
    expect(r.ok).toBe(false);
    expect(r.rule).toBe('QUESTION_BUDGET');
  });

  it('GROUNDING: evidence ngoài context bị chặn', () => {
    const out = { ...validOut(), evidence_used: ['ev_khong_co'] };
    const r = runQualityGuard({ ...guardBase, raw: JSON.stringify(out) });
    expect(r.ok).toBe(false);
    expect(r.rule).toBe('GROUNDING');
  });

  it('MEMORY: proposal ngoài checkpoint là P0 fail', () => {
    const out = { ...validOut(), memory_proposals: [{ item_type: 'LIFE_MAP', content: 'x', source: 'USER_WORDS', reason: 'y' }] };
    const r = runQualityGuard({ ...guardBase, raw: JSON.stringify(out) });
    expect(r.ok).toBe(false);
    expect(r.rule).toBe('MEMORY');
  });

  it('HYPOTHESIS: ngôn ngữ chắc chắn bị chặn', () => {
    const out = {
      ...validOut(),
      insight_candidate: { text: 'Bạn là người luôn luôn trì hoãn', verification_status: 'UNVERIFIED', scope: {}, confidence: 0.9 },
    };
    const r = runQualityGuard({ ...guardBase, raw: JSON.stringify(out) });
    expect(r.ok).toBe(false);
    expect(r.rule).toBe('HYPOTHESIS');
  });

  it('REPAIR: lặp insight đã reject bị chặn', () => {
    const out = {
      ...validOut(),
      insight_candidate: { text: 'bạn ghét công việc hiện tại', verification_status: 'UNVERIFIED', scope: {}, confidence: 0.5 },
    };
    const r = runQualityGuard({ ...guardBase, raw: JSON.stringify(out), repairRules: ['bạn ghét công việc hiện tại'] });
    expect(r.ok).toBe(false);
    expect(r.rule).toBe('REPAIR');
  });

  it('safeFallback không có insight/memory/advice', () => {
    const fb = safeFallback('VERIFY');
    expect(fb.insight_candidate).toBeNull();
    expect(fb.memory_proposals).toHaveLength(0);
    expect(fb.question_count).toBe(0);
  });

  it('output hợp lệ pass', () => {
    const r = runQualityGuard({ ...guardBase, raw: JSON.stringify(validOut()) });
    expect(r.ok).toBe(true);
  });
});

function validOut() {
  return {
    schema_version: SCHEMA_VERSION,
    selected_action: 'REFLECT',
    assistant_message: 'Có vẻ như bạn đang muốn chủ động hơn.',
    question_count: 0,
    evidence_used: ['ev1'],
    insight_candidate: null,
    event: 'REFLECTED_HYPOTHESIS',
    proposed_next_state: 'VERIFY',
    possible_outcome: null,
    memory_proposals: [],
    safety_response: null,
    ui_actions: [],
    internal_reason_codes: [],
  };
}
