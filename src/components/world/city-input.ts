import type { VirtualInput } from './world-types';

export function mergeVirtualInput(current: VirtualInput, patch: Partial<VirtualInput>): VirtualInput {
  return {
    x: patch.x ?? current.x,
    y: patch.y ?? current.y,
    jump: patch.jump ?? current.jump,
    sprint: patch.sprint ?? current.sprint,
  };
}
