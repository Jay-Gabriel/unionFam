'use client';

import React, { useMemo, useRef } from 'react';
import { Float, Html, Instance, Instances, RoundedBox, Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CityNature } from './city-nature';
import { CityStoryNpcs } from './city-npcs';
import { CITY_ZONES } from './world-data';
import type { CityZoneId } from './world-types';

const BLOCKS = [-45, -15, 15, 45];
const PALETTE = ['#f1c7a5', '#b8d9cf', '#f0b8c4', '#c9c0e8', '#f2d795', '#aed1e8', '#cbd7a3'];

const CITIZENS = [
  { x: -22, z: 38, r: 0.2, shirt: '#f9737f', skin: '#d89972', hair: '#4b3027' },
  { x: -8, z: 35, r: 2.8, shirt: '#4fb3a5', skin: '#a96f50', hair: '#272027' },
  { x: -38, z: 7, r: 1.5, shirt: '#7c70cf', skin: '#e5aa80', hair: '#795548' },
  { x: -52, z: 23, r: -0.4, shirt: '#e6ad48', skin: '#c88662', hair: '#3d2b23' },
  { x: 8, z: -22, r: 2.4, shirt: '#4e91ce', skin: '#e3aa82', hair: '#5d3c2e' },
  { x: 22, z: -38, r: 0.8, shirt: '#e06f9d', skin: '#9e674b', hair: '#231f20' },
  { x: 37, z: -23, r: 2.1, shirt: '#65a85e', skin: '#d99b72', hair: '#70452f' },
  { x: 52, z: -7, r: -1.2, shirt: '#e17855', skin: '#b87859', hair: '#33251f' },
  { x: 23, z: 8, r: 0.4, shirt: '#7068cb', skin: '#e3af8a', hair: '#8a573d' },
  { x: 38, z: 22, r: 2.7, shirt: '#34a89a', skin: '#b47758', hair: '#2c2526' },
  { x: 8, z: 52, r: 1.4, shirt: '#db8559', skin: '#d5946b', hair: '#3d2b23' },
  { x: -22, z: -8, r: -2.1, shirt: '#e4b547', skin: '#e2a67d', hair: '#65402e' },
  { x: -37, z: -23, r: 0.9, shirt: '#5a9fd2', skin: '#9d654b', hair: '#241f20' },
  { x: -8, z: -52, r: -0.3, shirt: '#d66b85', skin: '#d7956d', hair: '#5a3528' },
];

const PLANTERS = [
  [-22, -22], [-8, -22], [8, -22], [22, -22], [-22, 8], [-8, 8], [8, 8], [22, 8],
  [-52, -8], [-38, -8], [38, -8], [52, -8], [-52, 38], [-38, 38], [38, 38], [52, 38],
] as const;

const STREET_SIGNS = [
  [-23.5, -35, '#f9737f'], [-6.5, -35, '#5fc5a4'], [23.5, -35, '#7c70cf'],
  [36.5, -5, '#e6ad48'], [-36.5, 25, '#4e91ce'], [6.5, 25, '#e06f9d'],
] as const;

function Road({ x = 0, z = 0, width, depth, vertical = false }: { x?: number; z?: number; width: number; depth: number; vertical?: boolean }) {
  const length = vertical ? depth : width;
  const stripes = useMemo(() => Array.from({ length: Math.floor(length / 6) }, (_, index) => -length / 2 + 3 + index * 6), [length]);
  return (
    <group>
      <mesh position={[x, 0.12, z]} receiveShadow>
        <boxGeometry args={[width, 0.2, depth]} />
        <meshStandardMaterial color="#34434d" roughness={0.94} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[x + (vertical ? side * (width / 2 + 0.22) : 0), 0.24, z + (vertical ? 0 : side * (depth / 2 + 0.22))]} receiveShadow>
            <boxGeometry args={[vertical ? 0.42 : width, 0.26, vertical ? depth : 0.42]} />
            <meshStandardMaterial color="#eee9df" roughness={0.92} />
          </mesh>
          <mesh position={[x + (vertical ? side * (width / 2 - 0.55) : 0), 0.235, z + (vertical ? 0 : side * (depth / 2 - 0.55))]}>
            <boxGeometry args={[vertical ? 0.11 : width, 0.026, vertical ? depth : 0.11]} />
            <meshStandardMaterial color="#cbd4d6" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {stripes.map((offset) => (
        <mesh key={offset} position={[x + (vertical ? 0 : offset), 0.235, z + (vertical ? offset : 0)]}>
          <boxGeometry args={[vertical ? 0.13 : 2.7, 0.025, vertical ? 2.7 : 0.13]} />
          <meshStandardMaterial color="#f4d978" roughness={0.86} />
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
      <mesh position={[0, 0.32, 0]} receiveShadow>
        <cylinderGeometry args={[0.72, 0.82, 0.6, 16]} />
        <meshStandardMaterial color="#d6b58b" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.65, 0]}>
        <cylinderGeometry args={[0.16, 0.23, 2.15, 10]} />
        <meshToonMaterial color="#765039" />
      </mesh>
      {[[0, 3, 0], [0.58, 2.72, 0], [-0.52, 2.78, 0.12], [0, 2.65, 0.55]].map((p, index) => (
        <mesh key={index} position={p as [number, number, number]}>
          <sphereGeometry args={[0.8, 14, 10]} />
          <meshToonMaterial color={index % 2 ? '#74b96c' : '#62a95f'} />
        </mesh>
      ))}
    </group>
  );
}

function Lamp({ position, flip = 1 }: { position: [number, number, number]; flip?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.85, 0]}>
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
        <mesh key={y} position={[0, y, y > 0.8 ? 0.2 : 0]}>
          <boxGeometry args={[2.25, 0.18, 0.3]} />
          <meshStandardMaterial color="#a9693f" roughness={0.76} />
        </mesh>
      ))}
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} position={[x, 0.27, 0]}>
          <boxGeometry args={[0.12, 0.55, 0.5]} />
          <meshStandardMaterial color="#40525a" roughness={0.6} metalness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function CityCar({ position, rotation = 0, color = '#e76f51' }: { position: [number, number, number]; rotation?: number; color?: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox position={[0, 0.62, 0]} args={[1.75, 0.58, 3.35]} radius={0.18} smoothness={2}>
        <meshToonMaterial color={color} />
      </RoundedBox>
      <RoundedBox position={[0, 1.12, -0.18]} args={[1.5, 0.68, 1.72]} radius={0.16} smoothness={2}>
        <meshToonMaterial color={color} />
      </RoundedBox>
      {[[-0.78, 0.45, -1.08], [0.78, 0.45, -1.08], [-0.78, 0.45, 1.08], [0.78, 0.45, 1.08]].map((p, index) => (
        <mesh key={index} position={p as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.34, 0.34, 0.22, 16]} />
          <meshStandardMaterial color="#18242c" roughness={0.78} />
        </mesh>
      ))}
      <mesh position={[0, 1.18, -1.05]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[1.3, 0.45, 0.06]} />
        <meshPhysicalMaterial color="#b9e6f5" roughness={0.12} metalness={0.05} clearcoat={0.8} />
      </mesh>
      <mesh position={[0, 1.18, 0.72]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[1.3, 0.45, 0.06]} />
        <meshPhysicalMaterial color="#8fcada" roughness={0.12} clearcoat={0.8} />
      </mesh>
    </group>
  );
}

function TrafficLight({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.075, 0.1, 3.6, 10]} />
        <meshStandardMaterial color="#263842" metalness={0.35} roughness={0.55} />
      </mesh>
      <mesh position={[0, 3.65, 0]}>
        <boxGeometry args={[0.52, 1.25, 0.48]} />
        <meshStandardMaterial color="#1d2c34" roughness={0.55} />
      </mesh>
      {[3.98, 3.65, 3.32].map((y, index) => (
        <mesh key={y} position={[0, y, 0.255]}>
          <sphereGeometry args={[0.13, 12, 8]} />
          <meshStandardMaterial color={['#ff5b5b', '#ffd166', '#49d17d'][index]} emissive={index === 2 ? '#49d17d' : '#000000'} emissiveIntensity={index === 2 ? 1.4 : 0} />
        </mesh>
      ))}
    </group>
  );
}

function CityCitizens({ compact = false }: { compact?: boolean }) {
  const citizens = compact ? CITIZENS.filter((_, index) => index % 2 === 0) : CITIZENS;
  return (
    <group>
      <Instances limit={citizens.length} range={citizens.length}>
        <capsuleGeometry args={[0.34, 0.76, 4, 8]} />
        <meshToonMaterial />
        {citizens.map((citizen, index) => <Instance key={`body-${index}`} position={[citizen.x, 1.45, citizen.z]} rotation={[0, citizen.r, 0]} color={citizen.shirt} />)}
      </Instances>
      <Instances limit={citizens.length} range={citizens.length}>
        <sphereGeometry args={[0.39, 12, 9]} />
        <meshToonMaterial />
        {citizens.map((citizen, index) => <Instance key={`head-${index}`} position={[citizen.x, 2.38, citizen.z]} color={citizen.skin} />)}
      </Instances>
      <Instances limit={citizens.length} range={citizens.length}>
        <sphereGeometry args={[0.4, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshToonMaterial />
        {citizens.map((citizen, index) => <Instance key={`hair-${index}`} position={[citizen.x, 2.49, citizen.z]} rotation={[0, citizen.r, 0]} color={citizen.hair} />)}
      </Instances>
      <Instances limit={citizens.length * 2} range={citizens.length * 2}>
        <capsuleGeometry args={[0.11, 0.52, 3, 7]} />
        <meshToonMaterial color="#334155" />
        {citizens.flatMap((citizen, index) => [-0.17, 0.17].map((offset) => <Instance key={`leg-${index}-${offset}`} position={[citizen.x + offset, 0.56, citizen.z]} rotation={[0, citizen.r, 0]} />))}
      </Instances>
      <Instances limit={citizens.length * 2} range={citizens.length * 2}>
        <capsuleGeometry args={[0.085, 0.42, 3, 7]} />
        <meshToonMaterial />
        {citizens.flatMap((citizen, index) => [-0.45, 0.45].map((offset) => <Instance key={`arm-${index}-${offset}`} position={[citizen.x + offset, 1.48, citizen.z]} rotation={[0, citizen.r, offset * 0.45]} color={citizen.skin} />))}
      </Instances>
    </group>
  );
}

function StreetFurniture({ compact = false }: { compact?: boolean }) {
  const planters = compact ? PLANTERS.filter((_, index) => index % 2 === 0) : PLANTERS;
  const bollards = [-55, -35, -25, -5, 5, 25, 35, 55];
  return (
    <group>
      <Instances limit={planters.length} range={planters.length}>
        <cylinderGeometry args={[0.5, 0.62, 0.58, 12]} />
        <meshToonMaterial color="#d8b08c" />
        {planters.map(([x, z], index) => <Instance key={`pot-${index}`} position={[x, 0.58, z]} />)}
      </Instances>
      <Instances limit={planters.length} range={planters.length}>
        <dodecahedronGeometry args={[0.66, 0]} />
        <meshToonMaterial color="#64ad67" />
        {planters.map(([x, z], index) => <Instance key={`plant-${index}`} position={[x, 1.2, z]} rotation={[0, index * 1.7, 0]} scale={index % 3 === 0 ? 1.15 : 0.9} />)}
      </Instances>
      <Instances limit={bollards.length * 4} range={bollards.length * 4}>
        <cylinderGeometry args={[0.1, 0.13, 0.72, 8]} />
        <meshToonMaterial color="#40545d" />
        {bollards.flatMap((value) => [
          <Instance key={`bn-${value}`} position={[value, 0.7, -34.3]} />,
          <Instance key={`bs-${value}`} position={[value, 0.7, 34.3]} />,
          <Instance key={`bw-${value}`} position={[-34.3, 0.7, value]} />,
          <Instance key={`be-${value}`} position={[34.3, 0.7, value]} />,
        ])}
      </Instances>
      <Instances limit={STREET_SIGNS.length} range={STREET_SIGNS.length}>
        <cylinderGeometry args={[0.055, 0.075, 2.5, 8]} />
        <meshToonMaterial color="#3d5059" />
        {STREET_SIGNS.map(([x, z], index) => <Instance key={`sign-pole-${index}`} position={[x, 1.65, z]} />)}
      </Instances>
      <Instances limit={STREET_SIGNS.length} range={STREET_SIGNS.length}>
        <boxGeometry args={[1.45, 0.7, 0.12]} />
        <meshToonMaterial />
        {STREET_SIGNS.map(([x, z, color], index) => <Instance key={`sign-${index}`} position={[x, 2.73, z]} rotation={[0, index % 2 ? Math.PI / 2 : 0, 0]} color={color} />)}
      </Instances>
      {!compact && <>
        <Bench position={[-22, 0.3, 22]} rotation={Math.PI} />
        <Bench position={[22, 0.3, -8]} rotation={-Math.PI / 2} />
        <Bench position={[8, 0.3, 38]} rotation={Math.PI / 2} />
        <Bench position={[-38, 0.3, -8]} />
      </>}
    </group>
  );
}

function CafeTerrace() {
  return (
    <group position={[15, 0.42, -15]}>
      {[[-3.2, -2.8], [1.6, -2.4], [-1.2, 2.4], [3.3, 2.8]].map(([x, z], index) => (
        <group key={index} position={[x, 0, z]}>
          <mesh position={[0, 0.72, 0]}>
            <cylinderGeometry args={[0.72, 0.72, 0.1, 22]} />
            <meshStandardMaterial color="#f8efe1" roughness={0.72} />
          </mesh>
          <mesh position={[0, 0.36, 0]}>
            <cylinderGeometry args={[0.09, 0.16, 0.72, 12]} />
            <meshStandardMaterial color="#41545c" metalness={0.3} roughness={0.58} />
          </mesh>
          <mesh position={[0, 2.3, 0]}>
            <coneGeometry args={[1.55, 0.55, 24]} />
            <meshStandardMaterial color={index % 2 ? '#f28b82' : '#5fc5a4'} roughness={0.74} />
          </mesh>
          <mesh position={[0, 1.42, 0]}>
            <cylinderGeometry args={[0.055, 0.07, 1.85, 10]} />
            <meshStandardMaterial color="#40525a" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function MarketStalls() {
  return (
    <group position={[15, 0.42, 45]}>
      {[-5.5, 0, 5.5].map((x, index) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 1.2, 0]} receiveShadow>
            <boxGeometry args={[4.2, 2.4, 3.4]} />
            <meshStandardMaterial color={['#f3d7b5', '#cde0d2', '#d8d0ed'][index]} roughness={0.86} />
          </mesh>
          <mesh position={[0, 2.72, 0.35]} rotation={[0, 0, index % 2 ? 0.035 : -0.035]}>
            <boxGeometry args={[4.65, 0.22, 4.1]} />
            <meshStandardMaterial color={['#d7655a', '#2f9d82', '#7065bf'][index]} roughness={0.68} />
          </mesh>
          <mesh position={[0, 1.15, -1.75]}>
            <boxGeometry args={[3.15, 1.05, 0.12]} />
            <meshStandardMaterial color="#fff8ea" roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Building({ position, size, floors, color, accent, rotation = 0, glow = 0 }: {
  position: [number, number, number]; size: [number, number]; floors: number; color: string; accent: string; rotation?: number; glow?: number;
}) {
  const [width, depth] = size;
  const height = floors * 2.25;
  const windowRows = Array.from({ length: floors }, (_, index) => index);
  const windowColumns = Array.from({ length: Math.max(2, Math.floor(width / 2.6)) }, (_, index) => index);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox position={[0, height / 2, 0]} args={[width, height, depth]} radius={0.22} smoothness={2} receiveShadow>
        <meshToonMaterial color={color} />
      </RoundedBox>
      <mesh position={[0, 0.24, 0]} receiveShadow>
        <boxGeometry args={[width + 0.42, 0.48, depth + 0.42]} />
        <meshStandardMaterial color="#c8b9a7" roughness={0.92} />
      </mesh>
      <mesh position={[0, height + 0.2, 0]}>
        <boxGeometry args={[width + 0.5, 0.4, depth + 0.5]} />
        <meshToonMaterial color="#fff5e7" />
      </mesh>
      <mesh position={[0, height + 0.48, 0]}>
        <boxGeometry args={[width - 0.7, 0.18, depth - 0.7]} />
        <meshToonMaterial color={accent} />
      </mesh>
      <Instances limit={windowRows.length * windowColumns.length + windowRows.length * 2} range={windowRows.length * windowColumns.length + windowRows.length * 2}>
        <boxGeometry args={[1.12, 1.18, 0.12]} />
        <meshStandardMaterial color="#9ddff0" emissive={glow > 0 ? '#f9d88b' : '#315d70'} emissiveIntensity={0.12 + glow * 0.65} roughness={0.18} />
        {windowRows.flatMap((row) => windowColumns.map((column) => {
          const x = (column - (windowColumns.length - 1) / 2) * (width / (windowColumns.length + 0.3));
          return <Instance key={`front-${row}-${column}`} position={[x, 1.65 + row * 2.2, depth / 2 + 0.065]} />;
        }))}
        {windowRows.map((row) => <Instance key={`side-r-${row}`} position={[width / 2 + 0.065, 1.7 + row * 2.2, 0]} rotation={[0, Math.PI / 2, 0]} />)}
        {windowRows.map((row) => <Instance key={`side-l-${row}`} position={[-width / 2 - 0.065, 1.7 + row * 2.2, 0]} rotation={[0, Math.PI / 2, 0]} />)}
      </Instances>
      <Instances limit={windowRows.length * windowColumns.length} range={windowRows.length * windowColumns.length}>
        <boxGeometry args={[1.38, 0.11, 0.22]} />
        <meshStandardMaterial color="#fff5e7" roughness={0.76} />
        {windowRows.flatMap((row) => windowColumns.map((column) => {
          const x = (column - (windowColumns.length - 1) / 2) * (width / (windowColumns.length + 0.3));
          return <Instance key={`sill-${row}-${column}`} position={[x, 0.99 + row * 2.2, depth / 2 + 0.12]} />;
        }))}
      </Instances>
      <group position={[0, 0, depth / 2 + 0.16]}>
        {[-1, 1].map((side) => (
          <group key={`shop-${side}`} position={[side * width * 0.27, 0, 0]}>
            <RoundedBox position={[0, 1.18, 0]} args={[Math.max(2.1, width * 0.32), 1.9, 0.16]} radius={0.12} smoothness={2}>
              <meshPhysicalMaterial color="#75bfd3" roughness={0.12} metalness={0.05} clearcoat={0.75} />
            </RoundedBox>
            <mesh position={[0, 2.35, 0.42]} rotation={[-0.18, 0, 0]}>
              <boxGeometry args={[Math.max(2.35, width * 0.35), 0.16, 0.92]} />
              <meshToonMaterial color={side > 0 ? accent : '#fff1d6'} />
            </mesh>
            {[-0.75, -0.25, 0.25, 0.75].map((stripe, stripeIndex) => (
              <mesh key={stripe} position={[stripe * Math.max(1.1, width * 0.17), 2.3, 0.9]} rotation={[-0.18, 0, 0]}>
                <boxGeometry args={[Math.max(0.28, width * 0.055), 0.18, 0.84]} />
                <meshToonMaterial color={stripeIndex % 2 ? '#fff7e8' : accent} />
              </mesh>
            ))}
          </group>
        ))}
        <mesh position={[0, 0.62, 0.22]}>
          <boxGeometry args={[1.55, 0.1, 0.54]} />
          <meshToonMaterial color="#d9c4a7" />
        </mesh>
      </group>
      {floors > 3 && (
        <>
          {[-0.26, 0.26].map((offset) => <group key={offset} position={[width * offset, 5.35, depth / 2 + 0.48]}>
            <mesh><boxGeometry args={[2.2, 0.12, 0.72]} /><meshStandardMaterial color="#f4eadb" roughness={0.8} /></mesh>
            <mesh position={[0, 0.48, 0.3]}><boxGeometry args={[1.9, 0.06, 0.06]} /><meshStandardMaterial color="#596d73" metalness={0.25} roughness={0.55} /></mesh>
            <mesh position={[0, 0.14, 0.2]}><boxGeometry args={[1.7, 0.25, 0.3]} /><meshToonMaterial color="#85b96d" /></mesh>
          </group>)}
        </>
      )}
      <mesh position={[0, 1.08, depth / 2 + 0.09]}>
        <boxGeometry args={[1.35, 2.15, 0.16]} />
        <meshStandardMaterial color="#4b6470" roughness={0.58} />
      </mesh>
      <mesh position={[0, 2.58, depth / 2 + 0.5]} rotation={[-0.12, 0, 0]}>
        <boxGeometry args={[Math.min(width - 1, 4.8), 0.22, 1.1]} />
        <meshToonMaterial color={accent} />
      </mesh>
      <mesh position={[0, 3.28, depth / 2 + 0.1]}>
        <boxGeometry args={[3.2, 0.7, 0.16]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} roughness={0.5} />
      </mesh>
      {floors >= 5 && (
        <mesh position={[0, height + 0.82, 0]}>
          <boxGeometry args={[Math.min(3.5, width * 0.45), 1.2, Math.min(2.5, depth * 0.45)]} />
          <meshStandardMaterial color="#a9b8bb" roughness={0.9} />
        </mesh>
      )}
      {floors >= 4 && <group position={[-width * 0.27, height + 0.78, 0]}>
        <mesh><cylinderGeometry args={[0.62, 0.72, 1.35, 14]} /><meshToonMaterial color="#7fb0b4" /></mesh>
        <mesh position={[0, 0.78, 0]}><sphereGeometry args={[0.64, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshToonMaterial color="#9bc8ca" /></mesh>
      </group>}
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
      <mesh position={[0, 0.36, 0]} receiveShadow>
        <cylinderGeometry args={[3.1, 3.35, 0.68, 32]} />
        <meshStandardMaterial color="#dde3e0" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.74, 0]}>
        <cylinderGeometry args={[2.72, 2.72, 0.16, 32]} />
        <meshPhysicalMaterial color="#62c8e8" roughness={0.12} transparent opacity={0.82} clearcoat={1} />
      </mesh>
      <mesh position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.35, 0.55, 2.4, 18]} />
        <meshStandardMaterial color="#e8e4df" roughness={0.72} />
      </mesh>
      <mesh ref={core} position={[0, 3.25, 0]}>
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
      <mesh position={[0, 3.8, 0]}>
        <cylinderGeometry args={[3.5, 4.2, 7.6, 24]} />
        <meshStandardMaterial color="#f2e8d5" roughness={0.82} />
      </mesh>
      <mesh position={[0, 7.8, 0]}>
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
      <mesh position={[0, 2.4, 0]}>
        <boxGeometry args={[8.5, 4.8, 7.5]} />
        <meshPhysicalMaterial color="#b9f5dc" transparent opacity={0.42} roughness={0.16} transmission={0.18} />
      </mesh>
      {[-4.2, 0, 4.2].map((x) => (
        <mesh key={x} position={[x, 2.5, 0]}>
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
    <group position={[-15, 0.25, 45]}>
      <Building position={[0, 0, 0]} size={[13, 10]} floors={4} color="#f3d7a0" accent="#34d399" />
      {[-7.2, 7.2].map((x) => (
        <mesh key={x} position={[x, 3.2, 5.6]}>
          <boxGeometry args={[1, 6.4, 1]} />
          <meshStandardMaterial color="#fff5e7" roughness={0.76} />
        </mesh>
      ))}
      <mesh position={[0, 6, 5.6]}>
        <boxGeometry args={[15.4, 0.7, 1.1]} />
        <meshStandardMaterial color="#fff5e7" roughness={0.76} />
      </mesh>
    </group>
  );
}

function DawnHome() {
  return (
    <group position={[-45, 0.25, -15]}>
      <RoundedBox position={[0, 3.2, 0]} args={[11.5, 6.4, 9.5]} radius={0.55} smoothness={3} receiveShadow>
        <meshToonMaterial color="#fff1df" />
      </RoundedBox>
      <mesh position={[0, 7.05, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[8.3, 2.9, 4]} />
        <meshToonMaterial color="#e98aa9" />
      </mesh>
      <RoundedBox position={[0, 1.7, 4.83]} args={[2.2, 3.4, 0.28]} radius={0.15} smoothness={2}>
        <meshStandardMaterial color="#527b7b" roughness={0.58} />
      </RoundedBox>
      {[-3.6, 3.6].map((x) => (
        <group key={x} position={[x, 4.1, 4.9]}>
          <RoundedBox args={[2.15, 1.9, 0.2]} radius={0.16} smoothness={2}>
            <meshPhysicalMaterial color="#9ce2ed" roughness={0.12} clearcoat={0.8} />
          </RoundedBox>
          <mesh position={[0, -1.08, 0.28]}><boxGeometry args={[2.5, 0.22, 0.52]} /><meshToonMaterial color="#f7d37b" /></mesh>
        </group>
      ))}
      <mesh position={[0, 5.7, 5.1]}>
        <boxGeometry args={[4.8, 0.85, 0.18]} />
        <meshStandardMaterial color="#f7d37b" emissive="#d88f3d" emissiveIntensity={0.2} />
      </mesh>
      <pointLight position={[0, 4.8, 5.8]} color="#ffd89a" intensity={1.2} distance={11} />
      {[-4.8, 4.8].map((x) => <Tree key={x} position={[x, 0, 5.4]} scale={0.55} />)}
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
      <mesh position={[0, 4.1, 0]}>
        <boxGeometry args={[12.5, 8.2, 10]} />
        <meshStandardMaterial color="#e7dcc4" roughness={0.82} />
      </mesh>
      {[-4.5, -1.5, 1.5, 4.5].map((x) => (
        <mesh key={x} position={[x, 3.1, 5.25]}>
          <cylinderGeometry args={[0.42, 0.52, 6.2, 12]} />
          <meshStandardMaterial color="#fff8e8" roughness={0.74} />
        </mesh>
      ))}
      <mesh position={[0, 8.55, 0]} rotation={[0, Math.PI / 4, 0]}>
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
        <mesh key={x} position={[x, 0.95, -3.1]}>
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

function Clouds({ compact = false }: { compact?: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (group.current) group.current.rotation.y += delta * 0.012; });
  const count = compact ? 4 : 6;
  return (
    <group ref={group}>
      {Array.from({ length: count }, (_, index) => {
        const angle = index / count * Math.PI * 2;
        const radius = 44 + index % 3 * 8;
        return (
          <group key={index} position={[Math.sin(angle) * radius, 17 + index % 3 * 2.2, Math.cos(angle) * radius]}>
            {[-1, 0, 1].map((offset) => (
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

function StoryRestoration({ completedZoneIds, compact }: { completedZoneIds: CityZoneId[]; compact: boolean }) {
  const restored = CITY_ZONES.filter((zone) => completedZoneIds.includes(zone.id));
  if (!restored.length) return null;
  return <group>
    {restored.map((zone) => <group key={zone.id} position={[zone.position[0], 0.4, zone.position[2]]}>
      <Sparkles count={compact ? 5 : 11} scale={[10, 6, 10]} size={compact ? 1.2 : 1.8} speed={0.16} color={zone.color} opacity={0.48} />
      <pointLight position={[0, 3.8, 0]} color={zone.color} intensity={compact ? 0.3 : 0.65} distance={12} />
      {[0, 1, 2, 3, 4, 5].map((index) => {
        const angle = index / 6 * Math.PI * 2;
        return <group key={index} position={[Math.sin(angle) * 6.2, 0, Math.cos(angle) * 6.2]}>
          <mesh position={[0, 0.14, 0]}><cylinderGeometry args={[0.2, 0.26, 0.28, 8]} /><meshToonMaterial color="#6f9f64" /></mesh>
          <mesh position={[0, 0.42, 0]} rotation={[0, angle, 0]}><sphereGeometry args={[0.22, 8, 6]} /><meshToonMaterial color={index % 2 ? zone.color : '#fff1a8'} /></mesh>
        </group>;
      })}
    </group>)}
  </group>;
}

export function QuestBeacons({ zoneIds, activeZoneId }: { zoneIds: CityZoneId[]; activeZoneId?: CityZoneId }) {
  return (
    <group>
      {CITY_ZONES.filter((zone) => zoneIds.includes(zone.id) || zone.id === activeZoneId).map((zone) => {
        const active = zone.id === activeZoneId;
        return (
        <Float key={zone.id} speed={active ? 1.7 : 1.2} floatIntensity={active ? 0.42 : 0.25} rotationIntensity={0.04}>
          <group position={[zone.position[0], active ? 7.2 : 5.8, zone.position[2]]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={active ? 1.35 : 1}>
              <torusGeometry args={[0.75, active ? 0.11 : 0.08, 10, 36]} />
              <meshBasicMaterial color={zone.color} toneMapped={false} />
            </mesh>
            <mesh position={[0, active ? -3.45 : -2.5, 0]}>
              <cylinderGeometry args={[0.04, active ? 0.5 : 0.28, active ? 6.8 : 4.8, 10, 1, true]} />
              <meshBasicMaterial color={zone.color} transparent opacity={active ? 0.34 : 0.2} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            {active && <>
              <mesh position={[0, -6.75, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.1, 1.5, 36]} />
                <meshBasicMaterial color={zone.color} transparent opacity={0.65} side={THREE.DoubleSide} toneMapped={false} />
              </mesh>
              <pointLight color={zone.color} intensity={1.25} distance={10} />
              <Html position={[0, 1.55, 0]} center distanceFactor={18} style={{ pointerEvents: 'none' }}>
                <div className="whitespace-nowrap rounded-full border border-white/50 bg-[#102b3e]/90 px-3 py-1.5 text-[10px] font-black text-white shadow-xl backdrop-blur-md">✦ ĐIỂM ĐẾN · {zone.name}</div>
              </Html>
            </>}
          </group>
        </Float>
      );})}
    </group>
  );
}

export function CityEnvironment({ energy, completedZoneIds, activeZoneId, compact = false }: { energy: number; completedZoneIds: CityZoneId[]; activeZoneId: CityZoneId; compact?: boolean }) {
  const buildings = useMemo(() => {
    const positions: Array<{ x: number; z: number }> = [];
    for (const x of BLOCKS) for (const z of BLOCKS) {
      const isLandmark = (x === -45 && z === 15) || (x === -45 && z === -45) ||
        (x === 45 && z === 15) || (x === 45 && z === -45) || (x === 45 && z === -15) ||
        (x === -45 && z === -15) || (x === -15 && z === -15) || (x === -15 && z === 45) || (x === 15 && z === -15) ||
        (x === 15 && z === 45);
      if (!isLandmark) positions.push({ x, z });
    }
    return positions;
  }, []);

  return (
    <group>
      <mesh position={[0, -2.5, 0]} receiveShadow>
        <cylinderGeometry args={[93, 84, 4.2, 96]} />
        <meshStandardMaterial color="#775a43" roughness={0.96} />
      </mesh>
      <mesh position={[0, -3.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[210, 96]} />
        <meshPhysicalMaterial color="#58b9d9" roughness={0.18} transparent opacity={0.82} clearcoat={1} />
      </mesh>
      <mesh position={[0, -0.22, 0]} receiveShadow>
        <cylinderGeometry args={[92.5, 93, 0.4, 96]} />
        <meshStandardMaterial color="#77ae69" roughness={0.96} />
      </mesh>

      {[-30, 0, 30].map((x) => <Road key={`v-${x}`} x={x} width={x === 0 ? 8 : 6} depth={124} vertical />)}
      {[-30, 0, 30].map((z) => <Road key={`h-${z}`} z={z} width={124} depth={z === 0 ? 8 : 6} />)}
      {[-30, 0, 30].flatMap((x) => [-30, 0, 30].map((z) => <Crosswalk key={`${x}-${z}`} x={x} z={z} vertical={(x + z) % 60 === 0} />))}

      {BLOCKS.flatMap((x) => BLOCKS.map((z) => (
        <mesh key={`slab-${x}-${z}`} position={[x, 0.24, z]} receiveShadow>
          <boxGeometry args={[20.8, 0.28, 20.8]} />
          <meshStandardMaterial color={
            (x === -45 && z === 15) || (x === -45 && z === -45) || (x === 15 && z === -15)
              ? '#8fbe78' : '#ded8cc'
          } roughness={0.96} />
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
          glow={energy / 100}
          rotation={z > 0 ? Math.PI : 0}
        />
      ))}

      <Fountain energy={energy} />
      <DawnHome />
      <Sanctuary />
      <Greenhouse />
      <Observatory />
      <Academy />
      <Arcade />
      <ResourceBank />
      <LakeBoardwalk />
      <CafeTerrace />
      <MarketStalls />
      <StreetFurniture compact={compact} />
      <CityStoryNpcs activeZoneId={activeZoneId} restoredZoneIds={completedZoneIds} compact={compact} />
      <StoryRestoration completedZoneIds={completedZoneIds} compact={compact} />

      <CityCar position={[-3.1, 0.28, 42]} color="#e66a5b" />
      <CityCar position={[3.1, 0.28, 23]} rotation={Math.PI} color="#e5b84d" />
      <CityCar position={[27, 0.28, -11]} rotation={Math.PI / 2} color="#4d9fc4" />
      <CityCar position={[-27, 0.28, -44]} rotation={-Math.PI / 2} color="#7b6dcc" />
      <CityCar position={[3.1, 0.28, -50]} color="#58a876" />

      {[[-5.2, 0.3, 5.2, 0], [5.2, 0.3, -5.2, Math.PI], [-35.2, 0.3, 5.2, 0], [35.2, 0.3, -5.2, Math.PI]].map((p, index) => (
        <TrafficLight key={index} position={[p[0], p[1], p[2]]} rotation={p[3]} />
      ))}

      {[[ -22, 0.3, -9], [-9, 0.3, -22], [-52, 0.3, 8], [-38, 0.3, 22], [22, 0.3, 39], [38, 0.3, 52], [-52, 0.3, -38], [-38, 0.3, -52], [22, 0.3, -39]].map((p, index) => <Tree key={index} position={p as [number, number, number]} scale={0.85 + index % 2 * 0.12} />)}
      {[-45, -15, 15, 45].flatMap((value) => [
        <Lamp key={`a-${value}`} position={[value - 9, 0.3, -25]} flip={1} />,
        <Lamp key={`b-${value}`} position={[value + 9, 0.3, 25]} flip={-1} />,
        <Lamp key={`c-${value}`} position={[-25, 0.3, value - 9]} flip={1} />,
        <Lamp key={`d-${value}`} position={[25, 0.3, value + 9]} flip={-1} />,
      ])}
      <CityNature compact={compact} bloomLevel={completedZoneIds.length} />
      <Clouds compact={compact} />
    </group>
  );
}
