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
// DETAILED STYLIZED 3D ASSETS
// -------------------------------------------------------------

/** Cozy Village Cottage with Chimney, Glowing Windows and Flower Box */
function CozyCottage({ roofColor = '#c2410c', wallColor = '#fef3c7', scale = 1 }: { roofColor?: string; wallColor?: string; scale?: number }) {
  const smokeRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (smokeRef.current) {
      smokeRef.current.position.y = 2.4 + Math.sin(clock.getElapsedTime() * 2) * 0.15;
      smokeRef.current.rotation.y = clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <group scale={scale}>
      {/* Stone Foundation */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[1.9, 0.3, 1.6]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>
      {/* Plaster Walls */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[1.7, 1.2, 1.4]} />
        <meshStandardMaterial color={wallColor} roughness={0.7} />
      </mesh>
      {/* Wooden Corner Beams */}
      {[-0.85, 0.85].map((x, i) =>
        [-0.7, 0.7].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, 0.85, z]}>
            <boxGeometry args={[0.1, 1.25, 0.1]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
        ))
      )}
      {/* Pitched Gable Roof */}
      <mesh position={[0, 1.8, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[1.4, 0.9, 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.5} flatShading />
      </mesh>
      {/* Wooden Door */}
      <mesh position={[0, 0.6, 0.71]}>
        <boxGeometry args={[0.45, 0.8, 0.04]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      {/* Glowing Warm Windows */}
      <mesh position={[0.45, 0.9, 0.71]}>
        <boxGeometry args={[0.3, 0.35, 0.04]} />
        <meshStandardMaterial color="#fde047" emissive="#f59e0b" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-0.45, 0.9, 0.71]}>
        <boxGeometry args={[0.3, 0.35, 0.04]} />
        <meshStandardMaterial color="#fde047" emissive="#f59e0b" emissiveIntensity={0.8} />
      </mesh>
      {/* Chimney */}
      <mesh position={[0.45, 1.9, -0.2]}>
        <boxGeometry args={[0.3, 0.8, 0.3]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      {/* Puffing Smoke */}
      <group ref={smokeRef} position={[0.45, 2.4, -0.2]}>
        <mesh>
          <sphereGeometry args={[0.14, 6, 6]} />
          <meshStandardMaterial color="#f1f5f9" transparent opacity={0.5} />
        </mesh>
        <mesh position={[0.08, 0.2, 0.04]} scale={0.8}>
          <sphereGeometry args={[0.12, 6, 6]} />
          <meshStandardMaterial color="#f1f5f9" transparent opacity={0.35} />
        </mesh>
      </group>
    </group>
  );
}

/** Village Wooden Windmill with rotating blades */
function Windmill() {
  const bladesRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (bladesRef.current) {
      bladesRef.current.rotation.z += delta * 0.9;
    }
  });

  return (
    <group scale={0.7}>
      {/* Octagonal Base */}
      <mesh position={[0, 1.8, 0]} castShadow>
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
    <group scale={0.9}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.7, 0.75, 0.8, 8]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <circleGeometry args={[0.55, 8]} />
        <meshStandardMaterial color="#0284c7" roughness={0.1} />
      </mesh>
      {/* Wooden Posts */}
      <mesh position={[-0.55, 1.2, 0]}>
        <boxGeometry args={[0.08, 1.6, 0.08]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      <mesh position={[0.55, 1.2, 0]}>
        <boxGeometry args={[0.08, 1.6, 0.08]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      {/* Well Canopy */}
      <mesh position={[0, 2.0, 0]}>
        <coneGeometry args={[0.85, 0.5, 4]} />
        <meshStandardMaterial color="#b91c1c" />
      </mesh>
    </group>
  );
}

/** Glowing Vintage Streetlamp */
function Streetlamp() {
  return (
    <group scale={0.8}>
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 2.2, 6]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 2.2, 0]}>
        <dodecahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.2} />
      </mesh>
      <pointLight position={[0, 2.2, 0]} color="#fde047" distance={6} decay={2} intensity={1.5} />
    </group>
  );
}

/** Giant Sacred Spirit Tree with Bioluminescent Canopy and Hanging Orbs */
function SpiritTree() {
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (glowRef.current) {
      glowRef.current.intensity = 2.2 + Math.sin(clock.getElapsedTime() * 2) * 0.8;
    }
  });

  return (
    <group scale={1.8}>
      {/* Ancient Twisted Trunk */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.65, 1.2, 3.6, 8]} />
        <meshStandardMaterial color="#38291e" roughness={0.9} />
      </mesh>
      {/* Massive Glowing Canopy (Emerald / Mint) */}
      <mesh position={[0, 4.2, 0]}>
        <dodecahedronGeometry args={[2.6, 1]} />
        <meshStandardMaterial color="#5eead4" emissive="#0f766e" emissiveIntensity={0.65} roughness={0.4} flatShading />
      </mesh>
      <mesh position={[0.9, 4.9, 0.7]} scale={0.75}>
        <dodecahedronGeometry args={[1.9, 1]} />
        <meshStandardMaterial color="#99f6e4" emissive="#115e59" emissiveIntensity={0.8} roughness={0.3} flatShading />
      </mesh>
      <mesh position={[-0.9, 4.6, -0.7]} scale={0.7}>
        <dodecahedronGeometry args={[1.9, 1]} />
        <meshStandardMaterial color="#2dd4bf" emissive="#134e4a" emissiveIntensity={0.7} roughness={0.4} flatShading />
      </mesh>
      {/* Hanging Glowing Spirit Lanterns */}
      {[-1.2, 1.2].map((x, i) => (
        <group key={i} position={[x, 3.2, 0.8]}>
          <mesh>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={1.5} />
          </mesh>
          <pointLight color="#fde047" distance={4} intensity={1.2} />
        </group>
      ))}

      {/* Main Spirit Core Light */}
      <pointLight ref={glowRef} position={[0, 4.5, 0]} color="#5eead4" distance={16} decay={2} intensity={2.4} />
    </group>
  );
}

/** Campfire with Glowing Log & Flickering Fire Particles */
function Campfire() {
  const fireLightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (fireLightRef.current) {
      fireLightRef.current.intensity = 2.4 + Math.sin(clock.getElapsedTime() * 12) * 0.6 + Math.cos(clock.getElapsedTime() * 18) * 0.4;
    }
  });

  return (
    <group scale={1.0}>
      {/* Stone Circle */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.75, 0.1, Math.sin(angle) * 0.75]}>
            <dodecahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial color="#64748b" roughness={0.9} />
          </mesh>
        );
      })}
      {/* Wooden Logs */}
      <mesh rotation={[0.4, 0.4, 0.3]} position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.95, 5]} />
        <meshStandardMaterial color="#451a03" />
      </mesh>
      <mesh rotation={[-0.4, -0.6, 0.2]} position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.95, 5]} />
        <meshStandardMaterial color="#451a03" />
      </mesh>
      {/* Glowing Flames */}
      <mesh position={[0, 0.45, 0]}>
        <coneGeometry args={[0.38, 0.8, 5]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>
      <mesh position={[0, 0.4, 0]} scale={0.7}>
        <coneGeometry args={[0.32, 0.65, 5]} />
        <meshBasicMaterial color="#facc15" />
      </mesh>

      <pointLight ref={fireLightRef} position={[0, 0.7, 0]} color="#f97316" distance={9} decay={2} intensity={2.5} />
    </group>
  );
}

/** Towering Lighthouse with 360 sweeping volumetric light beam and mountain cliffs */
function MountainLighthouse() {
  const beamRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (beamRef.current) {
      beamRef.current.rotation.y += delta * 1.2;
    }
  });

  return (
    <group scale={1.5}>
      {/* Mountain Rock Peak Base */}
      <mesh position={[0, 0.8, 0]}>
        <dodecahedronGeometry args={[2.2, 1]} />
        <meshStandardMaterial color="#475569" roughness={0.9} flatShading />
      </mesh>
      {/* Tower Body */}
      <mesh position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.7, 1.05, 3.8, 8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      {/* Red Accent Band */}
      <mesh position={[0, 3.4, 0]}>
        <cylinderGeometry args={[0.78, 0.88, 1.0, 8]} />
        <meshStandardMaterial color="#dc2626" roughness={0.5} />
      </mesh>
      {/* Lantern Gallery */}
      <mesh position={[0, 5.3, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.15, 8]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 5.7, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.8, 8]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* Dome Top */}
      <mesh position={[0, 6.3, 0]}>
        <sphereGeometry args={[0.68, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>

      {/* Rotating Light Beam */}
      <group ref={beamRef} position={[0, 5.7, 0]}>
        <pointLight color="#fef08a" intensity={3.5} distance={25} decay={2} />
        {/* Volumetric Light Cone */}
        <mesh position={[0, 0, 4.5]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[2.6, 9, 12, 1, true]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

/** Geodesic Greenhouse Dome */
function GreenhouseDome() {
  return (
    <group scale={1.4}>
      {/* Base Foundation */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[2.3, 2.4, 0.45, 12]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
      </mesh>
      {/* Translucent Glass Dome */}
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[2.2, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#86efac"
          transmission={0.85}
          opacity={0.75}
          transparent
          roughness={0.15}
          ior={1.3}
          thickness={0.5}
        />
      </mesh>
      {/* Inner Glowing Sprout */}
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.55, 8, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#15803d" emissiveIntensity={0.9} />
      </mesh>
      <pointLight position={[0, 1.4, 0]} color="#86efac" intensity={1.8} distance={8} />
    </group>
  );
}

/** Water Pond with Floating Paper Boat */
function WaterPond() {
  const boatRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (boatRef.current) {
      boatRef.current.position.y = 0.09 + Math.sin(clock.getElapsedTime() * 1.5) * 0.03;
      boatRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 1.2) * 0.06;
    }
  });

  return (
    <group scale={1.6}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.5, 16]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.5} transparent opacity={0.88} />
      </mesh>
      {/* Stone Border */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 2.55, 0.09, Math.sin(angle) * 2.55]}>
            <dodecahedronGeometry args={[0.28, 0]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.8} />
          </mesh>
        );
      })}
      {/* Paper Boat */}
      <group ref={boatRef} position={[0.45, 0.09, 0.45]}>
        <mesh rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.26, 0.38, 4]} />
          <meshStandardMaterial color="#fef9c3" emissive="#fde047" emissiveIntensity={0.65} />
        </mesh>
        <pointLight position={[0, 0.22, 0]} color="#fef08a" distance={5} intensity={1.4} />
      </group>
    </group>
  );
}

/** Train Station with platform and locomotive */
function TrainStation() {
  return (
    <group scale={1.3}>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[4.4, 0.35, 1.9]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      <mesh position={[-1.9, 1.1, 0.75]}>
        <cylinderGeometry args={[0.06, 0.06, 1.7, 6]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-1.9, 1.9, 0.75]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color="#fde047" />
      </mesh>
      <pointLight position={[-1.9, 1.9, 0.75]} color="#fde047" distance={7} intensity={1.8} />

      {/* Train Locomotive */}
      <group position={[0.9, 0.8, 0]}>
        <mesh>
          <boxGeometry args={[1.9, 0.85, 0.95]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>
        <mesh position={[-0.45, 0.48, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.38, 0.38, 1.15, 8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>
        <mesh position={[-0.75, 0.95, 0]}>
          <cylinderGeometry args={[0.13, 0.17, 0.55, 6]} />
          <meshStandardMaterial color="#b91c1c" />
        </mesh>
        <mesh position={[-1.05, 0.48, 0]}>
          <sphereGeometry args={[0.16, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <pointLight position={[-1.25, 0.48, 0]} color="#fef08a" distance={6} intensity={2.2} />
      </group>
    </group>
  );
}

/** Stylized Poly Pine Tree */
function PineTree({ scale = 1, color = '#15803d' }: { scale?: number; color?: string }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.16, 0.26, 1.4, 6]} />
        <meshStandardMaterial color="#5c3a21" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.7, 0]}>
        <coneGeometry args={[1.2, 1.5, 7]} />
        <meshStandardMaterial color={color} roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <coneGeometry args={[0.9, 1.3, 7]} />
        <meshStandardMaterial color={color} roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0, 3.2, 0]}>
        <coneGeometry args={[0.55, 1.0, 6]} />
        <meshStandardMaterial color={color} roughness={0.7} flatShading />
      </mesh>
    </group>
  );
}

/** Stylized Deciduous Autumn/Spring Tree (Round Blobs) */
function RoundTree({ scale = 1, color = '#f59e0b' }: { scale?: number; color?: string }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.2, 0.32, 1.8, 6]} />
        <meshStandardMaterial color="#6f4e37" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.2, 0]}>
        <dodecahedronGeometry args={[1.3, 1]} />
        <meshStandardMaterial color={color} roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0.4, 2.6, 0.2]} scale={0.7}>
        <dodecahedronGeometry args={[1.1, 1]} />
        <meshStandardMaterial color={color} roughness={0.6} flatShading />
      </mesh>
    </group>
  );
}

/** Flower Clump */
function FlowerPatch({ color = '#f43f5e' }: { color?: string }) {
  return (
    <group scale={0.6}>
      {[
        [-0.3, 0.1, -0.2],
        [0.2, 0.12, 0.3],
        [-0.1, 0.15, 0.2],
        [0.3, 0.1, -0.2],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <dodecahedronGeometry args={[0.16, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// -------------------------------------------------------------
// MASTER BIOMES ASSEMBLY
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
        Math.sin(norm.x * 5) * Math.cos(norm.y * 5) * Math.sin(norm.z * 5) * 0.55 +
        Math.sin(norm.x * 11 + norm.z * 9) * 0.2;

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

      {/* =======================================================
          BIOME 1: LÀNG BAN MAI (THE DAWN VILLAGE)
      ======================================================= */}
      <PlacedOnSphere theta={Math.PI / 2.8} phi={0}>
        <Windmill />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.8 - 0.15} phi={0.22}>
        <CozyCottage roofColor="#b91c1c" wallColor="#fef3c7" scale={1.1} />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.8 + 0.18} phi={-0.18}>
        <CozyCottage roofColor="#0369a1" wallColor="#f0fdf4" scale={0.95} />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.8 + 0.08} phi={0.15}>
        <VillageWell />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.8 - 0.06} phi={-0.08}>
        <Streetlamp />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.8 + 0.22} phi={0.28}>
        <PineTree scale={1.2} color="#15803d" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.8 - 0.22} phi={-0.25}>
        <RoundTree scale={1.1} color="#f59e0b" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.8 + 0.05} phi={0.05}>
        <FlowerPatch color="#f43f5e" />
      </PlacedOnSphere>

      {/* =======================================================
          BIOME 2: RỪNG LẮNG NGHE (WHISPER FOREST)
      ======================================================= */}
      <PlacedOnSphere theta={Math.PI / 2.2} phi={Math.PI / 2.2}>
        <SpiritTree />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.2 + 0.16} phi={Math.PI / 2.2 + 0.16}>
        <Campfire />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.2 - 0.2} phi={Math.PI / 2.2 - 0.15}>
        <PineTree scale={1.5} color="#047857" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.2 + 0.24} phi={Math.PI / 2.2 - 0.22}>
        <PineTree scale={1.35} color="#065f46" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.2 - 0.25} phi={Math.PI / 2.2 + 0.22}>
        <RoundTree scale={1.3} color="#2dd4bf" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.2 + 0.1} phi={Math.PI / 2.2 - 0.12}>
        <Streetlamp />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 2.2 + 0.18} phi={Math.PI / 2.2 + 0.08}>
        <FlowerPatch color="#a855f7" />
      </PlacedOnSphere>

      {/* =======================================================
          BIOME 3: ĐỈNH HẢI ĐĂNG (NORTH STAR PEAK)
      ======================================================= */}
      <PlacedOnSphere theta={Math.PI / 4} phi={Math.PI}>
        <MountainLighthouse />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 4 + 0.2} phi={Math.PI + 0.2}>
        <PineTree scale={1.1} color="#0369a1" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 4 - 0.18} phi={Math.PI - 0.18}>
        <PineTree scale={0.9} color="#0284c7" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 4 + 0.12} phi={Math.PI - 0.14}>
        <Streetlamp />
      </PlacedOnSphere>

      {/* =======================================================
          BIOME 4: NHÀ KÍNH ƯƠM MẦM (GREENHOUSE LAB)
      ======================================================= */}
      <PlacedOnSphere theta={Math.PI / 1.7} phi={(3 * Math.PI) / 2}>
        <GreenhouseDome />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 1.7 + 0.18} phi={(3 * Math.PI) / 2 + 0.18}>
        <RoundTree scale={1.2} color="#4ade80" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 1.7 - 0.18} phi={(3 * Math.PI) / 2 - 0.16}>
        <PineTree scale={1.1} color="#16a34a" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 1.7 + 0.12} phi={(3 * Math.PI) / 2 - 0.12}>
        <Streetlamp />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 1.7 - 0.08} phi={(3 * Math.PI) / 2 + 0.12}>
        <FlowerPatch color="#fbbf24" />
      </PlacedOnSphere>

      {/* =======================================================
          BIOME 5: HỒ PHẢN CHIẾU (REFLECTION LAKE)
      ======================================================= */}
      <PlacedOnSphere theta={Math.PI / 1.5} phi={Math.PI / 3}>
        <WaterPond />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 1.5 + 0.22} phi={Math.PI / 3 - 0.2}>
        <RoundTree scale={1.25} color="#38bdf8" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 1.5 - 0.2} phi={Math.PI / 3 + 0.22}>
        <PineTree scale={1.15} color="#0284c7" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 1.5 + 0.15} phi={Math.PI / 3 + 0.18}>
        <FlowerPatch color="#38bdf8" />
      </PlacedOnSphere>

      {/* =======================================================
          BIOME 6: GA TÀU CHÂN TRỜI (MIDNIGHT STATION)
      ======================================================= */}
      <PlacedOnSphere theta={Math.PI / 1.3} phi={Math.PI * 1.1}>
        <TrainStation />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 1.3 + 0.18} phi={Math.PI * 1.1 - 0.2}>
        <RoundTree scale={1.2} color="#f472b6" />
      </PlacedOnSphere>
      <PlacedOnSphere theta={Math.PI / 1.3 - 0.18} phi={Math.PI * 1.1 + 0.18}>
        <PineTree scale={1.1} color="#db2777" />
      </PlacedOnSphere>

      {/* =======================================================
          SCATTERED SCENERY & DENSE FORESTS
      ======================================================= */}
      {[
        { theta: 0.7, phi: 0.9, color: '#15803d', scale: 1.2, type: 'pine' },
        { theta: 1.1, phi: 1.8, color: '#f59e0b', scale: 1.3, type: 'round' },
        { theta: 1.9, phi: 0.6, color: '#ca8a04', scale: 1.1, type: 'round' },
        { theta: 2.2, phi: 2.5, color: '#047857', scale: 1.4, type: 'pine' },
        { theta: 0.8, phi: 3.9, color: '#16a34a', scale: 1.0, type: 'pine' },
        { theta: 1.7, phi: 5.0, color: '#065f46', scale: 1.35, type: 'pine' },
        { theta: 2.5, phi: 4.6, color: '#f59e0b', scale: 1.0, type: 'round' },
        { theta: 0.5, phi: 2.8, color: '#0284c7', scale: 1.15, type: 'pine' },
        { theta: 1.4, phi: 3.5, color: '#ec4899', scale: 1.1, type: 'round' },
        { theta: 2.1, phi: 1.2, color: '#15803d', scale: 1.2, type: 'pine' },
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
