export function cn(...args) {
    return args.filter(Boolean).join(" ");
}

export function currentFY() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const startYear = m >= 4 ? y : y - 1;
    return `FY ${startYear}-${startYear + 1}`;
}

export function formatFY(code) {
    // "FY26" → "FY 2025-2026"
    if (!code) return currentFY();
    const m = String(code).match(/(\d{2,4})/);
    if (!m) return code;
    let end = parseInt(m[1], 10);
    if (end < 100) end = 2000 + end;
    return `FY ${end - 1}-${end}`;
}

export const APP_NAME = "Transition Diagnostics";

export const STATUS_COLORS = {
    draft: { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1", label: "Draft" },
    launched: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE", label: "Launched" },
    employee_in_progress: { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA", label: "Employee pending" },
    employee_submitted: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE", label: "Employee submitted" },
    manager_in_progress: { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA", label: "Manager pending" },
    manager_submitted: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE", label: "Manager submitted" },
    stakeholder_in_progress: { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA", label: "Stakeholders pending" },
    panel_launched: { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE", label: "Panel launched" },
    panel_in_progress: { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE", label: "Panel in progress" },
    panel_submitted: { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0", label: "Panel submitted" },
    hr_in_progress: { bg: "#FDF2F8", text: "#BE185D", border: "#FBCFE8", label: "HR reviewing" },
    hr_submitted: { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0", label: "HR submitted" },
    closed: { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0", label: "Finalized" },
    reopened: { bg: "#FEFCE8", text: "#A16207", border: "#FEF08A", label: "Reopened" },
    not_started: { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1", label: "Not started" },
    submitted: { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0", label: "Submitted" },
};

export function humanDate(iso) {
    if (!iso) return "—";
    try {
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch {
        return iso;
    }
}

export const DOC_TYPE_LABELS = {
    org_chart: "Org Chart",
    talent_scorecard: "Talent Scorecard",
    psychometric_pdf: "Psychometric PDF",
    annual_review: "Annual Review",
    mid_review: "Mid-Year Review",
    data_summary: "Data Summary",
    presentation: "Presentation",
    profile: "Employee Profile",
    intune_scorecard: "Intune Manager Scorecard",
    "360_report": "360 Report",
    "360_summary": "360 Summary",
};

export const DOC_TYPES = Object.keys(DOC_TYPE_LABELS);
