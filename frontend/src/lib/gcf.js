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

/**
 * 7 CORE leadership GCFs used in the Employee self-reflection
 * (pillar_order.gcf_order).
 *   Leading Self (1): Hunger to Learn and Improve (2), Emotional and Social Awareness (3)
 *   Leading Others (2): Leading Team (1), Developing Others (2), Influencing (3), Fostering Collaboration (4)
 *   Leading Business (3): Acting Strategically (2)
 */
export const CORE_GCF_KEYS = new Set([
    "1.2", "1.3",
    "2.1", "2.2", "2.3", "2.4",
    "3.2",
]);

/** The remaining 5 GCFs (for the optional reflections section). */
export const OTHER_GCFS = [
    { key: "1.1", pillar: "Leading Self", gcf: "Initiative" },
    { key: "3.1", pillar: "Leading Business", gcf: "Customer Centricity" },
    { key: "3.3", pillar: "Leading Business", gcf: "Functional Capability" },
    { key: "3.4", pillar: "Leading Business", gcf: "Delivering Results" },
    { key: "3.5", pillar: "Leading Business", gcf: "Institution Building" },
];

export function isCoreCapability(cap) {
    return CORE_GCF_KEYS.has(`${cap.pillar_order}.${cap.gcf_order}`);
}

/** Filter caps to CORE-only (7 GCFs) for the self-reflection form. */
export function coreCaps(caps) {
    return caps.filter(isCoreCapability);
}
