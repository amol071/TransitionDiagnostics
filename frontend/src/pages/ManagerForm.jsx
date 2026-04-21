import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import AIPanel from "@/components/AIPanel";
import { AIWriteButton, CaseAIBar, useAutoSave, SaveIndicator } from "@/components/AIHelpers";
import { Plus, Trash, CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

const LEVELS = ["", "Below", "At", "Exceeds"];
const READINESS = [
    { v: "", l: "Select…" },
    { v: "strong", l: "Ready — strong" },
    { v: "moderate", l: "Ready — moderate" },
    { v: "weak", l: "Not yet ready" },
];

export default function ManagerForm() {
    const { caseId } = useParams();
    const [c, setC] = useState(null);
    const [caps, setCaps] = useState([]);
    const [form, setForm] = useState(null);
    const [aiSuggestions, setAiSuggestions] = useState(null);

    useEffect(() => {
        Promise.all([
            api.get(`/cases/${caseId}`).then(r => r.data),
            api.get(`/capabilities`).then(r => r.data),
            api.get(`/cases/${caseId}/manager-form`).then(r => r.data),
        ]).then(([cd, capd, fd]) => {
            setC(cd); setCaps(capd);
            const existing = new Map((fd.capability_responses || []).map(r => [r.capability_id, r]));
            fd.capability_responses = capd.map(cap => existing.get(cap.id) || {
                capability_id: cap.id, current_level: "", current_rationale: "", demonstrated_next: false, rationale: ""
            });
            if (!fd.stakeholders || fd.stakeholders.length < 3) {
                const arr = [...(fd.stakeholders || [])];
                while (arr.length < 3) arr.push({ name: "", email: "", relationship: "" });
                fd.stakeholders = arr;
            }
            setForm(fd);
        });
    }, [caseId]);

    const save = async (overrideStatus) => {
        const payload = { ...form, status: overrideStatus || form.status || "draft" };
        const { data } = await api.put(`/cases/${caseId}/manager-form`, payload);
        setForm({
            ...data,
            capability_responses: caps.map(cap => {
                const ex = (data.capability_responses || []).find(r => r.capability_id === cap.id);
                return ex || { capability_id: cap.id, current_level: "", current_rationale: "", demonstrated_next: false, rationale: "" };
            }),
            stakeholders: data.stakeholders || [],
        });
    };

    const { saving, savedAt, mark, dirty } = useAutoSave(async () => { if (form && form.status !== "submitted") await save(); }, 1800);

    if (!form || !c) return <div className="p-8 text-sm text-slate-400">Loading…</div>;
    const readonly = form.status === "submitted";

    const setField = (k, v) => { setForm({ ...form, [k]: v }); mark(); };
    const setCap = (i, k, v) => { const arr = [...form.capability_responses]; arr[i] = { ...arr[i], [k]: v }; setForm({ ...form, capability_responses: arr }); mark(); };
    const setStk = (i, k, v) => { const arr = [...form.stakeholders]; arr[i] = { ...arr[i], [k]: v }; setForm({ ...form, stakeholders: arr }); mark(); };
    const addStk = () => { setForm({ ...form, stakeholders: [...form.stakeholders, { name:"", email:"", relationship:"" }] }); mark(); };
    const delStk = (i) => { setForm({ ...form, stakeholders: form.stakeholders.filter((_, j) => j !== i) }); mark(); };

    const submit = async () => {
        if (!form.overall_rationale?.trim()) { toast.error("Overall rationale is required"); return; }
        if (!form.readiness) { toast.error("Readiness call is required"); return; }
        const missing = form.capability_responses.some(r => r.demonstrated_next && !r.rationale?.trim());
        if (missing) { toast.error("Add rationale for each capability marked demonstrated at next level"); return; }
        if (!window.confirm("Submit manager review? You won't be able to edit after submission unless reopened.")) return;
        await save("submitted");
        toast.success("Manager review submitted");
    };

    return (
        <div className="space-y-5 animate-fade-in" data-testid="mgr-form-page">
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <Link to={`/app/cases/${c.id}`} className="text-xs text-slate-500 hover:text-slate-900">← Back to case</Link>
                    <div className="ldc-label mt-1">{c.employee?.name} · {c.fiscal_year}{c.is_renomination && " · Renomination"}</div>
                    <h1 className="text-2xl font-semibold tracking-tight mt-1">Manager nomination & review</h1>
                </div>
                <div className="flex items-center gap-3">
                    {readonly ? <StatusBadge status="submitted" size="lg" /> : <SaveIndicator saving={saving} savedAt={savedAt} dirty={dirty} />}
                </div>
            </div>

            <div className="ldc-panel p-4">
                <div className="ldc-label mb-2">AI assistants</div>
                <CaseAIBar caseId={c.id} types={["stakeholder_suggest", "integrated_summary"]} onResult={(t, a) => setAiSuggestions({ type: t, data: a })} />
                {aiSuggestions?.type === "stakeholder_suggest" && (
                    <AIPanel title="AI stakeholder suggestions" testid="ai-stk-suggest">
                        <ul className="list-disc pl-4 space-y-1">
                            {(aiSuggestions.data.structured.suggestions || []).map((s, i) => (
                                <li key={i}><strong>{s.role}:</strong> {s.why}</li>
                            ))}
                        </ul>
                    </AIPanel>
                )}
            </div>

            <div className="ldc-panel">
                <div className="p-4 border-b border-slate-200"><div className="ldc-section-title">Next-level capability review</div></div>
                <div className="p-4 space-y-3">
                    {form.capability_responses.map((r, i) => {
                        const cap = caps.find(c => c.id === r.capability_id);
                        if (!cap) return null;
                        return (
                            <div key={cap.id} className={`border rounded ${cap.category === "differentiating" ? "border-amber-200 bg-amber-50/30" : "border-slate-200"}`} data-testid={`mgr-cap-${cap.code}`}>
                                <div className="p-3">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="text-sm font-semibold">{cap.name}</div>
                                            <div className="text-xs text-slate-500">{cap.pillar} · {cap.category === "differentiating" ? "Differentiating" : "Necessary"}</div>
                                        </div>
                                        <label className="flex items-center gap-2 text-xs">
                                            <input type="checkbox" checked={!!r.demonstrated_next} onChange={(e) => setCap(i, "demonstrated_next", e.target.checked)} disabled={readonly} />
                                            Demonstrated at next level
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <label>
                                            <div className="ldc-label mb-1">Current rating</div>
                                            <select value={r.current_level || ""} onChange={(e) => setCap(i, "current_level", e.target.value)} disabled={readonly} className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-50">
                                                {LEVELS.map(l => <option key={l} value={l}>{l || "Select"}</option>)}
                                            </select>
                                        </label>
                                        <label className="col-span-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="ldc-label">Rationale / evidence</div>
                                                {!readonly && <AIWriteButton text={r.rationale} onResult={(v) => setCap(i, "rationale", v)} context={`Manager rationale for ${cap.name}`} />}
                                            </div>
                                            <textarea rows={2} value={r.rationale || ""} onChange={(e) => setCap(i, "rationale", e.target.value)} disabled={readonly} className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-50" />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="ldc-panel">
                <div className="p-4 border-b border-slate-200"><div className="ldc-section-title">Stakeholder identification (minimum 3)</div></div>
                <div className="p-4 space-y-2">
                    <table className="ldc-table w-full">
                        <thead><tr><th>Name</th><th>Email</th><th>Relationship</th><th></th></tr></thead>
                        <tbody>
                            {form.stakeholders.map((s, i) => (
                                <tr key={i}>
                                    <td><input value={s.name} onChange={(e) => setStk(i, "name", e.target.value)} disabled={readonly} data-testid={`stk-name-${i}`} className="w-full px-2 py-1 border border-slate-300 rounded text-sm disabled:bg-slate-50" /></td>
                                    <td><input value={s.email} onChange={(e) => setStk(i, "email", e.target.value)} disabled={readonly} className="w-full px-2 py-1 border border-slate-300 rounded text-sm disabled:bg-slate-50" /></td>
                                    <td><input value={s.relationship} onChange={(e) => setStk(i, "relationship", e.target.value)} disabled={readonly} className="w-full px-2 py-1 border border-slate-300 rounded text-sm disabled:bg-slate-50" /></td>
                                    <td>{!readonly && form.stakeholders.length > 3 && <button onClick={() => delStk(i)} className="text-red-500"><Trash size={14} /></button>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!readonly && <button onClick={addStk} data-testid="add-stakeholder" className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 border border-dashed border-slate-300 rounded hover:bg-slate-50"><Plus size={12} /> Add stakeholder</button>}
                </div>
            </div>

            <div className="ldc-panel">
                <div className="p-4 border-b border-slate-200"><div className="ldc-section-title">Overall assessment</div></div>
                <div className="p-4 space-y-3">
                    <label className="block">
                        <div className="ldc-label mb-1">Readiness call</div>
                        <select value={form.readiness} onChange={(e) => setField("readiness", e.target.value)} disabled={readonly} data-testid="mgr-readiness" className="w-full md:w-60 px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-50">
                            {READINESS.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
                        </select>
                    </label>
                    <label className="block">
                        <div className="flex items-center justify-between mb-1">
                            <div className="ldc-label">Overall rationale</div>
                            {!readonly && <AIWriteButton text={form.overall_rationale} onResult={(v) => setField("overall_rationale", v)} context="Manager overall readiness rationale" />}
                        </div>
                        <textarea rows={5} value={form.overall_rationale || ""} onChange={(e) => setField("overall_rationale", e.target.value)} disabled={readonly} data-testid="mgr-overall-rationale" className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-50" />
                    </label>
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
                <SaveIndicator saving={saving} savedAt={savedAt} dirty={dirty} />
                <div className="flex gap-2">
                    {!readonly && (
                        <>
                            <button onClick={() => save()} data-testid="mgr-save-draft" className="px-3 py-1.5 text-sm border border-slate-300 rounded hover:bg-slate-50">Save draft</button>
                            <button onClick={submit} data-testid="mgr-submit" className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 flex items-center gap-1"><CheckCircle size={14} weight="fill" /> Submit</button>
                        </>
                    )}
                    {readonly && <StatusBadge status="submitted" />}
                </div>
            </div>
        </div>
    );
}
