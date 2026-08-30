-- Preserve evidence links when a user accepts an AI observation and make
-- idempotency-key reuse explicit instead of exposing a raw unique violation.
CREATE OR REPLACE FUNCTION public.decide_observation_atomic(
  p_observation_id UUID,
  p_decision TEXT,
  p_edited_content TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
AS $$
DECLARE
  v_user_id UUID;
  v_obs public.ai_observations%ROWTYPE;
  v_existing public.ai_observations%ROWTYPE;
  v_insight_id UUID;
  v_final_content TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHORIZED_USER_DECISION'; END IF;
  IF p_decision NOT IN ('accepted', 'rejected') THEN RAISE EXCEPTION 'INVALID_DECISION'; END IF;
  IF p_edited_content IS NOT NULL AND LENGTH(BTRIM(p_edited_content)) > 1200 THEN
    RAISE EXCEPTION 'EDITED_CONTENT_TOO_LONG';
  END IF;

  SELECT * INTO v_obs
  FROM public.ai_observations
  WHERE id = p_observation_id AND user_id = v_user_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'OBSERVATION_NOT_FOUND'; END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing
    FROM public.ai_observations
    WHERE user_id = v_user_id AND decision_idempotency_key = p_idempotency_key
    FOR UPDATE;
    IF FOUND AND v_existing.id <> v_obs.id THEN
      RAISE EXCEPTION 'IDEMPOTENCY_KEY_REUSED';
    END IF;
  END IF;

  IF v_obs.status <> 'pending' THEN
    IF p_idempotency_key IS NOT NULL
       AND v_obs.decision_idempotency_key = p_idempotency_key
       AND v_obs.status = p_decision THEN
      IF v_obs.status = 'accepted' THEN
        SELECT id INTO v_insight_id
        FROM public.confirmed_insights
        WHERE source_observation_id = v_obs.id;
      END IF;
      RETURN jsonb_build_object(
        'observation_id', v_obs.id,
        'status', v_obs.status,
        'insight_id', v_insight_id,
        'confirmed_content', CASE WHEN v_obs.status = 'accepted' THEN COALESCE(v_obs.content_user_edited, v_obs.content_original) ELSE NULL END
      );
    END IF;
    RAISE EXCEPTION 'OBSERVATION_ALREADY_PROCESSED';
  END IF;

  v_final_content := COALESCE(NULLIF(BTRIM(p_edited_content), ''), v_obs.content_original);
  UPDATE public.ai_observations
  SET status = p_decision,
      content_user_edited = NULLIF(BTRIM(p_edited_content), ''),
      decision_at = NOW(),
      decision_idempotency_key = p_idempotency_key,
      updated_at = NOW()
  WHERE id = p_observation_id AND user_id = v_user_id;

  IF p_decision = 'accepted' THEN
    INSERT INTO public.confirmed_insights (
      user_id, source_observation_id, insight_type, dimension, content, evidence_message_ids
    ) VALUES (
      v_user_id, p_observation_id, 'core_observation', v_obs.dimension, v_final_content,
      CASE WHEN v_obs.assistant_message_id IS NULL THEN '{}'::UUID[] ELSE ARRAY[v_obs.assistant_message_id] END
    )
    RETURNING id INTO v_insight_id;
  END IF;

  RETURN jsonb_build_object(
    'observation_id', p_observation_id,
    'status', p_decision,
    'insight_id', v_insight_id,
    'confirmed_content', CASE WHEN p_decision = 'accepted' THEN v_final_content ELSE NULL END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.decide_observation_atomic(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decide_observation_atomic(UUID, TEXT, TEXT, TEXT) TO authenticated;
