-- Security hardening for functions that are callable through the PostgREST RPC surface.

-- Idempotency keys are scoped to a user and operation. NULL remains reusable for
-- calls that intentionally do not opt into retry semantics.
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_answers_idempotency
  ON public.user_answers (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_messages_idempotency
  ON public.messages (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_published_question_flow
  ON public.question_flow_versions (code)
  WHERE status = 'published';

-- The learning decision has the same explicit user-agency states as an AI
-- observation. Existing databases receive the constraint in a forward fix.
ALTER TABLE public.learning_records
  DROP CONSTRAINT IF EXISTS learning_records_status_check;
ALTER TABLE public.learning_records
  ADD CONSTRAINT learning_records_status_check
  CHECK (status IN ('pending', 'confirmed', 'rejected'));

-- Operational tables are never readable by member JWTs. Admin server queries use
-- a service-role client after their own role/audit checks.
DROP POLICY IF EXISTS admin_access_logs_member_read ON public.admin_access_logs;
DROP POLICY IF EXISTS admin_access_logs_deny_member ON public.admin_access_logs;
CREATE POLICY admin_access_logs_deny_member
  ON public.admin_access_logs FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
AS $$
BEGIN
  -- Never allow a member to probe another user's role.
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.is_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- Keep the atomic agency decision idempotent under retries/concurrent clicks.
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
  v_insight_id UUID;
  v_final_content TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED_USER_DECISION';
  END IF;

  IF p_decision NOT IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'INVALID_DECISION';
  END IF;

  IF p_edited_content IS NOT NULL AND LENGTH(BTRIM(p_edited_content)) > 1200 THEN
    RAISE EXCEPTION 'EDITED_CONTENT_TOO_LONG';
  END IF;

  -- Lock first, so a concurrent retry observes the committed decision.
  SELECT * INTO v_obs
  FROM public.ai_observations
  WHERE id = p_observation_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'OBSERVATION_NOT_FOUND';
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
        'confirmed_content', COALESCE(v_obs.content_user_edited, v_obs.content_original)
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
    'insight_id', v_insight_id,
    'confirmed_content', CASE WHEN p_decision = 'accepted' THEN v_final_content ELSE NULL END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.decide_observation_atomic(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decide_observation_atomic(UUID, TEXT, TEXT, TEXT) TO authenticated;
