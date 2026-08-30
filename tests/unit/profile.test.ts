import { describe, expect, it } from 'vitest';
import { emptyLifeProfileSnapshot, mergeInsightsIntoProfile } from '../../src/server/domain/profile';

describe('Life Profile projections', () => {
  it('does not duplicate an insight when rebuilding a draft', () => {
    const insight = {
      id: '22222222-2222-4222-8222-222222222222',
      dimension: 'what_matters',
      content: 'Gia đình là điểm tựa quan trọng.',
    };
    const first = mergeInsightsIntoProfile(emptyLifeProfileSnapshot(), [insight]);
    const second = mergeInsightsIntoProfile(first, [insight]);

    expect(second.dimensions.what_matters.summary).toBe(insight.content);
    expect(second.dimensions.what_matters.evidence_ids).toEqual([insight.id]);
  });
});
