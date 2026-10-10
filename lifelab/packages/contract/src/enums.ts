/**
 * Canonical enums — Life Lab V8.7.2
 * Nguồn: Master "Từ điển enum chính thức" + quyết định chuẩn hóa N01–N03.
 * Xem SPEC_CONFLICTS.md cho C04 (focus), C05 (memory_mode), C06 (verification_status).
 *
 * N02: conversation_state, outcome_type, event_type, verification_status, life_map_status,
 * experiment_status là các namespace TÁCH BIỆT dù label trùng nhau.
 */

// ---------- Conversation / State machine ----------
export const CONVERSATION_STATES = [
  'ENTRY',
  'CONSENT',
  'WHAT_MATTERS_NOW',
  'CURRENT_LIFE_DISCOVERY',
  'MINI_REFLECTION',
  'VERIFY',
  'REPAIR',
  'CURRENT_FOCUS_DISCOVERY',
  'CURRENT_FOCUS_CONFIRMATION',
  'OUTCOME_SELECTION',
  'CONTINUE_EXPLORATION',
  'PERMISSION_BEFORE_ADVICE',
  'EXPLORE_OPTIONS',
  'VERIFY_DIRECTION_FIT',
  'CONFIRMED_INSIGHT',
  'BETTER_QUESTION',
  'MEANINGFUL_NEXT_STEP',
  'LIFE_EXPERIMENT',
  'REFLECTIVE_PAUSE',
  'SESSION_OUTCOME_CHECKPOINT',
  'MEMORY_PERMISSION',
  'SESSION_FEEDBACK',
  'CONFUSION_REPAIR',
  'CLOSE',
  'CRISIS_SAFETY',
  'HIGH_STAKES_BOUNDARY',
  'RELATIONAL_BOUNDARY',
  'SUPPORT_PLANNING',
  'CHECK_IN',
  'EXPERIMENT_REFLECTION',
  'LIFE_MAP_UPDATE_PROPOSAL',
  'RETURN_SESSION',
] as const;
export type ConversationState = (typeof CONVERSATION_STATES)[number];

// ---------- Outcome ----------
export const OUTCOME_TYPES = [
  'CONFIRMED_INSIGHT',
  'BETTER_QUESTION',
  'MEANINGFUL_NEXT_STEP',
  'LIFE_EXPERIMENT',
  'REFLECTIVE_PAUSE',
] as const;
export type OutcomeType = (typeof OUTCOME_TYPES)[number];

// ---------- Memory mode (N01; C05) ----------
export const MEMORY_MODES = ['NO_MEMORY', 'ASK_LATER', 'PROPOSALS_ALLOWED'] as const;
export type MemoryMode = (typeof MEMORY_MODES)[number];

/** Alias migration — 'ALLOWED' mode cũ ánh xạ PROPOSALS_ALLOWED; không bao giờ auto-write. */
export function normalizeMemoryMode(raw: string): MemoryMode {
  if (raw === 'ALLOWED') return 'PROPOSALS_ALLOWED';
  if ((MEMORY_MODES as readonly string[]).includes(raw)) return raw as MemoryMode;
  return 'ASK_LATER';
}

// ---------- Permission status (per-item) ----------
export const PERMISSION_STATUSES = ['PENDING', 'ALLOWED', 'DENIED', 'REVOKED'] as const;
export type PermissionStatus = (typeof PERMISSION_STATUSES)[number];

// ---------- Life Map status (6 chính thức) ----------
export const LIFE_MAP_STATUSES = [
  'EXPLORING',
  'HYPOTHESIS',
  'CONFIRMED',
  'CHANGING',
  'CORRECTED',
  'ARCHIVED',
] as const;
export type LifeMapStatus = (typeof LIFE_MAP_STATUSES)[number];

// ---------- Verification status (8 giá trị — C06) ----------
export const VERIFICATION_STATUSES = [
  'PROPOSED',
  'UNVERIFIED',
  'PARTIAL',
  'CONFIRMED',
  'REJECTED',
  'SUPERSEDED',
  'EXPIRED',
  'NO_LONGER_CURRENT',
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

// ---------- Focus confirmation (N03; C04) ----------
export const FOCUS_CONFIRMATION_STATUSES = [
  'DRAFT',
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'REVISED',
] as const;
export type FocusConfirmationStatus = (typeof FOCUS_CONFIRMATION_STATUSES)[number];

export function normalizeFocusStatus(raw: string): FocusConfirmationStatus {
  if (raw === 'OPEN') return 'DRAFT';
  if (raw === 'HYPOTHESIS') return 'PENDING_CONFIRMATION';
  if ((FOCUS_CONFIRMATION_STATUSES as readonly string[]).includes(raw))
    return raw as FocusConfirmationStatus;
  return 'DRAFT';
}

// ---------- Experiment status ----------
export const EXPERIMENT_STATUSES = [
  'DRAFT',
  'CONFIRMED',
  'ACTIVE',
  'PARTIAL',
  'ADJUSTED',
  'STOPPED',
  'COMPLETED',
] as const;
export type ExperimentStatus = (typeof EXPERIMENT_STATUSES)[number];

// ---------- Safety level ----------
export const SAFETY_LEVELS = ['S0', 'S1', 'S2', 'S3'] as const;
export type SafetyLevel = (typeof SAFETY_LEVELS)[number];

export const SAFETY_FLOWS = [
  'NONE',
  'CRISIS_SAFETY',
  'HIGH_STAKES_BOUNDARY',
  'RELATIONAL_BOUNDARY',
] as const;
export type SafetyFlow = (typeof SAFETY_FLOWS)[number];

// ---------- Session feedback ----------
export const SESSION_FEEDBACKS = [
  'CLEARER',
  'PARTLY_CLEARER',
  'UNCHANGED',
  'MORE_CONFUSED',
  'SKIPPED',
] as const;
export type SessionFeedback = (typeof SESSION_FEEDBACKS)[number];

// ---------- Conversation techniques / actions ----------
export const ACTIONS = [
  'ASK',
  'REFLECT',
  'CONNECT',
  'PROPOSE',
  'PAUSE',
  'VERIFY',
  'REPAIR',
] as const;
export type Action = (typeof ACTIONS)[number];

// ---------- Memory item type ----------
export const MEMORY_ITEM_TYPES = [
  'LIFE_MAP',
  'RELATIONSHIP_MEMORY',
  'EXPERIMENT',
  'SESSION_OUTCOME',
] as const;
export type MemoryItemType = (typeof MEMORY_ITEM_TYPES)[number];

// ---------- Energy / engagement (User State) ----------
export const ENERGY_SIGNALS = ['NORMAL', 'POSSIBLY_LOW', 'USER_WANTS_PAUSE'] as const;
export type EnergySignal = (typeof ENERGY_SIGNALS)[number];

export const SUPPORT_INTENTS = [
  'HEARD',
  'UNDERSTAND',
  'EXPLORE',
  'OPTIONS',
  'STEP',
  'EXPERIMENT',
  'PAUSE',
] as const;
export type SupportIntent = (typeof SUPPORT_INTENTS)[number];

export const ADVICE_PERMISSIONS = [
  'NOT_REQUESTED',
  'GRANTED_FOR_CURRENT_SCOPE',
  'REVOKED',
] as const;
export type AdvicePermission = (typeof ADVICE_PERMISSIONS)[number];

export const RELATIONSHIP_STATES = [
  'NEW',
  'CALIBRATING',
  'ALIGNED',
  'REPAIR_NEEDED',
  'TRUST_SENSITIVE',
  'RETURNING',
] as const;
export type RelationshipState = (typeof RELATIONSHIP_STATES)[number];

export const JOURNEY_STATES = [
  'FIRST_SESSION',
  'OPEN_EXPLORATION',
  'DECISION_EXPLORATION',
  'EXPERIMENT_DESIGN',
  'EXPERIMENT_ACTIVE',
  'EXPERIMENT_REFLECTION',
  'REDESIGN',
  'INTEGRATE',
  'DORMANT',
] as const;
export type JourneyState = (typeof JOURNEY_STATES)[number];
