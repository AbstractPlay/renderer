import type { APRenderRep, Glyph } from "../../src/schemas/schema.js";

const mapLegendGlyphs = (entry: unknown, fn: (g: Glyph) => Glyph): unknown => {
    if (Array.isArray(entry)) {
        if (entry.length === 0) {
            return entry;
        }
        if (Array.isArray(entry[0])) {
            return entry;
        }
        return (entry as Glyph[]).map((g) => fn(g));
    }
    if (typeof entry === "object" && entry !== null && !("piece" in entry)) {
        return fn(entry as Glyph);
    }
    return entry;
};

/** Deep-clone rep and set every legend glyph nudge to legacy glyph-local mode. */
export const withGlyphLocalNudges = (rep: APRenderRep): APRenderRep => {
    const clone = JSON.parse(JSON.stringify(rep)) as APRenderRep;
    if (clone.legend === undefined) {
        return clone;
    }
    for (const key of Object.keys(clone.legend)) {
        clone.legend[key] = mapLegendGlyphs(clone.legend[key], (g) => {
            if (g.nudge === undefined) {
                return g;
            }
            return {
                ...g,
                nudge: { ...g.nudge, relativeTo: "glyph" },
            };
        }) as typeof clone.legend[string];
    }
    return clone;
};
