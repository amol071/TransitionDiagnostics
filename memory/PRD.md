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

## What's Implemented (2026-04-21)
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
- Per-PUT ownership unit tests (role guards were added after backend test run — retest recommended).
- Document OCR / parsed_text pipeline for AI document_summary.
- 360 / psychometric PDF parse → feed into integrated_summary.
- Stakeholder email-notification service (currently only on case launch).

### P2
- Notifications (in-app + email service abstraction).
- Rich charts on status dashboard (bottleneck per stage).
- Renomination historical-data side-by-side drawer (currently RENOM flag is exposed throughout but prior-cycle dossier view not yet built).
- Virus-scan abstraction for uploads.

### P3
- SSO-ready auth (OAuth providers).
- Bulk nominee import (CSV).
- Document preview inline (PDF renderer).

## Next Actions
1. Optional re-run of backend testing subagent to validate new role guards on form PUTs.
2. Build in-app notification center.
3. Hook document text extraction → `document_summary` AI automatically on upload.
