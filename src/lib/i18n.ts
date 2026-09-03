/**
 * UI copy is Vietnamese by default. Domain keys stay stable in English-like
 * snake_case because they are persisted in the database and exchanged with
 * the AI provider; only their presentation is translated here.
 */
export const DEFAULT_LOCALE = 'vi' as const;

export const dimensionLabels: Record<string, string> = {
  my_life: 'Cuộc đời mong muốn',
  what_matters: 'Điều quan trọng',
  my_ideal_day: 'Ngày lý tưởng',
  what_it_takes: 'Điều cần có',
  my_trade_offs: 'Điều đánh đổi',
  the_question: 'Câu hỏi tiếp theo',
  financial_life: 'Tài chính & nguồn lực',
  other: 'Góc nhìn khác',
};

export const statusLabels: Record<string, string> = {
  not_started: 'Chưa bắt đầu',
  incomplete: 'Chưa hoàn tất',
  active: 'Đang diễn ra',
  completed: 'Đã hoàn thành',
  archived: 'Đã lưu trữ',
  paused: 'Tạm dừng',
  pending: 'Đang chờ xác nhận',
  failed: 'Thất bại',
  inactive: 'Không hoạt động',
  deleted: 'Đã xóa',
  accepted: 'Đã xác nhận',
  rejected: 'Đã từ chối',
  confirmed: 'Đã xác nhận',
  draft: 'Bản nháp',
  published: 'Đang áp dụng',
};

export const roleLabels: Record<string, string> = {
  user: 'Người dùng',
  member: 'Thành viên',
  admin: 'Quản trị viên',
  content_admin: 'Biên tập viên AI',
};

export const auditActionLabels: Record<string, string> = {
  read_user_detail: 'Xem chi tiết người dùng',
  read_overview: 'Xem tổng quan',
  list: 'Xem danh sách',
  create_draft: 'Tạo bản nháp kịch bản',
  update_draft: 'Cập nhật bản nháp kịch bản',
  publish: 'Xuất bản kịch bản',
  archive: 'Lưu trữ kịch bản',
  grant_content_admin: 'Cấp quyền biên tập AI',
  revoke_content_admin: 'Gỡ quyền biên tập AI',
};

export const resourceTypeLabels: Record<string, string> = {
  users: 'Người dùng',
  conversations: 'Cuộc trò chuyện',
  messages: 'Tin nhắn',
  user_answers: 'Câu trả lời',
  ai_observations: 'Gợi ý từ AI',
  life_profiles: 'Bản đồ cuộc sống',
  skill: 'Kỹ năng',
  time: 'Thời gian',
  money: 'Tài chính',
  community: 'Mối quan hệ',
  tool: 'Công cụ',
  person: 'Con người',
  other: 'Khác',
  admin_overview: 'Tổng quan quản trị',
  user_detail: 'Chi tiết người dùng',
  user_role: 'Vai trò người dùng',
  ai_script_documents: 'Kịch bản AI',
};

export const stageLabels: Record<string, string> = {
  onboarding: 'Khởi đầu',
  discovery: 'Khám phá',
  clarify: 'Làm rõ',
  permission: 'Xin xác nhận',
  synthesis: 'Tổng hợp',
  design: 'Thiết kế',
  experiment: 'Thử nghiệm',
  reflection: 'Nhìn lại',
  completed: 'Hoàn tất',
  initial_exploration: 'Khám phá ban đầu',
  ideal_day_exploration: 'Khám phá ngày lý tưởng',
  trade_offs_evaluation: 'Đánh giá điều đánh đổi',
  experiment_proposal: 'Đề xuất thử nghiệm',
};

export function labelDimension(value: string | null | undefined) {
  const key = String(value || '').trim().toLowerCase();
  return dimensionLabels[key] || key.replaceAll('_', ' ') || 'Góc nhìn';
}

export function labelStatus(value: string | null | undefined) {
  const key = String(value || '').trim().toLowerCase();
  return statusLabels[key] || key || 'Chưa rõ';
}

export function labelResourceType(value: string | null | undefined) {
  const key = String(value || '').trim().toLowerCase();
  return resourceTypeLabels[key] || key || 'Khác';
}

export function labelStage(value: string | null | undefined) {
  const key = String(value || '').trim().toLowerCase();
  return stageLabels[key] || key || 'Chưa rõ';
}

export function labelRole(value: string | null | undefined) {
  const key = String(value || '').trim().toLowerCase();
  return roleLabels[key] || key || 'Chưa rõ';
}

export function labelAuditAction(value: string | null | undefined) {
  const key = String(value || '').trim().toLowerCase();
  return auditActionLabels[key] || key.replaceAll('_', ' ') || 'Hoạt động';
}
