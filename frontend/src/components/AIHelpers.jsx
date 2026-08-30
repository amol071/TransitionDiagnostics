import React, { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import AIPanel from "@/components/AIPanel";
import { Sparkle, CheckCircle, Stack } from "@phosphor-icons/react";
import { toast } from "sonner";

/** AI rewrite helper — renders inline button that invokes /ai/write and calls onResult(text) */
export function AIWriteButton({ text, mode = "improve", context, onResult, label = "AI improve", testid }) {
    const [loading, setLoading] = useState(false);
    const run = async () => {
        if (!text?.trim()) { toast.message("Add some text first"); return; }
        setLoading(true);
        try {
            const { data } = await api.post("/ai/write", { text, mode, context });
            onResult(data.text);
            toast.success("AI draft generated");
        } catch (e) {
            toast.error("AI error");
        } finally {
            setLoading(false);
        }
    };
    return (
        <button
            type="button"
            onClick={run}
            data-testid={testid || `ai-write-${mode}`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 disabled:opacity-50"
            disabled={loading}
        >
            <Sparkle size={10} weight="fill" /> {loading ? "…" : label}
        </button>
    );
}

/** Section for case-level AI analyses */
export function CaseAIBar({ caseId, types = [], onResult, disabledTypes = {} }) {
    const [loading, setLoading] = useState("");
    const run = async (t) => {
        setLoading(t);
        try {
            const { data } = await api.post("/ai/analyze", { case_id: caseId, analysis_type: t });
            onResult?.(t, data);
            toast.success(`AI ${t.replace(/_/g, " ")} generated`);
        } catch (e) {
            toast.error(e?.response?.data?.detail || "AI error");
        } finally {
            setLoading("");
        }
    };
    return (
        <div className="flex flex-wrap gap-2">
            {types.map((t) => {
                const disabledReason = disabledTypes[t];
                const isDisabled = loading === t || !!disabledReason;
                return (
                    <button
                        key={t}
                        onClick={() => run(t)}
                        data-testid={`ai-run-${t}`}
                        disabled={isDisabled}
                        title={disabledReason || ""}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Sparkle size={12} weight="fill" />
                        {loading === t ? "Analyzing…" : AI_LABELS[t] || t}
                    </button>
                );
            })}
        </div>
    );
}

export const AI_LABELS = {
    integrated_summary: "Integrated summary",
    bias_check: "Bias & consistency check",
    capability_gap: "Capability gap",
    panel_draft: "Panel draft",
    hr_draft: "HR draft",
    development_plan: "Development plan",
    quick_brief: "Quick case brief",
    stakeholder_suggest: "Stakeholder suggestions",
};

export function useAutoSave(fn, delay = 1500) {
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState(null);
    const mark = useCallback(() => setDirty(true), []);
    useEffect(() => {
        if (!dirty) return;
        const t = setTimeout(async () => {
            setSaving(true);
            try {
                await fn();
                setSavedAt(new Date());
                setDirty(false);
            } catch { /* ignore */ }
            finally { setSaving(false); }
        }, delay);
        return () => clearTimeout(t);
    }, [dirty]);
    return { saving, savedAt, mark, dirty };
}

export function SaveIndicator({ saving, savedAt, dirty }) {
    return (
        <span className="text-xs text-slate-500 flex items-center gap-1">
            {saving ? (
                <><Stack size={12} className="animate-pulse" /> Saving…</>
            ) : dirty ? (
                <>Unsaved changes</>
            ) : savedAt ? (
                <><CheckCircle size={12} weight="fill" className="text-emerald-600" /> Saved {savedAt.toLocaleTimeString()}</>
            ) : null}
        </span>
    );
}
