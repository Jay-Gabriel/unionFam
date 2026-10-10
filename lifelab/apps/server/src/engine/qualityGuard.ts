/**
 * Quality Guard — Life Lab V8.7.2 (Phần 6 "Quality Guard rules").
 * Validate structured output trước khi gửi user. Model invalid JSON KHÔNG tới UI (AC010).
 */
import { z } from 'zod';
import {
  ACTIONS,
  type ConversationState,
  OUTCOME_TYPES,
  SCHEMA_VERSION,
  type StructuredOutput,
} from '@lifelab/contract';

const insightSchema = z.object({
  text: z.string().min(1),
  verification_status: z.enum(['PROPOSED', 'UNVERIFIED']),
  scope: z.object({
    life_area: z.array(z.string()).optional(),
    generality: z.enum(['DOMAIN', 'SITUATION', 'GLOBAL']).optional(),
  }),
  confidence: z.number().min(0).max(1),
});

export const structuredOutputSchema = z.object({
  schema_version: z.string(),
  selected_action: z.enum(ACTIONS as unknown as [string, ...string[]]),
  assistant_message: z.string().min(1),
  question_count: z.union([z.literal(0), z.literal(1)]),
  evidence_used: z.array(z.string()),
  insight_candidate: insightSchema.nullable(),
  event: z.string(),
  proposed_next_state: z.string(),
  possible_outcome: z.enum(OUTCOME_TYPES as unknown as [string, ...string[]]).nullable(),
  memory_proposals: z.array(z.any()),
  safety_response: z.any().nullable(),
  ui_actions: z.array(z.any()),
  internal_reason_codes: z.array(z.string()),
});

export interface GuardInput {
  raw: string;
  currentState: ConversationState;
  allowedNextStates: ConversationState[];
  controlFlags: { user_stop: boolean; no_memory: boolean };
  availableEvidenceIds: string[];
  repairRules: string[];
}

export type GuardOutcome =
  | { ok: true; output: StructuredOutput }
  | { ok: false; rule: string; reason: string };

export function runQualityGuard(input: GuardInput): GuardOutcome {
  // 1. Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(input.raw);
  } catch {
    return { ok: false, rule: 'SCHEMA', reason: 'JSON không parse được' };
  }

  // 2. Schema
  const result = structuredOutputSchema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, rule: 'SCHEMA', reason: result.error.issues.map((i) => i.message).join('; ') };
  }
  const out = result.data as unknown as StructuredOutput;

  if (out.schema_version !== SCHEMA_VERSION) {
    return { ok: false, rule: 'SCHEMA', reason: `schema_version != ${SCHEMA_VERSION}` };
  }

  // 3. TRANSITION: proposed_next_state phải nằm trong allowed
  if (!input.allowedNextStates.includes(out.proposed_next_state as ConversationState)) {
    return { ok: false, rule: 'TRANSITION', reason: `next_state ${out.proposed_next_state} ngoài allowlist` };
  }

  // 4. QUESTION_BUDGET: question_count 0|1 (đã schema) + chéo với dấu '?'
  const qMarks = (out.assistant_message.match(/\?/g) || []).length;
  if (out.question_count === 0 && qMarks > 0) {
    return { ok: false, rule: 'QUESTION_BUDGET', reason: 'question_count=0 nhưng message có dấu hỏi' };
  }
  if (qMarks > 1) {
    return { ok: false, rule: 'QUESTION_BUDGET', reason: 'Hơn một câu hỏi trong một lượt' };
  }

  // 5. HYPOTHESIS: insight không được dùng ngôn ngữ chắc chắn
  if (out.insight_candidate) {
    const t = out.insight_candidate.text.toLowerCase();
    const certainty = ['chắc chắn', 'luôn luôn', 'bạn là người', 'nguyên nhân thật sự'];
    if (certainty.some((c) => t.includes(c))) {
      return { ok: false, rule: 'HYPOTHESIS', reason: 'Insight dùng ngôn ngữ chắc chắn' };
    }
    if (out.insight_candidate.verification_status === ('CONFIRMED' as never)) {
      return { ok: false, rule: 'HYPOTHESIS', reason: 'Insight mới không được CONFIRMED' };
    }
  }

  // 6. GROUNDING: evidence_used phải tồn tại trong context
  for (const id of out.evidence_used) {
    if (!input.availableEvidenceIds.includes(id)) {
      return { ok: false, rule: 'GROUNDING', reason: `evidence ${id} ngoài context` };
    }
  }

  // 7. MEMORY: không ghi trực tiếp; proposal chỉ ở MEMORY_PERMISSION
  if (out.memory_proposals.length > 0 && input.currentState !== 'MEMORY_PERMISSION' && input.currentState !== 'SESSION_OUTCOME_CHECKPOINT') {
    return { ok: false, rule: 'MEMORY', reason: 'Memory proposal ngoài checkpoint/permission (P0)' };
  }
  if (input.controlFlags.no_memory && out.memory_proposals.length > 0) {
    return { ok: false, rule: 'MEMORY', reason: 'NO_MEMORY nhưng vẫn đề xuất lưu' };
  }

  // 8. USER_STOP: sau stop không câu hỏi/feedback/memory
  if (input.controlFlags.user_stop) {
    if (out.question_count > 0 || out.memory_proposals.length > 0) {
      return { ok: false, rule: 'USER_STOP', reason: 'Có câu hỏi/memory sau USER_STOP' };
    }
  }

  // 9. REPAIR: không lặp semantic insight bị reject
  if (out.insight_candidate) {
    const t = out.insight_candidate.text.toLowerCase();
    for (const rule of input.repairRules) {
      if (rule && t.includes(rule.toLowerCase())) {
        return { ok: false, rule: 'REPAIR', reason: 'Lặp lại insight đã bị từ chối' };
      }
    }
  }

  return { ok: true, output: out };
}

/** Fallback template an toàn — không insight, không memory, không advice (Phần 6). */
export function safeFallback(currentState: ConversationState): StructuredOutput {
  return {
    schema_version: SCHEMA_VERSION,
    selected_action: 'REFLECT',
    assistant_message: 'Mình chưa thể phản hồi thật tốt lúc này. Mình vẫn ở đây và lắng nghe bạn.',
    question_count: 0,
    evidence_used: [],
    insight_candidate: null,
    event: 'FALLBACK',
    proposed_next_state: currentState,
    possible_outcome: null,
    memory_proposals: [],
    safety_response: null,
    ui_actions: [],
    internal_reason_codes: ['FALLBACK'],
  };
}
