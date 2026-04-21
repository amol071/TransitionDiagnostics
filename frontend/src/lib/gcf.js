/**
 * Capability grouping helpers for the GCF framework.
 * All ordering is driven by pillar_order → gcf_order → competency_order.
 */

export function nextLevelFor(employeeLevel) {
    const n = parseInt(String(employeeLevel || "L2").replace(/\D/g, ""), 10);
    if (isNaN(n)) return 3;
    return Math.min(4, n + 1);
}

export function currentLevelNumber(employeeLevel) {
    const n = parseInt(String(employeeLevel || "L2").replace(/\D/g, ""), 10);
    return isNaN(n) ? 2 : n;
}

/** Filter capabilities to a single level and sort by canonical order. */
export function capsAtLevel(allCaps, level) {
    return allCaps
        .filter((c) => c.level === level)
        .sort((a, b) => a.order - b.order);
}

/** Build nested structure: [{ pillar, pillar_order, gcfs: [{ gcf, gcf_order, caps: [...] }] }] */
export function groupByPillarGcf(caps) {
    const pillarMap = new Map();
    for (const cap of caps) {
        if (!pillarMap.has(cap.pillar_order)) {
            pillarMap.set(cap.pillar_order, {
                pillar: cap.pillar,
                pillar_order: cap.pillar_order,
                gcfs: new Map(),
            });
        }
        const p = pillarMap.get(cap.pillar_order);
        if (!p.gcfs.has(cap.gcf_order)) {
            p.gcfs.set(cap.gcf_order, {
                gcf: cap.gcf,
                gcf_order: cap.gcf_order,
                caps: [],
            });
        }
        p.gcfs.get(cap.gcf_order).caps.push(cap);
    }
    return Array.from(pillarMap.values())
        .sort((a, b) => a.pillar_order - b.pillar_order)
        .map((p) => ({
            ...p,
            gcfs: Array.from(p.gcfs.values())
                .sort((a, b) => a.gcf_order - b.gcf_order)
                .map((g) => ({ ...g, caps: g.caps.sort((a, b) => a.competency_order - b.competency_order) })),
        }));
}

/** Find the competency at the same pillar/gcf/competency_order index at a different level (for "current expectation" display). */
export function findSibling(allCaps, refCap, targetLevel) {
    return allCaps.find(
        (c) =>
            c.level === targetLevel &&
            c.pillar_order === refCap.pillar_order &&
            c.gcf_order === refCap.gcf_order &&
            c.competency_order === refCap.competency_order
    );
}
