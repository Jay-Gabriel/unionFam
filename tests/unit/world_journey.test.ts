import { describe, expect, it } from 'vitest';
import { buildWorldJourney } from '@/components/world/world-journey';

describe('world journey', () => {
  it('maps real Life Lab progress into deterministic world quests', () => {
    const journey = buildWorldJourney({
      questionnaireProgress: 100,
      conversations: 2,
      profileDimensionCount: 3,
      activeExperimentProgress: 75,
      collectedLetters: 4,
      streak: 6,
    });

    expect(journey.quests).toHaveLength(5);
    expect(journey.completedQuests).toBe(2);
    expect(journey.streak).toBe(6);
    expect(journey.quests.find((quest) => quest.id === 'awakening-path')?.completed).toBe(true);
    expect(journey.quests.find((quest) => quest.id === 'greenhouse-growth')?.progressPercent).toBe(75);
    expect(journey.energy).toBe(78);
    expect(journey.level).toBe(4);
  });

  it('clamps malformed or excessive progress safely', () => {
    const journey = buildWorldJourney({
      questionnaireProgress: 180,
      conversations: -3,
      profileDimensionCount: 99,
      activeExperimentProgress: Number.NaN,
      collectedLetters: 12,
    });

    expect(journey.quests.map((quest) => quest.progressPercent)).toEqual([100, 0, 100, 0, 100]);
  });
});
