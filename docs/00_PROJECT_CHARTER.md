# 00 — Project Charter

## 1. Mục tiêu

Xây dựng UNIONFAM Life Lab MVP để người dùng trò chuyện với AI, khám phá tình trạng sống hiện tại, xác nhận hoặc từ chối diễn giải của AI, hình thành Life Design Map, xác định nguồn lực/khoảng cách, tạo thử nghiệm nhỏ và phản chiếu kết quả.

Mục tiêu giao hàng: hoàn tất P0 trong **10 ngày làm việc liên tiếp tính từ kickoff**, sẵn sàng cho pilot 10 ngày từ Tuần 3.

## 2. Outcome đo được

MVP được xem là đạt khi:

1. Người dùng mới có thể đăng ký, đăng nhập, bắt đầu hội thoại và quay lại phiên đang làm dở.
2. Người dùng hoàn thành/resume bộ câu hỏi theo flow versioned và câu trả lời được dùng làm context đúng nguồn.
3. Mọi phản chiếu/diễn giải do AI tạo đều hiển thị dạng đề xuất và không trở thành dữ liệu xác nhận nếu người dùng chưa đồng ý.
4. Người dùng có thể xem Life Profile/Life Design Map cá nhân hóa theo sáu dimension trong mockup.
5. Người dùng có thể tạo một experiment, cập nhật trạng thái, ghi reflection và nhận learning.
6. Admin được cấp quyền có thể xem user/session/answers/AI errors theo audit policy.
7. Hai tài khoản khác nhau không thể đọc/sửa dữ liệu của nhau, kể cả gọi API trực tiếp.
8. Luồng P0 vượt qua test tự động và UAT trong [06_TEST_AND_ACCEPTANCE.md](06_TEST_AND_ACCEPTANCE.md).

## 3. Phạm vi P0

- Web responsive, ưu tiên mobile 360px và desktop 1440px; dashboard bám visual reference khách cung cấp.
- Landing, auth email/password + Google, onboarding ngắn.
- Question Engine hiển thị question graph có version, điều kiện chuyển câu và resume progress.
- Dashboard hành trình.
- Adaptive conversation theo state machine.
- Quản lý user statement, AI observation, permission/accept/reject/edit.
- Life Profile Engine phân tích Desire/Escape, Life Vision và sáu dimension có version.
- Current Resources và Gap Map.
- Experiment, trạng thái experiment và Reflection.
- Learnings, Financial Life và Progress ở mức read model MVP.
- Admin Dashboard tối thiểu: user, session, câu trả lời, application/AI error; read-only mặc định và có audit.
- Xuất bản tóm tắt Life Design trên màn hình; tải file/PDF không phải P0.
- Prompt/config methodology tách khỏi client bundle và repository.
- Audit tối thiểu qua timestamps, source references và version history.

## 4. Ngoài phạm vi

- Deploy, DNS, SSL, cấu hình domain/VPS, CI/CD production và giám sát production.
- Mobile native app.
- Thanh toán, subscription, social login ngoài Google, community/social feed.
- Admin chỉnh prompt trực tiếp, BI/analytics nâng cao, CRM/email automation.
- Vector database, RAG tài liệu lớn, model fine-tuning/training weights.
- Voice/video chat, đa ngôn ngữ hoàn chỉnh, realtime multi-user.
- Chẩn đoán tâm lý, tư vấn y tế hoặc xử lý khủng hoảng.
- SLA production, backup/restore do nhà vận hành hạ tầng chịu trách nhiệm.

## 5. Ràng buộc và nguyên tắc

- Stack gốc: Next.js + TypeScript, Supabase PostgreSQL/Auth/RLS, Vercel AI SDK, Gemini API.
- Không tin dữ liệu hoặc quyền từ client; kiểm tra auth/ownership phía server và bằng RLS.
- AI không phải source of truth. `user_statements` là lời người dùng; `ai_observations` là đề xuất; chỉ hành động rõ ràng của người dùng mới tạo `confirmed_insights`.
- Structured output phải qua schema validation; JSON sai không được ghi dữ liệu nghiệp vụ.
- Prompt/methodology không được hard-code trong UI, gửi xuống browser hoặc commit vào repo.
- Không hứa chi phí tuyệt đối 0đ: free tier có quota và điều khoản có thể đổi. Thiết kế phải có quota guard và thông báo lỗi thân thiện.
- “Train AI” trong MVP nghĩa là cấu hình prompt, examples và evaluation; không fine-tune model.

## 6. Giả định cần PO xác nhận

| ID | Giả định mặc định để không chặn tiến độ | Hạn xác nhận | Ảnh hưởng nếu đổi muộn |
|---|---|---:|---|
| A-01 | UI tiếng Việt; nội dung người dùng có thể nhập Unicode tự do | Cuối Ngày 1 | Sửa copy/test |
| A-02 | Auth dùng email/password và Google OAuth | Đã chốt từ ảnh | Auth provider config |
| A-03 | Data model mở rộng theo Data Spec để chứa question flow/answers/profile/learning/admin audit | Mặc định kỹ thuật | Migration và API |
| A-04 | 12 hạng mục khách hàng được ánh xạ thành các route/views ở Product Requirements | Đã chốt từ ảnh | Navigation/UI |
| A-05 | Chưa có flow 89 trang/prompt thật: dùng fixture trung tính, version `dev-placeholder`; không tuyên bố đúng methodology | Khi khách bàn giao | Nội dung/chất lượng AI |
| A-06 | Có hai vai trò `member` và `admin`; admin được cấp thủ công, không tự đăng ký | Đã chốt từ ảnh | RLS và admin UI |
| A-07 | User có thể sửa đề xuất trước khi xác nhận; bản sửa được lưu là insight do user xác nhận | Cuối Ngày 1 | Permission UX |
| A-08 | Life Profile có 6 dimension: My Life, What Matters, My Ideal Day, What It Takes, My Trade-offs, The Question | Đã chốt từ mockup | Profile/data/UI |
| A-09 | Một conversation có một active stage; một user có thể có nhiều conversation | Cuối Ngày 1 | State machine |
| A-10 | Không lưu chain-of-thought; chỉ lưu output fields đã định nghĩa | Bắt buộc | Security/compliance |
| A-11 | Visual mockup là design direction; vì chưa có Figma/assets nên agent dựng lại bằng component/icon hợp lệ, không pixel-copy ảnh raster | Mặc định kỹ thuật | UI fidelity |
| A-12 | Financial Life là filtered profile/resource/progress view, không phải financial advisory engine | Mặc định an toàn | Scope/safety |

## 7. Điều kiện để kịp deadline

- Scope P0 đóng băng cuối Ngày 1. Yêu cầu mới đi vào backlog sau pilot.
- Khi PO vắng mặt, default `A-*` được dùng và decision log phải ghi rõ; thay đổi sau này đi qua config/migration.
- UI dùng design system có sẵn; không chờ thiết kế pixel-perfect riêng.
- Chỉ một LLM provider ở đường chạy chính; provider abstraction ở mức mỏng.
- AI coding agent triển khai theo vertical slice và không tự mở rộng tính năng.
- Mỗi ngày kết thúc bằng build + test; không dồn tích hợp sang Ngày 10.

## 8. RACI tối giản

| Hạng mục | Product Owner | Người/AI thực thi | Người nghiệm thu |
|---|---|---|---|
| Methodology, prompt, copy thật | A/R khi quay lại | C; dùng placeholder an toàn | PO |
| Kiến trúc, code, migration, test | C | A/R | Technical reviewer |
| Nghiệm thu nghiệp vụ | A/R | C | PO |
| Deploy/domain/VPS | Ngoài phạm vi bộ plan | Ngoài phạm vi | Đơn vị vận hành |

`A`: chịu trách nhiệm cuối; `R`: thực hiện; `C`: được tham vấn.
