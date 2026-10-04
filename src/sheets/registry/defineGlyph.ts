import type { Container as SVGContainer, Symbol as SVGSymbol } from "@svgdotjs/svg.js";
import type { GlyphBuildFn, GlyphDefinition, GlyphDefinitionMeta } from "./glyphDefinition.js";
import { isGlyphDefinition } from "./glyphDefinition.js";

const metaBySheet = new Map<string, Map<string, GlyphDefinitionMeta>>();

export function getGlyphDefinitionMeta(sheetName: string, glyphName: string): GlyphDefinitionMeta | undefined {
    return metaBySheet.get(sheetName)?.get(glyphName);
}

export function setGlyphDefinitionMeta(sheetName: string, glyphName: string, meta: GlyphDefinitionMeta): void {
    let sheet = metaBySheet.get(sheetName);
    if (sheet === undefined) {
        sheet = new Map();
        metaBySheet.set(sheetName, sheet);
    }
    sheet.set(glyphName, meta);
}

/**
 * Register a glyph builder plus optional slot metadata on a sheet map.
 * Legacy bare functions may remain on the map until sheets migrate in Phase B.
 */
export function defineGlyph(
    sheetName: string,
    glyphName: string,
    def: GlyphDefinition,
    glyphs: Map<string, GlyphBuildFn>,
): void {
    glyphs.set(glyphName, def.build);
    const meta: GlyphDefinitionMeta = {
        ...(def.slots !== undefined ? { slots: def.slots } : {}),
        ...(def.colour2Slot !== undefined ? { colour2Slot: def.colour2Slot } : {}),
        ...(def.paintMode !== undefined ? { paintMode: def.paintMode } : {}),
        ...(def.shadingProfile !== undefined ? { shadingProfile: def.shadingProfile } : {}),
    };
    setGlyphDefinitionMeta(sheetName, glyphName, meta);
}

export function invokeGlyphBuild(
    build: GlyphBuildFn,
    canvas: SVGContainer,
    sampleColour = "#888888",
): SVGSymbol {
    if (build.length >= 2) {
        return (build as (svg: SVGContainer, color: string) => SVGSymbol)(canvas, sampleColour);
    }
    return (build as (svg: SVGContainer) => SVGSymbol)(canvas);
}

export function normalizeSheetGlyphEntry(
    entry: GlyphBuildFn | GlyphDefinition,
): { build: GlyphBuildFn; meta?: GlyphDefinitionMeta } {
    if (isGlyphDefinition(entry)) {
        const { build, ...meta } = entry;
        return { build, meta };
    }
    return { build: entry };
}
