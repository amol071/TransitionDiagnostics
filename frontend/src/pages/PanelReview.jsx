import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import StatusBadge from "@/components/StatusBadge";
import AIPanel from "@/components/AIPanel";
import { AIWriteButton, CaseAIBar, useAutoSave, SaveIndicator, AI_LABELS } from "@/components/AIHelpers";
import { humanDate, DOC_TYPE_LABELS } from "@/lib/utils-ldc";
import { CheckCircle, FolderOpen, Sparkle } from "@phosphor-icons/react";
import { toast } from "sonner";

const PANEL_LEVELS = [
    { v: "", l: "—" },
    { v: "Strong", l: "Strong" },
    { v: "Moderate", l: "Moderate" },
    { v: "Weak", l: "Weak" },
    { v: "Mixed", l: "Mixed" },
];

const READINESS = [
    { v: "", l: "Select…" }, { v: "strong", l: "Strong" }, { v: "moderate", l: "Moderate" }, { v: "weak", l: "Weak" },
];

export default function PanelReview() {
    const { caseId } = useParams();
    const { user } = useAuth();
    const [c, setC] = useState(null);
    const [caps, setCaps] = useState([]);
    const [empForm, setEmpForm] = useState(null);
    const [mgrForm, setMgrForm] = useState(null);
    const [stkFbs, setStkFbs] = useState([]);
    const [docs, setDocs] = useState([]);
    const [form, setForm] = useState(null);
    const [analyses, setAnalyses] = useState({});
    const [docDrawer, setDocDrawer] = useState(false);

    const reload = async () => {
        const [cd, capd, ef, mf, stks, dd, pr, lat] = await Promise.all([
            api.get(`/cases/${caseId}`).then(r => r.data),
            api.get(`/capabilities`).then(r => r.data),
            api.get(`/cases/${caseId}/employee-form`).then(r => r.data),
            api.get(`/cases/${caseId}/manager-form`).then(r => r.data),
            api.get(`/cases/${caseId}/stakeholder-feedback`).then(r => r.data),
            api.get(`/cases/${caseId}/documents`).then(r => r.data),
            api.get(`/cases/${caseId}/panel-review/mine`).then(r => r.data),
            api.get(`/ai/case/${caseId}/latest`).then(r => r.data),
        ]);
        setC(cd); setCaps(capd); setEmpForm(ef); setMgrForm(mf); setStkFbs(stks); setDocs(dd.documents);
        const existing = new Map((pr.capability_ratings || []).map(r => [r.capability_id, r]));
        pr.capability_ratings = capd.map(cap => existing.get(cap.id) || { capability_id: cap.id, rating: "", rationale: "" });
        setForm(pr);
        setAnalyses(lat);
    };
    useEffect(() => { reload(); }, [caseId]);

    const save = async (override) => {
        const payload = { ...form, status: override || form.status || "draft" };
        const { data } = await api.put(`/cases/${caseId}/panel-review/mine`, payload);
        const existing = new Map((data.capability_ratings || []).map(r => [r.capability_id, r]));
        data.capability_ratings = caps.map(cap => existing.get(cap.id) || { capability_id: cap.id, rating: "", rationale: "" });
        setForm(data);
    };

    const { saving, savedAt, mark, dirty } = useAutoSave(async () => { if (form && form.status !== "submitted") await save(); }, 1800);

    if (!form || !c) return <div className="p-8 text-sm text-slate-400">Loading…</div>;
    const readonly = form.status === "submitted";

    const setField = (k, v) => { setForm({ ...form, [k]: v }); mark(); };
    const setCap = (i, k, v) => { const arr = [...form.capability_ratings]; arr[i] = { ...arr[i], [k]: v }; setForm({ ...form, capability_ratings: arr }); mark(); };

    const submit = async () => {
        if (!form.overall_rating) { toast.error("Overall rating required"); return; }
        if (!form.overall_rationale?.trim()) { toast.error("Overall rationale required"); return; }
        if (!window.confirm("Submit your panel review?")) return;
        await save("submitted");
        toast.success("Panel review submitted");
    };

    const applyPanelDraft = () => {
        const a = analyses.panel_draft?.structured;
        if (!a) { toast.message("Generate a panel draft first"); return; }
        setField("overall_rating", (a.overall_readiness || "").toLowerCase());
        setField("overall_rationale", a.overall_rationale || "");
        const byName = new Map((a.per_capability || []).map(x => [x.capability_name?.toLowerCase(), x]));
        const next = form.capability_ratings.map((r) => {
            const cap = caps.find(c => c.id === r.capability_id);
            const hit = cap && byName.get(cap.name.toLowerCase());
            if (hit) return { ...r, rating: hit.rating || r.rating, rationale: hit.rationale || r.rationale };
            return r;
        });
        setForm({ ...form, overall_rating: (a.overall_readiness || "").toLowerCase(), overall_rationale: a.overall_rationale || "", capability_ratings: next });
        mark();
        toast.success("AI draft applied — review before submit");
    };

    // consolidated capability view
    const capRow = (cap) => {
        const self = empForm?.capability_responses?.find(r => r.capability_id === cap.id) || {};
        const mgr = mgrForm?.capability_responses?.find(r => r.capability_id === cap.id) || {};
        const stk = stkFbs.map(s => s.capability_responses?.find(r => r.capability_id === cap.id)).filter(Boolean);
        return (
            <tr key={cap.id} data-testid={`panel-consol-${cap.code}`}>
                <td>
                    <div className="font-semibold text-sm">{cap.name}</div>
                    <div className="text-[11px] text-slate-500">{cap.pillar} · {cap.category}</div>
                </td>
                <td><Rating level={self.current_level} next={self.demonstrated_next} /></td>
                <td><Rating level={mgr.current_level} next={mgr.demonstrated_next} /></td>
                <td>
                    {stk.length === 0 ? <span className="text-xs text-slate-400">—</span> : (
                        <div className="space-y-1">
                            {stk.map((s, i) => <Rating key={i} level={s.current_level} next={s.demonstrated_next} small />)}
                        </div>
                    )}
                </td>
                <td>
                    <select value={form.capability_ratings.find(r => r.capability_id === cap.id)?.rating || ""} onChange={(e) => {
                        const idx = form.capability_ratings.findIndex(r => r.capability_id === cap.id);
                        setCap(idx, "rating", e.target.value);
                    }} disabled={readonly} data-testid={`panel-rating-${cap.code}`} className="px-1.5 py-1 border border-slate-300 rounded text-xs disabled:bg-slate-50">
                        {PANEL_LEVELS.map(l => <option key={l.v} value={l.v}>{l.l}</option>)}
                    </select>
                </td>
            </tr>
        );
    };

    return (
        <div className="space-y-5 animate-fade-in" data-testid="panel-review-page">
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <Link to={`/app/cases/${c.id}`} className="text-xs text-slate-500 hover:text-slate-900">← Back to case</Link>
                    <div className="ldc-label mt-1">{c.employee?.name} · {c.fiscal_year}{c.is_renomination && " · Renomination"}</div>
                    <h1 className="text-2xl font-semibold tracking-tight mt-1">Panel review & synthesis</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setDocDrawer(true)} data-testid="open-docs-drawer" className="text-xs font-semibold px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 flex items-center gap-1"><FolderOpen size={14} /> Documents ({docs.filter(d => d.is_latest).length})</button>
                    {readonly ? <StatusBadge status="submitted" size="lg" /> : <SaveIndicator saving={saving} savedAt={savedAt} dirty={dirty} />}
                </div>
            </div>

            <div className="ldc-panel p-4">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <div className="ldc-label">AI assistants</div>
                    <button onClick={applyPanelDraft} data-testid="apply-panel-draft" className="text-xs font-semibold px-3 py-1.5 rounded bg-amber-500 text-white hover:bg-amber-600 flex items-center gap-1"><Sparkle size={12} weight="fill" /> Apply panel draft</button>
                </div>
                <CaseAIBar caseId={c.id} types={["panel_draft", "integrated_summary", "bias_check", "capability_gap"]} onResult={(t, a) => setAnalyses({ ...analyses, [t]: a })} />
            </div>

            {["panel_draft", "integrated_summary", "bias_check", "capability_gap"].map(t => analyses[t] && (
                <AIPanel key={t} title={AI_LABELS[t] || t} subtitle={humanDate(analyses[t].created_at)} testid={`ai-${t}`}>
                    <AIRender type={t} data={analyses[t].structured} />
                </AIPanel>
            ))}

            {/* Consolidated table */}
            <div className="ldc-panel">
                <div className="p-4 border-b border-slate-200 ldc-section-title">Consolidated capability view</div>
                <div className="overflow-auto">
                    <table className="ldc-table w-full">
                        <thead>
                            <tr>
                                <th>Capability</th>
                                <th>Self</th>
                                <th>Manager</th>
                                <th>Stakeholder(s)</th>
                                <th>Panel (you)</th>
                            </tr>
                        </thead>
                        <tbody>{caps.map(capRow)}</tbody>
                    </table>
                </div>
            </div>

            {/* Per-capability rationales */}
            <div className="ldc-panel">
                <div className="p-4 border-b border-slate-200 ldc-section-title">Panel rationale per capability</div>
                <div className="p-4 space-y-3">
                    {caps.map((cap) => {
                        const i = form.capability_ratings.findIndex(r => r.capability_id === cap.id);
                        const r = form.capability_ratings[i];
                        return (
                            <div key={cap.id} className="border border-slate-200 rounded p-3" data-testid={`panel-rat-${cap.code}`}>
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-semibold">{cap.name} <span className="text-xs font-normal text-slate-500">· {cap.pillar}</span></div>
                                    {!readonly && <AIWriteButton text={r.rationale} onResult={(v) => setCap(i, "rationale", v)} context={`Panel rationale for ${cap.name}`} />}
                                </div>
                                <textarea rows={2} value={r.rationale || ""} onChange={(e) => setCap(i, "rationale", e.target.value)} disabled={readonly} className="w-full mt-2 px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-50" />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Overall */}
            <div className="ldc-panel">
                <div className="p-4 border-b border-slate-200 ldc-section-title">Overall panel call</div>
                <div className="p-4 space-y-3">
                    <label>
                        <div className="ldc-label mb-1">Overall readiness</div>
                        <select value={form.overall_rating} onChange={(e) => setField("overall_rating", e.target.value)} disabled={readonly} data-testid="panel-overall" className="w-full md:w-60 px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-50">
                            {READINESS.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
                        </select>
                    </label>
                    <label className="block">
                        <div className="flex items-center justify-between mb-1">
                            <div className="ldc-label">Overall rationale</div>
                            {!readonly && <AIWriteButton text={form.overall_rationale} onResult={(v) => setField("overall_rationale", v)} context="Panel overall rationale" />}
                        </div>
                        <textarea rows={5} value={form.overall_rationale || ""} onChange={(e) => setField("overall_rationale", e.target.value)} disabled={readonly} data-testid="panel-overall-rationale" className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-50" />
                    </label>
                    <label className="block">
                        <div className="ldc-label mb-1">Discussion notes</div>
                        <textarea rows={3} value={form.discussion_notes || ""} onChange={(e) => setField("discussion_notes", e.target.value)} disabled={readonly} className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-50" />
                    </label>
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
                <SaveIndicator saving={saving} savedAt={savedAt} dirty={dirty} />
                <div className="flex gap-2">
                    {!readonly && (
                        <>
                            <button onClick={() => save()} data-testid="panel-save" className="px-3 py-1.5 text-sm border border-slate-300 rounded">Save draft</button>
                            <button onClick={submit} data-testid="panel-submit" className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 flex items-center gap-1"><CheckCircle size={14} weight="fill" />Submit</button>
                        </>
                    )}
                    {readonly && <StatusBadge status="submitted" />}
                </div>
            </div>

            {docDrawer && <DocDrawer docs={docs.filter(d => d.is_latest)} onClose={() => setDocDrawer(false)} />}
        </div>
    );
}

function Rating({ level, next, small }) {
    if (!level && !next) return <span className="text-xs text-slate-400">—</span>;
    return (
        <div className={`inline-flex flex-col items-start gap-0.5 ${small ? "text-[11px]" : "text-xs"}`}>
            {level && <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-semibold">{level}</span>}
            {next && <span className="text-emerald-700 font-semibold">Next ✓</span>}
        </div>
    );
}

function DocDrawer({ docs, onClose }) {
    const token = localStorage.getItem("ldc_token");
    const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
    return (
        <div className="fixed inset-0 z-40 flex">
            <div className="flex-1 bg-black/30" onClick={onClose}></div>
            <div className="w-full max-w-md bg-white border-l border-slate-200 h-full overflow-auto" data-testid="doc-drawer">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="ldc-section-title">Case documents</div>
                    <button onClick={onClose} className="text-slate-400">✕</button>
                </div>
                <div className="p-4 space-y-2">
                    {docs.length === 0 && <div className="text-sm text-slate-400">No documents yet.</div>}
                    {docs.map((d) => (
                        <a key={d.id} href={`${API}/documents/${d.id}/download?auth=${token}`} target="_blank" rel="noreferrer" className="block border border-slate-200 rounded p-2 hover:bg-slate-50">
                            <div className="text-sm font-semibold">{DOC_TYPE_LABELS[d.doc_type] || d.doc_type}</div>
                            <div className="text-xs text-slate-500">{d.original_filename} · v{d.version} · {humanDate(d.uploaded_at)}</div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}

function AIRender({ type, data }) {
    if (!data) return null;
    if (data.error) return <div className="text-xs text-amber-800">{String(data.raw || data.error)}</div>;
    const bullets = (title, items) => items && items.length ? (
        <div><strong className="block text-xs uppercase tracking-widest text-amber-800 mb-1">{title}</strong><ul className="list-disc pl-4 space-y-0.5">{items.map((it, i) => <li key={i}>{typeof it === "string" ? it : JSON.stringify(it)}</li>)}</ul></div>
    ) : null;
    return (
        <div className="space-y-2 text-sm">
            {data.overall_readiness && <div><strong>Draft overall:</strong> {data.overall_readiness}</div>}
            {data.overall_rationale && <div className="whitespace-pre-line">{data.overall_rationale}</div>}
            {data.integrated_summary && <div className="whitespace-pre-line">{data.integrated_summary}</div>}
            {bullets("Strengths", data.strengths)}
            {bullets("Development areas", data.development_areas)}
            {bullets("Discussion flags", data.discussion_flags?.map(f => typeof f === "string" ? f : `${f.topic} — ${f.explanation}`))}
            {bullets("Bias risks", data.bias_risks?.map(f => `[${f.risk}] ${f.reason}`))}
            {bullets("Gaps", data.gaps?.map(f => `[${f.severity}] ${f.capability}: ${f.reason}`))}
            {bullets("Rating mismatches", data.rating_mismatches?.map(f => `${f.capability} — self ${f.self} · mgr ${f.manager} · panel ${f.panel}`))}
            {bullets("Per capability draft", data.per_capability?.map(p => `${p.capability_name}: ${p.rating} — ${p.rationale}`))}
        </div>
    );
}
