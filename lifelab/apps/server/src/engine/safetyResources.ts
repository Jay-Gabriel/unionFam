/**
 * Safety resources — KHÔNG bịa nguồn hỗ trợ khẩn cấp (Phần 4, Definition of Done QA).
 * Dùng SAFETY_RESOURCES_JSON cấu hình theo thị trường. Không cấu hình → hướng dẫn chung,
 * KHÔNG tự tạo số điện thoại.
 */
import { config } from '../config.js';
import type { SafetyResource } from '@lifelab/contract';

const GENERIC_GUIDANCE: SafetyResource[] = [
  {
    label: 'Liên hệ dịch vụ khẩn cấp tại địa phương của bạn',
    value: 'Gọi số khẩn cấp quốc gia hoặc đến cơ sở y tế gần nhất',
    kind: 'INFO',
  },
  {
    label: 'Tìm một người bạn tin tưởng ở gần',
    value: 'Nói với người thân, bạn bè hoặc người có thể ở bên bạn lúc này',
    kind: 'INFO',
  },
];

/** Trả về resources đã cấu hình; nếu rỗng dùng hướng dẫn chung (không có số bịa). */
export function getSafetyResources(): SafetyResource[] {
  if (config.safetyResources.length > 0) {
    return config.safetyResources;
  }
  return GENERIC_GUIDANCE;
}

export function hasConfiguredResources(): boolean {
  return config.safetyResources.length > 0;
}
