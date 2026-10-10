import { describe, it, expect } from 'vitest';
import { TRANSITIONS, findTransition } from '@lifelab/contract';
import { validateTransition } from '../src/engine/stateMachine.js';

describe('Canonical transition table T001-T063', () => {
  it('có đúng 63 transition T001..T063', () => {
    expect(TRANSITIONS.length).toBe(63);
    const ids = TRANSITIONS.map((t) => t.id);
    for (let i = 1; i <= 63; i++) {
      expect(ids).toContain(`T${String(i).padStart(3, '0')}`);
    }
  });

  it('mỗi transition có from, event, to, guard', () => {
    for (const t of TRANSITIONS) {
      expect(t.from).toBeTruthy();
      expect(t.event).toBeTruthy();
      expect(t.to).toBeTruthy();
      expect(t.guard).toBeTruthy();
    }
  });

  it('positive: mỗi (from,event) tra được transition', () => {
    for (const t of TRANSITIONS) {
      if (t.from === 'ANY') continue;
      const found = findTransition(t.from as never, t.event);
      expect(found?.id, `${t.id}`).toBe(t.id);
    }
  });

  it('negative: event không tồn tại bị TRANSITION_REJECTED', () => {
    const r = validateTransition({
      session: {
        current_state: 'ENTRY',
        user_requested_stop: false,
        memory_mode: 'ASK_LATER',
        question_count_since_reflection: 0,
        safety_level: 'S0',
      },
      flags: {},
      event: 'EVENT_KHONG_TON_TAI',
    });
    expect(r.ok).toBe(false);
    expect(r.code).toBe('TRANSITION_REJECTED');
  });

  it('negative: guard chặn — focus chưa CONFIRMED không rời CURRENT_FOCUS_CONFIRMATION (T017)', () => {
    const r = validateTransition({
      session: {
        current_state: 'CURRENT_FOCUS_CONFIRMATION',
        user_requested_stop: false,
        memory_mode: 'ASK_LATER',
        question_count_since_reflection: 0,
        safety_level: 'S0',
        focus_confirmation_status: 'PENDING_CONFIRMATION',
      },
      flags: {},
      event: 'CONFIRM',
    });
    expect(r.ok).toBe(false);
    expect(r.code).toBe('GUARD_FAILED');
  });

  it('negative: không tạo Life Experiment khi crisis S2/S3 (T034 guard)', () => {
    const r = validateTransition({
      session: {
        current_state: 'EXPLORE_OPTIONS',
        user_requested_stop: false,
        memory_mode: 'ASK_LATER',
        question_count_since_reflection: 0,
        safety_level: 'S3',
      },
      flags: {},
      event: 'WANTS_VERIFY',
    });
    expect(r.ok).toBe(false);
  });

  it('positive: T017 CONFIRM khi focus CONFIRMED → OUTCOME_SELECTION', () => {
    const r = validateTransition({
      session: {
        current_state: 'CURRENT_FOCUS_CONFIRMATION',
        user_requested_stop: false,
        memory_mode: 'ASK_LATER',
        question_count_since_reflection: 0,
        safety_level: 'S0',
        focus_confirmation_status: 'CONFIRMED',
      },
      flags: {},
      event: 'CONFIRM',
    });
    expect(r.ok).toBe(true);
    expect(r.nextState).toBe('OUTCOME_SELECTION');
  });

  it('USER_STOP là interrupt ANY → CLOSE (T052)', () => {
    const t = findTransition('MINI_REFLECTION', 'USER_STOP');
    expect(t?.id).toBe('T052');
    expect(t?.to).toBe('CLOSE');
  });

  it('mọi outcome đi qua SESSION_OUTCOME_CHECKPOINT (T039-T043), không thẳng Memory', () => {
    for (const id of ['T039', 'T040', 'T041', 'T042', 'T043']) {
      const t = TRANSITIONS.find((x) => x.id === id)!;
      expect(t.to).toBe('SESSION_OUTCOME_CHECKPOINT');
    }
  });

  it('T062 LIFE_MAP_UPDATE_PROPOSAL → MEMORY_PERMISSION; T063 disagree → OUTCOME_SELECTION', () => {
    expect(TRANSITIONS.find((t) => t.id === 'T062')!.to).toBe('MEMORY_PERMISSION');
    expect(TRANSITIONS.find((t) => t.id === 'T063')!.to).toBe('OUTCOME_SELECTION');
  });
});
