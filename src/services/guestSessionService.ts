export interface GuestMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: number;
}

let inMemoryMessages: GuestMessage[] = [];
let guestToken: string | null = null;
const usedImportTokens = new Set<string>();

export const createGuestSession = (): string => {
  guestToken = 'guest_' + Math.random().toString(36).substring(2);
  inMemoryMessages = [];
  return guestToken;
};

export const addGuestMessage = (role: 'user' | 'assistant', text: string): void => {
  inMemoryMessages.push({
    id: 'msg_' + Math.random().toString(36).substring(2),
    role,
    text,
    createdAt: Date.now()
  });
};

export const getGuestMessages = (): GuestMessage[] => [...inMemoryMessages];

export const importGuestSessionToUser = (
  userId: string,
  importToken: string
): { success: boolean; error?: string } => {
  if (usedImportTokens.has(importToken)) {
    return { success: false, error: 'IMPORT_ALREADY_USED' };
  }
  usedImportTokens.add(importToken);
  inMemoryMessages = [];
  guestToken = null;
  return { success: true };
};
