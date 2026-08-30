export const CONVERSATION_STAGES = [
  'onboarding',
  'discovery',
  'clarify',
  'permission',
  'synthesis',
  'design',
  'experiment',
  'reflection',
  'completed',
] as const;

export type ConversationStage = (typeof CONVERSATION_STAGES)[number];

const LEGACY_STAGE_MAP: Record<string, ConversationStage> = {
  initial_exploration: 'discovery',
  ideal_day_exploration: 'clarify',
  trade_offs_evaluation: 'design',
  experiment_proposal: 'experiment',
};

const ALLOWED_TRANSITIONS: Record<ConversationStage, ConversationStage[]> = {
  onboarding: ['discovery'],
  discovery: ['discovery', 'clarify', 'permission'],
  clarify: ['discovery', 'permission', 'clarify'],
  permission: ['synthesis', 'discovery'],
  synthesis: ['design', 'clarify'],
  design: ['experiment', 'clarify', 'design'],
  experiment: ['reflection', 'design', 'experiment'],
  reflection: ['discovery', 'design', 'completed'],
  completed: ['discovery'],
};

export function normalizeStage(stage: string | null | undefined): ConversationStage {
  if (stage && (CONVERSATION_STAGES as readonly string[]).includes(stage)) {
    return stage as ConversationStage;
  }
  return LEGACY_STAGE_MAP[stage || ''] || 'discovery';
}

export function allowedNextStages(currentStage: string | null | undefined) {
  return ALLOWED_TRANSITIONS[normalizeStage(currentStage)];
}

export function resolveNextStage(currentStage: string | null | undefined, proposedStage: string | null | undefined) {
  const current = normalizeStage(currentStage);
  const proposed = normalizeStage(proposedStage);
  return ALLOWED_TRANSITIONS[current].includes(proposed) ? proposed : current;
}
