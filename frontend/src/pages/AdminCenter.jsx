import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { humanDate } from "@/lib/utils-ldc";
import { Shield, ArrowLeft, ArrowClockwise } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function AdminCenter() {
    const { user, hasRole } = useAuth();
    const nav = useNavigate();
    const [users, setUsers] = useState([]);
    const [caps, setCaps] = useState([]);
    const [cases, setCases] = useState([]);
    const [master, setMaster] = useState({ companies: [], functions: [], business_units: [], levels: [] });

    useEffect(() => {
        if (!hasRole("admin")) nav("/app");
        Promise.all([
            api.get("/auth/users").then(r => r.data),
            api.get("/capabilities").then(r => r.data),
            api.get("/cases").then(r => r.data),
            api.get("/master/all").then(r => r.data),
        ]).then(([u, cp, c, m]) => { setUsers(u); setCaps(cp); setCases(c); setMaster(m); });
    }, []);

    const reopen = async (caseId, formType) => {
        if (!window.confirm(`Reopen ${formType} form? This will allow edits again.`)) return;
        await api.post(`/cases/${caseId}/reopen`, { form: formType });
        toast.success("Reopened");
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <header className="h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link to="/" className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"><ArrowLeft size={12} /> Modules</Link>
                    <div className="mx-3 w-px h-5 bg-slate-200"></div>
                    <Shield size={18} weight="bold" className="text-amber-600" />
                    <div className="font-semibold">Admin Center</div>
                </div>
                <Link to="/app" className="text-xs text-slate-500 hover:text-slate-900">Open LDC →</Link>
            </header>
            <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-6" data-testid="admin-center">
                <div>
                    <div className="ldc-label">Governance · Users · Capabilities</div>
                    <h1 className="text-3xl font-semibold tracking-tight mt-1">Platform administration</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="ldc-panel">
                        <div className="p-4 border-b border-slate-200 ldc-section-title">Users & roles ({users.length})</div>
                        <table className="ldc-table w-full">
                            <thead><tr><th>Name</th><th>Email</th><th>Roles</th></tr></thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td>{u.name}</td>
                                        <td className="text-xs text-slate-500">{u.email}</td>
                                        <td>
                                            <div className="flex flex-wrap gap-1">
                                                {u.roles.map(r => <span key={r} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 border border-slate-200">{r}</span>)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="ldc-panel">
                        <div className="p-4 border-b border-slate-200 ldc-section-title">Godrej Capability Framework ({caps.length} competencies across L1–L4)</div>
                        <div className="max-h-96 overflow-auto">
                            <table className="ldc-table w-full">
                                <thead className="sticky top-0 bg-white"><tr><th>Code</th><th>Level</th><th>Pillar</th><th>GCF</th><th>Competency</th></tr></thead>
                                <tbody>
                                    {caps.map(c => (
                                        <tr key={c.id}>
                                            <td className="font-mono text-[11px] whitespace-nowrap">{c.code}</td>
                                            <td><span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 border border-slate-200">L{c.level}</span></td>
                                            <td className="text-xs">{c.pillar}</td>
                                            <td className="text-xs">{c.gcf}</td>
                                            <td className="text-xs">{c.name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="ldc-panel">
                    <div className="p-4 border-b border-slate-200 ldc-section-title">
                        Master data · Godrej reference tables
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                        <MasterList title="Companies" count={master.companies.length} testid="master-companies" rows={master.companies.map(c => ({ key: c.id, a: c.code, b: c.name, c: c.short_name || "" }))} headers={["Code", "Name", "Short"]} />
                        <MasterList title="Functions" count={master.functions.length} testid="master-functions" rows={master.functions.map(f => ({ key: f.id, a: f.code, b: f.name }))} headers={["Code", "Name"]} />
                        <MasterList title="Business units" count={master.business_units.length} testid="master-bus" rows={master.business_units.map(b => ({ key: b.id, a: b.code, b: b.name, c: b.company_code }))} headers={["Code", "Name", "Co."]} />
                        <MasterList title="Levels" count={master.levels.length} testid="master-levels" rows={master.levels.map(l => ({ key: l.id, a: l.code, b: l.name, c: `L${l.ldc_level}` }))} headers={["Code", "Name", "LDC"]} />
                    </div>
                </div>

                <div className="ldc-panel">
                    <div className="p-4 border-b border-slate-200 ldc-section-title">Reopen forms</div>
                    <table className="ldc-table w-full">
                        <thead><tr><th>Case</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {cases.map(c => (
                                <tr key={c.id}>
                                    <td>
                                        <div className="font-medium">{c.employee?.name}</div>
                                        <div className="text-xs text-slate-500">{c.employee?.emp_id} · {c.fiscal_year}</div>
                                    </td>
                                    <td className="text-xs">{c.status}</td>
                                    <td>
                                        <div className="flex flex-wrap gap-1">
                                            {["employee", "manager", "panel", "hr"].map(f => (
                                                <button key={f} onClick={() => reopen(c.id, f)} data-testid={`reopen-${c.id}-${f}`} className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded border border-slate-300 hover:bg-slate-50">
                                                    <ArrowClockwise size={10} /> {f}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}

function MasterList({ title, count, testid, rows, headers }) {
    return (
        <div className="p-4" data-testid={testid}>
            <div className="flex items-baseline justify-between mb-2">
                <div className="text-sm font-semibold text-slate-800">{title}</div>
                <div className="text-[11px] text-slate-400">{count}</div>
            </div>
            <div className="max-h-72 overflow-auto border border-slate-100 rounded">
                <table className="ldc-table w-full">
                    <thead className="sticky top-0 bg-white">
                        <tr>{headers.map((h) => <th key={h} className="text-[10px]">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.key}>
                                <td className="font-mono text-[10px] whitespace-nowrap">{r.a}</td>
                                <td className="text-xs">{r.b}</td>
                                {headers.length > 2 && <td className="text-[11px] text-slate-500">{r.c}</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
