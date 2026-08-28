import { describe, it, expect } from 'vitest';
import { processObservationDecision } from '../../src/server/domain/agency';

describe('User Agency Observation Decision Loop', () => {
  it('should accept observation and generate confirmed insight', async () => {
    const res = await processObservationDecision({
      userId: 'usr-123',
      observationId: 'obs-456',
      decision: 'accepted',
    });

    expect(res.status).toBe('accepted');
    expect(res.insightId).toBeDefined();
    expect(res.observationId).toBe('obs-456');
  });

  it('should accept edited observation and prioritize user edited content', async () => {
    const res = await processObservationDecision({
      userId: 'usr-123',
      observationId: 'obs-456',
      decision: 'accepted',
      editedContent: 'Nội dung insight do người dùng chỉnh sửa',
    });

    expect(res.status).toBe('accepted');
    expect(res.confirmedContent).toBe('Nội dung insight do người dùng chỉnh sửa');
  });

  it('should reject observation without creating insight', async () => {
    const res = await processObservationDecision({
      userId: 'usr-123',
      observationId: 'obs-456',
      decision: 'rejected',
    });

    expect(res.status).toBe('rejected');
    expect(res.insightId).toBeUndefined();
  });
});
