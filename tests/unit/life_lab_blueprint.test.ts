import { describe, expect, it } from 'vitest';
import {
  BLUEPRINT_OPENING_QUESTION,
  buildBlueprintTurnInstruction,
  LIFE_LAB_BLUEPRINT_PROMPT,
} from '../../src/server/ai/life-lab-blueprint';

describe('Life Lab Blueprint 1 policy', () => {
  it('keeps the canonical opening question stable', () => {
    expect(BLUEPRINT_OPENING_QUESTION).toBe(
      'Hãy tưởng tượng bạn đang sống một cuộc đời do chính mình lựa chọn. Trong một ngày bình thường, bạn muốn dành thời gian và năng lượng của mình cho những điều gì?'
    );
    expect(buildBlueprintTurnInstruction('opening')).toContain(BLUEPRINT_OPENING_QUESTION);
  });

  it('contains the long-running reflection guardrails', () => {
    expect(LIFE_LAB_BLUEPRINT_PROMPT).toContain('DESIRE');
    expect(LIFE_LAB_BLUEPRINT_PROMPT).toContain('ESCAPE');
    expect(LIFE_LAB_BLUEPRINT_PROMPT).toContain('LIFE VISION');
    expect(LIFE_LAB_BLUEPRINT_PROMPT).toContain('LONGITUDINAL 12-MONTH PRACTICE');
    expect(LIFE_LAB_BLUEPRINT_PROMPT).toContain('weekly check-in');
    expect(LIFE_LAB_BLUEPRINT_PROMPT).toContain('monthly synthesis');
    expect(LIFE_LAB_BLUEPRINT_PROMPT).toContain('quarterly');
    expect(buildBlueprintTurnInstruction('message')).toContain('một câu mở duy nhất');
  });
});
