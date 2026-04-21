import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import { humanDate } from "@/lib/utils-ldc";
import { ArrowRight } from "@phosphor-icons/react";

export default function Cases() {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/cases").then((r) => setCases(r.data)).finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-5 animate-fade-in" data-testid="cases-page">
            <div>
                <div className="ldc-label">My cases</div>
                <h1 className="text-2xl font-semibold tracking-tight mt-1">All cases you can view</h1>
            </div>
            <div className="ldc-panel overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
                ) : cases.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">No cases.</div>
                ) : (
                    <table className="ldc-table w-full">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>BU / Level</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Updated</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {cases.map((c) => (
                                <tr key={c.id}>
                                    <td>
                                        <div className="font-medium">{c.employee?.name}</div>
                                        <div className="text-xs text-slate-500">{c.employee?.emp_id} · {c.fiscal_year}</div>
                                    </td>
                                    <td className="text-sm">{c.employee?.bu}<br/><span className="text-xs text-slate-500">{c.employee?.level}</span></td>
                                    <td>{c.is_renomination ? "Renomination" : "Standard"}</td>
                                    <td><StatusBadge status={c.status} /></td>
                                    <td className="text-xs text-slate-500">{humanDate(c.updated_at)}</td>
                                    <td className="text-right">
                                        <Link to={`/app/cases/${c.id}`} data-testid={`cases-open-${c.id}`} className="text-xs font-semibold text-slate-900 hover:underline inline-flex items-center gap-1">
                                            Open <ArrowRight size={12} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
