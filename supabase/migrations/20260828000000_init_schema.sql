-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  locale TEXT NOT NULL DEFAULT 'vi',
  timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  onboarding_status TEXT NOT NULL DEFAULT 'not_started', -- not_started, in_progress, completed
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
  status TEXT NOT NULL DEFAULT 'draft', -- draft, published, retired
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
  answer_type TEXT NOT NULL, -- text, single_choice, multi_choice, scale, date
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
  status TEXT NOT NULL DEFAULT 'active', -- active, paused, completed, archived
  current_stage TEXT NOT NULL DEFAULT 'initial_exploration',
  prompt_version TEXT NOT NULL DEFAULT 'v1.0',
  question_flow_version_id UUID REFERENCES public.question_flow_versions(id),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 6. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- user, assistant, system_tool
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'complete', -- pending, streaming, complete, failed
  sequence_no INT NOT NULL,
  idempotency_key TEXT,
  provider_message_id TEXT,
  prompt_version TEXT,
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_conversation_seq UNIQUE (conversation_id, sequence_no)
);

-- 7. USER STATEMENTS
CREATE TABLE IF NOT EXISTS public.user_statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  statement_type TEXT NOT NULL DEFAULT 'verbatim',
  dimension TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 8. AI OBSERVATIONS
CREATE TABLE IF NOT EXISTS public.ai_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  assistant_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  observation_type TEXT NOT NULL DEFAULT 'insight_candidate',
  dimension TEXT NOT NULL,
  content_original TEXT NOT NULL,
  content_user_edited TEXT,
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.85,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  decision_at TIMESTAMPTZ,
  decision_idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. CONFIRMED INSIGHTS
CREATE TABLE IF NOT EXISTS public.confirmed_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_observation_id UUID UNIQUE REFERENCES public.ai_observations(id) ON DELETE SET NULL,
  insight_type TEXT NOT NULL DEFAULT 'core_observation',
  dimension TEXT NOT NULL,
  content TEXT NOT NULL,
  evidence_message_ids UUID[] DEFAULT '{}',
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  superseded_by_id UUID REFERENCES public.confirmed_insights(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 10. LIFE PROFILE VERSIONS
CREATE TABLE IF NOT EXISTS public.life_profile_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_no INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed', -- draft, confirmed
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
  source_insight_id UUID REFERENCES public.confirmed_insights(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
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
  source_insight_id UUID REFERENCES public.confirmed_insights(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 13. EXPERIMENTS
CREATE TABLE IF NOT EXISTS public.experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gap_id UUID REFERENCES public.gaps(id),
  title TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  smallest_step TEXT NOT NULL,
  success_signal TEXT NOT NULL,
  observation_focus JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  progress_percent INT NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 14. REFLECTIONS
CREATE TABLE IF NOT EXISTS public.reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  result TEXT NOT NULL,
  learning_candidate TEXT NOT NULL,
  feeling TEXT NOT NULL,
  next_action TEXT NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_reflection_experiment UNIQUE (experiment_id)
);

-- 15. LEARNING RECORDS
CREATE TABLE IF NOT EXISTS public.learning_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_reflection_id UUID REFERENCES public.reflections(id),
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- SUPPORT TABLES
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
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
CREATE POLICY user_answers_owner ON public.user_answers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY conversations_owner ON public.conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY messages_owner ON public.messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_statements_owner ON public.user_statements FOR ALL USING (auth.uid() = user_id);

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
  p_user_id UUID,
  p_observation_id UUID,
  p_decision TEXT, -- accepted, rejected
  p_edited_content TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_obs public.ai_observations%ROWTYPE;
  v_insight_id UUID;
  v_final_content TEXT;
BEGIN
  -- Security identity check: prevent cross-user impersonation
  IF p_user_id IS NULL OR (auth.uid() IS NOT NULL AND auth.uid() IS DISTINCT FROM p_user_id) THEN
    RAISE EXCEPTION 'UNAUTHORIZED_USER_DECISION';
  END IF;

  -- Lock observation row
  SELECT * INTO v_obs
  FROM public.ai_observations
  WHERE id = p_observation_id AND user_id = p_user_id
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
      p_user_id,
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
