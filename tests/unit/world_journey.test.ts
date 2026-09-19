import { describe, expect, it } from 'vitest';
import { buildWorldJourney } from '@/components/world/world-journey';

describe('world journey', () => {
  it('maps real Life Lab progress into deterministic world quests', () => {
    const journey = buildWorldJourney({
      questionnaireProgress: 100,
      confirmedInsights: 1,
      confirmedProfiles: 1,
      lifeMapFocuses: 1,
      activeExperimentProgress: 75,
      reflections: 1,
      confirmedLearnings: 1,
      arcadeDiscoveries: 1,
      streak: 6,
    });

    expect(journey.quests).toHaveLength(7);
    expect(journey.completedQuests).toBe(5);
    expect(journey.streak).toBe(6);
    expect(journey.quests.find((quest) => quest.id === 'awakening-path')?.completed).toBe(true);
    expect(journey.quests.find((quest) => quest.id === 'greenhouse-growth')?.progressPercent).toBe(75);
    expect(journey.energy).toBe(82);
    expect(journey.level).toBe(4);
  });

  it('clamps malformed or excessive progress safely', () => {
    const journey = buildWorldJourney({
      questionnaireProgress: 180,
      confirmedInsights: -3,
      activeExperimentProgress: Number.NaN,
      collectedLetters: 12,
    });

    expect(journey.quests.map((quest) => quest.progressPercent)).toEqual([100, 0, 0, 0, 0, 0, 0]);
  });
});
