import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import StatusBadge from "@/components/StatusBadge";
import AIPanel from "@/components/AIPanel";
import { humanDate } from "@/lib/utils-ldc";
import {
    ClipboardText, Users, Sparkle, ArrowRight, Warning, CheckCircle,
    ArrowsClockwise, UserCirclePlus,
} from "@phosphor-icons/react";

export default function Dashboard() {
    const { user } = useAuth();
    const [summary, setSummary] = useState({ total_cases: 0, in_progress: 0, finalized: 0, renominations: 0, my_pending: 0 });
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get("/dashboard/summary").then((r) => setSummary(r.data)),
            api.get("/cases").then((r) => setCases(r.data)),
        ]).finally(() => setLoading(false));
    }, []);

    const roleLabel = user.roles.includes("admin") ? "Admin"
        : user.roles.includes("coordinator") ? "Coordinator"
        : user.roles.includes("hr") ? "HR / HRBP"
        : user.roles.includes("panel") ? "Panel Member"
        : user.roles.includes("manager") ? "Manager"
        : user.roles.includes("stakeholder") ? "Stakeholder"
        : "Employee";

    return (
        <div className="space-y-6 animate-fade-in" data-testid="dashboard">
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <div className="ldc-label">Dashboard — {roleLabel}</div>
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mt-1">Welcome back, {user.name.split(" ")[0]}.</h1>
                    <p className="text-sm text-slate-500 mt-1">Here's what's active for you across the LDC cycle.</p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Kpi label="Active cases" value={summary.total_cases} icon={ClipboardText} testid="kpi-total" />
                <Kpi label="In progress" value={summary.in_progress} icon={ArrowsClockwise} testid="kpi-progress" />
                <Kpi label="Finalized" value={summary.finalized} icon={CheckCircle} testid="kpi-finalized" />
                <Kpi label="Renominations" value={summary.renominations} icon={UserCirclePlus} testid="kpi-renom" />
                <Kpi label="My pending" value={summary.my_pending} icon={Warning} testid="kpi-pending" highlight={summary.my_pending > 0} />
            </div>

            {/* My cases */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 ldc-panel">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="ldc-section-title">My cases</h2>
                        <Link to="/app/cases" className="text-xs font-semibold text-slate-900 hover:underline" data-testid="view-all-cases">View all</Link>
                    </div>
                    {loading ? (
                        <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
                    ) : cases.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-400">No cases assigned to you yet.</div>
                    ) : (
                        <table className="ldc-table w-full">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>BU / Level</th>
                                    <th>Status</th>
                                    <th>Updated</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cases.slice(0, 8).map((c) => (
                                    <tr key={c.id} data-testid={`case-row-${c.id}`}>
                                        <td>
                                            <div className="font-medium text-slate-900">{c.employee?.name}</div>
                                            <div className="text-xs text-slate-500">{c.employee?.emp_id} · {c.fiscal_year}{c.is_renomination && " · RENOM"}</div>
                                        </td>
                                        <td className="text-sm text-slate-600">{c.employee?.bu}<br/><span className="text-xs text-slate-400">{c.employee?.level}</span></td>
                                        <td><StatusBadge status={c.status} /></td>
                                        <td className="text-xs text-slate-500">{humanDate(c.updated_at)}</td>
                                        <td className="text-right">
                                            <Link to={`/app/cases/${c.id}`} className="text-xs font-semibold text-slate-900 hover:underline inline-flex items-center gap-1" data-testid={`open-case-${c.id}`}>
                                                Open <ArrowRight size={12} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="space-y-4">
                    <AIPanel title="AI Case Brief" subtitle="Priority signals across your queue">
                        <ul className="space-y-2">
                            <li className="flex items-start gap-2"><Sparkle size={14} weight="fill" className="text-amber-700 mt-0.5" /> {summary.my_pending} item(s) awaiting your action.</li>
                            <li className="flex items-start gap-2"><Sparkle size={14} weight="fill" className="text-amber-700 mt-0.5" /> {summary.renominations} renomination case(s) include prior panel evidence.</li>
                            <li className="flex items-start gap-2"><Sparkle size={14} weight="fill" className="text-amber-700 mt-0.5" /> Open a case to generate integrated summaries and bias/consistency flags on demand.</li>
                        </ul>
                    </AIPanel>
                    <div className="ldc-panel p-4">
                        <div className="ldc-label mb-2">Your role access</div>
                        <div className="flex flex-wrap gap-1">
                            {user.roles.map((r) => (
                                <span key={r} className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 border border-slate-200 text-slate-700">{r}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Kpi({ label, value, icon: Icon, testid, highlight }) {
    return (
        <div className={`ldc-kpi ${highlight ? "border-amber-300 bg-amber-50" : ""}`} data-testid={testid}>
            <div className="flex items-center justify-between mb-2">
                <div className="ldc-label">{label}</div>
                <Icon size={16} weight="bold" className={highlight ? "text-amber-700" : "text-slate-400"} />
            </div>
            <div className={`text-2xl font-semibold ${highlight ? "text-amber-700" : "text-slate-900"}`}>{value}</div>
        </div>
    );
}
