# UNIONFAM Life Lab MVP — Implementation Documentation

Bộ tài liệu này chuyển brief ban đầu thành đặc tả đủ chi tiết để một AI coding agent có thể triển khai MVP trong **10 ngày làm việc / 2 tuần**. Phạm vi kết thúc ở mã nguồn và bản build đã kiểm thử; **không bao gồm deploy, cấu hình domain hoặc VPS**.

## Đọc theo thứ tự

1. [Project Charter](docs/00_PROJECT_CHARTER.md) — mục tiêu, phạm vi, giả định, nguyên tắc ra quyết định.
2. [Product Requirements](docs/01_PRODUCT_REQUIREMENTS.md) — 12 hạng mục khách hàng, route map, luồng nghiệp vụ và yêu cầu chức năng.
3. [Technical Architecture](docs/02_TECHNICAL_ARCHITECTURE.md) — stack, module, bảo mật và các quyết định kiến trúc.
4. [Data & API Specification](docs/03_DATA_AND_API_SPEC.md) — data model mở rộng cho Question/Life Profile/Admin, RLS, contract API và lỗi.
5. [AI Conversation Specification](docs/04_AI_CONVERSATION_SPEC.md) — state machine, structured output, permission và context injection.
6. [Implementation Plan](docs/05_IMPLEMENTATION_PLAN.md) — backlog P0 theo ngày, dependency, checkpoint và Definition of Done.
7. [Test & Acceptance](docs/06_TEST_AND_ACCEPTANCE.md) — test matrix, UAT, tiêu chí bàn giao.
8. [AI Execution Guide](docs/07_AI_EXECUTION_GUIDE.md) — cách giao bộ tài liệu này cho AI thực thi an toàn, có kiểm chứng.
9. [Requirements Traceability](docs/08_REQUIREMENTS_TRACEABILITY.md) — đối chiếu yêu cầu khách hàng với thiết kế, ticket và test nghiệm thu.
10. [Customer Input & Gap Analysis](docs/09_CUSTOMER_INPUT_GAP_ANALYSIS.md) — những gì đã chốt từ ảnh khách gửi và phần còn thiếu được xử lý thế nào.
11. [Week 1 Execution Plan](docs/10_WEEK_1_EXECUTION_PLAN.md) — kế hoạch chi tiết Ngày 1–5, acceptance gate và prompt giao AI theo từng lượt.
12. [Week 1 Remediation & Supabase Plan](docs/11_WEEK_1_REMEDIATION_SUPABASE_PLAN.md) — kế hoạch sửa Auth/RLS/persistence thật, test security và gate trước khi đẩy migration lên Supabase.

## Nguồn và mức độ chắc chắn

Tài liệu được lập từ:

- `/home/jay/Downloads/Unionfam_LifeLab_MVP_Plan.md`
- `/home/jay/Downloads/Giai_phap_ky_thuat_MVP_LifeLab.pdf`
- Ba ảnh yêu cầu khách hàng cung cấp ngày 28/08/2026: bảng 12 hạng mục và mockup Dashboard Life Lab.

Input mới đã chốt Google Auth, Question Engine, Life Profile Engine, dashboard cá nhân hóa, AI Reflection và Admin Dashboard. Khách chưa bàn giao nội dung “flow 89 trang”, prompt/methodology đầy đủ, rule chấm điểm và asset thiết kế gốc. Các phần này được đóng gói thành cấu hình có version; agent dùng fixture trung tính để hoàn thiện kỹ thuật và thay nội dung thật sau mà không sửa kiến trúc.

## Kết quả bàn giao mong đợi

- Web app responsive chạy được ở local và production build thành công.
- Email/Google authentication, RLS, role admin và dữ liệu tách biệt giữa người dùng.
- Question Engine chạy bằng question graph có version, lưu câu trả lời và resume được.
- Adaptive conversation có output JSON được validate.
- AI observation luôn chờ người dùng xác nhận trước khi thành insight.
- Life Profile/Life Design Map, Resources, Progress, Experiments, Reflections và Learnings hoạt động end-to-end.
- Admin xem user/session/answer/error theo quyền, có audit và không lộ prompt/secrets.
- Migration, seed dữ liệu phi nhạy cảm, test tự động, tài liệu setup và UAT evidence.
- Không đưa methodology/prompt bí mật, service-role key hoặc dữ liệu người dùng vào repository/log.
