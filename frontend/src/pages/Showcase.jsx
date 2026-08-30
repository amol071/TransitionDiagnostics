import React from "react";

/**
 * /showcase — stakeholder-facing feature deck.
 * Public route. Real screenshots captured from the live app + diagrams.
 * Print CSS makes it PDF-exportable via the browser Print dialog.
 */
export default function Showcase() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .sc-main { max-width: 100% !important; padding: 0 !important; }
                    .sc-card { page-break-inside: avoid; break-inside: avoid; box-shadow: none !important; }
                    .sc-shot { max-height: 720px !important; }
                    body { background: white !important; }
                }
                html { scroll-behavior: smooth; }
            `}</style>

            <TopBar />
            <div className="max-w-[1400px] mx-auto flex gap-6 px-6 py-6 sc-main">
                <SideIndex />
                <main className="flex-1 min-w-0 space-y-8">
                    <Intro />
                    <ArchitectureDiagram />
                    <LifecycleDiagram />
                    <RoleMatrix />
                    <AICapabilityMap />
                    <DataModelDiagram />
                    <GCFHierarchy />

                    <Divider label="Screenshots · every feature, captured from the live app" />

                    <Group id="grp-entry" title="Entry & landing">
                        <Shot id="s-login" name="1. Login" file="01-login.jpg"
                              desc="Single-column login with JWT auth. Right-column lists seeded demo accounts for every role so reviewers can log in as any persona and instantly see role-adaptive UI." />
                        <Shot id="s-landing" name="2. Landing · module tiles" file="02-landing.jpg"
                              desc="Post-login the user lands on a modules gallery. LDC is live (Leadership Development Center); MDC and LFP are stubbed as 'Coming soon'. Admins additionally see an 'Admin Center' tile." />
                    </Group>

                    <Group id="grp-admin" title="Admin experience">
                        <Shot id="s-dash" name="3. Dashboard · role-adaptive" file="03-dashboard-admin.jpg"
                              desc="Four KPI cards, 'My cases' table and an 'AI Case Brief' callout with priority signals across the queue. Content dynamically adapts per role — an Employee sees only their own case, a Manager sees assigned nominees, HR/Admin see all." />
                        <Shot id="s-nom" name="4. Nominees & cases" file="04-nominees.jpg"
                              desc="Full nominee register with search. Admins can launch new cases, launch panels, or open any dossier. Type column distinguishes Standard vs Renomination cycles." />
                        <Shot id="s-addnom" name="4a. Add nominee dialog" file="05-add-nominee-dialog.jpg"
                              desc="Modal with typeahead comboboxes for employee, manager, and HR/HRBP; multi-select for panel members; a renomination toggle that unlocks the prior-cycle dossier on the case page." />
                        <Shot id="s-addemp" name="4b. Add employee dialog" file="06-add-employee-dialog.jpg"
                              desc="New employees are created with Company / BU / Function / Level chosen from Godrej master data via Comboboxes. BU auto-filters by selected Company. String labels are denormalized server-side so downstream forms stay portable." />
                        <Shot id="s-status" name="5. Status dashboard" file="07-status-dashboard.jpg"
                              desc="Portfolio-level matrix — one row per case, one column per form-stage. Filter by fiscal year, BU, function, readiness. CSV export supported." />
                        <Shot id="s-admin" name="6. Admin Center" file="08-admin-center.jpg"
                              desc="Governance surface — users & roles list on the left, live Godrej Capability Framework (122 competencies across L1–L4) on the right. Admins can seed users, change roles, reopen closed forms, and inspect audit history." />
                        <Shot id="s-master" name="6a. Master data · Godrej reference tables" file="09-admin-master-data.jpg"
                              desc="Four master tables — Companies (8), Functions (20), Business units (25), Levels (9) — seeded from `master_data.py` on startup. Idempotent seed and legacy-employee backfill run every boot." />
                    </Group>

                    <Group id="grp-case" title="Case dossier">
                        <Shot id="s-uploads" name="7. Uploads centre" file="10-uploads-center.jpg"
                              desc="One row per document type (Org chart, Talent scorecard, Psychometric PDF, Annual review, 360 report, …). PDFs are parsed on upload and automatically summarised in the background by the AI service." />
                        <Shot id="s-case" name="8. Case detail (dossier)" file="11-case-detail.jpg"
                              desc="Central hub for a case. Workflow shortcuts, document list, and an AI insights column running four analyses (Quick brief, Integrated summary, Bias check, Capability gap) on demand." />
                    </Group>

                    <Group id="grp-emp" title="Employee self-reflection">
                        <Shot id="s-empform" name="9. Employee form · header" file="12-employee-form-top.jpg"
                              desc="AI-assisted structured self-reflection. Contributions section (2–5 rows), autosave indicator, and 7 core leadership capabilities focus." />
                        <Shot id="s-empcore" name="9a. 7 core GCFs" file="13-employee-form-core-gcfs.jpg"
                              desc="Only 7 core GCFs are rendered (Leading Self: Hunger to Learn / Emotional Awareness · Leading Others: Leading Team / Developing Others / Influencing / Fostering Collaboration · Leading Business: Acting Strategically). Each competency captures current rating, rationale, and next-level demonstration flag." />
                        <Shot id="s-empopt" name="9b. Optional · reflections on other 5 GCFs" file="14-employee-form-optional-gcfs.jpg"
                              desc="Employees can opt in to reflect on 2–3 of the remaining 5 GCFs (Initiative, Customer Centricity, Functional Capability, Delivering Results, Institution Building). Validation enforced both client-side and server-side (400 on 1 or 4+)." />
                    </Group>

                    <Group id="grp-mgr" title="Manager review">
                        <Shot id="s-mgr" name="10. Manager review" file="15-manager-form.jpg"
                              desc="Full L-next capability grid (all 31 competencies), AI assistant bar with Stakeholder suggestions, Integrated summary, and Bias & consistency check. Every free-text field has an inline AI-improve button." />
                        <Shot id="s-dir" name="10a. Stakeholder directory typeahead" file="16-manager-directory-picker.jpg"
                              desc="Managers pick stakeholders straight from the employee directory — the Combobox auto-fills name + email into an empty stakeholder row. Manual freeform entry remains supported." />
                    </Group>

                    <Group id="grp-panel" title="Panel review — the crown jewel">
                        <Shot id="s-panel" name="11. Panel review" file="18-panel-review-top.jpg"
                              desc="Panel members see a full multi-source synthesis. Four AI assistants (Panel draft · Integrated summary · Bias & consistency · Capability gap) plus a one-click 'Apply panel draft' button." />
                        <Shot id="s-matrix" name="11a. Consolidated capability matrix" file="19-panel-consolidated-matrix.jpg"
                              desc="Per-capability grid: Self / Manager / Stakeholder(s) / Panel-you ratings side-by-side, grouped by Pillar → GCF." />
                        <Shot id="s-bias1" name="12. AI Bias & Consistency Check · header" file="20-bias-check-top.jpg" featured
                              desc="Overall risk chip (Low/Medium/High), 0–100 consistency score with a colour-coded bar and 4-facet breakdown (Rating alignment · Evidence alignment · Source coverage · Language neutrality). Gate: needs ≥2 submitted sources; button disabled otherwise." />
                        <Shot id="s-bias2" name="12a. Rating mismatches + rater patterns" file="21-bias-check-mismatches-rater-patterns.jpg" featured
                              desc="Per-capability rating table with Δ severity chip (Aligned / Minor / Major). Rater-pattern grid flags Halo / Leniency / Severity / Central-tendency per source with evidence citations." />
                        <Shot id="s-bias3" name="12b. Evidence alignment + language signals" file="22-bias-check-language-signals.jpg" featured
                              desc="Flags unsupported-high / unsupported-low / missing-rationale per capability × source. Language signals surface bias-adjacent wording (superlatives without evidence, personality-over-behavior, gendered wording) with verbatim quotes." />
                        <Shot id="s-bias4" name="12c. Missing coverage + panel probes + recommendations" file="23-bias-check-panel-probes.jpg" featured
                              desc="Missing-coverage list with impact chips; discussion flags include a suggested probe question for the panel; concrete recommendations close the loop." />
                    </Group>

                    <Group id="grp-hr" title="HR final summary">
                        <Shot id="s-hr1" name="13. HR summary · header" file="24-hr-summary-top.jpg"
                              desc="Four AI drafts (HR draft, Development plan, Integrated summary, Bias & consistency) with one-click 'Apply HR draft'. Panel + manager context surfaced above the form." />
                        <Shot id="s-hr2" name="13a. Strengths + improvements + summary" file="25-hr-summary-strengths.jpg"
                              desc="Structured lists for strengths and development areas (per-row AI improve), overall employee-facing summary, development plan, additional feedback, and a final readiness dropdown." />
                    </Group>

                    <Group id="grp-docs" title="Documentation artefacts">
                        <Shot id="s-wf" name="14. Wireframes · /wireframes" file="26-wireframes.jpg"
                              desc="A separate stakeholder-facing artefact — grayscale low-fidelity wireframes for every screen in the app, with a case-lifecycle diagram and a legend, printable to PDF." />
                    </Group>

                    <footer className="mt-10 pt-4 border-t border-slate-300 text-[11px] text-slate-500">
                        Feature showcase · screenshots captured live from the app on Aug 30, 2026 · 25 screens across 6 roles · print the page for a shareable PDF.
                    </footer>
                </main>
            </div>
        </div>
    );
}

// -------- TOP BAR --------
const TopBar = () => (
    <div className="no-print sticky top-0 z-40 bg-white border-b border-slate-300 px-6 py-3 flex items-center justify-between">
        <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">Stakeholder deck · publicly viewable</div>
            <h1 className="text-xl font-semibold" data-testid="showcase-title">Transition Diagnostics · feature showcase</h1>
        </div>
        <div className="flex items-center gap-2">
            <a href="/wireframes" className="text-[11px] font-semibold px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50">Wireframes →</a>
            <button
                onClick={() => window.print()}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-800 bg-slate-900 text-white rounded hover:bg-slate-800"
                data-testid="showcase-print-btn"
            >
                Print / export PDF
            </button>
        </div>
    </div>
);

// -------- SIDE INDEX --------
const INDEX_ITEMS = [
    ["arch", "Architecture"],
    ["flow", "Case lifecycle"],
    ["roles", "Role × feature matrix"],
    ["ai", "AI capability map"],
    ["data", "Data model"],
    ["gcf", "Capability framework"],
    ["grp-entry", "Entry & landing"],
    ["grp-admin", "Admin experience"],
    ["grp-case", "Case dossier"],
    ["grp-emp", "Employee form"],
    ["grp-mgr", "Manager review"],
    ["grp-panel", "Panel + Bias check"],
    ["grp-hr", "HR summary"],
    ["grp-docs", "Documentation"],
];
const SideIndex = () => (
    <nav className="no-print w-52 flex-shrink-0 sticky top-20 self-start h-[calc(100vh-6rem)] overflow-auto text-[11px]" data-testid="showcase-index">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Contents</div>
        <ul className="space-y-1">
            {INDEX_ITEMS.map(([id, label]) => (
                <li key={id}>
                    <a href={`#${id}`} className="block px-2 py-1 border-l-2 border-slate-200 hover:border-slate-700 hover:bg-slate-100 text-slate-600">{label}</a>
                </li>
            ))}
        </ul>
    </nav>
);

// -------- INTRO --------
const Intro = () => (
    <section className="sc-card border border-slate-200 bg-white p-5">
        <div className="text-[10px] uppercase tracking-widest text-slate-500">About this document</div>
        <h2 className="text-2xl font-semibold mt-1">What Transition Diagnostics does</h2>
        <p className="text-sm text-slate-700 mt-3 max-w-3xl leading-relaxed">
            An internal talent-readiness platform that replaces Godrej's legacy ASP.NET LDC process with a modern, role-based, AI-assisted workflow. It ingests inputs from Self / Manager / Stakeholder / Panel / HR against the Godrej Capability Framework, and produces evidence-based readiness decisions — with AI drafts, bias & consistency checks, integrated summaries, and full audit trail.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 text-[12px]">
            <Stat label="Roles" value="6" sub="Admin · Coord · Employee · Manager · Panel · HR/HRBP · Stakeholder" />
            <Stat label="Screens" value="15+" sub="fully wired, role-adaptive" />
            <Stat label="AI analyses" value="9" sub="draft / summary / bias / gap / plan" />
            <Stat label="Capability framework" value="L1–L4" sub="3 Pillars · 12 GCFs · 122 competencies" />
        </div>
    </section>
);
const Stat = ({ label, value, sub }) => (
    <div className="border border-slate-200 rounded p-3 bg-slate-50">
        <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
        <div className="text-2xl font-semibold text-slate-900 mt-0.5">{value}</div>
        <div className="text-[11px] text-slate-500 mt-1">{sub}</div>
    </div>
);

// -------- ARCHITECTURE --------
const ArchitectureDiagram = () => (
    <section id="arch" className="sc-card border border-slate-200 bg-white p-5">
        <SectionHeader label="System architecture" title="How the pieces fit" />
        <div className="mt-4 grid grid-cols-3 gap-4 text-[11px]">
            <Layer title="Frontend · Browser" tone="slate" items={["React 19 SPA", "Tailwind + shadcn/ui", "Axios (JWT bearer)", "Playwright tests"]} />
            <Layer title="Backend · FastAPI" tone="dark" items={["Motor async MongoDB", "JWT auth (7d)", "pypdf text extraction", "Modular routers"]} />
            <Layer title="Data & AI" tone="amber" items={["MongoDB", "Emergent object storage", "Claude Sonnet 4.5 via Emergent LLM key", "9 AI prompt families"]} />
        </div>
        <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
            <Flow>Browser</Flow> <Arrow /> <Flow>Nginx / ingress</Flow> <Arrow /> <Flow>/api/* → FastAPI</Flow> <Arrow /> <Flow>MongoDB</Flow>
            <Arrow /> <Flow tone="amber">Claude 4.5</Flow>
        </div>
        <p className="text-[12px] text-slate-500 mt-3">
            Frontend runs on port 3000, backend on port 8001, all `/api/*` traffic reverse-proxied. Environment variables drive URLs / DB connection; no hard-coded secrets. AI calls route through `emergentintegrations` with the Emergent Universal LLM Key — one key across Claude / GPT / Gemini.
        </p>
    </section>
);
const Layer = ({ title, tone, items }) => {
    const bg = tone === "dark" ? "bg-slate-900 text-white" : tone === "amber" ? "bg-amber-50 border-amber-300" : "bg-slate-100";
    return (
        <div className={`border rounded p-3 ${bg}`}>
            <div className="text-[10px] uppercase tracking-widest opacity-70">{title}</div>
            <ul className="mt-2 space-y-1">{items.map(i => <li key={i}>• {i}</li>)}</ul>
        </div>
    );
};
const Flow = ({ children, tone }) => (
    <span className={`inline-block px-2 py-1 border rounded font-semibold ${tone === "amber" ? "bg-amber-50 border-amber-300 text-amber-800" : "bg-white border-slate-300 text-slate-700"}`}>{children}</span>
);
const Arrow = () => <span className="text-slate-400">→</span>;

// -------- LIFECYCLE --------
const LifecycleDiagram = () => (
    <section id="flow" className="sc-card border border-slate-200 bg-white p-5">
        <SectionHeader label="Case lifecycle" title="From nomination to closure" />
        <div className="mt-4 bg-slate-50 border border-slate-200 rounded p-5">
            <div className="grid grid-cols-7 gap-2 text-center text-[11px]">
                {[
                    { role: "Admin", stage: "Nominate", ai: "" },
                    { role: "Employee", stage: "Self-reflection", ai: "AI improve · Bias check" },
                    { role: "Manager", stage: "Review", ai: "Stakeholder suggest · Integrated · Bias" },
                    { role: "Stakeholder", stage: "Feedback", ai: "Bias" },
                    { role: "Panel", stage: "Synthesis", ai: "Panel draft · Bias · Gap" },
                    { role: "HR / HRBP", stage: "Finalize", ai: "HR draft · Dev plan · Bias" },
                    { role: "System", stage: "Closed", ai: "Renomination pool" },
                ].map((s, i, arr) => (
                    <div key={i} className="flex flex-col items-center">
                        <div className={`w-full min-h-[68px] px-2 py-2 border rounded ${i === arr.length - 1 ? "bg-emerald-50 border-emerald-300" : "bg-white border-slate-300"}`}>
                            <div className="text-[9px] uppercase tracking-widest text-slate-500">{s.role}</div>
                            <div className="font-semibold text-slate-800 mt-1 text-xs">{s.stage}</div>
                            {s.ai && <div className="text-[9px] text-amber-700 mt-1">{s.ai}</div>}
                        </div>
                        {i < arr.length - 1 && <div className="text-slate-400 my-1">▼</div>}
                    </div>
                ))}
            </div>
        </div>
    </section>
);

// -------- ROLE MATRIX --------
const RoleMatrix = () => {
    const rows = [
        ["Dashboard", "•", "•", "•", "•", "•", "•"],
        ["Nominees + Add employee", "•", "•", "—", "—", "—", "—"],
        ["Case dossier", "•", "•", "own", "assigned", "assigned", "•"],
        ["Employee self-reflection", "reopen", "reopen", "•", "read", "read", "read"],
        ["Manager review", "reopen", "reopen", "read", "•", "read", "read"],
        ["Stakeholder feedback", "reopen", "reopen", "—", "read", "own", "read"],
        ["Panel review", "reopen", "reopen", "—", "read", "read (aggr)", "•"],
        ["HR final summary", "reopen", "•", "read (post)", "read", "read", "read"],
        ["Uploads centre", "•", "•", "read", "•", "—", "—"],
        ["AI Bias & Consistency", "•", "•", "•", "•", "•", "•"],
        ["Status dashboard", "•", "•", "—", "—", "—", "—"],
        ["Admin Center + Master data", "•", "—", "—", "—", "—", "—"],
    ];
    return (
        <section id="roles" className="sc-card border border-slate-200 bg-white p-5">
            <SectionHeader label="Role × feature" title="Who can do what" />
            <div className="overflow-auto mt-3">
                <table className="w-full text-[11px] border-collapse">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="text-left border border-slate-200 px-2 py-1.5 font-semibold">Feature</th>
                            {["Admin", "Coordinator", "Employee", "Manager", "Panel", "HR / HRBP"].map(r => (
                                <th key={r} className="border border-slate-200 px-2 py-1.5 font-semibold text-slate-700">{r}</th>
                            ))}
                            <th className="border border-slate-200 px-2 py-1.5 font-semibold text-slate-700">Stakeholder</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r[0]} className="hover:bg-slate-50">
                                <td className="border border-slate-200 px-2 py-1.5 font-medium text-slate-800">{r[0]}</td>
                                {r.slice(1).map((c, i) => (
                                    <td key={i} className="border border-slate-200 px-2 py-1.5 text-center">
                                        {c === "•" ? <span className="text-emerald-700 font-bold">•</span>
                                            : c === "—" ? <span className="text-slate-300">—</span>
                                                : <span className="text-slate-500 text-[10px]">{c}</span>}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="text-[10px] text-slate-500 mt-2">
                <span className="text-emerald-700 font-bold">•</span> full access · <span className="text-slate-400">— </span> not visible · <span className="text-slate-500">read</span> read-only in-context · <span className="text-slate-500">reopen</span> admin can unlock submitted forms.
            </div>
        </section>
    );
};

// -------- AI CAPABILITY MAP --------
const AICapabilityMap = () => {
    const capabilities = [
        { name: "Quick brief", where: "Case detail", note: "5-line synopsis, top strengths/concerns, missing data" },
        { name: "Integrated summary", where: "Case / Manager / Panel / HR", note: "Multi-source narrative with readiness indicators" },
        { name: "Bias & Consistency check", where: "All forms + Case detail", note: "Score 0–100 · rating mismatches · rater patterns · language signals · probes", featured: true },
        { name: "Capability gap", where: "Panel / Case detail", note: "Per-capability severity + rating mismatches across sources" },
        { name: "Panel draft", where: "Panel review", note: "Rating + rationale per capability + overall readiness" },
        { name: "HR draft", where: "HR summary", note: "Employee-facing overall summary, strengths, improvements, plan" },
        { name: "Development plan", where: "HR summary", note: "Actions with area / how / timeframe, learning resources" },
        { name: "Stakeholder suggestions", where: "Manager review", note: "Suggests role types to include as stakeholders" },
        { name: "Document summary", where: "Background · every upload", note: "Auto-runs on PDF/txt upload; themes, strengths, risks" },
        { name: "AI improve (writing assistant)", where: "Every free-text field", note: "Improve / Rewrite / Short / Detailed modes per field" },
    ];
    return (
        <section id="ai" className="sc-card border border-slate-200 bg-white p-5">
            <SectionHeader label="AI capabilities" title="Where AI shows up" />
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                {capabilities.map(c => (
                    <div key={c.name} className={`border rounded p-3 ${c.featured ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white"}`}>
                        <div className="flex items-baseline justify-between">
                            <div className="text-sm font-semibold text-slate-800">{c.name}</div>
                            <div className="text-[10px] uppercase tracking-widest text-slate-500">{c.where}</div>
                        </div>
                        <div className="text-[12px] text-slate-600 mt-1">{c.note}</div>
                    </div>
                ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-3">
                All analyses run through Claude Sonnet 4.5 via the Emergent Universal LLM Key. Prompts are versioned; each output is persisted with prompt_version + model_name for reproducibility.
            </p>
        </section>
    );
};

// -------- DATA MODEL --------
const DataModelDiagram = () => (
    <section id="data" className="sc-card border border-slate-200 bg-white p-5">
        <SectionHeader label="Data model" title="Core collections" />
        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 text-[11px]">
            <Entity name="User" attrs={["email", "roles[]", "hashed_password"]} />
            <Entity name="Employee" attrs={["emp_id, name, email", "company / bu / function / level", "company_id / bu_id / function_id / level_id"]} />
            <Entity name="Case" attrs={["employee_id, fiscal_year", "status: draft → …→ closed", "is_renomination + prior_case_id", "assigned_manager_id · panel_ids"]} highlight />
            <Entity name="Capability" attrs={["level (L1–L4)", "pillar_order · gcf_order · competency_order", "code · name · description"]} />
            <Entity name="EmployeeForm" attrs={["contributions[]", "capability_responses[]", "other_gcf_comments[]", "overall_reflection"]} />
            <Entity name="ManagerForm" attrs={["capability_responses[]", "stakeholders[]", "readiness · overall_rationale"]} />
            <Entity name="StakeholderFeedback" attrs={["stakeholder_id/name/email", "capability_responses[]", "comments"]} />
            <Entity name="PanelReview" attrs={["panel_member_id", "capability_ratings[]", "overall_rating · rationale"]} />
            <Entity name="HRReview" attrs={["strengths[] · improvements[]", "overall_summary · development_plan", "readiness"]} />
            <Entity name="Document" attrs={["case_id, doc_type", "storage_path, parsed_text", "version, is_latest, is_deleted"]} />
            <Entity name="AIAnalysis" attrs={["case_id, analysis_type", "structured (json)", "prompt_version, model_name"]} />
            <Entity name="Notification" attrs={["user_id, case_id", "message, is_read", "created_at"]} />
            <Entity name="MasterCompany / Function / BU / Level" attrs={["code · name", "seeded from master_data.py", "referenced by employees.*_id"]} />
            <Entity name="AuditLog" attrs={["actor, action, resource", "case_id, details", "timestamp"]} />
        </div>
    </section>
);
const Entity = ({ name, attrs, highlight }) => (
    <div className={`border rounded p-2 ${highlight ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white"}`}>
        <div className="text-[11px] font-semibold text-slate-800">{name}</div>
        <ul className="mt-1 space-y-0.5 text-[10px] text-slate-500">
            {attrs.map(a => <li key={a}>· {a}</li>)}
        </ul>
    </div>
);

// -------- GCF hierarchy --------
const GCFHierarchy = () => {
    const pillars = [
        { name: "Leading Self", gcfs: ["Initiative", "Hunger to Learn and Improve *", "Emotional and Social Awareness *"] },
        { name: "Leading Others", gcfs: ["Leading Team *", "Developing Others *", "Influencing *", "Fostering Collaboration *"] },
        { name: "Leading Business", gcfs: ["Customer Centricity", "Acting Strategically *", "Functional Capability", "Delivering Results", "Institution Building"] },
    ];
    return (
        <section id="gcf" className="sc-card border border-slate-200 bg-white p-5">
            <SectionHeader label="Godrej Capability Framework" title="Hierarchy at a glance" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                {pillars.map((p) => (
                    <div key={p.name} className="border border-slate-200 rounded p-3 bg-slate-50">
                        <div className="text-[10px] uppercase tracking-widest text-slate-500">Pillar</div>
                        <div className="font-semibold text-slate-800">{p.name}</div>
                        <ul className="mt-2 space-y-0.5 text-[12px]">
                            {p.gcfs.map(g => (
                                <li key={g} className={g.endsWith("*") ? "text-slate-800 font-medium" : "text-slate-500"}>
                                    {g.replace(" *", "")}
                                    {g.endsWith("*") && <span className="ml-1 text-[9px] uppercase tracking-widest px-1 py-0.5 border border-amber-300 bg-amber-50 text-amber-700 rounded">Core</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <div className="text-[11px] text-slate-500 mt-3">
                Applies at every level L1–L4 with 122 seeded competencies. Employee self-reflection focuses on 7 core GCFs (marked <span className="text-amber-700 font-semibold">Core</span>); the remaining 5 are optionally commented on (min 2 / max 3 selections).
            </div>
        </section>
    );
};

// -------- Helpers --------
const SectionHeader = ({ label, title }) => (
    <div>
        <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
        <h2 className="text-lg font-semibold mt-0.5">{title}</h2>
    </div>
);

const Divider = ({ label }) => (
    <div className="flex items-center gap-3 pt-3">
        <div className="flex-1 border-t border-slate-300"></div>
        <div className="text-[11px] uppercase tracking-widest text-slate-500">{label}</div>
        <div className="flex-1 border-t border-slate-300"></div>
    </div>
);

const Group = ({ id, title, children }) => (
    <div id={id} className="space-y-4">
        <div className="flex items-baseline gap-2 pt-2">
            <div className="text-[10px] uppercase tracking-widest text-slate-500">Group</div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        </div>
        {children}
    </div>
);

const Shot = ({ id, name, file, desc, featured = false }) => (
    <section id={id} className={`sc-card border rounded bg-white overflow-hidden ${featured ? "border-amber-400" : "border-slate-200"}`}>
        <div className="p-4 flex items-baseline justify-between flex-wrap gap-2 border-b border-slate-200">
            <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500">Screen</div>
                <h3 className="text-base font-semibold text-slate-900">{name}</h3>
            </div>
            {featured && <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-amber-300 bg-amber-50 text-amber-800 rounded">Featured</span>}
        </div>
        <p className="text-[12px] text-slate-600 px-4 py-3 leading-relaxed">{desc}</p>
        <div className="bg-slate-100 p-3 border-t border-slate-200">
            <img
                src={`/showcase/${file}`}
                alt={name}
                loading="lazy"
                className="sc-shot w-full h-auto border border-slate-300 rounded shadow-sm"
            />
        </div>
    </section>
);
