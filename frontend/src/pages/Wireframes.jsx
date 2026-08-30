import React from "react";

/**
 * Wireframes documentation page for the Transition Diagnostics / LDC app.
 * Low-fidelity, grayscale, desktop-only, backward-looking, publicly reachable.
 * Deliberately no icons, no brand colors, no real content — purely structural.
 *
 * To print: browser Print → the print CSS below hides chrome and prevents
 * card breaks across pages.
 */

// -------- WIREFRAME PRIMITIVES (grayscale only) --------
const B = ({ children, className = "", style = {} }) => (
    <div className={`border border-dashed border-neutral-400 bg-neutral-50 text-[11px] text-neutral-500 ${className}`} style={style}>
        {children}
    </div>
);

const Solid = ({ children, className = "" }) => (
    <div className={`border border-neutral-400 bg-white text-[11px] text-neutral-600 ${className}`}>{children}</div>
);

const Btn = ({ children, primary = false }) => (
    <span className={`inline-flex items-center px-2 py-1 text-[10px] uppercase tracking-widest border ${primary ? "bg-neutral-800 text-white border-neutral-800" : "bg-white border-neutral-400 text-neutral-600"}`}>
        {children || "Button"}
    </span>
);

const Chip = ({ children }) => (
    <span className="inline-block px-1.5 py-0.5 text-[9px] uppercase tracking-widest bg-neutral-200 text-neutral-600 border border-neutral-300">
        {children}
    </span>
);

const Label = ({ children, className = "" }) => (
    <div className={`text-[9px] uppercase tracking-widest text-neutral-500 ${className}`}>{children}</div>
);

const Head = ({ children }) => <div className="text-sm font-semibold text-neutral-700 mb-1">{children}</div>;

const Sub = ({ children }) => <div className="text-[10px] text-neutral-500">{children}</div>;

const Field = ({ label = "Label", h = 24 }) => (
    <div>
        <Label>{label}</Label>
        <div className="mt-0.5 border border-neutral-400 bg-white" style={{ height: h }}></div>
    </div>
);

const TA = ({ label = "Label", rows = 3 }) => <Field label={label} h={rows * 14 + 12} />;

const Row = ({ children, className = "" }) => <div className={`flex gap-2 ${className}`}>{children}</div>;

const Divider = () => <div className="border-t border-neutral-300 my-2"></div>;

// -------- APP CHROME (header + sidebar) — shared across most screens --------
const AppChrome = ({ children, activeNav = "Dashboard" }) => (
    <div className="border border-neutral-400 bg-white">
        <div className="h-10 border-b border-neutral-300 bg-neutral-100 flex items-center justify-between px-3">
            <div className="flex items-center gap-3">
                <B className="w-24 h-5 grid place-items-center">Logo · TD</B>
                <span className="text-[10px] text-neutral-500">/ breadcrumb / breadcrumb</span>
            </div>
            <div className="flex items-center gap-2">
                <B className="w-6 h-6 rounded-full grid place-items-center">🔔</B>
                <span className="text-[10px] text-neutral-500">user@ldc.io</span>
            </div>
        </div>
        <div className="flex" style={{ minHeight: 480 }}>
            <div className="w-40 border-r border-neutral-300 bg-neutral-50 p-2 space-y-1">
                {["Dashboard", "Nominees", "Cases", "Status", "Audit"].map((n) => (
                    <div
                        key={n}
                        className={`px-2 py-1 text-[10px] uppercase tracking-widest ${n === activeNav ? "bg-neutral-800 text-white" : "text-neutral-500 border border-neutral-300 bg-white"}`}
                    >
                        {n}
                    </div>
                ))}
            </div>
            <div className="flex-1 p-4">{children}</div>
        </div>
    </div>
);

// -------- WIREFRAME CARD (one per screen) --------
const WF = ({ id, name, route, roles, description, children }) => (
    <section id={id} className="wf-card border border-neutral-300 bg-white p-5 mb-8 break-inside-avoid">
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
            <div>
                <div className="text-[10px] uppercase tracking-widest text-neutral-400">Screen</div>
                <h2 className="text-lg font-semibold text-neutral-800">{name}</h2>
            </div>
            <div className="text-right">
                <div className="text-[10px] font-mono text-neutral-500">{route}</div>
                <div className="mt-1 flex gap-1 flex-wrap justify-end">
                    {roles.map((r) => <Chip key={r}>{r}</Chip>)}
                </div>
            </div>
        </div>
        <p className="text-[12px] text-neutral-600 leading-relaxed mb-3">{description}</p>
        <div className="p-3 bg-neutral-100 border border-neutral-200" style={{ minHeight: 200 }}>
            {children}
        </div>
    </section>
);

// -------- SIDE INDEX --------
const SCREENS = [
    { id: "flow", label: "Case lifecycle flow" },
    { id: "landing", label: "1. Landing" },
    { id: "login", label: "2. Login" },
    { id: "dashboard", label: "3. Dashboard" },
    { id: "nominees", label: "4. Nominees list" },
    { id: "add-nominee", label: "4a. Add nominee" },
    { id: "add-employee", label: "4b. Add employee" },
    { id: "case-detail", label: "5. Case detail (dossier)" },
    { id: "employee-form", label: "6. Employee self-reflection" },
    { id: "manager-form", label: "7. Manager review" },
    { id: "stakeholder-form", label: "8. Stakeholder feedback" },
    { id: "panel-form", label: "9. Panel review" },
    { id: "prior-cycle", label: "10. Prior-cycle dossier" },
    { id: "hr-form", label: "11. HR summary" },
    { id: "uploads", label: "12. Uploads centre" },
    { id: "status", label: "13. Status dashboard" },
    { id: "notifications", label: "14. Notifications" },
    { id: "admin", label: "15. Admin Center" },
];

// -------- ROLE FLOW DIAGRAM --------
const FlowStep = ({ label, sub }) => (
    <div className="flex flex-col items-center">
        <B className="w-24 h-14 grid place-items-center text-center px-1">
            <div>
                <div className="text-[10px] font-semibold text-neutral-700 uppercase tracking-widest">{label}</div>
                <div className="text-[9px] text-neutral-400 mt-0.5">{sub}</div>
            </div>
        </B>
    </div>
);
const Arrow = () => <div className="text-neutral-400 text-lg">→</div>;

// -------- MAIN PAGE --------
export default function Wireframes() {
    return (
        <div className="min-h-screen bg-neutral-100 text-neutral-800">
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .wf-index { display: none !important; }
                    .wf-main { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
                    .wf-card { page-break-inside: avoid; break-inside: avoid; box-shadow: none; margin-bottom: 24px !important; }
                    body { background: white !important; }
                }
                html { scroll-behavior: smooth; }
            `}</style>

            <TopBar />

            <div className="max-w-[1400px] mx-auto flex gap-6 px-6 py-6">
                <SideIndex />
                <main className="wf-main flex-1 min-w-0">
                    <Legend />
                    <FlowDiagram />
                    <ScreenLanding />
                    <ScreenLogin />
                    <ScreenDashboard />
                    <ScreenNominees />
                    <ScreenAddNominee />
                    <ScreenAddEmployee />
                    <ScreenCaseDetail />
                    <ScreenEmployeeForm />
                    <ScreenManagerForm />
                    <ScreenStakeholderForm />
                    <ScreenPanelForm />
                    <ScreenPriorCycle />
                    <ScreenHRForm />
                    <ScreenUploads />
                    <ScreenStatus />
                    <ScreenNotifications />
                    <ScreenAdmin />
                    <footer className="mt-10 pt-4 border-t border-neutral-300 text-[10px] text-neutral-500">
                        Wireframe document · low-fidelity structural sketches · not real data · reflects the app as of April 2026 · print via browser Print dialog.
                    </footer>
                </main>
            </div>
        </div>
    );
}

// -------- TOP BAR --------
const TopBar = () => (
    <div className="no-print sticky top-0 z-40 bg-white border-b border-neutral-300 px-6 py-3 flex items-center justify-between">
        <div>
            <div className="text-[10px] uppercase tracking-widest text-neutral-500">Documentation artifact</div>
            <h1 className="text-xl font-semibold" data-testid="wireframes-title">Transition Diagnostics · wireframes</h1>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-500 hidden md:inline">Publicly viewable · not real data</span>
            <button
                onClick={() => window.print()}
                className="px-3 py-1.5 text-xs font-semibold border border-neutral-400 hover:bg-neutral-100"
                data-testid="wireframes-print-btn"
            >
                Print / export PDF
            </button>
        </div>
    </div>
);

// -------- SIDE INDEX --------
const SideIndex = () => (
    <nav className="wf-index no-print w-52 flex-shrink-0 sticky top-20 self-start h-[calc(100vh-6rem)] overflow-auto text-[11px]" data-testid="wireframes-index">
        <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Index</div>
        <ul className="space-y-1">
            {SCREENS.map((s) => (
                <li key={s.id}>
                    <a
                        href={`#${s.id}`}
                        className="block px-2 py-1 border-l-2 border-neutral-200 hover:border-neutral-700 hover:bg-neutral-50 text-neutral-600"
                    >
                        {s.label}
                    </a>
                </li>
            ))}
        </ul>
    </nav>
);

// -------- LEGEND --------
const Legend = () => (
    <div className="border border-neutral-300 bg-white p-4 mb-6">
        <Head>How to read these wireframes</Head>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3 text-[11px]">
            <LegendItem>
                <B className="h-8 grid place-items-center">Empty container</B>
                <div className="mt-1 text-neutral-500">Dashed = placeholder for real content</div>
            </LegendItem>
            <LegendItem>
                <Solid className="h-8 grid place-items-center">Structural element</Solid>
                <div className="mt-1 text-neutral-500">Solid = fixed layout element (header, sidebar, etc.)</div>
            </LegendItem>
            <LegendItem>
                <div className="flex gap-1"><Btn>Secondary</Btn><Btn primary>Primary</Btn></div>
                <div className="mt-1 text-neutral-500">Two button weights only</div>
            </LegendItem>
            <LegendItem>
                <div className="flex gap-1"><Chip>role</Chip><Chip>role</Chip></div>
                <div className="mt-1 text-neutral-500">Chips = role tags at the top of each card</div>
            </LegendItem>
        </div>
    </div>
);
const LegendItem = ({ children }) => <div>{children}</div>;

// -------- ROLE / CASE FLOW DIAGRAM --------
const FlowDiagram = () => (
    <section id="flow" className="wf-card border border-neutral-300 bg-white p-5 mb-8">
        <Head>Case lifecycle</Head>
        <Sub>A single case moves through these stages. Each stage is owned by a role and produces a form artefact.</Sub>
        <div className="mt-4 flex items-center gap-2 flex-wrap justify-center bg-neutral-50 p-4 border border-neutral-200">
            <FlowStep label="Nominate" sub="Admin" />
            <Arrow />
            <FlowStep label="Employee" sub="Self-reflection" />
            <Arrow />
            <FlowStep label="Manager" sub="Review" />
            <Arrow />
            <FlowStep label="Stakeholder" sub="Feedback" />
            <Arrow />
            <FlowStep label="Panel" sub="Synthesis" />
            <Arrow />
            <FlowStep label="HR" sub="Finalize" />
            <Arrow />
            <FlowStep label="Closed" sub="Renom pool" />
        </div>
    </section>
);

// -------- SCREEN: LANDING --------
const ScreenLanding = () => (
    <WF
        id="landing"
        name="Landing"
        route="/"
        roles={["all authenticated"]}
        description="After login, users land here. Three product tiles (MDC · LDC · LFP). Only LDC is live. Admins see an Admin Center link. Header shows the current fiscal year computed from the current date."
    >
        <div className="border border-neutral-400 bg-white">
            <div className="h-10 border-b border-neutral-300 bg-neutral-100 flex items-center justify-between px-3">
                <B className="w-32 h-5 grid place-items-center">Transition Diagnostics</B>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-500">Alice Wei · employee</span>
                    <Btn>Sign out</Btn>
                </div>
            </div>
            <div className="p-8 space-y-4">
                <Label>Transition Diagnostics (FY 2026-2027)</Label>
                <B className="h-14 grid place-items-center text-neutral-600 text-sm">Hero heading</B>
                <B className="h-6 grid place-items-center text-neutral-500">Sub-heading paragraph</B>
                <div className="mt-6">
                    <Label className="mb-2">Modules</Label>
                    <Row>
                        <B className="flex-1 h-40 p-3 flex flex-col justify-between">
                            <div><Label>MDC</Label><div className="text-sm text-neutral-500 mt-1">Management Development Center</div></div>
                            <Chip>Coming soon</Chip>
                        </B>
                        <div className="flex-1 h-40 p-3 flex flex-col justify-between border border-neutral-700 bg-white">
                            <div><Label>LDC</Label><div className="text-sm text-neutral-700 mt-1">Leadership Development Center</div></div>
                            <div className="flex items-center justify-between"><Chip>Live</Chip><Btn primary>Open module</Btn></div>
                        </div>
                        <B className="flex-1 h-40 p-3 flex flex-col justify-between">
                            <div><Label>LFP</Label><div className="text-sm text-neutral-500 mt-1">Leadership Feedback Process</div></div>
                            <Chip>Coming soon</Chip>
                        </B>
                    </Row>
                </div>
                <div className="text-[10px] text-neutral-400 mt-4">Admin-only link · "Admin Center →"</div>
            </div>
        </div>
    </WF>
);

// -------- SCREEN: LOGIN --------
const ScreenLogin = () => (
    <WF
        id="login"
        name="Login"
        route="/login"
        roles={["public"]}
        description="Single-column login screen. JWT auth. On success users are redirected to the landing page."
    >
        <div className="flex items-center justify-center py-10 bg-white border border-neutral-400" style={{ minHeight: 320 }}>
            <div className="w-80 space-y-3">
                <B className="w-16 h-8 mx-auto grid place-items-center">Logo</B>
                <Head>Sign in</Head>
                <Sub>Enter your corporate email to continue.</Sub>
                <Field label="Email" />
                <Field label="Password" />
                <div className="pt-2"><Btn primary>Sign in</Btn></div>
                <div className="text-[10px] text-neutral-400 pt-2">Forgot password? · Contact admin</div>
            </div>
        </div>
    </WF>
);

// -------- SCREEN: DASHBOARD --------
const ScreenDashboard = () => (
    <WF
        id="dashboard"
        name="Dashboard (role-adaptive)"
        route="/app"
        roles={["employee", "manager", "panel", "hr", "admin"]}
        description="KPI cards + 'My cases' list. Content adapts per role — an Employee sees only their own case; a Manager sees assigned nominees; a Panel member sees assigned reviews; HR/Admin see all. Includes an AI Case Brief callout for quick synthesis."
    >
        <AppChrome activeNav="Dashboard">
            <Row className="mb-4">
                {["Total cases", "In progress", "Finalized", "My pending"].map((k) => (
                    <B key={k} className="flex-1 h-16 p-3">
                        <Label>{k}</Label>
                        <div className="text-lg text-neutral-700 mt-1">##</div>
                    </B>
                ))}
            </Row>
            <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                    <Label className="mb-1">My cases</Label>
                    <Solid className="p-2 mb-1"><Row className="text-[10px] uppercase tracking-widest"><div className="flex-1">Employee</div><div className="w-24">Stage</div><div className="w-16">Type</div><div className="w-16">Updated</div></Row></Solid>
                    {[0,1,2,3].map(i => (
                        <B key={i} className="p-2 mb-1"><Row><div className="flex-1">Row {i+1}</div><Chip>stage</Chip><Chip>type</Chip><span className="text-[10px] text-neutral-400 w-16">date</span></Row></B>
                    ))}
                </div>
                <div>
                    <Label className="mb-1">AI Case Brief</Label>
                    <B className="p-3 h-40">
                        <div className="text-[10px] text-neutral-500">Auto-generated summary of a selected case</div>
                        <div className="mt-2 space-y-1">
                            <div className="h-2 bg-neutral-200 w-full"></div>
                            <div className="h-2 bg-neutral-200 w-4/5"></div>
                            <div className="h-2 bg-neutral-200 w-3/5"></div>
                        </div>
                        <div className="mt-3"><Btn>Generate</Btn></div>
                    </B>
                </div>
            </div>
        </AppChrome>
    </WF>
);

// -------- SCREEN: NOMINEES --------
const ScreenNominees = () => (
    <WF
        id="nominees"
        name="Nominees & cases"
        route="/app/nominees"
        roles={["admin", "coordinator", "manager"]}
        description="Table of all cases with search. Admins can add nominees, add employees (via master-data typeahead), and launch cases / panels."
    >
        <AppChrome activeNav="Nominees">
            <Row className="justify-between mb-3">
                <div><Label>Nominee administration</Label><Head>Nominees & cases</Head></div>
                <Row><Btn>Add employee</Btn><Btn primary>Add nominee</Btn></Row>
            </Row>
            <B className="p-2 mb-3 h-8 w-72">Search box · name or employee ID</B>
            <Solid className="p-2 mb-1"><Row className="text-[10px] uppercase tracking-widest"><div className="flex-1">Employee</div><div className="w-32">BU / Function</div><div className="w-16">FY</div><div className="w-16">Type</div><div className="w-24">Status</div><div className="w-24">Updated</div><div className="w-32 text-right">Actions</div></Row></Solid>
            {[0,1,2,3,4].map(i => (
                <B key={i} className="p-2 mb-1">
                    <Row>
                        <div className="flex-1">Nominee {i+1}<div className="text-[10px] text-neutral-400">EMP00{i+1}</div></div>
                        <div className="w-32 text-[10px]">BU · Function</div>
                        <div className="w-16 text-[10px]">FY26</div>
                        <div className="w-16"><Chip>type</Chip></div>
                        <div className="w-24"><Chip>stage</Chip></div>
                        <div className="w-24 text-[10px] text-neutral-400">2d ago</div>
                        <div className="w-32 flex justify-end gap-1"><Btn>Launch</Btn><Btn primary>Open</Btn></div>
                    </Row>
                </B>
            ))}
        </AppChrome>
    </WF>
);

// -------- SCREEN: ADD NOMINEE DIALOG --------
const ScreenAddNominee = () => (
    <WF
        id="add-nominee"
        name="Add nominee dialog"
        route="/app/nominees (modal)"
        roles={["admin", "coordinator"]}
        description="Modal to create a new case for an existing employee. Typeahead comboboxes for Employee, Manager, HR/HRBP; multi-select for Panel members. Renomination toggle triggers the prior-cycle dossier view later."
    >
        <div className="grid place-items-center bg-neutral-200 p-6" style={{ minHeight: 340 }}>
            <div className="w-[520px] bg-white border border-neutral-400 shadow-sm">
                <div className="p-3 border-b border-neutral-300 flex items-center justify-between">
                    <Head>Add nominee</Head><span className="text-neutral-400 text-xs">✕</span>
                </div>
                <div className="p-4 space-y-3">
                    <Field label="Employee (typeahead)" />
                    <Field label="Fiscal year" />
                    <div className="text-[11px] text-neutral-600 flex items-center gap-2"><B className="w-3 h-3"></B> Renomination (renders prior-cycle dossier alongside)</div>
                    <Field label="Manager (typeahead)" />
                    <Field label="HR / HRBP (typeahead)" />
                    <Field label="Panel members (multi-select)" h={36} />
                </div>
                <div className="p-3 border-t border-neutral-300 flex justify-end gap-2"><Btn>Cancel</Btn><Btn primary>Create</Btn></div>
            </div>
        </div>
    </WF>
);

// -------- SCREEN: ADD EMPLOYEE DIALOG --------
const ScreenAddEmployee = () => (
    <WF
        id="add-employee"
        name="Add employee dialog"
        route="/app/nominees (modal)"
        roles={["admin", "coordinator"]}
        description="Modal to add a new employee to the directory using Godrej master data. Company / BU / Function / Level fields are Comboboxes fed by the master tables (BU filters by selected Company). String labels are auto-denormalized server-side."
    >
        <div className="grid place-items-center bg-neutral-200 p-6" style={{ minHeight: 340 }}>
            <div className="w-[560px] bg-white border border-neutral-400 shadow-sm">
                <div className="p-3 border-b border-neutral-300 flex items-center justify-between">
                    <Head>Add employee</Head><span className="text-neutral-400 text-xs">✕</span>
                </div>
                <div className="p-4 space-y-3">
                    <Row><div className="flex-1"><Field label="Employee ID" /></div><div className="flex-1"><Field label="Employee code" /></div></Row>
                    <Field label="Full name" />
                    <Field label="Email" />
                    <Field label="Company (typeahead · master data)" />
                    <Row><div className="flex-1"><Field label="Business unit (filtered by company)" /></div><div className="flex-1"><Field label="Function" /></div></Row>
                    <Field label="Level / Band" />
                </div>
                <div className="p-3 border-t border-neutral-300 flex justify-end gap-2"><Btn>Cancel</Btn><Btn primary>Create employee</Btn></div>
            </div>
        </div>
    </WF>
);

// -------- SCREEN: CASE DETAIL --------
const ScreenCaseDetail = () => (
    <WF
        id="case-detail"
        name="Case detail (dossier)"
        route="/app/cases/:caseId"
        roles={["all with case access"]}
        description="Central dossier for a case — header with employee identity + stage, quick actions per role, cards for each form-stage (employee / manager / stakeholder / panel / HR), plus links to Uploads and Prior cycle dossier when applicable."
    >
        <AppChrome activeNav="Cases">
            <Row className="justify-between mb-2">
                <div>
                    <Label>Case · Employee name · FY26 · type</Label>
                    <Head>Employee full name</Head>
                    <Sub>Stage: manager_in_progress · Manager: … · HR: …</Sub>
                </div>
                <Row><Btn>Uploads</Btn><Btn>Documents</Btn><Btn primary>Continue my step</Btn></Row>
            </Row>
            <Row className="mb-3">
                {["Employee form","Manager form","Stakeholder","Panel","HR summary"].map((s) => (
                    <B key={s} className="flex-1 p-3 h-24">
                        <Label>{s}</Label>
                        <div className="text-[10px] text-neutral-500 mt-1">status chip · last updated</div>
                        <div className="mt-2"><Btn>Open</Btn></div>
                    </B>
                ))}
            </Row>
            <Row>
                <B className="flex-1 p-3 h-32"><Label>AI drafts / analyses</Label><div className="mt-2 space-y-1"><div className="h-2 bg-neutral-200 w-4/5"></div><div className="h-2 bg-neutral-200 w-3/5"></div></div></B>
                <B className="flex-1 p-3 h-32"><Label>Audit trail</Label><div className="mt-2 space-y-1"><div className="h-2 bg-neutral-200 w-full"></div><div className="h-2 bg-neutral-200 w-4/5"></div><div className="h-2 bg-neutral-200 w-2/5"></div></div></B>
            </Row>
            <div className="mt-3 text-[10px] text-neutral-500">If renomination → shows "View prior cycle dossier" link (see screen 10).</div>
        </AppChrome>
    </WF>
);

// -------- SCREEN: EMPLOYEE FORM --------
const ScreenEmployeeForm = () => (
    <WF
        id="employee-form"
        name="Employee self-reflection"
        route="/app/cases/:caseId/employee"
        roles={["employee"]}
        description="Multi-section form. Key contributions (2–5 rows), then the 7 core GCFs grouped by Pillar → GCF → Competency, then Overall reflection, then an OPTIONAL section for reflections on the 5 non-core GCFs (min 2 / max 3 when opting in). Autosave indicator + Clear form + Save draft + Submit."
    >
        <AppChrome activeNav="Cases">
            <Row className="justify-between mb-2">
                <div><Label>Alice Wei · FY26</Label><Head>Employee self-reflection</Head></div>
                <div className="text-[10px] text-neutral-500">Autosaved • just now</div>
            </Row>
            <div className="space-y-3">
                <B className="p-3">
                    <Label>Key contributions (2–5)</Label>
                    <div className="mt-2 space-y-2">
                        {[0,1].map(i => (
                            <Solid key={i} className="p-2">
                                <Label>Contribution {i+1}</Label>
                                <div className="grid grid-cols-2 gap-2 mt-1"><Field label="Area / initiative" /><Field label="Role played" /></div>
                                <div className="mt-2"><TA label="Impact created" rows={2} /></div>
                                <Field label="Key stakeholders" />
                            </Solid>
                        ))}
                        <Btn>+ Add contribution</Btn>
                    </div>
                </B>
                <B className="p-3">
                    <Label>Core leadership capabilities (L3) · 7 GCFs</Label>
                    <div className="mt-2 space-y-2">
                        <div className="text-[10px] uppercase text-neutral-500 tracking-widest">Pillar 1 · Leading Self</div>
                        <Solid className="p-2 text-[11px]">1.2 Hunger to Learn and Improve · N competencies</Solid>
                        <Solid className="p-2 text-[11px]">1.3 Emotional and Social Awareness · N competencies</Solid>
                        <div className="text-[10px] uppercase text-neutral-500 tracking-widest">Pillar 2 · Leading Others</div>
                        <Solid className="p-2 text-[11px]">2.1 Leading Team</Solid>
                        <Solid className="p-2 text-[11px]">2.2 Developing Others</Solid>
                        <Solid className="p-2 text-[11px]">2.3 Influencing</Solid>
                        <Solid className="p-2 text-[11px]">2.4 Fostering Collaboration</Solid>
                        <div className="text-[10px] uppercase text-neutral-500 tracking-widest">Pillar 3 · Leading Business</div>
                        <Solid className="p-2 text-[11px]">3.2 Acting Strategically</Solid>
                        <div className="text-[10px] text-neutral-500 mt-2">Each row expands to show competencies with: current rating (Below / Meets / Exceeds), rationale, "L3 demonstrated" checkbox, next-level rationale (AI improve).</div>
                    </div>
                </B>
                <B className="p-3"><TA label="Overall reflection" rows={4} /></B>
                <B className="p-3">
                    <Label>Optional · Reflections on other GCFs</Label>
                    <Sub>Header copy: "(Optional) The LDC assessment will focus on the 7 core… select 2 to 3 GCFs to comment on." Selected 0/3 · min 2 when opting in.</Sub>
                    <div className="mt-2 space-y-1">
                        {["1.1 Initiative","3.1 Customer Centricity","3.3 Functional Capability","3.4 Delivering Results","3.5 Institution Building"].map((g) => (
                            <Solid key={g} className="p-2 text-[11px] flex items-center gap-2"><B className="w-3 h-3"></B>{g}</Solid>
                        ))}
                    </div>
                </B>
                <Row className="justify-end"><Btn>Clear form</Btn><Btn>Save draft</Btn><Btn primary>Submit</Btn></Row>
            </div>
        </AppChrome>
    </WF>
);

// -------- SCREEN: MANAGER FORM --------
const ScreenManagerForm = () => (
    <WF
        id="manager-form"
        name="Manager review"
        route="/app/cases/:caseId/manager"
        roles={["manager"]}
        description="AI-assisted manager review: full L-next capability review grid, stakeholder identification (minimum 3 rows) with a directory picker typeahead, readiness call, overall rationale (AI rewrite). Autosave. Clear / Save draft / Submit."
    >
        <AppChrome activeNav="Cases">
            <Row className="justify-between mb-2">
                <div><Label>Employee name · FY26</Label><Head>Manager nomination & review</Head></div>
                <div className="text-[10px] text-neutral-500">Autosaved</div>
            </Row>
            <B className="p-3 mb-3"><Label>AI assistants</Label><Row className="mt-2"><Btn>Suggest stakeholders</Btn><Btn>Integrated summary</Btn></Row></B>
            <B className="p-3 mb-3">
                <Label>L3 capability review — all GCFs grouped by Pillar</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                    {[0,1,2,3].map(i => (<Solid key={i} className="p-2 text-[11px]">Capability row {i+1} · rating + rationale + AI improve</Solid>))}
                </div>
            </B>
            <B className="p-3 mb-3">
                <Label>Stakeholder identification (min 3)</Label>
                <div className="p-2 my-2 bg-white border border-neutral-300"><Label>Pick from directory</Label><B className="mt-1 h-6"></B></div>
                <Solid className="p-2 text-[10px] uppercase tracking-widest"><Row><div className="flex-1">Name</div><div className="flex-1">Email</div><div className="flex-1">Relationship</div><div className="w-8"></div></Row></Solid>
                {[0,1,2].map(i => (<B key={i} className="p-2 my-1 h-8"></B>))}
                <Btn>+ Add stakeholder</Btn>
            </B>
            <B className="p-3 mb-3"><Field label="Readiness call (dropdown)" /><div className="mt-2"><TA label="Overall rationale" rows={4} /></div></B>
            <Row className="justify-end"><Btn>Clear form</Btn><Btn>Save draft</Btn><Btn primary>Submit</Btn></Row>
        </AppChrome>
    </WF>
);

// -------- SCREEN: STAKEHOLDER FORM --------
const ScreenStakeholderForm = () => (
    <WF
        id="stakeholder-form"
        name="Stakeholder feedback"
        route="/app/cases/:caseId/stakeholder"
        roles={["stakeholder"]}
        description="Simpler capability-wise feedback form for the person nominated as a stakeholder. Rating (Below / Meets / Exceeds) + observations per capability + overall qualitative comments. Clear / Save draft / Submit."
    >
        <AppChrome activeNav="Cases">
            <Row className="justify-between mb-2">
                <div><Label>Employee name · FY26</Label><Head>Stakeholder feedback</Head></div>
            </Row>
            <B className="p-3 mb-3">
                <Label>Capability-wise feedback · L3</Label>
                <div className="mt-2 space-y-1">
                    {[0,1,2,3,4].map(i => (
                        <Solid key={i} className="p-2 flex items-center gap-2 text-[11px]"><div className="flex-1">Capability row {i+1}</div><div className="w-24"><Field label="Rating" h={16} /></div></Solid>
                    ))}
                </div>
            </B>
            <B className="p-3 mb-3"><TA label="Overall qualitative comments" rows={4} /></B>
            <Row className="justify-end"><Btn>Clear form</Btn><Btn>Save draft</Btn><Btn primary>Submit</Btn></Row>
        </AppChrome>
    </WF>
);

// -------- SCREEN: PANEL REVIEW --------
const ScreenPanelForm = () => (
    <WF
        id="panel-form"
        name="Panel review & synthesis"
        route="/app/cases/:caseId/panel"
        roles={["panel"]}
        description="Consolidated matrix showing Self / Manager / Stakeholder / Panel-you ratings, side-by-side per capability. AI Panel Draft can be applied in one click. Bias-check + Capability-gap panels stack on top. Documents drawer to the right. Overall panel call at the bottom."
    >
        <AppChrome activeNav="Cases">
            <Row className="justify-between mb-2">
                <div><Label>Employee · FY26</Label><Head>Panel review & synthesis</Head></div>
                <Row><Btn>Documents</Btn><Btn primary>Apply panel draft</Btn></Row>
            </Row>
            <B className="p-3 mb-3"><Label>AI assistants</Label><Row className="mt-2"><Btn>Panel draft</Btn><Btn>Integrated summary</Btn><Btn>Bias check</Btn><Btn>Capability gap</Btn></Row></B>
            <B className="p-3 mb-3">
                <Label>Consolidated capability matrix · grouped by Pillar / GCF</Label>
                <Solid className="p-2 mt-2 text-[10px] uppercase tracking-widest"><Row><div className="flex-1">Capability</div><div className="w-20">Self</div><div className="w-20">Manager</div><div className="w-24">Stakeholder(s)</div><div className="w-20">Panel (you)</div></Row></Solid>
                {[0,1,2,3,4].map(i => (<B key={i} className="p-2 my-1 h-6"></B>))}
            </B>
            <B className="p-3 mb-3"><Label>Panel rationale per capability (grouped)</Label><div className="mt-2 space-y-1">{[0,1,2].map(i=>(<Solid key={i} className="p-2 h-10"></Solid>))}</div></B>
            <B className="p-3 mb-3"><Field label="Overall readiness (dropdown)" /><div className="mt-2"><TA label="Overall rationale" rows={4} /></div><div className="mt-2"><TA label="Discussion notes" rows={2} /></div></B>
            <Row className="justify-end"><Btn>Clear form</Btn><Btn>Save draft</Btn><Btn primary>Submit</Btn></Row>
        </AppChrome>
    </WF>
);

// -------- SCREEN: PRIOR CYCLE DOSSIER --------
const ScreenPriorCycle = () => (
    <WF
        id="prior-cycle"
        name="Prior-cycle dossier (renomination)"
        route="/app/cases/:caseId (embedded panel)"
        roles={["all with case access"]}
        description="Only appears for renomination cases. Renders side-by-side inside the Case Detail screen. Shows prior HR readiness call, prior manager readiness, prior strengths, prior development areas, prior panel capability ratings and prior development plan — so reviewers can see progress over cycles."
    >
        <AppChrome activeNav="Cases">
            <Row className="justify-between mb-2"><div><Label>Renomination · Employee</Label><Head>Prior cycle · FY25</Head></div><Chip>Read-only</Chip></Row>
            <div className="grid grid-cols-2 gap-3">
                <B className="p-3 h-28"><Label>Prior HR readiness</Label><div className="mt-1 h-2 bg-neutral-200 w-1/2"></div><div className="mt-1 h-2 bg-neutral-200 w-3/4"></div></B>
                <B className="p-3 h-28"><Label>Prior manager readiness</Label><div className="mt-1 h-2 bg-neutral-200 w-1/2"></div><div className="mt-1 h-2 bg-neutral-200 w-3/4"></div></B>
                <B className="p-3 h-40"><Label>Prior strengths</Label><div className="mt-2 space-y-1">{[0,1,2].map(i=>(<div key={i} className="h-2 bg-neutral-200 w-full"></div>))}</div></B>
                <B className="p-3 h-40"><Label>Prior development areas</Label><div className="mt-2 space-y-1">{[0,1,2].map(i=>(<div key={i} className="h-2 bg-neutral-200 w-full"></div>))}</div></B>
                <B className="p-3 h-40 col-span-2"><Label>Prior panel capability ratings</Label><div className="mt-2 grid grid-cols-3 gap-2">{[0,1,2,3,4,5].map(i=>(<Solid key={i} className="p-2 text-[10px]">cap {i+1} · rating</Solid>))}</div></B>
                <B className="p-3 h-32 col-span-2"><Label>Prior development plan</Label><div className="mt-2 space-y-1"><div className="h-2 bg-neutral-200 w-full"></div><div className="h-2 bg-neutral-200 w-4/5"></div></div></B>
            </div>
        </AppChrome>
    </WF>
);

// -------- SCREEN: HR SUMMARY --------
const ScreenHRForm = () => (
    <WF
        id="hr-form"
        name="HR final summary"
        route="/app/cases/:caseId/hr"
        roles={["hr", "hrbp"]}
        description="Final report: strengths (list, +add), improvements (list, +add), overall employee-facing summary, development plan, additional feedback, final readiness. AI HR draft can be applied in one click. Submitting finalizes the case (status → closed)."
    >
        <AppChrome activeNav="Cases">
            <Row className="justify-between mb-2"><div><Label>Employee · FY26</Label><Head>HR final summary report</Head></div><Row><Btn primary>Apply HR draft</Btn></Row></Row>
            <B className="p-3 mb-3"><Label>AI drafts</Label><Row className="mt-2"><Btn>HR draft</Btn><Btn>Development plan</Btn><Btn>Integrated summary</Btn><Btn>Bias check</Btn></Row></B>
            <B className="p-3 mb-3">
                <Label>Panel & manager context</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                    <Solid className="p-2 h-20"><Label>Manager readiness call</Label></Solid>
                    <Solid className="p-2 h-20"><Label>Panel submissions</Label></Solid>
                </div>
            </B>
            <B className="p-3 mb-3"><Label>Strengths (list · +Add · AI improve per row)</Label><div className="mt-2 space-y-1">{[0,1,2].map(i=>(<Solid key={i} className="p-2 h-10"></Solid>))}<Btn>+ Add strength</Btn></div></B>
            <B className="p-3 mb-3"><Label>Opportunities for improvement</Label><div className="mt-2 space-y-1">{[0,1].map(i=>(<Solid key={i} className="p-2 h-10"></Solid>))}<Btn>+ Add improvement</Btn></div></B>
            <B className="p-3 mb-3">
                <TA label="Overall summary (employee-facing)" rows={4} />
                <div className="mt-2"><TA label="Development plan" rows={3} /></div>
                <div className="mt-2"><TA label="Additional feedback" rows={2} /></div>
                <div className="mt-2"><Field label="Final readiness (dropdown)" /></div>
            </B>
            <Row className="justify-end"><Btn>Clear form</Btn><Btn>Save draft</Btn><Btn primary>Finalize</Btn></Row>
        </AppChrome>
    </WF>
);

// -------- SCREEN: UPLOADS --------
const ScreenUploads = () => (
    <WF
        id="uploads"
        name="Uploads centre"
        route="/app/cases/:caseId/uploads"
        roles={["admin", "coordinator", "manager", "hr"]}
        description="One row per document type. Each row shows current status, latest version, and actions (upload, replace, delete-with-confirm, version history). PDFs/txt are parsed on upload and automatically summarised by the background AI job."
    >
        <AppChrome activeNav="Cases">
            <Row className="justify-between mb-2"><div><Label>Employee · FY26</Label><Head>Uploads centre</Head></div></Row>
            <Solid className="p-2 text-[10px] uppercase tracking-widest"><Row><div className="flex-1">Document type</div><div className="w-24">Status</div><div className="w-20">Version</div><div className="w-32 text-right">Actions</div></Row></Solid>
            {["Org chart","Talent scorecard","Psychometric PDF","Annual review","Mid review","360 report","Presentation","Profile"].map((t,i) => (
                <B key={i} className="p-2 my-1"><Row><div className="flex-1">{t}</div><Chip>uploaded / missing</Chip><div className="w-20 text-[10px]">v{i+1}</div><div className="w-32 flex justify-end gap-1"><Btn>Replace</Btn><Btn>Delete</Btn></div></Row></B>
            ))}
            <div className="mt-3 text-[10px] text-neutral-500">Delete opens a confirm dialog (React modal — window.confirm is blocked inside iframes).</div>
        </AppChrome>
    </WF>
);

// -------- SCREEN: STATUS DASHBOARD --------
const ScreenStatus = () => (
    <WF
        id="status"
        name="Status dashboard"
        route="/app/status"
        roles={["admin", "coordinator", "hr", "hrbp"]}
        description="Matrix view — one row per case, one column per form-stage. Filter by fiscal year, BU, function, readiness. Export CSV. Renders quickly against `GET /api/status`."
    >
        <AppChrome activeNav="Status">
            <Row className="justify-between mb-3"><div><Label>Portfolio-level view</Label><Head>Case status matrix</Head></div><Row><Btn>Export CSV</Btn></Row></Row>
            <Row className="mb-3"><B className="p-2 h-8 w-40">Filter · Fiscal year</B><B className="p-2 h-8 w-40">Filter · BU</B><B className="p-2 h-8 w-40">Filter · Function</B><B className="p-2 h-8 w-40">Filter · Readiness</B></Row>
            <Solid className="p-2 text-[10px] uppercase tracking-widest"><Row><div className="flex-1">Employee</div><div className="w-24">Employee</div><div className="w-24">Manager</div><div className="w-32">Stakeholder</div><div className="w-24">Panel</div><div className="w-24">HR</div><div className="w-24">Presentation</div></Row></Solid>
            {[0,1,2,3,4,5,6].map(i => (
                <B key={i} className="p-2 my-1"><Row><div className="flex-1">Row {i+1}</div><Chip>submitted</Chip><Chip>submitted</Chip><Chip>2/3</Chip><Chip>1/2</Chip><Chip>draft</Chip><Chip>✓</Chip></Row></B>
            ))}
        </AppChrome>
    </WF>
);

// -------- SCREEN: NOTIFICATIONS --------
const ScreenNotifications = () => (
    <WF
        id="notifications"
        name="Notifications drawer"
        route="Header bell icon (any authenticated screen)"
        roles={["all authenticated"]}
        description="Dropdown surfacing case-launched, form-submitted, form-reopened events. Unread badge on the bell. Clicking a notification routes to the relevant case. Emails are mocked into `email_outbox`."
    >
        <div className="grid place-items-start bg-neutral-200 p-6" style={{ minHeight: 340 }}>
            <div className="w-[380px] bg-white border border-neutral-400 shadow-sm">
                <div className="p-3 border-b border-neutral-300 flex items-center justify-between">
                    <Head>Notifications</Head><Btn>Mark all read</Btn>
                </div>
                <div className="max-h-72 overflow-auto">
                    {[0,1,2,3,4].map(i => (
                        <B key={i} className="p-3 border-b border-neutral-200">
                            <div className="text-[11px] text-neutral-700">Notification title #{i+1}</div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">One-line body · 2h ago</div>
                        </B>
                    ))}
                </div>
                <div className="p-2 text-center text-[10px] text-neutral-400 border-t border-neutral-200">Click a notification to open the case</div>
            </div>
        </div>
    </WF>
);

// -------- SCREEN: ADMIN CENTER --------
const ScreenAdmin = () => (
    <WF
        id="admin"
        name="Admin Center"
        route="/admin"
        roles={["admin"]}
        description="Governance surface. Users & roles table, Godrej Capability Framework reference (L1–L4), master reference tables (Companies · Functions · Business Units · Levels), and a Reopen forms panel that lets an admin unlock any form for edit."
    >
        <div className="border border-neutral-400 bg-white">
            <div className="h-10 border-b border-neutral-300 bg-neutral-100 flex items-center justify-between px-3">
                <Row><Btn>← Modules</Btn><Head>Admin Center</Head></Row>
                <Btn>Open LDC →</Btn>
            </div>
            <div className="p-4 space-y-3">
                <Row>
                    <B className="flex-1 p-3">
                        <Label>Users & roles</Label>
                        <div className="mt-2 space-y-1">{[0,1,2,3].map(i=>(<Solid key={i} className="p-2 h-6"></Solid>))}</div>
                    </B>
                    <B className="flex-1 p-3">
                        <Label>Godrej Capability Framework (L1–L4)</Label>
                        <div className="mt-2 space-y-1">{[0,1,2,3,4].map(i=>(<Solid key={i} className="p-2 h-5"></Solid>))}</div>
                    </B>
                </Row>
                <B className="p-3">
                    <Label>Master data · Godrej reference tables</Label>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                        {["Companies (8)","Functions (20)","Business units (25)","Levels (9)"].map(t => (
                            <Solid key={t} className="p-2 h-32"><Label>{t}</Label><div className="mt-2 space-y-1">{[0,1,2].map(i=>(<div key={i} className="h-2 bg-neutral-200 w-full"></div>))}</div></Solid>
                        ))}
                    </div>
                </B>
                <B className="p-3">
                    <Label>Reopen forms</Label>
                    <Solid className="p-2 text-[10px] uppercase tracking-widest mt-2"><Row><div className="flex-1">Case</div><div className="w-24">Status</div><div className="w-48 text-right">Actions</div></Row></Solid>
                    {[0,1,2].map(i => (
                        <B key={i} className="p-2 my-1"><Row><div className="flex-1">Case row {i+1}</div><Chip>stage</Chip><div className="w-48 flex justify-end gap-1"><Btn>employee</Btn><Btn>manager</Btn><Btn>panel</Btn><Btn>hr</Btn></div></Row></B>
                    ))}
                </B>
            </div>
        </div>
    </WF>
);
