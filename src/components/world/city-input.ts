import type { VirtualInput } from './world-types';

export const globalVirtualInput: VirtualInput = {
  x: 0,
  y: 0,
  jump: false,
  sprint: false,
};

type EmoteListener = (emoji: string) => void;
const emoteListeners = new Set<EmoteListener>();

export function emitGlobalEmote(emoji: string): void {
  emoteListeners.forEach((listener) => {
    try {
      listener(emoji);
    } catch {
      // ignore
    }
  });
}

export function subscribeGlobalEmote(listener: EmoteListener): () => void {
  emoteListeners.add(listener);
  return () => {
    emoteListeners.delete(listener);
  };
}

export function setGlobalVirtualInput(patch: Partial<VirtualInput>): VirtualInput {
  if (patch.x !== undefined) globalVirtualInput.x = patch.x;
  if (patch.y !== undefined) globalVirtualInput.y = patch.y;
  if (patch.jump !== undefined) globalVirtualInput.jump = patch.jump;
  if (patch.sprint !== undefined) globalVirtualInput.sprint = patch.sprint;
  return globalVirtualInput;
}

export function resetGlobalVirtualInput(): void {
  globalVirtualInput.x = 0;
  globalVirtualInput.y = 0;
  globalVirtualInput.jump = false;
  globalVirtualInput.sprint = false;
}

export function mergeVirtualInput(current: VirtualInput, patch: Partial<VirtualInput>): VirtualInput {
  return {
    x: patch.x ?? current.x,
    y: patch.y ?? current.y,
    jump: patch.jump ?? current.jump,
    sprint: patch.sprint ?? current.sprint,
  };
}
