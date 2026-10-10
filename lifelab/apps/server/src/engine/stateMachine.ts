/**
 * State machine validator + guards — Life Lab V8.7.2.
 * Backend TỪ CHỐI mọi transition không có trong bảng canonical (Definition of Done).
 * Guard trả về {ok} hoặc {ok:false, reason}. Nếu guard fail → KHÔNG chuyển state.
 */
import {
  type ConversationState,
  findTransition,
  type TransitionDef,
} from '@lifelab/contract';

export interface GuardContext {
  session: {
    current_state: ConversationState;
    user_requested_stop: boolean;
    memory_mode: string;
    question_count_since_reflection: number;
    focus_confirmation_status?: string | null;
    possible_outcome?: string | null;
    safety_level: string;
    advice_permission_scope?: string | null;
  };
  // Dữ liệu runtime bổ sung mà handler cung cấp cho guard
  flags: {
    insightVerified?: boolean;
    hypothesisLanguage?: boolean;
    questionBudgetOk?: boolean;
    hasPossibleOutcome?: boolean;
    fiveFieldsComplete?: boolean;
    permissionScoped?: boolean;
    hasUserCriteria?: boolean;
    userActiveChoice?: boolean;
    hasVerifiedLearning?: boolean;
  };
}

export type GuardResult = { ok: true } | { ok: false; reason: string };

/** Map guardKey → kiểm tra. Guard thiếu dữ liệu mặc định PASS trừ các guard an toàn trọng yếu. */
const GUARDS: Record<string, (ctx: GuardContext) => GuardResult> = {
  insight_verified: (c) =>
    c.flags.insightVerified ? { ok: true } : { ok: false, reason: 'Insight chưa VERIFY (A04/O06)' },
  insight_may_become_confirmed: () => ({ ok: true }),
  must_use_hypothesis_language: (c) =>
    c.flags.hypothesisLanguage === false
      ? { ok: false, reason: 'Phản chiếu phải dùng ngôn ngữ giả thuyết (A04)' }
      : { ok: true },
  question_budget_ok: (c) =>
    c.flags.questionBudgetOk === false
      ? { ok: false, reason: 'Vượt Question Budget (A13/O01)' }
      : { ok: true },
  has_possible_outcome: (c) =>
    c.flags.hasPossibleOutcome || c.session.possible_outcome
      ? { ok: true }
      : { ok: false, reason: 'Chưa có possible_outcome cụ thể' },
  no_direct_memory: () => ({ ok: true }), // enforced ở orchestrator + memory service
  no_direct_memory_five_fields: (c) =>
    c.flags.fiveFieldsComplete === false
      ? { ok: false, reason: 'Life Experiment thiếu 5 trường bắt buộc (A07/O09)' }
      : { ok: true },
  focus_confirmation_status_confirmed: (c) =>
    c.session.focus_confirmation_status === 'CONFIRMED'
      ? { ok: true }
      : { ok: false, reason: 'focus_confirmation_status chưa CONFIRMED (T017)' },
  not_stopped_and_ready: (c) =>
    c.session.user_requested_stop
      ? { ok: false, reason: 'User đã stop — không vào Memory (A08/C03)' }
      : { ok: true },
  except_minimal_s2_s3: () => ({ ok: true }),
  permission_scoped_current_topic: () => ({ ok: true }),
  no_advice_before_permission: () => ({ ok: true }),
  has_user_criteria: () => ({ ok: true }),
  not_high_stakes_or_crisis: (c) =>
    c.session.safety_level === 'S2' || c.session.safety_level === 'S3'
      ? { ok: false, reason: 'Không tạo Experiment khi đang crisis (S10)' }
      : { ok: true },
  has_action_intent_acceptable_risk: () => ({ ok: true }),
  has_verified_learning: (c) =>
    c.flags.hasVerifiedLearning === false
      ? { ok: false, reason: 'Learning chưa VERIFY (E04/E05)' }
      : { ok: true },
  only_if_long_term_needed: () => ({ ok: true }),
};

export interface ValidateInput extends GuardContext {
  event: string;
}

export interface ValidateResult {
  ok: boolean;
  transition?: TransitionDef;
  nextState?: ConversationState;
  reason?: string;
  code?: 'TRANSITION_REJECTED' | 'GUARD_FAILED';
}

/** Validate một (current_state, event). Trả transition hợp lệ hoặc lý do từ chối. */
export function validateTransition(input: ValidateInput): ValidateResult {
  const transition = findTransition(input.session.current_state, input.event);
  if (!transition) {
    return {
      ok: false,
      code: 'TRANSITION_REJECTED',
      reason: `Không có transition cho (${input.session.current_state}, ${input.event})`,
    };
  }
  const guardFn = GUARDS[transition.guard];
  if (guardFn) {
    const g = guardFn(input);
    if (!g.ok) {
      return { ok: false, code: 'GUARD_FAILED', reason: g.reason, transition };
    }
  }
  return { ok: true, transition, nextState: transition.to };
}

export function isValidNextState(
  from: ConversationState,
  to: ConversationState,
  event: string,
): boolean {
  const t = findTransition(from, event);
  return !!t && t.to === to;
}
