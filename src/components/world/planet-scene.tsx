'use client';

import React, { useRef, useImperativeHandle, forwardRef, useState, useMemo } from 'react';
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

/** Glowing Moon in the celestial sky */
function CelestialMoon() {
  return (
    <group position={[-50, 45, -70]}>
      <mesh>
        <sphereGeometry args={[7, 16, 16]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>
      {/* Outer Moon Glow Halo */}
      <mesh>
        <sphereGeometry args={[8.8, 16, 16]} />
        <meshBasicMaterial color="#fef9c3" transparent opacity={0.2} />
      </mesh>
      <pointLight color="#fef08a" intensity={1.5} distance={150} decay={2} />
    </group>
  );
}

/** Fireflies / Spirit motes floating in the atmosphere */
function SpiritFireflies() {
  const pointsRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const count = 70;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = PLANET_RADIUS + 0.8 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI;
      const phi = Math.random() * Math.PI * 2;
      positions[i * 3] = radius * Math.sin(theta) * Math.cos(phi);
      positions[i * 3 + 1] = radius * Math.cos(theta);
      positions[i * 3 + 2] = radius * Math.sin(theta) * Math.sin(phi);
    }
    return positions;
  }, []);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.25}
        color="#a7f3d0"
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
      />
    </points>
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
          camera={{ position: [0, 10, PLANET_RADIUS + 12], fov: 48, near: 0.1, far: 300 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          style={{ background: 'linear-gradient(to bottom, #111d2e 0%, #1e2f47 50%, #142334 100%)' }}
        >
          {/* Atmospheric Dreamy Fog */}
          <fog attach="fog" args={['#182638', 22, 92]} />

          {/* Deep Space Stars */}
          <Stars radius={150} depth={50} count={2500} factor={3.5} saturation={0.6} fade speed={0.8} />

          {/* Celestial Moon */}
          <CelestialMoon />

          {/* Dynamic Day/Night Lighting */}
          <DynamicDayNightSun />

          {/* Atmospheric Floating Clouds */}
          <OrbitingClouds />

          {/* Spirit Fireflies motes */}
          <SpiritFireflies />

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
