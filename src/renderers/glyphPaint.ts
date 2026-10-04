import type { Element as SVGElement, Gradient as SVGGradient, Symbol as SVGSymbol } from "@svgdotjs/svg.js";
import type { Colourfuncs, ColourResolvable, FunctionBestContrast, Glyph, Gradient, SheetGlyph, TextGlyph } from "../schemas/schema.js";
import { x2uid } from "../common/glyph2uid.js";
import { warnUnknownPaintSlot } from "../sheets/registry/glyphRegistry.js";

type ResolvedFill = string | SVGGradient | SVGElement;

/** Default mapping for legacy colour2 / data-playerfill2 during transition. */
export type Colour2Slot = "border" | "detail";

export type PaintValue = ColourResolvable | Gradient | SlotPaintObject;

export interface SlotPaintObject {
    colour?: ColourResolvable | Gradient;
    opacity?: number;
}

export type NormalizedPaintMap = Record<string, PaintValue>;

export interface NormalizedSheetGlyph {
    paint: NormalizedPaintMap;
    layerOpacity: number;
}

export function isSheetGlyph(g: Glyph): g is SheetGlyph {
    return "name" in g && g.name.length > 0;
}

export function isTextGlyph(g: Glyph): g is TextGlyph {
    return "text" in g && g.text.length > 0;
}

function isSlotPaintObject(val: unknown): val is SlotPaintObject {
    return typeof val === "object" && val !== null && !Array.isArray(val) && ("colour" in val || "opacity" in val);
}

/**
 * Merge explicit paint with legacy colour/colour2 shims (sheet glyphs only).
 * colour2 → paint.border by default (not detail).
 */
/** Sheet glyphs only; text layers return undefined. */
export function normalizeGlyphPaint(
    g: Glyph,
    colour2Slot: Colour2Slot = "border",
): NormalizedSheetGlyph | undefined {
    if (!isSheetGlyph(g)) {
        return undefined;
    }
    return normalizeSheetGlyphPaint(g, colour2Slot);
}

export function normalizeSheetGlyphPaint(
    g: Glyph,
    colour2Slot: Colour2Slot = "border",
): NormalizedSheetGlyph {
    if (!isSheetGlyph(g)) {
        throw new Error("normalizeSheetGlyphPaint requires a sheet glyph with name");
    }
    const hasExplicitPaint = g.paint !== undefined;
    const paint: NormalizedPaintMap = hasExplicitPaint ? { ...g.paint } : {};
    if (g.colour !== undefined && paint.fill === undefined) {
        paint.fill = g.colour;
    }
    if (g.colour2 !== undefined && paint[colour2Slot] === undefined) {
        paint[colour2Slot] = g.colour2;
    }

    let layerOpacity = 1;
    if (g.opacity !== undefined) {
        if (hasExplicitPaint) {
            layerOpacity = g.opacity;
        } else {
            // Legacy JSON: glyph.opacity tints fill only, not border/detail or the whole <use>.
            const existingFill = paint.fill;
            if (existingFill === undefined) {
                paint.fill = { opacity: g.opacity };
            } else if (isSlotPaintObject(existingFill)) {
                paint.fill = { ...existingFill, opacity: g.opacity };
            } else {
                paint.fill = { colour: existingFill, opacity: g.opacity };
            }
        }
    }
    return { paint, layerOpacity };
}

/** Stable cache fingerprint for styled sheet symbols (excludes layer opacity). */
export function paintFingerprint(paint: NormalizedPaintMap): string {
    return x2uid(paint);
}

export function paintColourValue(entry: PaintValue): ColourResolvable | Gradient | undefined {
    if (isSlotPaintObject(entry)) {
        return entry.colour;
    }
    return entry;
}

export function paintSlotOpacity(entry: PaintValue): number {
    if (isSlotPaintObject(entry) && entry.opacity !== undefined) {
        return entry.opacity;
    }
    return 1;
}

/** Legacy applyPlayerFillTargets suffix for a slot name (unmigrated sheet art). */
export function legacyFillSuffixForSlot(slot: string, colour2Slot: Colour2Slot): string | null {
    if (slot === "fill") {
        return "";
    }
    if (slot === colour2Slot || slot === "detail" || slot === "border") {
        return "2";
    }
    return null;
}

export function collectPaintColourValues(
    paint: NormalizedPaintMap,
): Array<number | string | Gradient | Colourfuncs | undefined> {
    const out: Array<number | string | Gradient | Colourfuncs | undefined> = [];
    for (const entry of Object.values(paint)) {
        const c = paintColourValue(entry);
        if (c !== undefined) {
            out.push(c);
        }
    }
    return out;
}

/** Player palette index from normalized paint.fill when numeric. */
export function playerIndexFromSheetGlyph(g: Glyph, normalized?: NormalizedSheetGlyph): number | undefined {
    const norm = normalized ?? (isSheetGlyph(g) ? normalizeSheetGlyphPaint(g) : undefined);
    if (norm === undefined) {
        return undefined;
    }
    const fill = norm.paint.fill;
    if (fill === undefined) {
        return undefined;
    }
    const c = paintColourValue(fill);
    if (typeof c === "number") {
        return c;
    }
    return undefined;
}

/**
 * Background tint for text bestContrast from earlier composite layers.
 */
export function priorCompositeLayerTint(
    glyphs: Glyph[],
    idx: number,
    resolveColour: (val: ColourResolvable | Gradient | Colourfuncs, def?: string) => string | Gradient | Colourfuncs,
    contextBackground: string,
): string {
    for (let j = idx - 1; j >= 0; j--) {
        const prev = glyphs[j]!;
        if (isSheetGlyph(prev)) {
            const norm = normalizeSheetGlyphPaint(prev);
            const fill = norm.paint.fill;
            if (fill !== undefined) {
                const c = paintColourValue(fill);
                if (c !== undefined) {
                    return resolveColour(c as ColourResolvable | Gradient | Colourfuncs, contextBackground) as string;
                }
            }
            if (prev.colour !== undefined) {
                return resolveColour(prev.colour as ColourResolvable | Gradient | Colourfuncs, contextBackground) as string;
            }
        } else if (isTextGlyph(prev) && prev.colour !== undefined) {
            return resolveColour(prev.colour as ColourResolvable | Gradient | Colourfuncs, contextBackground) as string;
        }
    }
    return contextBackground;
}

export interface SlotBindingSelectors {
    fill: string[];
    stroke: string[];
}

/** Element selectors for a slot (slotted attrs + legacy bridge). */
export function findBindings(slot: string, colour2Slot: Colour2Slot): SlotBindingSelectors {
    const fill: string[] = [
        `[data-slot-fill="${slot}"]`,
        `[data-slot="${slot}"]`,
    ];
    const stroke: string[] = [
        `[data-slot-stroke="${slot}"]`,
    ];
    const legacySuffix = legacyFillSuffixForSlot(slot, colour2Slot);
    if (legacySuffix !== null) {
        fill.push(`[data-playerfill${legacySuffix}=true]`);
        stroke.push(`[data-playerstroke${legacySuffix}=true]`);
    }
    if (slot === "border") {
        stroke.push("[data-context-border=true]");
        fill.push("[data-context-border-fill=true]");
    }
    return { fill, stroke };
}

export interface GlyphPaintApplier {
    resolveFill: (
        val: number | string | Gradient | Colourfuncs,
        def?: string,
        opts?: { scale?: number },
    ) => ResolvedFill;
    applyPlayerFillTargets: (got: SVGSymbol, suffix: string, fill: ResolvedFill, opacity: number) => void;
    isPatternSVGElement: (fill: ResolvedFill) => boolean;
}

function applyResolvedFill(
    el: SVGElement,
    fill: ResolvedFill,
    opacity: number,
    isPattern: (f: ResolvedFill) => boolean,
): void {
    if (isPattern(fill)) {
        // @ts-expect-error (poor SVGjs typing)
        el.fill(fill);
        if (opacity < 1) {
            el.opacity(opacity);
        }
        return;
    }
    if (typeof fill === "object") {
        el.fill(fill);
        return;
    }
    el.fill({ color: fill, opacity });
}

function applyResolvedStroke(
    el: SVGElement,
    fill: ResolvedFill,
    opacity: number,
    isPattern: (f: ResolvedFill) => boolean,
): void {
    if (isPattern(fill)) {
        // @ts-expect-error (poor SVGjs typing)
        el.stroke(fill);
        if (opacity < 1) {
            el.opacity(opacity);
        }
        return;
    }
    if (typeof fill === "object") {
        // @ts-expect-error (poor SVGjs typing)
        el.stroke(fill);
        return;
    }
    el.stroke({ color: fill, opacity });
}

/** Resolve a hex base colour from normalized paint.fill for procedural glyphs. */
export function resolvedPaintBaseHex(
    paint: NormalizedPaintMap,
    resolveFill: GlyphPaintApplier["resolveFill"],
    defaultHex = "#fff",
): string {
    const fill = paint.fill;
    if (fill === undefined) {
        return defaultHex;
    }
    const colourVal = paintColourValue(fill);
    if (colourVal === undefined) {
        return defaultHex;
    }
    const resolved = resolveFill(colourVal as number | string | Gradient | Colourfuncs, defaultHex);
    if (typeof resolved === "string") {
        return resolved;
    }
    return defaultHex;
}

export function paintMapAfterProceduralShading(
    paint: NormalizedPaintMap,
    profile: import("./orbShading.js").OrbShadingProfile,
): NormalizedPaintMap {
    const next: NormalizedPaintMap = { ...paint };
    delete next.fill;
    if (profile === "orb2" || profile === "orb3") {
        delete next.detail;
    }
    return next;
}

/** Apply player/context slot paint; layer opacity must remain 1 on the symbol. */
export function applySlotPaint(
    got: SVGSymbol,
    paint: NormalizedPaintMap,
    ctx: GlyphPaintApplier,
    opts: { sheetCellSize: number; colour2Slot: Colour2Slot; slotted: boolean; glyphName?: string; knownSlots?: string[] },
): void {
    for (const [slot, entry] of Object.entries(paint)) {
        if (opts.glyphName !== undefined && opts.knownSlots !== undefined) {
            warnUnknownPaintSlot(opts.glyphName, slot, opts.knownSlots);
        }
        const colourVal = paintColourValue(entry);
        if (colourVal === undefined) {
            continue;
        }
        const slotOpacity = paintSlotOpacity(entry);
        const resolved = ctx.resolveFill(colourVal as number | string | Gradient | Colourfuncs, "#000", {
            scale: opts.sheetCellSize,
        });

        if (opts.slotted) {
            const { fill: fillSels, stroke: strokeSels } = findBindings(slot, opts.colour2Slot);
            for (const sel of fillSels) {
                if (sel.startsWith("[data-playerfill") || sel.startsWith("[data-context-border-fill")) {
                    continue;
                }
                got.find(sel).each(function (this: SVGElement) {
                    applyResolvedFill(this, resolved, slotOpacity, ctx.isPatternSVGElement);
                });
            }
            for (const sel of strokeSels) {
                if (sel.startsWith("[data-playerstroke") || sel.startsWith("[data-context-border")) {
                    continue;
                }
                got.find(sel).each(function (this: SVGElement) {
                    applyResolvedStroke(this, resolved, slotOpacity, ctx.isPatternSVGElement);
                });
            }
        } else {
            const legacySuffix = legacyFillSuffixForSlot(slot, opts.colour2Slot);
            if (legacySuffix === null) {
                continue;
            }
            ctx.applyPlayerFillTargets(got, legacySuffix, resolved, slotOpacity);
        }
    }
}

/** Theme context on unmigrated symbols; slotted elements are styled by the slot pipeline. */
export function applySlotDefaults(
    got: SVGSymbol,
    paint: NormalizedPaintMap,
    applyContextPass: (symbol: SVGSymbol) => void,
): void {
    applyContextPass(got);
    if (paint.border === undefined && !symbolHasSlotBindings(got)) {
        // Legacy art keeps theme border until paint.border is set (context pass above).
    }
}

export interface TextGlyphFillContext {
    resolveColour: (
        val: ColourResolvable | Gradient | Colourfuncs | FunctionBestContrast,
        def?: string,
    ) => string | Gradient | Colourfuncs;
    resolveFill: (
        val: number | string | Gradient | Colourfuncs,
        def?: string,
        opts?: { scale?: number },
    ) => ResolvedFill;
    applyPlayerFillTargets: (got: SVGSymbol, suffix: string, fill: ResolvedFill, opacity: number) => void;
    contextBackground: string;
}

/** Text glyph fill/stroke; layer opacity is applied on the placed `<use>`, not here. */
export function applyTextGlyphFill(
    got: SVGSymbol,
    g: Glyph,
    glyphs: Glyph[],
    idx: number,
    ctx: TextGlyphFillContext,
): void {
    if (!isTextGlyph(g)) {
        return;
    }
    if (g.colour !== undefined) {
        const resolved = ctx.resolveFill(g.colour as number | string | Gradient | Colourfuncs, "#000");
        ctx.applyPlayerFillTargets(got, "", resolved, 1);
        return;
    }
    const darkest = priorCompositeLayerTint(glyphs, idx, ctx.resolveColour, ctx.contextBackground);
    const func: FunctionBestContrast = {
        func: "bestContrast",
        bg: darkest,
        fg: ["#000", "#fff"],
    };
    const normColour = ctx.resolveColour(func, "#000") as string;
    got.find("text").each(function (this: SVGElement) {
        this.fill({ color: normColour, opacity: 1 });
    });
    got.find("[data-playerstroke]").each(function (this: SVGElement) {
        this.stroke({ color: normColour, opacity: 1 });
    });
}

export function collectPatternsFromGlyphPaint(g: Glyph): Array<number | string | Gradient | Colourfuncs | undefined> {
    const norm = normalizeGlyphPaint(g);
    if (norm === undefined) {
        if (isTextGlyph(g) && g.colour !== undefined) {
            return [g.colour];
        }
        return [];
    }
    return collectPaintColourValues(norm.paint);
}

export function symbolHasSlotBindings(root: { find: (selector: string) => unknown }): boolean {
    const selectors = [
        "[data-slot-fill]",
        "[data-slot-stroke]",
        "[data-slot]",
    ];
    for (const sel of selectors) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const found = (root as any).find(sel);
        if (found !== null && found !== undefined && (found as { length?: number }).length !== 0) {
            return true;
        }
    }
    return false;
}
