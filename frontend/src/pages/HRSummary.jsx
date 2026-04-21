import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import AIPanel from "@/components/AIPanel";
import { AIWriteButton, CaseAIBar, useAutoSave, SaveIndicator, AI_LABELS } from "@/components/AIHelpers";
import { humanDate } from "@/lib/utils-ldc";
import { CheckCircle, Sparkle, Plus, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import ClearFormButton from "@/components/ClearFormButton";

const READINESS = [{ v: "", l: "Select…" }, { v: "strong", l: "Strong" }, { v: "moderate", l: "Moderate" }, { v: "weak", l: "Weak" }];

export default function HRSummary() {
    const { caseId } = useParams();
    const [c, setC] = useState(null);
    const [form, setForm] = useState(null);
    const [analyses, setAnalyses] = useState({});
    const [panelReviews, setPanelReviews] = useState([]);
    const [mgrForm, setMgrForm] = useState(null);

    const reload = async () => {
        const [cd, hr, pr, mgr, lat] = await Promise.all([
            api.get(`/cases/${caseId}`).then(r => r.data),
            api.get(`/cases/${caseId}/hr-review`).then(r => r.data),
            api.get(`/cases/${caseId}/panel-reviews`).then(r => r.data),
            api.get(`/cases/${caseId}/manager-form`).then(r => r.data),
            api.get(`/ai/case/${caseId}/latest`).then(r => r.data),
        ]);
        setC(cd);
        if (!hr.strengths || hr.strengths.length === 0) hr.strengths = [""];
        if (!hr.improvements || hr.improvements.length === 0) hr.improvements = [""];
        setForm(hr);
        setPanelReviews(pr);
        setMgrForm(mgr);
        setAnalyses(lat);
    };
    useEffect(() => { reload(); }, [caseId]);

    const save = async (override) => {
        const payload = { ...form, status: override || form.status || "draft" };
        // clean empty strings
        payload.strengths = payload.strengths.filter(x => x?.trim());
        payload.improvements = payload.improvements.filter(x => x?.trim());
        const { data } = await api.put(`/cases/${caseId}/hr-review`, payload);
        if (!data.strengths || data.strengths.length === 0) data.strengths = [""];
        if (!data.improvements || data.improvements.length === 0) data.improvements = [""];
        setForm(data);
    };

    const { saving, savedAt, mark, dirty } = useAutoSave(async () => { if (form && form.status !== "submitted") await save(); }, 1800);

    if (!form || !c) return <div className="p-8 text-sm text-slate-400">Loading…</div>;
    const readonly = form.status === "submitted";

    const setField = (k, v) => { setForm({ ...form, [k]: v }); mark(); };
    const setList = (k, i, v) => { const arr = [...form[k]]; arr[i] = v; setForm({ ...form, [k]: arr }); mark(); };
    const addList = (k) => { setForm({ ...form, [k]: [...form[k], ""] }); mark(); };
    const delList = (k, i) => { setForm({ ...form, [k]: form[k].filter((_, j) => j !== i) }); mark(); };

    const applyHRDraft = () => {
        const a = analyses.hr_draft?.structured;
        if (!a) { toast.message("Generate HR draft first"); return; }
        const next = { ...form };
        if (a.overall_summary) next.overall_summary = a.overall_summary;
        if (Array.isArray(a.strengths)) next.strengths = a.strengths.length ? a.strengths : [""];
        if (Array.isArray(a.improvements)) next.improvements = a.improvements.length ? a.improvements : [""];
        if (a.additional_feedback) next.additional_feedback = a.additional_feedback;
        if (a.development_plan) next.development_plan = a.development_plan;
        if (a.readiness) next.readiness = a.readiness;
        setForm(next); mark();
        toast.success("HR draft applied — review before submit");
    };

    const submit = async () => {
        if (!form.overall_summary?.trim()) { toast.error("Overall summary required"); return; }
        if (!form.readiness) { toast.error("Readiness required"); return; }
        if (!window.confirm("Submit final HR summary? The case will be closed.")) return;
        await save("submitted");
        toast.success("HR summary finalized");
    };

    const clearForm = async () => {
        const next = {
            ...form,
            strengths: [""],
            improvements: [""],
            overall_summary: "",
            additional_feedback: "",
            development_plan: "",
            readiness: "",
        };
        setForm(next);
        try { await api.put(`/cases/${caseId}/hr-review`, { ...next, status: "draft", strengths: [], improvements: [] }); toast.success("Form cleared"); }
        catch { toast.error("Could not save cleared form"); }
    };

    return (
        <div className="space-y-5 animate-fade-in" data-testid="hr-summary-page">
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <Link to={`/app/cases/${c.id}`} className="text-xs text-slate-500 hover:text-slate-900">← Back to case</Link>
                    <div className="ldc-label mt-1">{c.employee?.name} · {c.fiscal_year}</div>
                    <h1 className="text-2xl font-semibold tracking-tight mt-1">HR final summary report</h1>
                </div>
                <div>{readonly ? <StatusBadge status="submitted" size="lg" /> : <SaveIndicator saving={saving} savedAt={savedAt} dirty={dirty} />}</div>
            </div>

            <div className="ldc-panel p-4">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <div className="ldc-label">AI drafts</div>
                    <button onClick={applyHRDraft} data-testid="apply-hr-draft" className="text-xs font-semibold px-3 py-1.5 rounded bg-amber-500 text-white hover:bg-amber-600 flex items-center gap-1"><Sparkle size={12} weight="fill" /> Apply HR draft</button>
                </div>
                <CaseAIBar caseId={c.id} types={["hr_draft", "development_plan", "integrated_summary", "bias_check"]} onResult={(t, a) => setAnalyses({ ...analyses, [t]: a })} />
            </div>

            {["hr_draft", "integrated_summary", "bias_check", "development_plan"].map(t => analyses[t] && (
                <AIPanel key={t} title={AI_LABELS[t] || t} subtitle={humanDate(analyses[t].created_at)} testid={`ai-${t}`}>
                    <HRAIView t={t} data={analyses[t].structured} />
                </AIPanel>
            ))}

            <div className="ldc-panel">
                <div className="p-4 border-b border-slate-200 ldc-section-title">Panel & manager context</div>
                <div className="p-4 grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <div className="ldc-label mb-1">Manager readiness call</div>
                        <div>{mgrForm?.readiness || "—"}</div>
                        <div className="text-xs text-slate-500 mt-1 whitespace-pre-line">{mgrForm?.overall_rationale || ""}</div>
                    </div>
                    <div>
                        <div className="ldc-label mb-1">Panel submissions ({panelReviews.length})</div>
                        <ul className="space-y-1">
                            {panelReviews.map(p => (
                                <li key={p.id}><strong>{p.overall_rating || "—"}</strong>: {p.overall_rationale?.slice(0, 120) || "—"}{p.overall_rationale && p.overall_rationale.length > 120 ? "…" : ""}</li>
                            ))}
                            {panelReviews.length === 0 && <li className="text-slate-400">No panel inputs yet.</li>}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="ldc-panel">
                <div className="p-4 border-b border-slate-200 ldc-section-title">Strengths</div>
                <div className="p-4 space-y-2">
                    {form.strengths.map((s, i) => (
                        <div key={i} className="flex items-start gap-2" data-testid={`hr-strength-${i}`}>
                            <textarea rows={2} value={s} onChange={(e) => setList("strengths", i, e.target.value)} disabled={readonly} className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-50" />
                            {!readonly && <AIWriteButton text={s} onResult={(v) => setList("strengths", i, v)} context="HR-language strength" />}
                            {!readonly && form.strengths.length > 1 && <button onClick={() => delList("strengths", i)} className="text-red-500"><Trash size={14} /></button>}
                        </div>
                    ))}
                    {!readonly && <button onClick={() => addList("strengths")} data-testid="add-strength" className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 border border-dashed border-slate-300 rounded hover:bg-slate-50"><Plus size={12} /> Add strength</button>}
                </div>
            </div>

            <div className="ldc-panel">
                <div className="p-4 border-b border-slate-200 ldc-section-title">Opportunities for improvement</div>
                <div className="p-4 space-y-2">
                    {form.improvements.map((s, i) => (
                        <div key={i} className="flex items-start gap-2" data-testid={`hr-improvement-${i}`}>
                            <textarea rows={2} value={s} onChange={(e) => setList("improvements", i, e.target.value)} disabled={readonly} className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-50" />
                            {!readonly && <AIWriteButton text={s} onResult={(v) => setList("improvements", i, v)} context="HR-language development area" />}
                            {!readonly && form.improvements.length > 1 && <button onClick={() => delList("improvements", i)} className="text-red-500"><Trash size={14} /></button>}
                        </div>
                    ))}
                    {!readonly && <button onClick={() => addList("improvements")} data-testid="add-improvement" className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 border border-dashed border-slate-300 rounded hover:bg-slate-50"><Plus size={12} /> Add improvement</button>}
                </div>
            </div>

            <div className="ldc-panel">
                <div className="p-4 border-b border-slate-200 ldc-section-title">Overall summary & recommendations</div>
                <div className="p-4 space-y-3">
                    <label className="block">
                        <div className="flex items-center justify-between mb-1">
                            <div className="ldc-label">Overall summary (employee-facing)</div>
                            {!readonly && <AIWriteButton text={form.overall_summary} onResult={v => setField("overall_summary", v)} context="HR overall summary" />}
                        </div>
                        <textarea rows={5} value={form.overall_summary || ""} onChange={(e) => setField("overall_summary", e.target.value)} disabled={readonly} data-testid="hr-overall" className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-50" />
                    </label>
                    <label className="block">
                        <div className="flex items-center justify-between mb-1">
                            <div className="ldc-label">Development plan</div>
                            {!readonly && <AIWriteButton text={form.development_plan} onResult={v => setField("development_plan", v)} context="Development plan" />}
                        </div>
                        <textarea rows={4} value={form.development_plan || ""} onChange={(e) => setField("development_plan", e.target.value)} disabled={readonly} className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-50" />
                    </label>
                    <label className="block">
                        <div className="ldc-label mb-1">Additional feedback</div>
                        <textarea rows={3} value={form.additional_feedback || ""} onChange={(e) => setField("additional_feedback", e.target.value)} disabled={readonly} className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-50" />
                    </label>
                    <label>
                        <div className="ldc-label mb-1">Final readiness</div>
                        <select value={form.readiness || ""} onChange={(e) => setField("readiness", e.target.value)} disabled={readonly} data-testid="hr-readiness" className="w-full md:w-60 px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-50">
                            {READINESS.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
                        </select>
                    </label>
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
                <SaveIndicator saving={saving} savedAt={savedAt} dirty={dirty} />
                <div className="flex gap-2">
                    {!readonly && (
                        <>
                            <ClearFormButton onClear={clearForm} testid="hr-clear-btn" />
                            <button onClick={() => save()} data-testid="hr-save" className="px-3 py-1.5 text-sm border border-slate-300 rounded">Save draft</button>
                            <button onClick={submit} data-testid="hr-submit" className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 flex items-center gap-1"><CheckCircle size={14} weight="fill" />Finalize</button>
                        </>
                    )}
                    {readonly && <StatusBadge status="closed" />}
                </div>
            </div>
        </div>
    );
}

function HRAIView({ t, data }) {
    if (!data) return null;
    if (data.error) return <div className="text-xs text-amber-800">{String(data.raw || data.error)}</div>;
    const bullets = (title, items) => items && items.length ? (
        <div><strong className="block text-xs uppercase tracking-widest text-amber-800 mb-1">{title}</strong><ul className="list-disc pl-4 space-y-0.5">{items.map((it, i) => <li key={i}>{typeof it === "string" ? it : JSON.stringify(it)}</li>)}</ul></div>
    ) : null;
    return (
        <div className="space-y-2 text-sm">
            {data.overall_summary && <div className="whitespace-pre-line">{data.overall_summary}</div>}
            {data.integrated_summary && <div className="whitespace-pre-line">{data.integrated_summary}</div>}
            {bullets("Strengths", data.strengths)}
            {bullets("Improvements", data.improvements)}
            {data.development_plan && <div><strong>Development plan:</strong><div className="whitespace-pre-line">{data.development_plan}</div></div>}
            {bullets("Actions", data.actions?.map(a => `[${a.timeframe}] ${a.area}: ${a.action}`))}
            {bullets("Learning resources", data.learning_resources)}
            {bullets("Discussion flags", data.discussion_flags?.map(f => typeof f === "string" ? f : `${f.topic} — ${f.explanation}`))}
        </div>
    );
}
