import type { LucideIcon } from 'lucide-react';

export type AvatarStyle = 'human' | 'fox';

export type PlanetZoneId =
  | 'city'         // Thành Phố Mây (Hub dữ liệu & hành trình hôm nay)
  | 'village'      // Làng Ban Mai (Onboarding & Question Graph)
  | 'forest'       // Rừng Lắng Nghe (AI Chat Sanctuary)
  | 'peak'         // Đỉnh Hải Đăng (Life Design Map)
  | 'greenhouse'   // Nhà Kính Ươm Mầm (Micro-Experiments)
  | 'lake'         // Hồ Phản Chiếu (Reflections & Learnings)
  | 'station'      // Ga Tàu 00:00 (Mini-games & Căn Cước Lựa Chọn)
  | 'vault';       // Hang Động Nguồn Lực (Resources & Financial)

export interface PlanetZone {
  id: PlanetZoneId;
  name: string;
  subtitle: string;
  description: string;
  color: string;
  accentColor: string;
  theta: number; // Polar angle (latitude)
  phi: number;   // Azimuthal angle (longitude)
  actionLabel: string;
  targetHref: string;
  aiPromptStarter: string;
}

export interface LostLetter {
  id: string;
  title: string;
  sender: string;
  zoneId: PlanetZoneId;
  preview: string;
  content: string;
  reflectionQuestion: string;
  theta: number;
  phi: number;
  isCollected?: boolean;
}

export interface OnlinePlayer {
  id: string;
  displayName: string;
  color: string;
  position: [number, number, number];
  rotation: [number, number, number, number]; // quaternion
  isMoving: boolean;
  isJumping: boolean;
  currentEmote?: string | null;
  lastUpdated: number;
}

export interface EmoteOption {
  id: string;
  emoji: string;
  label: string;
}

export interface WorldQuest {
  id: string;
  zoneId: PlanetZoneId;
  title: string;
  description: string;
  actionLabel: string;
  targetHref: string;
  reward: string;
  progress: number;
  total: number;
  progressPercent: number;
  completed: boolean;
  accentColor: string;
}

export interface WorldJourney {
  level: number;
  energy: number;
  completedQuests: number;
  totalQuests: number;
  streak: number;
  loading: boolean;
  quests: WorldQuest[];
}
