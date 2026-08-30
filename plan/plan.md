# Wireframes for Transition Diagnostics (LDC)

## Purpose

Produce a wireframe deliverable that shows every screen and role-based flow in the current app in one place, so stakeholders can review structure, layout logic, and navigation without being distracted by visual styling or real data.

## What a wireframe is here

A wireframe = **low-fidelity structural sketch**. It shows *what* is on each screen and *where* — headings, tables, forms, buttons, panels — using grayscale boxes and placeholder labels only. No brand colors, no icons, no real content, no interactive behaviour.

This is not a re-design. It is a documentation artifact that mirrors the app as it exists today.

---

## Proposed deliverable

A new in-app route **`/wireframes`** (admin-only, no auth token needed for viewing — we'll make it publicly reachable so it can be shared with reviewers outside the login flow).

The page is a single scrollable document with a left-hand sticky index and a sequence of **wireframe cards**, one per screen. Each card contains:

- Screen name and route
- Which roles see it
- A grayscale box-and-label sketch of the screen at desktop width (~1200px canvas)
- 1–2 sentence description of the screen's purpose
- Cross-links to related screens

At the top of the page: a small legend explaining wireframe conventions, and a **role-flow diagram** showing how a case moves from Nominee → Employee → Manager → Stakeholder → Panel → HR → Closed.

Optionally exportable as a single-page PDF via the browser's print dialog (styled with a print CSS block so it renders cleanly on paper).

---

## Screens covered

Every screen currently in the app, grouped by role:

**Public / shared**
- Landing page (Transition Diagnostics FY 2026-2027)
- Login
- Dashboard (role-adaptive)
- Case detail (dossier view)
- Uploads centre
- Notifications drawer

**Employee**
- Self-reflection form (with the 7 core GCFs + optional 5 GCFs section)

**Manager**
- Nominees list + Add nominee dialog + Add employee dialog
- Manager review form (with stakeholder directory picker)

**Stakeholder**
- Stakeholder feedback form

**Panel**
- Panel review form
- Prior-cycle dossier (renomination side-by-side)

**HR**
- HR summary / finalize form
- Status dashboard

**Admin**
- Admin Center (users, capabilities, master data tables, reopen forms)

That's roughly 14–16 screens.

---

## Decisions the user should weigh in on

1. **Fidelity level**
   - **Low-fi (proposed):** grayscale boxes, no icons, no colors, no real strings. Easiest to read structurally, fastest to build, best for early stakeholder review.
   - Mid-fi alternative: use the app's real Tailwind styling but with placeholder data. Prettier, but blurs the line with a real screenshot.
   - Recommendation: **low-fi**. If reviewers want to see the real thing, they can log into the app.

2. **Fixed vs responsive canvas**
   - **Fixed desktop-only (proposed):** each wireframe is drawn at ~1200px width. Simpler and matches how the app is used (internal desktop tool).
   - Responsive alternative: show mobile + desktop versions of each screen. Doubles the effort and mobile isn't a primary target for this app.
   - Recommendation: **desktop-only**.

3. **Backward-looking or forward-looking**
   - **Backward-looking (proposed):** document the app as it stands today. Reviewers see what exists.
   - Forward-looking alternative: include proposed screens for backlog items (AI Bias Checker, AI Development Plan Generator, Admin CRUD for master data). Useful for pitching future work but conflates "what is" with "what could be".
   - Recommendation: **backward-looking only**. Backlog screens can be a follow-up.

4. **Access control**
   - **Public route (proposed):** `/wireframes` needs no login. Easiest to share a link with reviewers outside the org.
   - Admin-only alternative: keeps the artifact private but adds friction for external reviewers.
   - Recommendation: **public**, with a note at the top "documentation artifact, not real data".

5. **Export format**
   - **In-app HTML page + print-to-PDF (proposed):** one URL, always in sync with the codebase, PDF on demand.
   - Static export alternative: generate a `wireframes.pdf` file committed to `/app/docs/`. Snapshot-in-time, easier to email, but goes stale as the app evolves.
   - Recommendation: **in-app page**, with print CSS. If a snapshot PDF is also wanted, that's a small add-on.

---

## Assumptions

- Wireframes are for the **existing app**, not a redesign proposal.
- Reviewers are internal Godrej stakeholders / IT / product folks reviewing structure before deployment. They don't need clickable prototypes — a scrollable document is enough.
- All 14–16 screens can fit in one long scrollable page with a sticky side index. If it turns out to be visually too heavy, we can split into role-tabs later.
- No changes to any existing routes, screens, or business logic. This is purely additive.
- Role-flow diagram at the top is drawn with the same box-and-arrow grayscale convention (no external diagramming tool, no images — pure HTML/CSS).

---

## What's not in scope

- No redesign of any existing screen.
- No new features, endpoints, or data models.
- No interactive prototype (no clickable wireframes that navigate between screens).
- No Figma / external design-tool file — the deliverable lives in the codebase.
- No mobile wireframes.
- No wireframes for backlog / not-yet-built screens.
- No animations or transitions documented.

---

## Open question for the user

Only one:

- **Do you want the wireframes route to be publicly reachable (no login), or gated to admin?** Default assumption is public so it can be shared with external reviewers, but if this needs to stay behind auth for confidentiality, that's a one-line change.

Everything else in this plan is decided above; push back on any of the recommendations if you disagree.
