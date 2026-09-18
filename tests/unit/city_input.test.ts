import { describe, expect, it } from 'vitest';
import { mergeVirtualInput } from '@/components/world/city-input';

describe('mobile virtual input', () => {
  const moving = { x: 0.55, y: -0.8, jump: false, sprint: false };

  it('keeps movement while jump is pressed', () => {
    expect(mergeVirtualInput(moving, { jump: true })).toEqual({ ...moving, jump: true });
  });

  it('keeps movement while sprint is pressed', () => {
    expect(mergeVirtualInput(moving, { sprint: true })).toEqual({ ...moving, sprint: true });
  });

  it('stops only the joystick axes when it is released', () => {
    expect(mergeVirtualInput({ ...moving, sprint: true }, { x: 0, y: 0 })).toEqual({ x: 0, y: 0, jump: false, sprint: true });
  });
});
