'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { Float, Html, useAnimations, useGLTF } from '@react-three/drei';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import type { CityZoneId } from './world-types';

const NPCS: Array<{
  zoneId: CityZoneId;
  name: string;
  role: string;
  modelPath: string;
  position: [number, number, number];
  rotation: number;
  accent: string;
  scale?: number;
  activeAnim?: string;
}> = [
  { zoneId: 'academy', name: 'An', role: 'Thủ thư Ban Mai', modelPath: '/models/characters/Mage.glb', position: [-8.2, 0.42, 39], rotation: Math.PI, accent: '#fde68a', scale: 0.68 },
  { zoneId: 'sanctuary', name: 'Mộc', role: 'Người lắng nghe', modelPath: '/models/characters/Rogue.glb', position: [-39, 0.42, 20], rotation: -2.25, accent: '#a7f3d0', scale: 0.68 },
  { zoneId: 'observatory', name: 'Astra', role: 'Nhà quan sát', modelPath: '/models/characters/Mage.glb', position: [38, 0.42, 21], rotation: 2.35, accent: '#fde047', scale: 0.68, activeAnim: 'Spellcasting' },
  { zoneId: 'greenhouse', name: 'Nia', role: 'Người chăm nhà kính', modelPath: '/models/characters/Barbarian.glb', position: [-38, 0.42, -38], rotation: -0.75, accent: '#bbf7d0', scale: 0.68 },
  { zoneId: 'lake', name: 'Noa', role: 'Người giữ ký ức', modelPath: '/models/characters/Knight.glb', position: [-8, 0.42, -55], rotation: 0, accent: '#bae6fd', scale: 0.68 },
  { zoneId: 'arcade', name: 'Kaito', role: 'Trưởng ga 00:00', modelPath: '/models/characters/Rogue_Hooded.glb', position: [38, 0.42, -38], rotation: 0.75, accent: '#fbcfe8', scale: 0.68 },
  { zoneId: 'vault', name: 'Kim', role: 'Người giữ nguồn lực', modelPath: '/models/characters/Knight.glb', position: [37.5, 0.42, -8], rotation: 2.35, accent: '#fde68a', scale: 0.68 },
];

function StoryNpc({ npc, active, restored }: { npc: typeof NPCS[number]; active: boolean; restored: boolean }) {
  const group = useRef<THREE.Group>(null);
  const gltf = useGLTF(npc.modelPath);
  const model = useMemo(() => {
    const next = cloneSkeleton(gltf.scene);
    next.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = false;
    });
    return next;
  }, [gltf.scene]);

  const { actions } = useAnimations(gltf.animations, group);
  useEffect(() => {
    const animName = (active && npc.activeAnim && actions[npc.activeAnim])
      ? npc.activeAnim
      : restored && actions.Cheer
        ? 'Cheer'
        : actions.Idle
          ? 'Idle'
          : Object.keys(actions)[0];

    const action = actions[animName];
    action?.reset().fadeIn(0.2).play();
    return () => { action?.fadeOut(0.2); };
  }, [actions, active, restored, npc.activeAnim]);

  return (
    <group position={npc.position} rotation={[0, npc.rotation, 0]}>
      <group ref={group}>
        <primitive object={model} scale={npc.scale || 0.68} />
      </group>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.72, 0.86, 30]} />
        <meshBasicMaterial color={npc.accent} transparent opacity={active ? 0.9 : restored ? 0.45 : 0.2} toneMapped={false} />
      </mesh>
      {active && (
        <Float speed={1.8} floatIntensity={0.18} rotationIntensity={0}>
          <mesh position={[0, 3.35, 0]}>
            <octahedronGeometry args={[0.16, 0]} />
            <meshBasicMaterial color={npc.accent} toneMapped={false} />
          </mesh>
        </Float>
      )}
      <Html position={[0, 3.75, 0]} center distanceFactor={15} style={{ pointerEvents: 'none' }}>
        <div className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-center shadow-lg backdrop-blur ${active ? 'border-white/60 bg-[#102b3e]/94 text-white' : 'border-white/25 bg-[#102b3e]/76 text-white/75'}`}>
          <b className="block text-[10px]">{npc.name}</b>
          <span className="text-[8px] opacity-70">{npc.role}</span>
        </div>
      </Html>
    </group>
  );
}

export function CityStoryNpcs({ activeZoneId, restoredZoneIds, compact }: { activeZoneId: CityZoneId; restoredZoneIds: CityZoneId[]; compact: boolean }) {
  const visible = compact
    ? [
      ...NPCS.filter((npc) => npc.zoneId === activeZoneId),
      ...NPCS.filter((npc) => npc.zoneId !== activeZoneId && restoredZoneIds.includes(npc.zoneId)).slice(-2),
    ]
    : NPCS;
  return <group>{visible.map((npc) => <StoryNpc key={npc.zoneId} npc={npc} active={npc.zoneId === activeZoneId} restored={restoredZoneIds.includes(npc.zoneId)} />)}</group>;
}

useGLTF.preload('/models/characters/Mage.glb');
useGLTF.preload('/models/characters/Rogue.glb');
useGLTF.preload('/models/characters/Barbarian.glb');
useGLTF.preload('/models/characters/Knight.glb');
useGLTF.preload('/models/characters/Rogue_Hooded.glb');
