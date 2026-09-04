import { describe, expect, it } from 'vitest';
import {
  BLUEPRINT_OPENING_QUESTION,
  buildBlueprintTurnInstruction,
  LIFE_LAB_BLUEPRINT_PROMPT,
} from '../../src/server/ai/life-lab-blueprint';

describe('Life Lab Blueprint policy', () => {
  it('keeps the canonical opening question stable', () => {
    expect(BLUEPRINT_OPENING_QUESTION).toBe(
      'Hãy tưởng tượng bạn đang sống một cuộc đời do chính mình lựa chọn. Trong một ngày bình thường, bạn muốn dành thời gian và năng lượng của mình cho những điều gì?'
    );
    expect(buildBlueprintTurnInstruction('opening')).toContain(BLUEPRINT_OPENING_QUESTION);
  });

  it('enforces adaptive reflection primitives and excludes 12-month timeline', () => {
    expect(LIFE_LAB_BLUEPRINT_PROMPT).toContain('DESIRE');
    expect(LIFE_LAB_BLUEPRINT_PROMPT).toContain('ESCAPE');
    expect(LIFE_LAB_BLUEPRINT_PROMPT).toContain('LIFE VISION');
    expect(LIFE_LAB_BLUEPRINT_PROMPT).toContain('PROGRESSION OVER REPETITION');
    expect(LIFE_LAB_BLUEPRINT_PROMPT).not.toContain('LONGITUDINAL 12-MONTH PRACTICE');
    expect(LIFE_LAB_BLUEPRINT_PROMPT).not.toContain('weekly check-in');
    expect(LIFE_LAB_BLUEPRINT_PROMPT).not.toContain('monthly synthesis');
    expect(LIFE_LAB_BLUEPRINT_PROMPT).not.toContain('quarterly');
    expect(buildBlueprintTurnInstruction('message')).toContain('Blueprint Life Lab');
  });
});

