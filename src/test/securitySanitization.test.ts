import { describe, it, expect } from 'vitest';
import * as supabaseClientModule from '../lib/supabaseClient';
import * as geminiServiceModule from '../services/geminiService';

describe('Security Sanitization', () => {
  it('should not export key auth or localStorage secret writers', () => {
    expect((supabaseClientModule as any).loginWithSupabaseKey).toBeUndefined();
    expect((supabaseClientModule as any).isKeyAuthenticated).toBeUndefined();
    expect((supabaseClientModule as any).KEY_AUTH_EVENT).toBeUndefined();
  });

  it('should not have embedded system groq key or expose groq bytecode', () => {
    expect((geminiServiceModule as any).getSystemGroqKey).toBeUndefined();
    const stored = geminiServiceModule.getStoredGeminiKey();
    expect(stored).not.toContain('gsk_');
  });
});
