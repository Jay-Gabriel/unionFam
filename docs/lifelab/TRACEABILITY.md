# TRACEABILITY — Life Lab V8.7.2

Bảng truy vết: **Yêu cầu (Master/User State) → Artifact code → Bằng chứng test**. Trạng thái: ✅ triển khai + test, 🟡 triển khai (chưa có test tự động riêng), ⬜ chưa làm / chưa kiểm chứng.

## 1. Canonical Runtime (Phần 2)
| Yêu cầu | Code | Test | TT |
|---|---|---|---|
| Enum canonical N01–N03 | `packages/contract/src/enums.ts` | `transitions.test.ts` | ✅ |
| Bảng transition T001–T063 + guard | `contract/src/transitions.ts`, `server/src/engine/stateMachine.ts` | `transitions.test.ts` (63 ids, positive+negative) | ✅ |
| Priority Crisis>Stop>Privacy>State | `server/src/engine/orchestrator.ts` | `orchestrator.test.ts` | ✅ |
| Backend từ chối transition ngoài bảng | `stateMachine.validateTransition` | `transitions.test.ts` TRANSITION_REJECTED | ✅ |
| Mọi outcome qua checkpoint (T039–T043) | `transitions.ts` | `transitions.test.ts` | ✅ |
| T062/T063 Life Map update | `transitions.ts` | `transitions.test.ts` | ✅ |

## 2. Safety (Phần 4 + User State trục 1)
| Yêu cầu | Code | Test | TT |
|---|---|---|---|
| Taxonomy S0–S3, high-stakes, relational | `engine/classifier.ts` | `safety.test.ts` S01–S10 | ✅ |
| Ma trận Safety + User Stop | `engine/safety.ts` | `safety.test.ts`, `orchestrator.test.ts` | ✅ |
| S2 ≤1 câu; S3 urgent+CLOSE | `engine/safety.ts` | `safety.test.ts` A02/A03 | ✅ |
| USER_STOP → CLOSE, không feedback/memory | `orchestrator.ts` | `orchestrator.test.ts` A01; HTTP e2e | ✅ |
| SAFETY_RESOURCES cấu hình, không bịa số | `engine/safetyResources.ts`, `config.ts` | `safety.test.ts`; HTTP S3 e2e | ✅ |
| Safety độc lập billing/queue (fail-closed) | rule-based classifier + `safeFallback` | `orchestrator.test.ts` | ✅ |

## 3. Data & Memory (Phần 3 + User State trục 7)
| Yêu cầu | Code | Test | TT |
|---|---|---|---|
| 14 bảng canonical + 2 verif/lifemap status | `migrations/001_init.sql` | migrate e2e (17 relations) | ✅ |
| memory_mode NO_MEMORY/ASK_LATER/PROPOSALS_ALLOWED | `enums.ts`, `memory.ts` | `orchestrator.test.ts` A09 | ✅ |
| Permission per-item, chỉ ghi sau checkpoint | `services/memory.ts`, `turnService.ts` | `qualityGuard` MEMORY rule; e2e | ✅ |
| NO_MEMORY chặn long-term write | `memory.decideProposals`, `orchestrator` | `orchestrator.test.ts`; `qualityGuard.test` | ✅ |
| View/Edit/Revoke/Delete/Export | `memory.ts` + `routes/api.ts` | 🟡 (unit qua service; e2e DB một phần) | 🟡 |
| Xóa/revoke không nạp lại context | `memory.listMemory` filter | 🟡 | 🟡 |
| Audit log turn/memory | `sessionRepo.logTurn/auditEvent` | turn_logs e2e | ✅ |

## 4. AI Prompt (Phần 6)
| Yêu cầu | Code | Test | TT |
|---|---|---|---|
| Prompt layers, user content untrusted | `aiGateway.renderPrompt` | 🟡 | 🟡 |
| Structured output schema v8.7.1 | `qualityGuard.structuredOutputSchema` | `orchestrator.test.ts` | ✅ |
| Quality Guard rules | `qualityGuard.ts` | `orchestrator.test.ts` (SCHEMA/TRANSITION/QUESTION_BUDGET/GROUNDING/MEMORY/HYPOTHESIS/REPAIR) | ✅ |
| Retry 1 lần + fallback | `orchestrator.generateWithGuard`, `safeFallback` | `orchestrator.test.ts` fallback | ✅ |
| Provider adapter (mock/gemini) | `aiGateway.makeProvider` | mock e2e; gemini ⬜ (thiếu key) | 🟡 |
| JSON hỏng không tới UI | `qualityGuard` + fallback | `orchestrator.test.ts` AC010 | ✅ |

## 5. Technical (Phần 5)
| Yêu cầu | Code | Test | TT |
|---|---|---|---|
| API /api/v1 đầy đủ endpoints | `routes/api.ts` | HTTP e2e (sessions/turns/stop) | ✅ |
| Idempotency-Key | `routes/api.ts` cache | 🟡 | 🟡 |
| 409 STATE_VERSION_CONFLICT | `turnService`, `api.ts` | HTTP e2e 409 | ✅ |
| Error contract không lộ stack | `api.ts` err() + handler | HTTP e2e | ✅ |
| Transaction boundaries | `db/pool.withTx`, `turnService` | e2e persist | ✅ |
| Không client gọi model | web `api.ts` chỉ gọi `/api` | code review | ✅ |
| Auth/OIDC, encryption field-level | — | — | ⬜ |
| 100 concurrent benchmark | — | — | ⬜ |

## 6. UX/UI (Phần 7)
| Yêu cầu | Code | Bằng chứng | TT |
|---|---|---|---|
| UX01 Welcome | `web/src/App.tsx` Welcome | screenshot mobile/desktop-01 | ✅ |
| UX02 Consent (no default opt-in) | Consent | screenshot mobile-02 | ✅ |
| UX03 Conversation (home) | Conversation | screenshot mobile/desktop | ✅ |
| UX04 Verify / UX05 Repair | choices group | 🟡 (render qua ui_actions) | 🟡 |
| UX06/07 Outcome selection/checkpoint | possibleOutcome UI | 🟡 | 🟡 |
| UX08 Memory Permission per-item | proposals UI | 🟡 | 🟡 |
| UX09 Session Feedback (ẩn sau stop/safety) | feedback block | ✅ logic | ✅ |
| UX10 Life Map | LifeMapScreen | screenshot mobile-04 | ✅ |
| UX11/12 Experiment | ExperimentsScreen | screenshot mobile-05 | ✅ |
| UX13/14 Journey/Memory Center/Privacy | JourneyScreen | screenshot mobile-06 | 🟡 |
| UX15 Safety surface in chat | msg--safety + resources | logic e2e S3 | ✅ |
| Mobile-first 360px, reduced-motion, a11y | `styles.css`, aria | screenshot 360px; code | 🟡 |
| Không lộ state/confidence cho user | web không hiển thị | code review | ✅ |

## 7. Entitlement/Billing (prompt mục 6)
| Yêu cầu | Code | TT |
|---|---|---|
| Entitlement layer + limit rõ trước phiên | `services/entitlement.ts`, hiển thị ở web | ✅ |
| Không chặn safety / không ép thanh toán giữa crisis | `checkTurnAllowed(safetyActive)` | ✅ |
| Billing adapter cấu hình, chưa bật thu tiền | `billingAdapter`, `BILLING_ENABLED=false` | ✅ |

## 8. Acceptance (Phần 8) — map nhanh
A01→orchestrator USER_STOP; A02/A03→safety; A04→hypothesis/VERIFY; A05→repair persistence (turnService); A07→experiment 5 fields guard; A08/A09→memory NO_MEMORY; A10/A11→permission-before-advice (T024/T030); A12→OUTCOME tier≤3; A13→question budget; A14→experiment reflection; A16→high-stakes; A17→relational; A18→change focus; A19→low energy; A20→confusion repair (T050/T051). Chi tiết pass/skip ở `TEST_REPORT.md`.
