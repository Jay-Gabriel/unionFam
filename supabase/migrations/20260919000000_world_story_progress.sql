-- Persist story-only milestones that cannot be derived from the Life Lab
-- domain tables, such as carrying an arcade discovery into a conversation.
ALTER TABLE public.world_player_states
  ADD COLUMN IF NOT EXISTS completed_story_ids TEXT[] NOT NULL DEFAULT '{}';
