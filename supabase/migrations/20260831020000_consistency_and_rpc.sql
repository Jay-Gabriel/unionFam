-- Forward-only consistency fixes for the MVP domain contract.

-- The initial migration pre-dated the state machine in the application layer.
-- Normalize legacy rows before tightening the constraint so replays are safe.
UPDATE public.experiments
SET status = 'abandoned', updated_at = NOW()
WHERE status = 'archived';

ALTER TABLE public.experiments
  DROP CONSTRAINT IF EXISTS experiments_status_check;
ALTER TABLE public.experiments
  ADD CONSTRAINT experiments_status_check
  CHECK (status IN ('draft', 'active', 'completed', 'abandoned'));

ALTER TABLE public.gaps
  DROP CONSTRAINT IF EXISTS gaps_status_check;
ALTER TABLE public.gaps
  ADD CONSTRAINT gaps_status_check
  CHECK (status IN ('open', 'in_progress', 'closed', 'dismissed'));

ALTER TABLE public.resources
  DROP CONSTRAINT IF EXISTS resources_resource_type_check;
ALTER TABLE public.resources
  ADD CONSTRAINT resources_resource_type_check
  CHECK (resource_type IN ('person', 'skill', 'time', 'money', 'community', 'tool', 'other'));

-- Owner-first indexes keep member queries bounded as the dataset grows.
CREATE INDEX IF NOT EXISTS idx_user_answers_owner ON public.user_answers (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_owner ON public.conversations (user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_owner_conversation ON public.messages (user_id, conversation_id, sequence_no);
CREATE INDEX IF NOT EXISTS idx_user_statements_owner ON public.user_statements (user_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_observations_owner ON public.ai_observations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_confirmed_insights_owner ON public.confirmed_insights (user_id, confirmed_at DESC);
CREATE INDEX IF NOT EXISTS idx_life_profile_versions_owner ON public.life_profile_versions (user_id, version_no DESC);
CREATE INDEX IF NOT EXISTS idx_resources_owner ON public.resources (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gaps_owner ON public.gaps (user_id, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_experiments_owner ON public.experiments (user_id, status, target_date);
CREATE INDEX IF NOT EXISTS idx_reflections_owner ON public.reflections (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_records_owner ON public.learning_records (user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_owner_date ON public.activity_events (user_id, event_date DESC);

-- AI observations are member-readable but are created only through this
-- owner-checked function. This preserves the user-agency RLS boundary while
-- allowing the authenticated chat route to persist a pending proposal.
CREATE OR REPLACE FUNCTION public.create_pending_observation(
  p_conversation_id UUID,
  p_assistant_message_id UUID,
  p_observation_type TEXT,
  p_dimension TEXT,
  p_content_original TEXT,
  p_confidence NUMERIC DEFAULT 0.85
)
RETURNS JSONB
AS $$
DECLARE
  v_user_id UUID;
  v_observation public.ai_observations%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF p_observation_type IS NULL OR p_observation_type NOT IN ('insight_candidate') THEN
    RAISE EXCEPTION 'INVALID_OBSERVATION_TYPE';
  END IF;
  IF p_dimension IS NULL OR p_dimension NOT IN (
    'my_life', 'what_matters', 'my_ideal_day', 'what_it_takes',
    'my_trade_offs', 'the_question', 'financial_life', 'other'
  ) THEN
    RAISE EXCEPTION 'INVALID_OBSERVATION_DIMENSION';
  END IF;
  IF p_content_original IS NULL OR LENGTH(BTRIM(p_content_original)) = 0
     OR LENGTH(BTRIM(p_content_original)) > 1200 THEN
    RAISE EXCEPTION 'INVALID_OBSERVATION_CONTENT';
  END IF;
  IF p_confidence IS NULL OR p_confidence < 0 OR p_confidence > 1 THEN
    RAISE EXCEPTION 'INVALID_OBSERVATION_CONFIDENCE';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = p_conversation_id AND user_id = v_user_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'CONVERSATION_NOT_FOUND';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.messages
    WHERE id = p_assistant_message_id
      AND user_id = v_user_id
      AND conversation_id = p_conversation_id
      AND role = 'assistant'
  ) THEN
    RAISE EXCEPTION 'ASSISTANT_MESSAGE_NOT_FOUND';
  END IF;

  INSERT INTO public.ai_observations (
    user_id, conversation_id, assistant_message_id, observation_type,
    dimension, content_original, confidence, status
  ) VALUES (
    v_user_id, p_conversation_id, p_assistant_message_id, p_observation_type,
    p_dimension, BTRIM(p_content_original), p_confidence, 'pending'
  )
  RETURNING * INTO v_observation;

  RETURN jsonb_build_object(
    'id', v_observation.id,
    'dimension', v_observation.dimension,
    'content_original', v_observation.content_original,
    'status', v_observation.status,
    'confidence', v_observation.confidence
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.create_pending_observation(UUID, UUID, TEXT, TEXT, TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_pending_observation(UUID, UUID, TEXT, TEXT, TEXT, NUMERIC) TO authenticated;

-- Drafts are also written through a narrow owner-checked function. Confirmed
-- snapshots remain immutable and are only created by confirm_life_profile.
CREATE OR REPLACE FUNCTION public.save_life_profile_draft(
  p_snapshot JSONB,
  p_source_answer_ids UUID[] DEFAULT '{}',
  p_source_insight_ids UUID[] DEFAULT '{}'
)
RETURNS JSONB
AS $$
DECLARE
  v_user_id UUID;
  v_draft public.life_profile_versions%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF jsonb_typeof(p_snapshot) <> 'object' THEN RAISE EXCEPTION 'INVALID_PROFILE_SNAPSHOT'; END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(COALESCE(p_source_answer_ids, '{}'::UUID[])) AS source_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_answers a
      WHERE a.id = source_id AND a.user_id = v_user_id AND a.deleted_at IS NULL
    )
  ) THEN RAISE EXCEPTION 'INVALID_PROFILE_SOURCE_ANSWER'; END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(COALESCE(p_source_insight_ids, '{}'::UUID[])) AS source_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.confirmed_insights i
      WHERE i.id = source_id AND i.user_id = v_user_id AND i.deleted_at IS NULL
    )
  ) THEN RAISE EXCEPTION 'INVALID_PROFILE_SOURCE_INSIGHT'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::TEXT, 0));
  SELECT * INTO v_draft
  FROM public.life_profile_versions
  WHERE user_id = v_user_id AND status = 'draft'
  ORDER BY updated_at DESC
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    UPDATE public.life_profile_versions
    SET snapshot = p_snapshot,
        source_answer_ids = COALESCE(p_source_answer_ids, '{}'),
        source_insight_ids = COALESCE(p_source_insight_ids, '{}'),
        created_by = 'user',
        is_current = false,
        updated_at = NOW()
    WHERE id = v_draft.id AND user_id = v_user_id
    RETURNING * INTO v_draft;
  ELSE
    INSERT INTO public.life_profile_versions (
      user_id, version_no, status, snapshot, source_answer_ids,
      source_insight_ids, created_by, is_current
    ) VALUES (
      v_user_id, 0, 'draft', p_snapshot,
      COALESCE(p_source_answer_ids, '{}'), COALESCE(p_source_insight_ids, '{}'),
      'user', false
    )
    RETURNING * INTO v_draft;
  END IF;

  RETURN jsonb_build_object(
    'id', v_draft.id,
    'version_no', v_draft.version_no,
    'status', v_draft.status,
    'snapshot', v_draft.snapshot,
    'updated_at', v_draft.updated_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.save_life_profile_draft(JSONB, UUID[], UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_life_profile_draft(JSONB, UUID[], UUID[]) TO authenticated;

-- Keep experiment and learning transitions retry-safe at the database boundary.
CREATE OR REPLACE FUNCTION public.transition_experiment(
  p_experiment_id UUID,
  p_status TEXT,
  p_progress_percent INT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
AS $$
DECLARE
  v_user_id UUID;
  v_experiment public.experiments%ROWTYPE;
  v_progress INT;
  v_response JSONB;
  v_cached JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF p_status NOT IN ('draft', 'active', 'completed', 'abandoned') THEN
    RAISE EXCEPTION 'INVALID_EXPERIMENT_STATUS';
  END IF;
  IF p_idempotency_key IS NOT NULL THEN
    SELECT response_payload INTO v_cached
    FROM public.idempotency_records
    WHERE user_id = v_user_id AND operation = 'transition_experiment' AND key = p_idempotency_key;
    IF FOUND THEN RETURN v_cached; END IF;
  END IF;

  SELECT * INTO v_experiment
  FROM public.experiments
  WHERE id = p_experiment_id AND user_id = v_user_id AND deleted_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'EXPERIMENT_NOT_FOUND'; END IF;
  IF NOT (
    v_experiment.status = p_status OR
    (v_experiment.status = 'draft' AND p_status = 'active') OR
    (v_experiment.status = 'active' AND p_status IN ('completed', 'abandoned'))
  ) THEN RAISE EXCEPTION 'INVALID_EXPERIMENT_TRANSITION'; END IF;

  v_progress := COALESCE(p_progress_percent, v_experiment.progress_percent);
  IF p_status = 'completed' THEN v_progress := 100; END IF;
  IF v_progress < 0 OR v_progress > 100 THEN RAISE EXCEPTION 'INVALID_EXPERIMENT_PROGRESS'; END IF;

  UPDATE public.experiments
  SET status = p_status, progress_percent = v_progress, updated_at = NOW()
  WHERE id = p_experiment_id AND user_id = v_user_id;

  v_response := jsonb_build_object(
    'experiment_id', p_experiment_id,
    'status', p_status,
    'progress_percent', v_progress
  );
  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO public.idempotency_records (user_id, operation, key, response_payload)
    VALUES (v_user_id, 'transition_experiment', p_idempotency_key, v_response)
    ON CONFLICT (user_id, operation, key) DO NOTHING;
  END IF;
  RETURN v_response;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.transition_experiment(UUID, TEXT, INT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transition_experiment(UUID, TEXT, INT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.decide_learning_atomic(
  p_learning_id UUID,
  p_decision TEXT,
  p_edited_content TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
AS $$
DECLARE
  v_user_id UUID;
  v_learning public.learning_records%ROWTYPE;
  v_content TEXT;
  v_response JSONB;
  v_cached JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF p_decision NOT IN ('confirmed', 'rejected') THEN RAISE EXCEPTION 'INVALID_LEARNING_DECISION'; END IF;
  IF p_edited_content IS NOT NULL AND LENGTH(BTRIM(p_edited_content)) > 1200 THEN
    RAISE EXCEPTION 'EDITED_CONTENT_TOO_LONG';
  END IF;
  IF p_idempotency_key IS NOT NULL THEN
    SELECT response_payload INTO v_cached
    FROM public.idempotency_records
    WHERE user_id = v_user_id AND operation = 'decide_learning' AND key = p_idempotency_key;
    IF FOUND THEN RETURN v_cached; END IF;
  END IF;

  SELECT * INTO v_learning
  FROM public.learning_records
  WHERE id = p_learning_id AND user_id = v_user_id AND deleted_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'LEARNING_NOT_FOUND'; END IF;
  IF v_learning.status <> 'pending' THEN
    RAISE EXCEPTION 'LEARNING_ALREADY_PROCESSED';
  END IF;
  v_content := COALESCE(NULLIF(BTRIM(p_edited_content), ''), v_learning.content);

  UPDATE public.learning_records
  SET status = p_decision,
      content = v_content,
      confirmed_at = CASE WHEN p_decision = 'confirmed' THEN NOW() ELSE NULL END,
      updated_at = NOW()
  WHERE id = p_learning_id AND user_id = v_user_id;

  v_response := jsonb_build_object(
    'learning_id', p_learning_id,
    'status', p_decision,
    'content', v_content
  );
  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO public.idempotency_records (user_id, operation, key, response_payload)
    VALUES (v_user_id, 'decide_learning', p_idempotency_key, v_response)
    ON CONFLICT (user_id, operation, key) DO NOTHING;
  END IF;
  RETURN v_response;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.decide_learning_atomic(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decide_learning_atomic(UUID, TEXT, TEXT, TEXT) TO authenticated;
