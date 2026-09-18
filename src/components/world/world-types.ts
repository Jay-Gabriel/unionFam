export type CityZoneId =
  | 'home'
  | 'square'
  | 'academy'
  | 'sanctuary'
  | 'observatory'
  | 'greenhouse'
  | 'lake'
  | 'arcade'
  | 'vault';

export interface CityZone {
  id: CityZoneId;
  name: string;
  subtitle: string;
  description: string;
  color: string;
  position: [number, number, number];
  radius: number;
  actionLabel: string;
  targetHref: string;
  aiPromptStarter?: string;
}

export interface WorldQuest {
  id: string;
  zoneId: CityZoneId;
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

export interface VirtualInput {
  x: number;
  y: number;
  jump: boolean;
  sprint: boolean;
}

export interface PlayerHandle {
  setVirtualInput: (input: VirtualInput) => void;
  triggerEmote: (emoji: string) => void;
  getSessionTransform: () => import('./world-session').WorldTransform | null;
  restoreSessionTransform: (transform: import('./world-session').WorldTransform) => void;
}
