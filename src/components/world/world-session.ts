import { z } from 'zod';

export const WORLD_SESSION_STORAGE_KEY = 'lifelab_world_session_v2';

export const worldTransformSchema = z.object({
  x: z.number().finite().min(-100).max(100),
  z: z.number().finite().min(-100).max(100),
  rotationY: z.number().finite().min(-Math.PI * 4).max(Math.PI * 4),
  cameraYaw: z.number().finite().min(-Math.PI * 100).max(Math.PI * 100),
  cameraPitch: z.number().finite().min(0.08).max(1.1),
  cameraDistance: z.number().finite().min(4).max(16),
});

export type WorldTransform = z.infer<typeof worldTransformSchema>;

export const worldSnapshotSchema = z.object({
  transform: worldTransformSchema,
  collectedShardIds: z.array(z.string().regex(/^memory-[1-4]$/)).max(4),
  unlockedZoneIds: z.array(z.enum(['home', 'square', 'academy', 'sanctuary', 'observatory', 'greenhouse', 'lake', 'arcade', 'vault'])).max(9),
  onboardingSeen: z.boolean(),
  lastZoneId: z.enum(['home', 'square', 'academy', 'sanctuary', 'observatory', 'greenhouse', 'lake', 'arcade', 'vault']).nullable(),
  lastSavedAt: z.string().datetime(),
});

export type WorldSessionSnapshot = z.infer<typeof worldSnapshotSchema>;

export interface WorldMembership {
  planCode: 'free' | 'dawn_monthly' | 'dawn_annual';
  status: 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface WorldSessionSummary {
  sessionId: string | null;
  sessionCount: number;
  totalPlaySeconds: number;
  lastSeenAt: string | null;
  cloudAvailable: boolean;
  saveStatus: 'loading' | 'saved' | 'saving' | 'local-only' | 'error';
  checkedInToday: boolean;
  checkInStreak: number;
  membership: WorldMembership;
}

export const DEFAULT_WORLD_TRANSFORM: WorldTransform = {
  x: 0,
  z: 55,
  rotationY: Math.PI,
  cameraYaw: 0,
  cameraPitch: 0.38,
  cameraDistance: 8.5,
};

export function readLocalWorldSnapshot(): WorldSessionSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(WORLD_SESSION_STORAGE_KEY) || 'null');
    const result = worldSnapshotSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function writeLocalWorldSnapshot(snapshot: WorldSessionSnapshot) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(WORLD_SESSION_STORAGE_KEY, JSON.stringify(snapshot)); } catch { /* storage is best-effort */ }
}

export function chooseNewestSnapshot(cloud: WorldSessionSnapshot | null, local: WorldSessionSnapshot | null) {
  if (!cloud) return local;
  if (!local) return cloud;
  return Date.parse(local.lastSavedAt) > Date.parse(cloud.lastSavedAt) ? local : cloud;
}
