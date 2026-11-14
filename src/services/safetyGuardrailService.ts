const CRISIS_PATTERNS = [
  /tự tử/i,
  /tự hại/i,
  /muốn chết/i,
  /kết thúc cuộc sống/i,
  /biến mất khỏi cuộc đời/i,
  /không muốn sống nữa/i
];

export interface SafetyCheckResult {
  isCrisis: boolean;
  message?: string;
}

export const checkCrisisSafety = (text: string): SafetyCheckResult => {
  const isCrisis = CRISIS_PATTERNS.some(pattern => pattern.test(text));
  if (isCrisis) {
    return {
      isCrisis: true,
      message: 'Chúng tôi nhận thấy bạn đang trải qua cảm xúc rất nặng nề. UnionFam không thể thay thế chuyên gia hỗ trợ khủng hoảng tâm lý.'
    };
  }
  return { isCrisis: false };
};

export const getEmergencyResources = () => ({
  hotline: '1900 636 789 (Hỗ trợ tâm lý ngày đêm)',
  verified: true,
  verifiedDate: '2026-11-15'
});
