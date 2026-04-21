import React from "react";
import { STATUS_COLORS } from "@/lib/utils-ldc";

export default function StatusBadge({ status, className = "", size = "sm" }) {
    const cfg = STATUS_COLORS[status] || STATUS_COLORS.draft;
    const padding = size === "lg" ? "px-3 py-1" : "px-2 py-0.5";
    return (
        <span
            data-testid={`status-badge-${status}`}
            className={`inline-flex items-center ${padding} rounded text-xs font-semibold tracking-wide border ${className}`}
            style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
        >
            {cfg.label}
        </span>
    );
}
