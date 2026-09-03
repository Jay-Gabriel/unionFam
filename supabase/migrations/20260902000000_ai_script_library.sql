-- Editorial AI script library.
-- Content admins can prepare and publish bounded, versioned guidance for the
-- conversation model. Member JWTs never receive these rows directly; the
-- server reads published rows with the service-role client.

ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('member', 'admin', 'content_admin'));

CREATE TABLE IF NOT EXISTS public.ai_script_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_type IN ('manual', 'txt', 'md', 'docx')),
  source_filename TEXT,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  version_no INTEGER NOT NULL DEFAULT 1 CHECK (version_no > 0),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_script_documents_key_check
    CHECK (script_key ~ '^[a-z0-9][a-z0-9_-]{1,80}$'),
  CONSTRAINT ai_script_documents_title_check
    CHECK (char_length(btrim(title)) BETWEEN 2 AND 160),
  CONSTRAINT ai_script_documents_content_check
    CHECK (char_length(btrim(content)) BETWEEN 1 AND 60000),
  CONSTRAINT uq_ai_script_document_version UNIQUE (script_key, version_no)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_script_documents_published_key
  ON public.ai_script_documents (script_key)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_ai_script_documents_status_updated
  ON public.ai_script_documents (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_script_documents_key_version
  ON public.ai_script_documents (script_key, version_no DESC);

ALTER TABLE public.ai_script_documents ENABLE ROW LEVEL SECURITY;

-- There are intentionally no member policies. All access goes through
-- audited server routes using the service-role client.
DROP POLICY IF EXISTS ai_script_documents_deny_client ON public.ai_script_documents;
CREATE POLICY ai_script_documents_deny_client
  ON public.ai_script_documents FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.is_content_admin(p_user_id UUID)
RETURNS BOOLEAN
AS $$
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'content_admin')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.is_content_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_content_admin(UUID) TO authenticated;

-- Publishing is kept atomic: at most one version for a key is live, even if
-- two editor requests arrive close together. The service route calls this
-- function only after its own content-admin check and audit preparation.
CREATE OR REPLACE FUNCTION public.publish_ai_script(p_script_id UUID)
RETURNS JSONB
AS $$
DECLARE
  v_target public.ai_script_documents%ROWTYPE;
  v_published public.ai_script_documents%ROWTYPE;
BEGIN
  SELECT * INTO v_target
  FROM public.ai_script_documents
  WHERE id = p_script_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'AI_SCRIPT_NOT_FOUND';
  END IF;

  UPDATE public.ai_script_documents
  SET status = 'archived',
      updated_at = NOW()
  WHERE script_key = v_target.script_key
    AND status = 'published'
    AND id <> p_script_id;

  UPDATE public.ai_script_documents
  SET status = 'published',
      published_at = COALESCE(published_at, NOW()),
      updated_at = NOW()
  WHERE id = p_script_id
  RETURNING * INTO v_published;

  RETURN to_jsonb(v_published);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.publish_ai_script(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_ai_script(UUID) TO service_role;
