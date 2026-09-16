'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { WorldUIOverlay } from './world-ui-overlay';
import { LeafLoader } from '@/components/calm/leaf-loader';
import type { LostLetter, OnlinePlayer, PlanetZone } from './world-types';
import type { PlanetSceneHandle } from './planet-scene';

// Dynamically import PlanetScene with SSR disabled for high-performance WebGL
const PlanetScene = dynamic(
  () => import('./planet-scene').then((mod) => mod.PlanetScene),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-calm-paper-white">
        <LeafLoader variant="bloom" size="lg" label="Đang kiến tạo Hành Tinh Tâm Trí 3D…" />
      </div>
    ),
  }
);

export function PlanetWorldView() {
  const sceneRef = useRef<PlanetSceneHandle>(null);
  const [currentZone, setCurrentZone] = useState<PlanetZone | null>(null);
  const [activeLetter, setActiveLetter] = useState<LostLetter | null>(null);
  const [collectedLetterIds, setCollectedLetterIds] = useState<string[]>([]);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);

  // Load collected letters from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('lifelab_collected_letters');
      if (saved) {
        setCollectedLetterIds(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleOpenLetter = (letter: LostLetter) => {
    setActiveLetter(letter);
    if (!collectedLetterIds.includes(letter.id)) {
      const updated = [...collectedLetterIds, letter.id];
      setCollectedLetterIds(updated);
      try {
        localStorage.setItem('lifelab_collected_letters', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  const handleTriggerEmote = (emoji: string) => {
    sceneRef.current?.triggerEmote(emoji);
  };

  const handleVirtualInputChange = (input: { x: number; y: number; jump: boolean; sprint: boolean }) => {
    sceneRef.current?.setVirtualInput(input);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950">
      {/* 3D WebGL Canvas Scene */}
      <PlanetScene
        ref={sceneRef}
        collectedLetterIds={collectedLetterIds}
        onlinePlayers={onlinePlayers}
        onZoneChange={setCurrentZone}
        onOpenLetter={handleOpenLetter}
      />

      {/* 2D HUD UI Overlay */}
      <WorldUIOverlay
        currentZone={currentZone}
        activeLetter={activeLetter}
        collectedLetterIds={collectedLetterIds}
        onlineCount={3 + (collectedLetterIds.length > 0 ? 1 : 0)}
        onCloseLetter={() => setActiveLetter(null)}
        onTriggerEmote={handleTriggerEmote}
        onVirtualInputChange={handleVirtualInputChange}
      />
    </div>
  );
}
