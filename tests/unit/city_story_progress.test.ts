import { describe, expect, it } from 'vitest';
import { buildCityStoryProgress } from '@/components/world/city-story-progress';
import type { WorldJourney, WorldQuest } from '@/components/world/world-types';

function makeQuest(zoneId: WorldQuest['zoneId'], progressPercent: number): WorldQuest {
  return {
    id: zoneId,
    zoneId,
    title: zoneId,
    description: '',
    actionLabel: '',
    targetHref: '',
    reward: '',
    progress: progressPercent,
    total: 100,
    progressPercent,
    completed: progressPercent >= 100,
    accentColor: '#fff',
  };
}

function journey(progress: number[]): WorldJourney {
  const zones: WorldQuest['zoneId'][] = ['academy', 'sanctuary', 'observatory', 'greenhouse', 'lake'];
  return {
    level: 1,
    energy: 0,
    completedQuests: 0,
    totalQuests: 5,
    streak: 0,
    loading: false,
    quests: zones.map((zone, index) => makeQuest(zone, progress[index] || 0)),
  };
}

describe('city story progress', () => {
  it('starts at the academy and keeps later chapters locked', () => {
    const story = buildCityStoryProgress(journey([0, 0, 0, 0, 0]));
    expect(story.activeZoneId).toBe('academy');
    expect(story.unlockedZoneIds).toEqual(['home', 'square', 'academy']);
    expect(story.lockedReason('sanctuary')).toContain('Những ô cửa chưa sáng');
  });

  it('unlocks the next chapter and arcade after listening is complete', () => {
    const story = buildCityStoryProgress(journey([100, 100, 0, 0, 0]));
    expect(story.activeZoneId).toBe('observatory');
    expect(story.unlockedZoneIds).toContain('arcade');
    expect(story.unlockedZoneIds).not.toContain('vault');
  });

  it('preserves a later chapter that already has progress', () => {
    const story = buildCityStoryProgress(journey([20, 0, 40, 0, 0]));
    expect(story.unlockedZoneIds).toContain('observatory');
  });
});
