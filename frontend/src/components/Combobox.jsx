import React, { useEffect, useMemo, useRef, useState } from "react";
import { CaretDown, X, MagnifyingGlass, Check } from "@phosphor-icons/react";

/**
 * Combobox: single select with typeahead filtering.
 * options: [{ id, label, sub? }]
 */
export function Combobox({
    value,
    onChange,
    options = [],
    placeholder = "Search or select…",
    testid = "combobox",
    allowClear = true,
    disabled = false,
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef(null);

    const selected = options.find((o) => o.id === value);

    const filtered = useMemo(() => {
        if (!query) return options;
        const q = query.toLowerCase();
        return options.filter(
            (o) => o.label.toLowerCase().includes(q) || (o.sub && o.sub.toLowerCase().includes(q))
        );
    }, [query, options]);

    useEffect(() => {
        const onDoc = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const pick = (o) => {
        onChange(o.id);
        setOpen(false);
        setQuery("");
    };

    return (
        <div ref={ref} className="relative" data-testid={testid}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen(!open)}
                className="w-full flex items-center justify-between gap-2 px-2 py-1.5 border border-slate-300 rounded text-sm bg-white disabled:bg-slate-50 hover:border-slate-400"
                data-testid={`${testid}-trigger`}
            >
                <span className={selected ? "text-slate-900 truncate" : "text-slate-400 truncate"}>
                    {selected ? selected.label : placeholder}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {allowClear && selected && !disabled && (
                        <span
                            role="button"
                            onClick={(e) => { e.stopPropagation(); onChange(""); }}
                            data-testid={`${testid}-clear`}
                            className="text-slate-400 hover:text-slate-700"
                        ><X size={12} /></span>
                    )}
                    <CaretDown size={12} className="text-slate-400" />
                </div>
            </button>
            {open && (
                <div className="absolute z-40 mt-1 w-full bg-white border border-slate-200 rounded shadow-lg max-h-64 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-slate-200 flex items-center gap-2">
                        <MagnifyingGlass size={12} className="text-slate-400" />
                        <input
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Type to filter…"
                            className="flex-1 text-sm outline-none bg-transparent"
                            data-testid={`${testid}-search`}
                        />
                    </div>
                    <div className="overflow-auto">
                        {filtered.length === 0 ? (
                            <div className="p-3 text-xs text-slate-400">No match</div>
                        ) : filtered.map((o) => (
                            <button
                                type="button"
                                key={o.id}
                                onClick={() => pick(o)}
                                data-testid={`${testid}-opt-${o.id}`}
                                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 flex items-center justify-between gap-2 ${o.id === value ? "bg-slate-50" : ""}`}
                            >
                                <div className="min-w-0">
                                    <div className="truncate">{o.label}</div>
                                    {o.sub && <div className="text-[11px] text-slate-500 truncate">{o.sub}</div>}
                                </div>
                                {o.id === value && <Check size={12} weight="bold" className="text-emerald-600 flex-shrink-0" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * MultiCombobox: multi select with typeahead and chip display.
 * values: array of ids
 */
export function MultiCombobox({
    values = [],
    onChange,
    options = [],
    placeholder = "Add items…",
    testid = "multi-combobox",
    disabled = false,
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef(null);

    const selectedSet = new Set(values);
    const selectedItems = options.filter((o) => selectedSet.has(o.id));

    const filtered = useMemo(() => {
        const notYet = options.filter((o) => !selectedSet.has(o.id));
        if (!query) return notYet;
        const q = query.toLowerCase();
        return notYet.filter(
            (o) => o.label.toLowerCase().includes(q) || (o.sub && o.sub.toLowerCase().includes(q))
        );
    }, [query, options, values]);

    useEffect(() => {
        const onDoc = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const add = (o) => {
        onChange([...values, o.id]);
        setQuery("");
    };
    const remove = (id) => onChange(values.filter((v) => v !== id));

    return (
        <div ref={ref} className="relative" data-testid={testid}>
            <div
                className={`w-full min-h-[34px] flex items-center gap-1 flex-wrap px-1.5 py-1 border border-slate-300 rounded bg-white ${disabled ? "bg-slate-50" : "hover:border-slate-400 cursor-text"}`}
                onClick={() => !disabled && setOpen(true)}
            >
                {selectedItems.map((o) => (
                    <span key={o.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs" data-testid={`${testid}-chip-${o.id}`}>
                        {o.label}
                        {!disabled && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); remove(o.id); }} className="text-slate-400 hover:text-red-500" data-testid={`${testid}-remove-${o.id}`}>
                                <X size={10} weight="bold" />
                            </button>
                        )}
                    </span>
                ))}
                {!disabled && (
                    <input
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                        onFocus={() => setOpen(true)}
                        placeholder={selectedItems.length === 0 ? placeholder : ""}
                        className="flex-1 min-w-[120px] text-sm outline-none bg-transparent py-0.5 px-1"
                        data-testid={`${testid}-input`}
                    />
                )}
                <CaretDown size={12} className="text-slate-400" />
            </div>
            {open && !disabled && (
                <div className="absolute z-40 mt-1 w-full bg-white border border-slate-200 rounded shadow-lg max-h-64 overflow-auto">
                    {filtered.length === 0 ? (
                        <div className="p-3 text-xs text-slate-400">{query ? "No match" : "All selected"}</div>
                    ) : filtered.map((o) => (
                        <button
                            type="button"
                            key={o.id}
                            onClick={() => add(o)}
                            data-testid={`${testid}-opt-${o.id}`}
                            className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50"
                        >
                            <div className="truncate">{o.label}</div>
                            {o.sub && <div className="text-[11px] text-slate-500 truncate">{o.sub}</div>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
