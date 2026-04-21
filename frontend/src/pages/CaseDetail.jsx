import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import StatusBadge from "@/components/StatusBadge";
import AIPanel from "@/components/AIPanel";
import { CaseAIBar, AI_LABELS } from "@/components/AIHelpers";
import { humanDate, DOC_TYPE_LABELS } from "@/lib/utils-ldc";
import {
    PencilSimple, Users, FolderOpen, ChartBar, ClipboardText,
    CaretRight, Target, ClockCounterClockwise,
} from "@phosphor-icons/react";

export default function CaseDetail() {
    const { caseId } = useParams();
    const { user, hasRole } = useAuth();
    const nav = useNavigate();
    const [c, setC] = useState(null);
    const [docs, setDocs] = useState([]);
    const [analyses, setAnalyses] = useState({});
    const [prior, setPrior] = useState(null);
    const [loading, setLoading] = useState(true);

    const reload = async () => {
        const [cd, dd, ai] = await Promise.all([
            api.get(`/cases/${caseId}`).then(r => r.data),
            api.get(`/cases/${caseId}/documents`).then(r => r.data),
            api.get(`/ai/case/${caseId}/latest`).then(r => r.data),
        ]);
        setC(cd); setDocs(dd.documents); setAnalyses(ai);
        if (cd.is_renomination) {
            try {
                const { data } = await api.get(`/cases/${caseId}/prior`);
                setPrior(data);
            } catch { /* no prior */ }
        }
        setLoading(false);
    };
    useEffect(() => { reload(); }, [caseId]);

    if (loading || !c) return <div className="p-8 text-sm text-slate-400">Loading case…</div>;

    const shortcuts = [];
    const emp = c.employee;
    const isMyCase = user.roles.includes("employee") && emp?.email === user.email;

    if (isMyCase || hasRole("admin", "coordinator")) {
        shortcuts.push({ to: `/app/cases/${c.id}/employee`, label: "Employee self-reflection", icon: PencilSimple });
    }
    if (c.assigned_manager_id === user.id || hasRole("admin", "coordinator", "hr", "hrbp")) {
        shortcuts.push({ to: `/app/cases/${c.id}/manager`, label: "Manager review", icon: ClipboardText });
    }
    shortcuts.push({ to: `/app/cases/${c.id}/stakeholder`, label: "Stakeholder feedback", icon: Users });
    if (c.assigned_panel_ids?.includes(user.id) || hasRole("admin", "coordinator", "hr", "hrbp")) {
        shortcuts.push({ to: `/app/cases/${c.id}/panel`, label: "Panel review", icon: Target });
    }
    if (hasRole("hr", "hrbp", "admin", "coordinator")) {
        shortcuts.push({ to: `/app/cases/${c.id}/hr`, label: "HR final summary", icon: ChartBar });
    }
    shortcuts.push({ to: `/app/cases/${c.id}/uploads`, label: "Documents", icon: FolderOpen });

    const aiTypes = ["quick_brief", "integrated_summary", "bias_check", "capability_gap"];

    return (
        <div className="space-y-5 animate-fade-in">
            {/* header */}
            <div className="ldc-panel p-4 md:p-5 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <div className="ldc-label">Case · {c.fiscal_year} {c.is_renomination && <span className="ml-2 text-amber-700">· Renomination</span>}</div>
                    <h1 className="text-2xl font-semibold tracking-tight mt-1">{emp?.name}</h1>
                    <div className="text-sm text-slate-500">{emp?.emp_id} · {emp?.level} · {emp?.bu} · {emp?.function}</div>
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge status={c.status} size="lg" />
                    <span className="text-xs text-slate-400">Updated {humanDate(c.updated_at)}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                    {c.is_renomination && <PriorCyclePanel prior={prior} />}
                    <div className="ldc-panel">
                        <div className="p-4 border-b border-slate-200 ldc-section-title">Workflow shortcuts</div>
                        <div className="p-2">
                            {shortcuts.map((s, i) => (
                                <Link to={s.to} key={i} data-testid={`shortcut-${s.label.toLowerCase().replace(/\s+/g,"-")}`}
                                    className="flex items-center justify-between px-3 py-2 rounded hover:bg-slate-50 text-sm">
                                    <span className="flex items-center gap-2"><s.icon size={16} weight="bold" className="text-slate-500" />{s.label}</span>
                                    <CaretRight size={14} className="text-slate-400" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="ldc-panel">
                        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                            <div className="ldc-section-title">Documents</div>
                            <Link to={`/app/cases/${c.id}/uploads`} className="text-xs font-semibold hover:underline" data-testid="case-docs-manage">Manage →</Link>
                        </div>
                        {docs.length === 0 ? (
                            <div className="p-6 text-center text-sm text-slate-400">No documents uploaded yet.</div>
                        ) : (
                            <table className="ldc-table w-full">
                                <thead><tr><th>Type</th><th>Filename</th><th>Version</th><th>Uploaded</th></tr></thead>
                                <tbody>
                                    {docs.filter(d => d.is_latest).map((d) => (
                                        <tr key={d.id}>
                                            <td>{DOC_TYPE_LABELS[d.doc_type] || d.doc_type}</td>
                                            <td className="text-slate-700">{d.original_filename}</td>
                                            <td>v{d.version}</td>
                                            <td className="text-xs text-slate-500">{humanDate(d.uploaded_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="ldc-panel p-4">
                        <div className="ldc-label mb-2">AI insights</div>
                        <CaseAIBar caseId={c.id} types={aiTypes} onResult={(t, d) => setAnalyses({ ...analyses, [t]: d })} />
                    </div>
                    {Object.entries(analyses).filter(([t]) => aiTypes.includes(t)).map(([t, a]) => (
                        <AIPanel key={t} title={AI_LABELS[t] || t} subtitle={humanDate(a.created_at)} testid={`ai-card-${t}`}>
                            <AIContent structured={a.structured} />
                        </AIPanel>
                    ))}
                </div>
            </div>
        </div>
    );
}

function AIContent({ structured }) {
    if (!structured) return <div className="text-sm text-slate-500">No output.</div>;
    if (structured.error) return <div className="text-xs text-amber-800">{String(structured.raw || structured.error)}</div>;
    return (
        <div className="space-y-2">
            {structured.integrated_summary && <div><strong className="block text-xs uppercase tracking-widest text-amber-800 mb-1">Summary</strong>{structured.integrated_summary}</div>}
            {structured.brief && <div className="whitespace-pre-line">{structured.brief}</div>}
            {structured.readiness_assessment && <div><strong>Readiness:</strong> {structured.readiness_assessment}</div>}
            {arr(structured.top_strengths) && <Bullets title="Top strengths" items={structured.top_strengths} />}
            {arr(structured.top_concerns) && <Bullets title="Top concerns" items={structured.top_concerns} />}
            {arr(structured.missing_data) && <Bullets title="Missing data" items={structured.missing_data} />}
            {arr(structured.strengths) && <Bullets title="Strengths" items={structured.strengths} />}
            {arr(structured.development_areas) && <Bullets title="Development areas" items={structured.development_areas} />}
            {arr(structured.readiness_indicators) && <Bullets title="Readiness indicators" items={structured.readiness_indicators} />}
            {arr(structured.discussion_flags) && <Bullets title="Discussion flags" items={structured.discussion_flags.map(f => typeof f === "string" ? f : `${f.topic} — ${f.explanation}`)} />}
            {arr(structured.bias_risks) && <Bullets title="Bias risks" items={structured.bias_risks.map(f => `[${f.risk}] ${f.reason}`)} />}
            {arr(structured.gaps) && <Bullets title="Gaps" items={structured.gaps.map(f => `[${f.severity}] ${f.capability}: ${f.reason}`)} />}
            {arr(structured.rating_mismatches) && <Bullets title="Rating mismatches" items={structured.rating_mismatches.map(f => `${f.capability} — self ${f.self} · mgr ${f.manager} · panel ${f.panel}`)} />}
        </div>
    );
}
function arr(x) { return Array.isArray(x) && x.length > 0; }
function Bullets({ title, items }) {
    return (
        <div>
            <strong className="block text-xs uppercase tracking-widest text-amber-800 mb-1">{title}</strong>
            <ul className="list-disc pl-4 space-y-0.5">
                {items.map((it, i) => <li key={i}>{String(it)}</li>)}
            </ul>
        </div>
    );
}

function PriorCyclePanel({ prior }) {
    if (!prior) {
        return (
            <div className="ldc-panel p-4 text-sm text-slate-500 border-amber-200 bg-amber-50/30">
                <div className="ldc-label text-amber-800 mb-1 flex items-center gap-1"><ClockCounterClockwise size={12} /> Renomination dossier</div>
                Loading prior-cycle data…
            </div>
        );
    }
    if (!prior.prior) {
        return (
            <div className="ldc-panel p-4 text-sm text-slate-500 border-amber-200 bg-amber-50/30">
                <div className="ldc-label text-amber-800 mb-1 flex items-center gap-1"><ClockCounterClockwise size={12} /> Renomination dossier</div>
                No prior-cycle case on record for this employee.
            </div>
        );
    }
    const p = prior.prior;
    const hr = prior.hr_review;
    const mgr = prior.manager_form;
    const panel = prior.panel_reviews || [];
    const caps = prior.capabilities || [];
    return (
        <div className="ldc-panel border-amber-200" data-testid="prior-cycle-panel">
            <div className="p-4 border-b border-amber-200 bg-amber-50/50 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <ClockCounterClockwise size={16} weight="bold" className="text-amber-700" />
                    <div>
                        <div className="ldc-label text-amber-800">Prior cycle · {p.fiscal_year}</div>
                        <div className="text-sm font-semibold text-slate-900">Historical dossier — referenced for renomination</div>
                    </div>
                </div>
                <StatusBadge status={p.status} />
            </div>
            <div className="p-4 grid md:grid-cols-2 gap-4 text-sm">
                <div>
                    <div className="ldc-label mb-1">Prior HR final readiness</div>
                    <div className="font-semibold text-slate-900">{hr?.readiness ? hr.readiness.toUpperCase() : "—"}</div>
                    {hr?.overall_summary && <p className="text-slate-600 mt-2 whitespace-pre-line">{hr.overall_summary}</p>}
                </div>
                <div>
                    <div className="ldc-label mb-1">Prior manager readiness</div>
                    <div className="font-semibold text-slate-900">{mgr?.readiness ? mgr.readiness.toUpperCase() : "—"}</div>
                    {mgr?.overall_rationale && <p className="text-slate-600 mt-2 whitespace-pre-line">{mgr.overall_rationale}</p>}
                </div>
            </div>
            {hr && (hr.strengths?.length > 0 || hr.improvements?.length > 0) && (
                <div className="p-4 border-t border-amber-100 grid md:grid-cols-2 gap-4 text-sm">
                    {hr.strengths?.length > 0 && (
                        <div>
                            <div className="ldc-label mb-1">Prior strengths</div>
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                                {hr.strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    )}
                    {hr.improvements?.length > 0 && (
                        <div>
                            <div className="ldc-label mb-1">Prior development areas</div>
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                                {hr.improvements.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}
            {panel.length > 0 && caps.length > 0 && (
                <div className="p-4 border-t border-amber-100">
                    <div className="ldc-label mb-2">Prior panel capability ratings</div>
                    <table className="ldc-table w-full">
                        <thead><tr><th>Capability</th><th>Rating</th><th>Rationale</th></tr></thead>
                        <tbody>
                            {caps.map(cap => {
                                // take first panel review's rating for each capability (they were aligned)
                                const r = panel[0]?.capability_ratings?.find(x => x.capability_id === cap.id);
                                if (!r || !r.rating) return null;
                                return (
                                    <tr key={cap.id}>
                                        <td>{cap.name}<span className="text-[11px] text-slate-400 ml-1">· {cap.category}</span></td>
                                        <td><span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-semibold">{r.rating}</span></td>
                                        <td className="text-xs text-slate-600">{r.rationale}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            {hr?.development_plan && (
                <div className="p-4 border-t border-amber-100">
                    <div className="ldc-label mb-1">Prior development plan</div>
                    <p className="text-sm text-slate-700 whitespace-pre-line">{hr.development_plan}</p>
                </div>
            )}
        </div>
    );
}

