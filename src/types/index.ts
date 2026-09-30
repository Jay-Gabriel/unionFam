export type ClarityStatus = 'UNCLEAR' | 'EXPLORING' | 'DEFINED' | 'GROUNDED';

export interface MapNode {
  id: string;
  label: string;
  subtitle?: string;
  position3D: [number, number, number]; // x, y, z in Three.js space
  screenPos?: { x: number; y: number }; // computed 2D screen coordinates
  dots: ClarityStatus[];
  status: ClarityStatus;
  description: string;
  category: 'core' | 'exploration' | 'vision' | 'gap';
  isCurrentFocus?: boolean;
  isUnlocked?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'coach' | 'user' | 'system';
  text: string;
  timestamp: Date;
  requiresFeedback?: boolean;
  feedbackGiven?: 'right_on' | 'partly_right' | 'not_quite' | 'repaired' | null;
  insightId?: string;
  stateTarget?: string;
}

export interface MemoryItem {
  id: string;
  type: 'CONFIRMED_INSIGHT' | 'USER_STATEMENT' | 'LIFE_MAP_ITEM' | 'EXPERIMENT' | 'RELATIONSHIP_MEMORY';
  title: string;
  content: string;
  verified: boolean;
  date: string;
  nodeId?: string;
}

export type StateMachinePhase =
  | 'ENTRY'
  | 'CONSENT'
  | 'WHAT_MATTERS_NOW'
  | 'CURRENT_EXPERIENCE'
  | 'MEANING_OR_DESIRED_DIFFERENCE'
  | 'MINI_REFLECTION'
  | 'VERIFY'
  | 'REPAIR'
  | 'CURRENT_FOCUS'
  | 'OUTCOME_SELECTION'
  | 'NEXT_QUESTION'
  | 'LIFE_EXPERIMENT'
  | 'MEMORY_PERMISSION'
  | 'SESSION_FEEDBACK'
  | 'CLOSE'
  | 'SAFETY_FLOW';

export interface ClarityScoreState {
  score: number; // 0 to 5
  gems: ('ruby' | 'bronze' | 'crystal' | 'sapphire' | 'emerald' | 'empty')[];
}
