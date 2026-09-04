import { describe, it, expect } from 'vitest';
import { parseStrictAIOutput, AIStructuredOutputSchema } from '../../src/server/ai/schemas';

describe('AI Structured Output & Schema Validation', () => {
  it('should parse valid structured output JSON', () => {
    const raw = JSON.stringify({
      responseText: 'Chào bạn, Life Lab đã nhận phản hồi.',
      nextStage: 'initial_exploration',
      observationProposal: {
        dimension: 'my_life',
        observationType: 'insight_candidate',
        contentOriginal: 'Bạn coi trọng tự do sáng tạo.',
        confidence: 0.9,
      },
    });

    const parsed = parseStrictAIOutput(raw);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.responseText).toContain('Life Lab');
    expect(parsed.data?.observationProposal?.dimension).toBe('my_life');
  });

  it('should reject malformed JSON without producing business record', () => {
    const raw = 'This is raw unformatted text response from AI';
    const result = parseStrictAIOutput(raw);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('AI_SCHEMA_INVALID');
  });

  it('normalizes Gemini reflection/question fields into the server contract', () => {
    const raw = JSON.stringify({
      reflection: 'Mình nghe thấy bạn đang ưu tiên gia đình.',
      question: 'Điều gì đang cản trở bạn dành thời gian cho gia đình?',
      nextQuestionId: 'q1_life_focus',
    });

    const result = parseStrictAIOutput(raw, ['q1_life_focus']);
    expect(result.success).toBe(true);
    expect(result.data?.responseText).toContain('ưu tiên gia đình');
    expect(result.data?.responseText).toContain('Điều gì đang cản trở');
  });

  it('correctly parses and normalizes experiment, reflection, and resource proposals', () => {
    const raw = JSON.stringify({
      responseText: 'Mình cùng thử nghiệm bước nhỏ này nhé.',
      nextStage: 'experiment',
      experimentProposal: {
        title: 'Thử nghiệm đi bộ 15 phút mỗi sáng',
        hypothesis: 'Đi bộ sáng sớm giúp tăng năng lượng cho cả ngày.',
        smallestStep: 'Đặt giày chạy cạnh cửa tối nay.',
        successSignal: 'Thực hiện 3 ngày liên tiếp.',
        targetDays: 7,
        dimension: 'my_life',
      },
      reflectionProposal: {
        result: 'Đã hoàn thành 3 ngày đi bộ.',
        learningCandidate: 'Buổi sáng năng lượng hơn khi bắt đầu sớm.',
        feeling: 'Sảng khoái và phấn chấn.',
        nextAction: 'Tăng lên 20 phút tuần tới.',
        rating: 5,
        experimentTitle: 'Thử nghiệm đi bộ 15 phút',
      },
      resourceProposal: {
        name: 'Thời gian tĩnh tâm 30 phút mỗi sáng',
        resourceType: 'time',
        dimension: 'my_ideal_day',
        description: 'Khoảng thời gian riêng trước khi gia đình thức dậy.',
      },
    });

    const result = parseStrictAIOutput(raw);
    expect(result.success).toBe(true);
    expect(result.data?.experimentProposal?.title).toBe('Thử nghiệm đi bộ 15 phút mỗi sáng');
    expect(result.data?.experimentProposal?.targetDays).toBe(7);
    expect(result.data?.reflectionProposal?.learningCandidate).toContain('Buổi sáng năng lượng hơn');
    expect(result.data?.reflectionProposal?.rating).toBe(5);
    expect(result.data?.resourceProposal?.name).toBe('Thời gian tĩnh tâm 30 phút mỗi sáng');
    expect(result.data?.resourceProposal?.resourceType).toBe('time');
  });
});
