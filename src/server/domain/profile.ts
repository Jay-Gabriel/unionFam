import { z } from 'zod';

export const PROFILE_DIMENSIONS = [
  'my_life',
  'what_matters',
  'my_ideal_day',
  'what_it_takes',
  'my_trade_offs',
  'the_question',
] as const;

const DimensionSnapshotSchema = z.object({
  summary: z.string().max(2000).default(''),
  current_state: z.string().max(2000).optional(),
  desired_state: z.string().max(2000).optional(),
  strengths: z.array(z.string().max(500)).max(10).optional(),
  tensions: z.array(z.string().max(500)).max(10).optional(),
  evidence_ids: z.array(z.string().uuid()).max(20).default([]),
});

export const LifeProfileSnapshotSchema = z.object({
  schema_version: z.number().int().positive().default(1),
  desire: z.string().max(4000).default(''),
  escape: z.string().max(4000).default(''),
  life_vision: z.string().max(4000).default(''),
  dimensions: z.object(
    Object.fromEntries(PROFILE_DIMENSIONS.map((dimension) => [dimension, DimensionSnapshotSchema])) as Record<
      (typeof PROFILE_DIMENSIONS)[number],
      typeof DimensionSnapshotSchema
    >
  ),
});

export type LifeProfileSnapshot = z.infer<typeof LifeProfileSnapshotSchema>;

export function emptyLifeProfileSnapshot(): LifeProfileSnapshot {
  return {
    schema_version: 1,
    desire: '',
    escape: '',
    life_vision: '',
    dimensions: Object.fromEntries(
      PROFILE_DIMENSIONS.map((dimension) => [dimension, { summary: '', evidence_ids: [] }])
    ) as unknown as LifeProfileSnapshot['dimensions'],
  };
}

export function mergeInsightsIntoProfile(
  base: LifeProfileSnapshot,
  insights: Array<{ dimension: string; content: string; id?: string }>
) {
  const next = structuredClone(base);
  insights.forEach((insight) => {
    if (!PROFILE_DIMENSIONS.includes(insight.dimension as (typeof PROFILE_DIMENSIONS)[number])) return;
    const dimension = insight.dimension as (typeof PROFILE_DIMENSIONS)[number];
    const current = next.dimensions[dimension];
    const content = insight.content.trim();
    if (!content) return;
    // Re-merging the same confirmed insight must be idempotent. This matters
    // when a new draft is rebuilt after every agency decision.
    if (insight.id && current.evidence_ids.includes(insight.id)) return;
    if (!insight.id && current.summary.includes(content)) return;
    if (current.summary) current.summary = `${current.summary}\n${content}`.slice(0, 2000);
    else current.summary = content.slice(0, 2000);
    if (insight.id && !current.evidence_ids.includes(insight.id)) current.evidence_ids.push(insight.id);
  });
  return next;
}
