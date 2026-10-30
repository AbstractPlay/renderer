import type { Symbol as SVGSymbol } from "@svgdotjs/svg.js";
import { proceduralShadingProfile } from "../sheets/registry/glyphRegistry.js";
import { applyProceduralMarbledPaint, isMarbledShadingProfile } from "./procedural/marbledShading.js";
import { applyProceduralShadedPaint, isOrbShadingProfile } from "./procedural/orbShading.js";

/** Contact-sheet preview tint for procedural glyphs (not player 1). */
export const CONTACT_SHEET_ORB_PREVIEW_GREY = "#ccc";

export function usesContactSheetProceduralPreview(glyphName: string): boolean {
    return proceduralShadingProfile(glyphName) !== undefined;
}

export function applyContactSheetProceduralPreview(symbol: SVGSymbol, glyphName: string): void {
    const profile = proceduralShadingProfile(glyphName);
    if (profile === undefined) {
        return;
    }
    if (isOrbShadingProfile(profile)) {
        applyProceduralShadedPaint(symbol, profile, CONTACT_SHEET_ORB_PREVIEW_GREY);
    } else if (isMarbledShadingProfile(profile)) {
        applyProceduralMarbledPaint(symbol, CONTACT_SHEET_ORB_PREVIEW_GREY);
    }
}

/** @deprecated use applyContactSheetProceduralPreview */
export function applyContactSheetOrbPreview(symbol: SVGSymbol, glyphName: string): void {
    applyContactSheetProceduralPreview(symbol, glyphName);
}

/**
 * Build a glyph symbol for the contact sheet: one-arg sheet build; procedural glyphs get grey preview shading.
 */
export function buildGlyphSymbolForContactSheet(
    glyphName: string,
    build: (canvas: import("@svgdotjs/svg.js").Container) => SVGSymbol,
    tile: import("@svgdotjs/svg.js").Container,
): SVGSymbol {
    const symbol = build(tile);
    if (usesContactSheetProceduralPreview(glyphName)) {
        applyContactSheetProceduralPreview(symbol, glyphName);
    }
    return symbol;
}
