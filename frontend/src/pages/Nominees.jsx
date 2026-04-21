import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import { humanDate } from "@/lib/utils-ldc";
import { useAuth } from "@/lib/auth";
import { Plus, Play, RocketLaunch, MagnifyingGlass } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Combobox, MultiCombobox } from "@/components/Combobox";

export default function Nominees() {
    const { hasRole } = useAuth();
    const [cases, setCases] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [users, setUsers] = useState([]);
    const [master, setMaster] = useState({ companies: [], functions: [], business_units: [], levels: [] });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [showAddEmp, setShowAddEmp] = useState(false);

    const reload = async () => {
        setLoading(true);
        const [c, e, u, m] = await Promise.all([
            api.get("/cases").then(r => r.data),
            api.get("/employees").then(r => r.data),
            api.get("/auth/users").then(r => r.data),
            api.get("/master/all").then(r => r.data),
        ]);
        setCases(c); setEmployees(e); setUsers(u); setMaster(m);
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
                    <div className="flex items-center gap-2">
                        <button
                            data-testid="add-employee-btn"
                            onClick={() => setShowAddEmp(true)}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-sm font-semibold rounded hover:bg-slate-50"
                        >
                            <Plus size={16} weight="bold" /> Add employee
                        </button>
                        <button
                            data-testid="add-nominee-btn"
                            onClick={() => setShowAdd(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded hover:bg-slate-800"
                        >
                            <Plus size={16} weight="bold" /> Add nominee
                        </button>
                    </div>
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
            {showAddEmp && <AddEmployeeDialog onClose={() => setShowAddEmp(false)} onSaved={reload} master={master} />}
        </div>
    );
}

function AddEmployeeDialog({ onClose, onSaved, master }) {
    const [form, setForm] = useState({
        emp_id: "",
        emp_code: "",
        name: "",
        email: "",
        company_id: "",
        bu_id: "",
        function_id: "",
        level_id: "",
    });

    const filteredBUs = master.business_units.filter((b) => !form.company_id || b.company_id === form.company_id);

    const submit = async () => {
        if (!form.name.trim() || !form.email.trim() || !form.emp_id.trim()) {
            toast.error("Name, email and employee ID are required");
            return;
        }
        if (!form.company_id || !form.bu_id || !form.function_id || !form.level_id) {
            toast.error("Select Company, BU, Function and Level");
            return;
        }
        try {
            const payload = { ...form, emp_code: form.emp_code || form.emp_id };
            await api.post("/employees", payload);
            toast.success("Employee added");
            onSaved();
            onClose();
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Failed");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" role="dialog">
            <div className="bg-white rounded-md border border-slate-200 shadow-lg w-full max-w-lg" data-testid="add-employee-dialog">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="ldc-section-title">Add employee</div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-900" data-testid="close-add-employee">✕</button>
                </div>
                <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Employee ID">
                            <input value={form.emp_id} onChange={(e) => setForm({ ...form, emp_id: e.target.value })} data-testid="add-emp-id" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
                        </Field>
                        <Field label="Employee code">
                            <input value={form.emp_code} onChange={(e) => setForm({ ...form, emp_code: e.target.value })} data-testid="add-emp-code" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" placeholder="Optional · defaults to ID" />
                        </Field>
                    </div>
                    <Field label="Full name">
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="add-emp-name" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
                    </Field>
                    <Field label="Email">
                        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="add-emp-email" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
                    </Field>
                    <Field label="Company">
                        <Combobox
                            testid="add-emp-company"
                            value={form.company_id}
                            onChange={(v) => setForm({ ...form, company_id: v, bu_id: "" })}
                            options={master.companies.map((c) => ({ id: c.id, label: c.name, sub: c.code }))}
                            placeholder="Search companies…"
                        />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Business unit">
                            <Combobox
                                testid="add-emp-bu"
                                value={form.bu_id}
                                onChange={(v) => setForm({ ...form, bu_id: v })}
                                options={filteredBUs.map((b) => ({ id: b.id, label: b.name, sub: b.code }))}
                                placeholder={form.company_id ? "Search business units…" : "Select company first"}
                                disabled={!form.company_id}
                            />
                        </Field>
                        <Field label="Function">
                            <Combobox
                                testid="add-emp-function"
                                value={form.function_id}
                                onChange={(v) => setForm({ ...form, function_id: v })}
                                options={master.functions.map((f) => ({ id: f.id, label: f.name, sub: f.code }))}
                                placeholder="Search functions…"
                            />
                        </Field>
                    </div>
                    <Field label="Level / Band">
                        <Combobox
                            testid="add-emp-level"
                            value={form.level_id}
                            onChange={(v) => setForm({ ...form, level_id: v })}
                            options={master.levels.map((l) => ({ id: l.id, label: `${l.code} · ${l.name}`, sub: `LDC L${l.ldc_level}` }))}
                            placeholder="Search levels…"
                        />
                    </Field>
                </div>
                <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-1.5 text-sm border border-slate-300 rounded">Cancel</button>
                    <button onClick={submit} data-testid="submit-add-employee" className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded hover:bg-slate-800">Create employee</button>
                </div>
            </div>
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
                        <Combobox
                            testid="add-nom-employee"
                            value={form.employee_id}
                            onChange={(v) => setForm({ ...form, employee_id: v })}
                            options={available.map((e) => ({ id: e.id, label: `${e.name} (${e.emp_id})`, sub: `${e.bu} · ${e.function} · ${e.level}` }))}
                            placeholder={available.length === 0 ? "No available employees" : "Search employees…"}
                        />
                    </Field>
                    <Field label="Fiscal year">
                        <input value={form.fiscal_year} onChange={(e) => setForm({ ...form, fiscal_year: e.target.value })} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" data-testid="add-nom-fy" />
                    </Field>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.is_renomination} onChange={(e) => setForm({ ...form, is_renomination: e.target.checked })} data-testid="add-nom-renom" />
                        Renomination (use historical data alongside current)
                    </label>
                    <Field label="Manager">
                        <Combobox
                            testid="add-nom-manager"
                            value={form.assigned_manager_id}
                            onChange={(v) => setForm({ ...form, assigned_manager_id: v })}
                            options={mgrs.map((u) => ({ id: u.id, label: u.name, sub: u.email }))}
                            placeholder="Search managers…"
                        />
                    </Field>
                    <Field label="HR / HRBP">
                        <Combobox
                            testid="add-nom-hr"
                            value={form.assigned_hr_id}
                            onChange={(v) => setForm({ ...form, assigned_hr_id: v, assigned_hrbp_id: v })}
                            options={hrbps.map((u) => ({ id: u.id, label: u.name, sub: u.email }))}
                            placeholder="Search HR…"
                        />
                    </Field>
                    <Field label="Panel members (multi-select)">
                        <MultiCombobox
                            testid="add-nom-panels"
                            values={form.assigned_panel_ids}
                            onChange={(arr) => setForm({ ...form, assigned_panel_ids: arr })}
                            options={panels.map((u) => ({ id: u.id, label: u.name, sub: u.email }))}
                            placeholder="Type to add panel members…"
                        />
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
