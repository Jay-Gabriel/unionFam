import { z } from 'zod';

export const DimensionEnum = z.enum([
  'my_life',
  'what_matters',
  'my_ideal_day',
  'what_it_takes',
  'my_trade_offs',
  'the_question',
]);

export const StageEnum = z.enum([
  'initial_exploration',
  'ideal_day_exploration',
  'trade_offs_evaluation',
  'experiment_proposal',
]);

export const ObservationProposalSchema = z.object({
  dimension: DimensionEnum,
  observationType: z.string().default('insight_candidate'),
  contentOriginal: z.string().min(5),
  confidence: z.number().min(0).max(1).default(0.85),
  evidenceMessageIds: z.array(z.string()).optional(),
});

export const SafetySchema = z.object({
  isSafe: z.boolean().default(true),
  safetyFlag: z.string().optional(),
});

export const AIStructuredOutputSchema = z.object({
  responseText: z.string().min(1),
  nextStage: StageEnum.default('initial_exploration'),
  requiresPermission: z.boolean().default(false),
  safety: SafetySchema.default({ isSafe: true }),
  nextQuestionId: z.string().optional(),
  observationProposal: ObservationProposalSchema.optional(),
  errorMetadata: z.string().optional(),
});

export type AIStructuredOutput = z.infer<typeof AIStructuredOutputSchema>;

export interface SchemaParseResult {
  success: boolean;
  data?: AIStructuredOutput;
  errorCode?: 'AI_SCHEMA_INVALID';
  errorMessage?: string;
}

export function parseStrictAIOutput(
  rawJSON: string,
  allowedQuestionIds: string[] = []
): SchemaParseResult {
  try {
    const parsed = JSON.parse(rawJSON);
    const validated = AIStructuredOutputSchema.parse(parsed);

    // Validate nextQuestionId against server allowlist
    if (validated.nextQuestionId && allowedQuestionIds.length > 0) {
      if (!allowedQuestionIds.includes(validated.nextQuestionId)) {
        return {
          success: false,
          errorCode: 'AI_SCHEMA_INVALID',
          errorMessage: `nextQuestionId ${validated.nextQuestionId} is not in server allowlist`,
        };
      }
    }

    return {
      success: true,
      data: validated,
    };
  } catch (err) {
    return {
      success: false,
      errorCode: 'AI_SCHEMA_INVALID',
      errorMessage: err instanceof Error ? err.message : 'Invalid AI Schema',
    };
  }
}
