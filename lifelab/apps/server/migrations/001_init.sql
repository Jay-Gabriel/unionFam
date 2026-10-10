-- Life Lab V8.7.2 — Migration 001: canonical schema (14 bảng + enums)
-- Nguồn: Master Phần 5 "Database tables". Verification_status và life_map_status TÁCH riêng (DB11).
-- Idempotent: dùng IF NOT EXISTS / DO blocks để chạy lại an toàn.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- ENUM types ----------
DO $$ BEGIN
  CREATE TYPE conversation_state AS ENUM (
    'ENTRY','CONSENT','WHAT_MATTERS_NOW','CURRENT_LIFE_DISCOVERY','MINI_REFLECTION','VERIFY','REPAIR',
    'CURRENT_FOCUS_DISCOVERY','CURRENT_FOCUS_CONFIRMATION','OUTCOME_SELECTION','CONTINUE_EXPLORATION',
    'PERMISSION_BEFORE_ADVICE','EXPLORE_OPTIONS','VERIFY_DIRECTION_FIT','CONFIRMED_INSIGHT','BETTER_QUESTION',
    'MEANINGFUL_NEXT_STEP','LIFE_EXPERIMENT','REFLECTIVE_PAUSE','SESSION_OUTCOME_CHECKPOINT','MEMORY_PERMISSION',
    'SESSION_FEEDBACK','CONFUSION_REPAIR','CLOSE','CRISIS_SAFETY','HIGH_STAKES_BOUNDARY','RELATIONAL_BOUNDARY',
    'SUPPORT_PLANNING','CHECK_IN','EXPERIMENT_REFLECTION','LIFE_MAP_UPDATE_PROPOSAL','RETURN_SESSION'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE memory_mode AS ENUM ('NO_MEMORY','ASK_LATER','PROPOSALS_ALLOWED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE permission_status AS ENUM ('PENDING','ALLOWED','DENIED','REVOKED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE life_map_status AS ENUM ('EXPLORING','HYPOTHESIS','CONFIRMED','CHANGING','CORRECTED','ARCHIVED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE verification_status AS ENUM ('PROPOSED','UNVERIFIED','PARTIAL','CONFIRMED','REJECTED','SUPERSEDED','EXPIRED','NO_LONGER_CURRENT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE focus_confirmation_status AS ENUM ('DRAFT','PENDING_CONFIRMATION','CONFIRMED','REVISED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE experiment_status AS ENUM ('DRAFT','CONFIRMED','ACTIVE','PARTIAL','ADJUSTED','STOPPED','COMPLETED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE safety_level AS ENUM ('S0','S1','S2','S3'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE outcome_type AS ENUM ('CONFIRMED_INSIGHT','BETTER_QUESTION','MEANINGFUL_NEXT_STEP','LIFE_EXPERIMENT','REFLECTIVE_PAUSE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE session_feedback AS ENUM ('CLEARER','PARTLY_CLEARER','UNCHANGED','MORE_CONFUSED','SKIPPED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE memory_item_type AS ENUM ('LIFE_MAP','RELATIONSHIP_MEMORY','EXPERIMENT','SESSION_OUTCOME'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- 1. users ----------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_subject TEXT UNIQUE,
  locale TEXT NOT NULL DEFAULT 'vi-VN',
  timezone TEXT NOT NULL DEFAULT 'Asia/Bangkok',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  entitlement TEXT NOT NULL DEFAULT 'FREE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ---------- 2. sessions ----------
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  anon_token TEXT,
  current_state conversation_state NOT NULL DEFAULT 'ENTRY',
  previous_state conversation_state,
  state_version INTEGER NOT NULL DEFAULT 0,
  safety_level safety_level NOT NULL DEFAULT 'S0',
  memory_mode memory_mode NOT NULL DEFAULT 'ASK_LATER',
  user_requested_stop BOOLEAN NOT NULL DEFAULT false,
  question_count_since_reflection INTEGER NOT NULL DEFAULT 0,
  focus_confirmation_status focus_confirmation_status,
  active_focus_id UUID,
  active_experiment_id UUID,
  possible_outcome outcome_type,
  confirmed_outcome outcome_type,
  advice_permission_scope TEXT,
  session_feedback session_feedback,
  user_state_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_state ON sessions(current_state);

-- ---------- 3. messages ----------
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,                 -- user | assistant | system
  content TEXT NOT NULL,              -- (ciphertext ở prod; plaintext dev)
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, created_at);

-- ---------- 4. evidence ----------
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  source_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL,          -- USER_STATEMENT | CONFIRMED_MEMORY | OBSERVED_ACTION
  text TEXT NOT NULL,
  topics TEXT[] NOT NULL DEFAULT '{}',
  scope_json JSONB NOT NULL DEFAULT '{}',
  permission TEXT NOT NULL DEFAULT 'SESSION_ONLY',  -- SESSION_ONLY | MEMORY_ALLOWED
  sensitivity TEXT NOT NULL DEFAULT 'NORMAL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_evidence_session ON evidence(session_id);
CREATE INDEX IF NOT EXISTS idx_evidence_topics ON evidence USING GIN(topics);

-- ---------- 5. insights ----------
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  life_map_status life_map_status,
  scope_json JSONB NOT NULL DEFAULT '{}',
  confidence REAL,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_confirmed_at TIMESTAMPTZ,
  supersedes_id UUID REFERENCES insights(id) ON DELETE SET NULL,
  permission permission_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_insights_verif ON insights(verification_status);
CREATE INDEX IF NOT EXISTS idx_insights_lmstatus ON insights(life_map_status);

-- ---------- 6. insight_evidence ----------
CREATE TABLE IF NOT EXISTS insight_evidence (
  insight_id UUID NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  PRIMARY KEY (insight_id, evidence_id)
);

-- ---------- 7. repairs ----------
CREATE TABLE IF NOT EXISTS repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  rejected_insight_id UUID REFERENCES insights(id) ON DELETE SET NULL,
  rejected_text TEXT,
  replacement_text TEXT,
  repair_rule TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'SESSION_ONLY',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_repairs_active ON repairs(rejected_insight_id, active);
CREATE INDEX IF NOT EXISTS idx_repairs_session ON repairs(session_id, active);

-- ---------- 8. focuses ----------
CREATE TABLE IF NOT EXISTS focuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  status focus_confirmation_status NOT NULL DEFAULT 'DRAFT',
  confirmed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_focuses_user ON focuses(user_id, status);

-- ---------- 9. life_map_items ----------
CREATE TABLE IF NOT EXISTS life_map_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  content TEXT NOT NULL,
  status life_map_status NOT NULL DEFAULT 'EXPLORING',
  evidence_ids UUID[] NOT NULL DEFAULT '{}',
  scope_json JSONB NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  permission permission_status NOT NULL DEFAULT 'PENDING',
  previous_version_id UUID REFERENCES life_map_items(id) ON DELETE SET NULL,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_lifemap_user ON life_map_items(user_id, domain, status);

-- ---------- 10. relationship_memory ----------
CREATE TABLE IF NOT EXISTS relationship_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  version INTEGER NOT NULL DEFAULT 1,
  permission permission_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_relmem_user ON relationship_memory(user_id, category, status);

-- ---------- 11. memory_proposals ----------
CREATE TABLE IF NOT EXISTS memory_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  item_type memory_item_type NOT NULL,
  content TEXT NOT NULL,
  source_ids UUID[] NOT NULL DEFAULT '{}',
  reason TEXT,
  decision permission_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_memprop_session ON memory_proposals(session_id, decision);

-- ---------- 12. experiments ----------
CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  focus_id UUID REFERENCES focuses(id) ON DELETE SET NULL,
  hypothesis TEXT NOT NULL,
  small_experience TEXT NOT NULL,
  time_window TEXT NOT NULL,
  signal_to_notice TEXT NOT NULL,
  return_preference TEXT NOT NULL,
  support_or_obstacle TEXT,
  stop_condition TEXT,
  status experiment_status NOT NULL DEFAULT 'DRAFT',
  version INTEGER NOT NULL DEFAULT 1,
  permission permission_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_experiments_user ON experiments(user_id, status);

-- ---------- 13. experiment_reviews ----------
CREATE TABLE IF NOT EXISTS experiment_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  what_happened TEXT,
  noticed TEXT,
  interpretation TEXT,
  learning_insight_id UUID REFERENCES insights(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expreview_exp ON experiment_reviews(experiment_id);

-- ---------- 14. session_outcomes ----------
CREATE TABLE IF NOT EXISTS session_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  possible_type outcome_type,
  confirmed_type outcome_type,
  content JSONB NOT NULL DEFAULT '{}',
  confirmation_status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_outcomes_session ON session_outcomes(session_id);

-- ---------- audit: turn_logs ----------
CREATE TABLE IF NOT EXISTS turn_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  prompt_version TEXT,
  model_version TEXT,
  state_before conversation_state,
  event TEXT,
  state_after conversation_state,
  validation TEXT,
  evidence_ids UUID[] NOT NULL DEFAULT '{}',
  latency_ms INTEGER,
  usage_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_turnlogs_session ON turn_logs(session_id, created_at);

-- ---------- audit: audit_events ----------
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  result TEXT NOT NULL,
  metadata_redacted JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_events(resource_type, resource_id);

COMMIT;
