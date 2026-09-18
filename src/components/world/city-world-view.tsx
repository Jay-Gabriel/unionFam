'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { LeafLoader } from '@/components/calm/leaf-loader';
import { CityHud } from './city-hud';
import { CityActivityPanel } from './city-activity-panel';
import { CityOnboarding } from './city-onboarding';
import { buildCityStoryProgress } from './city-story-progress';
import { CITY_ZONES, MEMORY_SHARDS } from './world-data';
import { useWorldJourney } from './use-world-journey';
import type { CityZone, PlayerHandle, VirtualInput } from './world-types';

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
  const zoneId = useRef<string | null>(null);
  const collectedRef = useRef<string[]>([]);
  const [currentZone, setCurrentZone] = useState<CityZone | null>(null);
  const [collectedShardIds, setCollectedShardIds] = useState<string[]>([]);
  const [activityZone, setActivityZone] = useState<CityZone | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, z: 55 });
  const [journeyRefreshToken, setJourneyRefreshToken] = useState(0);
  const journey = useWorldJourney(collectedShardIds.length, journeyRefreshToken);
  const storyProgress = useMemo(() => buildCityStoryProgress(journey), [journey]);
  const guideZone = useMemo(
    () => CITY_ZONES.find((zone) => zone.id === storyProgress.activeZoneId) || CITY_ZONES[0],
    [storyProgress.activeZoneId]
  );
  const guideDistance = Math.hypot(playerPosition.x - guideZone.position[0], playerPosition.z - guideZone.position[2]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lifelab_city_memory_shards');
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const safe = parsed.filter((id): id is string => typeof id === 'string' && MEMORY_SHARDS.some((shard) => shard.id === id));
        collectedRef.current = safe;
        setCollectedShardIds(safe);
      }
    } catch {
      // Local progress is optional; the city remains playable without it.
    }
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem('lifelab_city_story_tour_v1') !== 'seen') setOnboardingOpen(true);
    } catch {
      setOnboardingOpen(true);
    }
  }, []);

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
    try { localStorage.setItem('lifelab_city_story_tour_v1', 'seen'); } catch { /* optional */ }
  }, []);
  const lockedReasonFor = useCallback((zone: CityZone) => storyProgress.lockedReason(zone.id), [storyProgress]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-sky-200">
      <CityScene
        ref={scene}
        energy={journey.energy}
        questZoneIds={journey.quests.filter((quest) => !quest.completed).map((quest) => quest.zoneId)}
        activeGuideZoneId={guideZone.id}
        collectedShardIds={collectedShardIds}
        onPositionChange={handlePositionChange}
        paused={Boolean(activityZone) || onboardingOpen}
      />
      <CityHud
        journey={journey}
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
        lockedReason={activityZone ? lockedReasonFor(activityZone) : null}
        onClose={() => setActivityZone(null)}
        onProgressChanged={() => setJourneyRefreshToken((token) => token + 1)}
      />
      <CityOnboarding open={onboardingOpen} onClose={closeOnboarding} onBegin={closeOnboarding} />
    </div>
  );
}
