import type { Element } from "@svgdotjs/svg.js";
import type { Glyph } from "../schemas/schema.js";

export type GlyphNudgeRelativeTo = "piece" | "glyph";

export const isTextGlyphLayer = (g: Glyph): boolean =>
    ("text" in g) && (g.text !== undefined) && (g.text.length > 0);

/**
 * Default: `piece` for text layers, `glyph` for sheet/name layers (same idea as orientation defaults).
 * Explicit `relativeTo` on the nudge object overrides.
 */
export const resolveGlyphNudgeRelativeTo = (
    g: Glyph,
    nudge: NonNullable<Glyph["nudge"]>,
): GlyphNudgeRelativeTo => {
    if (nudge.relativeTo === "piece" || nudge.relativeTo === "glyph") {
        return nudge.relativeTo;
    }
    return isTextGlyphLayer(g) ? "piece" : "glyph";
};

/** Rotate a piece-space nudge vector (degrees). */
export const rotatePieceNudgeVector = (
    dx: number,
    dy: number,
    degrees: number,
): { dx: number; dy: number } => {
    const rad = (degrees * Math.PI) / 180;
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return {
        dx: dx * c - dy * s,
        dy: dx * s + dy * c,
    };
};

/**
 * Composite / legend-nested axes: offset before this layer's rotate, scale, and flip.
 */
export const applyPieceGlyphNudge = (use: Element, dx: number, dy: number): void => {
    use.dmove(dx, dy);
};

/** This layer's local axes after rotate, scale, and flip (legacy). */
export const applyGlyphLocalNudge = (use: Element, dx: number, dy: number): void => {
    use.dmove(dx, dy);
};
