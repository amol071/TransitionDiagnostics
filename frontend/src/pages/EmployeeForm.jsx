import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import StatusBadge from "@/components/StatusBadge";
import AIPanel from "@/components/AIPanel";
import { AIWriteButton, useAutoSave, SaveIndicator } from "@/components/AIHelpers";
import { nextLevelFor, currentLevelNumber, capsAtLevel, groupByPillarGcf, findSibling } from "@/lib/gcf";
import { Plus, Trash, CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

const LEVELS = ["", "Below", "Meets", "Exceeds"];

export default function EmployeeForm() {
    const { caseId } = useParams();
    const { user } = useAuth();
    const [c, setC] = useState(null);
    const [allCaps, setAllCaps] = useState([]);
    const [form, setForm] = useState(null);

    useEffect(() => {
        Promise.all([
            api.get(`/cases/${caseId}`).then(r => r.data),
            api.get(`/capabilities`).then(r => r.data),
            api.get(`/cases/${caseId}/employee-form`).then(r => r.data),
        ]).then(([cd, capd, fd]) => {
            setC(cd); setAllCaps(capd);
            const nl = nextLevelFor(cd.employee?.level);
            const levelCaps = capsAtLevel(capd, nl);
            const existing = new Map((fd.capability_responses || []).map(r => [r.capability_id, r]));
            fd.capability_responses = levelCaps.map(cap => existing.get(cap.id) || {
                capability_id: cap.id, current_level: "", current_rationale: "", demonstrated_next: false, rationale: ""
            });
            if (!fd.contributions || fd.contributions.length === 0) {
                fd.contributions = [{ area: "", role: "", impact: "", stakeholders: "" }];
            }
            setForm(fd);
        });
    }, [caseId]);

    const nextLvl = c ? nextLevelFor(c.employee?.level) : 3;
    const currLvl = c ? currentLevelNumber(c.employee?.level) : 2;
    const levelCaps = useMemo(() => capsAtLevel(allCaps, nextLvl), [allCaps, nextLvl]);
    const grouped = useMemo(() => groupByPillarGcf(levelCaps), [levelCaps]);

    const save = async (overrideStatus) => {
        const payload = { ...form, status: overrideStatus || form.status || "draft" };
        const { data } = await api.put(`/cases/${caseId}/employee-form`, payload);
        const existing = new Map((data.capability_responses || []).map(r => [r.capability_id, r]));
        setForm({
            ...data,
            capability_responses: levelCaps.map(cap => existing.get(cap.id) || {
                capability_id: cap.id, current_level: "", current_rationale: "", demonstrated_next: false, rationale: ""
            }),
            contributions: data.contributions || [],
        });
        return data;
    };

    const { saving, savedAt, mark, dirty } = useAutoSave(async () => { if (form && form.status !== "submitted") await save(); }, 1800);

    if (!form || !c) return <div className="p-8 text-sm text-slate-400">Loading…</div>;
    const readonly = form.status === "submitted";

    const setField = (k, v) => { setForm({ ...form, [k]: v }); mark(); };
    const setContrib = (i, k, v) => { const arr = [...form.contributions]; arr[i] = { ...arr[i], [k]: v }; setForm({ ...form, contributions: arr }); mark(); };
    const addContrib = () => { setForm({ ...form, contributions: [...form.contributions, { area:"", role:"", impact:"", stakeholders:"" }] }); mark(); };
    const delContrib = (i) => { const arr = form.contributions.filter((_,j)=>j!==i); setForm({ ...form, contributions: arr }); mark(); };
    const setCap = (i, k, v) => { const arr = [...form.capability_responses]; arr[i] = { ...arr[i], [k]: v }; setForm({ ...form, capability_responses: arr }); mark(); };

    const submit = async () => {
        const missing = form.capability_responses.some(r => r.demonstrated_next && !r.rationale?.trim());
        if (missing) { toast.error("Provide a rationale for each capability marked as demonstrated at next level."); return; }
        if (!window.confirm("Submit employee self-reflection? You won't be able to edit after submission unless reopened.")) return;
        await save("submitted");
        toast.success("Employee self-reflection submitted");
    };

    return (
        <div className="space-y-5 animate-fade-in" data-testid="emp-form-page">
            <Header c={c} title="Employee self-reflection" saving={saving} savedAt={savedAt} dirty={dirty} readonly={readonly} />

            <Section title="Key contributions" subtitle="2–5 initiatives that best demonstrate your readiness">
                <div className="space-y-3">
                    {form.contributions.map((ct, i) => (
                        <div key={i} className="border border-slate-200 rounded p-3 space-y-2" data-testid={`contrib-${i}`}>
                            <div className="flex items-center justify-between">
                                <div className="ldc-label">Contribution {i + 1}</div>
                                {!readonly && form.contributions.length > 1 && (
                                    <button className="text-red-500 hover:text-red-600" onClick={() => delContrib(i)} data-testid={`del-contrib-${i}`}><Trash size={14} /></button>
                                )}
                            </div>
                            <TextInput label="Area / initiative" value={ct.area} onChange={v => setContrib(i, "area", v)} readonly={readonly} tid={`contrib-area-${i}`} />
                            <TextInput label="Role played" value={ct.role} onChange={v => setContrib(i, "role", v)} readonly={readonly} />
                            <TextArea label="Impact created" value={ct.impact} onChange={v => setContrib(i, "impact", v)} readonly={readonly} tid={`contrib-impact-${i}`} ai={!readonly} aiContext="Key contribution impact statement" />
                            <TextInput label="Key stakeholders" value={ct.stakeholders} onChange={v => setContrib(i, "stakeholders", v)} readonly={readonly} />
                        </div>
                    ))}
                    {!readonly && form.contributions.length < 5 && (
                        <button onClick={addContrib} data-testid="add-contrib" className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 border border-dashed border-slate-300 rounded hover:bg-slate-50">
                            <Plus size={12} /> Add contribution
                        </button>
                    )}
                </div>
            </Section>

            <Section title={`Next-level capability reflection (L${nextLvl})`} subtitle={`You are at L${currLvl} and being evaluated against the Godrej Capability Framework at L${nextLvl}. Reflect on where you have already demonstrated each expectation.`}>
                <div className="space-y-6">
                    {grouped.map((p) => (
                        <div key={p.pillar_order} className="space-y-2" data-testid={`pillar-${p.pillar_order}`}>
                            <div className="flex items-baseline gap-2 pt-2">
                                <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Pillar {p.pillar_order}</div>
                                <h3 className="text-lg font-semibold text-slate-900">{p.pillar}</h3>
                            </div>
                            {p.gcfs.map((g) => (
                                <div key={g.gcf_order} className="space-y-2" data-testid={`gcf-${p.pillar_order}-${g.gcf_order}`}>
                                    <div className="flex items-baseline gap-2 pl-1 border-l-2 border-slate-300 pt-1">
                                        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-2">{p.pillar_order}.{g.gcf_order}</div>
                                        <h4 className="text-sm font-semibold text-slate-700">{g.gcf}</h4>
                                    </div>
                                    {g.caps.map((cap) => {
                                        const idx = form.capability_responses.findIndex(r => r.capability_id === cap.id);
                                        const r = idx >= 0 ? form.capability_responses[idx] : null;
                                        if (!r) return null;
                                        const sibling = findSibling(allCaps, cap, currLvl);
                                        return (
                                            <CapabilityRow
                                                key={cap.id}
                                                cap={cap}
                                                sibling={sibling}
                                                currLvl={currLvl}
                                                nextLvl={nextLvl}
                                                r={r}
                                                onChange={(k, v) => setCap(idx, k, v)}
                                                readonly={readonly}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="Overall reflection">
                <TextArea
                    label="Your overall statement"
                    value={form.overall_reflection}
                    onChange={v => setField("overall_reflection", v)}
                    readonly={readonly}
                    tid="overall-reflection"
                    ai={!readonly}
                    aiContext="Employee overall reflection on next-level readiness"
                    rows={5}
                />
            </Section>

            <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                <SaveIndicator saving={saving} savedAt={savedAt} dirty={dirty} />
                <div className="flex items-center gap-2">
                    {!readonly && (
                        <>
                            <button onClick={() => save()} data-testid="save-draft" className="px-3 py-1.5 text-sm border border-slate-300 rounded hover:bg-slate-50">Save draft</button>
                            <button onClick={submit} data-testid="submit-form" className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 flex items-center gap-1">
                                <CheckCircle size={14} weight="fill" /> Submit
                            </button>
                        </>
                    )}
                    {readonly && <StatusBadge status="submitted" />}
                </div>
            </div>
        </div>
    );
}

function Header({ c, title, saving, savedAt, dirty, readonly }) {
    return (
        <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
                <Link to={`/app/cases/${c.id}`} className="text-xs text-slate-500 hover:text-slate-900" data-testid="back-to-case">← Back to case</Link>
                <div className="ldc-label mt-1">{c.employee?.name} · {c.fiscal_year}{c.is_renomination && " · Renomination"}</div>
                <h1 className="text-2xl font-semibold tracking-tight mt-1">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
                {readonly ? <StatusBadge status="submitted" size="lg" /> : <SaveIndicator saving={saving} savedAt={savedAt} dirty={dirty} />}
            </div>
        </div>
    );
}

function Section({ title, subtitle, children }) {
    return (
        <div className="ldc-panel">
            <div className="p-4 border-b border-slate-200">
                <div className="ldc-section-title">{title}</div>
                {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
}

function TextInput({ label, value, onChange, readonly, tid }) {
    return (
        <label className="block">
            <div className="ldc-label mb-1">{label}</div>
            <input
                value={value || ""}
                data-testid={tid}
                onChange={(e) => onChange(e.target.value)}
                disabled={readonly}
                className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-50 disabled:text-slate-500"
            />
        </label>
    );
}

function TextArea({ label, value, onChange, readonly, rows = 3, ai, aiContext, tid }) {
    return (
        <label className="block">
            <div className="flex items-center justify-between mb-1">
                <div className="ldc-label">{label}</div>
                {ai && <AIWriteButton text={value} context={aiContext} onResult={onChange} label="AI improve" testid={tid ? `${tid}-ai` : undefined} />}
            </div>
            <textarea
                value={value || ""}
                data-testid={tid}
                onChange={(e) => onChange(e.target.value)}
                disabled={readonly}
                rows={rows}
                className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-50 disabled:text-slate-500"
            />
        </label>
    );
}

function CapabilityRow({ cap, sibling, currLvl, nextLvl, r, onChange, readonly }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="border rounded border-slate-200 bg-white ml-4" data-testid={`cap-${cap.code}`}>
            <div className="p-3 flex items-start justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="min-w-0 flex-1 pr-2">
                    <div className="text-sm font-medium text-slate-900">{cap.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-mono">{cap.code}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {r.demonstrated_next && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">L{nextLvl} demonstrated</span>
                    )}
                    <span className="text-xs text-slate-400">{expanded ? "−" : "+"}</span>
                </div>
            </div>
            {expanded && (
                <div className="p-3 pt-0 space-y-2 border-t border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-slate-50 rounded border border-slate-200">
                            <div className="font-semibold text-slate-600 mb-0.5">L{currLvl} expectation (current)</div>
                            <div className="text-slate-700">{sibling ? sibling.name : <span className="text-slate-400 italic">No equivalent at L{currLvl}</span>}</div>
                        </div>
                        <div className="p-2 bg-amber-50 rounded border border-amber-200">
                            <div className="font-semibold text-amber-800 mb-0.5">L{nextLvl} expectation (target)</div>
                            <div className="text-slate-800">{cap.name}</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <label className="block col-span-1">
                            <div className="ldc-label mb-1">Current rating</div>
                            <select
                                value={r.current_level || ""}
                                onChange={(e) => onChange("current_level", e.target.value)}
                                disabled={readonly}
                                data-testid={`cap-level-${cap.code}`}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-50"
                            >
                                {LEVELS.map(l => <option key={l} value={l}>{l || "Select"}</option>)}
                            </select>
                        </label>
                        <label className="col-span-2">
                            <div className="ldc-label mb-1">Current-level rationale</div>
                            <textarea
                                value={r.current_rationale || ""}
                                onChange={(e) => onChange("current_rationale", e.target.value)}
                                disabled={readonly}
                                rows={2}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-50"
                            />
                        </label>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={!!r.demonstrated_next}
                            onChange={(e) => onChange("demonstrated_next", e.target.checked)}
                            disabled={readonly}
                            data-testid={`cap-next-${cap.code}`}
                        />
                        I have demonstrated the <strong>L{nextLvl}</strong> expectation for this capability
                    </label>
                    {r.demonstrated_next && (
                        <TextArea
                            label="Evidence & examples for next-level demonstration"
                            value={r.rationale}
                            onChange={(v) => onChange("rationale", v)}
                            readonly={readonly}
                            ai={!readonly}
                            aiContext={`Rationale for L${nextLvl} demonstration of ${cap.name}`}
                            tid={`cap-rationale-${cap.code}`}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
