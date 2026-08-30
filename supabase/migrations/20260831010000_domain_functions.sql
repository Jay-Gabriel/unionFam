-- Transactional domain functions used by the authenticated API routes.

CREATE OR REPLACE FUNCTION public.confirm_life_profile(
  p_snapshot JSONB,
  p_source_answer_ids UUID[] DEFAULT '{}',
  p_source_insight_ids UUID[] DEFAULT '{}',
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
AS $$
DECLARE
  v_user_id UUID;
  v_version_no INT;
  v_profile_id UUID;
  v_cached JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF jsonb_typeof(p_snapshot) <> 'object' THEN RAISE EXCEPTION 'INVALID_PROFILE_SNAPSHOT'; END IF;
  IF p_idempotency_key IS NOT NULL THEN
    SELECT response_payload INTO v_cached
    FROM public.idempotency_records
    WHERE user_id = v_user_id
      AND operation = 'confirm_life_profile'
      AND key = p_idempotency_key;
    IF FOUND THEN RETURN v_cached; END IF;
  END IF;

  -- Serialize version assignment for this user even when two browser tabs save
  -- at the same time.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::TEXT, 0));
  SELECT COALESCE(MAX(version_no), 0) + 1 INTO v_version_no
  FROM public.life_profile_versions
  WHERE user_id = v_user_id;

  UPDATE public.life_profile_versions
  SET is_current = false, updated_at = NOW()
  WHERE user_id = v_user_id AND is_current = true;

  INSERT INTO public.life_profile_versions (
    user_id, version_no, status, snapshot, source_answer_ids,
    source_insight_ids, created_by, is_current
  ) VALUES (
    v_user_id, v_version_no, 'confirmed', p_snapshot,
    COALESCE(p_source_answer_ids, '{}'), COALESCE(p_source_insight_ids, '{}'),
    'user', true
  )
  RETURNING id INTO v_profile_id;

  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO public.idempotency_records (user_id, operation, key, response_payload)
    VALUES (
      v_user_id,
      'confirm_life_profile',
      p_idempotency_key,
      jsonb_build_object('profile_id', v_profile_id, 'version_no', v_version_no)
    )
    ON CONFLICT (user_id, operation, key) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('profile_id', v_profile_id, 'version_no', v_version_no);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.confirm_life_profile(JSONB, UUID[], UUID[], TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_life_profile(JSONB, UUID[], UUID[], TEXT) TO authenticated;

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
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF p_status NOT IN ('draft', 'active', 'completed', 'abandoned') THEN
    RAISE EXCEPTION 'INVALID_EXPERIMENT_STATUS';
  END IF;

  SELECT * INTO v_experiment
  FROM public.experiments
  WHERE id = p_experiment_id AND user_id = v_user_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'EXPERIMENT_NOT_FOUND'; END IF;

  IF NOT (
    v_experiment.status = p_status OR
    (v_experiment.status = 'draft' AND p_status = 'active') OR
    (v_experiment.status = 'active' AND p_status IN ('completed', 'abandoned'))
  ) THEN
    RAISE EXCEPTION 'INVALID_EXPERIMENT_TRANSITION';
  END IF;

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
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF p_decision NOT IN ('confirmed', 'rejected') THEN RAISE EXCEPTION 'INVALID_LEARNING_DECISION'; END IF;
  SELECT * INTO v_learning
  FROM public.learning_records
  WHERE id = p_learning_id AND user_id = v_user_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'LEARNING_NOT_FOUND'; END IF;
  IF v_learning.status <> 'pending' THEN
    IF p_idempotency_key IS NOT NULL AND v_learning.status = p_decision THEN
      RETURN jsonb_build_object('learning_id', v_learning.id, 'status', v_learning.status, 'content', v_learning.content);
    END IF;
    RAISE EXCEPTION 'LEARNING_ALREADY_PROCESSED';
  END IF;
  v_content := COALESCE(NULLIF(BTRIM(p_edited_content), ''), v_learning.content);

  UPDATE public.learning_records
  SET status = p_decision,
      content = v_content,
      confirmed_at = CASE WHEN p_decision = 'confirmed' THEN NOW() ELSE NULL END,
      updated_at = NOW()
  WHERE id = p_learning_id AND user_id = v_user_id;

  RETURN jsonb_build_object('learning_id', p_learning_id, 'status', p_decision, 'content', v_content);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.decide_learning_atomic(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decide_learning_atomic(UUID, TEXT, TEXT, TEXT) TO authenticated;
