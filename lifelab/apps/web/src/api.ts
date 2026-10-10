/** API client — chỉ gọi backend Life Lab. KHÔNG gọi model trực tiếp (D04/AC013). */

export interface TurnResponse {
  request_id: string;
  assistant_message: string;
  state: string;
  state_version: number;
  ui_actions: { type: string; options?: string[] }[];
  possible_outcome: string | null;
  memory_proposal: { proposals: { id: string; item_type: string; content: string; reason: string }[] } | null;
  safety: { flow: string; level: string; resources?: { label: string; value: string; kind: string }[] };
  server_time: string;
  closed: boolean;
}

const BASE = '/api/v1';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = (data as any)?.error?.code ?? `HTTP_${res.status}`;
    throw new ApiError(code, (data as any)?.error?.message ?? 'Lỗi', res.status, data);
  }
  return data as T;
}

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number, public body: unknown) {
    super(message);
  }
}

export const api = {
  async createSession(memoryMode?: string): Promise<{ session_id: string; state: string; state_version: number; limits: { turn_limit_per_session: number; note: string } }> {
    return req('/sessions', { method: 'POST', body: JSON.stringify({ memory_mode: memoryMode }) });
  },

  async sendTurn(sessionId: string, body: { message?: string | null; ui_action?: { type: string; value?: unknown } | null; expected_state_version?: number }, idemKey?: string): Promise<TurnResponse> {
    return req(`/sessions/${sessionId}/turns`, {
      method: 'POST',
      headers: idemKey ? { 'Idempotency-Key': idemKey } : {},
      body: JSON.stringify(body),
    });
  },

  async getSession(id: string) {
    return req(`/sessions/${id}`);
  },

  async confirmOutcome(sessionId: string, chosen: string, decision: string, edits?: string) {
    return req(`/sessions/${sessionId}/outcome`, { method: 'POST', body: JSON.stringify({ chosen_outcome: chosen, decision, edits }) });
  },

  async decideProposal(proposalId: string, body: { session_id: string; decision: 'ALLOWED' | 'DENIED'; memory_mode: string; edited_content?: string; user_id?: string | null }) {
    return req(`/memory/proposals/${proposalId}/decision`, { method: 'POST', body: JSON.stringify(body) });
  },

  async listMemory(userId: string) {
    return req(`/memory?user_id=${encodeURIComponent(userId)}`);
  },

  async getLifeMap(userId: string) {
    return req(`/life-map?user_id=${encodeURIComponent(userId)}`);
  },

  async sendFeedback(sessionId: string, feedback: string) {
    return req('/feedback', { method: 'POST', body: JSON.stringify({ session_id: sessionId, feedback }) });
  },

  async entitlement() {
    return req('/entitlement');
  },
};
