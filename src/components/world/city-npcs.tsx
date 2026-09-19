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
  accent: string;
  colors: { shirt: string; pants: string; hair: string; skin?: string };
}> = [
  { zoneId: 'academy', name: 'An', role: 'Thủ thư Ban Mai', position: [-8.2, 0.42, 39], rotation: Math.PI, accent: '#fde68a', colors: { shirt: '#10b981', pants: '#334155', hair: '#3e2723' } },
  { zoneId: 'sanctuary', name: 'Mộc', role: 'Người lắng nghe', position: [-39, 0.42, 20], rotation: -2.25, accent: '#a7f3d0', colors: { shirt: '#059669', pants: '#1e293b', hair: '#451a03' } },
  { zoneId: 'observatory', name: 'Astra', role: 'Nhà quan sát', position: [38, 0.42, 21], rotation: 2.35, accent: '#fde047', colors: { shirt: '#8b5cf6', pants: '#1e1b4b', hair: '#312e81' } },
  { zoneId: 'greenhouse', name: 'Nia', role: 'Người chăm nhà kính', position: [-38, 0.42, -38], rotation: -0.75, accent: '#bbf7d0', colors: { shirt: '#f97316', pants: '#475569', hair: '#78350f' } },
  { zoneId: 'lake', name: 'Noa', role: 'Người giữ ký ức', position: [-8, 0.42, -55], rotation: 0, accent: '#bae6fd', colors: { shirt: '#0284c7', pants: '#0f172a', hair: '#292524' } },
  { zoneId: 'arcade', name: 'Kaito', role: 'Trưởng ga 00:00', position: [38, 0.42, -38], rotation: 0.75, accent: '#fbcfe8', colors: { shirt: '#f43f5e', pants: '#09090b', hair: '#18181b' } },
  { zoneId: 'vault', name: 'Kim', role: 'Người giữ nguồn lực', position: [37.5, 0.42, -8], rotation: 2.35, accent: '#fde68a', colors: { shirt: '#eab308', pants: '#374151', hair: '#451a03' } },
];

function StoryNpc({ npc, active, restored }: { npc: typeof NPCS[number]; active: boolean; restored: boolean }) {
  const group = useRef<THREE.Group>(null);
  const gltf = useGLTF('/models/city-hero.gltf');
  const model = useMemo(() => {
    const next = cloneSkeleton(gltf.scene);
    next.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = false;
      const source = Array.isArray(object.material) ? object.material : [object.material];
      const styled = source.map((material) => {
        const name = (material?.name || '').toLowerCase();
        const color = name.includes('skin') || name.includes('face') ? '#fed7aa'
          : name.includes('hair') ? npc.colors.hair
          : name.includes('pants') ? npc.colors.pants
          : name.includes('shirt') ? npc.colors.shirt
          : '#ffffff';
        return new THREE.MeshToonMaterial({
          name: material?.name,
          color,
          side: THREE.FrontSide,
        });
      });
      object.material = Array.isArray(object.material) ? styled : styled[0];
    });
    return next;
  }, [gltf.scene, npc.colors]);

  const { actions } = useAnimations(gltf.animations, group);
  useEffect(() => {
    const animName = restored && actions.Victory
      ? 'Victory'
      : actions.Idle
        ? 'Idle'
        : Object.keys(actions)[0];

    const action = actions[animName];
    action?.reset().fadeIn(0.2).play();
    return () => { action?.fadeOut(0.2); };
  }, [actions, restored]);

  return (
    <group position={npc.position} rotation={[0, npc.rotation, 0]}>
      <group ref={group}>
        <primitive object={model} scale={0.78} />
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

useGLTF.preload('/models/city-hero.gltf');
