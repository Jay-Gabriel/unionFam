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
  contentOriginal: z.string().min(5).max(1200),
  confidence: z.number().min(0).max(1).default(0.85),
  evidenceMessageIds: z.array(z.string().uuid()).max(10).optional(),
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

  return {
    responseText,
    nextStage: value.nextStage ?? value.next_stage,
    requiresPermission: value.requiresPermission ?? value.requires_permission,
    nextQuestionId: typeof (value.nextQuestionId ?? value.next_question_id) === 'string'
      ? value.nextQuestionId ?? value.next_question_id
      : undefined,
    observationProposal: observation
      ? {
          dimension: observation.dimension,
          observationType: observation.observationType ?? observation.type ?? 'insight_candidate',
          contentOriginal: observation.contentOriginal ?? observation.content,
          confidence: observation.confidence,
          evidenceMessageIds: observation.evidenceMessageIds ?? observation.evidence_message_ids,
        }
      : undefined,
    experimentProposal: experiment
      ? {
          title: experiment.title,
          hypothesis: experiment.hypothesis,
          smallestStep: experiment.smallestStep ?? experiment.smallest_step,
          successSignal: experiment.successSignal ?? experiment.success_signal,
          targetDays: Number(experiment.targetDays ?? experiment.target_days ?? 7),
          dimension: experiment.dimension,
        }
      : undefined,
    reflectionProposal: reflection
      ? {
          result: reflection.result,
          learningCandidate: reflection.learningCandidate ?? reflection.learning_candidate ?? reflection.learning,
          feeling: reflection.feeling,
          nextAction: reflection.nextAction ?? reflection.next_action,
          rating: Number(reflection.rating ?? 4),
          experimentTitle: reflection.experimentTitle ?? reflection.experiment_title,
        }
      : undefined,
    resourceProposal: resource
      ? {
          dimension: resource.dimension ?? 'other',
          resourceType: resource.resourceType ?? resource.resource_type ?? 'skill',
          name: resource.name,
          description: resource.description,
        }
      : undefined,
    safety: {
      isSafe: safety.isSafe ?? !Boolean(safety.triggered),
      safetyFlag: safety.safetyFlag ?? safety.category,
      userMessage: safety.userMessage,
    },
    conversationState: (value.conversationState || value.conversation_state || value.state) && typeof (value.conversationState || value.conversation_state || value.state) === 'object'
      ? (value.conversationState || value.conversation_state || value.state) as Record<string, unknown>
      : undefined,
    errorMetadata: value.errorMetadata,
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
