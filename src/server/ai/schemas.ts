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

export const SafetySchema = z.object({
  isSafe: z.boolean().default(true),
  safetyFlag: z.string().max(64).optional(),
  userMessage: z.string().max(2000).optional(),
});

export const AIStructuredOutputSchema = z.object({
  responseText: z.string().min(1).max(6000),
  nextStage: StageEnum.default('discovery'),
  requiresPermission: z.boolean().default(false),
  safety: SafetySchema.default({ isSafe: true }),
  nextQuestionId: z.string().min(1).max(128).optional(),
  observationProposal: ObservationProposalSchema.optional(),
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
    safety: {
      isSafe: safety.isSafe ?? !Boolean(safety.triggered),
      safetyFlag: safety.safetyFlag ?? safety.category,
      userMessage: safety.userMessage,
    },
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
