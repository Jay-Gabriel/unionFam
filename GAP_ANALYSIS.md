# GAP_ANALYSIS.md — Life Lab (V8.7.2)

So sánh **yêu cầu (Master V8.7.2 + User State)** với **hiện trạng code** tại `/home/jay/Desktop/unionFam`, xác định **phần thiếu**, **thay đổi cần làm**, và **cách kiểm tra**.

## Hiện trạng code (đã khảo sát)
- Stack: Vite + React 19 + TypeScript + Three.js, Tailwind v4. Nhiều asset 3D (`models/*.glb`, `draco/`, `models/baked/*`), video, textures. `server.mjs` chỉ là static file server + radio stations.
- AI: `src/services/geminiService.ts` gọi **Gemini trực tiếp từ client**, API key đọc từ `import.meta.env.VITE_GEMINI_API_KEY` / `localStorage`. Prompt theo "kịch bản V7".
- **Không có**: backend state machine, PostgreSQL, migrations, bộ test, memory/privacy enforcement, safety classifier, outcome checkpoint, Quality Guard.

### Vi phạm trực tiếp spec ở code cũ
| Vi phạm | Spec | Mức |
|---|---|---|
| API key lộ ở client bundle | D04 "Server side gateway; không lộ API key ở client"; SEC02; AC013 | P0 |
| Không có backend sở hữu state/transition/write | Phần 2, Definition of Done | P0 |
| Không có Safety/Stop guard | Phần 4, AC002–AC004, AC015 | P0 |
| Không có memory permission/checkpoint | AC005–AC007, AC014 | P0 |
| Prompt V7, không structured output | Phần 6 | P0 |

## Quyết định kiến trúc (giữ gì / đổi gì)
- **Giữ**: thư mục asset nghệ thuật (`public/assets/*.png` living-map artwork) để tái dùng cho Life Map nếu phù hợp; không xóa backup.
- **Đổi/Thêm**: Dựng **monorepo TypeScript mới** cạnh code cũ (không xóa code cũ):
  - `apps/server` — Node + Express + TypeScript: orchestrator, state machine T001–T063, safety classifier, quality guard, memory service, AI gateway (adapter), PostgreSQL qua `pg` + SQL migrations.
  - `apps/web` — Vite + React + TS mobile-first, UX01–UX15, gọi backend `/api/v1` (không bao giờ gọi model trực tiếp).
  - `packages/contract` — enum canonical + JSON schema + types dùng chung FE/BE (DL04).
  - Test: `vitest` cho backend guard + acceptance; harness mock provider.
- **Lý do stack**: Express + pg + vitest là tổ hợp "đơn giản để vận hành" đúng khuyến nghị D01/D02, có transaction + schema validation + test.

## Bảng GAP theo từng phần Master

| # | Yêu cầu (Master) | Hiện trạng | Phần thiếu / Thay đổi | Cách kiểm tra |
|---|---|---|---|---|
| G1 | Enum canonical (N01–N03, từ điển enum) | Không có | `packages/contract/enums.ts` đủ 9 namespace | unit test enum + lint |
| G2 | 40 state + T001–T063 transition có guard | Không có | `transitions.ts` + `stateMachine.ts` validate | T001–T063 positive/negative tests |
| G3 | Priority: Crisis>Stop>Privacy>State (C03) | Không có | `orchestrator.ts` theo thứ tự công bố | property tests A01–A03, C-series |
| G4 | Safety matrix S0–S3 + User Stop | Không có | `safety.ts` classifier (rule-based + hook AI) + handlers | S01–S10, A01–A04, AC002–AC004 |
| G5 | Memory contract, NO_MEMORY, per-item permission | Không có | `memory.ts` + bảng; checkpoint gate | C04–C10, A08–A09, AC005–AC007, AC014 |
| G6 | Outcome checkpoint trước Memory | Không có | state SESSION_OUTCOME_CHECKPOINT bắt buộc | AC005 negative test |
| G7 | Evidence/Insight/Repair lifecycle | Không có | services + bảng; verification_status | A04–A05, R01–R10 |
| G8 | Experiment + check-in | Không có | `experiments` + reviews, 5 field | A07, A14, E01–E10 |
| G9 | AI gateway server-side + structured output + Quality Guard + retry/fallback | Client-side, không schema | `aiGateway.ts` + `qualityGuard.ts` + mock provider + Gemini adapter | AI01–AI12, A10–A13 |
| G10 | DB 14 bảng + migrations + rollback | Không có | SQL migrations idempotent | DB01–DB12, fresh+upgrade test |
| G11 | API /api/v1 + idempotency + 409 version | server.mjs static | REST routes đầy đủ | API01–API10 |
| G12 | UX01–UX15 mobile-first 360px, a11y, reduced motion | App 3D cũ | `apps/web` màn hình mới | UXA01–UXA12, screenshot desktop/mobile |
| G13 | 7-trục User State snapshot | Không có | `userState.ts` tính toán & lưu | assertion snapshot |
| G14 | Entitlement + billing adapter (chưa thu tiền) | Không có | `entitlement.ts` config, flag off | unit test limit hiển thị trước phiên |
| G15 | SAFETY_RESOURCES cấu hình theo thị trường, không bịa | Không có | `safetyResources.ts` từ env/config, fallback chung | test không có số bịa |
| G16 | Observability/audit, không log nội dung nhạy cảm | console.error | `turn_logs`, `audit_events`, redaction | DB09, SEC |
| G17 | Prompt injection defense, user content untrusted | Không có | delimiter + no direct write | AI08 |

## Phạm vi KHÔNG làm trong bản này (ghi rõ)
- Không bật thu tiền thật, không chọn cổng thanh toán (prompt mục 6). Billing chỉ là adapter cấu hình.
- Không build thế giới 3D/game (prompt mục 3). Dùng SVG + motion tinh tế.
- Không tự ký release gate cần Product Owner/Safety Reviewer (Phần 8). Báo cáo trung thực pass/fail/skip.
- Load test 100 concurrent: cung cấp script + hướng dẫn; chỉ chạy khi môi trường cho phép, nếu không chạy sẽ ghi "chưa kiểm chứng".
- Provider thật (Gemini/OpenAI): chỉ chạy khi có credential; không có thì test bằng mock và ghi rõ phần chưa kiểm chứng tích hợp thật.

## Thứ tự thực thi (từng phần chạy được)
1. contract (enums/schema/types) → 2. DB migrations → 3. state machine + guard + tests → 4. safety + memory + privacy + tests → 5. AI gateway + quality guard (mock) → 6. API routes → 7. web UX01–UX15 → 8. entitlement/billing adapter → 9. build + test + screenshot + docs.
