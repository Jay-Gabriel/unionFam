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
    description: 'Ngôi làng ấm cúng với cối xay gió, nhà mái ngói và hòm thư trung tâm. Nơi bắt đầu hành trình tự hiểu mình.',
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
    description: 'Cổ thụ ngàn năm phát sáng cùng đống lửa ấm áp. Nơi bạn có thể trải lòng không phán xét cùng AI.',
    color: '#a7f3d0',
    accentColor: '#059669',
    theta: Math.PI / 2.2,
    phi: Math.PI / 2.2,
    actionLabel: 'Ngồi Xuống Trò Chuyện',
    targetHref: '/app/conversations',
    aiPromptStarter: 'Chào Life Lab, mình đang ngồi bên đống lửa ở Rừng Lắng Nghe. Mình có một trăn trở trong lòng cần bạn lắng nghe và bóc tách cùng mình.',
  },
  {
    id: 'peak',
    name: 'Đỉnh Hải Đăng & Đài Thiên Văn',
    subtitle: 'Bản Đồ Cuộc Sống & Định Hướng',
    description: 'Đỉnh núi cao nhất hướng về chòm sao định mệnh. Nơi ngắm nhìn Life Design Map 4 trục cuộc đời.',
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
    description: 'Nơi ươm những thói quen nhỏ nhất. Mỗi hành động đời thực sẽ làm hoa nở rộ.',
    color: '#86efac',
    accentColor: '#22c55e',
    theta: Math.PI / 1.7,
    phi: (3 * Math.PI) / 2,
    actionLabel: 'Xem Thử Nghiệm',
    targetHref: '/app/experiments',
    aiPromptStarter: 'Chào Life Lab, mình đang ở Nhà Kính Ươm Mầm. Mình muốn thiết lập một thử nghiệm vi mô 7 ngày mới để tạo chuyển biến tích cực.',
  },
  {
    id: 'lake',
    name: 'Hồ Phản Chiếu',
    subtitle: 'Nhật Ký Suy Ngẫm & Bài Học',
    description: 'Mặt hồ tĩnh lặng lưu giữ những bài học sâu sắc và thuyền giấy nguyện ước thả trôi.',
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
    actionLabel: 'Bước Lên Chuyến Tàu',
    targetHref: '/app/game',
    aiPromptStarter: 'Chào Life Lab, mình vừa bước lên Ga Tàu Chân Trời. Mình muốn đối diện với những lựa chọn thật nhất trong lòng mình.',
  },
];

/** Surface placer helper component */
export function PlacedOnSphere({
  theta,
  phi,
  radius = PLANET_RADIUS,
  heightOffset = 0,
  children,
  headingAngle = 0,
  scale = 1,
}: {
  theta: number;
  phi: number;
  radius?: number;
  heightOffset?: number;
  children: React.ReactNode;
  headingAngle?: number;
  scale?: number | [number, number, number];
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
    <group position={pos} quaternion={quat} scale={scale}>
      {children}
    </group>
  );
}

// -------------------------------------------------------------
// STYLIZED COZY 3D ASSETS (Matching messenger.abeto.co)
// -------------------------------------------------------------

/** Cozy Storybook Village Cottage with Chimney Smoke and Flower Boxes */
function CozyCottage({
  roofColor = '#dc2626',
  wallColor = '#fefce8',
  scale = 1,
}: {
  roofColor?: string;
  wallColor?: string;
  scale?: number;
}) {
  const smokeRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (smokeRef.current) {
      smokeRef.current.position.y = 2.4 + Math.sin(clock.getElapsedTime() * 2) * 0.12;
      smokeRef.current.rotation.y = clock.getElapsedTime() * 0.4;
    }
  });

  return (
    <group scale={scale}>
      {/* Stone Foundation */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 0.25, 1.6]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>
      {/* Plaster Walls */}
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 1.15, 1.4]} />
        <meshStandardMaterial color={wallColor} roughness={0.7} />
      </mesh>
      {/* Wooden Corner Beams */}
      {[-0.85, 0.85].map((x, i) =>
        [-0.7, 0.7].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, 0.8, z]} castShadow>
            <boxGeometry args={[0.09, 1.2, 0.09]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>
        ))
      )}
      {/* Pitched Thatched/Tiled Roof */}
      <mesh position={[0, 1.75, 0]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[1.35, 0.85, 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.6} />
      </mesh>
      {/* Wooden Door */}
      <mesh position={[0, 0.55, 0.71]} castShadow>
        <boxGeometry args={[0.42, 0.75, 0.04]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      {/* Glowing Warm Windows */}
      <mesh position={[0.45, 0.85, 0.71]}>
        <boxGeometry args={[0.28, 0.32, 0.03]} />
        <meshStandardMaterial color="#fde047" emissive="#f59e0b" emissiveIntensity={0.85} />
      </mesh>
      <mesh position={[-0.45, 0.85, 0.71]}>
        <boxGeometry args={[0.28, 0.32, 0.03]} />
        <meshStandardMaterial color="#fde047" emissive="#f59e0b" emissiveIntensity={0.85} />
      </mesh>
      {/* Flower Box */}
      <mesh position={[0.45, 0.65, 0.74]}>
        <boxGeometry args={[0.34, 0.1, 0.12]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      {/* Chimney */}
      <mesh position={[0.45, 1.85, -0.2]} castShadow>
        <boxGeometry args={[0.28, 0.75, 0.28]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>
      {/* Gentle Smoke Puffs */}
      <group ref={smokeRef} position={[0.45, 2.3, -0.2]}>
        <mesh>
          <sphereGeometry args={[0.13, 8, 8]} />
          <meshStandardMaterial color="#f1f5f9" transparent opacity={0.45} />
        </mesh>
        <mesh position={[0.07, 0.18, 0.03]} scale={0.8}>
          <sphereGeometry args={[0.11, 8, 8]} />
          <meshStandardMaterial color="#f1f5f9" transparent opacity={0.3} />
        </mesh>
      </group>
      {/* Cozy Window Point Light */}
      <pointLight position={[0, 0.85, 0.9]} color="#fef08a" distance={4} decay={2} intensity={1.2} />
    </group>
  );
}

/** Village Windmill with rotating cloth sails */
function Windmill() {
  const bladesRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (bladesRef.current) {
      bladesRef.current.rotation.z += delta * 0.8;
    }
  });

  return (
    <group scale={0.75}>
      {/* Octagonal Tower Base */}
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.85, 1.35, 3.6, 8]} />
        <meshStandardMaterial color="#fefce8" roughness={0.7} />
      </mesh>
      {/* Timber bands */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[1.05, 1.15, 0.12, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.6, 0]}>
        <cylinderGeometry args={[0.88, 0.95, 0.12, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      {/* Conical Roof */}
      <mesh position={[0, 4.1, 0]} castShadow>
        <coneGeometry args={[1.15, 1.4, 8]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.6} />
      </mesh>
      {/* Blades Hub */}
      <group position={[0, 3.2, 0.95]}>
        <mesh>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <group ref={bladesRef}>
          {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
            <group key={i} rotation={[0, 0, angle]}>
              <mesh position={[0, 1.15, 0]} castShadow>
                <boxGeometry args={[0.28, 2.1, 0.03]} />
                <meshStandardMaterial color="#fef3c7" roughness={0.5} />
              </mesh>
              {/* Lattice crossbars */}
              {[-0.5, 0, 0.5].map((offset, j) => (
                <mesh key={j} position={[0, 1.15 + offset, 0.02]}>
                  <boxGeometry args={[0.36, 0.03, 0.02]} />
                  <meshStandardMaterial color="#78350f" />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}

/** Village Stone Well with bucket and tiled roof */
function VillageWell() {
  return (
    <group scale={0.85}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.65, 0.7, 0.8, 8]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>
      {/* Water inside */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.05, 8]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.1} />
      </mesh>
      {/* Posts */}
      {[-0.55, 0.55].map((x, i) => (
        <mesh key={i} position={[x, 1.1, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 1.4, 6]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
      ))}
      {/* Little Roof */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <coneGeometry args={[0.85, 0.6, 4]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Glowing Streetlamp on Curved Timber Post */
function Streetlamp() {
  return (
    <group scale={0.85}>
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 2.0, 6]} />
        <meshStandardMaterial color="#475569" roughness={0.7} />
      </mesh>
      {/* Lantern Housing */}
      <mesh position={[0, 2.1, 0]}>
        <dodecahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.4} />
      </mesh>
      <pointLight position={[0, 2.1, 0]} color="#fde047" distance={5} decay={2} intensity={1.5} />
    </group>
  );
}

/** Giant Sacred Spirit Tree with Bioluminescent Canopy and Hanging Lanterns */
function SpiritTree() {
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (glowRef.current) {
      glowRef.current.intensity = 2.0 + Math.sin(clock.getElapsedTime() * 2) * 0.6;
    }
  });

  return (
    <group scale={1.6}>
      {/* Ancient Twisted Trunk */}
      <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 1.1, 3.2, 8]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>
      {/* Massive Glowing Canopy (Emerald / Mint) */}
      <mesh position={[0, 3.8, 0]} castShadow>
        <dodecahedronGeometry args={[2.4, 1]} />
        <meshStandardMaterial color="#5eead4" emissive="#0f766e" emissiveIntensity={0.55} roughness={0.4} />
      </mesh>
      <mesh position={[0.8, 4.5, 0.6]} scale={0.75} castShadow>
        <dodecahedronGeometry args={[1.8, 1]} />
        <meshStandardMaterial color="#99f6e4" emissive="#115e59" emissiveIntensity={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-0.8, 4.2, -0.6]} scale={0.7} castShadow>
        <dodecahedronGeometry args={[1.8, 1]} />
        <meshStandardMaterial color="#2dd4bf" emissive="#134e4a" emissiveIntensity={0.6} roughness={0.4} />
      </mesh>

      {/* Hanging Glowing Spirit Lanterns */}
      {[
        { pos: [-1.1, 2.8, 0.7], color: '#fbcfe8', emit: '#f472b6' },
        { pos: [1.1, 2.9, 0.6], color: '#fef08a', emit: '#facc15' },
        { pos: [0, 3.0, -1.0], color: '#bae6fd', emit: '#38bdf8' },
        { pos: [0.7, 2.7, -0.7], color: '#ddd6fe', emit: '#a855f7' },
      ].map((item, i) => (
        <group key={i} position={item.pos as [number, number, number]}>
          <mesh>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshStandardMaterial color={item.color} emissive={item.emit} emissiveIntensity={1.4} />
          </mesh>
          <pointLight color={item.emit} distance={3.5} intensity={1.1} />
        </group>
      ))}

      {/* Main Spirit Core Light */}
      <pointLight ref={glowRef} position={[0, 4.0, 0]} color="#5eead4" distance={15} decay={2} intensity={2.2} />
    </group>
  );
}

/** Campfire with Glowing Logs & Flickering Fire Particles */
function Campfire() {
  const fireLightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (fireLightRef.current) {
      fireLightRef.current.intensity = 2.2 + Math.sin(clock.getElapsedTime() * 12) * 0.5 + Math.cos(clock.getElapsedTime() * 18) * 0.3;
    }
  });

  return (
    <group scale={0.9}>
      {/* Stone Circle */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.7, 0.08, Math.sin(angle) * 0.7]} castShadow>
            <dodecahedronGeometry args={[0.16, 0]} />
            <meshStandardMaterial color="#64748b" roughness={0.9} />
          </mesh>
        );
      })}
      {/* Wooden Logs */}
      <mesh rotation={[0.4, 0.4, 0.3]} position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.85, 5]} />
        <meshStandardMaterial color="#451a03" />
      </mesh>
      <mesh rotation={[-0.4, -0.6, 0.2]} position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.85, 5]} />
        <meshStandardMaterial color="#451a03" />
      </mesh>
      {/* Glowing Flames */}
      <mesh position={[0, 0.4, 0]}>
        <coneGeometry args={[0.34, 0.7, 5]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>
      <mesh position={[0, 0.35, 0]} scale={0.7}>
        <coneGeometry args={[0.28, 0.55, 5]} />
        <meshBasicMaterial color="#facc15" />
      </mesh>
      <pointLight ref={fireLightRef} position={[0, 0.6, 0]} color="#f97316" distance={8} decay={2} intensity={2.2} />
    </group>
  );
}

/** Mountain Lighthouse with sweeping beam */
function MountainLighthouse() {
  const beamRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (beamRef.current) {
      beamRef.current.rotation.y += delta * 1.1;
    }
  });

  return (
    <group scale={1.35}>
      {/* Mountain Rock Peak Base */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[2.0, 1]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>
      {/* Tower Body */}
      <mesh position={[0, 2.9, 0]} castShadow>
        <cylinderGeometry args={[0.65, 0.95, 3.4, 8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      {/* Coral Red Accent Band */}
      <mesh position={[0, 3.1, 0]}>
        <cylinderGeometry args={[0.72, 0.82, 0.9, 8]} />
        <meshStandardMaterial color="#f43f5e" roughness={0.5} />
      </mesh>
      {/* Lantern Gallery */}
      <mesh position={[0, 4.8, 0]}>
        <cylinderGeometry args={[0.75, 0.75, 0.12, 8]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 5.2, 0]}>
        <cylinderGeometry args={[0.58, 0.58, 0.7, 8]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* Dome Top */}
      <mesh position={[0, 5.7, 0]}>
        <sphereGeometry args={[0.62, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#f43f5e" />
      </mesh>

      {/* Rotating Light Beam */}
      <group ref={beamRef} position={[0, 5.2, 0]}>
        <pointLight color="#fef08a" intensity={3.0} distance={22} decay={2} />
        <mesh position={[0, 0, 4.0]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[2.2, 8, 12, 1, true]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

/** Geodesic Greenhouse Dome */
function GreenhouseDome() {
  return (
    <group scale={1.3}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[2.2, 2.3, 0.4, 12]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[2.1, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#86efac"
          transmission={0.85}
          opacity={0.7}
          transparent
          roughness={0.2}
          ior={1.3}
          thickness={0.4}
        />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#15803d" emissiveIntensity={0.8} />
      </mesh>
      <pointLight position={[0, 1.2, 0]} color="#86efac" intensity={1.6} distance={7} />
    </group>
  );
}

/** Water Pond with Floating Paper Boat */
function WaterPond() {
  const boatRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (boatRef.current) {
      boatRef.current.position.y = 0.08 + Math.sin(clock.getElapsedTime() * 1.5) * 0.025;
      boatRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 1.2) * 0.05;
    }
  });

  return (
    <group scale={1.5}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.3, 16]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.15} metalness={0.4} transparent opacity={0.88} />
      </mesh>
      {/* Stone Border */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 2.35, 0.08, Math.sin(angle) * 2.35]}>
            <dodecahedronGeometry args={[0.24, 0]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.8} />
          </mesh>
        );
      })}
      {/* Paper Boat */}
      <group ref={boatRef} position={[0.4, 0.08, 0.4]}>
        <mesh rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.24, 0.35, 4]} />
          <meshStandardMaterial color="#fef9c3" emissive="#fde047" emissiveIntensity={0.6} />
        </mesh>
        <pointLight position={[0, 0.2, 0]} color="#fef08a" distance={4.5} intensity={1.2} />
      </group>
    </group>
  );
}

/** Train Station with platform and locomotive */
function TrainStation() {
  return (
    <group scale={1.2}>
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 0.3, 1.8]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      <mesh position={[-1.8, 1.0, 0.7]}>
        <cylinderGeometry args={[0.05, 0.05, 1.6, 6]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-1.8, 1.8, 0.7]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshBasicMaterial color="#fde047" />
      </mesh>
      <pointLight position={[-1.8, 1.8, 0.7]} color="#fde047" distance={6} intensity={1.6} />

      {/* Train Locomotive */}
      <group position={[0.8, 0.75, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.8, 0.8, 0.9]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>
        <mesh position={[-0.4, 0.45, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 1.1, 8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>
        <mesh position={[-0.7, 0.9, 0]}>
          <cylinderGeometry args={[0.12, 0.16, 0.5, 6]} />
          <meshStandardMaterial color="#b91c1c" />
        </mesh>
        <mesh position={[-1.0, 0.45, 0]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <pointLight position={[-1.2, 0.45, 0]} color="#fef08a" distance={5.5} intensity={2.0} />
      </group>
    </group>
  );
}

/** Stylized Poly Pine Tree */
function PineTree({ scale = 1, color = '#15803d' }: { scale?: number; color?: string }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.24, 1.3, 6]} />
        <meshStandardMaterial color="#5c3a21" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <coneGeometry args={[1.1, 1.4, 7]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.35, 0]} castShadow>
        <coneGeometry args={[0.85, 1.2, 7]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 3.0, 0]} castShadow>
        <coneGeometry args={[0.5, 0.9, 6]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
    </group>
  );
}

/** Stylized Fluffy Round Clustered Tree */
function RoundTree({ scale = 1, color = '#4ade80' }: { scale?: number; color?: string }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.3, 1.6, 6]} />
        <meshStandardMaterial color="#6f4e37" roughness={0.9} />
      </mesh>
      {/* Multi-cluster soft foliage */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <dodecahedronGeometry args={[1.2, 1]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0.35, 2.4, 0.2]} scale={0.7} castShadow>
        <dodecahedronGeometry args={[1.0, 1]} />
        <meshStandardMaterial color={color} roughness={0.65} />
      </mesh>
      <mesh position={[-0.3, 2.3, -0.2]} scale={0.65} castShadow>
        <dodecahedronGeometry args={[0.9, 1]} />
        <meshStandardMaterial color={color} roughness={0.65} />
      </mesh>
    </group>
  );
}

/** Flower Clump */
function FlowerPatch({ color = '#f43f5e' }: { color?: string }) {
  return (
    <group scale={0.55}>
      {[
        [-0.3, 0.1, -0.2],
        [0.3, 0.1, -0.1],
        [0.1, 0.1, 0.3],
        [-0.2, 0.1, 0.2],
        [0.0, 0.1, 0.0],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <sphereGeometry args={[0.1, 6, 6]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/** Winding Cobblestone Road Segments */
function CobblestonePathRing() {
  const stones = useMemo(() => {
    const list: Array<{ theta: number; phi: number; scale: number }> = [];
    // Path linking Village to Forest and Lake
    for (let i = 0; i < 45; i++) {
      const t = i / 45;
      const theta = (Math.PI / 2.8) * (1 - t) + (Math.PI / 2.2) * t + Math.sin(t * Math.PI * 2) * 0.05;
      const phi = 0 * (1 - t) + (Math.PI / 2.2) * t + Math.cos(t * Math.PI * 2) * 0.04;
      list.push({ theta, phi, scale: 0.8 + (i % 3) * 0.15 });
    }
    return list;
  }, []);

  return (
    <group>
      {stones.map((s, idx) => (
        <PlacedOnSphere key={`path-${idx}`} theta={s.theta} phi={s.phi} heightOffset={0.02}>
          <mesh rotation={[-Math.PI / 2, 0, (idx % 4) * 0.4]}>
            <boxGeometry args={[0.42 * s.scale, 0.35 * s.scale, 0.05]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.9} />
          </mesh>
        </PlacedOnSphere>
      ))}
    </group>
  );
}

// -------------------------------------------------------------
// PLANET MASTER COMPONENT WITH 6 BIOMES
// -------------------------------------------------------------

export function PlanetBiomes() {
  const terrainGeo = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(PLANET_RADIUS, 6);
    const posAttr = geo.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < posAttr.count; i++) {
      vertex.fromBufferAttribute(posAttr, i);
      const len = vertex.length();
      const norm = vertex.clone().normalize();

      // Procedural soft hills and valleys
      const noise =
        Math.sin(norm.x * 5) * Math.cos(norm.y * 5) * Math.sin(norm.z * 5) * 0.5 +
        Math.sin(norm.x * 11 + norm.z * 9) * 0.18;

      vertex.setLength(len + noise);
      posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group>
      {/* 1. Main Spherical Planet Mesh */}
      <mesh geometry={terrainGeo} receiveShadow>
        <meshStandardMaterial
          color="#529465"
          roughness={0.85}
          metalness={0.04}
        />
      </mesh>

      {/* 2. Soft Atmospheric Rim Glow */}
      <mesh>
        <sphereGeometry args={[PLANET_RADIUS + 0.35, 32, 32]} />
        <meshBasicMaterial color="#a7f3d0" transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>

      {/* 3. Cobblestone Pathways */}
      <CobblestonePathRing />

      {/* =======================================================
          BIOME 1: LÀNG BAN MAI (THE DAWN VILLAGE)
      ======================================================= */}
      <PlacedOnSphere theta={Math.PI / 2.8} phi={0}>
        <Windmill />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.8 - 0.14} phi={0.2}>
        <CozyCottage roofColor="#b91c1c" wallColor="#fefce8" scale={1.05} />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.8 + 0.16} phi={-0.16}>
        <CozyCottage roofColor="#0284c7" wallColor="#f0fdf4" scale={0.92} />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.8 + 0.07} phi={0.14}>
        <VillageWell />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.8 - 0.05} phi={-0.07}>
        <Streetlamp />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.8 + 0.2} phi={0.26}>
        <PineTree scale={1.15} color="#15803d" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.8 - 0.2} phi={-0.23}>
        <RoundTree scale={1.05} color="#f59e0b" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.8 + 0.04} phi={0.04}>
        <FlowerPatch color="#f43f5e" />
      </PlacedOnSphere>

      {/* =======================================================
          BIOME 2: RỪNG LẮNG NGHE (WHISPER FOREST)
      ======================================================= */}
      <PlacedOnSphere theta={Math.PI / 2.2} phi={Math.PI / 2.2}>
        <SpiritTree />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.2 + 0.15} phi={Math.PI / 2.2 + 0.15}>
        <Campfire />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.2 - 0.18} phi={Math.PI / 2.2 - 0.14}>
        <PineTree scale={1.4} color="#047857" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.2 + 0.22} phi={Math.PI / 2.2 - 0.2}>
        <PineTree scale={1.25} color="#065f46" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.2 - 0.23} phi={Math.PI / 2.2 + 0.2}>
        <RoundTree scale={1.2} color="#2dd4bf" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.2 + 0.09} phi={Math.PI / 2.2 - 0.1}>
        <Streetlamp />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.2 + 0.16} phi={Math.PI / 2.2 + 0.07}>
        <FlowerPatch color="#a855f7" />
      </PlacedOnSphere>

      {/* =======================================================
          BIOME 3: ĐỈNH HẢI ĐĂNG (NORTH STAR PEAK)
      ======================================================= */}
      <PlacedOnSphere theta={Math.PI / 4} phi={Math.PI}>
        <MountainLighthouse />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 4 + 0.18} phi={Math.PI + 0.18}>
        <PineTree scale={1.05} color="#0369a1" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 4 - 0.16} phi={Math.PI - 0.16}>
        <PineTree scale={0.85} color="#0284c7" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 4 + 0.1} phi={Math.PI - 0.12}>
        <Streetlamp />
      </PlacedOnSphere>

      {/* =======================================================
          BIOME 4: NHÀ KÍNH ƯƠM MẦM (GREENHOUSE LAB)
      ======================================================= */}
      <PlacedOnSphere theta={Math.PI / 1.7} phi={(3 * Math.PI) / 2}>
        <GreenhouseDome />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 1.7 + 0.16} phi={(3 * Math.PI) / 2 + 0.16}>
        <RoundTree scale={1.15} color="#4ade80" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 1.7 - 0.16} phi={(3 * Math.PI) / 2 - 0.14}>
        <PineTree scale={1.05} color="#16a34a" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 1.7 + 0.1} phi={(3 * Math.PI) / 2 - 0.1}>
        <Streetlamp />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 1.7 - 0.07} phi={(3 * Math.PI) / 2 + 0.1}>
        <FlowerPatch color="#fbbf24" />
      </PlacedOnSphere>

      {/* =======================================================
          BIOME 5: HỒ PHẢN CHIẾU (REFLECTION LAKE)
      ======================================================= */}
      <PlacedOnSphere theta={Math.PI / 1.5} phi={Math.PI / 3}>
        <WaterPond />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 1.5 + 0.2} phi={Math.PI / 3 - 0.18}>
        <RoundTree scale={1.2} color="#38bdf8" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 1.5 - 0.18} phi={Math.PI / 3 + 0.2}>
        <PineTree scale={1.1} color="#0284c7" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 1.5 + 0.13} phi={Math.PI / 3 + 0.16}>
        <FlowerPatch color="#38bdf8" />
      </PlacedOnSphere>

      {/* =======================================================
          BIOME 6: GA TÀU CHÂN TRỜI (MIDNIGHT STATION)
      ======================================================= */}
      <PlacedOnSphere theta={Math.PI / 1.3} phi={Math.PI * 1.1}>
        <TrainStation />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 1.3 + 0.16} phi={Math.PI * 1.1 - 0.18}>
        <RoundTree scale={1.15} color="#f472b6" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 1.3 - 0.16} phi={Math.PI * 1.1 + 0.16}>
        <PineTree scale={1.05} color="#db2777" />
      </PlacedOnSphere>

      {/* =======================================================
          SCATTERED NATURE & FORESTS
      ======================================================= */}
      {[
        { theta: 0.7, phi: 0.9, color: '#15803d', scale: 1.15, type: 'pine' },
        { theta: 1.1, phi: 1.8, color: '#f59e0b', scale: 1.2, type: 'round' },
        { theta: 1.9, phi: 0.6, color: '#ca8a04', scale: 1.05, type: 'round' },
        { theta: 2.2, phi: 2.5, color: '#047857', scale: 1.3, type: 'pine' },
        { theta: 0.8, phi: 3.9, color: '#16a34a', scale: 0.95, type: 'pine' },
        { theta: 1.7, phi: 5.0, color: '#065f46', scale: 1.25, type: 'pine' },
        { theta: 2.5, phi: 4.6, color: '#f59e0b', scale: 0.95, type: 'round' },
        { theta: 0.5, phi: 2.8, color: '#0284c7', scale: 1.1, type: 'pine' },
        { theta: 1.4, phi: 3.5, color: '#ec4899', scale: 1.05, type: 'round' },
        { theta: 2.1, phi: 1.2, color: '#15803d', scale: 1.15, type: 'pine' },
      ].map((item, idx) => (
        <PlacedOnSphere key={`scatter-${idx}`} theta={item.theta} phi={item.phi}>
          {item.type === 'pine' ? (
            <PineTree scale={item.scale} color={item.color} />
          ) : (
            <RoundTree scale={item.scale} color={item.color} />
          )}
        </PlacedOnSphere>
      ))}
    </group>
  );
}
