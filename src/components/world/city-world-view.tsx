'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { LeafLoader } from '@/components/calm/leaf-loader';
import { CityHud } from './city-hud';
import { CityFinale } from './city-finale';
import { CityActivityPanel } from './city-activity-panel';
import { CityOnboarding } from './city-onboarding';
import { buildCityStoryProgress } from './city-story-progress';
import { CITY_ZONES, MEMORY_SHARDS } from './world-data';
import { useWorldJourney } from './use-world-journey';
import type { CityZone, CityZoneId, PlayerHandle, VirtualInput } from './world-types';
import { useWorldSession } from './use-world-session';

const CityScene = dynamic(() => import('./city-scene').then((module) => module.CityScene), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-sky-100 to-sky-300 text-[#173246]">
      <LeafLoader variant="bloom" size="lg" label="Đang mở Thành Phố Mây…" />
    </div>
  ),
});

export function CityWorldView() {
  const scene = useRef<PlayerHandle>(null);
  const restoredApplied = useRef(false);
  const zoneId = useRef<string | null>(null);
  const collectedRef = useRef<string[]>([]);
  const [currentZone, setCurrentZone] = useState<CityZone | null>(null);
  const [collectedShardIds, setCollectedShardIds] = useState<string[]>([]);
  const [completedStoryIds, setCompletedStoryIds] = useState<string[]>([]);
  const [activityZone, setActivityZone] = useState<CityZone | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingSeen, setOnboardingSeen] = useState(false);
  const [unlockedOverrides, setUnlockedOverrides] = useState<CityZoneId[]>([]);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, z: 55 });
  const [journeyRefreshToken, setJourneyRefreshToken] = useState(0);
  const [finaleSeen, setFinaleSeen] = useState(true);
  const journey = useWorldJourney(collectedShardIds.length, journeyRefreshToken, completedStoryIds);
  const storyProgress = useMemo(() => buildCityStoryProgress(journey), [journey]);
  useEffect(() => {
    try { setFinaleSeen(localStorage.getItem('lifelab_city_finale_v1') === 'seen'); }
    catch { setFinaleSeen(false); }
  }, []);
  const guideZone = useMemo(
    () => CITY_ZONES.find((zone) => zone.id === storyProgress.activeZoneId) || CITY_ZONES[0],
    [storyProgress.activeZoneId]
  );
  const guideDistance = Math.hypot(playerPosition.x - guideZone.position[0], playerPosition.z - guideZone.position[2]);
  const getTransform = useCallback(() => scene.current?.getSessionTransform() || null, []);
  const { restoredSnapshot, summary: worldSession, checkIn } = useWorldSession({
    collectedShardIds,
    completedStoryIds,
    unlockedZoneIds: unlockedOverrides,
    onboardingSeen,
    lastZoneId: currentZone?.id || null,
  }, getTransform);

  useEffect(() => {
    if (worldSession.saveStatus === 'loading') return;
    if (restoredApplied.current) return;
    restoredApplied.current = true;
    if (restoredSnapshot) {
      const safeShards = restoredSnapshot.collectedShardIds.filter((id) => MEMORY_SHARDS.some((shard) => shard.id === id));
      collectedRef.current = safeShards;
      setCollectedShardIds(safeShards);
      setCompletedStoryIds(restoredSnapshot.completedStoryIds);
      setUnlockedOverrides(restoredSnapshot.unlockedZoneIds);
      setOnboardingSeen(restoredSnapshot.onboardingSeen);
      setOnboardingOpen(!restoredSnapshot.onboardingSeen);
      if (restoredSnapshot.onboardingSeen && !worldSession.checkedInToday) {
        const home = CITY_ZONES.find((zone) => zone.id === 'home');
        if (home) setActivityZone(home);
      }
      scene.current?.restoreSessionTransform(restoredSnapshot.transform);
      return;
    }
    try {
      const legacyShards = JSON.parse(localStorage.getItem('lifelab_city_memory_shards') || '[]');
      const safe = Array.isArray(legacyShards) ? legacyShards.filter((id): id is string => typeof id === 'string' && MEMORY_SHARDS.some((shard) => shard.id === id)) : [];
      collectedRef.current = safe;
      setCollectedShardIds(safe);
      const seen = localStorage.getItem('lifelab_city_story_tour_v1') === 'seen';
      setOnboardingSeen(seen);
      setOnboardingOpen(!seen);
    } catch {
      setOnboardingOpen(true);
    }
  }, [restoredSnapshot, worldSession.checkedInToday, worldSession.saveStatus]);

  const handlePositionChange = useCallback((position: THREE.Vector3) => {
    setPlayerPosition((current) => Math.hypot(current.x - position.x, current.z - position.z) > 0.45
      ? { x: position.x, z: position.z }
      : current);
    const nearest = CITY_ZONES
      .map((zone) => ({ zone, distance: Math.hypot(position.x - zone.position[0], position.z - zone.position[2]) }))
      .filter(({ zone, distance }) => distance <= zone.radius)
      .sort((a, b) => a.distance - b.distance)[0]?.zone || null;
    if ((nearest?.id || null) !== zoneId.current) {
      zoneId.current = nearest?.id || null;
      setCurrentZone(nearest);
    }

    const found = MEMORY_SHARDS.find((shard) =>
      !collectedRef.current.includes(shard.id) && Math.hypot(position.x - shard.position[0], position.z - shard.position[2]) < 1.5
    );
    if (found) {
      const next = [...collectedRef.current, found.id];
      collectedRef.current = next;
      setCollectedShardIds(next);
      try { localStorage.setItem('lifelab_city_memory_shards', JSON.stringify(next)); } catch { /* optional */ }
      scene.current?.triggerEmote('✨');
    }
  }, []);

  const handleVirtualInput = (input: VirtualInput) => scene.current?.setVirtualInput(input);
  const closeOnboarding = useCallback(() => {
    setOnboardingOpen(false);
    setOnboardingSeen(true);
    try { localStorage.setItem('lifelab_city_story_tour_v1', 'seen'); } catch { /* optional */ }
  }, []);
  const lockedReasonFor = useCallback((zone: CityZone) => unlockedOverrides.includes(zone.id) ? null : storyProgress.lockedReason(zone.id), [storyProgress, unlockedOverrides]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-sky-200">
      <CityScene
        ref={scene}
        energy={journey.energy}
        completedZoneIds={storyProgress.completedZoneIds}
        questZoneIds={journey.quests.filter((quest) => !quest.completed).map((quest) => quest.zoneId)}
        activeGuideZoneId={guideZone.id}
        collectedShardIds={collectedShardIds}
        onPositionChange={handlePositionChange}
        restoredTransform={restoredSnapshot?.transform}
        paused={Boolean(activityZone) || onboardingOpen}
      />
      <CityHud
        journey={journey}
        session={worldSession}
        currentZone={currentZone}
        collectedShards={collectedShardIds.length}
        onEmote={(emoji) => scene.current?.triggerEmote(emoji)}
        onVirtualInput={handleVirtualInput}
        onOpenZone={setActivityZone}
        guideZone={guideZone}
        guideDistance={guideDistance}
        getLockedReason={lockedReasonFor}
        onRestartTour={() => setOnboardingOpen(true)}
      />
      <CityActivityPanel
        zone={activityZone}
        journey={journey}
        session={worldSession}
        lockedReason={activityZone ? lockedReasonFor(activityZone) : null}
        onClose={() => setActivityZone(null)}
        onOpenZone={setActivityZone}
        onUnlockZone={(zone) => setUnlockedOverrides((current) => current.includes(zone.id) ? current : [...current, zone.id])}
        onProgressChanged={() => setJourneyRefreshToken((token) => token + 1)}
        onCheckIn={() => { void checkIn(); }}
        onStoryEvent={(eventId) => {
          setCompletedStoryIds((current) => current.includes(eventId) ? current : [...current, eventId]);
          setJourneyRefreshToken((token) => token + 1);
        }}
      />
      <CityOnboarding open={onboardingOpen} onClose={closeOnboarding} onBegin={closeOnboarding} />
      <CityFinale open={!journey.loading && storyProgress.completedZoneIds.length === 7 && !finaleSeen} onClose={() => {
        setFinaleSeen(true);
        try { localStorage.setItem('lifelab_city_finale_v1', 'seen'); } catch { /* optional */ }
      }} />
    </div>
  );
}
