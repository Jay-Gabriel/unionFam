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
  position: [number, number, number];
  rotation: number;
  shirt: string;
  accent: string;
}> = [
  { zoneId: 'academy', name: 'An', role: 'Thủ thư Ban Mai', position: [-8.2, 0.42, 39], rotation: Math.PI, shirt: '#34d399', accent: '#fde68a' },
  { zoneId: 'sanctuary', name: 'Mộc', role: 'Người lắng nghe', position: [-39, 0.42, 20], rotation: -2.25, shirt: '#2f9d82', accent: '#a7f3d0' },
  { zoneId: 'observatory', name: 'Astra', role: 'Nhà quan sát', position: [38, 0.42, 21], rotation: 2.35, shirt: '#7065bf', accent: '#fde047' },
  { zoneId: 'greenhouse', name: 'Nia', role: 'Người chăm nhà kính', position: [-38, 0.42, -38], rotation: -0.75, shirt: '#65a85e', accent: '#bbf7d0' },
  { zoneId: 'lake', name: 'Noa', role: 'Người giữ ký ức', position: [-8, 0.42, -55], rotation: 0, shirt: '#3b82b8', accent: '#bae6fd' },
  { zoneId: 'arcade', name: 'Kaito', role: 'Trưởng ga 00:00', position: [38, 0.42, -38], rotation: 0.75, shirt: '#c45d82', accent: '#fbcfe8' },
  { zoneId: 'vault', name: 'Kim', role: 'Người giữ nguồn lực', position: [37.5, 0.42, -8], rotation: 2.35, shirt: '#d59b36', accent: '#fde68a' },
];

function StoryNpc({ npc, active, restored }: { npc: typeof NPCS[number]; active: boolean; restored: boolean }) {
  const group = useRef<THREE.Group>(null);
  const gltf = useGLTF('/models/city-hero.gltf');
  const model = useMemo(() => {
    const next = cloneSkeleton(gltf.scene);
    next.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = active;
      object.receiveShadow = false;
      const materials = (Array.isArray(object.material) ? object.material : [object.material]).map((material) => {
        const name = (material?.name || '').toLowerCase();
        const color = name.includes('skin') || name.includes('face') ? '#d99a72'
          : name.includes('hair') ? '#4b3027'
            : name.includes('pants') ? '#26384d'
              : name.includes('shirt') ? npc.shirt : '#f7eadb';
        return new THREE.MeshToonMaterial({ name: material?.name, color });
      });
      object.material = Array.isArray(object.material) ? materials : materials[0];
    });
    return next;
  }, [active, gltf.scene, npc.shirt]);
  const { actions } = useAnimations(gltf.animations, group);
  useEffect(() => {
    const action = actions.Idle;
    action?.reset().fadeIn(0.2).play();
    return () => { action?.fadeOut(0.2); };
  }, [actions]);

  return <group position={npc.position} rotation={[0, npc.rotation, 0]}>
    <group ref={group}><primitive object={model} scale={0.58} /></group>
    <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.72, 0.86, 30]} />
      <meshBasicMaterial color={npc.accent} transparent opacity={active ? 0.9 : restored ? 0.45 : 0.2} toneMapped={false} />
    </mesh>
    {active && <Float speed={1.8} floatIntensity={0.18} rotationIntensity={0}>
      <mesh position={[0, 3.35, 0]}><octahedronGeometry args={[0.16, 0]} /><meshBasicMaterial color={npc.accent} toneMapped={false} /></mesh>
    </Float>}
    <Html position={[0, 3.75, 0]} center distanceFactor={15} style={{ pointerEvents: 'none' }}>
      <div className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-center shadow-lg backdrop-blur ${active ? 'border-white/60 bg-[#102b3e]/94 text-white' : 'border-white/25 bg-[#102b3e]/76 text-white/75'}`}>
        <b className="block text-[10px]">{npc.name}</b><span className="text-[8px] opacity-70">{npc.role}</span>
      </div>
    </Html>
  </group>;
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

useGLTF.preload('/models/city-hero.gltf');
