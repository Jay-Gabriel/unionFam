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

/** Celestial Sky Dome with deep starfield gradient */
function CelestialSkyDome() {
  return (
    <mesh>
      <sphereGeometry args={[220, 24, 24]} />
      <meshBasicMaterial
        color="#08101e"
        side={THREE.BackSide}
      />
    </mesh>
  );
}

/** Aurora Borealis glowing ribbon in the night sky */
function AuroraBorealis() {
  const ribbonRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ribbonRef.current) {
      const t = clock.getElapsedTime() * 0.3;
      ribbonRef.current.rotation.y = Math.sin(t * 0.2) * 0.1;
      ribbonRef.current.position.y = 40 + Math.sin(t * 0.5) * 2;
    }
  });

  return (
    <group ref={ribbonRef} position={[0, 40, -40]}>
      {/* Aurora Layer 1 - Emerald Cyan */}
      <mesh rotation={[0.2, 0.4, -0.1]}>
        <cylinderGeometry args={[75, 80, 24, 24, 1, true, 0, Math.PI * 1.2]} />
        <meshBasicMaterial
          color="#34d399"
          side={THREE.DoubleSide}
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Aurora Layer 2 - Violet Blue */}
      <mesh rotation={[-0.15, -0.3, 0.2]}>
        <cylinderGeometry args={[82, 86, 20, 24, 1, true, 0.5, Math.PI * 1.1]} />
        <meshBasicMaterial
          color="#818cf8"
          side={THREE.DoubleSide}
          transparent
          opacity={0.14}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/** Luminous Crescent Moon */
function CelestialMoon() {
  return (
    <group position={[-55, 50, -65]}>
      {/* Main Moon Sphere */}
      <mesh>
        <sphereGeometry args={[7.5, 20, 20]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>
      {/* Moon Glow Halo */}
      <mesh>
        <sphereGeometry args={[10.5, 16, 16]} />
        <meshBasicMaterial color="#fef9c3" transparent opacity={0.22} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh>
        <sphereGeometry args={[14, 16, 16]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.08} blending={THREE.AdditiveBlending} />
      </mesh>
      <pointLight color="#fef08a" intensity={2.0} distance={180} decay={2} />
    </group>
  );
}

/** Fireflies / Spirit motes floating in the atmosphere */
function SpiritFireflies() {
  const pointsRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const count = 80;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = PLANET_RADIUS + 0.8 + Math.random() * 5.0;
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
        size={0.28}
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
          PLANET_RADIUS * Math.sin(zone.theta) * Math.sin(phiToCartesian(zone.phi))
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

    function phiToCartesian(p: number) {
      return p;
    }

    return (
      <div className="relative h-full w-full select-none">
        <Canvas
          shadows
          camera={{ position: [0, 10, PLANET_RADIUS + 12], fov: 48, near: 0.1, far: 350 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        >
          {/* Explicit Background Color in Three.js renderer */}
          <color attach="background" args={['#08101e']} />

          {/* Dreamy Atmospheric Fog */}
          <fog attach="fog" args={['#0d192c', 25, 95]} />

          {/* 360 Sky Dome */}
          <CelestialSkyDome />

          {/* Aurora Borealis in Celestial Sky */}
          <AuroraBorealis />

          {/* Deep Space Stars */}
          <Stars radius={140} depth={50} count={2800} factor={3.8} saturation={0.7} fade speed={0.8} />

          {/* Luminous Moon */}
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
