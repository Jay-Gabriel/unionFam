'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { PLANET_RADIUS, sphericalToCartesian } from './spherical-math';
import type { LostLetter } from './world-types';

export const INITIAL_LETTERS: LostLetter[] = [
  {
    id: 'letter-1',
    title: 'Bức thư bị lãng quên dưới gốc cây',
    sender: 'Một người 28 tuổi',
    zoneId: 'forest',
    preview: '“Tôi đã làm việc chăm chỉ suốt 5 năm, nhưng chưa từng thấy bình yên…”',
    content:
      'Gửi chính tôi ở tương lai. Tôi thức dậy mỗi ngày lúc 7h sáng, chen chúc trên những con đường đông nghẹt, ngồi trước màn hình máy tính đến khi mắt mỏi nhừ. Mọi người bảo tôi có công việc ổn định, nhưng tại sao tôi lại thấy mình như đang chìm dần trong sự vô nghĩa?',
    reflectionQuestion: 'Bạn có đang đánh đổi bình yên nội tại để đổi lấy sự công nhận của người ngoài?',
    theta: Math.PI / 2.2 + 0.1,
    phi: Math.PI / 2.2 - 0.08,
  },
  {
    id: 'letter-2',
    title: 'Mảnh giấy cuộn tròn trên ngọn hải đăng',
    sender: 'Kẻ đi tìm hướng',
    zoneId: 'peak',
    preview: '“Tôi sợ đưa ra quyết định sai lầm nên đã không dám bắt đầu…”',
    content:
      'Tôi luôn chờ đợi một thời điểm hoàn hảo để bắt đầu làm điều mình yêu thích. Nhưng càng chờ, tôi càng thấy bạn bè xung quanh tiến xa, còn bản thân vẫn đứng nguyên ở vạch xuất phát. Nỗi sợ thất bại đã giam cầm tôi quá lâu.',
    reflectionQuestion: 'Đâu là bước đi nhỏ nhất (smallest step) bạn có thể làm ngay hôm nay mà không sợ sai?',
    theta: Math.PI / 4 + 0.1,
    phi: Math.PI + 0.12,
  },
  {
    id: 'letter-3',
    title: 'Lá thư cài bên cối xay gió',
    sender: 'Người vừa bước vào đời',
    zoneId: 'village',
    preview: '“Làm người lớn hóa ra cô đơn hơn tôi từng nghĩ…”',
    content:
      'Ngày bé tôi chỉ mong mau lớn để được tự do làm mọi điều mình thích. Đến khi thật sự tự do, tôi mới nhận ra tự do luôn đi kèm với trách nhiệm và những buổi tối ăn cơm một mình. Tôi thèm một cái ôm thật chặt không phán xét.',
    reflectionQuestion: 'Hôm nay bạn đã tự ôm lấy chính mình sau những nỗ lực thầm lặng chưa?',
    theta: Math.PI / 2.8 - 0.08,
    phi: 0.18,
  },
  {
    id: 'letter-4',
    title: 'Chiếc thuyền giấy trôi dạt bờ hồ',
    sender: 'Tâm hồn cần chữa lành',
    zoneId: 'lake',
    preview: '“Tôi đã tha thứ cho người khác, nhưng chưa từng tha thứ cho mình…”',
    content:
      'Tôi luôn khắt khe với từng sai lầm nhỏ của bản thân. Mỗi lần thất bại, giọng nói bên trong lại trách móc tôi là kẻ vô dụng. Nhưng hôm nay, khi nhìn mặt hồ tĩnh lặng này, tôi muốn nói với mình rằng: Tôi đã cố gắng hết sức rồi.',
    reflectionQuestion: 'Có điều gì trong quá khứ mà bạn đã sẵn sàng buông bỏ để bước tiếp nhẹ nhàng hơn?',
    theta: Math.PI / 1.5 - 0.1,
    phi: Math.PI / 3 + 0.14,
  },
];

function FloatingLetterItem({
  letter,
  isCollected,
  onCollect,
}: {
  letter: LostLetter;
  isCollected: boolean;
  onCollect: () => void;
}) {
  const meshRef = useRef<THREE.Group>(null);

  const [pos, quat] = useMemo(() => {
    const raw = sphericalToCartesian(PLANET_RADIUS + 0.65, letter.theta, letter.phi);
    const p = new THREE.Vector3(...raw);
    const normal = p.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(up, normal);
    return [p, q];
  }, [letter.theta, letter.phi]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(clock.getElapsedTime() * 3 + letter.theta) * 0.12;
      meshRef.current.rotation.y = clock.getElapsedTime() * 1.5;
    }
  });

  if (isCollected) return null;

  return (
    <group position={pos} quaternion={quat}>
      <group ref={meshRef}>
        {/* Envelope 3D Body */}
        <mesh>
          <boxGeometry args={[0.35, 0.24, 0.05]} />
          <meshStandardMaterial color="#fef08a" emissive="#eab308" emissiveIntensity={0.6} roughness={0.4} />
        </mesh>
        {/* Envelope Flap */}
        <mesh position={[0, 0.06, 0.03]} rotation={[-0.4, 0, 0]}>
          <coneGeometry args={[0.18, 0.12, 3]} />
          <meshStandardMaterial color="#fde047" emissive="#ca8a04" emissiveIntensity={0.5} />
        </mesh>

        {/* Pulsing Glow Light */}
        <pointLight color="#fde047" distance={4} decay={2} intensity={1.5} />

        {/* Interactive Indicator */}
        <Html position={[0, 0.5, 0]} center distanceFactor={12}>
          <button
            type="button"
            onClick={onCollect}
            className="flex items-center gap-1 rounded-full bg-amber-400/90 px-2.5 py-1 text-[10px] font-bold text-slate-900 shadow-lg backdrop-blur hover:bg-amber-300 transition-transform active:scale-95 animate-bounce"
          >
            ✉️ Mở thư
          </button>
        </Html>
      </group>
    </group>
  );
}

export function InteractiveLetters({
  collectedIds,
  onOpenLetter,
}: {
  collectedIds: string[];
  onOpenLetter: (letter: LostLetter) => void;
}) {
  return (
    <group>
      {INITIAL_LETTERS.map((letter) => (
        <FloatingLetterItem
          key={letter.id}
          letter={letter}
          isCollected={collectedIds.includes(letter.id)}
          onCollect={() => onOpenLetter(letter)}
        />
      ))}
    </group>
  );
}
