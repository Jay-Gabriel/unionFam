/**
 * Safety & Control Intent Classifier — Life Lab V8.7.2 (Phần 4 taxonomy + Phần 6 classifier output).
 *
 * MVP dùng rule-based classifier (deterministic, test được, fail-closed) kết hợp hook AI
 * tùy chọn. Rule-based cho phép Safety hoạt động ĐỘC LẬP với provider/queue (Phần 5: Safety
 * interrupt không phụ thuộc job nền) và luôn chạy được không cần credential.
 *
 * Thận trọng: thà over-detect ở mức an toàn hơn bỏ sót, nhưng tôn trọng S01 (mệt/nghỉ không
 * phải crisis).
 */
import type { ClassifierOutput, SafetyLevel } from '@lifelab/contract';

const norm = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();

// ---- USER_STOP ----
const STOP_PATTERNS = [
  'dừng lại', 'dừng lại đi', 'dừng thôi', 'thôi dừng', 'không hỏi nữa',
  'đừng hỏi nữa', 'dừng phiên', 'kết thúc phiên', 'ngừng lại', 'stop',
  'tôi muốn dừng', 'mình muốn dừng', 'muốn dừng lại', 'không muốn tiếp tục',
  'không muốn nói nữa', 'thôi nhé', 'dừng ở đây thôi',
];

/** Cụm cho thấy người dùng muốn GIỮ kết quả / chốt outcome — KHÔNG phải stop khẩn. */
const KEEP_RESULT_HINTS = [
  'giữ điều', 'giữ lại điều', 'điều vừa rõ', 'điều này', 'giữ kết quả',
  'chốt lại', 'dừng với điều', 'dừng ở điều', 'như vậy là đủ', 'đủ cho hôm nay',
];

// ---- S3 immediate risk: kế hoạch/phương tiện/tức thời ----
const S3_PATTERNS = [
  'tự tử', 'tự sát', 'kết thúc cuộc đời', 'kết liễu', 'chết đi cho xong',
  'muốn chết', 'sẽ chết', 'uống hết thuốc', 'nhảy lầu', 'cắt tay', 'treo cổ',
  'kế hoạch tự', 'giết', 'làm hại người', 'cầm dao', 'đang chảy máu',
];

// ---- S2 ambiguous risk ----
const S2_PATTERNS = [
  'biến mất', 'không muốn tồn tại', 'không muốn sống', 'vô nghĩa khi sống',
  'không thiết sống', 'buông xuôi', 'không muốn thức dậy', 'tốt hơn khi không có tôi',
  'làm đau bản thân', 'tự làm đau',
];

// ---- S1 distress (không nguy cơ rõ) ----
const S1_PATTERNS = [
  'mệt mỏi', 'kiệt sức', 'buồn', 'tuyệt vọng', 'bế tắc', 'áp lực', 'căng thẳng',
  'khóc', 'cô đơn', 'lo lắng', 'stress',
];

// ---- High stakes (y tế / pháp lý / tài chính) ----
const HIGH_STAKES_MED = ['ngừng thuốc', 'bỏ thuốc', 'liều thuốc', 'chẩn đoán', 'bệnh', 'phẫu thuật', 'uống thuốc gì'];
const HIGH_STAKES_LEGAL = ['ký hợp đồng', 'kiện', 'ly hôn', 'luật sư', 'pháp lý', 'thừa kế'];
const HIGH_STAKES_FIN = ['vay nợ', 'đầu tư hết', 'bán nhà', 'cầm cố', 'khoản vay', 'phá sản'];

// ---- Relational dependency ----
const RELATIONAL_PATTERNS = [
  'chỉ bạn mới hiểu tôi', 'chỉ có bạn hiểu', 'bạn là tất cả', 'không ai hiểu tôi như bạn',
  'tôi chỉ cần bạn', 'đừng rời bỏ tôi', 'bạn là người duy nhất', 'yêu bạn', 'bạn là bạn thân nhất',
];

// ---- NO_MEMORY request ----
const NO_MEMORY_PATTERNS = ['đừng nhớ', 'không lưu', 'đừng lưu', 'không ghi nhớ', 'xóa hết', 'không nhớ gì'];

// ---- Correction ----
const CORRECTION_PATTERNS = ['không đúng', 'sai rồi', 'không phải vậy', 'ý tôi không phải', 'bạn hiểu sai', 'chưa đúng', 'không hẳn'];

// ---- Low energy ----
const LOW_ENERGY_PATTERNS = ['không biết', 'không có', 'cả hai', 'không muốn nói', 'tùy', 'sao cũng được', 'mệt'];

function matchesAny(text: string, patterns: string[]): string[] {
  return patterns.filter((p) => text.includes(p));
}

/**
 * Match có ranh giới từ: tránh "thôi" trong "cần bạn thôi" (filler) bị coi là STOP,
 * và tránh nhầm "đừng" với "dừng". Pattern nhiều từ dùng includes bình thường.
 */
function matchesStop(text: string, patterns: string[]): string[] {
  const padded = ` ${text} `;
  return patterns.filter((p) => {
    if (p.includes(' ')) return text.includes(p); // cụm từ: an toàn
    // từ đơn: cần đứng tách bạch, và phải là tín hiệu dừng rõ (có "tôi"/"mình"/đầu câu)
    const re = new RegExp(`(^| )${escapeRe(p)}( |$)`);
    if (!re.test(padded)) return false;
    // loại filler: "thôi" cuối câu sau danh từ không phải lệnh dừng mạnh
    if (p === 'thôi' && !/\b(dừng|nghỉ|đủ|kết thúc)\b/.test(text)) return false;
    return true;
  });
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function classify(messageRaw: string | null | undefined): ClassifierOutput {
  const text = norm(messageRaw ?? '');

  const s3 = matchesAny(text, S3_PATTERNS);
  const s2 = matchesAny(text, S2_PATTERNS);
  const s1 = matchesAny(text, S1_PATTERNS);

  let level: SafetyLevel = 'S0';
  let signals: string[] = [];
  if (s3.length > 0) {
    level = 'S3';
    signals = s3;
  } else if (s2.length > 0) {
    level = 'S2';
    signals = s2;
  } else if (s1.length > 0) {
    level = 'S1';
    signals = s1;
  }

  const crisisDetected = level === 'S2' || level === 'S3';

  const medical = matchesAny(text, HIGH_STAKES_MED);
  const legal = matchesAny(text, HIGH_STAKES_LEGAL);
  const financial = matchesAny(text, HIGH_STAKES_FIN);
  let highStakesDomain: string | null = null;
  if (medical.length) highStakesDomain = 'MEDICAL';
  else if (legal.length) highStakesDomain = 'LEGAL';
  else if (financial.length) highStakesDomain = 'FINANCIAL';

  return {
    crisis: {
      detected: crisisDetected,
      level,
      signals,
      confidence: crisisDetected ? 0.9 : level === 'S1' ? 0.6 : 0.95,
    },
    user_stop:
      matchesStop(text, STOP_PATTERNS).length > 0 &&
      matchesAny(text, KEEP_RESULT_HINTS).length === 0,
    high_stakes: { detected: highStakesDomain !== null, domain: highStakesDomain },
    relational_dependency: matchesAny(text, RELATIONAL_PATTERNS).length > 0,
    no_memory: matchesAny(text, NO_MEMORY_PATTERNS).length > 0,
    correction: matchesAny(text, CORRECTION_PATTERNS).length > 0,
    topic_change: false,
    low_energy: matchesAny(text, LOW_ENERGY_PATTERNS).length > 0,
  };
}
