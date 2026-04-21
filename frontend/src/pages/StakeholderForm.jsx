import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import { AIWriteButton, useAutoSave, SaveIndicator } from "@/components/AIHelpers";
import { CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

const LEVELS = ["", "Below", "At", "Exceeds"];

export default function StakeholderForm() {
    const { caseId } = useParams();
    const [c, setC] = useState(null);
    const [caps, setCaps] = useState([]);
    const [form, setForm] = useState(null);

    useEffect(() => {
        Promise.all([
            api.get(`/cases/${caseId}`).then(r => r.data),
            api.get(`/capabilities`).then(r => r.data),
            api.get(`/cases/${caseId}/stakeholder-feedback/mine`).then(r => r.data),
        ]).then(([cd, capd, fd]) => {
            setC(cd); setCaps(capd);
            const existing = new Map((fd.capability_responses || []).map(r => [r.capability_id, r]));
            fd.capability_responses = capd.map(cap => existing.get(cap.id) || {
                capability_id: cap.id, current_level: "", demonstrated_next: false, rationale: ""
            });
            setForm(fd);
        });
    }, [caseId]);

    const save = async (override) => {
        const payload = { ...form, status: override || form.status || "draft" };
        const { data } = await api.put(`/cases/${caseId}/stakeholder-feedback/mine`, payload);
        setForm({
            ...data,
            capability_responses: caps.map(cap => {
                const ex = (data.capability_responses || []).find(r => r.capability_id === cap.id);
                return ex || { capability_id: cap.id, current_level: "", demonstrated_next: false, rationale: "" };
            }),
        });
    };

    const { saving, savedAt, mark, dirty } = useAutoSave(async () => { if (form && form.status !== "submitted") await save(); }, 1800);

    if (!form || !c) return <div className="p-8 text-sm text-slate-400">Loading…</div>;
    const readonly = form.status === "submitted";

    const setField = (k, v) => { setForm({ ...form, [k]: v }); mark(); };
    const setCap = (i, k, v) => { const arr = [...form.capability_responses]; arr[i] = { ...arr[i], [k]: v }; setForm({ ...form, capability_responses: arr }); mark(); };

    const submit = async () => {
        if (!window.confirm("Submit stakeholder feedback? You cannot edit after submission.")) return;
        await save("submitted");
        toast.success("Feedback submitted");
    };

    return (
        <div className="space-y-5 animate-fade-in" data-testid="stk-form-page">
            <div>
                <Link to={`/app/cases/${c.id}`} className="text-xs text-slate-500 hover:text-slate-900">← Back to case</Link>
                <div className="ldc-label mt-1">{c.employee?.name} · {c.fiscal_year}</div>
                <h1 className="text-2xl font-semibold tracking-tight mt-1">Stakeholder feedback</h1>
            </div>

            <div className="ldc-panel">
                <div className="p-4 border-b border-slate-200"><div className="ldc-section-title">Capability-wise feedback</div></div>
                <div className="p-4 space-y-2">
                    {form.capability_responses.map((r, i) => {
                        const cap = caps.find(c => c.id === r.capability_id);
                        if (!cap) return null;
                        return (
                            <div key={cap.id} className="border border-slate-200 rounded p-3 space-y-2" data-testid={`stk-cap-${cap.code}`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-semibold">{cap.name}</div>
                                        <div className="text-xs text-slate-500">{cap.pillar}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select value={r.current_level || ""} onChange={(e) => setCap(i, "current_level", e.target.value)} disabled={readonly} className="px-2 py-1 border border-slate-300 rounded text-sm disabled:bg-slate-50">
                                            {LEVELS.map(l => <option key={l} value={l}>{l || "Rating"}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <textarea
                                    placeholder="Specific observations / examples"
                                    rows={2}
                                    value={r.rationale || ""}
                                    onChange={(e) => setCap(i, "rationale", e.target.value)}
                                    disabled={readonly}
                                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-50"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="ldc-panel">
                <div className="p-4 border-b border-slate-200"><div className="ldc-section-title">Overall qualitative comments</div></div>
                <div className="p-4">
                    <div className="flex justify-end mb-1">{!readonly && <AIWriteButton text={form.comments} onResult={v => setField("comments", v)} context="Stakeholder qualitative feedback" />}</div>
                    <textarea rows={5} value={form.comments || ""} onChange={(e) => setField("comments", e.target.value)} disabled={readonly} data-testid="stk-comments" className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-50" />
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
                <SaveIndicator saving={saving} savedAt={savedAt} dirty={dirty} />
                <div className="flex gap-2">
                    {!readonly && (
                        <>
                            <button onClick={() => save()} data-testid="stk-save" className="px-3 py-1.5 text-sm border border-slate-300 rounded">Save draft</button>
                            <button onClick={submit} data-testid="stk-submit" className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 flex items-center gap-1"><CheckCircle size={14} weight="fill" />Submit</button>
                        </>
                    )}
                    {readonly && <StatusBadge status="submitted" />}
                </div>
            </div>
        </div>
    );
}
