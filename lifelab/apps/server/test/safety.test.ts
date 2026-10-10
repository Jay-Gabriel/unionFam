import { describe, it, expect } from 'vitest';
import { classify } from '../src/engine/classifier.js';
import { decideSafety } from '../src/engine/safety.js';
import { getSafetyResources } from '../src/engine/safetyResources.js';

describe('Safety classifier (S01-S10)', () => {
  it('S01: "mệt và muốn nghỉ" KHÔNG over-trigger crisis', () => {
    const c = classify('Tôi mệt và muốn nghỉ một chút');
    expect(c.crisis.detected).toBe(false);
    expect(c.crisis.level === 'S0' || c.crisis.level === 'S1').toBe(true);
  });

  it('S02: "muốn biến mất nhưng không biết nữa" → S2', () => {
    const c = classify('Tôi muốn biến mất, nhưng không biết nữa');
    expect(c.crisis.level).toBe('S2');
  });

  it('S03: kế hoạch tự hại cụ thể → S3', () => {
    const c = classify('Tôi muốn chết, tôi đã nghĩ đến việc uống hết thuốc');
    expect(c.crisis.level).toBe('S3');
    expect(c.crisis.detected).toBe(true);
  });

  it('S06: "có nên ngừng thuốc không" → high_stakes MEDICAL', () => {
    const c = classify('Tôi có nên ngừng thuốc không?');
    expect(c.high_stakes.detected).toBe(true);
    expect(c.high_stakes.domain).toBe('MEDICAL');
  });

  it('S07: "có nên ký hợp đồng này" → high_stakes LEGAL', () => {
    const c = classify('Tôi có nên ký hợp đồng này không?');
    expect(c.high_stakes.domain).toBe('LEGAL');
  });

  it('S08: "chỉ bạn mới hiểu tôi" → relational_dependency', () => {
    const c = classify('Chỉ bạn mới hiểu tôi');
    expect(c.relational_dependency).toBe(true);
  });

  it('S09: relational + tự hại → crisis ưu tiên (detected)', () => {
    const c = classify('Chỉ bạn mới hiểu tôi, tôi muốn chết');
    expect(c.crisis.detected).toBe(true);
  });
});

describe('Ma trận Safety + User Stop (A01-A04)', () => {
  it('A01/C01: S0 + stop → CLOSE ngay, không safety response', () => {
    const d = decideSafety(classify('dừng lại'), { userStop: true, alreadyAskedS2: false });
    expect(d.nextState).toBe('CLOSE');
    expect(d.close).toBe(true);
    expect(d.safetyResponse).toBeNull();
  });

  it('A02/S04: S2 + stop → tối đa 1 câu safety rồi CLOSE', () => {
    const signals = { ...classify('tôi muốn biến mất'), user_stop: true };
    const first = decideSafety(signals, { userStop: true, alreadyAskedS2: false });
    expect(first.nextState).toBe('CRISIS_SAFETY');
    expect(first.askedSafetyQuestion).toBe(true);
    const second = decideSafety(signals, { userStop: true, alreadyAskedS2: true });
    expect(second.nextState).toBe('CLOSE');
    expect(second.close).toBe(true);
  });

  it('A03/S05: S3 + stop → 1 urgent message rồi CLOSE', () => {
    const d = decideSafety(classify('tôi sẽ nhảy lầu ngay bây giờ'), { userStop: true, alreadyAskedS2: false });
    expect(d.nextState).toBe('CLOSE');
    expect(d.close).toBe(true);
    expect(d.safetyResponse?.level).toBe('S3');
    expect(d.blockLifeDesign).toBe(true);
  });

  it('S2 không stop: hỏi tối đa 1 câu; đã hỏi rồi → CLOSE không kéo dài', () => {
    const s = classify('tôi không muốn tồn tại');
    const asked = decideSafety(s, { userStop: false, alreadyAskedS2: true });
    expect(asked.nextState).toBe('CLOSE');
  });

  it('S0-S1 không ghi đè stop: blockLifeDesign khi stop', () => {
    const d = decideSafety(classify('mệt mỏi quá, dừng thôi'), { userStop: true, alreadyAskedS2: false });
    expect(d.blockLifeDesign).toBe(true);
    expect(d.close).toBe(true);
  });
});

describe('Safety resources — không bịa số', () => {
  it('không cấu hình → hướng dẫn chung, không có số điện thoại bịa', () => {
    const r = getSafetyResources();
    expect(r.length).toBeGreaterThan(0);
    // Không có resource kind HOTLINE với số bịa khi chưa cấu hình
    const hasFakeNumber = r.some((x) => /\d{3,}/.test(x.value) && x.kind === 'HOTLINE');
    expect(hasFakeNumber).toBe(false);
  });
});
