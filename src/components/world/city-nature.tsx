'use client';

import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

type Placement = {
  position: [number, number, number];
  rotation?: number;
  scale?: number;
  variant?: number;
};

const TREE_PLACEMENTS: Placement[] = [
  { position: [-55, 0.42, 52], scale: 1.1 }, { position: [-38, 0.42, 55], variant: 2, scale: 0.95 },
  { position: [39, 0.42, 55], variant: 3 }, { position: [55, 0.42, 40], variant: 5, scale: 1.1 },
  { position: [-56, 0.42, 29], variant: 1 }, { position: [-39, 0.42, 27], variant: 4, scale: 0.9 },
  { position: [41, 0.42, 27], variant: 2 }, { position: [56, 0.42, 14], variant: 6, scale: 0.92 },
  { position: [-56, 0.42, -9], variant: 3 }, { position: [-39, 0.42, -25], variant: 6 },
  { position: [41, 0.42, -25], variant: 4 }, { position: [56, 0.42, -39], variant: 1 },
  { position: [-55, 0.42, -54], variant: 5 }, { position: [-22, 0.42, -55], variant: 2 },
  { position: [22, 0.42, -55], variant: 3 }, { position: [55, 0.42, -54], variant: 7 },
  { position: [-23, 0.42, 10], variant: 6, scale: 0.82 }, { position: [-8, 0.42, -23], variant: 1, scale: 0.88 },
  { position: [22, 0.42, 9], variant: 4, scale: 0.82 }, { position: [8, 0.42, 23], variant: 2, scale: 0.86 },
];

const ROCK_PLACEMENTS: Placement[] = [
  { position: [-67, 0.35, 30], scale: 0.75 }, { position: [66, 0.35, 18], variant: 2, scale: 0.7 },
  { position: [-63, 0.35, -43], variant: 4, scale: 0.85 }, { position: [65, 0.35, -47], variant: 1, scale: 0.7 },
  { position: [-34, 0.35, -64], variant: 6, scale: 0.55 }, { position: [34, 0.35, -65], variant: 3, scale: 0.65 },
  { position: [-68, 0.35, 2], variant: 5, scale: 0.5 }, { position: [67, 0.35, 52], variant: 7, scale: 0.58 },
];

const BUSH_PLACEMENTS: Placement[] = [
  { position: [-22, 0.35, 22] }, { position: [-8, 0.35, 22], variant: 2 },
  { position: [8, 0.35, 38], variant: 4 }, { position: [22, 0.35, 38], variant: 1 },
  { position: [-52, 0.35, -37], variant: 3 }, { position: [-38, 0.35, -52], variant: 5 },
  { position: [38, 0.35, -38], variant: 6 }, { position: [52, 0.35, -52], variant: 2 },
  { position: [-52, 0.35, 8], variant: 4 }, { position: [-38, 0.35, 22], variant: 1 },
];

const FLOWER_PLACEMENTS: Placement[] = [
  { position: [-20, 0.34, -20], scale: 0.8 }, { position: [-10, 0.34, -20], variant: 2, scale: 0.8 },
  { position: [-20, 0.34, -10], variant: 4, scale: 0.75 }, { position: [-10, 0.34, -10], variant: 5, scale: 0.75 },
  { position: [-49, 0.34, 9], variant: 3, scale: 0.8 }, { position: [-41, 0.34, 20], variant: 6, scale: 0.8 },
  { position: [-49, 0.34, -42], variant: 1, scale: 0.85 }, { position: [-41, 0.34, -48], variant: 7, scale: 0.85 },
];

function AssetScatter({ path, placements }: { path: string; placements: Placement[] }) {
  const gltf = useGLTF(path);
  const variants = useMemo(() => {
    const meshes: THREE.Mesh[] = [];
    gltf.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const mesh = object.clone();
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      meshes.push(mesh);
    });
    return meshes;
  }, [gltf.scene]);

  if (!variants.length) return null;
  return (
    <group>
      {placements.map((placement, index) => {
        const source = variants[(placement.variant ?? index) % variants.length];
        const clone = source.clone();
        return (
          <primitive
            key={`${path}-${index}`}
            object={clone}
            position={placement.position}
            rotation={[0, placement.rotation ?? (index * 1.93) % (Math.PI * 2), 0]}
            scale={placement.scale ?? 0.9}
          />
        );
      })}
    </group>
  );
}

export function CityNature() {
  return (
    <group>
      <AssetScatter path="/models/environment/trees.glb" placements={TREE_PLACEMENTS} />
      <AssetScatter path="/models/environment/rocks.glb" placements={ROCK_PLACEMENTS} />
      <AssetScatter path="/models/environment/bushes.glb" placements={BUSH_PLACEMENTS} />
      <AssetScatter path="/models/environment/flowers.glb" placements={FLOWER_PLACEMENTS} />
    </group>
  );
}

useGLTF.preload('/models/environment/trees.glb');
useGLTF.preload('/models/environment/rocks.glb');
useGLTF.preload('/models/environment/bushes.glb');
useGLTF.preload('/models/environment/flowers.glb');
