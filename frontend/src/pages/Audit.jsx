import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { humanDate } from "@/lib/utils-ldc";

export default function Audit() {
    const [logs, setLogs] = useState([]);
    useEffect(() => { api.get("/audit").then(r => setLogs(r.data)); }, []);
    return (
        <div className="space-y-5 animate-fade-in" data-testid="audit-page">
            <div>
                <div className="ldc-label">Governance</div>
                <h1 className="text-2xl font-semibold tracking-tight mt-1">Audit log</h1>
            </div>
            <div className="ldc-panel overflow-hidden">
                <table className="ldc-table w-full">
                    <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Entity</th><th>Case</th><th>Details</th></tr></thead>
                    <tbody>
                        {logs.map(l => (
                            <tr key={l.id}>
                                <td className="text-xs text-slate-500">{humanDate(l.timestamp)} <span className="text-slate-400">{new Date(l.timestamp).toLocaleTimeString()}</span></td>
                                <td>{l.user_name}</td>
                                <td><span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">{l.action}</span></td>
                                <td>{l.entity}</td>
                                <td className="text-xs text-slate-500 font-mono">{l.case_id ? l.case_id.slice(0, 8) : "—"}</td>
                                <td className="text-xs text-slate-500">{l.details ? JSON.stringify(l.details) : ""}</td>
                            </tr>
                        ))}
                        {logs.length === 0 && <tr><td colSpan={6} className="text-center text-slate-400 py-6">No audit entries.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
