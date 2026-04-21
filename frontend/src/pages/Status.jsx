import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import { humanDate } from "@/lib/utils-ldc";
import { DownloadSimple } from "@phosphor-icons/react";

export default function Status() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ fy: "", bu: "", renom: "" });

    useEffect(() => { api.get("/status").then(r => setRows(r.data)).finally(() => setLoading(false)); }, []);

    const filtered = rows.filter(r =>
        (!filters.fy || r.case.fiscal_year === filters.fy) &&
        (!filters.bu || r.employee?.bu === filters.bu) &&
        (!filters.renom || (filters.renom === "yes" ? r.case.is_renomination : !r.case.is_renomination))
    );

    const bus = [...new Set(rows.map(r => r.employee?.bu).filter(Boolean))];
    const fys = [...new Set(rows.map(r => r.case.fiscal_year))];

    const exportCsv = () => {
        const header = ["Employee","EmpID","BU","Level","FY","Type","Status","EmpForm","MgrForm","Stakeholders","Panel","HR","Presentation"];
        const lines = [header.join(",")];
        filtered.forEach(r => {
            lines.push([
                r.employee?.name, r.employee?.emp_id, r.employee?.bu, r.employee?.level,
                r.case.fiscal_year, r.case.is_renomination ? "Renomination" : "Standard",
                r.case.status, r.employee_form, r.manager_form,
                `${r.stakeholder_submitted}`, `${r.panel_submitted}/${r.panel_total}`, r.hr_form,
                r.presentation_uploaded ? "yes" : "no"
            ].map(x => `"${String(x ?? "").replace(/"/g, '""')}"`).join(","));
        });
        const blob = new Blob([lines.join("\n")], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "ldc-status.csv";
        a.click();
    };

    return (
        <div className="space-y-5 animate-fade-in" data-testid="status-page">
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <div className="ldc-label">Cycle overview</div>
                    <h1 className="text-2xl font-semibold tracking-tight mt-1">Status dashboard</h1>
                </div>
                <button onClick={exportCsv} data-testid="export-csv" className="flex items-center gap-1 text-sm font-semibold px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50"><DownloadSimple size={14} /> Export CSV</button>
            </div>

            <div className="flex gap-2 flex-wrap">
                <select value={filters.fy} onChange={(e) => setFilters({ ...filters, fy: e.target.value })} className="px-2 py-1.5 border border-slate-300 rounded text-sm" data-testid="filter-fy">
                    <option value="">All fiscal years</option>
                    {fys.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select value={filters.bu} onChange={(e) => setFilters({ ...filters, bu: e.target.value })} className="px-2 py-1.5 border border-slate-300 rounded text-sm" data-testid="filter-bu">
                    <option value="">All business units</option>
                    {bus.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <select value={filters.renom} onChange={(e) => setFilters({ ...filters, renom: e.target.value })} className="px-2 py-1.5 border border-slate-300 rounded text-sm" data-testid="filter-renom">
                    <option value="">All types</option>
                    <option value="no">Standard</option>
                    <option value="yes">Renomination</option>
                </select>
            </div>

            <div className="ldc-panel overflow-x-auto">
                {loading ? <div className="p-8 text-center text-sm text-slate-400">Loading…</div> : (
                    <table className="ldc-table w-full min-w-[900px]">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>BU/Level</th>
                                <th>Status</th>
                                <th>Employee</th>
                                <th>Manager</th>
                                <th>Stakeholders</th>
                                <th>Panel</th>
                                <th>HR</th>
                                <th>Pres.</th>
                                <th>Updated</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(r => (
                                <tr key={r.case.id} data-testid={`status-row-${r.case.id}`}>
                                    <td>
                                        <div className="font-medium">{r.employee?.name}</div>
                                        <div className="text-xs text-slate-500">{r.employee?.emp_id} · {r.case.fiscal_year}{r.case.is_renomination && " · RENOM"}</div>
                                    </td>
                                    <td className="text-xs">{r.employee?.bu}<br/><span className="text-slate-500">{r.employee?.level}</span></td>
                                    <td><StatusBadge status={r.case.status} /></td>
                                    <td><StatusBadge status={r.employee_form} /></td>
                                    <td><StatusBadge status={r.manager_form} /></td>
                                    <td className="text-xs">{r.stakeholder_submitted}</td>
                                    <td className="text-xs">{r.panel_submitted}/{r.panel_total || 0}</td>
                                    <td><StatusBadge status={r.hr_form} /></td>
                                    <td className="text-xs">{r.presentation_uploaded ? "✓" : "—"}</td>
                                    <td className="text-xs text-slate-500">{humanDate(r.case.updated_at)}</td>
                                    <td className="text-right"><Link to={`/app/cases/${r.case.id}`} className="text-xs font-semibold hover:underline">Open</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
