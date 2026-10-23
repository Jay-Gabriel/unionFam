// Life Lab Product Brief V1.0 & Master V8.7.2
// Feature Flags for Beta Launch Profile (Người đi làm 23–35 tuổi)

export interface BetaFeatureFlags {
  // --- BẬT CHO BETA ---
  enableFirstSession: boolean;
  enableReflectVerifyRepair: boolean;
  enableCurrentFocus: boolean;
  enableOutcomeSelection: boolean;
  enableUserStop: boolean;
  enableSafety: boolean;
  enableMemoryPermission: boolean;
  enableSessionOutcomeCheckpoint: boolean;
  enableDecisionMode: boolean; // Có khả năng bật/tắt Decision Mode
  enableMemory: boolean;       // Có khả năng bật/tắt Memory
  cohortMin: number;           // 30
  cohortMax: number;           // 50

  // --- TẠM ẨN TRONG BETA (Thu hẹp trải nghiệm, không xóa khỏi code) ---
  showProgressGame: boolean;
  showBadgesAndGems: boolean;
  showStreaks: boolean;
  showFullLifeMap: boolean;
  showPrebuiltExperiments: boolean;
  showVoice: boolean;
  showCommunity: boolean;
  showProactiveNotifications: boolean;
  showMockDemoUserData: boolean; // Tuyệt đối không hiển thị dữ liệu mẫu như là của người dùng
}

export const BETA_CONFIG: BetaFeatureFlags = {
  // Enabled capabilities
  enableFirstSession: true,
  enableReflectVerifyRepair: true,
  enableCurrentFocus: true,
  enableOutcomeSelection: true,
  enableUserStop: true,
  enableSafety: true,
  enableMemoryPermission: true,
  enableSessionOutcomeCheckpoint: true,
  enableDecisionMode: true,
  enableMemory: true,
  cohortMin: 30,
  cohortMax: 50,

  // Soft-hidden capabilities for beta
  showProgressGame: false,
  showBadgesAndGems: false,
  showStreaks: false,
  showFullLifeMap: false,
  showPrebuiltExperiments: false,
  showVoice: false,
  showCommunity: false,
  showProactiveNotifications: false,
  showMockDemoUserData: false,
};

// Runtime flag getters and setters for Limited Beta Cohort
const BETA_RUNTIME_KEY = 'unionfam_beta_runtime_flags';

export function getBetaRuntimeFlags(): {
  enableDecisionMode: boolean;
  enableMemory: boolean;
  cohortCount: number;
} {
  try {
    const raw = localStorage.getItem(BETA_RUNTIME_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enableDecisionMode: parsed.enableDecisionMode ?? true,
        enableMemory: parsed.enableMemory ?? true,
        cohortCount: parsed.cohortCount ?? 38,
      };
    }
  } catch {
    // ignore
  }
  return {
    enableDecisionMode: BETA_CONFIG.enableDecisionMode,
    enableMemory: BETA_CONFIG.enableMemory,
    cohortCount: 38,
  };
}

export function setBetaRuntimeFlags(flags: {
  enableDecisionMode?: boolean;
  enableMemory?: boolean;
  cohortCount?: number;
}): void {
  try {
    const current = getBetaRuntimeFlags();
    const updated = { ...current, ...flags };
    localStorage.setItem(BETA_RUNTIME_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

// Valid Session Outcomes defined in Master V8.7.2
export type SessionOutcomeType =
  | 'REFLECTIVE_PAUSE'      // Dừng với điều vừa rõ
  | 'BETTER_QUESTION'       // Giữ một câu hỏi ngẫm nghĩ
  | 'CONFIRMED_INSIGHT'     // Tiếp tục khám phá thấu suốt
  | 'MEANINGFUL_NEXT_STEP'  // Nhìn rõ một quyết định
  | 'LIFE_EXPERIMENT';      // Thử một bước nhỏ thực tế
