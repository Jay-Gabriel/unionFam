import { z } from 'zod';

export const DimensionEnum = z.enum([
  'my_life',
  'what_matters',
  'my_ideal_day',
  'what_it_takes',
  'my_trade_offs',
  'the_question',
  'financial_life',
  'other',
]);

// Keep the original MVP stage names as aliases while accepting the canonical
// stage names from the product specification.
export const StageEnum = z.enum([
  'onboarding',
  'discovery',
  'clarify',
  'permission',
  'synthesis',
  'design',
  'experiment',
  'reflection',
  'completed',
  'initial_exploration',
  'ideal_day_exploration',
  'trade_offs_evaluation',
  'experiment_proposal',
]);

export const ObservationProposalSchema = z.object({
  dimension: DimensionEnum,
  observationType: z.string().min(1).max(64).default('insight_candidate'),
  contentOriginal: z.string().min(1).max(2000),
  confidence: z.number().min(0).max(1).default(0.85),
  evidenceMessageIds: z.array(z.string()).max(10).optional(),
});

export const ExperimentProposalSchema = z.object({
  title: z.string().min(3).max(255),
  hypothesis: z.string().min(5).max(1000),
  smallestStep: z.string().min(3).max(500),
  successSignal: z.string().min(3).max(500),
  targetDays: z.number().int().min(1).max(90).default(7),
  dimension: DimensionEnum.optional(),
});

export type ExperimentProposal = z.infer<typeof ExperimentProposalSchema>;

export const ReflectionProposalSchema = z.object({
  result: z.string().min(3).max(2000),
  learningCandidate: z.string().min(3).max(2000),
  feeling: z.string().min(2).max(500),
  nextAction: z.string().min(2).max(1000),
  rating: z.number().int().min(1).max(5).default(4),
  experimentTitle: z.string().max(255).optional(),
});

export type ReflectionProposal = z.infer<typeof ReflectionProposalSchema>;

export const ResourceProposalSchema = z.object({
  dimension: DimensionEnum.default('other'),
  resourceType: z.string().min(2).max(64).default('skill'),
  name: z.string().min(2).max(255),
  description: z.string().max(1000).optional(),
});

export type ResourceProposal = z.infer<typeof ResourceProposalSchema>;

export const SafetySchema = z.object({
  isSafe: z.boolean().default(true),
  safetyFlag: z.string().max(64).optional(),
  userMessage: z.string().max(2000).optional(),
});

export const UserSignalEnum = z.enum([
  'desire',
  'escape',
  'life_vision',
  'value',
  'constraint',
  'trade_off',
  'contradiction',
  'uncertainty',
  'resource',
  'experiment_result',
  'reflection',
  'neutral',
]);

export const ConversationFocusEnum = z.enum([
  'understand_statement',
  'clarify_desire',
  'clarify_escape',
  'discover_life_vision',
  'discover_value',
  'discover_constraint',
  'explore_trade_off',
  'resolve_contradiction',
  'synthesize',
  'request_permission',
  'design_experiment',
  'reflect_on_experiment',
  'general_exploration',
]);

export const ConversationStateSchema = z.object({
  userSignal: UserSignalEnum.optional(),
  currentFocus: z.string().max(100).optional(),
  answeredTopics: z.array(z.string().max(100)).max(50).optional(),
  newFacts: z.array(z.string().max(500)).max(50).optional(),
  nextInformationNeed: z.string().max(500).optional(),
});

export type ConversationState = z.infer<typeof ConversationStateSchema>;

export const AIStructuredOutputSchema = z.object({
  responseText: z.string().min(1).max(6000),
  nextStage: StageEnum.default('discovery'),
  requiresPermission: z.boolean().default(false),
  safety: SafetySchema.default({ isSafe: true }),
  nextQuestionId: z.string().min(1).max(128).optional(),
  observationProposal: ObservationProposalSchema.optional(),
  experimentProposal: ExperimentProposalSchema.optional(),
  reflectionProposal: ReflectionProposalSchema.optional(),
  resourceProposal: ResourceProposalSchema.optional(),
  conversationState: ConversationStateSchema.optional(),
  errorMetadata: z.string().max(2000).optional(),
});

export type AIStructuredOutput = z.infer<typeof AIStructuredOutputSchema>;

export interface SchemaParseResult {
  success: boolean;
  data?: AIStructuredOutput;
  errorCode?: 'AI_SCHEMA_INVALID' | 'AI_PROVIDER_TIMEOUT' | 'AI_PROVIDER_UNAVAILABLE';
  errorMessage?: string;
}

const VALID_DIMENSIONS = new Set([
  'my_life', 'what_matters', 'my_ideal_day', 'what_it_takes',
  'my_trade_offs', 'the_question', 'financial_life', 'other',
]);

function normalizeDimension(dim: unknown): string {
  if (typeof dim !== 'string') return 'other';
  const d = dim.trim().toLowerCase();
  if (VALID_DIMENSIONS.has(d)) return d;
  if (d.includes('life') && !d.includes('finan')) return 'my_life';
  if (d.includes('matter') || d.includes('value')) return 'what_matters';
  if (d.includes('ideal') || d.includes('day')) return 'my_ideal_day';
  if (d.includes('take') || d.includes('need')) return 'what_it_takes';
  if (d.includes('trade') || d.includes('cost')) return 'my_trade_offs';
  if (d.includes('question')) return 'the_question';
  if (d.includes('financ') || d.includes('money') || d.includes('resource')) return 'financial_life';
  return 'other';
}

const VALID_STAGES = new Set([
  'onboarding', 'discovery', 'clarify', 'permission', 'synthesis',
  'design', 'experiment', 'reflection', 'completed',
  'initial_exploration', 'ideal_day_exploration', 'trade_offs_evaluation', 'experiment_proposal',
]);

function normalizeStage(stage: unknown): string {
  if (typeof stage !== 'string') return 'discovery';
  const s = stage.trim().toLowerCase();
  if (VALID_STAGES.has(s)) return s;
  if (s.includes('onboard') || s.includes('greet') || s.includes('intro')) return 'onboarding';
  if (s.includes('clarif')) return 'clarify';
  if (s.includes('permiss')) return 'permission';
  if (s.includes('synth')) return 'synthesis';
  if (s.includes('design')) return 'design';
  if (s.includes('experim')) return 'experiment';
  if (s.includes('reflect')) return 'reflection';
  if (s.includes('complet')) return 'completed';
  return 'discovery';
}

const VALID_USER_SIGNALS = new Set([
  'desire', 'escape', 'life_vision', 'value', 'constraint',
  'trade_off', 'contradiction', 'uncertainty', 'resource',
  'experiment_result', 'reflection', 'neutral',
]);

function normalizeUserSignal(signal: unknown): string | undefined {
  if (typeof signal !== 'string' || !signal.trim()) return undefined;
  const s = signal.trim().toLowerCase();
  if (VALID_USER_SIGNALS.has(s)) return s;
  if (s.includes('desire') || s.includes('want')) return 'desire';
  if (s.includes('escape') || s.includes('stress') || s.includes('pressure') || s.includes('burnout')) return 'escape';
  if (s.includes('vision') || s.includes('goal')) return 'life_vision';
  if (s.includes('value')) return 'value';
  if (s.includes('constraint') || s.includes('limit')) return 'constraint';
  if (s.includes('trade')) return 'trade_off';
  if (s.includes('contra')) return 'contradiction';
  if (s.includes('uncert') || s.includes('confus')) return 'uncertainty';
  if (s.includes('resourc')) return 'resource';
  if (s.includes('experiment')) return 'experiment_result';
  if (s.includes('reflect')) return 'reflection';
  return 'neutral';
}

function normalizeProviderPayload(raw: unknown) {
  if (!raw || typeof raw !== 'object') return raw;
  const value = raw as Record<string, unknown>;
  const observationValue = value.observation || value.observationProposal || value.insight;
  const observation = observationValue && typeof observationValue === 'object'
    ? observationValue as Record<string, unknown>
    : undefined;
  
  const experimentValue = value.experiment || value.experimentProposal;
  const experiment = experimentValue && typeof experimentValue === 'object'
    ? experimentValue as Record<string, unknown>
    : undefined;

  const reflectionValue = value.reflectionProposal || value.reflection_entry;
  const reflection = reflectionValue && typeof reflectionValue === 'object'
    ? reflectionValue as Record<string, unknown>
    : undefined;

  const resourceValue = value.resource || value.resourceProposal;
  const resource = resourceValue && typeof resourceValue === 'object'
    ? resourceValue as Record<string, unknown>
    : undefined;

  const safety = (value.safety || {}) as Record<string, unknown>;
  const responseCandidate = value.responseText ?? value.assistant_message ?? value.reflection ?? value.message ?? value.answer;
  const followUpQuestion = value.nextQuestion ?? value.question;
  const responseText = [responseCandidate, followUpQuestion]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join('\n\n');

  const rawConvState = (value.conversationState || value.conversation_state || value.state);
  const convStateObj = rawConvState && typeof rawConvState === 'object' ? (rawConvState as Record<string, unknown>) : undefined;

  return {
    responseText,
    nextStage: normalizeStage(value.nextStage ?? value.next_stage),
    requiresPermission: Boolean(value.requiresPermission ?? value.requires_permission),
    nextQuestionId: typeof (value.nextQuestionId ?? value.next_question_id) === 'string'
      ? value.nextQuestionId ?? value.next_question_id
      : undefined,
    observationProposal: observation && observation.contentOriginal
      ? {
          dimension: normalizeDimension(observation.dimension),
          observationType: String(observation.observationType ?? observation.type ?? 'insight_candidate'),
          contentOriginal: String(observation.contentOriginal ?? observation.content ?? ''),
          confidence: typeof observation.confidence === 'number' ? observation.confidence : 0.85,
          evidenceMessageIds: Array.isArray(observation.evidenceMessageIds ?? observation.evidence_message_ids)
            ? (observation.evidenceMessageIds ?? observation.evidence_message_ids)
            : undefined,
        }
      : undefined,
    experimentProposal: experiment && experiment.title && experiment.hypothesis
      ? {
          title: String(experiment.title),
          hypothesis: String(experiment.hypothesis),
          smallestStep: String(experiment.smallestStep ?? experiment.smallest_step ?? ''),
          successSignal: String(experiment.successSignal ?? experiment.success_signal ?? ''),
          targetDays: Number(experiment.targetDays ?? experiment.target_days ?? 7),
          dimension: experiment.dimension ? normalizeDimension(experiment.dimension) : undefined,
        }
      : undefined,
    reflectionProposal: reflection && reflection.result && reflection.learningCandidate
      ? {
          result: String(reflection.result),
          learningCandidate: String(reflection.learningCandidate ?? reflection.learning_candidate ?? reflection.learning ?? ''),
          feeling: String(reflection.feeling ?? 'Tốt'),
          nextAction: String(reflection.nextAction ?? reflection.next_action ?? 'Tiếp tục'),
          rating: Number(reflection.rating ?? 4),
          experimentTitle: reflection.experimentTitle ? String(reflection.experimentTitle ?? reflection.experiment_title) : undefined,
        }
      : undefined,
    resourceProposal: resource && resource.name
      ? {
          dimension: normalizeDimension(resource.dimension ?? 'other'),
          resourceType: String(resource.resourceType ?? resource.resource_type ?? 'skill'),
          name: String(resource.name),
          description: resource.description ? String(resource.description) : undefined,
        }
      : undefined,
    safety: {
      isSafe: safety.isSafe ?? !Boolean(safety.triggered),
      safetyFlag: safety.safetyFlag ? String(safety.safetyFlag ?? safety.category) : undefined,
      userMessage: safety.userMessage ? String(safety.userMessage) : undefined,
    },
    conversationState: convStateObj
      ? {
          ...convStateObj,
          userSignal: normalizeUserSignal(convStateObj.userSignal),
        }
      : undefined,
    errorMetadata: value.errorMetadata ? String(value.errorMetadata) : undefined,
  };
}

export function parseStrictAIOutput(
  rawJSON: string,
  allowedQuestionIds: string[] = []
): SchemaParseResult {
  try {
    const parsed = normalizeProviderPayload(JSON.parse(rawJSON));
    const validated = AIStructuredOutputSchema.parse(parsed);

    // A model-provided question is only accepted when the server supplied an
    // explicit allowlist for this turn. Never trust an arbitrary model ID.
    if (validated.nextQuestionId) {
      if (allowedQuestionIds.length === 0 || !allowedQuestionIds.includes(validated.nextQuestionId)) {
        return {
          success: false,
          errorCode: 'AI_SCHEMA_INVALID',
          errorMessage: `nextQuestionId ${validated.nextQuestionId} is not in server allowlist`,
        };
      }
    }

    if (validated.requiresPermission && !validated.observationProposal && validated.nextStage !== 'permission') {
      return {
        success: false,
        errorCode: 'AI_SCHEMA_INVALID',
        errorMessage: 'Permission requests must include an observation or use permission stage',
      };
    }

    return { success: true, data: validated };
  } catch (err) {
    return {
      success: false,
      errorCode: 'AI_SCHEMA_INVALID',
      errorMessage: err instanceof Error ? err.message : 'Invalid AI Schema',
    };
  }
}
