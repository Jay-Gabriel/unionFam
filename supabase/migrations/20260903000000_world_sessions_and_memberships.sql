-- Persistent world state, play-session history, daily return loop and the
-- provider-agnostic membership ledger for Thành Phố Mây.

CREATE TABLE IF NOT EXISTS public.world_player_states (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  position_x DOUBLE PRECISION NOT NULL DEFAULT 0,
  position_z DOUBLE PRECISION NOT NULL DEFAULT 55,
  rotation_y DOUBLE PRECISION NOT NULL DEFAULT 3.141592653589793,
  camera_yaw DOUBLE PRECISION NOT NULL DEFAULT 0,
  camera_pitch DOUBLE PRECISION NOT NULL DEFAULT 0.38,
  camera_distance DOUBLE PRECISION NOT NULL DEFAULT 8.5,
  collected_shard_ids TEXT[] NOT NULL DEFAULT '{}',
  unlocked_zone_ids TEXT[] NOT NULL DEFAULT '{}',
  onboarding_seen BOOLEAN NOT NULL DEFAULT false,
  last_zone_id TEXT,
  last_session_id UUID,
  last_saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT world_position_x_valid CHECK (position_x BETWEEN -100 AND 100),
  CONSTRAINT world_position_z_valid CHECK (position_z BETWEEN -100 AND 100),
  CONSTRAINT world_camera_pitch_valid CHECK (camera_pitch BETWEEN 0.08 AND 1.1),
  CONSTRAINT world_camera_distance_valid CHECK (camera_distance BETWEEN 4 AND 16)
);

CREATE TABLE IF NOT EXISTS public.world_play_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_session_key UUID NOT NULL,
  device_class TEXT NOT NULL DEFAULT 'desktop' CHECK (device_class IN ('desktop', 'mobile', 'tablet', 'unknown')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT NOT NULL DEFAULT 0 CHECK (duration_seconds BETWEEN 0 AND 86400),
  state_at_end JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_world_client_session UNIQUE (user_id, client_session_key)
);

ALTER TABLE public.world_player_states
  DROP CONSTRAINT IF EXISTS world_player_states_last_session_id_fkey;
ALTER TABLE public.world_player_states
  ADD CONSTRAINT world_player_states_last_session_id_fkey
  FOREIGN KEY (last_session_id) REFERENCES public.world_play_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_world_sessions_user_started
  ON public.world_play_sessions (user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS public.world_daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  reward_code TEXT NOT NULL DEFAULT 'dawn_seed_25',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_world_daily_checkin UNIQUE (user_id, checkin_date)
);

CREATE TABLE IF NOT EXISTS public.memberships (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL DEFAULT 'free' CHECK (plan_code IN ('free', 'dawn_monthly', 'dawn_annual')),
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'trialing', 'active', 'past_due', 'canceled')),
  provider TEXT,
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.world_player_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_play_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY world_player_states_select_owner ON public.world_player_states
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY world_player_states_insert_owner ON public.world_player_states
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY world_player_states_update_owner ON public.world_player_states
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY world_play_sessions_select_owner ON public.world_play_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY world_play_sessions_insert_owner ON public.world_play_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY world_play_sessions_update_owner ON public.world_play_sessions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY world_daily_checkins_select_owner ON public.world_daily_checkins
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY world_daily_checkins_insert_owner ON public.world_daily_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Members can inspect their current entitlement. Billing webhooks or an admin
-- service account remain the only writers, preventing client-side upgrades.
CREATE POLICY memberships_select_owner ON public.memberships
  FOR SELECT USING (auth.uid() = user_id);
