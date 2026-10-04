import type { Container as SVGContainer, Symbol as SVGSymbol } from "@svgdotjs/svg.js";
import type { Colour2Slot } from "../../renderers/glyphPaint.js";

export type GlyphBuildFn =
    | ((svg: SVGContainer) => SVGSymbol)
    | ((svg: SVGContainer, color: string) => SVGSymbol);

export type SlotChannel = "fill" | "stroke";

export interface SlotMeta {
    /** Author-facing description of what this slot tints on the artwork. */
    description?: string;
    channels: SlotChannel[];
}

export type PaintMode = "proceduralShaded" | "fixed";

export interface GlyphDefinitionMeta {
    slots?: Record<string, SlotMeta>;
    /** Legacy `colour2` / `data-playerfill2` target slot when not inferred. */
    colour2Slot?: Colour2Slot;
    paintMode?: PaintMode;
    shadingProfile?: string;
}

export interface GlyphDefinition extends GlyphDefinitionMeta {
    build: GlyphBuildFn;
}

export function isGlyphDefinition(value: unknown): value is GlyphDefinition {
    return typeof value === "object" && value !== null && "build" in value && typeof (value as GlyphDefinition).build === "function";
}

export function isTwoArgGlyphBuild(fn: GlyphBuildFn): fn is (svg: SVGContainer, color: string) => SVGSymbol {
    return fn.length >= 2;
}
