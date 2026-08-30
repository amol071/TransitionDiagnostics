import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import { AIWriteButton, CaseAIBar, useAutoSave, SaveIndicator, AI_LABELS } from "@/components/AIHelpers";
import AIPanel from "@/components/AIPanel";
import BiasCheckPanel from "@/components/BiasCheckPanel";
import { humanDate } from "@/lib/utils-ldc";
import { nextLevelFor, capsAtLevel, groupByPillarGcf } from "@/lib/gcf";
import { CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import ClearFormButton from "@/components/ClearFormButton";

const LEVELS = ["", "Below", "Meets", "Exceeds"];

export default function StakeholderForm() {
    const { caseId } = useParams();
    const [c, setC] = useState(null);
    const [allCaps, setAllCaps] = useState([]);
    const [form, setForm] = useState(null);
    const [analyses, setAnalyses] = useState({});
    const [biasElig, setBiasElig] = useState(null);

    useEffect(() => {
        Promise.all([
            api.get(`/cases/${caseId}`).then(r => r.data),
            api.get(`/capabilities`).then(r => r.data),
            api.get(`/cases/${caseId}/stakeholder-feedback/mine`).then(r => r.data),
            api.get(`/ai/case/${caseId}/latest`).then(r => r.data).catch(() => ({})),
            api.get(`/ai/case/${caseId}/bias-eligibility`).then(r => r.data).catch(() => null),
        ]).then(([cd, capd, fd, lat, elig]) => {
            setC(cd); setAllCaps(capd); setAnalyses(lat || {}); setBiasElig(elig);
            const nl = nextLevelFor(cd.employee?.level);
            const lc = capsAtLevel(capd, nl);
            const existing = new Map((fd.capability_responses || []).map(r => [r.capability_id, r]));
            fd.capability_responses = lc.map(cap => existing.get(cap.id) || {
                capability_id: cap.id, current_level: "", demonstrated_next: false, rationale: ""
            });
            setForm(fd);
        });
    }, [caseId]);

    const nextLvl = c ? nextLevelFor(c.employee?.level) : 3;
    const levelCaps = useMemo(() => capsAtLevel(allCaps, nextLvl), [allCaps, nextLvl]);
    const grouped = useMemo(() => groupByPillarGcf(levelCaps), [levelCaps]);

    const save = async (override) => {
        const payload = { ...form, status: override || form.status || "draft" };
        const { data } = await api.put(`/cases/${caseId}/stakeholder-feedback/mine`, payload);
        const existing = new Map((data.capability_responses || []).map(r => [r.capability_id, r]));
        setForm({
            ...data,
            capability_responses: levelCaps.map(cap => existing.get(cap.id) || {
                capability_id: cap.id, current_level: "", demonstrated_next: false, rationale: ""
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

    const clearForm = async () => {
        const emptyCaps = levelCaps.map((cap) => ({
            capability_id: cap.id, current_level: "", demonstrated_next: false, rationale: "",
        }));
        const next = { ...form, capability_responses: emptyCaps, comments: "" };
        setForm(next);
        try { await api.put(`/cases/${caseId}/stakeholder-feedback/mine`, { ...next, status: "draft" }); toast.success("Form cleared"); }
        catch { toast.error("Could not save cleared form"); }
    };

    return (
        <div className="space-y-5 animate-fade-in" data-testid="stk-form-page">
            <div>
                <Link to={`/app/cases/${c.id}`} className="text-xs text-slate-500 hover:text-slate-900">← Back to case</Link>
                <div className="ldc-label mt-1">{c.employee?.name} · {c.fiscal_year}</div>
                <h1 className="text-2xl font-semibold tracking-tight mt-1">Stakeholder feedback</h1>
            </div>

            <div className="ldc-panel p-4">
                <div className="ldc-label mb-2">AI assistants</div>
                <CaseAIBar
                    caseId={c.id}
                    types={["bias_check"]}
                    onResult={(t, a) => setAnalyses((prev) => ({ ...prev, [t]: a }))}
                    disabledTypes={biasElig && !biasElig.eligible ? { bias_check: biasElig.reason || "Not enough submitted sources" } : {}}
                />
                <div className="text-[11px] text-slate-500 mt-2">Bias check helps you sanity-check your ratings against Self / Manager / Panel already on file.</div>
            </div>

            {analyses.bias_check && (
                <AIPanel title={AI_LABELS.bias_check} subtitle={humanDate(analyses.bias_check.created_at)} testid="ai-bias_check">
                    <BiasCheckPanel data={analyses.bias_check.structured} eligibility={analyses.bias_check.structured?._eligibility} />
                </AIPanel>
            )}

            <div className="ldc-panel">
                <div className="p-4 border-b border-slate-200"><div className="ldc-section-title">Capability-wise feedback · L{nextLvl} framework</div></div>
                <div className="p-4 space-y-5">
                    {grouped.map((p) => (
                        <div key={p.pillar_order} className="space-y-2" data-testid={`stk-pillar-${p.pillar_order}`}>
                            <div className="flex items-baseline gap-2">
                                <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Pillar {p.pillar_order}</div>
                                <h3 className="text-lg font-semibold text-slate-900">{p.pillar}</h3>
                            </div>
                            {p.gcfs.map((g) => (
                                <div key={g.gcf_order} className="space-y-2">
                                    <div className="flex items-baseline gap-2 pl-1 border-l-2 border-slate-300">
                                        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-2">{p.pillar_order}.{g.gcf_order}</div>
                                        <h4 className="text-sm font-semibold text-slate-700">{g.gcf}</h4>
                                    </div>
                                    {g.caps.map((cap) => {
                                        const i = form.capability_responses.findIndex(x => x.capability_id === cap.id);
                                        const r = i >= 0 ? form.capability_responses[i] : null;
                                        if (!r) return null;
                                        return (
                                            <div key={cap.id} className="border border-slate-200 rounded p-3 space-y-2 ml-4 bg-white" data-testid={`stk-cap-${cap.code}`}>
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium">{cap.name}</div>
                                                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{cap.code}</div>
                                                    </div>
                                                    <select value={r.current_level || ""} onChange={(e) => setCap(i, "current_level", e.target.value)} disabled={readonly} className="px-2 py-1 border border-slate-300 rounded text-sm disabled:bg-slate-50">
                                                        {LEVELS.map(l => <option key={l} value={l}>{l || "Rating"}</option>)}
                                                    </select>
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
                            ))}
                        </div>
                    ))}
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
                            <ClearFormButton onClear={clearForm} testid="stk-clear-btn" />
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
