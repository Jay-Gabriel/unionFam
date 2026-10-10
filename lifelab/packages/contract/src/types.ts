/**
 * Shared types — Life Lab V8.7.2
 * AI structured output (Phần 6), classifier, turn request/response (Phần 5), User State snapshot.
 */
import type {
  Action,
  AdvicePermission,
  ConversationState,
  EnergySignal,
  JourneyState,
  MemoryItemType,
  MemoryMode,
  OutcomeType,
  RelationshipState,
  SafetyFlow,
  SafetyLevel,
  SessionFeedback,
  SupportIntent,
  VerificationStatus,
} from './enums.js';

export const SCHEMA_VERSION = '8.7.1';

// ---------- Classifier output (Phần 6) ----------
export interface ClassifierOutput {
  crisis: { detected: boolean; level: SafetyLevel; signals: string[]; confidence: number };
  user_stop: boolean;
  high_stakes: { detected: boolean; domain: string | null };
  relational_dependency: boolean;
  no_memory: boolean;
  correction: boolean;
  topic_change: boolean;
  low_energy: boolean;
}

// ---------- AI structured output (Phần 6) ----------
export interface InsightCandidate {
  text: string;
  verification_status: Extract<VerificationStatus, 'PROPOSED' | 'UNVERIFIED'>;
  scope: { life_area?: string[]; generality?: 'DOMAIN' | 'SITUATION' | 'GLOBAL' };
  confidence: number;
}

export interface MemoryProposal {
  item_type: MemoryItemType;
  content: string;
  source: 'USER_WORDS' | 'AI_HYPOTHESIS' | 'EXPERIMENT_LEARNING';
  reason: string;
}

export interface UiAction {
  type: string;
  options?: string[];
  [k: string]: unknown;
}

export interface SafetyResponse {
  flow: SafetyFlow;
  level: SafetyLevel;
  message: string;
  resources?: SafetyResource[];
}

export interface StructuredOutput {
  schema_version: string;
  selected_action: Action;
  assistant_message: string;
  question_count: 0 | 1;
  evidence_used: string[];
  insight_candidate: InsightCandidate | null;
  event: string;
  proposed_next_state: ConversationState;
  possible_outcome: OutcomeType | null;
  memory_proposals: MemoryProposal[];
  safety_response: SafetyResponse | null;
  ui_actions: UiAction[];
  internal_reason_codes: string[];
}

// ---------- Safety resources (cấu hình, không bịa) ----------
export interface SafetyResource {
  label: string;
  value: string;
  kind: 'HOTLINE' | 'EMERGENCY' | 'TEXT' | 'INFO';
}

// ---------- Turn request/response (Phần 5) ----------
export interface TurnRequest {
  message?: string | null;
  ui_action?: { type: string; value?: unknown } | null;
  expected_state_version?: number;
  client_context?: { locale?: string; timezone?: string };
}

export interface TurnResponse {
  request_id: string;
  assistant_message: string;
  state: ConversationState;
  state_version: number;
  ui_actions: UiAction[];
  possible_outcome: OutcomeType | null;
  memory_proposal: { proposals: MemoryProposalView[] } | null;
  safety: { flow: SafetyFlow; level: SafetyLevel; resources?: SafetyResource[] };
  server_time: string;
  closed: boolean;
}

export interface MemoryProposalView {
  id: string;
  item_type: MemoryItemType;
  content: string;
  reason: string;
}

// ---------- User State snapshot (User State doc) ----------
export interface UserStateSnapshot {
  safety: { state: string; source: string };
  engagement: { state: string; energy_signal: EnergySignal };
  clarity: { state: string; subject_id?: string; verification_status?: VerificationStatus };
  agency: { state: string; support_intent?: SupportIntent; advice_permission: AdvicePermission };
  relationship: { state: RelationshipState };
  journey: { state: JourneyState };
  memory_and_meaning: { meaning_status: string; memory_mode: MemoryMode };
  user_requested_stop: boolean;
  updated_at: string;
}

// ---------- Session feedback helper ----------
export type { SessionFeedback };
