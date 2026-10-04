import type { Container as SVGContainer, Symbol as SVGSymbol } from "@svgdotjs/svg.js";
import { proceduralShadingProfile } from "../sheets/registry/glyphRegistry.js";
import { applyProceduralShadedPaint, isOrbShadingProfile } from "./orbShading.js";

/** Contact-sheet preview tint for procedural orb family (not player 1). */
export const CONTACT_SHEET_ORB_PREVIEW_GREY = "#ccc";

export function usesContactSheetProceduralPreview(glyphName: string): boolean {
    const profile = proceduralShadingProfile(glyphName);
    return profile !== undefined && isOrbShadingProfile(profile);
}

export function applyContactSheetOrbPreview(symbol: SVGSymbol, glyphName: string): void {
    const profile = proceduralShadingProfile(glyphName);
    if (profile === undefined || !isOrbShadingProfile(profile)) {
        return;
    }
    applyProceduralShadedPaint(symbol, profile, CONTACT_SHEET_ORB_PREVIEW_GREY);
}

/**
 * Build a glyph symbol for the contact sheet: one-arg sheet build; orbs get procedural grey preview.
 */
export function buildGlyphSymbolForContactSheet(
    glyphName: string,
    build: (canvas: SVGContainer) => SVGSymbol,
    tile: SVGContainer,
): SVGSymbol {
    const symbol = build(tile);
    if (usesContactSheetProceduralPreview(glyphName)) {
        applyContactSheetOrbPreview(symbol, glyphName);
    }
    return symbol;
}
