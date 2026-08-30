-- Allocate message order in PostgreSQL so two tabs cannot both select the
-- same MAX(sequence_no) before inserting a turn.
ALTER TABLE public.messages
  ALTER COLUMN sequence_no SET DEFAULT 0;

CREATE OR REPLACE FUNCTION public.assign_message_sequence()
RETURNS trigger
AS $$
BEGIN
  IF NEW.sequence_no IS NULL OR NEW.sequence_no <= 0 THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.conversation_id::TEXT, 0));
    SELECT COALESCE(MAX(sequence_no), 0) + 1
    INTO NEW.sequence_no
    FROM public.messages
    WHERE conversation_id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS set_message_sequence ON public.messages;
CREATE TRIGGER set_message_sequence
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_message_sequence();

REVOKE EXECUTE ON FUNCTION public.assign_message_sequence() FROM PUBLIC;
