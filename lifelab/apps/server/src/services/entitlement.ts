/**
 * Entitlement + Billing adapter — Life Lab V8.7.2 (prompt mục 6).
 * - Subscription/pricing CHƯA chốt → đây là GIẢ ĐỊNH sản phẩm cần review.
 * - Billing adapter cấu hình được; chưa bật thu tiền thật (BILLING_ENABLED=false mặc định).
 * - Giới hạn phải rõ TRƯỚC phiên. KHÔNG chặn phản hồi an toàn hay ép thanh toán giữa crisis.
 */
import { config } from '../config.js';

export type Tier = 'FREE' | 'PREMIUM';

export interface EntitlementInfo {
  tier: Tier;
  turnLimitPerSession: number;
  billingEnabled: boolean;
  /** Ghi chú: đây là giả định cần Product Owner review (prompt mục 6). */
  note: string;
}

const FREE: EntitlementInfo = {
  tier: 'FREE',
  turnLimitPerSession: config.freeTurnLimitPerSession,
  billingEnabled: config.billingEnabled,
  note: 'Free/Premium split là GIẢ ĐỊNH sản phẩm, chưa được Master chốt; chưa bật thu tiền thật.',
};

const PREMIUM: EntitlementInfo = {
  tier: 'PREMIUM',
  turnLimitPerSession: Number.MAX_SAFE_INTEGER,
  billingEnabled: config.billingEnabled,
  note: 'Premium đề xuất bỏ giới hạn lượt/phiên — cần review trước khi bật thu tiền.',
};

export function getEntitlement(tier: string | null | undefined): EntitlementInfo {
  return tier === 'PREMIUM' ? PREMIUM : FREE;
}

/**
 * Kiểm tra limit TRƯỚC khi bắt đầu phiên/lượt bình thường.
 * QUAN TRỌNG: luôn trả allowed=true nếu đang trong tình huống safety (safetyActive)
 * — không cắt phản hồi an toàn, không ép thanh toán giữa crisis.
 */
export function checkTurnAllowed(opts: {
  tier: string | null | undefined;
  turnsUsed: number;
  safetyActive: boolean;
}): { allowed: boolean; reason?: string; limit: number } {
  const ent = getEntitlement(opts.tier);
  if (opts.safetyActive) return { allowed: true, limit: ent.turnLimitPerSession };
  if (opts.turnsUsed >= ent.turnLimitPerSession) {
    return {
      allowed: false,
      reason: 'Đã đạt giới hạn số lượt cho phiên này ở gói hiện tại.',
      limit: ent.turnLimitPerSession,
    };
  }
  return { allowed: true, limit: ent.turnLimitPerSession };
}

/** Billing adapter stub — chưa tích hợp cổng thật. */
export const billingAdapter = {
  enabled: config.billingEnabled,
  async createCheckout(): Promise<{ ok: false; reason: string }> {
    return { ok: false, reason: 'Billing chưa bật. Cần Product Owner chọn cổng thanh toán và giá.' };
  },
};
