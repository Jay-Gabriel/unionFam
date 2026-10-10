import { describe, it, expect } from 'vitest';
import { classify } from '../src/engine/classifier.js';
import { handleTurn } from '../src/engine/orchestrator.js';
import { MockProvider } from '../src/engine/aiGateway.js';

const provider = new MockProvider();
const base = {
  recentTurns: [], availableEvidenceIds: [], repairRules: [], provider,
};
const sess = (state: string) => ({
  current_state: state as any, user_requested_stop: false, memory_mode: 'PROPOSALS_ALLOWED',
  question_count_since_reflection: 0, safety_level: 'S0',
});

describe('Stop vs Keep-result (classifier)', () => {
  it('"Dừng với điều vừa rõ" KHÔNG phải user_stop', () => {
    expect(classify('Dừng với điều vừa rõ').user_stop).toBe(false);
  });
  it('"dừng lại" / "thôi dừng" LÀ user_stop', () => {
    expect(classify('dừng lại').user_stop).toBe(true);
    expect(classify('mình muốn dừng').user_stop).toBe(true);
  });
  it('"giữ điều này" KHÔNG phải stop', () => {
    expect(classify('mình muốn giữ điều này').user_stop).toBe(false);
  });
});

describe('Choice handler — Outcome & Checkpoint flow', () => {
  it('OUTCOME_SELECTION + "Dừng với điều vừa rõ" → CONFIRMED_INSIGHT (không CLOSE)', async () => {
    const d = await handleTurn({ ...base, session: sess('OUTCOME_SELECTION'), message: 'Dừng với điều vừa rõ' });
    expect(d.nextState).toBe('CONFIRMED_INSIGHT');
    expect(d.close).toBe(false);
    expect(d.possibleOutcome).toBe('CONFIRMED_INSIGHT');
  });
  it('CONFIRMED_INSIGHT → SESSION_OUTCOME_CHECKPOINT', async () => {
    const d = await handleTurn({ ...base, session: sess('CONFIRMED_INSIGHT'), message: 'ok' });
    expect(d.nextState).toBe('SESSION_OUTCOME_CHECKPOINT');
  });
  it('CHECKPOINT + "Giữ lại" → MEMORY_PERMISSION', async () => {
    const d = await handleTurn({ ...base, session: sess('SESSION_OUTCOME_CHECKPOINT'), message: 'Giữ lại' });
    expect(d.nextState).toBe('MEMORY_PERMISSION');
  });
  it('CHECKPOINT + "Kết thúc" → SESSION_FEEDBACK', async () => {
    const d = await handleTurn({ ...base, session: sess('SESSION_OUTCOME_CHECKPOINT'), message: 'Kết thúc' });
    expect(d.nextState).toBe('SESSION_FEEDBACK');
  });
  it('VERIFY + "Chưa đúng" → REPAIR', async () => {
    const d = await handleTurn({ ...base, session: sess('VERIFY'), message: 'Chưa đúng' });
    expect(d.nextState).toBe('REPAIR');
  });
  it('CURRENT_FOCUS_CONFIRMATION + "Đúng, đây là trọng tâm" → OUTCOME_SELECTION', async () => {
    const d = await handleTurn({ ...base, session: sess('CURRENT_FOCUS_CONFIRMATION'), message: 'Đúng, đây là trọng tâm' });
    expect(d.nextState).toBe('OUTCOME_SELECTION');
  });
  it('canonical ui_actions: VERIFY có 3 lựa chọn', async () => {
    const d = await handleTurn({ ...base, session: sess('MINI_REFLECTION'), message: 'ừ' });
    // MINI_REFLECTION→VERIFY (mock), ui phải có VERIFY_CHOICES
    const hasChoices = d.uiActions.some((a) => a.type === 'VERIFY_CHOICES');
    expect(hasChoices).toBe(true);
  });
});
