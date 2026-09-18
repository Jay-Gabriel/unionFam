'use client';

import React, { useMemo, useRef } from 'react';
import { Float } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CITY_ZONES } from './world-data';
import type { CityZoneId } from './world-types';

const BLOCKS = [-45, -15, 15, 45];
const PALETTE = ['#f1c7a5', '#b8d9cf', '#f0b8c4', '#c9c0e8', '#f2d795', '#aed1e8', '#cbd7a3'];

function Road({ x = 0, z = 0, width, depth, vertical = false }: { x?: number; z?: number; width: number; depth: number; vertical?: boolean }) {
  const length = vertical ? depth : width;
  const stripes = useMemo(() => Array.from({ length: Math.floor(length / 6) }, (_, index) => -length / 2 + 3 + index * 6), [length]);
  return (
    <group>
      <mesh position={[x, 0.12, z]} receiveShadow>
        <boxGeometry args={[width, 0.2, depth]} />
        <meshStandardMaterial color="#4f5e68" roughness={0.98} />
      </mesh>
      {stripes.map((offset) => (
        <mesh key={offset} position={[x + (vertical ? 0 : offset), 0.235, z + (vertical ? offset : 0)]}>
          <boxGeometry args={[vertical ? 0.13 : 2.7, 0.025, vertical ? 2.7 : 0.13]} />
          <meshStandardMaterial color="#f8e5a2" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Crosswalk({ x, z, vertical = false }: { x: number; z: number; vertical?: boolean }) {
  return (
    <group>
      {[-3, -2, -1, 0, 1, 2, 3].map((index) => (
        <mesh key={index} position={[x + (vertical ? 0 : index * 0.82), 0.25, z + (vertical ? index * 0.82 : 0)]}>
          <boxGeometry args={[vertical ? 4.8 : 0.55, 0.025, vertical ? 0.55 : 4.8]} />
          <meshStandardMaterial color="#f7f4ec" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.72, 0.82, 0.6, 16]} />
        <meshStandardMaterial color="#d6b58b" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.65, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.23, 2.15, 10]} />
        <meshStandardMaterial color="#765039" roughness={0.95} />
      </mesh>
      {[[0, 3, 0], [0.58, 2.72, 0], [-0.52, 2.78, 0.12], [0, 2.65, 0.55]].map((p, index) => (
        <mesh key={index} position={p as [number, number, number]} castShadow>
          <sphereGeometry args={[0.8, 14, 10]} />
          <meshStandardMaterial color={index % 2 ? '#74b96c' : '#62a95f'} roughness={0.94} />
        </mesh>
      ))}
    </group>
  );
}

function Lamp({ position, flip = 1 }: { position: [number, number, number]; flip?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.85, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.13, 3.7, 10]} />
        <meshStandardMaterial color="#314650" roughness={0.55} metalness={0.35} />
      </mesh>
      <mesh position={[0.36 * flip, 3.62, 0]}>
        <boxGeometry args={[0.9, 0.1, 0.1]} />
        <meshStandardMaterial color="#314650" roughness={0.55} metalness={0.35} />
      </mesh>
      <mesh position={[0.78 * flip, 3.48, 0]}>
        <sphereGeometry args={[0.22, 12, 8]} />
        <meshStandardMaterial color="#fff3c4" emissive="#ffcf67" emissiveIntensity={1.8} roughness={0.35} />
      </mesh>
    </group>
  );
}

function Bench({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[0.48, 1.02].map((y) => (
        <mesh key={y} position={[0, y, y > 0.8 ? 0.2 : 0]} castShadow>
          <boxGeometry args={[2.25, 0.18, 0.3]} />
          <meshStandardMaterial color="#a9693f" roughness={0.76} />
        </mesh>
      ))}
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} position={[x, 0.27, 0]} castShadow>
          <boxGeometry args={[0.12, 0.55, 0.5]} />
          <meshStandardMaterial color="#40525a" roughness={0.6} metalness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function Building({ position, size, floors, color, accent, rotation = 0 }: {
  position: [number, number, number]; size: [number, number]; floors: number; color: string; accent: string; rotation?: number;
}) {
  const [width, depth] = size;
  const height = floors * 2.25;
  const windowRows = Array.from({ length: floors }, (_, index) => index);
  const windowColumns = Array.from({ length: Math.max(2, Math.floor(width / 2.6)) }, (_, index) => index);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.84} />
      </mesh>
      <mesh position={[0, 0.24, 0]} receiveShadow>
        <boxGeometry args={[width + 0.42, 0.48, depth + 0.42]} />
        <meshStandardMaterial color="#c8b9a7" roughness={0.92} />
      </mesh>
      <mesh position={[0, height + 0.2, 0]} castShadow>
        <boxGeometry args={[width + 0.5, 0.4, depth + 0.5]} />
        <meshStandardMaterial color="#fff5e7" roughness={0.76} />
      </mesh>
      {windowRows.map((row) => {
        const y = 1.65 + row * 2.2;
        return windowColumns.map((column) => {
          const x = (column - (windowColumns.length - 1) / 2) * (width / (windowColumns.length + 0.3));
          return (
            <group key={`${row}-${column}`}>
              <mesh position={[x, y, depth / 2 + 0.065]}>
                <boxGeometry args={[1.12, 1.18, 0.12]} />
                <meshStandardMaterial color="#9ddff0" emissive="#315d70" emissiveIntensity={0.12} roughness={0.18} />
              </mesh>
              <mesh position={[x, y - 0.66, depth / 2 + 0.12]}>
                <boxGeometry args={[1.38, 0.11, 0.22]} />
                <meshStandardMaterial color="#fff5e7" roughness={0.76} />
              </mesh>
            </group>
          );
        });
      })}
      <mesh position={[0, 1.08, depth / 2 + 0.09]}>
        <boxGeometry args={[1.35, 2.15, 0.16]} />
        <meshStandardMaterial color="#4b6470" roughness={0.58} />
      </mesh>
      <mesh position={[0, 2.58, depth / 2 + 0.5]} rotation={[-0.12, 0, 0]} castShadow>
        <boxGeometry args={[Math.min(width - 1, 4.8), 0.22, 1.1]} />
        <meshStandardMaterial color={accent} roughness={0.65} />
      </mesh>
      <mesh position={[0, 3.28, depth / 2 + 0.1]}>
        <boxGeometry args={[3.2, 0.7, 0.16]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} roughness={0.5} />
      </mesh>
      {floors >= 5 && (
        <mesh position={[0, height + 0.82, 0]} castShadow>
          <boxGeometry args={[Math.min(3.5, width * 0.45), 1.2, Math.min(2.5, depth * 0.45)]} />
          <meshStandardMaterial color="#a9b8bb" roughness={0.9} />
        </mesh>
      )}
    </group>
  );
}

function Fountain({ energy }: { energy: number }) {
  const core = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!core.current) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 2.4) * 0.08;
    core.current.rotation.y += 0.012;
    core.current.scale.setScalar(pulse * (0.85 + energy / 250));
  });
  return (
    <group position={[-15, 0.28, -15]}>
      <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3.1, 3.35, 0.68, 32]} />
        <meshStandardMaterial color="#dde3e0" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.74, 0]}>
        <cylinderGeometry args={[2.72, 2.72, 0.16, 32]} />
        <meshPhysicalMaterial color="#62c8e8" roughness={0.12} transparent opacity={0.82} clearcoat={1} />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.55, 2.4, 18]} />
        <meshStandardMaterial color="#e8e4df" roughness={0.72} />
      </mesh>
      <mesh ref={core} position={[0, 3.25, 0]} castShadow>
        <octahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial color="#c4b5fd" emissive="#6366f1" emissiveIntensity={0.8 + energy / 45} metalness={0.35} roughness={0.2} />
      </mesh>
      <pointLight position={[0, 3.4, 0]} color="#818cf8" intensity={1 + energy / 35} distance={10} />
    </group>
  );
}

function Observatory() {
  return (
    <group position={[45, 0.3, 15]}>
      <mesh position={[0, 3.8, 0]} castShadow>
        <cylinderGeometry args={[3.5, 4.2, 7.6, 24]} />
        <meshStandardMaterial color="#f2e8d5" roughness={0.82} />
      </mesh>
      <mesh position={[0, 7.8, 0]} castShadow>
        <sphereGeometry args={[3.65, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#6d79a8" metalness={0.25} roughness={0.38} />
      </mesh>
      <mesh position={[0, 4.1, 3.65]}>
        <boxGeometry args={[1.6, 2.8, 0.25]} />
        <meshStandardMaterial color="#5c4135" />
      </mesh>
      <Float speed={1.2} floatIntensity={0.25}>
        <mesh position={[0, 10.1, 0]} rotation={[0.4, 0, 0.5]}>
          <torusGeometry args={[1.2, 0.08, 10, 40]} />
          <meshBasicMaterial color="#fde047" toneMapped={false} />
        </mesh>
      </Float>
    </group>
  );
}

function Greenhouse() {
  return (
    <group position={[-45, 0.25, -45]}>
      <mesh position={[0, 2.4, 0]} castShadow>
        <boxGeometry args={[8.5, 4.8, 7.5]} />
        <meshPhysicalMaterial color="#b9f5dc" transparent opacity={0.42} roughness={0.16} transmission={0.18} />
      </mesh>
      {[-4.2, 0, 4.2].map((x) => (
        <mesh key={x} position={[x, 2.5, 0]} castShadow>
          <boxGeometry args={[0.18, 5.2, 7.8]} />
          <meshStandardMaterial color="#3f7968" metalness={0.3} roughness={0.5} />
        </mesh>
      ))}
      {[-2.6, 0, 2.6].map((z) => <Tree key={z} position={[z, 0, z]} scale={0.55} />)}
    </group>
  );
}

function Sanctuary() {
  return (
    <group position={[-45, 0.25, 15]}>
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <cylinderGeometry args={[10.2, 10.2, 0.2, 32]} />
        <meshStandardMaterial color="#8cc77a" roughness={0.98} />
      </mesh>
      <Tree position={[0, 0, 0]} scale={1.65} />
      {[-6, 6].map((x) => <Bench key={x} position={[x, 0, 0]} rotation={x < 0 ? Math.PI / 2 : -Math.PI / 2} />)}
      {[[5, 0, 5], [-5, 0, 5], [5, 0, -5], [-5, 0, -5]].map((p, index) => <Tree key={index} position={p as [number, number, number]} scale={0.75} />)}
    </group>
  );
}

function Academy() {
  return (
    <group position={[0, 0.25, 45]}>
      <Building position={[0, 0, 0]} size={[13, 10]} floors={4} color="#f3d7a0" accent="#34d399" />
      {[-7.2, 7.2].map((x) => (
        <mesh key={x} position={[x, 3.2, 5.6]} castShadow>
          <boxGeometry args={[1, 6.4, 1]} />
          <meshStandardMaterial color="#fff5e7" roughness={0.76} />
        </mesh>
      ))}
      <mesh position={[0, 6, 5.6]} castShadow>
        <boxGeometry args={[15.4, 0.7, 1.1]} />
        <meshStandardMaterial color="#fff5e7" roughness={0.76} />
      </mesh>
    </group>
  );
}

function Arcade() {
  return (
    <group position={[45, 0.25, -45]}>
      <Building position={[0, 0, 0]} size={[13, 11]} floors={3} color="#332d55" accent="#fb7185" rotation={Math.PI} />
      {[-3.8, 0, 3.8].map((x, index) => (
        <mesh key={x} position={[x, 7.6, -5.7]}>
          <boxGeometry args={[2.8, 0.16, 0.16]} />
          <meshBasicMaterial color={['#fb7185', '#67e8f9', '#c084fc'][index]} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function ResourceBank() {
  return (
    <group position={[45, 0.25, -15]}>
      <mesh position={[0, 4.1, 0]} castShadow>
        <boxGeometry args={[12.5, 8.2, 10]} />
        <meshStandardMaterial color="#e7dcc4" roughness={0.82} />
      </mesh>
      {[-4.5, -1.5, 1.5, 4.5].map((x) => (
        <mesh key={x} position={[x, 3.1, 5.25]} castShadow>
          <cylinderGeometry args={[0.42, 0.52, 6.2, 12]} />
          <meshStandardMaterial color="#fff8e8" roughness={0.74} />
        </mesh>
      ))}
      <mesh position={[0, 8.55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[8.5, 2.1, 4]} />
        <meshStandardMaterial color="#e6b85c" metalness={0.18} roughness={0.5} />
      </mesh>
    </group>
  );
}

function LakeBoardwalk() {
  return (
    <group position={[0, 0, -59]}>
      <mesh position={[0, 0.3, 0]} receiveShadow>
        <boxGeometry args={[38, 0.35, 7]} />
        <meshStandardMaterial color="#c58f5b" roughness={0.88} />
      </mesh>
      {[-17, -12, -7, -2, 3, 8, 13, 18].map((x) => (
        <mesh key={x} position={[x, 0.95, -3.1]} castShadow>
          <boxGeometry args={[0.13, 1.15, 0.13]} />
          <meshStandardMaterial color="#f2e4cd" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 1.48, -3.1]}>
        <boxGeometry args={[36, 0.13, 0.16]} />
        <meshStandardMaterial color="#f2e4cd" roughness={0.8} />
      </mesh>
      <Bench position={[-10, 0.2, 0]} />
      <Bench position={[10, 0.2, 0]} rotation={Math.PI} />
    </group>
  );
}

function Clouds() {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (group.current) group.current.rotation.y += delta * 0.012; });
  return (
    <group ref={group}>
      {Array.from({ length: 10 }, (_, index) => {
        const angle = index / 10 * Math.PI * 2;
        const radius = 44 + index % 3 * 8;
        return (
          <group key={index} position={[Math.sin(angle) * radius, 17 + index % 3 * 2.2, Math.cos(angle) * radius]}>
            {[-2, -1, 0, 1, 2].map((offset) => (
              <mesh key={offset} position={[offset * 1.7, Math.sin(offset) * 0.35, 0]} scale={[2.5 + Math.abs(offset) * 0.15, 1.15, 1.45]}>
                <sphereGeometry args={[1, 14, 10]} />
                <meshStandardMaterial color="#ffffff" roughness={1} transparent opacity={0.8} depthWrite={false} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

export function QuestBeacons({ zoneIds }: { zoneIds: CityZoneId[] }) {
  return (
    <group>
      {CITY_ZONES.filter((zone) => zoneIds.includes(zone.id)).map((zone) => (
        <Float key={zone.id} speed={1.2} floatIntensity={0.25} rotationIntensity={0.04}>
          <group position={[zone.position[0], 5.8, zone.position[2]]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.75, 0.08, 10, 36]} />
              <meshBasicMaterial color={zone.color} toneMapped={false} />
            </mesh>
            <mesh position={[0, -2.5, 0]}>
              <cylinderGeometry args={[0.04, 0.28, 4.8, 10, 1, true]} />
              <meshBasicMaterial color={zone.color} transparent opacity={0.2} side={THREE.DoubleSide} />
            </mesh>
          </group>
        </Float>
      ))}
    </group>
  );
}

export function CityEnvironment({ energy }: { energy: number }) {
  const buildings = useMemo(() => {
    const positions: Array<{ x: number; z: number }> = [];
    for (const x of BLOCKS) for (const z of BLOCKS) {
      const isLandmark = (x === -45 && z === 15) || (x === -45 && z === -45) ||
        (x === 45 && z === 15) || (x === 45 && z === -45) || (x === 45 && z === -15) ||
        (x === -15 && z === -15) || (x === 0 && z === 45);
      if (!isLandmark) positions.push({ x, z });
    }
    return positions;
  }, []);

  return (
    <group>
      <mesh position={[0, -1.25, 0]} receiveShadow>
        <cylinderGeometry args={[93, 84, 4.2, 96]} />
        <meshStandardMaterial color="#8e6243" roughness={0.96} />
      </mesh>
      <mesh position={[0, -3.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[210, 96]} />
        <meshPhysicalMaterial color="#58b9d9" roughness={0.18} transparent opacity={0.82} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[92.5, 93, 0.5, 96]} />
        <meshStandardMaterial color="#6aaa62" roughness={0.96} />
      </mesh>

      {[-30, 0, 30].map((x) => <Road key={`v-${x}`} x={x} width={x === 0 ? 8 : 6} depth={124} vertical />)}
      {[-30, 0, 30].map((z) => <Road key={`h-${z}`} z={z} width={124} depth={z === 0 ? 8 : 6} />)}
      {[-30, 0, 30].flatMap((x) => [-30, 0, 30].map((z) => <Crosswalk key={`${x}-${z}`} x={x} z={z} vertical={(x + z) % 60 === 0} />))}

      {BLOCKS.flatMap((x) => BLOCKS.map((z) => (
        <mesh key={`slab-${x}-${z}`} position={[x, 0.24, z]} receiveShadow>
          <boxGeometry args={[22, 0.28, 22]} />
          <meshStandardMaterial color={x === -45 && z === 15 ? '#86bd72' : '#e9dfd1'} roughness={0.96} />
        </mesh>
      )))}

      {buildings.map(({ x, z }, index) => (
        <Building
          key={`${x}-${z}`}
          position={[x, 0.4, z]}
          size={[11 + index % 3, 9.5 + index % 2]}
          floors={3 + index % 3}
          color={PALETTE[index % PALETTE.length]}
          accent={['#e56f67', '#7769ee', '#0ea5e9', '#14b8a6'][index % 4]}
          rotation={z > 0 ? Math.PI : 0}
        />
      ))}

      <Fountain energy={energy} />
      <Sanctuary />
      <Greenhouse />
      <Observatory />
      <Academy />
      <Arcade />
      <ResourceBank />
      <LakeBoardwalk />

      {[[ -22, 0.3, -9], [-9, 0.3, -22], [-52, 0.3, 8], [-38, 0.3, 22], [22, 0.3, 39], [38, 0.3, 52], [-52, 0.3, -38], [-38, 0.3, -52], [22, 0.3, -39]].map((p, index) => <Tree key={index} position={p as [number, number, number]} scale={0.85 + index % 2 * 0.12} />)}
      {[-45, -15, 15, 45].flatMap((value) => [
        <Lamp key={`a-${value}`} position={[value - 9, 0.3, -25]} flip={1} />,
        <Lamp key={`b-${value}`} position={[value + 9, 0.3, 25]} flip={-1} />,
        <Lamp key={`c-${value}`} position={[-25, 0.3, value - 9]} flip={1} />,
        <Lamp key={`d-${value}`} position={[25, 0.3, value + 9]} flip={-1} />,
      ])}
      <Clouds />
    </group>
  );
}
