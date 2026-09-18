import { describe, expect, it } from 'vitest';
import { chooseNewestSnapshot, DEFAULT_WORLD_TRANSFORM, worldSnapshotSchema } from '@/components/world/world-session';
import type { WorldSessionSnapshot } from '@/components/world/world-session';

function snapshot(savedAt: string): WorldSessionSnapshot {
  return {
    transform: DEFAULT_WORLD_TRANSFORM,
    collectedShardIds: ['memory-1'],
    unlockedZoneIds: ['academy'],
    onboardingSeen: true,
    lastZoneId: 'academy',
    lastSavedAt: savedAt,
  };
}

describe('persistent world session', () => {
  it('prefers the freshest valid snapshot', () => {
    const local = snapshot('2026-09-18T11:00:00.000Z');
    const cloud = snapshot('2026-09-18T10:00:00.000Z');
    expect(chooseNewestSnapshot(cloud, local)).toBe(local);
  });

  it('rejects impossible positions and forged shard ids', () => {
    expect(worldSnapshotSchema.safeParse({ ...snapshot('2026-09-18T10:00:00.000Z'), transform: { ...DEFAULT_WORLD_TRANSFORM, x: 999 } }).success).toBe(false);
    expect(worldSnapshotSchema.safeParse({ ...snapshot('2026-09-18T10:00:00.000Z'), collectedShardIds: ['memory-99'] }).success).toBe(false);
  });
});
