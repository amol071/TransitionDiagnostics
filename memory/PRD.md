# LDC AI Platform — Product Requirements & State

## Problem Statement
Production-ready internal enterprise web application for a Leadership Development Center workflow. Modernizes an ASP.NET Web Forms–style LDC process into a secure, role-based React + FastAPI + MongoDB SPA with AI-assisted evaluation, summaries and drafting powered by Claude Sonnet 4.5 via Emergent Universal LLM Key. Supports standard and renomination flows; multi-source synthesis (employee self, manager, stakeholder, 360, psychometric, panel, HR). Landing page with 3 product tiles: **MDC (disabled), LDC (active), LFP (disabled)** + **Admin Center**.

## Architecture
- **Backend**: FastAPI (`/app/backend`) — routers: `auth`, `cases`, `forms`, `documents`, `ai`. Mongo via Motor. JWT (HS256, 7-day). Emergent object storage for uploads. Claude Sonnet 4.5 via `emergentintegrations` for AI.
- **Frontend**: React 19 + React Router 7 + Tailwind + shadcn/ui + @phosphor-icons/react + sonner toasts. Fonts: Work Sans (headings) + IBM Plex Sans (body). Design system from `/app/design_guidelines.json` (Swiss / high-contrast, amber "AI Draft" accent).
- **Models** (Pydantic + MongoDB collections): User, Employee, Capability, NomineeCase, EmployeeForm, ManagerForm, StakeholderFeedback, PanelReview, HRReview, Document, AIAnalysis, AuditLog.
- **Workflow states**: draft → launched → employee_* → manager_* → stakeholder_* → panel_* → hr_* → closed / reopened.

## User Personas (seeded demo accounts — see `/app/memory/test_credentials.md`)
- **Admin / Coordinator** (admin@ldc.io) — launch, reopen, audit, manage users/capabilities.
- **Employee** (alice.emp@ldc.io, bob.emp@ldc.io, diana.emp@ldc.io) — self-reflection, key contributions, capability marker.
- **Manager** (mary.mgr@ldc.io) — manager review, stakeholder identification, readiness call.
- **Panel Member** (peter.panel@ldc.io, sara.panel@ldc.io) — consolidated view, synthesis, AI panel draft.
- **HR / HRBP** (hr.lead@ldc.io) — final summary report with AI drafts.
- **Stakeholder** (stake.one@ldc.io) — capability-wise feedback.

## What's Implemented (2026-08-30 v5) · Wireframes documentation page

- **New public route `/wireframes`** — single-page, low-fidelity wireframe deliverable for stakeholder review.
- 16 screen wireframes covering the entire app: Landing · Login · Dashboard · Nominees list · Add nominee dialog · Add employee dialog · Case detail · Employee self-reflection (with 7 core GCFs + optional 5) · Manager review · Stakeholder feedback · Panel review · Prior-cycle dossier · HR summary · Uploads centre · Status dashboard · Notifications drawer · Admin Center.
- Plus a case-lifecycle flow diagram (Nominate → Employee → Manager → Stakeholder → Panel → HR → Closed) and a legend explaining wireframe conventions.
- Grayscale-only (dashed = placeholders, solid = structural elements), desktop-canvas (~1200px), backward-looking (documents the app as it stands today).
- Sticky left-hand index with anchor links; every card is `.break-inside-avoid` and print CSS hides chrome so browser Print → clean PDF.
- Publicly reachable (no auth), so it can be shared with external reviewers without login friction.
- File: `/app/frontend/src/pages/Wireframes.jsx` (self-contained, ~570 lines).

## What's Implemented (2026-04-21 v4) · Self-reflection Focus + Clear Form

- **Employee self-reflection now shows only 7 core GCFs** (hardcoded in `/app/frontend/src/lib/gcf.js → CORE_GCF_KEYS`):
  - *Leading Self*: Hunger to Learn and Improve · Emotional and Social Awareness
  - *Leading Others*: Leading Team · Developing Others · Influencing · Fostering Collaboration
  - *Leading Business*: Acting Strategically
- **Optional "Reflections on other GCFs" section** under Overall reflection — lists the 5 non-core GCFs (Initiative · Customer Centricity · Functional Capability · Delivering Results · Institution Building) as checkboxes that reveal a comment textarea. Header copy matches the required text verbatim.
- **Validation (both frontend toasts and backend 400)**: selected count must be 0 OR 2–3; if opted in, each selected GCF requires a comment. Max 3 enforced via disabled checkboxes.
- **New model field** `EmployeeForm.other_gcf_comments: List[OtherGcfComment]` (gcf_key, gcf_label, comment). Persisted through `PUT /api/cases/{id}/employee-form`. Backend submit-only validation in `routes_forms.py` returns `400` for invalid counts.
- **Clear form button on every form** (Employee / Manager / Stakeholder / Panel / HR) via new reusable `/app/frontend/src/components/ClearFormButton.jsx` — two-click confirm pattern (iframe-safe, no `window.confirm`). Resets in-memory state + PUTs empty draft to the server, toasts "Form cleared".
- **Testing**: 68/68 backend tests PASS (`/app/test_reports/iteration_3.json`, new `/app/backend/tests/test_other_gcf.py`). Frontend validated via Playwright — DOM shows exactly 3 pillars / 7 GCFs, exact header text, clear buttons on all 5 forms.

## What's Implemented (2026-04-21 v3) · Master Data Ingestion
- **Master reference tables** — new `master_companies`, `master_functions`, `master_business_units`, `master_levels` Mongo collections.
- **`/app/backend/master_data.py`** seeds Godrej-aligned reference data: 8 Companies (GCPL, GPL, GAVL, GIL, G&B, GCap, GHF, GFL), 20 Functions, 25 Business Units (scoped per-company via `company_code`/`company_id`), and 9 Levels/Bands (E1–E7 + M1–M4) mapped to LDC L1–L4.
- **`seed_master_data()`** runs on every startup (idempotent upsert keyed on `code`), and backfills existing employees with `company_id`/`function_id`/`bu_id`/`level_id` when legacy string fields match.
- **New models in `models.py`**: `Company`, `Function`, `BusinessUnit`, `Level`; `Employee` now has optional `company_id`, `function_id`, `bu_id`, `level_id` foreign-key fields.
- **New read-only routes** (`routes_master.py`): `GET /api/master/companies`, `/api/master/functions`, `/api/master/business-units`, `/api/master/levels`, `/api/master/all`.
- **`POST /api/employees`** now auto-denormalizes the readable string fields (company, bu, function, level) when master IDs are supplied.
- **Admin Center** — added a "Master data · Godrej reference tables" panel that renders all four tables with counts.
- **Nominees page** — new **Add employee** button + dialog that uses the Combobox for Company/BU/Function/Level, with BU filtered by selected Company.
- **Manager form stakeholders** — new "Pick from directory" typeahead Combobox that auto-fills Name+Email from the employee directory.
- **Testing**: 64/64 backend tests passing (`/app/test_reports/iteration_2.json`; new file `/app/backend/tests/test_master_data.py` covers 25 master-data assertions).

## What's Implemented (2026-04-21 v2)

### Product rename & gated entry
- App renamed to **Transition Diagnostics**; landing header shows dynamic `(FY YYYY-YYYY)` derived from current date (fiscal year starts April).
- Landing page is **protected** — unauthenticated users visiting `/` are redirected to `/login`. After login, users land on `/` with module tiles (MDC disabled · **LDC live** · LFP disabled) plus Admin Center (admin-only).
- Sign-out control on landing header.

### Document auto-summary on upload
- `pypdf` added; text extracted from PDFs and text files on upload (stored in `documents.parsed_text`).
- FastAPI `BackgroundTasks` runs `ai_document_summary` (Claude Sonnet 4.5) and stores an `AIAnalysis` of type `document_summary` linked to the case + doc_id.

### Notifications (in-app + mocked email)
- `notifications` and `email_outbox` Mongo collections.
- `notify(user_ids, type, title, body, case_id)` helper + `recipients_for_case(roles)` mapper.
- Triggered on: case launched, panel launched, employee_submitted, manager_submitted, panel_submitted (all panels done), hr_finalized, form_reopened.
- Frontend `NotificationBell` in app header (unread badge, dropdown, mark-all-read, click routes to case).
- Email delivery is MOCKED (written to `email_outbox` with provider=`MOCKED`). To enable real email delivery, integrate Resend/SendGrid/Twilio.

### Renomination prior-cycle dossier
- Bob Sharma seeded with a prior FY25 case (`status: closed`) with historical manager form, panel reviews, and HR summary containing readiness, strengths, development areas, and a development plan.
- New endpoint `GET /api/cases/{id}/prior` returns prior case + emp/mgr/panel/hr forms.
- On `CaseDetail` for renomination cases, a **Prior cycle · FY25** panel renders side-by-side prior HR readiness + manager readiness + prior strengths/development areas + prior panel capability ratings + prior development plan.

## Prior state (2026-04-21 v1)
### Core workflow
- Landing page + Admin Center gate + JWT auth w/ 10 seeded users.
- Role-based dashboards (KPIs, my-cases list, AI Case Brief).
- Nominee administration: list, search, add nominee, launch case, launch panel, per-role filtered cases.
- Employee self-reflection form: contributions (2–5), capability responses with next-level marker + rationale, overall reflection, autosave, submit-locks-readonly.
- Manager form: capability review grid, stakeholder rows (min 3), readiness call, overall rationale, AI rewrite per-field, AI stakeholder suggestions.
- Stakeholder feedback form: capability ratings + qualitative.
- Panel review: consolidated capability matrix (self / manager / stakeholder / you), AI panel draft with one-click apply, bias/discussion flags, capability gap, integrated summary, document viewer drawer.
- HR final summary: strengths, improvements, overall summary, development plan, additional feedback, readiness; AI HR draft one-click apply; development plan generator.
- Upload Center: per-document-type status, upload / replace / delete / version history, Emergent object storage, download with query-param auth.
- Status dashboard: matrix with filters + CSV export.
- Audit log (admin/coordinator/hr only).
- Reopen forms from Admin Center.

### AI Features (Claude Sonnet 4.5)
- `/api/ai/write` — rewrite modes (improve/rewrite/short/detailed).
- `/api/ai/analyze` — 9 types: integrated_summary, bias_check, capability_gap, panel_draft, hr_draft, development_plan, quick_brief, stakeholder_suggest, document_summary.
- Structured JSON output, cached per case (latest endpoint).
- AI panels visually distinct (amber tint + "AI Draft" badge).

### Security
- JWT role enforcement; employee/manager/panel/hr form guards (admin override).
- Readonly-after-submit everywhere; Admin can reopen.
- Audit log on all launch/reopen/submit/upload actions.
- All file access via backend; Emergent object storage (no direct URLs).

## Test Status
- **Backend**: 39/39 tests PASS (iteration_1.json) — auth, cases, forms, documents, AI analyses, all seeded accounts.
- **Frontend**: smoke-tested via screenshots. Landing, login, panel dashboard, case detail verified.

## Backlog
### P1
- **AI Bias & Consistency Checker** across all reviews (employee vs manager vs stakeholder vs panel) — deeper LLM analysis feeding the panel/HR step.
- Per-PUT ownership unit tests (role guards were added after backend test run — retest recommended).
- Document OCR / parsed_text pipeline for AI document_summary (already live for PDFs; extend to images via OCR).
- 360 / psychometric PDF parse → feed into integrated_summary.
- Stakeholder email-notification service (currently only on case launch).
- **Master data hardening**: validate `company_id` / `function_id` / `bu_id` / `level_id` on `POST /api/employees` (return 400 on unknown); add unique index on `employees.emp_id`; tighten level backfill (prefer band match over ldc_level).

### P2
- **AI Development Plan Generator** for weak capabilities (per-capability structured suggestions).
- Master data CRUD UI (admin-only) — currently seeded-only; allow add/rename for new Godrej BUs.
- Rich charts on status dashboard (bottleneck per stage).
- Virus-scan abstraction for uploads.

### P3
- SSO-ready auth (OAuth providers).
- Bulk nominee import (CSV).
- Document preview inline (PDF renderer).
- Split `seed.py` into per-domain modules; move GCF + master data to JSON files.

## Next Actions
1. Optional re-run of backend testing subagent to validate new role guards on form PUTs.
2. Build in-app notification center.
3. Hook document text extraction → `document_summary` AI automatically on upload.
