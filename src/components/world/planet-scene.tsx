'use client';

import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import * as THREE from 'three';
import { PlanetBiomes, ZONES } from './planet-biomes';
import { PlayerCharacter, type PlayerControlsHandle } from './player-character';
import { InteractiveLetters } from './interactive-letters';
import { OtherPlayers } from './other-players';
import { PLANET_RADIUS, greatCircleDistance } from './spherical-math';
import type { LostLetter, OnlinePlayer, PlanetZone } from './world-types';

export interface PlanetSceneHandle {
  setVirtualInput: (input: { x: number; y: number; jump: boolean; sprint: boolean }) => void;
  triggerEmote: (emoji: string) => void;
}

interface PlanetSceneProps {
  collectedLetterIds: string[];
  onlinePlayers?: OnlinePlayer[];
  onZoneChange?: (zone: PlanetZone | null) => void;
  onOpenLetter?: (letter: LostLetter) => void;
  onEmoteTrigger?: (emoji: string) => void;
}

/** Animated celestial clouds orbiting the planet */
function OrbitingClouds() {
  const cloudsRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.04;
      cloudsRef.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <group ref={cloudsRef}>
      {[0, 1.2, 2.4, 3.6, 4.8].map((angle, idx) => {
        const radius = PLANET_RADIUS + 3.5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle * 1.5) * 6;
        const z = Math.sin(angle) * radius;
        return (
          <Float key={idx} speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
            <mesh position={[x, y, z]}>
              <dodecahedronGeometry args={[1.8 + (idx % 2) * 0.5, 1]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.45} roughness={0.9} />
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

/** Dynamic Sun & Moon Orbit with Day/Night lighting */
function DynamicDayNightSun() {
  const sunLightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime() * 0.05;
    const distance = 80;
    const x = Math.cos(time) * distance;
    const y = Math.sin(time) * distance * 0.6;
    const z = Math.sin(time) * distance;

    if (sunLightRef.current) {
      sunLightRef.current.position.set(x, y, z);
    }
  });

  return (
    <>
      <directionalLight
        ref={sunLightRef}
        position={[40, 60, 40]}
        intensity={2.2}
        color="#fffbeb"
        castShadow
      />
      <ambientLight intensity={0.7} color="#dbeafe" />
      <hemisphereLight args={['#fed7aa', '#1e293b', 0.8]} />
    </>
  );
}

export const PlanetScene = forwardRef<PlanetSceneHandle, PlanetSceneProps>(
  function PlanetScene(
    {
      collectedLetterIds,
      onlinePlayers = [],
      onZoneChange,
      onOpenLetter,
      onEmoteTrigger,
    },
    ref
  ) {
    const playerControlsRef = useRef<PlayerControlsHandle>(null);
    const lastDetectedZoneRef = useRef<string | null>(null);

    useImperativeHandle(ref, () => ({
      setVirtualInput: (input) => playerControlsRef.current?.setVirtualInput(input),
      triggerEmote: (emoji) => playerControlsRef.current?.triggerEmote(emoji),
    }));

    // Detect closest landmark zone based on player's position
    const handlePositionChange = (pos: THREE.Vector3) => {
      let nearestZone: PlanetZone | null = null;
      let minDistance = 5.8; // Proximity threshold in meters

      for (const zone of ZONES) {
        const zoneCartesian = new THREE.Vector3(
          PLANET_RADIUS * Math.sin(zone.theta) * Math.cos(zone.phi),
          PLANET_RADIUS * Math.cos(zone.theta),
          PLANET_RADIUS * Math.sin(zone.theta) * Math.sin(zone.phi)
        );
        const dist = greatCircleDistance(pos, zoneCartesian);
        if (dist < minDistance) {
          minDistance = dist;
          nearestZone = zone;
        }
      }

      const zoneId = nearestZone ? nearestZone.id : null;
      if (zoneId !== lastDetectedZoneRef.current) {
        lastDetectedZoneRef.current = zoneId;
        onZoneChange?.(nearestZone);
      }
    };

    return (
      <div className="relative h-full w-full select-none">
        <Canvas
          shadows
          camera={{ position: [0, 10, PLANET_RADIUS + 12], fov: 50, near: 0.1, far: 300 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          style={{ background: 'linear-gradient(to bottom, #090e17 0%, #111e2e 50%, #0d1a15 100%)' }}
        >
          {/* Deep Space Stars */}
          <Stars radius={150} depth={60} count={3000} factor={4} saturation={0.5} fade speed={1} />

          {/* Dynamic Day/Night Lighting */}
          <DynamicDayNightSun />

          {/* Atmospheric Floating Clouds */}
          <OrbitingClouds />

          {/* The Spherical Planet with 6 Biomes */}
          <PlanetBiomes />

          {/* Player Controlled Character */}
          <PlayerCharacter
            ref={playerControlsRef}
            onPositionChange={handlePositionChange}
            onEmoteTrigger={onEmoteTrigger}
          />

          {/* Other Online Players & Wanderer Companions */}
          <OtherPlayers players={onlinePlayers} />

          {/* Interactive Floating Letters */}
          <InteractiveLetters
            collectedIds={collectedLetterIds}
            onOpenLetter={(letter) => onOpenLetter?.(letter)}
          />
        </Canvas>
      </div>
    );
  }
);
