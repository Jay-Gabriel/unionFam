import { CITY_STORY } from './city-story';
import type { CityZoneId, WorldJourney } from './world-types';

export const CORE_STORY_ORDER: CityZoneId[] = [
  'academy',
  'sanctuary',
  'observatory',
  'greenhouse',
  'lake',
  'arcade',
  'vault',
];

export interface CityStoryProgress {
  activeZoneId: CityZoneId;
  unlockedZoneIds: CityZoneId[];
  completedZoneIds: CityZoneId[];
  chapterNumber: number;
  lockedReason: (zoneId: CityZoneId) => string | null;
}

export function buildCityStoryProgress(journey: WorldJourney): CityStoryProgress {
  const questByZone = new Map(journey.quests.map((quest) => [quest.zoneId, quest]));
  const completedZoneIds = CORE_STORY_ORDER.filter((zoneId) => questByZone.get(zoneId)?.completed);
  const firstIncompleteIndex = CORE_STORY_ORDER.findIndex((zoneId) => !questByZone.get(zoneId)?.completed);
  const activeIndex = firstIncompleteIndex === -1 ? CORE_STORY_ORDER.length - 1 : firstIncompleteIndex;
  const activeZoneId = firstIncompleteIndex === -1 ? 'home' : CORE_STORY_ORDER[activeIndex];

  const unlockedZoneIds: CityZoneId[] = ['home', 'square'];
  CORE_STORY_ORDER.forEach((zoneId, index) => {
    if (index <= activeIndex || questByZone.get(zoneId)?.progress) unlockedZoneIds.push(zoneId);
  });

  const uniqueUnlocked = [...new Set(unlockedZoneIds)];
  const lockedReason = (zoneId: CityZoneId) => {
    if (uniqueUnlocked.includes(zoneId)) return null;
    const index = CORE_STORY_ORDER.indexOf(zoneId);
    const previous = index > 0 ? CORE_STORY_ORDER[index - 1] : 'academy';
    return `Hoàn thành “${CITY_STORY[previous].title}” để mở chương này.`;
  };

  return {
    activeZoneId,
    unlockedZoneIds: uniqueUnlocked,
    completedZoneIds,
    chapterNumber: Math.max(1, activeIndex + 1),
    lockedReason,
  };
}
