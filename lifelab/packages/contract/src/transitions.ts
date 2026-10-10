/**
 * Canonical State Transition Table — Life Lab V8.7.2 (T001–T063).
 * Nguồn: Master Phần 2 "Canonical State Transition Table".
 * KHÔNG tự thêm transition (xem SPEC_CONFLICTS C02: không có T064–T069).
 *
 * guardKey: tên guard được backend đánh giá. 'ANY' current state nghĩa interrupt toàn cục.
 */
import type { ConversationState } from './enums.js';

export interface TransitionDef {
  id: string;
  from: ConversationState | 'ANY';
  event: string;
  to: ConversationState;
  guard: string; // mô tả guard (contract) — backend map sang hàm guard
}

export const TRANSITIONS: readonly TransitionDef[] = [
  { id: 'T001', from: 'ENTRY', event: 'SAFETY_SIGNAL_S2_S3', to: 'CRISIS_SAFETY', guard: 'safety_classifier_has_evidence' },
  { id: 'T002', from: 'ENTRY', event: 'NO_CRISIS_FIRST_SESSION', to: 'CONSENT', guard: 'no_valid_consent' },
  { id: 'T003', from: 'ENTRY', event: 'NO_CRISIS_RETURN_SESSION', to: 'RETURN_SESSION', guard: 'consent_valid_or_reasked' },
  { id: 'T004', from: 'CONSENT', event: 'AGREE_CONTINUE', to: 'WHAT_MATTERS_NOW', guard: 'privacy_choice_recorded_no_default_memory' },
  { id: 'T005', from: 'CONSENT', event: 'DECLINE_OR_STOP', to: 'CLOSE', guard: 'no_reason_asked' },
  { id: 'T006', from: 'RETURN_SESSION', event: 'HAS_CURRENT_TOPIC', to: 'WHAT_MATTERS_NOW', guard: 'no_assume_old_lifemap' },
  { id: 'T007', from: 'WHAT_MATTERS_NOW', event: 'ENOUGH_MINIMAL_CONTEXT', to: 'MINI_REFLECTION', guard: 'no_force_full_fields' },
  { id: 'T008', from: 'WHAT_MATTERS_NOW', event: 'NEED_CURRENT_LIFE', to: 'CURRENT_LIFE_DISCOVERY', guard: 'user_ready_to_explore' },
  { id: 'T009', from: 'CURRENT_LIFE_DISCOVERY', event: 'ENOUGH_TO_REFLECT', to: 'MINI_REFLECTION', guard: 'question_budget_ok' },
  { id: 'T010', from: 'MINI_REFLECTION', event: 'REFLECTED_HYPOTHESIS', to: 'VERIFY', guard: 'must_use_hypothesis_language' },
  { id: 'T011', from: 'VERIFY', event: 'CORRECT_ENOUGH', to: 'CURRENT_FOCUS_DISCOVERY', guard: 'insight_may_become_confirmed' },
  { id: 'T012', from: 'VERIFY', event: 'PARTIAL_OR_WRONG', to: 'REPAIR', guard: 'no_defend_old_inference' },
  { id: 'T013', from: 'VERIFY', event: 'WANTS_EXPLORE_FIRST', to: 'CONTINUE_EXPLORATION', guard: 'user_active_choice' },
  { id: 'T014', from: 'REPAIR', event: 'HAS_CORRECTED_UNDERSTANDING', to: 'VERIFY', guard: 'reflect_once' },
  { id: 'T015', from: 'REPAIR', event: 'NOT_ENOUGH_DATA', to: 'CURRENT_LIFE_DISCOVERY', guard: 'at_most_one_question' },
  { id: 'T016', from: 'CURRENT_FOCUS_DISCOVERY', event: 'HAS_FOCUS_PROPOSAL', to: 'CURRENT_FOCUS_CONFIRMATION', guard: 'focus_is_hypothesis' },
  { id: 'T017', from: 'CURRENT_FOCUS_CONFIRMATION', event: 'CONFIRM', to: 'OUTCOME_SELECTION', guard: 'focus_confirmation_status_confirmed' },
  { id: 'T018', from: 'CURRENT_FOCUS_CONFIRMATION', event: 'EDIT', to: 'REPAIR', guard: 'old_not_current' },
  { id: 'T019', from: 'CURRENT_FOCUS_CONFIRMATION', event: 'UNSURE', to: 'CONTINUE_EXPLORATION', guard: 'keep_focus_open_no_force' },
  { id: 'T020', from: 'OUTCOME_SELECTION', event: 'STOP_WITH_INSIGHT', to: 'CONFIRMED_INSIGHT', guard: 'insight_verified' },
  { id: 'T021', from: 'OUTCOME_SELECTION', event: 'STOP_WITH_QUESTION', to: 'BETTER_QUESTION', guard: 'question_chosen_or_edited' },
  { id: 'T022', from: 'OUTCOME_SELECTION', event: 'STOP_TO_THINK', to: 'REFLECTIVE_PAUSE', guard: 'not_a_failure' },
  { id: 'T023', from: 'OUTCOME_SELECTION', event: 'CONTINUE_EXPLORE', to: 'CONTINUE_EXPLORATION', guard: 'open_one_layer' },
  { id: 'T024', from: 'OUTCOME_SELECTION', event: 'WANTS_DIRECTIONS', to: 'PERMISSION_BEFORE_ADVICE', guard: 'no_advice_before_permission' },
  { id: 'T025', from: 'OUTCOME_SELECTION', event: 'WANTS_SMALL_STEP', to: 'MEANINGFUL_NEXT_STEP', guard: 'no_auto_task_deadline' },
  { id: 'T026', from: 'OUTCOME_SELECTION', event: 'WANTS_EXPERIMENT', to: 'LIFE_EXPERIMENT', guard: 'has_action_intent_acceptable_risk' },
  { id: 'T027', from: 'CONTINUE_EXPLORATION', event: 'HAS_NEW_DATA', to: 'MINI_REFLECTION', guard: 'budget_reached_or_pattern' },
  { id: 'T028', from: 'CONTINUE_EXPLORATION', event: 'ENOUGH_VALUE', to: 'SESSION_OUTCOME_CHECKPOINT', guard: 'has_possible_outcome' },
  { id: 'T029', from: 'CONTINUE_EXPLORATION', event: 'CHANGE_FOCUS', to: 'CURRENT_FOCUS_DISCOVERY', guard: 'no_auto_link_new_old' },
  { id: 'T030', from: 'PERMISSION_BEFORE_ADVICE', event: 'AGREE', to: 'EXPLORE_OPTIONS', guard: 'permission_scoped_current_topic' },
  { id: 'T031', from: 'PERMISSION_BEFORE_ADVICE', event: 'DECLINE', to: 'CONTINUE_EXPLORATION', guard: 'no_advice' },
  { id: 'T032', from: 'EXPLORE_OPTIONS', event: 'LOOK_ONE_DIRECTION', to: 'VERIFY_DIRECTION_FIT', guard: 'has_user_criteria' },
  { id: 'T033', from: 'EXPLORE_OPTIONS', event: 'CHOOSE_SMALL_STEP', to: 'MEANINGFUL_NEXT_STEP', guard: 'step_owned_by_user' },
  { id: 'T034', from: 'EXPLORE_OPTIONS', event: 'WANTS_VERIFY', to: 'LIFE_EXPERIMENT', guard: 'not_high_stakes_or_crisis' },
  { id: 'T035', from: 'EXPLORE_OPTIONS', event: 'NOT_READY_CHOOSE', to: 'REFLECTIVE_PAUSE', guard: 'no_pressure' },
  { id: 'T036', from: 'VERIFY_DIRECTION_FIT', event: 'FITS_WANTS_DO', to: 'MEANINGFUL_NEXT_STEP', guard: 'fit_confirmed' },
  { id: 'T037', from: 'VERIFY_DIRECTION_FIT', event: 'WANTS_TRY_FIRST', to: 'LIFE_EXPERIMENT', guard: 'has_stop_condition_if_needed' },
  { id: 'T038', from: 'VERIFY_DIRECTION_FIT', event: 'NOT_FIT', to: 'EXPLORE_OPTIONS', guard: 'drop_old_no_argue' },
  { id: 'T039', from: 'CONFIRMED_INSIGHT', event: 'CONTENT_CONFIRMED', to: 'SESSION_OUTCOME_CHECKPOINT', guard: 'no_direct_memory' },
  { id: 'T040', from: 'BETTER_QUESTION', event: 'QUESTION_CONFIRMED', to: 'SESSION_OUTCOME_CHECKPOINT', guard: 'no_direct_memory' },
  { id: 'T041', from: 'MEANINGFUL_NEXT_STEP', event: 'STEP_CONFIRMED', to: 'SESSION_OUTCOME_CHECKPOINT', guard: 'no_direct_memory' },
  { id: 'T042', from: 'LIFE_EXPERIMENT', event: 'SCHEMA_CONFIRMED', to: 'SESSION_OUTCOME_CHECKPOINT', guard: 'no_direct_memory_five_fields' },
  { id: 'T043', from: 'REFLECTIVE_PAUSE', event: 'USER_CONFIRMS_USEFUL', to: 'SESSION_OUTCOME_CHECKPOINT', guard: 'if_only_stop_use_user_stop' },
  { id: 'T044', from: 'SESSION_OUTCOME_CHECKPOINT', event: 'KEEP_HAS_ELIGIBLE', to: 'MEMORY_PERMISSION', guard: 'not_stopped_and_ready' },
  { id: 'T045', from: 'SESSION_OUTCOME_CHECKPOINT', event: 'KEEP_NOTHING_OR_NO_MEMORY', to: 'SESSION_FEEDBACK', guard: 'feedback_only_if_fit' },
  { id: 'T046', from: 'SESSION_OUTCOME_CHECKPOINT', event: 'WANTS_CONTINUE', to: 'CONTINUE_EXPLORATION', guard: 'no_many_layers' },
  { id: 'T047', from: 'SESSION_OUTCOME_CHECKPOINT', event: 'CHANGE_FOCUS', to: 'CURRENT_FOCUS_DISCOVERY', guard: 'new_focus_hypothesis' },
  { id: 'T048', from: 'MEMORY_PERMISSION', event: 'DECIDED_SAVE_OR_NOT', to: 'SESSION_FEEDBACK', guard: 'only_write_agreed_items' },
  { id: 'T049', from: 'SESSION_FEEDBACK', event: 'CLEARER_OR_PARTLY_OR_UNCHANGED', to: 'CLOSE', guard: 'no_more_questions' },
  { id: 'T050', from: 'SESSION_FEEDBACK', event: 'MORE_CONFUSED', to: 'CONFUSION_REPAIR', guard: 'one_repair_turn' },
  { id: 'T051', from: 'CONFUSION_REPAIR', event: 'REPAIRED_OR_STOP', to: 'CLOSE', guard: 'no_reopen_outcome' },
  { id: 'T052', from: 'ANY', event: 'USER_STOP', to: 'CLOSE', guard: 'except_minimal_s2_s3' },
  { id: 'T053', from: 'ANY', event: 'HIGH_STAKES_NO_CRISIS', to: 'HIGH_STAKES_BOUNDARY', guard: 'no_diagnose_or_decide' },
  { id: 'T054', from: 'HIGH_STAKES_BOUNDARY', event: 'RISK_APPEARS', to: 'CRISIS_SAFETY', guard: 'safety_priority' },
  { id: 'T055', from: 'HIGH_STAKES_BOUNDARY', event: 'PREPARED_QUESTIONS_OR_SUPPORT', to: 'CLOSE', guard: 'may_return_safe_reflection' },
  { id: 'T056', from: 'ANY', event: 'RELATIONAL_DEPENDENCY_SIGNAL', to: 'RELATIONAL_BOUNDARY', guard: 'no_exclusive_intimacy' },
  { id: 'T057', from: 'RELATIONAL_BOUNDARY', event: 'RISK_APPEARS', to: 'CRISIS_SAFETY', guard: 'safety_priority' },
  { id: 'T058', from: 'RELATIONAL_BOUNDARY', event: 'WANTS_HUMAN_CONNECTION', to: 'SUPPORT_PLANNING', guard: 'at_most_one_step' },
  { id: 'T059', from: 'SUPPORT_PLANNING', event: 'CHOSE_SUPPORT_OR_STOP', to: 'CLOSE', guard: 'no_force_contact' },
  { id: 'T060', from: 'CHECK_IN', event: 'HAS_EXPERIMENT_DATA', to: 'EXPERIMENT_REFLECTION', guard: 'no_success_failure_question' },
  { id: 'T061', from: 'EXPERIMENT_REFLECTION', event: 'HAS_VERIFIED_LEARNING', to: 'LIFE_MAP_UPDATE_PROPOSAL', guard: 'no_write_yet' },
  { id: 'T062', from: 'LIFE_MAP_UPDATE_PROPOSAL', event: 'AGREE_EACH_CHANGE', to: 'MEMORY_PERMISSION', guard: 'only_if_long_term_needed' },
  { id: 'T063', from: 'LIFE_MAP_UPDATE_PROPOSAL', event: 'DISAGREE', to: 'OUTCOME_SELECTION', guard: 'keep_old_no_write_proposal' },
] as const;

/** Index để tra cứu nhanh: key = `${from}::${event}` */
export const TRANSITION_INDEX: Map<string, TransitionDef> = new Map(
  TRANSITIONS.map((t) => [`${t.from}::${t.event}`, t]),
);

/** Interrupt toàn cục (from = ANY) — kiểm theo priority ngoài bảng thường. */
export const GLOBAL_INTERRUPTS = TRANSITIONS.filter((t) => t.from === 'ANY');

export function findTransition(
  from: ConversationState,
  event: string,
): TransitionDef | undefined {
  return (
    TRANSITION_INDEX.get(`${from}::${event}`) ??
    TRANSITION_INDEX.get(`ANY::${event}`)
  );
}
