import { CITY_STORY } from './city-story';
import type { CityZoneId, WorldJourney } from './world-types';

export const CORE_STORY_ORDER: CityZoneId[] = [
  'academy',
  'sanctuary',
  'observatory',
  'greenhouse',
  'lake',
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
  const activeZoneId = firstIncompleteIndex === -1 ? 'arcade' : CORE_STORY_ORDER[activeIndex];

  const unlockedZoneIds: CityZoneId[] = ['home', 'square'];
  CORE_STORY_ORDER.forEach((zoneId, index) => {
    if (index <= activeIndex || questByZone.get(zoneId)?.progress) unlockedZoneIds.push(zoneId);
  });

  // Two optional districts become available once the player has enough context
  // for their activities. Existing progress is never hidden from returning users.
  if (questByZone.get('sanctuary')?.completed || firstIncompleteIndex === -1) unlockedZoneIds.push('arcade');
  if (questByZone.get('greenhouse')?.completed || firstIncompleteIndex === -1) unlockedZoneIds.push('vault');

  const uniqueUnlocked = [...new Set(unlockedZoneIds)];
  const lockedReason = (zoneId: CityZoneId) => {
    if (uniqueUnlocked.includes(zoneId)) return null;
    if (zoneId === 'arcade') return 'Hoàn thành chương Vườn Lắng Nghe để mở Ga Trò Chơi.';
    if (zoneId === 'vault') return 'Hoàn thành chương Nhà Kính Dũng Khí để mở Ngân Hàng Nguồn Lực.';
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
