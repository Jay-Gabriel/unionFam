-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  locale TEXT NOT NULL DEFAULT 'vi',
  timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  onboarding_status TEXT NOT NULL DEFAULT 'not_started' CHECK (onboarding_status IN ('not_started', 'in_progress', 'completed')),
  consented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. QUESTION FLOW VERSIONS
CREATE TABLE IF NOT EXISTS public.question_flow_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  version_no INT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'retired')),
  schema_version INT NOT NULL DEFAULT 1,
  checksum TEXT NOT NULL DEFAULT '',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_question_flow_version UNIQUE (code, version_no)
);

-- 3. QUESTIONS
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flow_version_id UUID NOT NULL REFERENCES public.question_flow_versions(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  title TEXT NOT NULL,
  helper_text TEXT,
  answer_type TEXT NOT NULL CHECK (answer_type IN ('text', 'single_choice', 'multi_choice', 'scale', 'date')),
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  branch_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  ordinal INT NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_questions_key UNIQUE (flow_version_id, question_key)
);

-- 4. USER ANSWERS
CREATE TABLE IF NOT EXISTS public.user_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flow_version_id UUID NOT NULL REFERENCES public.question_flow_versions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer JSONB NOT NULL,
  idempotency_key TEXT,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_user_answer UNIQUE (user_id, flow_version_id, question_id)
);

-- 5. CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Cuộc trò chuyện mới',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  current_stage TEXT NOT NULL DEFAULT 'initial_exploration',
  prompt_version TEXT NOT NULL DEFAULT 'v1.0',
  question_flow_version_id UUID REFERENCES public.question_flow_versions(id),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_conversation_owner UNIQUE (id, user_id)
);

-- 6. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system_tool')),
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'complete' CHECK (status IN ('pending', 'streaming', 'complete', 'failed')),
  sequence_no INT NOT NULL,
  idempotency_key TEXT,
  provider_message_id TEXT,
  prompt_version TEXT,
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id, user_id) REFERENCES public.conversations(id, user_id) ON DELETE CASCADE,
  CONSTRAINT uq_conversation_seq UNIQUE (conversation_id, sequence_no),
  CONSTRAINT uq_message_owner UNIQUE (id, user_id)
);

-- 7. USER STATEMENTS
CREATE TABLE IF NOT EXISTS public.user_statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  message_id UUID NOT NULL,
  content TEXT NOT NULL,
  statement_type TEXT NOT NULL DEFAULT 'verbatim',
  dimension TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_user_statements_conversation FOREIGN KEY (conversation_id, user_id) REFERENCES public.conversations(id, user_id) ON DELETE CASCADE,
  CONSTRAINT fk_user_statements_message FOREIGN KEY (message_id, user_id) REFERENCES public.messages(id, user_id) ON DELETE CASCADE
);

-- 8. AI OBSERVATIONS
CREATE TABLE IF NOT EXISTS public.ai_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  assistant_message_id UUID,
  observation_type TEXT NOT NULL DEFAULT 'insight_candidate',
  dimension TEXT NOT NULL,
  content_original TEXT NOT NULL,
  content_user_edited TEXT,
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.85,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  decision_at TIMESTAMPTZ,
  decision_idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_ai_observations_conversation FOREIGN KEY (conversation_id, user_id) REFERENCES public.conversations(id, user_id) ON DELETE CASCADE,
  CONSTRAINT fk_ai_observations_message FOREIGN KEY (assistant_message_id, user_id) REFERENCES public.messages(id, user_id) ON DELETE SET NULL,
  CONSTRAINT uq_ai_obs_idempotency UNIQUE (user_id, decision_idempotency_key),
  CONSTRAINT uq_ai_obs_owner UNIQUE (id, user_id)
);

-- 9. CONFIRMED INSIGHTS
CREATE TABLE IF NOT EXISTS public.confirmed_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_observation_id UUID UNIQUE,
  insight_type TEXT NOT NULL DEFAULT 'core_observation' CHECK (insight_type = 'core_observation'),
  dimension TEXT NOT NULL,
  content TEXT NOT NULL,
  evidence_message_ids UUID[] DEFAULT '{}',
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  superseded_by_id UUID REFERENCES public.confirmed_insights(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_confirmed_insights_observation FOREIGN KEY (source_observation_id, user_id) REFERENCES public.ai_observations(id, user_id) ON DELETE SET NULL,
  CONSTRAINT uq_confirmed_insights_owner UNIQUE (id, user_id)
);

-- 10. LIFE PROFILE VERSIONS
CREATE TABLE IF NOT EXISTS public.life_profile_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_no INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('draft', 'confirmed')),
  snapshot JSONB NOT NULL,
  source_answer_ids UUID[] DEFAULT '{}',
  source_insight_ids UUID[] DEFAULT '{}',
  created_by TEXT NOT NULL DEFAULT 'user', -- user, system_draft
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_profile_ver UNIQUE (user_id, version_no)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_current_life_profile ON public.life_profile_versions (user_id) WHERE is_current = true;

-- 11. RESOURCES
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  confidence NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  source_insight_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_resources_insight FOREIGN KEY (source_insight_id, user_id) REFERENCES public.confirmed_insights(id, user_id)
);

-- 12. GAPS
CREATE TABLE IF NOT EXISTS public.gaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL,
  title TEXT NOT NULL,
  current_state TEXT NOT NULL,
  desired_state TEXT NOT NULL,
  priority INT NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  status TEXT NOT NULL DEFAULT 'open',
  source_insight_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_gaps_insight FOREIGN KEY (source_insight_id, user_id) REFERENCES public.confirmed_insights(id, user_id),
  CONSTRAINT uq_gaps_owner UNIQUE (id, user_id)
);

-- 13. EXPERIMENTS
CREATE TABLE IF NOT EXISTS public.experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gap_id UUID,
  title TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  smallest_step TEXT NOT NULL,
  success_signal TEXT NOT NULL,
  observation_focus JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  progress_percent INT NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_experiments_gap FOREIGN KEY (gap_id, user_id) REFERENCES public.gaps(id, user_id),
  CONSTRAINT uq_experiments_owner UNIQUE (id, user_id)
);

-- 14. REFLECTIONS
CREATE TABLE IF NOT EXISTS public.reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL,
  result TEXT NOT NULL,
  learning_candidate TEXT NOT NULL,
  feeling TEXT NOT NULL,
  next_action TEXT NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_reflections_experiment FOREIGN KEY (experiment_id, user_id) REFERENCES public.experiments(id, user_id) ON DELETE CASCADE,
  CONSTRAINT uq_reflection_experiment UNIQUE (experiment_id),
  CONSTRAINT uq_reflections_owner UNIQUE (id, user_id)
);

-- 15. LEARNING RECORDS
CREATE TABLE IF NOT EXISTS public.learning_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_reflection_id UUID,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_learning_records_reflection FOREIGN KEY (source_reflection_id, user_id) REFERENCES public.reflections(id, user_id)
);

-- SUPPORT TABLES
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_role UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.prompt_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  encrypted_content TEXT NOT NULL,
  checksum TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_prompt_config UNIQUE (code, version)
);

CREATE TABLE IF NOT EXISTS public.idempotency_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  key TEXT NOT NULL,
  response_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_idempotency UNIQUE (user_id, operation, key)
);

CREATE TABLE IF NOT EXISTS public.ai_run_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id TEXT NOT NULL,
  user_hash TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  latency_ms INT NOT NULL,
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  status TEXT NOT NULL,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.application_errors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id TEXT NOT NULL,
  error_code TEXT NOT NULL,
  sanitized_detail JSONB NOT NULL,
  route TEXT NOT NULL,
  user_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID,
  resource_type TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS POLICIES ENABLEMENT (FOR ALL BUSINESS AND TECHNICAL TABLES)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confirmed_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_profile_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_run_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- STRICT USER OWNERSHIP POLICIES
CREATE POLICY profiles_owner ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY user_answers_owner ON public.user_answers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY conversations_owner ON public.conversations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY messages_owner ON public.messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_statements_owner ON public.user_statements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- USER AGENCY INVARIANT POLICIES (Observations read-only for member; mutations via server/RPC)
CREATE POLICY ai_observations_select_owner ON public.ai_observations FOR SELECT USING (auth.uid() = user_id);

-- Confirmed Insights read-only for member; creation restricted to atomic decision RPC
CREATE POLICY confirmed_insights_select_owner ON public.confirmed_insights FOR SELECT USING (auth.uid() = user_id);

-- Life Profile Version read-only for member SELECT
CREATE POLICY life_profile_versions_select_owner ON public.life_profile_versions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY resources_owner ON public.resources FOR ALL USING (auth.uid() = user_id);
CREATE POLICY gaps_owner ON public.gaps FOR ALL USING (auth.uid() = user_id);
CREATE POLICY experiments_owner ON public.experiments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY reflections_owner ON public.reflections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY learning_records_owner ON public.learning_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_roles_read_own ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY idempotency_owner ON public.idempotency_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY activity_events_owner ON public.activity_events FOR ALL USING (auth.uid() = user_id);

-- Question Flows & Questions
ALTER TABLE public.question_flow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY question_flow_read ON public.question_flow_versions FOR SELECT USING (status = 'published');
CREATE POLICY questions_read ON public.questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.question_flow_versions v WHERE v.id = flow_version_id AND v.status = 'published')
);

-- SECURE ADMIN CHECK PROCEDURE
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- SECURE ATOMIC DECISION PROCEDURE WITH IDENTITY VALIDATION
CREATE OR REPLACE FUNCTION public.decide_observation_atomic(
  p_observation_id UUID,
  p_decision TEXT, -- accepted, rejected
  p_edited_content TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_obs public.ai_observations%ROWTYPE;
  v_insight_id UUID;
  v_final_content TEXT;
BEGIN
  -- Security identity check: extract directly from session
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED_USER_DECISION';
  END IF;

  -- Validate Decision
  IF p_decision NOT IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'INVALID_DECISION';
  END IF;

  IF p_edited_content IS NOT NULL AND LENGTH(p_edited_content) > 1000 THEN
    RAISE EXCEPTION 'EDITED_CONTENT_TOO_LONG';
  END IF;

  -- Check existing idempotency key
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_obs
    FROM public.ai_observations
    WHERE user_id = v_user_id AND decision_idempotency_key = p_idempotency_key;

    IF FOUND THEN
      -- Also fetch insight ID if it was accepted
      IF v_obs.status = 'accepted' THEN
        SELECT id INTO v_insight_id FROM public.confirmed_insights WHERE source_observation_id = v_obs.id;
      END IF;

      RETURN jsonb_build_object(
        'observation_id', v_obs.id,
        'status', v_obs.status,
        'insight_id', v_insight_id
      );
    END IF;
  END IF;

  -- Lock observation row
  SELECT * INTO v_obs
  FROM public.ai_observations
  WHERE id = p_observation_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'OBSERVATION_NOT_FOUND';
  END IF;

  IF v_obs.status != 'pending' THEN
    RAISE EXCEPTION 'OBSERVATION_ALREADY_PROCESSED';
  END IF;

  v_final_content := COALESCE(p_edited_content, v_obs.content_original);

  -- Update observation status
  UPDATE public.ai_observations
  SET status = p_decision,
      content_user_edited = p_edited_content,
      decision_at = NOW(),
      decision_idempotency_key = p_idempotency_key,
      updated_at = NOW()
  WHERE id = p_observation_id;

  -- Create confirmed insight if accepted
  IF p_decision = 'accepted' THEN
    INSERT INTO public.confirmed_insights (
      user_id,
      source_observation_id,
      insight_type,
      dimension,
      content
    ) VALUES (
      v_user_id,
      p_observation_id,
      'core_observation',
      v_obs.dimension,
      v_final_content
    )
    RETURNING id INTO v_insight_id;
  END IF;

  RETURN jsonb_build_object(
    'observation_id', p_observation_id,
    'status', p_decision,
    'insight_id', v_insight_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke default public execution & grant strictly to authenticated users
REVOKE EXECUTE ON FUNCTION public.decide_observation_atomic FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decide_observation_atomic TO authenticated;
