import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import { humanDate } from "@/lib/utils-ldc";
import { useAuth } from "@/lib/auth";
import { Plus, Play, RocketLaunch, MagnifyingGlass } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function Nominees() {
    const { hasRole } = useAuth();
    const [cases, setCases] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showAdd, setShowAdd] = useState(false);

    const reload = async () => {
        setLoading(true);
        const [c, e, u] = await Promise.all([
            api.get("/cases").then(r => r.data),
            api.get("/employees").then(r => r.data),
            api.get("/auth/users").then(r => r.data),
        ]);
        setCases(c); setEmployees(e); setUsers(u);
        setLoading(false);
    };

    useEffect(() => { reload(); }, []);

    const launch = async (id, stage) => {
        await api.post(`/cases/${id}/launch`, { stage });
        toast.success(`Case ${stage === "panel" ? "panel" : ""} launched`);
        reload();
    };

    const filtered = cases.filter(c =>
        !search ||
        c.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.employee?.emp_id?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-5 animate-fade-in" data-testid="nominees-page">
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <div className="ldc-label">Nominee administration</div>
                    <h1 className="text-2xl font-semibold tracking-tight mt-1">Nominees & cases</h1>
                </div>
                {hasRole("admin", "coordinator") && (
                    <button
                        data-testid="add-nominee-btn"
                        onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded hover:bg-slate-800"
                    >
                        <Plus size={16} weight="bold" /> Add nominee
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-xs">
                    <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        data-testid="nominee-search"
                        placeholder="Search by name or employee ID"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-sm"
                    />
                </div>
            </div>

            <div className="ldc-panel overflow-hidden">
                {loading ? <div className="p-8 text-center text-sm text-slate-400">Loading…</div> : (
                    <table className="ldc-table w-full">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>BU / Function</th>
                                <th>Fiscal year</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Updated</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c) => (
                                <tr key={c.id} data-testid={`nominee-row-${c.id}`}>
                                    <td>
                                        <div className="font-medium">{c.employee?.name}</div>
                                        <div className="text-xs text-slate-500">{c.employee?.emp_id}</div>
                                    </td>
                                    <td className="text-sm">{c.employee?.bu}<br/><span className="text-xs text-slate-500">{c.employee?.function} · {c.employee?.level}</span></td>
                                    <td>{c.fiscal_year}</td>
                                    <td>
                                        {c.is_renomination ? (
                                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200">Renomination</span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">Standard</span>
                                        )}
                                    </td>
                                    <td><StatusBadge status={c.status} /></td>
                                    <td className="text-xs text-slate-500">{humanDate(c.updated_at)}</td>
                                    <td className="text-right">
                                        <div className="flex items-center gap-1 justify-end flex-wrap">
                                            {hasRole("admin", "coordinator") && !c.is_launched && (
                                                <button
                                                    data-testid={`launch-case-${c.id}`}
                                                    onClick={() => launch(c.id, "case")}
                                                    className="text-xs px-2 py-1 rounded border border-slate-300 hover:bg-slate-50 flex items-center gap-1"
                                                >
                                                    <Play size={12} /> Launch
                                                </button>
                                            )}
                                            {hasRole("admin", "coordinator") && c.is_launched && !c.is_panel_launched && (
                                                <button
                                                    data-testid={`launch-panel-${c.id}`}
                                                    onClick={() => launch(c.id, "panel")}
                                                    className="text-xs px-2 py-1 rounded border border-slate-300 hover:bg-slate-50 flex items-center gap-1"
                                                >
                                                    <RocketLaunch size={12} /> Launch panel
                                                </button>
                                            )}
                                            <Link
                                                to={`/app/cases/${c.id}`}
                                                data-testid={`open-nominee-${c.id}`}
                                                className="text-xs px-2 py-1 rounded bg-slate-900 text-white hover:bg-slate-800"
                                            >
                                                Open
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showAdd && <AddNomineeDialog onClose={() => setShowAdd(false)} onSaved={reload} employees={employees} users={users} existing={cases} />}
        </div>
    );
}

function AddNomineeDialog({ onClose, onSaved, employees, users, existing }) {
    const existingEmps = new Set(existing.map((c) => c.employee_id));
    const available = employees.filter((e) => !existingEmps.has(e.id));
    const mgrs = users.filter((u) => u.roles.includes("manager"));
    const panels = users.filter((u) => u.roles.includes("panel"));
    const hrbps = users.filter((u) => u.roles.includes("hr") || u.roles.includes("hrbp"));

    const [form, setForm] = useState({
        employee_id: available[0]?.id || "",
        fiscal_year: "FY26",
        is_renomination: false,
        assigned_manager_id: mgrs[0]?.id || "",
        assigned_hrbp_id: hrbps[0]?.id || "",
        assigned_hr_id: hrbps[0]?.id || "",
        assigned_panel_ids: panels.slice(0, 2).map((p) => p.id),
    });

    const submit = async () => {
        try {
            await api.post("/cases", form);
            toast.success("Nominee added");
            onSaved();
            onClose();
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Failed");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" role="dialog">
            <div className="bg-white rounded-md border border-slate-200 shadow-lg w-full max-w-lg" data-testid="add-nominee-dialog">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="ldc-section-title">Add nominee</div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-900" data-testid="close-add-nominee">✕</button>
                </div>
                <div className="p-4 space-y-3">
                    <Field label="Employee">
                        <select value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" data-testid="add-nom-employee">
                            {available.length === 0 && <option value="">No available employees</option>}
                            {available.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.emp_id})</option>)}
                        </select>
                    </Field>
                    <Field label="Fiscal year">
                        <input value={form.fiscal_year} onChange={(e) => setForm({ ...form, fiscal_year: e.target.value })} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" data-testid="add-nom-fy" />
                    </Field>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.is_renomination} onChange={(e) => setForm({ ...form, is_renomination: e.target.checked })} data-testid="add-nom-renom" />
                        Renomination (use historical data alongside current)
                    </label>
                    <Field label="Manager">
                        <select value={form.assigned_manager_id} onChange={(e) => setForm({ ...form, assigned_manager_id: e.target.value })} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
                            {mgrs.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </Field>
                    <Field label="HR / HRBP">
                        <select value={form.assigned_hr_id} onChange={(e) => setForm({ ...form, assigned_hr_id: e.target.value, assigned_hrbp_id: e.target.value })} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
                            {hrbps.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </Field>
                    <Field label="Panel members">
                        <div className="space-y-1">
                            {panels.map((p) => (
                                <label key={p.id} className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={form.assigned_panel_ids.includes(p.id)}
                                        onChange={(e) => {
                                            const next = e.target.checked
                                                ? [...form.assigned_panel_ids, p.id]
                                                : form.assigned_panel_ids.filter((x) => x !== p.id);
                                            setForm({ ...form, assigned_panel_ids: next });
                                        }}
                                    />
                                    {p.name}
                                </label>
                            ))}
                        </div>
                    </Field>
                </div>
                <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-1.5 text-sm border border-slate-300 rounded">Cancel</button>
                    <button onClick={submit} data-testid="submit-add-nominee" className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded hover:bg-slate-800">Create</button>
                </div>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <div className="ldc-label mb-1">{label}</div>
            {children}
        </div>
    );
}
