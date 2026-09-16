'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { PLANET_RADIUS, sphericalToCartesian } from './spherical-math';
import type { OnlinePlayer } from './world-types';

/** Single Remote Player / Wanderer Model */
function RemotePlayerModel({
  player,
}: {
  player: OnlinePlayer;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const targetPos = useMemoVector(player.position);
  const targetQuat = useMemoQuaternion(player.rotation);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.lerp(targetPos, 0.15);
      groupRef.current.quaternion.slerp(targetQuat, 0.15);
    }
  });

  return (
    <group ref={groupRef} position={player.position} quaternion={player.rotation}>
      {/* Remote Avatar Mesh */}
      <group position={[0, 0.5, 0]}>
        {/* Poncho / Coat */}
        <mesh position={[0, 0.22, 0]}>
          <capsuleGeometry args={[0.26, 0.4, 6, 8]} />
          <meshStandardMaterial color={player.color} roughness={0.6} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.65, 0]}>
          <sphereGeometry args={[0.24, 10, 10]} />
          <meshStandardMaterial color="#fed7aa" />
        </mesh>
        {/* Cap */}
        <mesh position={[0, 0.78, -0.02]} rotation={[-0.15, 0, 0]}>
          <cylinderGeometry args={[0.26, 0.27, 0.12, 8]} />
          <meshStandardMaterial color="#0f766e" />
        </mesh>
      </group>

      {/* Floating Name Tag */}
      <Html position={[0, 1.6, 0]} center distanceFactor={14}>
        <div className="pointer-events-none flex flex-col items-center">
          {player.currentEmote && (
            <div className="mb-1 text-xl animate-bounce bg-white/90 rounded-full px-2 py-0.5 shadow-md">
              {player.currentEmote}
            </div>
          )}
          <div className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[9px] font-semibold text-calm-lichen backdrop-blur border border-white/10 shadow-sm whitespace-nowrap">
            {player.displayName}
          </div>
        </div>
      </Html>
    </group>
  );
}

function useMemoVector(pos: [number, number, number]) {
  return React.useMemo(() => new THREE.Vector3(...pos), [pos[0], pos[1], pos[2]]);
}

function useMemoQuaternion(rot: [number, number, number, number]) {
  return React.useMemo(() => new THREE.Quaternion(...rot), [rot[0], rot[1], rot[2], rot[3]]);
}

/** Pre-populated cozy companions that wander slowly on the planet */
export const WANDERER_COMPANIONS: OnlinePlayer[] = [
  {
    id: 'companion-1',
    displayName: 'Người Đưa Thư #07',
    color: '#38bdf8',
    position: sphericalToCartesian(PLANET_RADIUS + 0.5, Math.PI / 2.6, 0.8),
    rotation: [0, 0, 0, 1],
    isMoving: false,
    isJumping: false,
    currentEmote: '🕊️',
    lastUpdated: Date.now(),
  },
  {
    id: 'companion-2',
    displayName: 'Kẻ Mơ Mộng #24',
    color: '#ec4899',
    position: sphericalToCartesian(PLANET_RADIUS + 0.5, Math.PI / 1.6, Math.PI * 1.3),
    rotation: [0, 0, 0, 1],
    isMoving: false,
    isJumping: false,
    currentEmote: '✨',
    lastUpdated: Date.now(),
  },
  {
    id: 'companion-3',
    displayName: 'Tâm Hồn Chữa Lành #19',
    color: '#a855f7',
    position: sphericalToCartesian(PLANET_RADIUS + 0.5, Math.PI / 2.1, Math.PI / 2.1 - 0.3),
    rotation: [0, 0, 0, 1],
    isMoving: false,
    isJumping: false,
    currentEmote: '❤️',
    lastUpdated: Date.now(),
  },
];

export function OtherPlayers({
  players = [],
}: {
  players: OnlinePlayer[];
}) {
  const allPlayers = players.length > 0 ? players : WANDERER_COMPANIONS;

  return (
    <group>
      {allPlayers.map((player) => (
        <RemotePlayerModel key={player.id} player={player} />
      ))}
    </group>
  );
}
