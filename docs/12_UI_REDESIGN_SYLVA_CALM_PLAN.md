
# Life Lab UI Redesign Plan — “Living Sanctuary”

> Reference mood: [ThreeUI — Sylva / Living Green](https://threeui.com/hero/sylva/living-green)  
> Scope: UI/UX và visual system; không deploy, không đổi API contract hay nghiệp vụ backend.  
> Mục tiêu: người dùng vừa mở Life Lab đã cảm thấy chậm lại, an toàn và muốn dành thời gian phản chiếu.

## 1. Quyết định thiết kế

Không sao chép nguyên mẫu Sylva. Life Lab sẽ kế thừa các nguyên tắc thị giác của mẫu và xây lại bằng asset/code riêng:

- Không gian thiên nhiên có chiều sâu thay cho background phẳng.
- Typography lớn, nhẹ, có nhiều khoảng thở.
- Các card màu ngà như những “đảo nội dung” nổi trên nền rêu.
- Navigation dạng pill nhỏ, gọn, hơi trong suốt.
- Chuyển động môi trường rất chậm: bụi sáng, phấn hoa, lá rung và một điểm nhấn bướm.
- Bảng màu olive/moss/ivory thay cho hệ indigo tím hiện tại.
- Landing mang sắc thái “rừng lúc chạng vạng”; app sau đăng nhập là “khu vườn buổi sớm” sáng và dễ đọc hơn.

Không đưa 3D nặng vào toàn bộ dashboard. MVP dùng 2.5D CSS/SVG + canvas particles để giống mood/composition nhưng nhẹ, ổn định và kịp deadline. WebGL/Three.js chỉ là progressive enhancement cho landing nếu đã có asset GLB/texture hợp pháp và đạt performance gate.

## 2. Trải nghiệm cảm xúc cần đạt

Ba từ khóa: **thanh thản — riêng tư — có chủ đích**.

Khi vào landing, người dùng cần cảm nhận theo thứ tự:

1. “Đây là một không gian yên tĩnh, không phải một dashboard ép năng suất.”
2. “Tôi vẫn là người quyết định; AI chỉ đồng hành.”
3. “Tôi có thể bắt đầu bằng một bước nhỏ.”

Không dùng:

- Gradient tím/hồng rực trên diện rộng.
- Nhiều card cùng nhảy/bounce hoặc pulse liên tục.
- Gam xanh lá bão hòa kiểu ứng dụng fitness.
- Quá nhiều đường viền, số liệu, badge và icon trên cùng một viewport.
- Ảnh/3D lấy trực tiếp từ ThreeUI nếu chưa có license.

## 3. Design tokens

### 3.1 Color system

```text
Forest dusk       #3D4138   landing background
Deep moss         #263128   text/action mạnh
Moss              #596A55   primary
Fern               #7C8B70   secondary
Lichen             #B9C6A5   accent dịu
Pollen             #D9CB8F   accent ấm, dùng rất ít
Fog                #DDE2D8   divider/background phụ
Morning mist       #EEF1EA   app background
Warm ivory         #F7F5EE   card/background sáng
Paper white        #FCFBF7   input/card nổi
Ink                #222A23   primary text
Muted ink          #667066   secondary text
AI lavender        #8E88A8   chỉ dùng để nhận biết nội dung AI
Success leaf       #568166
Warning earth      #A07852
Danger clay        #A95F56
```

Contrast của text/body và CTA phải đạt WCAG AA. Không đặt text nhỏ trực tiếp trên vùng ảnh rêu nhiều chi tiết nếu không có scrim.

### 3.2 Typography

- Font chính: `Be Vietnam Pro` qua `next/font/google`, hỗ trợ dấu tiếng Việt ổn định.
- Hero heading: weight 300–400, letter spacing `-0.035em`, line-height khoảng `0.98–1.05`.
- Heading trong app: weight 500–600; bỏ cảm giác “mọi thứ đều bold”.
- Body desktop 15–17 px, line-height 1.6; chat tối thiểu 15 px.
- Label/caption tối thiểu 12 px; hạn chế text 9–10 px như UI hiện tại.

### 3.3 Shape, border và shadow

- Card chính: radius 28–36 px.
- Input/button: radius 16–999 px tùy vai trò.
- Border: `rgba(52, 65, 53, 0.10)`.
- Shadow sáng: mềm và tỏa rộng, không shadow xanh/tím.
- Glass chỉ dùng cho navbar/header; content card ưu tiên nền đặc để dễ đọc.

### 3.4 Motion

- Page reveal: 500–700 ms, `easeOut`, dịch chuyển tối đa 12 px.
- Hover card: nâng tối đa 2 px; không scale quá 1.01.
- Ambient particle: chu kỳ 12–24 giây.
- Parallax foreground/background: biên độ 4–12 px.
- Butterfly: xuất hiện thưa, đường bay chậm; không luôn ở trung tâm CTA.
- Tôn trọng `prefers-reduced-motion`; khi bật giảm chuyển động thì dùng ảnh tĩnh và bỏ parallax/particle.

## 4. Landing page mới

### 4.1 Bố cục desktop

Hero chiếm tối thiểu một viewport, chia bố cục bất đối xứng:

```text
┌──────────────── compact glass pill navigation ────────────────┐
│                                                               │
│  Eyebrow + headline lớn       Ethos card nổi                  │
│  2–3 dòng, nhiều khoảng thở   “Bạn là người quyết định”       │
│                                                               │
│  mô tả ngắn + primary CTA     Reflection card                 │
│  secondary CTA                “Khoảng lặng hôm nay”           │
│                                                               │
│     organic moss/root landscape + butterfly + pollen          │
└───────────────────────────────────────────────────────────────┘
```

Nội dung đề xuất:

- Eyebrow: `MỘT KHÔNG GIAN ĐỂ TRỞ VỀ VỚI CHÍNH MÌNH`
- Headline: `Bước vào khoảng sống của riêng bạn.`
- Supporting copy: `Life Lab giúp bạn lắng nghe điều mình thật sự muốn, nhìn rõ các lựa chọn và thử nghiệm một cuộc sống phù hợp hơn — theo nhịp của chính bạn.`
- Primary CTA: `Bắt đầu khám phá`
- Secondary CTA: `Life Lab hoạt động thế nào?`
- Ethos card: `AI gợi mở. Bạn quyết định.`
- Floating facts không dùng số liệu giả; dùng `6 chiều sống` và `1 hành trình của riêng bạn`.

### 4.2 Visual layers

Tạo asset riêng trong `public/visuals/living-sanctuary/`:

- `hero-poster.avif`: fallback hoàn chỉnh cho mobile/reduced-motion.
- `root-back.webp`, `root-mid.webp`, `moss-front.webp`: ba lớp trong suốt để parallax.
- `fern-left.svg`, `fern-right.svg`, `pale-flowers.svg`.
- `butterfly.svg`: nhận diện riêng của Life Lab, không sao chép mẫu.
- `field-note-01.avif`: ảnh thiên nhiên dành cho reflection card.
- Texture noise nhỏ, nén tốt; không dùng video autoplay cho MVP.

`LivingBackdrop` phụ trách layer, scrim, particle canvas và reduced-motion fallback. Không để canvas chặn pointer events hoặc accessibility tree.

### 4.3 Navbar

- Desktop: pill ở giữa phía trên, gồm logo mark, `Khám phá`, `Cách hoạt động`, `Triết lý`, `Đăng nhập`.
- CTA đăng nhập là pill sáng; primary CTA trong hero vẫn là điểm nhấn chính.
- Mobile: logo + nút menu; drawer nền ivory, không cố nhét pill desktop.
- Header chỉ chuyển sang nền rõ hơn sau khi scroll 24–40 px.

## 5. Auth và onboarding

### Auth

- Layout split 55/45 trên desktop: visual sanctuary bên trái, form ivory bên phải.
- Mobile chỉ giữ poster nền nhẹ và form full-width.
- Form giảm border/shadow, tăng khoảng cách và cỡ chữ.
- Google/email giữ nguyên logic; UI không được tạo thêm auth fallback.
- Nút “Đăng nhập nhanh Test Mode” chỉ hiển thị khi `NODE_ENV !== 'production'` và dùng style phụ, không cạnh tranh CTA chính.
- Thông báo lỗi dùng clay tone, không đỏ chói.

### Onboarding

- Chuyển từ modal/card đơn sang hành trình 3 bước:
  1. Không gian an toàn.
  2. AI gợi mở, bạn xác nhận.
  3. Bắt đầu bằng câu hỏi đầu tiên.
- Consent vẫn rõ ràng, không pre-check mặc định.
- CTA cố định ở cuối card trên mobile; trạng thái disabled có contrast đủ.

## 6. App shell sau đăng nhập

### 6.1 Visual direction

App dùng nền `Morning mist`, card `Warm ivory/Paper white`, text `Ink`. Không dùng hero rừng tối làm nền dashboard vì gây mỏi và giảm khả năng đọc dữ liệu.

### 6.2 Sidebar

- Desktop sidebar 248–264 px, nền ivory bán trong suốt.
- Logo là botanical/ripple mark riêng của Life Lab.
- Active item: deep moss pill; inactive item ít contrast hơn.
- Gom navigation thành bốn nhóm để giảm tải:
  - Hôm nay: Tổng quan, AI Conversation.
  - Thiết kế: Life Design Map, Financial Life.
  - Thử nghiệm: Experiments, Reflections, Learnings.
  - Thư viện: Progress, Resources, Lịch sử.
- Life Lab Loop widget giản lược thành vòng mềm, không quay liên tục.
- Mobile dùng bottom navigation cho 4 tác vụ chính; phần còn lại ở sheet “Thêm”.

### 6.3 Header

- Greeting lấy tên user thật; bỏ hard-code `Minh Anh`.
- Search và notification chỉ hiển thị khi có chức năng thật; không để UI giả gây nhiễu.
- Header thấp, trong, có blur nhẹ và shadow gần như không thấy.

## 7. Dashboard mới

Dashboard hiện tại quá dày. Redesign theo progressive disclosure với ba vùng ưu tiên:

1. **Today Sanctuary** — lời chào, một câu phản chiếu và CTA bắt đầu conversation.
2. **Life Design Map** — 6 dimensions dưới dạng organic tiles; chỉ hiện trạng thái và insight gần nhất.
3. **Current Experiment** — một thí nghiệm đang chạy, progress và hành động tiếp theo.

Các vùng phụ `Insights mới`, `Streak`, `Focus chips` chuyển xuống dưới hoặc vào tab/accordion. Trên mobile chỉ hiển thị một primary action trong viewport đầu.

Thay banner núi SVG hiện tại bằng botanical landscape sáng, đồng bộ landing nhưng ít chi tiết hơn.

## 8. Conversation và User Agency

Conversation phải giống một không gian viết nhật ký, không giống ứng dụng chat hỗ trợ khách hàng:

- Content width 760–840 px, nhiều khoảng trắng.
- AI message nền paper; user message nền moss nhạt thay vì indigo đậm.
- Composer lớn, bo mềm, luôn thấy câu nhắc về quyền riêng tư/không phán xét.
- Streaming indicator là ba chấm/breathing glow chậm, không spinner nhanh.
- Agency proposal dùng lichen card với ba hành động rõ:
  - `Chưa đúng` — secondary.
  - `Sửa lại` — neutral.
  - `Đúng với mình` — primary leaf.
- Trạng thái confirmed/rejected không chỉ phân biệt bằng màu; luôn có icon + text.
- Fix SSE buffer parser là task kỹ thuật riêng, không trộn với styling component.

## 9. Question flow

- Một câu hỏi mỗi màn hình; chiều rộng đọc 680–760 px.
- Progress biểu diễn bằng “đường mầm” hoặc 3–6 segment mềm, vẫn có text `%/câu x/y` cho accessibility.
- Answer options là large selection tiles, touch target tối thiểu 44 px.
- Nút Back/Continue ổn định vị trí để không gây nhảy layout.
- Autosave state có text `Đã lưu`/`Đang lưu` thay cho spinner đơn thuần.
- Không tự bịa thêm flow 89 trang; UI render hoàn toàn từ dữ liệu Question Engine.

## 10. Các trang còn lại

Áp dụng cùng token/component, không redesign độc lập từng trang:

- Life Map: six-dimension garden grid.
- Experiments: “seed → tending → learning” timeline; tránh gamification quá mạnh.
- Reflections: journal cards, typography ưu tiên đọc.
- Learnings: card dạng herbarium/archive.
- Progress: đường xu hướng dịu; chart màu có contrast và pattern.
- Resources: lọc theo dimension bằng pill.
- Admin: giữ neutral/operational; không dùng ambient animation, chỉ dùng cùng typography/token.

## 11. Component architecture

Tạo nhóm component mới:

```text
src/components/calm/
  brand-mark.tsx
  calm-button.tsx
  calm-card.tsx
  glass-pill-nav.tsx
  living-backdrop.tsx
  ambient-particles.tsx
  botanical-illustration.tsx
  page-reveal.tsx
  section-heading.tsx
  status-chip.tsx
  sanctuary-shell.tsx
  mobile-bottom-nav.tsx
```

Rules:

- Component không chứa copy nghiệp vụ nếu có thể truyền qua props.
- Dùng `next/image` cho raster; không để remote Unsplash trong production UI.
- Framer Motion dùng ở wrapper có chủ đích, không bọc từng icon/card.
- Icon tiếp tục dùng Lucide để đồng nhất.
- Không thêm UI library mới trong phase này.

## 12. File implementation map

### Foundation

- `src/app/globals.css`: semantic tokens, focus ring, motion/reduced-motion, surface utilities.
- `tailwind.config.ts`: map color/shadow/radius semantic.
- `src/app/layout.tsx`: `next/font`, metadata/theme color.
- `src/components/calm/*`: primitive/component mới.
- `public/visuals/living-sanctuary/*`: asset riêng đã tối ưu.

### Entry journey

- `src/app/page.tsx`: Living Sanctuary hero.
- `src/app/auth/page.tsx`: split auth layout.
- `src/app/onboarding/page.tsx`: 3-step calm onboarding.

### Product shell

- `src/app/app/layout.tsx`: sidebar/header/mobile navigation.
- `src/app/app/page.tsx`: dashboard hierarchy mới.
- `src/app/app/questions/page.tsx`: focused questionnaire.
- `src/app/app/conversations/[id]/page.tsx`: journal-like conversation/agency UI.

### Secondary pages

- `src/app/app/life-map/page.tsx`
- `src/app/app/experiments/page.tsx`
- `src/app/app/reflections/page.tsx`
- `src/app/app/learnings/page.tsx`
- `src/app/app/progress/page.tsx`
- `src/app/app/resources/page.tsx`
- `src/app/app/financial-life/page.tsx`
- `src/app/app/life-map/history/page.tsx`
- `src/app/admin/page.tsx`

## 13. Responsive specification

### Mobile 360–430 px

- Poster/static botanical background; particle count tối đa 10, không parallax theo pointer.
- Headline 44–52 px, không vượt bốn dòng.
- Floating cards trở thành stacked cards dưới CTA.
- Không horizontal scroll.
- Bottom navigation không che composer/CTA; thêm safe-area inset.

### Tablet 768–1024 px

- Hero 6/6 hoặc stacked tùy chiều ngang.
- App sidebar chuyển drawer; dashboard 1–2 columns.

### Desktop 1280–1600 px

- Hero max width khoảng 1440 px nhưng visual layer full bleed.
- Dashboard content max width 1320–1440 px.
- Không kéo giãn paragraph/card quá rộng.

## 14. Accessibility và content safety

- WCAG AA cho text, focus, error và button states.
- Tab order khớp thứ tự nhìn; drawer có focus trap và Escape.
- `aria-live` cho autosave, streaming và auth errors.
- Canvas/decoration luôn `aria-hidden` và `pointer-events: none`.
- Mọi interaction hoạt động bằng keyboard.
- Không dùng animation làm tín hiệu duy nhất.
- Copy tránh hứa hẹn “AI hiểu hoàn toàn bạn” hoặc lời khuyên y khoa/tâm lý.

## 15. Performance budget

### MVP 2.5D

- Hero poster AVIF <= 220 KB desktop, <= 120 KB mobile.
- Tổng decorative assets tải ban đầu <= 700 KB.
- JS bổ sung cho ambient layer <= 60 KB gzip.
- LCP <= 2.5 s ở mobile simulated 4G.
- CLS <= 0.1, INP <= 200 ms.
- Canvas pause khi tab hidden hoặc hero ra ngoài viewport.

### Nếu bật Three.js sau MVP

- Dynamic import sau first paint/idle.
- Tổng GLB + texture <= 2.5 MB.
- DPR cap 1.5; giảm particle trên thiết bị yếu.
- Tự fallback poster nếu WebGL fail, save-data bật hoặc reduced-motion bật.
- Chỉ bật khi visual QA tốt hơn rõ rệt so với 2.5D và vẫn đạt Lighthouse gate.

## 16. Kế hoạch thực thi 4 ngày

### Ngày UI-1 — Foundation + Landing

- Chụp baseline desktop/mobile của UI hiện tại.
- Tạo semantic tokens và calm primitives.
- Chuẩn bị asset botanical riêng.
- Implement landing desktop + mobile + reduced-motion.
- Gate U1: hero đúng hierarchy, CTA rõ, mobile không overflow, không dùng asset không rõ license.

### Ngày UI-2 — Auth + Onboarding + App shell

- Redesign auth và onboarding nhưng giữ nguyên logic.
- Implement sidebar groups, header và bottom nav.
- Gate U2: keyboard/auth states/mobile drawer pass; member/admin guard không bị ảnh hưởng.

### Ngày UI-3 — Dashboard + Questions + Conversation

- Giảm mật độ dashboard theo ba vùng ưu tiên.
- Redesign question flow và chat/agency proposal.
- Gate U3: send/stream/accept/edit/reject states có visual đầy đủ; loading/error/empty state không vỡ layout.

### Ngày UI-4 — Secondary pages + QA

- Apply shared system cho Life Map, experiments, reflections, learnings, progress, resources và admin.
- Responsive pass 390/768/1440 px.
- Accessibility, reduced-motion và performance pass.
- Gate U4: không còn indigo legacy ngoài AI accent có chủ đích; không còn remote `<img>`; screenshot review pass.

## 17. Verification checklist

Chạy sau từng gate:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Visual checks:

- Landing: 390×844, 768×1024, 1440×900.
- Auth/onboarding: success, invalid input, loading, provider disabled.
- Dashboard: empty/first-use, partial data, populated.
- Chat: idle, streaming, AI error, pending observation, edit, accepted, rejected.
- `prefers-reduced-motion`, keyboard-only, 200% zoom.

Lưu ý baseline hiện tại còn backend/typecheck blockers từ audit trước. UI agent không được che lỗi hoặc xóa test để tạo build xanh; phải ghi rõ lỗi pre-existing và phối hợp remediation riêng trước final merge.

## 18. Definition of Done

- Người dùng nhận ra cùng một visual language từ landing → auth → app.
- Viewport đầu của landing tạo cảm giác yên tĩnh, có chiều sâu và chỉ có một CTA chính.
- Dashboard nhẹ hơn, ưu tiên hành động hôm nay thay vì hiển thị mọi module cùng lúc.
- Conversation dễ đọc lâu; Agency Gate nổi bật nhưng không gây căng thẳng.
- Responsive, keyboard, reduced-motion và WCAG AA đạt.
- Không sao chép source/asset độc quyền từ reference.
- Không thay đổi API contract, auth rule hoặc RLS trong UI branch.
- Không có regression mới trong lint/typecheck/test/build ngoài blocker backend đã ghi nhận trước khi bắt đầu.

## 19. Prompt giao cho AI thực thi

```text
Đọc README.md, docs/00–12 và code hiện tại. Thực thi docs/12_UI_REDESIGN_SYLVA_CALM_PLAN.md theo thứ tự UI-1 → UI-4, dừng sau từng gate để báo screenshot và quality results.

Mục tiêu là tái tạo mood/composition của Sylva Living Green bằng hệ visual riêng cho Life Lab, không sao chép code hoặc asset từ reference. MVP ưu tiên 2.5D CSS/SVG/canvas, performance và reduced-motion; không tự thêm Three.js nếu chưa chứng minh cần thiết.

Không đổi business logic/API/auth/RLS trong UI branch. Giữ tiếng Việt chuẩn, không hard-code tên user hoặc dữ liệu giả ở production state. Mọi raster dùng next/image và local optimized assets. Sau mỗi gate chạy lint, typecheck, test, build và chụp 390/768/1440.
```
