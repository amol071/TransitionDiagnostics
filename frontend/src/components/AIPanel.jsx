import React from "react";
import { Sparkle } from "@phosphor-icons/react";

export default function AIPanel({ title = "AI Draft", subtitle, actions, children, testid = "ai-panel" }) {
    return (
        <div data-testid={testid} className="ldc-ai-panel p-4 animate-fade-in">
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-widest"
                        style={{ background: "#FEF3C7", color: "#B45309", border: "1px solid #FCD34D" }}
                    >
                        <Sparkle size={12} weight="fill" /> {title}
                    </span>
                    {subtitle && <span className="text-xs text-amber-800">{subtitle}</span>}
                </div>
                {actions && <div className="flex gap-2">{actions}</div>}
            </div>
            <div className="text-sm text-slate-800">{children}</div>
        </div>
    );
}
