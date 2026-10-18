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

// Valid Session Outcomes defined in Master V8.7.2
export type SessionOutcomeType =
  | 'REFLECTIVE_PAUSE'      // Dừng với điều vừa rõ
  | 'BETTER_QUESTION'       // Giữ một câu hỏi ngẫm nghĩ
  | 'CONFIRMED_INSIGHT'     // Tiếp tục khám phá thấu suốt
  | 'MEANINGFUL_NEXT_STEP'  // Nhìn rõ một quyết định
  | 'LIFE_EXPERIMENT';      // Thử một bước nhỏ thực tế
