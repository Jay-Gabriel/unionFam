# Life Lab — Conversation System (V8.7.2)

Web app phản tư và thiết kế trải nghiệm sống, triển khai theo **LIFE LAB CONVERSATION SYSTEM V8.7.2 MASTER SPECIFICATION** + **LIFE LAB USER STATE (V8.2 structure / V8.7 data)**.

> Trạng thái: **MVP có thể chạy và kiểm thử**, chưa phải production-ready. Các release gate cần Product Owner / Safety Reviewer ký duyệt (xem `docs/TEST_REPORT.md` và Phần 8 của Master). Bản này dựa trên **V8.7.2** (không có bản V8.7.3 trên máy — xem `../SPEC_CONFLICTS.md` C01).

## Kiến trúc

Monorepo npm workspaces:

```
lifelab/
├── packages/contract   # Enum canonical, bảng transition T001–T063, types, output schema (dùng chung FE/BE)
├── apps/server         # Express + TS + pg: orchestrator, state machine, safety, memory, AI gateway, quality guard
└── apps/web            # Vite + React + TS: UX01–UX15, mobile-first 360px
```

Nguyên tắc cốt lõi (cưỡng chế ở backend, không chỉ ở prompt):
- Backend sở hữu state / transition / quyền ghi. Model chỉ **đề xuất** nội dung có cấu trúc.
- Thứ tự ưu tiên: **Crisis Safety → User Stop → Permission/Privacy → State Machine → Schemas → Techniques → Examples**.
- AI provider **chỉ ở server** (không lộ key ở frontend). Dev/test dùng `mock` provider không cần key.
- Mọi outcome đi qua `SESSION_OUTCOME_CHECKPOINT` trước `MEMORY_PERMISSION`.
- `NO_MEMORY` chặn mọi long-term write; dữ liệu xóa/revoke không nạp lại vào context.

## Yêu cầu
- Node >= 18.17
- PostgreSQL (bất kỳ cách nào: local, docker...)

## Chạy nhanh (dev)

```bash
cd lifelab
npm install

# 1) PostgreSQL — ví dụ bằng docker
docker run -d --name lifelab-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=lifelab -p 5433:5432 postgres:16-alpine

# 2) Cấu hình env
cp .env.example apps/server/.env
# sửa DATABASE_URL=postgres://postgres:postgres@localhost:5433/lifelab

# 3) Chạy migrations
DATABASE_URL=postgres://postgres:postgres@localhost:5433/lifelab npm run migrate -w apps/server

# 4) Chạy backend (mock AI provider — không cần key)
DATABASE_URL=postgres://postgres:postgres@localhost:5433/lifelab AI_PROVIDER=mock npm run dev:server
# backend: http://localhost:8787  (health: /health)

# 5) Chạy frontend (proxy /api -> :8787)
npm run dev:web
# web: http://localhost:5173
```

## Dùng AI provider thật (Gemini)
```bash
AI_PROVIDER=gemini AI_API_KEY=<key của bạn> AI_MODEL=gemini-2.0-flash npm run dev:server
```
Key chỉ nằm ở server. Chưa có credential → chạy `mock` và phần tích hợp provider thật được ghi là **chưa kiểm chứng** trong test report.

## Build & Test
```bash
npm run build        # build contract + server + web
npm test -w apps/server   # 40 test: transitions T001-T063, safety, orchestrator, quality guard
```

## Cấu hình Safety resources (quan trọng)
`SAFETY_RESOURCES_JSON` cấu hình nguồn hỗ trợ khẩn cấp **theo thị trường**. Hệ thống **không bịa số điện thoại**; nếu để trống sẽ dùng hướng dẫn chung. Trước khi mở cho người dùng thật, Product Owner/Safety Reviewer phải điền số chính thức đã xác minh.

## Tài liệu bàn giao
- `../GAP_ANALYSIS.md`, `../SPEC_CONFLICTS.md`
- `docs/TRACEABILITY.md` — requirement → code → test
- `docs/TEST_REPORT.md` — passed / failed / skipped + lý do
- `docs/screenshots/` — desktop + mobile
- `docs/spec/` — bản text trích xuất của Master V8.7.2 + User State

## Giới hạn hiện tại (chưa làm / chưa kiểm chứng)
- Chưa bật thu tiền; billing adapter chỉ là stub cấu hình (Free/Premium là giả định cần review).
- Chưa benchmark 100 concurrent turns (cần môi trường load test).
- Tích hợp provider thật chưa kiểm chứng khi thiếu credential.
- Auth/OIDC, mã hóa field-level, retention jobs: chưa triển khai đầy đủ (ghi trong traceability).
- Không build 3D/game (theo yêu cầu bản đầu).
