import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/demo-mode';
import { requireUser } from '@/server/auth/current-user';
import { worldSnapshotSchema, type WorldMembership, type WorldSessionSnapshot } from '@/components/world/world-session';

export const dynamic = 'force-dynamic';

const startSchema = z.object({
  action: z.literal('start').default('start'),
  deviceClass: z.enum(['desktop', 'mobile', 'tablet', 'unknown']).default('unknown'),
  clientSessionKey: z.string().uuid(),
});

const checkInSchema = z.object({
  action: z.literal('check-in'),
});

const saveSchema = z.object({
  sessionId: z.string().uuid().nullable(),
  elapsedSeconds: z.number().int().min(0).max(86400),
  ended: z.boolean().default(false),
  snapshot: worldSnapshotSchema,
});

type StateRow = {
  position_x: number; position_z: number; rotation_y: number;
  camera_yaw: number; camera_pitch: number; camera_distance: number;
  collected_shard_ids: string[] | null; completed_story_ids: string[] | null; unlocked_zone_ids: string[] | null;
  onboarding_seen: boolean; last_zone_id: string | null; last_saved_at: string;
};

function toSnapshot(row: StateRow | null): WorldSessionSnapshot | null {
  if (!row) return null;
  const parsed = worldSnapshotSchema.safeParse({
    transform: {
      x: row.position_x, z: row.position_z, rotationY: row.rotation_y,
      cameraYaw: row.camera_yaw, cameraPitch: row.camera_pitch, cameraDistance: row.camera_distance,
    },
    collectedShardIds: row.collected_shard_ids || [],
    completedStoryIds: row.completed_story_ids || [],
    unlockedZoneIds: row.unlocked_zone_ids || [],
    onboardingSeen: row.onboarding_seen,
    lastZoneId: row.last_zone_id,
    lastSavedAt: row.last_saved_at,
  });
  return parsed.success ? parsed.data : null;
}

const FREE_MEMBERSHIP: WorldMembership = {
  planCode: 'free', status: 'inactive', currentPeriodEnd: null, cancelAtPeriodEnd: false,
};

async function checkInStats(supabase: ReturnType<typeof createClient>, userId: string, localDate: string) {
  const { data, error } = await supabase
    .from('world_daily_checkins')
    .select('checkin_date')
    .eq('user_id', userId)
    .order('checkin_date', { ascending: false })
    .limit(90);
  if (error) throw error;
  const days = new Set((data || []).map((row: { checkin_date: string }) => row.checkin_date));
  const cursor = new Date(`${localDate}T12:00:00Z`);
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return { checkedInToday: days.has(localDate), checkInStreak: streak };
}

function localDateNow() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const checkIn = checkInSchema.safeParse(body);
    const start = startSchema.safeParse(body);
    if (!checkIn.success && !start.success) return NextResponse.json({ error: 'INVALID_WORLD_SESSION_REQUEST' }, { status: 400 });

    if (isDemoMode()) {
      return NextResponse.json({
        data: checkIn.success
          ? { checkedInToday: true, checkInStreak: 1 }
          : { sessionId: null, snapshot: null, sessionCount: 1, totalPlaySeconds: 0, lastSeenAt: null, membership: FREE_MEMBERSHIP, checkedInToday: false, checkInStreak: 0, cloudAvailable: false },
      });
    }

    const user = await requireUser();
    const supabase = createClient();

    if (checkIn.success) {
      const checkinDate = localDateNow();
      const { data: inserted, error } = await supabase.from('world_daily_checkins').insert({
        user_id: user.id,
        checkin_date: checkinDate,
        reward_code: 'dawn_seed_25',
      }).select('id').maybeSingle();
      if (error && error.code !== '23505') throw error;
      if (inserted) await supabase.from('activity_events').insert({ user_id: user.id, event_type: 'world_daily_checkin', event_date: checkinDate, metadata: { reward: 'dawn_seed_25' } });
      return NextResponse.json({ data: await checkInStats(supabase, user.id, checkinDate) });
    }
    if (!start.success) return NextResponse.json({ error: 'INVALID_WORLD_SESSION_REQUEST' }, { status: 400 });

    const [{ data: session, error: sessionError }, { data: state, error: stateError }, { data: sessions, error: statsError }, { data: membership, error: membershipError }] = await Promise.all([
      supabase.from('world_play_sessions').upsert({ user_id: user.id, device_class: start.data.deviceClass, client_session_key: start.data.clientSessionKey }, { onConflict: 'user_id,client_session_key' }).select('id').single(),
      supabase.from('world_player_states').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('world_play_sessions').select('duration_seconds, started_at').eq('user_id', user.id).order('started_at', { ascending: false }).limit(500),
      supabase.from('memberships').select('plan_code, status, current_period_end, cancel_at_period_end').eq('user_id', user.id).maybeSingle(),
    ]);
    if (sessionError || stateError || statsError || membershipError) throw sessionError || stateError || statsError || membershipError;
    const stats = sessions || [];
    const localDate = localDateNow();
    const daily = await checkInStats(supabase, user.id, localDate);
    return NextResponse.json({ data: {
      sessionId: session.id,
      snapshot: toSnapshot(state as StateRow | null),
      sessionCount: stats.length,
      totalPlaySeconds: stats.reduce((sum: number, row: { duration_seconds?: number }) => sum + (row.duration_seconds || 0), 0),
      lastSeenAt: stats.find((row: { started_at: string }) => row.started_at)?.started_at || null,
      membership: membership ? {
        planCode: membership.plan_code,
        status: membership.status,
        currentPeriodEnd: membership.current_period_end,
        cancelAtPeriodEnd: membership.cancel_at_period_end,
      } : FREE_MEMBERSHIP,
      ...daily,
      cloudAvailable: true,
    } });
  } catch (error) {
    if (error instanceof Error && error.message === 'AUTH_REQUIRED') return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    console.error('WORLD_SESSION_START_FAILED', error instanceof Error ? error.message : 'UnknownError');
    return NextResponse.json({ error: 'WORLD_SESSION_UNAVAILABLE' }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const parsed = saveSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: 'INVALID_WORLD_SNAPSHOT' }, { status: 400 });
    if (isDemoMode()) return NextResponse.json({ data: { savedAt: parsed.data.snapshot.lastSavedAt, cloudAvailable: false } });

    const user = await requireUser();
    const supabase = createClient();
    const { snapshot, sessionId, elapsedSeconds, ended } = parsed.data;
    if (sessionId) {
      const { data: ownedSession, error: ownershipError } = await supabase.from('world_play_sessions').select('id').eq('id', sessionId).eq('user_id', user.id).maybeSingle();
      if (ownershipError) throw ownershipError;
      if (!ownedSession) return NextResponse.json({ error: 'WORLD_SESSION_NOT_FOUND' }, { status: 404 });
    }
    const { error: stateError } = await supabase.from('world_player_states').upsert({
      user_id: user.id,
      position_x: snapshot.transform.x,
      position_z: snapshot.transform.z,
      rotation_y: snapshot.transform.rotationY,
      camera_yaw: snapshot.transform.cameraYaw,
      camera_pitch: snapshot.transform.cameraPitch,
      camera_distance: snapshot.transform.cameraDistance,
      collected_shard_ids: snapshot.collectedShardIds,
      completed_story_ids: snapshot.completedStoryIds,
      unlocked_zone_ids: snapshot.unlockedZoneIds,
      onboarding_seen: snapshot.onboardingSeen,
      last_zone_id: snapshot.lastZoneId,
      last_session_id: sessionId,
      last_saved_at: snapshot.lastSavedAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (stateError) throw stateError;
    if (sessionId) {
      const patch: Record<string, unknown> = {
        last_heartbeat_at: new Date().toISOString(),
        duration_seconds: elapsedSeconds,
      };
      if (ended) {
        patch.ended_at = new Date().toISOString();
        patch.state_at_end = snapshot;
      }
      const { error } = await supabase.from('world_play_sessions').update(patch).eq('id', sessionId).eq('user_id', user.id);
      if (error) throw error;
    }
    return NextResponse.json({ data: { savedAt: snapshot.lastSavedAt, cloudAvailable: true } });
  } catch (error) {
    if (error instanceof Error && error.message === 'AUTH_REQUIRED') return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    console.error('WORLD_SESSION_SAVE_FAILED', error instanceof Error ? error.message : 'UnknownError');
    return NextResponse.json({ error: 'WORLD_SESSION_SAVE_FAILED' }, { status: 503 });
  }
}
