import { describe, it, expect, beforeEach } from 'vitest';
import {
  setPrivacyScope,
  getPrivacyScope,
  shouldPersistTranscript,
  clearAllSessionData
} from '../services/privacyService';
import {
  createGuestSession,
  getGuestMessages,
  addGuestMessage,
  importGuestSessionToUser
} from '../services/guestSessionService';

describe('Privacy and Guest Session Management', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAllSessionData();
  });

  it('should not persist transcript when scope is card_only or session_only', () => {
    setPrivacyScope('card_only');
    expect(shouldPersistTranscript()).toBe(false);

    setPrivacyScope('session_only');
    expect(shouldPersistTranscript()).toBe(false);

    setPrivacyScope('card_and_transcript');
    expect(shouldPersistTranscript()).toBe(true);
  });

  it('should keep guest messages only in memory and never in localStorage', () => {
    createGuestSession();
    addGuestMessage('user', 'Mình đang phân vân');

    const inMemory = getGuestMessages();
    expect(inMemory.length).toBe(1);
    expect(inMemory[0].text).toBe('Mình đang phân vân');

    // Verify localStorage has zero traces of raw message
    expect(localStorage.getItem('unionfam_messages_cache')).toBeNull();
    expect(JSON.stringify(localStorage)).not.toContain('Mình đang phân vân');
  });

  it('should import guest session only once with idempotent token', () => {
    createGuestSession();
    addGuestMessage('user', 'Bản ghi khách');

    const imported = importGuestSessionToUser('user-123', 'token-import-1');
    expect(imported.success).toBe(true);

    const reImport = importGuestSessionToUser('user-123', 'token-import-1');
    expect(reImport.success).toBe(false);
    expect(reImport.error).toBe('IMPORT_ALREADY_USED');
  });
});
