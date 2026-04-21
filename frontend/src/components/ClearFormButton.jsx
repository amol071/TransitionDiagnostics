import React, { useState } from "react";
import { Eraser } from "@phosphor-icons/react";

/**
 * ClearFormButton — two-click confirmation.
 * First click turns the button into a "Click again to clear" state for 3s.
 * Second click (within the window) calls onClear.
 * Uses inline state (no native confirm — iframes block it).
 */
export default function ClearFormButton({ onClear, disabled = false, testid = "clear-form-btn", label = "Clear form" }) {
    const [armed, setArmed] = useState(false);

    const handleClick = () => {
        if (disabled) return;
        if (!armed) {
            setArmed(true);
            setTimeout(() => setArmed(false), 3000);
            return;
        }
        setArmed(false);
        onClear();
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={disabled}
            data-testid={testid}
            className={
                "px-3 py-1.5 text-sm rounded border flex items-center gap-1 transition-colors " +
                (armed
                    ? "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50") +
                (disabled ? " opacity-50 cursor-not-allowed" : "")
            }
        >
            <Eraser size={14} />
            {armed ? "Click again to confirm" : label}
        </button>
    );
}
