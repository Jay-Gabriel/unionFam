'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PLANET_RADIUS, sphericalToCartesian } from './spherical-math';
import type { PlanetZone } from './world-types';

export const ZONES: PlanetZone[] = [
  {
    id: 'village',
    name: 'Làng Ban Mai',
    subtitle: 'Nơi Bắt Đầu & Khám Phá Bản Thân',
    description: 'Ngôi làng ấm cúng với cối xay gió và hòm thư trung tâm. Nơi bắt đầu hành trình tự hiểu mình.',
    color: '#34d399',
    accentColor: '#10b981',
    theta: Math.PI / 2.8,
    phi: 0,
    actionLabel: 'Mở Bộ Câu Hỏi Khởi Đầu',
    targetHref: '/app/questions',
    aiPromptStarter: 'Chào Life Lab, mình đang ở Làng Ban Mai. Mình muốn nhìn lại những câu hỏi quan trọng để thấu hiểu bản thân hơn lúc này.',
  },
  {
    id: 'forest',
    name: 'Rừng Lắng Nghe',
    subtitle: 'Khai Vấn & Chữa Lành Tâm Hồn',
    description: 'Cổ thụ ngàn năm phát sáng cùng đống lửa ấm áp. Nơi bạn có thể trải lòng không phán xét.',
    color: '#a7f3d0',
    accentColor: '#059669',
    theta: Math.PI / 2.2,
    phi: Math.PI / 2.2,
    actionLabel: 'Ngồi Xuống Trò Chuyện Với AI',
    targetHref: '/app/conversations',
    aiPromptStarter: 'Chào Life Lab, mình đang ngồi bên đống lửa ở Rừng Lắng Nghe. Mình có một trăn trở trong lòng cần bạn lắng nghe và bóc tách cùng mình.',
  },
  {
    id: 'peak',
    name: 'Đỉnh Hải Đăng & Đài Thiên Văn',
    subtitle: 'Bản Đồ Cuộc Sống & Định Hướng',
    description: 'Đỉnh núi cao nhất hướng về chòm sao định mệnh. Nơi ngắm nhìn Life Design Map và 4 trục cuộc đời.',
    color: '#fde047',
    accentColor: '#eab308',
    theta: Math.PI / 4,
    phi: Math.PI,
    actionLabel: 'Xem Bản Đồ Cuộc Sống',
    targetHref: '/app/life-map',
    aiPromptStarter: 'Chào Life Lab, mình đang đứng trên Đỉnh Hải Đăng. Hãy giúp mình phân tích 4 trục: Tự Chủ, Kết Nối, Ổn Định và Khám Phá của bản đồ cuộc sống.',
  },
  {
    id: 'greenhouse',
    name: 'Nhà Kính Ươm Mầm',
    subtitle: 'Thử Nghiệm Vi Mô 7 Ngày',
    description: 'Nơi ươm những thói quen nhỏ nhất (smallest step). Mỗi hành động đời thực sẽ làm hoa nở.',
    color: '#86efac',
    accentColor: '#22c55e',
    theta: Math.PI / 1.7,
    phi: (3 * Math.PI) / 2,
    actionLabel: 'Xem Thử Nghiệm Đang Chạy',
    targetHref: '/app/experiments',
    aiPromptStarter: 'Chào Life Lab, mình đang ở Nhà Kính Ươm Mầm. Mình muốn thiết lập một thử nghiệm vi mô 7 ngày mới để tạo chuyển biến tích cực.',
  },
  {
    id: 'lake',
    name: 'Hồ Phản Chiếu',
    subtitle: 'Nhật Ký Suy Ngẫm & Bài Học',
    description: 'Mặt hồ tĩnh lặng lưu giữ những bài học sâu sắc và thuyền giấy nguyện ước của mọi người.',
    color: '#93c5fd',
    accentColor: '#3b82f6',
    theta: Math.PI / 1.5,
    phi: Math.PI / 3,
    actionLabel: 'Xem Nhật Ký & Bài Học',
    targetHref: '/app/reflections',
    aiPromptStarter: 'Chào Life Lab, mình đang ở Hồ Phản Chiếu. Mình muốn ghi nhận một suy ngẫm sâu sắc và đúc kết bài học từ trải nghiệm vừa qua.',
  },
  {
    id: 'station',
    name: 'Ga Tàu Chân Trời 00:00',
    subtitle: 'Căn Cước Lựa Chọn & Mini-Game',
    description: 'Cầu tàu gỗ vươn ra bầu trời sao, nơi đoàn tàu cảm xúc cập bến mỗi đêm để gỡ nút thắt tâm lý.',
    color: '#f472b6',
    accentColor: '#ec4899',
    theta: Math.PI / 1.3,
    phi: Math.PI * 1.1,
    actionLabel: 'Bước Lên Chuyến Tàu 00:00',
    targetHref: '/app/game',
    aiPromptStarter: 'Chào Life Lab, mình vừa bước lên Ga Tàu Chân Trời. Mình muốn đối diện với những lựa chọn thật nhất trong lòng mình.',
  },
];

/** Surface placer helper component */
function PlacedOnSphere({
  theta,
  phi,
  radius = PLANET_RADIUS,
  heightOffset = 0,
  children,
  headingAngle = 0,
}: {
  theta: number;
  phi: number;
  radius?: number;
  heightOffset?: number;
  children: React.ReactNode;
  headingAngle?: number;
}) {
  const [pos, quat] = useMemo(() => {
    const p = sphericalToCartesian(radius + heightOffset, theta, phi);
    const posVec = new THREE.Vector3(...p);
    const normal = posVec.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);

    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
    if (headingAngle !== 0) {
      const headingQuat = new THREE.Quaternion().setFromAxisAngle(normal, headingAngle);
      quaternion.premultiply(headingQuat);
    }
    return [posVec, quaternion];
  }, [theta, phi, radius, heightOffset, headingAngle]);

  return (
    <group position={pos} quaternion={quat}>
      {children}
    </group>
  );
}

/** 3D Tree with procedural foliage */
function StylizedTree({ scale = 1, foliageColor = '#2d6a4f' }: { scale?: number; foliageColor?: string }) {
  return (
    <group scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 1.8, 6]} />
        <meshStandardMaterial color="#6f4e37" roughness={0.9} />
      </mesh>
      {/* Foliage Layers */}
      <mesh position={[0, 2.1, 0]}>
        <coneGeometry args={[1.3, 1.6, 7]} />
        <meshStandardMaterial color={foliageColor} roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0, 3.0, 0]}>
        <coneGeometry args={[0.95, 1.4, 7]} />
        <meshStandardMaterial color={foliageColor} roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0, 3.8, 0]}>
        <coneGeometry args={[0.6, 1.1, 6]} />
        <meshStandardMaterial color={foliageColor} roughness={0.7} flatShading />
      </mesh>
    </group>
  );
}

/** Giant Spirit Tree at Whisper Forest with breathing light */
function SpiritTree() {
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (glowRef.current) {
      glowRef.current.intensity = 1.8 + Math.sin(clock.getElapsedTime() * 2) * 0.6;
    }
  });

  return (
    <group scale={1.6}>
      {/* Ancient Twisted Trunk */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.6, 1.1, 3.6, 8]} />
        <meshStandardMaterial color="#4a3728" roughness={0.9} />
      </mesh>
      {/* Massive Glowing Canopy */}
      <mesh position={[0, 4.2, 0]}>
        <dodecahedronGeometry args={[2.5, 1]} />
        <meshStandardMaterial color="#5eead4" emissive="#115e59" emissiveIntensity={0.6} roughness={0.5} flatShading />
      </mesh>
      <mesh position={[0.8, 4.8, 0.6]} scale={0.7}>
        <dodecahedronGeometry args={[1.8, 1]} />
        <meshStandardMaterial color="#99f6e4" emissive="#0f766e" emissiveIntensity={0.7} roughness={0.4} flatShading />
      </mesh>
      <mesh position={[-0.8, 4.5, -0.6]} scale={0.65}>
        <dodecahedronGeometry args={[1.8, 1]} />
        <meshStandardMaterial color="#2dd4bf" emissive="#134e4a" emissiveIntensity={0.6} roughness={0.4} flatShading />
      </mesh>

      {/* Spirit Point Light */}
      <pointLight ref={glowRef} position={[0, 4.5, 0]} color="#5eead4" distance={14} decay={2} intensity={2} />
    </group>
  );
}

/** Animated Windmill at Dawn Village */
function Windmill() {
  const bladesRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (bladesRef.current) {
      bladesRef.current.rotation.z += delta * 0.9;
    }
  });

  return (
    <group scale={1.2}>
      {/* Tower Body */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.8, 1.3, 3.6, 8]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </mesh>
      {/* Conical Roof */}
      <mesh position={[0, 4.2, 0]}>
        <coneGeometry args={[1.1, 1.4, 8]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.6} />
      </mesh>
      {/* Blades Hub */}
      <group position={[0, 3.2, 0.9]}>
        <mesh>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <group ref={bladesRef}>
          {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
            <group key={i} rotation={[0, 0, angle]}>
              <mesh position={[0, 1.2, 0]}>
                <boxGeometry args={[0.3, 2.2, 0.04]} />
                <meshStandardMaterial color="#fef08a" roughness={0.5} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}

/** Animated Lighthouse at North Star Peak with 360 sweeping light beam */
function Lighthouse() {
  const beamRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (beamRef.current) {
      beamRef.current.rotation.y += delta * 1.2;
    }
  });

  return (
    <group scale={1.4}>
      {/* Rocky Pedestal */}
      <mesh position={[0, 0.6, 0]}>
        <dodecahedronGeometry args={[1.5, 1]} />
        <meshStandardMaterial color="#475569" roughness={0.9} flatShading />
      </mesh>
      {/* Tower Body with Red/White Stripes */}
      <mesh position={[0, 2.4, 0]}>
        <cylinderGeometry args={[0.65, 0.95, 3.2, 8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.6} />
      </mesh>
      {/* Red Accent Band */}
      <mesh position={[0, 2.6, 0]}>
        <cylinderGeometry args={[0.74, 0.82, 0.8, 8]} />
        <meshStandardMaterial color="#dc2626" roughness={0.6} />
      </mesh>
      {/* Lantern Room */}
      <mesh position={[0, 4.4, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.8, 8]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* Dome Top */}
      <mesh position={[0, 5.0, 0]}>
        <sphereGeometry args={[0.65, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>

      {/* Rotating Light Beam */}
      <group ref={beamRef} position={[0, 4.4, 0]}>
        <pointLight color="#fef08a" intensity={3} distance={20} decay={2} />
        {/* Volumetric Light Cone */}
        <mesh position={[0, 0, 4]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[2.2, 8, 12, 1, true]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

/** Campfire with animated flickering light */
function Campfire() {
  const fireLightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (fireLightRef.current) {
      fireLightRef.current.intensity = 2.0 + Math.sin(clock.getElapsedTime() * 12) * 0.5 + Math.cos(clock.getElapsedTime() * 18) * 0.3;
    }
  });

  return (
    <group scale={0.9}>
      {/* Stone Ring */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const angle = (i / 7) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.7, 0.1, Math.sin(angle) * 0.7]}>
            <dodecahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial color="#64748b" roughness={0.9} />
          </mesh>
        );
      })}
      {/* Wood Logs */}
      <mesh rotation={[0.4, 0.4, 0.3]} position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.9, 5]} />
        <meshStandardMaterial color="#451a03" />
      </mesh>
      <mesh rotation={[-0.4, -0.6, 0.2]} position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.9, 5]} />
        <meshStandardMaterial color="#451a03" />
      </mesh>
      {/* Glowing Flames */}
      <mesh position={[0, 0.4, 0]}>
        <coneGeometry args={[0.35, 0.7, 5]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>
      <mesh position={[0, 0.35, 0]} scale={0.7}>
        <coneGeometry args={[0.3, 0.6, 5]} />
        <meshBasicMaterial color="#facc15" />
      </mesh>

      <pointLight ref={fireLightRef} position={[0, 0.6, 0]} color="#f97316" distance={8} decay={2} intensity={2.2} />
    </group>
  );
}

/** Geodesic Greenhouse Dome at Greenhouse Lab */
function Greenhouse() {
  return (
    <group scale={1.3}>
      {/* Concrete Ring Base */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[2.2, 2.3, 0.4, 12]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
      </mesh>
      {/* Translucent Glass Dome */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[2.1, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#86efac"
          transmission={0.85}
          opacity={0.7}
          transparent
          roughness={0.15}
          ior={1.3}
          thickness={0.5}
        />
      </mesh>
      {/* Glowing Sprouts inside */}
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#15803d" emissiveIntensity={0.8} />
      </mesh>
      <pointLight position={[0, 1.2, 0]} color="#86efac" intensity={1.5} distance={7} />
    </group>
  );
}

/** Paper boat on Reflection Lake */
function ReflectionLake() {
  const boatRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (boatRef.current) {
      boatRef.current.position.y = 0.08 + Math.sin(clock.getElapsedTime() * 1.5) * 0.03;
      boatRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 1.2) * 0.05;
    }
  });

  return (
    <group scale={1.5}>
      {/* Water Mirror Surface */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.4, 16]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.6} transparent opacity={0.85} />
      </mesh>
      {/* Stone Border */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
        const angle = (i / 10) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 2.45, 0.08, Math.sin(angle) * 2.45]}>
            <dodecahedronGeometry args={[0.26, 0]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.8} />
          </mesh>
        );
      })}
      {/* Floating Paper Lantern Boat */}
      <group ref={boatRef} position={[0.4, 0.08, 0.4]}>
        <mesh rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.25, 0.35, 4]} />
          <meshStandardMaterial color="#fef9c3" emissive="#fde047" emissiveIntensity={0.6} />
        </mesh>
        <pointLight position={[0, 0.2, 0]} color="#fef08a" distance={4} intensity={1.2} />
      </group>
    </group>
  );
}

/** Train Station with platform and miniature locomotive */
function MidnightTrainStation() {
  return (
    <group scale={1.3}>
      {/* Wooden Platform */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[4.2, 0.35, 1.8]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      {/* Station Lantern */}
      <mesh position={[-1.8, 1.0, 0.7]}>
        <cylinderGeometry args={[0.06, 0.06, 1.6, 6]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-1.8, 1.8, 0.7]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshBasicMaterial color="#fde047" />
      </mesh>
      <pointLight position={[-1.8, 1.8, 0.7]} color="#fde047" distance={6} intensity={1.5} />

      {/* Train Locomotive Engine */}
      <group position={[0.8, 0.75, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.8, 0.8, 0.9]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>
        {/* Boiler */}
        <mesh position={[-0.4, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35, 0.35, 1.1, 8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>
        {/* Chimney */}
        <mesh position={[-0.7, 0.9, 0]}>
          <cylinderGeometry args={[0.12, 0.16, 0.5, 6]} />
          <meshStandardMaterial color="#b91c1c" />
        </mesh>
        {/* Headlight */}
        <mesh position={[-1.0, 0.45, 0]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <pointLight position={[-1.2, 0.45, 0]} color="#fef08a" distance={5} intensity={2} />
      </group>
    </group>
  );
}

/** Master Planet Terrain Mesh with vertex coloration and biomes */
export function PlanetBiomes() {
  const planetMeshRef = useRef<THREE.Mesh>(null);

  // Generate terrain sphere geometry with bumpy low-poly vertex heights
  const terrainGeo = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(PLANET_RADIUS, 5);
    const posAttr = geo.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < posAttr.count; i++) {
      vertex.fromBufferAttribute(posAttr, i);
      const len = vertex.length();
      const norm = vertex.clone().normalize();

      // Gentle procedural hills
      const noise =
        Math.sin(norm.x * 6) * Math.cos(norm.y * 6) * Math.sin(norm.z * 6) * 0.45 +
        Math.sin(norm.x * 12 + norm.z * 10) * 0.18;

      vertex.setLength(len + noise);
      posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group>
      {/* The Main Spherical Planet */}
      <mesh ref={planetMeshRef} geometry={terrainGeo} receiveShadow castShadow>
        <meshStandardMaterial
          color="#3b7a57"
          roughness={0.85}
          metalness={0.1}
          flatShading
        />
      </mesh>

      {/* Atmospheric Soft Glow */}
      <mesh>
        <sphereGeometry args={[PLANET_RADIUS + 0.35, 32, 32]} />
        <meshBasicMaterial color="#6ee7b7" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>

      {/* 1. Dawn Village (Làng Ban Mai) */}
      <PlacedOnSphere theta={Math.PI / 2.8} phi={0}>
        <Windmill />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.8 + 0.12} phi={0.15}>
        <StylizedTree scale={1.1} foliageColor="#15803d" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.8 - 0.12} phi={-0.12}>
        <StylizedTree scale={0.9} foliageColor="#16a34a" />
      </PlacedOnSphere>

      {/* 2. Whisper Forest (Rừng Lắng Nghe) */}
      <PlacedOnSphere theta={Math.PI / 2.2} phi={Math.PI / 2.2}>
        <SpiritTree />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.2 + 0.15} phi={Math.PI / 2.2 + 0.15}>
        <Campfire />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.2 - 0.18} phi={Math.PI / 2.2 - 0.12}>
        <StylizedTree scale={1.4} foliageColor="#047857" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.2 + 0.2} phi={Math.PI / 2.2 - 0.18}>
        <StylizedTree scale={1.3} foliageColor="#065f46" />
      </PlacedOnSphere>

      {/* 3. North Star Peak (Đỉnh Hải Đăng) */}
      <PlacedOnSphere theta={Math.PI / 4} phi={Math.PI}>
        <Lighthouse />
      </PlacedOnSphere>

      {/* 4. Greenhouse Lab (Nhà Kính Ươm Mầm) */}
      <PlacedOnSphere theta={Math.PI / 1.7} phi={(3 * Math.PI) / 2}>
        <Greenhouse />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 1.7 + 0.15} phi={(3 * Math.PI) / 2 + 0.12}>
        <StylizedTree scale={1.0} foliageColor="#4ade80" />
      </PlacedOnSphere>

      {/* 5. Reflection Lake (Hồ Phản Chiếu) */}
      <PlacedOnSphere theta={Math.PI / 1.5} phi={Math.PI / 3}>
        <ReflectionLake />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 1.5 + 0.18} phi={Math.PI / 3 - 0.15}>
        <StylizedTree scale={1.1} foliageColor="#0284c7" />
      </PlacedOnSphere>

      {/* 6. Midnight Train Station (Ga Tàu 00:00) */}
      <PlacedOnSphere theta={Math.PI / 1.3} phi={Math.PI * 1.1}>
        <MidnightTrainStation />
      </PlacedOnSphere>

      {/* Scatter additional decorative trees across the planet */}
      {[
        { theta: 0.6, phi: 0.8, color: '#15803d', scale: 1.1 },
        { theta: 1.2, phi: 2.1, color: '#047857', scale: 1.3 },
        { theta: 2.0, phi: 0.5, color: '#eab308', scale: 1.0 },
        { theta: 2.3, phi: 2.7, color: '#ca8a04', scale: 1.2 },
        { theta: 0.9, phi: 4.2, color: '#16a34a', scale: 1.0 },
        { theta: 1.8, phi: 5.2, color: '#065f46', scale: 1.3 },
        { theta: 2.6, phi: 4.8, color: '#15803d', scale: 0.9 },
        { theta: 0.4, phi: 3.1, color: '#0284c7', scale: 1.1 },
      ].map((item, idx) => (
        <PlacedOnSphere key={`tree-${idx}`} theta={item.theta} phi={item.phi}>
          <StylizedTree scale={item.scale} foliageColor={item.color} />
        </PlacedOnSphere>
      ))}
    </group>
  );
}
