import { describe, it, expect, vi } from 'vitest';
import { checkCrisisSafety, getEmergencyResources } from '../services/safetyGuardrailService';
import { callAiGatewayTurn } from '../services/aiGatewayService';

describe('AI Gateway & Safety Guardrails', () => {
  it('should detect crisis intent and provide verified emergency guidance', () => {
    const safety = checkCrisisSafety('Tôi cảm thấy bế tắc hoàn toàn và muốn biến mất khỏi cuộc đời');
    expect(safety.isCrisis).toBe(true);

    const resources = getEmergencyResources();
    expect(resources.hotline).toBe('1900 636 789 (Hỗ trợ tâm lý ngày đêm)');
    expect(resources.verified).toBe(true);
  });

  it('should abort and throw TIMEOUT error if AI response exceeds timeout limit', async () => {
    vi.useFakeTimers();

    const slowPromise = callAiGatewayTurn({
      message: 'Xin chào',
      contextMessages: [],
      cardSummary: '',
      timeoutMs: 1000,
      mockLatencyMs: 2000 // simulate slow response
    });

    vi.advanceTimersByTime(1100);

    await expect(slowPromise).rejects.toThrow('AI_REQUEST_TIMEOUT');
    vi.useRealTimers();
  });
});
