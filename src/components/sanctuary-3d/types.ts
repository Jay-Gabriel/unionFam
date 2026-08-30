export type SanctuaryVariant =
  | 'landing-dusk'
  | 'app-morning'
  | 'conversation'
  | 'questions'
  | 'life-map';

export interface SanctuaryCanvasProps {
  variant: SanctuaryVariant;
  intensity?: 'low' | 'medium' | 'high';
  interactive?: boolean;
  className?: string;
  fallbackSrc?: string;
}
