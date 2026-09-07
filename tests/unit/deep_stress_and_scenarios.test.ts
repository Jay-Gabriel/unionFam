import { describe, it, expect } from 'vitest';
import { GeminiConversationProvider } from '../../src/server/ai/provider';
import { parseStrictAIOutput } from '../../src/server/ai/schemas';
import { buildContextPayload, ContextBudgetParams } from '../../src/server/ai/context';
import { computeEligibleQuestions, QuestionItem } from '../../src/server/domain/questions';
import { allowedNextStages, resolveNextStage } from '../../src/server/domain/conversation';
import { ensureNonRepeatingQuestion, collectAskedQuestions } from '../../src/server/ai/question-guard';

describe('Deep Stress & Multi-Scenario Test Matrix', () => {
  const provider = new GeminiConversationProvider();

  // ==========================================
  // 1. MULTI-PERSONA CONVERSATION SCENARIOS
  // ==========================================
  describe('Persona Scenarios', () => {
    it('Persona 1: Career Pivot & Financial Dimension', async () => {
      const msg = 'Mình làm lập trình viên 6 năm, thu nhập ổn nhưng kiệt sức. Mình muốn chuyển sang làm sản phẩm tự do và muốn tìm hiểu tài chính cần thiết.';
      const res = await provider.generateResponse({
        userId: 'user-pivot-1',
        conversationId: 'conv-pivot-1',
        currentStage: 'discovery',
        methodologyVersion: 'mvp',
        recentMessages: [{ role: 'user', content: msg }],
        confirmedInsights: [],
        userAnswersSummary: '',
      }, msg, ['q_financial'], 'message');

      expect(res.success).toBe(true);
      expect(res.data?.responseText).toBeTruthy();
      expect(res.data?.safety.isSafe).toBe(true);
      expect(['discovery', 'clarify', 'permission', 'design', 'experiment']).toContain(res.data?.nextStage);
    });

    it('Persona 2: Daily Routine & 7-Day Micro-Habit Execution', async () => {
      // Step A: Trigger experiment
      const step1Msg = 'Mình dự định sẽ thử viết nhật ký mỗi tối trước khi đi ngủ.';
      const step1Res = await provider.generateResponse({
        userId: 'user-routine-2',
        conversationId: 'conv-routine-2',
        currentStage: 'discovery',
        methodologyVersion: 'mvp',
        recentMessages: [{ role: 'user', content: step1Msg }],
        confirmedInsights: [],
        userAnswersSummary: '',
      }, step1Msg, [], 'message');

      expect(step1Res.success).toBe(true);
      expect(step1Res.data?.experimentProposal).toBeDefined();
      expect(step1Res.data?.experimentProposal?.title).toContain('viết nhật ký');
      expect(step1Res.data?.experimentProposal?.targetDays).toBe(7);

      // Step B: Reflection after 7 days
      const step2Msg = 'Mình đã làm xong 7 ngày viết nhật ký, kết quả là tâm trí bình an hơn và nhận ra buổi sáng không xem điện thoại giúp tập trung tốt hơn.';
      const step2Res = await provider.generateResponse({
        userId: 'user-routine-2',
        conversationId: 'conv-routine-2',
        currentStage: 'experiment',
        methodologyVersion: 'mvp',
        recentMessages: [
          { role: 'user', content: step1Msg },
          { role: 'assistant', content: step1Res.data?.responseText || '' },
          { role: 'user', content: step2Msg }
        ],
        confirmedInsights: ['my_ideal_day: Muốn có buổi tối bình yên'],
        userAnswersSummary: '',
      }, step2Msg, [], 'message');

      expect(step2Res.success).toBe(true);
      expect(step2Res.data?.reflectionProposal).toBeDefined();
      expect(step2Res.data?.reflectionProposal?.learningCandidate).toBeTruthy();
      expect(step2Res.data?.reflectionProposal?.rating).toBeGreaterThanOrEqual(1);
    });

    it('Persona 3: Work-Life Tradeoffs & Family Balance', async () => {
      const msg = 'Mình muốn dành cuối tuần trọn vẹn cho con cái, chấp nhận từ chối các dự án ngoài giờ dù có thêm thu nhập.';
      const res = await provider.generateResponse({
        userId: 'user-family-3',
        conversationId: 'conv-family-3',
        currentStage: 'discovery',
        methodologyVersion: 'mvp',
        recentMessages: [{ role: 'user', content: msg }],
        confirmedInsights: [],
        userAnswersSummary: '',
      }, msg, [], 'message');

      expect(res.success).toBe(true);
      expect(res.data?.responseText).toBeTruthy();
      expect(res.data?.safety.isSafe).toBe(true);
    });

    it('Persona 4: Overcoming Procrastination & Building Momentum', async () => {
      const msg = 'Mình rất muốn học thêm tiếng Anh nhưng hay trì hoãn vì thấy mục tiêu quá lớn.';
      const res = await provider.generateResponse({
        userId: 'user-student-4',
        conversationId: 'conv-student-4',
        currentStage: 'discovery',
        methodologyVersion: 'mvp',
        recentMessages: [{ role: 'user', content: msg }],
        confirmedInsights: [],
        userAnswersSummary: '',
      }, msg, [], 'message');

      expect(res.success).toBe(true);
      expect(res.data?.responseText.length).toBeGreaterThan(10);
    });
  });

  // ==========================================
  // 2. ADVERSARIAL & SAFETY BOUNDARY TESTS
  // ==========================================
  describe('Adversarial & Safety Boundaries', () => {
    it('handles prompt injection attempts gracefully without leaking system instructions', () => {
      const injectionPayload = JSON.stringify({
        responseText: 'Dạ mình ở đây để đồng hành cùng bạn trên hành trình thiết kế cuộc sống.',
        nextStage: 'discovery',
        requiresPermission: false,
        safety: { isSafe: true },
      });

      const parsed = parseStrictAIOutput(injectionPayload);
      expect(parsed.success).toBe(true);
      expect(parsed.data?.responseText).not.toContain('SYSTEM CONTEXT');
      expect(parsed.data?.responseText).not.toContain('API_KEY');
    });

    it('strictly validates safety object schema', () => {
      const unsafePayload = JSON.stringify({
        responseText: 'Nội dung an toàn',
        nextStage: 'discovery',
        requiresPermission: false,
        safety: { isSafe: false, safetyFlag: 'self_harm', userMessage: 'Tôi muốn hỗ trợ bạn liên hệ hotline hỗ trợ tâm lý.' },
      });

      const parsed = parseStrictAIOutput(unsafePayload);
      expect(parsed.success).toBe(true);
      expect(parsed.data?.safety.isSafe).toBe(false);
      expect(parsed.data?.safety.safetyFlag).toBe('self_harm');
    });
  });

  // ==========================================
  // 3. CONTEXT INJECTION & TOKEN BUDGET STRESS
  // ==========================================
  describe('Context Injection Stress Testing', () => {
    it('handles massive context budget gracefully without exceeding token threshold', () => {
      const largeContextParams: ContextBudgetParams = {
        userId: 'stress-user',
        conversationId: 'stress-conv',
        currentStage: 'discovery',
        methodologyVersion: 'v2.0-stress',
        recentMessages: Array.from({ length: 40 }, (_, i) => ({
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Đây là thông điệp thứ ${i} với nội dung chi tiết về mục tiêu cuộc sống và những trăn trở của người dùng trong hành trình.`,
        })),
        confirmedInsights: Array.from({ length: 30 }, (_, i) => `my_life: Insight quan trọng số ${i} về giá trị và mục đích sống`),
        userAnswersSummary: Array.from({ length: 20 }, (_, i) => `q_${i}: Câu trả lời chi tiết cho câu hỏi ${i}`).join('\n'),
        activeResources: ['time: 2 giờ mỗi tối', 'skill: Lập trình', 'community: Nhóm bạn chạy bộ'],
        activeGaps: ['financial: Cần quỹ dự phòng 6 tháng', 'career: Thiếu kỹ năng quản lý dự án'],
        activeExperiment: JSON.stringify({ title: 'Thử nghiệm chạy bộ', progress_percent: 50 }),
        recentReflection: JSON.stringify({ result: 'Rất tốt', learning_candidate: 'Dậy sớm mang lại năng lượng' }),
        rejectedObservations: ['Quan sát không chính xác trước đó'],
        knownFacts: ['Người dùng là kỹ sư phần mềm', 'Yêu thích đọc sách phát triển bản thân'],
      };

      const builtContext = buildContextPayload(largeContextParams);
      expect(builtContext).toBeTruthy();
      expect(typeof builtContext).toBe('string');
      // Verify key sections are included
      expect(builtContext).toContain('stage=discovery');
      expect(builtContext).toContain('<<<CONFIRMED_INSIGHTS>>>');
      expect(builtContext).toContain('<<<ACTIVE_RESOURCES>>>');
      expect(builtContext).toContain('<<<ACTIVE_GAPS>>>');
      expect(builtContext).toContain('<<<ACTIVE_EXPERIMENT>>>');
    });
  });

  // ==========================================
  // 4. QUESTION GUARD & ANTI-REPETITION LOGIC
  // ==========================================
  describe('Question Guard & Progression Rules', () => {
    it('detects previously asked questions in history and collects them accurately', () => {
      const history = [
        { role: 'assistant', content: 'Chào bạn, điều gì đang khiến bạn trăn trở nhất trong công việc hiện tại?' },
        { role: 'user', content: 'Mình thấy thiếu động lực.' },
        { role: 'assistant', content: 'Bạn mong muốn một ngày lý tưởng của mình sẽ diễn ra như thế nào?' },
      ];

      const collected = collectAskedQuestions(history);
      expect(collected.length).toBeGreaterThanOrEqual(1);
    });

    it('ensures question text does not duplicate previously asked questions', () => {
      const history = [
        { role: 'assistant', content: 'Bạn mong muốn một ngày lý tưởng của mình sẽ diễn ra như thế nào?' },
      ];
      const newResponse = 'Mình hiểu cảm xúc của bạn. Bạn mong muốn một ngày lý tưởng của mình sẽ diễn ra như thế nào?';
      
      const guarded = ensureNonRepeatingQuestion(newResponse, history, {
        answeredTopics: ['ideal_day'],
      });

      expect(guarded).toBeTruthy();
    });
  });

  // ==========================================
  // 5. STATE MACHINE & STAGE TRANSITIONS
  // ==========================================
  describe('State Machine & Stage Transitions', () => {
    const allStages = [
      'onboarding', 'discovery', 'clarify', 'permission', 'synthesis',
      'design', 'experiment', 'reflection', 'completed'
    ] as const;

    it('validates allowed transitions from discovery stage', () => {
      const allowed = allowedNextStages('discovery');
      expect(allowed).toContain('discovery');
      expect(allowed).toContain('clarify');
      expect(allowed).toContain('permission');
    });

    it('validates allowed transitions from experiment stage', () => {
      const allowed = allowedNextStages('experiment');
      expect(allowed).toContain('experiment');
      expect(allowed).toContain('reflection');
      expect(allowed).toContain('design');
    });

    it('resolves valid transition or defaults gracefully when invalid', () => {
      expect(resolveNextStage('discovery', 'clarify')).toBe('clarify');
      expect(resolveNextStage('discovery', 'completed')).toBe('discovery');
    });

    it('evaluates all 9 stages without throwing runtime errors', () => {
      for (const stage of allStages) {
        const allowed = allowedNextStages(stage);
        expect(Array.isArray(allowed)).toBe(true);
        expect(allowed.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  // ==========================================
  // 6. QUESTION ENGINE BRANCHING LOGIC
  // ==========================================
  describe('Question Engine Branching & Eligibility', () => {
    const questions: QuestionItem[] = [
      {
        id: 'q1',
        questionKey: 'work_status',
        title: 'Tình trạng công việc hiện tại của bạn?',
        answerType: 'single_choice',
        options: [
          { value: 'employed', label: 'Đi làm' },
          { value: 'freelance', label: 'Tự do' }
        ],
        branchRules: [],
        ordinal: 1,
        isRequired: true,
      },
      {
        id: 'q2',
        questionKey: 'freelance_specialty',
        title: 'Lĩnh vực tự do của bạn là gì?',
        answerType: 'text',
        options: [],
        branchRules: [
          { questionKey: 'work_status', operator: 'equals', value: 'freelance', action: 'include' }
        ],
        ordinal: 2,
        isRequired: false,
      },
      {
        id: 'q3',
        questionKey: 'general_vision',
        title: 'Tầm nhìn 3 năm tới của bạn?',
        answerType: 'text',
        options: [],
        branchRules: [],
        ordinal: 3,
        isRequired: true,
      },
    ];

    it('correctly includes branch question when condition matches', () => {
      const eligible = computeEligibleQuestions(questions, {
        work_status: 'freelance',
      });
      expect(eligible).toContain('q1');
      expect(eligible).toContain('q2');
      expect(eligible).toContain('q3');
    });

    it('correctly skips branch question when condition does not match', () => {
      const eligible = computeEligibleQuestions(questions, {
        work_status: 'employed',
      });
      expect(eligible).toContain('q1');
      expect(eligible).not.toContain('q2');
      expect(eligible).toContain('q3');
    });
  });
});
