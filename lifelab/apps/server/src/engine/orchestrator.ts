/**
 * Canonical Orchestrator — Life Lab V8.7.2.
 * Thứ tự ưu tiên công bố (SPEC_CONFLICTS C03): Crisis Safety → User Stop → Permission/Privacy
 * → High-Stakes → Relational → State Machine.
 *
 * Thuần (pure) nhất có thể để test được: nhận session state + message, trả về quyết định.
 * Persistence do service layer thực hiện trong transaction.
 */
import {
  type ConversationState,
  type OutcomeType,
  type SafetyResponse,
  type StructuredOutput,
  type UiAction,
  type Action,
  findTransition,
  TRANSITIONS,
} from '@lifelab/contract';
import { classify } from './classifier.js';
import { decideSafety, highStakesResponse, relationalResponse } from './safety.js';
import {
  type AiProvider,
  type GatewayContext,
  buildMockOutput,
} from './aiGateway.js';
import { runQualityGuard, safeFallback } from './qualityGuard.js';
import { validateTransition } from './stateMachine.js';

export interface SessionView {
  current_state: ConversationState;
  user_requested_stop: boolean;
  memory_mode: string;
  question_count_since_reflection: number;
  focus_confirmation_status?: string | null;
  possible_outcome?: OutcomeType | null;
  safety_level: string;
  advice_permission_scope?: string | null;
  asked_s2_question?: boolean;
}

export interface TurnContext {
  session: SessionView;
  message: string | null;
  uiAction?: { type: string; value?: unknown } | null;
  recentTurns: { role: string; content: string }[];
  availableEvidenceIds: string[];
  repairRules: string[];
  provider: AiProvider;
}

export interface TurnDecision {
  nextState: ConversationState;
  assistantMessage: string;
  uiActions: UiAction[];
  possibleOutcome: OutcomeType | null;
  safety: { flow: SafetyResponse['flow']; level: string; resources?: SafetyResponse['resources'] };
  close: boolean;
  blockMemory: boolean;
  memoryProposals: StructuredOutput['memory_proposals'];
  insightCandidate: StructuredOutput['insight_candidate'];
  event: string;
  selectedAction: Action;
  reasonCodes: string[];
  interrupted: boolean;
  guardViolation?: string;
}

const ALLOWED_ACTIONS: Action[] = ['ASK', 'REFLECT', 'CONNECT', 'PROPOSE', 'PAUSE', 'VERIFY', 'REPAIR'];

/** Tính allowed next states từ bảng transition cho current state (gồm interrupt ANY). */
export function computeAllowedNextStates(current: ConversationState): ConversationState[] {
  const set = new Set<ConversationState>();
  for (const t of TRANSITIONS) {
    if (t.from === current || t.from === 'ANY') set.add(t.to);
  }
  return [...set];
}

export async function handleTurn(ctx: TurnContext): Promise<TurnDecision> {
  const { session } = ctx;
  const signals = classify(ctx.message);

  const baseSafety = { flow: 'NONE' as SafetyResponse['flow'], level: session.safety_level };

  // ---------- PRIORITY 1: CRISIS SAFETY (và ma trận với User Stop) ----------
  if (signals.crisis.detected || session.safety_level === 'S2' || session.safety_level === 'S3') {
    const decision = decideSafety(signals, {
      userStop: signals.user_stop,
      alreadyAskedS2: !!session.asked_s2_question,
    });
    if (decision.nextState) {
      return {
        nextState: decision.nextState,
        assistantMessage: decision.safetyResponse?.message ?? 'Mình tôn trọng mong muốn dừng của bạn.',
        uiActions: [],
        possibleOutcome: null,
        safety: decision.safetyResponse
          ? { flow: decision.safetyResponse.flow, level: decision.safetyResponse.level, resources: decision.safetyResponse.resources }
          : baseSafety,
        close: decision.close,
        blockMemory: true,
        memoryProposals: [],
        insightCandidate: null,
        event: 'SAFETY_INTERRUPT',
        selectedAction: 'REFLECT',
        reasonCodes: ['SAFETY_INTERRUPT'],
        interrupted: true,
      };
    }
  }

  // ---------- PRIORITY 2: USER STOP ----------
  if (signals.user_stop) {
    return {
      nextState: 'CLOSE',
      assistantMessage: 'Mình dừng ở đây nhé. Cảm ơn bạn đã dành thời gian. Bạn có thể quay lại bất cứ lúc nào.',
      uiActions: [],
      possibleOutcome: null,
      safety: baseSafety,
      close: true,
      blockMemory: true, // không feedback/memory sau stop (A01/C03)
      memoryProposals: [],
      insightCandidate: null,
      event: 'USER_STOP',
      selectedAction: 'PAUSE',
      reasonCodes: ['USER_STOP'],
      interrupted: true,
    };
  }

  // ---------- PRIORITY 3: PERMISSION & PRIVACY ----------
  // NO_MEMORY được cưỡng chế SỚM: block mọi long-term write ở các tầng dưới.
  const noMemory = session.memory_mode === 'NO_MEMORY' || signals.no_memory;

  // ---------- PRIORITY 4-5: BOUNDARIES (không crisis) ----------
  if (signals.high_stakes.detected) {
    const sr = highStakesResponse(signals.high_stakes.domain);
    return {
      nextState: 'HIGH_STAKES_BOUNDARY',
      assistantMessage: sr.message,
      uiActions: [],
      possibleOutcome: null,
      safety: { flow: sr.flow, level: sr.level },
      close: false,
      blockMemory: noMemory,
      memoryProposals: [],
      insightCandidate: null,
      event: 'HIGH_STAKES_NO_CRISIS',
      selectedAction: 'REFLECT',
      reasonCodes: ['HIGH_STAKES'],
      interrupted: true,
    };
  }
  if (signals.relational_dependency) {
    const sr = relationalResponse();
    return {
      nextState: 'RELATIONAL_BOUNDARY',
      assistantMessage: sr.message,
      uiActions: [],
      possibleOutcome: null,
      safety: { flow: sr.flow, level: sr.level },
      close: false,
      blockMemory: noMemory,
      memoryProposals: [],
      insightCandidate: null,
      event: 'RELATIONAL_DEPENDENCY_SIGNAL',
      selectedAction: 'REFLECT',
      reasonCodes: ['RELATIONAL'],
      interrupted: true,
    };
  }

  // ---------- PRIORITY 6: STATE MACHINE + MODEL ----------
  // Deterministic flow cho các state khởi tạo (ENTRY/CONSENT/RETURN_SESSION) — do backend
  // điều khiển bằng event, không phụ thuộc model (tránh fallback vòng ở ENTRY).
  const deterministic = handleDeterministic(session.current_state);
  if (deterministic) {
    return {
      nextState: deterministic.nextState,
      assistantMessage: deterministic.message,
      uiActions: deterministic.uiActions ?? [],
      possibleOutcome: null,
      safety: baseSafety,
      close: deterministic.nextState === 'CLOSE',
      blockMemory: noMemory,
      memoryProposals: [],
      insightCandidate: null,
      event: deterministic.event,
      selectedAction: 'ASK',
      reasonCodes: ['DETERMINISTIC'],
      interrupted: false,
    };
  }

  // Deterministic choice handler: ở các state người dùng ra quyết định, map lựa chọn → event
  // (backend quyết định, không để model đoán ý người dùng).
  const choice = handleUserChoice(session.current_state, ctx.message ?? '', signals);
  if (choice) {
    return {
      nextState: choice.nextState,
      assistantMessage: choice.message,
      uiActions: canonicalUiActions(choice.nextState, []),
      possibleOutcome: choice.possibleOutcome ?? null,
      safety: baseSafety,
      close: choice.nextState === 'CLOSE',
      blockMemory: noMemory,
      memoryProposals: [],
      insightCandidate: null,
      event: choice.event,
      selectedAction: 'PROPOSE',
      reasonCodes: ['USER_CHOICE'],
      interrupted: false,
    };
  }

  const allowedNextStates = computeAllowedNextStates(session.current_state);
  const gatewayCtx: GatewayContext = {
    currentState: session.current_state,
    allowedNextStates,
    allowedActions: ALLOWED_ACTIONS,
    controlFlags: {
      user_stop: false,
      no_memory: noMemory,
      low_energy: signals.low_energy,
      topic_change: signals.topic_change,
    },
    recentTurns: ctx.recentTurns,
    userMessage: ctx.message ?? '',
    evidenceIds: ctx.availableEvidenceIds,
    repairRules: ctx.repairRules,
  };

  const output = await generateWithGuard(ctx.provider, gatewayCtx, {
    availableEvidenceIds: ctx.availableEvidenceIds,
    repairRules: ctx.repairRules,
    noMemory,
  });

  // Model KHÔNG được đề xuất event interrupt toàn cục (chỉ classifier mới kích hoạt).
  const FORBIDDEN_MODEL_EVENTS = new Set([
    'USER_STOP', 'HIGH_STAKES_NO_CRISIS', 'RELATIONAL_DEPENDENCY_SIGNAL', 'SAFETY_SIGNAL_S2_S3',
  ]);
  if (FORBIDDEN_MODEL_EVENTS.has(output.event)) {
    output.event = 'NOOP';
    output.proposed_next_state = session.current_state;
  }

  // Validate transition theo guard (backend quyết định cuối cùng)
  const vt = validateTransition({
    session: {
      current_state: session.current_state,
      user_requested_stop: session.user_requested_stop,
      memory_mode: session.memory_mode,
      question_count_since_reflection: session.question_count_since_reflection,
      focus_confirmation_status: session.focus_confirmation_status,
      possible_outcome: session.possible_outcome,
      safety_level: session.safety_level,
      advice_permission_scope: session.advice_permission_scope,
    },
    flags: {
      hypothesisLanguage: true,
      questionBudgetOk: session.question_count_since_reflection < 2,
      hasPossibleOutcome: !!output.possible_outcome,
      insightVerified: session.current_state === 'OUTCOME_SELECTION',
      fiveFieldsComplete: true,
    },
    event: output.event,
  });

  // Nếu model đề xuất event không hợp lệ → giữ nguyên state (fallback), log violation.
  const nextState: ConversationState = vt.ok && vt.nextState ? vt.nextState : session.current_state;

  return {
    nextState,
    assistantMessage: output.assistant_message,
    uiActions: canonicalUiActions(nextState, output.ui_actions),
    possibleOutcome: output.possible_outcome,
    safety: baseSafety,
    close: nextState === 'CLOSE',
    blockMemory: noMemory,
    memoryProposals: noMemory ? [] : output.memory_proposals,
    insightCandidate: output.insight_candidate,
    event: output.event,
    selectedAction: output.selected_action,
    reasonCodes: output.internal_reason_codes,
    interrupted: false,
    guardViolation: vt.ok ? undefined : vt.reason,
  };
}

/** Nút lựa chọn chuẩn theo state (Phần 7 UX). Backend quyết định, không phụ thuộc model. */
function canonicalUiActions(state: ConversationState, fromModel: UiAction[]): UiAction[] {
  switch (state) {
    case 'VERIFY':
      return [{ type: 'VERIFY_CHOICES', options: ['Đúng với tôi', 'Đúng một phần', 'Chưa đúng'] }];
    case 'CURRENT_FOCUS_CONFIRMATION':
      return [{ type: 'FOCUS_CHOICES', options: ['Đúng, đây là trọng tâm', 'Muốn chỉnh lại', 'Chưa chắc'] }];
    case 'OUTCOME_SELECTION':
      return [{ type: 'OUTCOME_CHOICES', options: ['Dừng với điều vừa rõ', 'Khám phá thêm', 'Xem vài hướng'] }];
    case 'SESSION_OUTCOME_CHECKPOINT':
      return [{ type: 'CHECKPOINT_CHOICES', options: ['Giữ lại', 'Chỉnh lại', 'Tiếp tục', 'Đổi trọng tâm', 'Kết thúc'] }];
    case 'SESSION_FEEDBACK':
      return [{ type: 'FEEDBACK_CHOICES', options: ['Rõ hơn', 'Rõ hơn một phần', 'Như cũ', 'Rối hơn', 'Bỏ qua'] }];
    case 'EXPLORE_OPTIONS':
      return fromModel.length ? fromModel : [{ type: 'OPTIONS', options: [] }];
    default:
      return fromModel;
  }
}

/** Gọi provider + Quality Guard, retry 1 lần, rồi fallback (Phần 6). */
async function generateWithGuard(
  provider: AiProvider,
  gatewayCtx: GatewayContext,
  guardOpts: { availableEvidenceIds: string[]; repairRules: string[]; noMemory: boolean },
): Promise<StructuredOutput> {
  for (let attempt = 0; attempt < 2; attempt++) {
    let raw: string;
    try {
      raw = await provider.generate(gatewayCtx);
    } catch {
      // provider lỗi/timeout → thử lại 1 lần rồi fallback
      if (attempt === 0) continue;
      return safeFallback(gatewayCtx.currentState);
    }
    const guard = runQualityGuard({
      raw,
      currentState: gatewayCtx.currentState,
      allowedNextStates: gatewayCtx.allowedNextStates,
      controlFlags: { user_stop: gatewayCtx.controlFlags.user_stop, no_memory: guardOpts.noMemory },
      availableEvidenceIds: guardOpts.availableEvidenceIds,
      repairRules: guardOpts.repairRules,
    });
    if (guard.ok) return guard.output;
    // guard fail lần 1 → retry; lần 2 → fallback
  }
  return safeFallback(gatewayCtx.currentState);
}

export { buildMockOutput, findTransition };

interface DeterministicResult {
  nextState: ConversationState;
  message: string;
  event: string;
  uiActions?: UiAction[];
}

/** Flow khởi tạo do backend điều khiển (T002/T004). Trả null nếu state không thuộc nhóm này. */
function handleDeterministic(state: ConversationState): DeterministicResult | null {
  switch (state) {
    case 'ENTRY':
      // Phiên đầu, không crisis → CONSENT (T002)
      return {
        nextState: 'CONSENT',
        message:
          'Trước khi bắt đầu: điều bạn chia sẻ ở đây là của bạn. Bạn có thể dừng bất cứ lúc nào, và chọn ' +
          'việc Life Lab có nhớ gì cho lần sau hay không. Khi bạn sẵn sàng, hãy cho mình biết điều gì đang quan trọng với bạn lúc này.',
        event: 'NO_CRISIS_FIRST_SESSION',
      };
    case 'CONSENT':
      // Đồng ý tiếp tục → WHAT_MATTERS_NOW (T004)
      return {
        nextState: 'WHAT_MATTERS_NOW',
        message: 'Mình đang nghe. Điều gì đang chiếm nhiều tâm trí bạn nhất lúc này?',
        event: 'AGREE_CONTINUE',
      };
    case 'RETURN_SESSION':
      return {
        nextState: 'WHAT_MATTERS_NOW',
        message: 'Rất vui được gặp lại bạn. Hôm nay điều gì đang quan trọng với bạn?',
        event: 'HAS_CURRENT_TOPIC',
      };
    default:
      return null;
  }
}

interface ChoiceResult {
  nextState: ConversationState;
  message: string;
  event: string;
  possibleOutcome?: OutcomeType;
}

const has = (t: string, ...keys: string[]) => keys.some((k) => t.includes(k));

/**
 * Map lựa chọn của người dùng ở các state quyết định sang event canonical.
 * Nhận cả text nút bấm lẫn câu gõ tự do tương đương.
 */
function handleUserChoice(
  state: ConversationState,
  messageRaw: string,
  signals: { correction: boolean },
): ChoiceResult | null {
  const t = messageRaw.toLowerCase().normalize('NFC').trim();
  if (!t) return null;

  switch (state) {
    case 'VERIFY': {
      if (has(t, 'đúng một phần', 'một phần')) return { nextState: 'REPAIR', event: 'PARTIAL_OR_WRONG', message: 'Cảm ơn bạn đã nói rõ. Phần nào chưa đúng để mình hiểu lại cùng bạn?' };
      if (has(t, 'chưa đúng', 'không đúng', 'sai')) return { nextState: 'REPAIR', event: 'PARTIAL_OR_WRONG', message: 'Cảm ơn bạn đã sửa. Mình bỏ cách hiểu cũ nhé — bạn thấy đúng hơn thì nên nói thế nào?' };
      if (has(t, 'đúng', 'phải rồi', 'chuẩn')) return { nextState: 'CURRENT_FOCUS_DISCOVERY', event: 'CORRECT_ENOUGH', message: 'Cảm ơn bạn. Khi nghĩ đến bước tiếp theo, điều gì đang là trọng tâm bạn muốn nhìn rõ lúc này?' };
      return null;
    }
    case 'CURRENT_FOCUS_CONFIRMATION': {
      if (has(t, 'đúng', 'trọng tâm', 'phải')) return { nextState: 'OUTCOME_SELECTION', event: 'CONFIRM', message: 'Vậy mình cùng chốt trọng tâm này nhé. Bây giờ bạn muốn làm gì tiếp?' };
      if (has(t, 'chỉnh', 'sửa', 'không phải')) return { nextState: 'REPAIR', event: 'EDIT', message: 'Được, mình chỉnh lại cùng bạn. Trọng tâm thật sự bạn muốn nhìn là gì?' };
      if (has(t, 'chưa chắc', 'không biết', 'phân vân')) return { nextState: 'CONTINUE_EXPLORATION', event: 'UNSURE', message: 'Không sao, mình cứ khám phá thêm một chút nhé.' };
      return null;
    }
    case 'OUTCOME_SELECTION': {
      if (has(t, 'dừng với điều', 'giữ điều', 'điều vừa rõ', 'chốt'))
        return { nextState: 'CONFIRMED_INSIGHT', event: 'STOP_WITH_INSIGHT', message: 'Mình ghi lại điều bạn vừa làm rõ như một insight bạn xác nhận.', possibleOutcome: 'CONFIRMED_INSIGHT' };
      if (has(t, 'câu hỏi', 'mang theo'))
        return { nextState: 'BETTER_QUESTION', event: 'STOP_WITH_QUESTION', message: 'Mình giữ lại câu hỏi này để bạn mang theo.', possibleOutcome: 'BETTER_QUESTION' };
      if (has(t, 'khám phá thêm', 'tiếp tục', 'thêm'))
        return { nextState: 'CONTINUE_EXPLORATION', event: 'CONTINUE_EXPLORE', message: 'Được, mình đi sâu thêm một lớp nữa nhé. Điều gì khiến bạn chú ý nhất lúc này?' };
      if (has(t, 'hướng', 'lời khuyên', 'gợi ý', 'xem vài hướng'))
        return { nextState: 'PERMISSION_BEFORE_ADVICE', event: 'WANTS_DIRECTIONS', message: 'Trước khi mình gợi ý vài hướng, bạn có muốn nghe góc nhìn của mình không?' };
      if (has(t, 'bước nhỏ', 'làm gì'))
        return { nextState: 'MEANINGFUL_NEXT_STEP', event: 'WANTS_SMALL_STEP', message: 'Bạn muốn chọn một bước nhỏ nào để thử?', possibleOutcome: 'MEANINGFUL_NEXT_STEP' };
      if (has(t, 'thử nghiệm', 'kiểm chứng', 'thử'))
        return { nextState: 'LIFE_EXPERIMENT', event: 'WANTS_EXPERIMENT', message: 'Mình cùng thiết kế một thử nghiệm nhỏ, an toàn nhé.', possibleOutcome: 'LIFE_EXPERIMENT' };
      if (has(t, 'suy nghĩ', 'tạm dừng', 'để sau'))
        return { nextState: 'REFLECTIVE_PAUSE', event: 'STOP_TO_THINK', message: 'Hoàn toàn ổn khi dừng lại để ngẫm. Điều vừa rồi đã là một bước có giá trị.', possibleOutcome: 'REFLECTIVE_PAUSE' };
      return null;
    }
    case 'CONFIRMED_INSIGHT':
      return { nextState: 'SESSION_OUTCOME_CHECKPOINT', event: 'CONTENT_CONFIRMED', message: 'Mình phản chiếu lại điều bạn giữ: bạn muốn nhìn rõ hơn nhu cầu phát triển của mình. Bạn muốn giữ lại, chỉnh, tiếp tục, đổi trọng tâm hay kết thúc?', possibleOutcome: 'CONFIRMED_INSIGHT' };
    case 'BETTER_QUESTION':
      return { nextState: 'SESSION_OUTCOME_CHECKPOINT', event: 'QUESTION_CONFIRMED', message: 'Mình giữ lại câu hỏi này. Bạn muốn giữ, chỉnh, tiếp tục hay kết thúc?', possibleOutcome: 'BETTER_QUESTION' };
    case 'MEANINGFUL_NEXT_STEP':
      return { nextState: 'SESSION_OUTCOME_CHECKPOINT', event: 'STEP_CONFIRMED', message: 'Mình ghi lại bước nhỏ bạn chọn. Bạn muốn giữ, chỉnh, tiếp tục hay kết thúc?', possibleOutcome: 'MEANINGFUL_NEXT_STEP' };
    case 'REFLECTIVE_PAUSE':
      return { nextState: 'SESSION_OUTCOME_CHECKPOINT', event: 'USER_CONFIRMS_USEFUL', message: 'Mình giữ lại điều này cho bạn. Bạn muốn giữ, chỉnh hay kết thúc?', possibleOutcome: 'REFLECTIVE_PAUSE' };
    case 'SESSION_OUTCOME_CHECKPOINT': {
      if (has(t, 'giữ')) return { nextState: 'MEMORY_PERMISSION', event: 'KEEP_HAS_ELIGIBLE', message: 'Có một điều mình có thể nhớ cho lần sau. Bạn có muốn mình lưu không?' };
      if (has(t, 'tiếp tục')) return { nextState: 'CONTINUE_EXPLORATION', event: 'WANTS_CONTINUE', message: 'Được, mình đi tiếp một lớp nữa nhé.' };
      if (has(t, 'đổi trọng tâm', 'đổi')) return { nextState: 'CURRENT_FOCUS_DISCOVERY', event: 'CHANGE_FOCUS', message: 'Được, bạn muốn chuyển sang trọng tâm nào?' };
      if (has(t, 'kết thúc', 'xong', 'không lưu')) return { nextState: 'SESSION_FEEDBACK', event: 'KEEP_NOTHING_OR_NO_MEMORY', message: 'Cảm ơn bạn. Sau phiên này bạn thấy thế nào?' };
      return null;
    }
    case 'MEMORY_PERMISSION':
      return { nextState: 'SESSION_FEEDBACK', event: 'DECIDED_SAVE_OR_NOT', message: 'Cảm ơn bạn. Sau phiên này bạn thấy thế nào?' };
    default:
      return null;
  }
}
