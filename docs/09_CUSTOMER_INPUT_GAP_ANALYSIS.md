# 09 — Customer Input & Gap Analysis

## 1. Những gì ba ảnh đã chốt

### Bảng 12 hạng mục

1. Landing Page với CTA “Bắt đầu”.
2. Đăng ký/đăng nhập bằng Email/Google và session/account.
3. Onboarding thu thập thông tin ban đầu, giải thích cách hoạt động.
4. Question Engine hiển thị câu hỏi theo flow 89 trang của khách.
5. Conversation Engine dùng AI hiểu câu trả lời và quyết định câu hỏi tiếp theo.
6. Gemini API, prompt và token management.
7. Life Profile Engine phân tích Desire/Escape, Life Vision và các dimension.
8. Kết quả Life Profile dưới dạng dashboard/profile cá nhân hóa.
9. AI Reflection giải thích kết quả và phản chiếu cho người dùng.
10. Database lưu user, câu trả lời, conversation và profile.
11. Admin Dashboard xem user, session, câu trả lời, lỗi và lỗi AI.
12. Deploy + testing; theo chỉ đạo hiện tại chỉ giữ testing, deploy/domain/VPS ngoài scope.

### Mockup Dashboard

Visual reference xác nhận:

- Brand direction sáng, trắng, xanh tím/pastel, bo góc, card-based.
- Sidebar: Tổng quan, AI Conversation, Life Design Map, Experiments, Reflections, Learnings, Life Map lịch sử, Financial Life, Progress, Resources.
- Main: greeting, quote/banner, conversation widget và Life Lab Loop.
- Right: Life Design Map sáu phần và experiment hiện tại.
- Bottom: insights mới, streak và focus chips.
- Life Lab Loop: Explore → Choose → Experiment → Experience → Reflection → Learning.
- Sáu phần Life Profile: My Life, What Matters, My Ideal Day, What It Takes, My Trade-offs, The Question.

Mockup là reference hình ảnh, không phải asset có thể đưa thẳng vào sản phẩm. Khi thiếu Figma/design tokens/icon/logo source, agent dựng component tương đương về hierarchy và cảm giác, không rasterize/copy screenshot.

## 2. Phần còn thiếu và cách tự làm không chặn code

| Thiếu input | Có thể tự làm gì | Không được tuyên bố |
|---|---|---|
| Nội dung flow 89 trang | Xây versioned question graph, branching DSL, import/seed contract và fixture 8–12 câu `dev-placeholder` | Không gọi fixture là methodology/flow thật của khách |
| Prompt/methodology | Xây prompt pipeline/schema/eval harness; dùng prompt coaching trung tính, an toàn | Không khẳng định phản ánh IP/phương pháp Life Lab |
| Rule Desire/Escape/scoring | Lưu evidence + draft dimensions; để rule/config thay thế được | Không tạo điểm số khoa học hoặc kết luận tâm lý |
| Figma/logo/icon/font assets | Dựng design system gần mockup bằng asset có license và text logo tạm | Không pixel-perfect hoặc sở hữu brand asset chưa nhận |
| Copy pháp lý/privacy | Draft notice tối thiểu, consent versioned | Không coi là legal-approved |
| Google/Supabase/Gemini credentials | Hoàn thiện mock/local adapters và `.env.example` | Không test live OAuth/Gemini nếu không có key |
| Admin privacy policy | Mặc định masking + reason + audit + least privilege | Không mở toàn bộ conversation cho mọi admin |

## 3. Baseline tự chủ khi khách vắng mặt

Agent được phép hoàn tất toàn bộ kỹ thuật với các default:

- Tiếng Việt, timezone `Asia/Ho_Chi_Minh`.
- Email/password chạy local; Google adapter/callback hoàn chỉnh và test mock cho tới khi có credential.
- Question flow `dev-placeholder` có version, branching và đủ loại answer để test engine.
- Generic reflective-coaching prompt không chẩn đoán, không tự xác nhận dữ liệu.
- Sáu Life Profile dimensions đúng mockup; Desire/Escape/Life Vision là draft có evidence.
- Admin role cấp thủ công; dashboard read-only, masking/audit mặc định.
- UI bám layout/hierarchy và palette direction của mockup, responsive trước, animation sau.

## 4. Những gate khách vẫn phải xác nhận trước pilot thật

- Nội dung/logic flow 89 trang và expected branching.
- Prompt/methodology, thuật ngữ, scoring và 30-case eval set.
- Logo/brand guideline/copy chính thức.
- Consent, privacy, safety/crisis copy và quyền admin xem dữ liệu.
- Google OAuth redirect origins và credentials; Gemini model/quota.
- UAT nội dung Life Profile/AI Reflection.

Vì vậy có thể tự xây **100% technical MVP và nghiệm thu kỹ thuật** khi khách vắng mặt. Chưa thể nghiệm thu **đúng methodology/IP của khách hoặc sẵn sàng pilot người thật** cho tới khi các gate trên được cung cấp/phê duyệt.

