# Life Lab — Plan đồng bộ Three.js từ Landing vào toàn bộ Web App

> Mục tiêu: giữ nguyên cấu trúc và cách dùng của web app hiện tại, nhưng đồng bộ không gian thiên nhiên có chiều sâu, bảng màu, ánh sáng và chuyển động với landing page. 3D là lớp môi trường hỗ trợ cảm xúc; UI, chữ, form, card và dữ liệu vẫn là DOM/React để rõ ràng, nhẹ và dễ dùng.
>
> Phạm vi: frontend/UI only. Không đổi Supabase schema, API contract, auth, RLS, Gemini prompt hay logic nghiệp vụ. Không deploy.

## 0. Sự thật về code hiện tại

Landing hiện tại **chưa dùng Three.js**. `src/components/calm/living-backdrop.tsx` đang gồm:

- SVG nhiều lớp bằng `next/image`.
- Canvas 2D để vẽ pollen particle.
- CSS animation để tạo chuyển động nổi/parallax.

Vì yêu cầu mới là Three.js thật, AI triển khai phải nâng cấp lớp visual dùng chung; không được chỉ gọi Canvas 2D hiện tại là Three.js.

Các điểm cần biết trước khi sửa:

- Landing: `src/app/page.tsx` + `src/components/calm/living-backdrop.tsx`.
- App shell: `src/app/app/layout.tsx`.
- Dashboard: `src/app/app/page.tsx`.
- Design token nằm dưới namespace `calm` trong `tailwind.config.ts`; class đúng là `bg-calm-morning-mist`, `text-calm-ink`, `border-calm-moss/...`.
- App shell/dashboard đang có thay đổi UI dở dang trong working tree. Trước khi làm, chụp baseline và đọc `git diff`; không reset hoặc ghi đè thay đổi khác.
- Không sao chép source, model, texture hay asset có bản quyền từ ThreeUI/Sylva. Chỉ tham khảo mood và composition.

## 1. Kết quả cần đạt

Người dùng phải nhận ra đây là cùng một sản phẩm xuyên suốt:

```text
Landing — rừng chạng vạng, giàu chiều sâu
    ↓ cùng seed/palette/shape/motion
App shell — khu vườn buổi sớm, sáng và dễ đọc
    ↓ cùng visual language nhưng giảm cường độ
Dashboard / Chat / Questions / Life Map — mỗi trang có một “mảnh sinh cảnh” riêng
```

Không biến màn hình app thành landing page thứ hai. Sau đăng nhập vẫn phải là một ứng dụng sử dụng hằng ngày:

- Sidebar, header, card grid và điều hướng giữ cấu trúc hiện tại.
- 3D nằm sau nội dung hoặc trong các vùng hero/banner có giới hạn.
- Text, button, input, chart và card không đưa vào WebGL.
- Không để cây/lá/particle che nội dung hoặc cản click.
- Dashboard vẫn đọc nhanh, chat vẫn viết lâu không mỏi mắt.

Ba cảm giác cốt lõi: **thanh thản — riêng tư — có chủ đích**.

## 2. Visual concept: “Một khu vườn, hai thời điểm”

### Landing — Dusk Sanctuary

- Nền forest dusk/deep moss.
- Camera thấp, có foreground moss/root, depth fog và pollen.
- Một điểm nhấn bướm hoặc mầm sáng.
- Chuyển động chậm, có cảm giác bước vào không gian.

### App — Morning Sanctuary

- Nền morning mist/warm ivory.
- Cùng hình học organic và cùng seed scene với landing, nhưng ánh sáng ban mai.
- 3D chỉ thấy rõ ở mép viewport, header/banner và khoảng trống giữa card.
- Particle giảm 50–70%; parallax giảm biên độ.
- Card nền đặc/đục đủ để đọc; không dùng glass cho toàn bộ nội dung.

### Hệ nhận diện chung

- Moss/fern/lichen/pollen là palette chính.
- Shape: đồi thấp, rễ cong, lá bản mềm, giọt sương, vòng sinh trưởng.
- Motion: thở, trôi, rung nhẹ; không spin liên tục, không bounce.
- AI accent dùng lavender rất ít, chỉ để phân biệt message/proposal do AI tạo.

## 3. Kiến trúc Three.js đề xuất

### 3.1 Dependency gate

Chỉ thêm ba package nếu chưa có:

```text
three
@react-three/fiber
@react-three/drei
```

Thêm `@types/three` nếu version `three` được chọn chưa cung cấp type phù hợp.

AI phải chọn bộ version tương thích **React 18 + Next.js 14** hiện có; không nâng Next/React và không cài “latest” mù quáng. Sau khi cài phải ghi rõ package/version đã thêm trong báo cáo.

### 3.2 Component tree

```text
src/components/sanctuary-3d/
  sanctuary-canvas.tsx          client boundary + Canvas + fallback
  sanctuary-scene.tsx           camera, lights, fog, scene variants
  sanctuary-environment.tsx     terrain/root/leaf layers
  sanctuary-particles.tsx       instanced pollen/dust
  sanctuary-butterfly.tsx       optional sprite/low-poly focal point
  sanctuary-ripples.tsx         subtle growth rings
  scene-quality.ts              device/performance/reduced-motion policy
  scene-presets.ts              landing/app/page-specific presets
  use-scene-visibility.ts       pause when hidden/offscreen
  types.ts
```

```text
src/components/calm/
  living-backdrop.tsx           wrapper dùng SanctuaryCanvas + poster fallback
  app-atmosphere.tsx            layer Three.js dùng một lần trong app layout
  sanctuary-banner.tsx          reusable clipped 3D page banner
  calm-surface.tsx              DOM surface bảo đảm contrast
```

### 3.3 Quy tắc mount

- Landing mount một `SanctuaryCanvas` full viewport.
- Khu vực `/app` mount **một Canvas duy nhất** ở `src/app/app/layout.tsx`; đổi preset bằng pathname/context, không tạo Canvas mới trên mỗi card.
- Page banner cần scene riêng chỉ khi thật sự cần; ưu tiên lấy visual từ Canvas nền của app.
- Dynamic import client-only (`ssr: false`) để không chạy WebGL ở server.
- Poster SVG/AVIF luôn render trước; Canvas fade in sau khi sẵn sàng.
- Nếu WebGL lỗi, không hiện màn hình đen và không báo lỗi cho người dùng; giữ poster fallback.

### 3.4 Scene contract

`SanctuaryCanvas` nhận props tối thiểu:

```ts
type SanctuaryVariant =
  | 'landing-dusk'
  | 'app-morning'
  | 'conversation'
  | 'questions'
  | 'life-map';

interface SanctuaryCanvasProps {
  variant: SanctuaryVariant;
  intensity?: 'low' | 'medium' | 'high';
  interactive?: boolean;
  className?: string;
  fallbackSrc?: string;
}
```

Preset quyết định:

- background/fog color;
- camera position;
- light temperature/intensity;
- particle count/speed;
- palette của terrain/leaves;
- độ sâu parallax;
- vị trí focal object;
- reduced-motion fallback.

Không hard-code scene config rải rác trong từng page.

## 4. Cách xây scene

### 4.1 Ưu tiên procedural + asset nội bộ

MVP không cần model rừng photorealistic nặng. Dùng:

- Plane/rounded geometry biến dạng nhẹ cho địa hình.
- Curve/tube geometry cho root/vine.
- Instanced mesh cho lá/pollen để giảm draw calls.
- Transparent sprite tự tạo cho bokeh/pollen.
- Fog + 2–3 light nguồn mềm.
- Shader rất đơn giản hoặc material chuẩn; không dùng post-processing nặng ở phase đầu.

Nếu dùng GLB:

- Chỉ dùng asset tự tạo hoặc có license rõ.
- Draco/Meshopt compression.
- Tổng GLB + texture landing <= 2.5 MB.
- App variant không tải asset landing nặng nếu không cần.

### 4.2 Camera và interaction

- Camera perspective cố định, FOV dịu; không orbit controls.
- Pointer parallax tối đa 4–8 px quy đổi trong scene.
- Mobile không pointer parallax.
- Scroll chỉ thay đổi camera rất nhẹ ở landing; trong app không hijack scroll.
- Không cho user kéo/xoay scene vì mục tiêu là atmosphere, không phải 3D viewer.

### 4.3 Motion

- Ambient breathing 12–24 giây.
- Leaf sway rất nhỏ, khác phase nhau.
- Pollen drift chậm, mật độ app thấp hơn landing.
- Bướm chỉ xuất hiện thưa ở landing/dashboard hero, không bay qua form/chat.
- `prefers-reduced-motion` chuyển hoàn toàn sang poster tĩnh.

## 5. Tích hợp vào layout web hiện tại

### 5.1 App shell

Giữ nguyên:

- sidebar desktop;
- mobile drawer/bottom navigation;
- header;
- content max-width;
- route và active navigation.

Chỉ đổi visual layer:

```text
z-30  sidebar/header/mobile navigation (DOM, nền đủ đặc)
z-20  page content/cards/forms (DOM)
z-10  soft scrim/gradient để giữ contrast
z-0   SanctuaryCanvas variant app-morning
```

App atmosphere gợi ý:

- Cụm lá/đồi thấp nằm ở góc phải trên và hai mép dưới.
- Trung tâm content gần như sạch để card dễ đọc.
- Sidebar dùng ivory 92–96% opacity; không cho scene chạy xuyên qua chữ.
- Header có blur nhẹ, không dùng dark forest background.
- Khi đổi route, chỉ crossfade preset 400–700 ms; không remount WebGL context.

### 5.2 Dashboard

Giữ bố cục dashboard hiện dùng:

- banner/lời chào ở đầu;
- khu conversation;
- Life Design Map 6 dimensions;
- current experiment;
- Life Lab Loop;
- các insight/progress phụ.

Đồng bộ bằng:

- `Today Sanctuary` là vùng nhìn thấy 3D rõ nhất trong app.
- Scene app nền chỉ tạo depth ở khoảng trống, không nằm sau chữ nhỏ.
- Card conversation và map dùng paper/ivory, border moss 8–12%.
- 6 dimension giữ grid và thông tin hiện tại; dùng màu thiên nhiên riêng nhưng cùng hệ.
- Experiment progress dùng leaf/fern, không dùng indigo gradient.
- Chuyển động DOM do Framer Motion; chuyển động môi trường do Three.js. Không animate cùng một phần tử bằng cả hai.

### 5.3 Conversation

- Variant `conversation`: sương nhẹ, root/leaf chỉ ở mép, particle rất ít.
- Khung chat vẫn rộng 760–840 px và là DOM.
- AI bubble paper/ivory; user bubble moss nhạt.
- Composer luôn nằm trên surface đặc, không có vật thể chuyển động ngay phía sau.
- Agency proposal là lichen card; ba nút `Chưa đúng`, `Sửa lại`, `Đúng với mình` giữ logic cũ.
- Không đưa avatar, bubble hoặc typing indicator vào WebGL.

### 5.4 Question Engine

- Variant `questions`: một mầm/cành tăng trưởng ở mép, phản ánh progress.
- Một câu hỏi mỗi màn hình, card trung tâm rõ ràng.
- Tiến độ câu hỏi vẫn có text `Câu x/y`; 3D chỉ là bổ trợ, không thay thế progress bar.
- Khi next/back, scene phản ứng cực nhẹ (thêm một vòng ripple hoặc tăng mầm), không chuyển camera mạnh.
- Input/options là DOM, touch target >= 44 px.

### 5.5 Life Design Map

- Variant `life-map`: sáu cụm/ring tương ứng sáu dimension.
- Hover/click tile DOM có thể gửi `activeDimension` vào scene context để cụm tương ứng sáng nhẹ.
- Không vẽ nội dung map bằng 3D; accessibility và dữ liệu vẫn ở DOM.

### 5.6 Trang phụ

- Experiments: visual “seed → tending → learning”.
- Reflections: ánh sáng ấm, ít particle, ưu tiên typography.
- Learnings/Resources/History: scene intensity `low`.
- Financial Life/Progress: 3D chỉ background; chart và số liệu phải hoàn toàn 2D/DOM.
- Admin: không dùng Three.js. Admin là giao diện vận hành, chỉ dùng token/typography chung.

## 6. State và routing

Tạo `SanctuarySceneProvider` ở app layout để quản lý scene presentation state, không chứa business state:

```ts
interface ScenePresentationState {
  pathname: string;
  variant: SanctuaryVariant;
  activeDimension?: string;
  progress?: number;
  isComposerFocused?: boolean;
}
```

Rules:

- Route → preset mapping nằm một chỗ trong `scene-presets.ts`.
- Page có thể cập nhật hint nhỏ như `activeDimension`; không được điều khiển camera/material trực tiếp.
- Scene lỗi không được làm crash app route.
- Không lưu scene state vào Supabase.

## 7. Performance budget bắt buộc

Desktop:

- Canvas DPR cap 1.5.
- <= 60 draw calls cho landing; <= 35 draw calls trong app.
- 50–60 FPS trên laptop phổ thông; hạ quality nếu frame time kém.
- JS Three.js tải lazy, không chặn first contentful paint.

Mobile:

- DPR cap 1.0–1.25.
- Particle <= 12–16.
- Không shadow động, không post-processing.
- Có thể dùng poster-only trên thiết bị yếu.

Fallback bắt buộc khi:

- `prefers-reduced-motion: reduce`;
- `navigator.connection.saveData === true` nếu API tồn tại;
- WebGL context không tạo được;
- tab/document hidden;
- Canvas ra khỏi viewport ở landing;
- device quality policy trả về `static`.

Implementation settings gợi ý:

```tsx
<Canvas
  dpr={[1, 1.5]}
  gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
  camera={{ fov: 40, near: 0.1, far: 80 }}
/>
```

Không giữ animation loop chạy vô hạn khi tab hidden. Theo dõi `webglcontextlost` và giữ fallback poster.

## 8. Accessibility và content safety

- Canvas `aria-hidden="true"`, `pointer-events: none` mặc định.
- DOM order/tab order không phụ thuộc vị trí vật thể 3D.
- Contrast WCAG AA được đo trên surface thực, không đo trên ảnh nền giả định.
- Focus ring luôn thấy rõ trên ivory/moss.
- Reduced motion phải tắt camera drift, particle, sway và crossfade dài.
- Không dùng màu/chuyển động làm tín hiệu duy nhất cho progress hoặc status.
- Không để visual ám chỉ AI “hiểu hoàn toàn” người dùng.

## 9. Thứ tự thực thi cho AI khác

### Phase T0 — Audit và đóng baseline

- Đọc `AGENTS.md`, `README.md`, `docs/12_UI_REDESIGN_SYLVA_CALM_PLAN.md` và file này.
- Chạy `git status`, đọc diff; không reset working tree.
- Chạy lint/typecheck/test/build và ghi blocker có sẵn.
- Chụp 390×844, 768×1024, 1440×900 cho landing, dashboard, chat, questions.
- Xác nhận class Tailwind semantic đều có prefix `calm-`.

Gate T0: có baseline và danh sách lỗi pre-existing; chưa đổi business logic.

### Phase T1 — Three.js foundation

- Cài dependency tương thích React 18/Next 14.
- Tạo `scene-quality`, `scene-presets`, `SanctuaryCanvas` và poster fallback.
- Tạo error boundary cho WebGL.
- Làm scene geometry tối thiểu với dusk/morning presets.
- Chứng minh reduced-motion và WebGL-failure fallback hoạt động.

Gate T1: scene chạy độc lập, không crash SSR, poster hiển thị trước Canvas, build không có lỗi mới.

### Phase T2 — Landing migration

- Giữ nguyên copy/CTA/nav landing.
- Thay lớp Canvas 2D hiện tại bằng `SanctuaryCanvas variant="landing-dusk"`.
- Tái sử dụng SVG hiện tại làm poster fallback, không xóa asset trước khi QA.
- Đồng bộ vị trí foreground/root/butterfly với DOM hero.

Gate T2: landing đẹp hơn fallback 2.5D, không giảm khả năng đọc/LCP quá budget.

### Phase T3 — App shell integration

- Mount một `app-morning` Canvas trong app layout.
- Thiết lập đúng z-index/scrim/surface.
- Route-to-preset crossfade, không remount context.
- Test sidebar, drawer, bottom nav, sticky header và scroll.

Gate T3: app vẫn là dashboard rõ ràng; không có canvas che click, scroll hoặc text.

### Phase T4 — Primary product screens

Thứ tự:

1. Dashboard.
2. Conversation + Agency Gate.
3. Question Engine.
4. Life Design Map.

Mỗi màn hình chỉ thêm scene hint/preset; giữ nguyên fetch, submit, autosave, streaming và decision handlers.

Gate T4: tất cả loading/error/empty/populated states không vỡ layout; logic API không đổi.

### Phase T5 — Secondary screens

- Đồng bộ calm token/surface cho experiments, reflections, learnings, progress, resources, financial life, history.
- Dùng app Canvas chung ở intensity low; không tạo Canvas riêng hàng loạt.
- Admin không dùng WebGL.

Gate T5: không còn indigo legacy ngoài AI accent có chủ đích; các trang nhìn cùng một sản phẩm.

### Phase T6 — QA và tối ưu

- Visual QA 390/768/1440.
- Keyboard, 200% zoom, reduced-motion, save-data/static mode.
- Tab hidden/visible và WebGL context lost.
- So sánh performance khi Canvas on/off.
- Chạy toàn bộ lint/typecheck/test/build; không xóa test hoặc che lỗi.

Gate T6: đạt Definition of Done ở mục 12.

## 10. File implementation map

Các file được phép sửa:

```text
package.json
package-lock.json
tailwind.config.ts
src/app/globals.css
src/app/page.tsx
src/app/app/layout.tsx
src/app/app/page.tsx
src/app/app/questions/page.tsx
src/app/app/conversations/[id]/page.tsx
src/app/app/life-map/page.tsx
src/app/app/experiments/page.tsx
src/app/app/reflections/page.tsx
src/app/app/learnings/page.tsx
src/app/app/progress/page.tsx
src/app/app/resources/page.tsx
src/app/app/financial-life/page.tsx
src/app/app/life-map/history/page.tsx
src/components/calm/*
src/components/sanctuary-3d/*
public/visuals/living-sanctuary/*
```

Không sửa nếu không có yêu cầu riêng:

```text
src/app/api/*
src/server/*
supabase/*
src/lib/supabase/*
auth/RLS/Gemini prompt
```

## 11. Checklist nghiệm thu

### Functional regression

- [ ] Landing CTA và auth navigation hoạt động.
- [ ] Sidebar/mobile nav đi đúng route.
- [ ] Dashboard link đúng trang.
- [ ] Questions load/save/back/next như trước.
- [ ] Conversation send/stream/error như trước.
- [ ] Agency proposal accept/edit/reject như trước.
- [ ] Không thay API payload hoặc response contract.

### Visual consistency

- [ ] Landing và app có cùng palette, geometry, light và motion signature.
- [ ] App là morning variant, không tối như landing.
- [ ] Dashboard giữ cấu trúc web app hiện tại.
- [ ] 3D không xuất hiện sau vùng chữ nhỏ/composer nếu không có surface.
- [ ] Không dùng remote Unsplash/fake avatar trong production UI.
- [ ] Không copy asset/code từ ThreeUI.

### Performance/accessibility

- [ ] Poster render khi JS/WebGL chưa sẵn sàng.
- [ ] Reduced-motion dùng static fallback.
- [ ] Canvas không bắt pointer và không vào accessibility tree.
- [ ] Mobile yếu vẫn dùng app bình thường.
- [ ] Không animation khi tab hidden.
- [ ] Không có horizontal overflow ở 390 px.
- [ ] Text/button/input đạt contrast và keyboard focus rõ.

## 12. Definition of Done

- Landing thật sự dùng Three.js khi thiết bị hỗ trợ; fallback 2.5D vẫn hoàn chỉnh.
- App mount tối đa một Canvas môi trường chung và giữ nguyên cấu trúc dashboard.
- Visual chuyển từ landing dusk sang app morning tự nhiên, người dùng nhận ra cùng một “khu vườn”.
- Dashboard, chat, questions và Life Map có preset riêng nhưng không đổi nghiệp vụ.
- 3D không gây regression cho auth/navigation/fetch/submit/streaming.
- Reduced-motion, save-data và WebGL failure đều có đường fallback.
- Không có lỗi lint/typecheck/test/build mới do phần UI/Three.js.
- Báo cáo cuối nêu rõ file đã đổi, asset/license, performance trước/sau và blocker pre-existing.

## 13. Prompt giao thẳng cho AI thực thi

```text
Bạn đang làm frontend cho Life Lab trong repo hiện tại. Đọc AGENTS.md, README.md, docs/12_UI_REDESIGN_SYLVA_CALM_PLAN.md và docs/13_APP_THREEJS_VISUAL_SYNC_PLAN.md đầy đủ trước khi sửa.

Yêu cầu cốt lõi: giữ nguyên cấu trúc/cách dùng của dashboard hiện tại và toàn bộ business logic; nâng visual layer để landing và app đồng bộ bằng Three.js thật. Landing là “Dusk Sanctuary”, app là “Morning Sanctuary”. 3D chỉ là decorative environment; mọi text/card/form/chart/chat vẫn là DOM React.

Làm đúng Phase T0 → T6 và dừng báo cáo sau từng gate. Trước khi sửa phải đọc git diff và bảo toàn thay đổi đang có. Chỉ cài bộ three/@react-three/fiber/@react-three/drei tương thích React 18 + Next 14, không nâng framework. Mount một Canvas chung ở app layout, có poster fallback, reduced-motion, save-data, WebGL failure và visibility pause. Không copy asset/code ThreeUI, không đổi API/auth/RLS/Gemini/Supabase.

Lưu ý Tailwind token hiện dùng namespace calm-, ví dụ bg-calm-morning-mist. Sau mỗi gate chạy lint, typecheck, test, build và chụp màn hình 390/768/1440. Không xóa test, không che lỗi pre-existing, không tự deploy.
```
