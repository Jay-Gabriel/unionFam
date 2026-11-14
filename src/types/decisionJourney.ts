export type DecisionStatus = 'DRAFT' | 'USER_REVIEW' | 'CONFIRMED' | 'PAUSED' | 'CLOSED';
export type ExperimentStatus = 'DRAFT' | 'ACTIVE' | 'REVIEW_DUE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
export type CheckinStatus = 'TRIED' | 'NOT_TRIED' | 'ADJUSTED';
export type PrivacyScope = 'card_only' | 'card_and_transcript' | 'session_only';

export interface DecisionOption {
  id: string;
  name: string;
  description?: string;
}

export interface DecisionUncertainty {
  id: string;
  question: string;
  stop_rule?: string;
}

export interface DecisionCardRecord {
  id: string;
  title: string;
  status: DecisionStatus;
  current_revision: number;
  decision_question: string;
  criteria: string[];
  hard_constraints: string[];
  options: DecisionOption[];
  uncertainties: DecisionUncertainty[];
  confirmed_fields: Record<string, boolean>;
}

export interface DecisionProposalRecord {
  id: string;
  decision_id: string;
  base_revision: number;
  proposed_fields: Partial<DecisionCardRecord>;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface ExperimentRecord {
  id: string;
  decision_id: string;
  user_id: string;
  status: ExperimentStatus;
  active_version: number;
  timezone: string;
}

export interface ExperimentVersionRecord {
  id: string;
  experiment_id: string;
  version: number;
  action: string;
  learning_question: string;
  observations: string;
  stop_rule: string;
  duration_days: 1 | 3 | 7;
  review_at: string;
}

export interface CheckinRecord {
  id: string;
  experiment_id: string;
  experiment_version: number;
  user_id: string;
  local_date: string;
  status: CheckinStatus;
  note?: string;
  energy?: number | null;
}

export interface ReviewRecord {
  id: string;
  experiment_id: string;
  experiment_version: number;
  facts: string;
  learning: string;
  next_action: 'continue_cycle' | 'new_experiment' | 'pause' | 'close';
}
