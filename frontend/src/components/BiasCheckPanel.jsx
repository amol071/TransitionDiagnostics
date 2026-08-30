import React from "react";

/**
 * Rich renderer for the enhanced bias_check AI output.
 * Handles the v2 schema: overall_risk, consistency_score, score_breakdown,
 * rating_mismatches, rater_patterns, evidence_alignment, language_signals,
 * missing_coverage, discussion_flags, recommendations.
 *
 * Falls back gracefully to the legacy shape (bias_risks / unsupported_high, etc.)
 * so historical analyses saved before this upgrade still render.
 */
export default function BiasCheckPanel({ data, eligibility }) {
    if (!data) return <div className="text-sm text-slate-500">No output.</div>;
    if (data.error) return <div className="text-xs text-amber-800">{String(data.raw || data.error)}</div>;

    const legacy = data.overall_risk === undefined && data.consistency_score === undefined;
    if (legacy) return <LegacyBias data={data} />;

    const score = clamp(Number(data.consistency_score) || 0);
    const risk = data.overall_risk || "Low";
    const bd = data.score_breakdown || {};

    return (
        <div className="space-y-4 text-sm" data-testid="bias-panel">
            {/* Header — risk chip + consistency score */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="border border-slate-200 rounded p-3 bg-white">
                    <div className="ldc-label mb-1">Overall risk</div>
                    <div className="flex items-center gap-2">
                        <RiskChip level={risk} />
                        <div className="text-[11px] text-slate-500">
                            Sources: {(eligibility?.submitted_sources || []).join(" · ") || "n/a"}
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2 border border-slate-200 rounded p-3 bg-white">
                    <div className="flex items-center justify-between mb-1">
                        <div className="ldc-label">Consistency score</div>
                        <div className="text-lg font-semibold" data-testid="bias-score">{score}<span className="text-xs text-slate-400">/100</span></div>
                    </div>
                    <ScoreBar value={score} />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-[11px]">
                        <MiniBar label="Rating alignment" value={clamp(bd.rating_alignment)} />
                        <MiniBar label="Evidence alignment" value={clamp(bd.evidence_alignment)} />
                        <MiniBar label="Source coverage" value={clamp(bd.source_coverage)} />
                        <MiniBar label="Language neutrality" value={clamp(bd.language_neutrality)} />
                    </div>
                </div>
            </div>

            {data.summary && (
                <div className="border-l-2 border-amber-400 bg-amber-50/50 p-3 text-slate-800">{data.summary}</div>
            )}

            {arr(data.rating_mismatches) && (
                <Section title="Rating mismatches" testid="bias-mismatches">
                    <div className="overflow-auto">
                        <table className="ldc-table w-full">
                            <thead>
                                <tr>
                                    <th>Capability</th>
                                    <th>Self</th>
                                    <th>Manager</th>
                                    <th>Stakeholder</th>
                                    <th>Panel</th>
                                    <th>Δ</th>
                                    <th>Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.rating_mismatches.map((m, i) => (
                                    <tr key={i}>
                                        <td className="text-xs font-medium">{m.capability}</td>
                                        <td className="text-xs">{m.self || "—"}</td>
                                        <td className="text-xs">{m.manager || "—"}</td>
                                        <td className="text-xs">{m.stakeholder || "—"}</td>
                                        <td className="text-xs">{m.panel || "—"}</td>
                                        <td><DeltaChip level={m.delta} /></td>
                                        <td className="text-[11px] text-slate-600">{m.notes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Section>
            )}

            {arr(data.rater_patterns) && (
                <Section title="Rater patterns">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {data.rater_patterns.map((p, i) => (
                            <div key={i} className="border border-slate-200 rounded p-2 bg-white">
                                <div className="flex items-baseline gap-2">
                                    <RiskChip level={p.risk} small />
                                    <div className="text-xs font-semibold text-slate-800">{p.pattern}</div>
                                    <div className="text-[11px] text-slate-500 font-mono">{p.source}</div>
                                </div>
                                <div className="text-[12px] text-slate-600 mt-1">{p.evidence}</div>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {arr(data.evidence_alignment) && (
                <Section title="Evidence alignment">
                    <ul className="space-y-1">
                        {data.evidence_alignment.map((e, i) => (
                            <li key={i} className="text-[12px] border-l-2 border-slate-300 pl-2">
                                <span className="font-semibold text-slate-800">{e.capability}</span>
                                <span className="ml-2 px-1.5 py-0.5 text-[10px] uppercase tracking-widest border border-slate-300 rounded bg-slate-50 text-slate-600">{e.issue.replace(/_/g, " ")}</span>
                                <span className="ml-2 text-[10px] text-slate-500 font-mono">source · {e.source}</span>
                                <div className="text-slate-600 mt-0.5">{e.explanation}</div>
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {arr(data.language_signals) && (
                <Section title="Language signals">
                    <ul className="space-y-1">
                        {data.language_signals.map((l, i) => (
                            <li key={i} className="text-[12px] border-l-2 border-slate-300 pl-2">
                                <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-widest border border-amber-300 rounded bg-amber-50 text-amber-800">{l.signal.replace(/_/g, " ")}</span>
                                <span className="ml-2 text-[10px] text-slate-500 font-mono">source · {l.source}</span>
                                {l.quote && <div className="text-slate-800 italic mt-0.5">"{l.quote}"</div>}
                                <div className="text-slate-600 mt-0.5">{l.explanation}</div>
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {arr(data.missing_coverage) && (
                <Section title="Missing coverage">
                    <ul className="space-y-1">
                        {data.missing_coverage.map((m, i) => (
                            <li key={i} className="text-[12px] flex items-center gap-2">
                                <RiskChip level={m.impact} small />
                                <span>{m.item}</span>
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {arr(data.discussion_flags) && (
                <Section title="Discussion flags · panel probes">
                    <ul className="space-y-2">
                        {data.discussion_flags.map((f, i) => (
                            <li key={i} className="border border-slate-200 rounded p-2 bg-white">
                                <div className="text-xs font-semibold text-slate-800">{f.topic}</div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                    Disagree: {(f.sources_disagree || []).join(", ") || "—"} · Agree: {(f.sources_agree || []).join(", ") || "—"}
                                </div>
                                <div className="text-[12px] text-slate-700 mt-1">{f.explanation}</div>
                                {f.suggested_probe && (
                                    <div className="mt-1 text-[12px] bg-slate-50 border-l-2 border-slate-400 pl-2 py-1 text-slate-700">
                                        <span className="text-[10px] uppercase tracking-widest text-slate-500 mr-1">Probe:</span>
                                        {f.suggested_probe}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {arr(data.recommendations) && (
                <Section title="Recommendations">
                    <ul className="list-disc pl-4 space-y-0.5 text-[12px]">
                        {data.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                </Section>
            )}
        </div>
    );
}

// -------- helpers --------
const arr = (x) => Array.isArray(x) && x.length > 0;
const clamp = (n) => Math.max(0, Math.min(100, Number.isFinite(+n) ? +n : 0));

const Section = ({ title, children, testid }) => (
    <div data-testid={testid}>
        <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">{title}</div>
        {children}
    </div>
);

function RiskChip({ level, small = false }) {
    const l = String(level || "").toLowerCase();
    const cls = l === "high" ? "bg-red-50 border-red-300 text-red-800"
        : l === "medium" ? "bg-amber-50 border-amber-300 text-amber-800"
        : l === "low" ? "bg-emerald-50 border-emerald-300 text-emerald-800"
        : "bg-slate-100 border-slate-300 text-slate-700";
    return (
        <span className={`inline-block px-1.5 py-0.5 border rounded uppercase tracking-widest font-semibold ${cls} ${small ? "text-[9px]" : "text-[10px]"}`}>
            {level || "—"}
        </span>
    );
}

function DeltaChip({ level }) {
    const l = String(level || "").toLowerCase();
    const cls = l === "major" ? "bg-red-50 border-red-300 text-red-700"
        : l === "minor" ? "bg-amber-50 border-amber-300 text-amber-800"
        : l === "aligned" ? "bg-emerald-50 border-emerald-300 text-emerald-700"
        : "bg-slate-100 border-slate-300 text-slate-600";
    return <span className={`inline-block px-1.5 py-0.5 text-[10px] border rounded font-semibold ${cls}`}>{level || "—"}</span>;
}

function ScoreBar({ value }) {
    const color = value >= 70 ? "bg-emerald-500" : value >= 40 ? "bg-amber-500" : "bg-red-500";
    return (
        <div className="h-2 w-full bg-slate-100 rounded overflow-hidden">
            <div className={`h-full ${color}`} style={{ width: `${value}%` }}></div>
        </div>
    );
}

function MiniBar({ label, value }) {
    const color = value >= 70 ? "bg-emerald-500" : value >= 40 ? "bg-amber-500" : "bg-red-500";
    return (
        <div>
            <div className="flex items-center justify-between">
                <span className="text-slate-500 truncate">{label}</span>
                <span className="text-slate-800 font-semibold ml-1">{value}</span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded overflow-hidden mt-0.5">
                <div className={`h-full ${color}`} style={{ width: `${value}%` }}></div>
            </div>
        </div>
    );
}

// Legacy fallback for older analyses
function LegacyBias({ data }) {
    const Bullets = ({ title, items }) => items && items.length ? (
        <div>
            <strong className="block text-xs uppercase tracking-widest text-amber-800 mb-1">{title}</strong>
            <ul className="list-disc pl-4 space-y-0.5">{items.map((it, i) => <li key={i}>{typeof it === "string" ? it : JSON.stringify(it)}</li>)}</ul>
        </div>
    ) : null;
    return (
        <div className="space-y-2 text-sm">
            {data.summary && <div>{data.summary}</div>}
            <Bullets title="Discussion flags" items={(data.discussion_flags || []).map(f => typeof f === "string" ? f : `${f.topic} — ${f.explanation}`)} />
            <Bullets title="Bias risks" items={(data.bias_risks || []).map(f => `[${f.risk}] ${f.reason}`)} />
            <Bullets title="Unsupported high" items={data.unsupported_high} />
            <Bullets title="Unsupported low" items={data.unsupported_low} />
            <Bullets title="Missing evidence" items={data.missing_evidence} />
        </div>
    );
}
