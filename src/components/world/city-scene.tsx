'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Loader, Sky, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { CityEnvironment, QuestBeacons } from './city-environment';
import { CityPlayer } from './city-player';
import { MEMORY_SHARDS } from './world-data';
import type { CityZoneId, PlayerHandle, VirtualInput } from './world-types';

function MemoryShard({ position, color }: { position: [number, number, number]; color: string }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 1.1;
    group.current.position.y = position[1] + Math.sin(clock.elapsedTime * 2 + position[0]) * 0.18;
  });
  return (
    <group ref={group} position={position}>
      <mesh castShadow rotation={[0.15, 0, 0.4]}>
        <octahedronGeometry args={[0.42, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} metalness={0.3} roughness={0.16} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.72, 0.035, 8, 28]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} toneMapped={false} />
      </mesh>
      <pointLight color={color} intensity={1.2} distance={4} />
    </group>
  );
}

interface CitySceneProps {
  energy: number;
  questZoneIds: CityZoneId[];
  collectedShardIds: string[];
  onPositionChange: (position: THREE.Vector3) => void;
}

export const CityScene = forwardRef<PlayerHandle, CitySceneProps>(function CityScene(
  { energy, questZoneIds, collectedShardIds, onPositionChange }, ref
) {
  const player = useRef<PlayerHandle>(null);
  useImperativeHandle(ref, () => ({
    setVirtualInput(input: VirtualInput) { player.current?.setVirtualInput(input); },
    triggerEmote(emoji: string) { player.current?.triggerEmote(emoji); },
  }));

  return (
    <div className="absolute inset-0 bg-[#9fd7ef]">
      <Canvas
        shadows="basic"
        dpr={[0.75, 1]}
        camera={{ position: [0, 7, 64], fov: 52, near: 0.1, far: 320 }}
        gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.94 }}
      >
        <color attach="background" args={['#9fd7ef']} />
        <fog attach="fog" args={['#afddec', 105, 225]} />
        <Sky distance={280} sunPosition={[-30, 36, 20]} inclination={0.54} azimuth={0.22} turbidity={4} rayleigh={1.1} mieCoefficient={0.005} mieDirectionalG={0.8} />
        <hemisphereLight args={['#e7f6ff', '#51664a', 1.25]} />
        <directionalLight
          position={[-25, 34, 18]}
          intensity={2.35}
          color="#fff1d5"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-78}
          shadow-camera-right={78}
          shadow-camera-top={78}
          shadow-camera-bottom={-78}
          shadow-camera-near={3}
          shadow-camera-far={160}
          shadow-bias={-0.0003}
        />
        <directionalLight position={[24, 12, -24]} intensity={0.42} color="#a9c7ff" />
        <Sparkles count={30} scale={[120, 20, 120]} size={1.1} speed={0.12} color="#fff5c2" opacity={0.24} />

        <CityEnvironment energy={energy} />
        <QuestBeacons zoneIds={questZoneIds} />
        {MEMORY_SHARDS.filter((shard) => !collectedShardIds.includes(shard.id)).map((shard) => (
          <MemoryShard key={shard.id} position={shard.position} color={shard.color} />
        ))}
        <CityPlayer ref={player} onPositionChange={onPositionChange} />
      </Canvas>
      <Loader
        dataInterpolation={(progress) => `Đang dựng Thành Phố Mây ${progress.toFixed(0)}%`}
        containerStyles={{ background: 'linear-gradient(145deg, #dff4ff, #b9e5ff)' }}
        innerStyles={{ width: 'min(380px, 72vw)', background: 'rgba(255,255,255,0.62)' }}
        barStyles={{ height: '6px', background: 'linear-gradient(90deg, #34d399, #38bdf8, #8b5cf6)' }}
        dataStyles={{ color: '#173246', fontSize: '13px', fontWeight: 800 }}
      />
    </div>
  );
});
