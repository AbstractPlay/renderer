import type { Element as SVGElement, Gradient as SVGGradient, Symbol as SVGSymbol } from "@svgdotjs/svg.js";
import type { Colourfuncs, ColourResolvable, FunctionBestContrast, Glyph, Gradient, SheetGlyph, TextGlyph } from "../schemas/schema.js";
import { x2uid } from "../common/glyph2uid.js";
import { warnUnknownPaintSlot } from "../sheets/registry/glyphRegistry.js";

type ResolvedFill = string | SVGGradient | SVGElement;

/**
 * Schema `colourfuncs` are objects with a string `func` discriminator (`$defs/colourfuncs`).
 * No per-function allowlist — new schema funcs are recognized automatically.
 */
export function isColourfuncs(val: unknown): val is Colourfuncs {
    if (typeof val !== "object" || val === null || Array.isArray(val)) {
        return false;
    }
    if (isGradientPaint(val)) {
        return false;
    }
    const func = (val as { func?: unknown }).func;
    return typeof func === "string";
}

/** Linear/radial gradient paint value (not a slot wrapper). */
export function isGradientPaint(val: unknown): val is Gradient {
    return typeof val === "object" && val !== null && !Array.isArray(val) && "stops" in val;
}

/** Default mapping for legacy colour2 / data-playerfill2 during transition. */
export type Colour2Slot = "border" | "detail";

export type PaintValue = ColourResolvable | Gradient | SlotPaintObject | "auto";

/** Font size used when building text glyph symbols (see RendererBase composite loop). */
export const TEXT_GLYPH_BASE_FONT_SIZE = 17;

/** Outline stroke width as a fraction of {@link TEXT_GLYPH_BASE_FONT_SIZE}. */
export const TEXT_GLYPH_OUTLINE_STROKE_WIDTH_RATIO = 2 / 17;

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
    if (typeof val !== "object" || val === null || Array.isArray(val)) {
        return false;
    }
    if (isColourfuncs(val) || isGradientPaint(val)) {
        return false;
    }
    return "colour" in val || "opacity" in val;
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

export function isTextPaintBorderAuto(entry: unknown): entry is "auto" {
    return entry === "auto";
}

/** Text legend layers — same opacity rules as sheet glyphs (no colour2). */
export function normalizeTextGlyphPaint(g: TextGlyph): NormalizedSheetGlyph {
    const hasExplicitPaint = g.paint !== undefined;
    const paint: NormalizedPaintMap = hasExplicitPaint ? { ...g.paint } : {};
    if (g.colour !== undefined && paint.fill === undefined) {
        paint.fill = g.colour;
    }

    let layerOpacity = 1;
    if (g.opacity !== undefined) {
        if (hasExplicitPaint) {
            layerOpacity = g.opacity;
        } else {
            const existingFill = paint.fill;
            if (existingFill === undefined) {
                paint.fill = { opacity: g.opacity };
            } else if (isColourfuncs(existingFill) || isGradientPaint(existingFill)) {
                paint.fill = { colour: existingFill, opacity: g.opacity };
            } else if (isSlotPaintObject(existingFill)) {
                paint.fill = { ...existingFill, opacity: g.opacity };
            } else {
                paint.fill = { colour: existingFill, opacity: g.opacity };
            }
        }
    }
    return { paint, layerOpacity };
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
            } else if (isColourfuncs(existingFill) || isGradientPaint(existingFill)) {
                paint.fill = { colour: existingFill, opacity: g.opacity };
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
    if (isTextPaintBorderAuto(entry)) {
        return undefined;
    }
    if (isColourfuncs(entry) || isGradientPaint(entry)) {
        return entry;
    }
    if (typeof entry === "number" || typeof entry === "string") {
        return entry;
    }
    if (isSlotPaintObject(entry)) {
        return entry.colour;
    }
    return undefined;
}

export function paintSlotOpacity(entry: PaintValue): number {
    if (isTextPaintBorderAuto(entry)) {
        return 1;
    }
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
        } else if (isTextGlyph(prev)) {
            const norm = normalizeTextGlyphPaint(prev);
            const fill = norm.paint.fill;
            if (fill !== undefined) {
                const c = paintColourValue(fill);
                if (c !== undefined) {
                    return resolveColour(c as ColourResolvable | Gradient | Colourfuncs, contextBackground) as string;
                }
            }
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

function applyPresentationFillOpacity(el: SVGElement, opacity: number): void {
    const node = el.node as Element | undefined;
    if (node !== undefined && typeof node.setAttribute === "function") {
        node.setAttribute("fill-opacity", String(opacity));
    }
}

/** Legacy fill-slot opacity with no colour: tint authored fill on fill-channel bindings only. */
export function applyFillSlotFillChannelOpacity(
    got: SVGSymbol,
    slot: string,
    opacity: number,
    colour2Slot: Colour2Slot = "border",
): void {
    const { fill: fillSels } = findBindings(slot, colour2Slot);
    for (const sel of fillSels) {
        if (sel.startsWith("[data-playerfill") || sel.startsWith("[data-context-border-fill")) {
            continue;
        }
        got.find(sel).each(function (this: SVGElement) {
            applyPresentationFillOpacity(this, opacity);
        });
    }
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
        const slotOpacity = paintSlotOpacity(entry);
        const opacityOnly =
            colourVal === undefined &&
            !isColourfuncs(entry) &&
            !isGradientPaint(entry) &&
            isSlotPaintObject(entry) &&
            entry.opacity !== undefined;

        if (colourVal === undefined && !opacityOnly) {
            continue;
        }

        if (opacityOnly) {
            if (opts.slotted) {
                applyFillSlotFillChannelOpacity(got, slot, slotOpacity, opts.colour2Slot);
            } else {
                const legacySuffix = legacyFillSuffixForSlot(slot, opts.colour2Slot);
                if (legacySuffix !== null) {
                    got.find(`[data-playerfill${legacySuffix}=true]`).each(function (this: SVGElement) {
                        applyPresentationFillOpacity(this, slotOpacity);
                    });
                }
            }
            continue;
        }

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
    isPatternSVGElement: (fill: ResolvedFill) => boolean;
    contextBackground: string;
}

function bestContrastFillColour(
    bg: string,
    resolveColour: TextGlyphFillContext["resolveColour"],
): string {
    const func: FunctionBestContrast = {
        func: "bestContrast",
        bg,
        fg: ["#000", "#fff"],
    };
    return resolveColour(func, "#000") as string;
}

function oppositeContrastHex(
    fillHex: string,
    resolveColour: TextGlyphFillContext["resolveColour"],
): string {
    const lower = fillHex.toLowerCase();
    if (lower === "#fff" || lower === "#ffffff") {
        return "#000";
    }
    if (lower === "#000" || lower === "#000000") {
        return "#fff";
    }
    return bestContrastFillColour(fillHex, resolveColour);
}

function resolvedFillToString(fill: ResolvedFill): string | undefined {
    if (typeof fill === "string") {
        return fill;
    }
    return undefined;
}

function applyTextElementFill(
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

function applyTextElementStroke(
    el: SVGElement,
    stroke: ResolvedFill,
    opacity: number,
    strokeWidth: number,
    isPattern: (f: ResolvedFill) => boolean,
): void {
    const node = el.node as Element | undefined;
    if (node !== undefined && typeof node.setAttribute === "function") {
        node.setAttribute("stroke-linejoin", "round");
        node.setAttribute("paint-order", "stroke fill");
        node.setAttribute("stroke-width", String(strokeWidth));
    }
    if (isPattern(stroke)) {
        // @ts-expect-error (poor SVGjs typing)
        el.stroke(stroke);
        if (opacity < 1) {
            el.opacity(opacity);
        }
        return;
    }
    if (typeof stroke === "object") {
        // @ts-expect-error (poor SVGjs typing)
        el.stroke(stroke);
        return;
    }
    el.stroke({ color: stroke, opacity });
}

/** Text glyph fill/stroke; layer opacity is applied on the placed `<use>`, not here. */
export function applyTextGlyphFill(
    got: SVGSymbol,
    g: Glyph,
    glyphs: Glyph[],
    idx: number,
    ctx: TextGlyphFillContext,
    opts?: { fontSize?: number },
): void {
    if (!isTextGlyph(g)) {
        return;
    }
    const fontSize = opts?.fontSize ?? TEXT_GLYPH_BASE_FONT_SIZE;
    const strokeWidth = fontSize * TEXT_GLYPH_OUTLINE_STROKE_WIDTH_RATIO;
    const norm = normalizeTextGlyphPaint(g);
    const hasExplicitPaint = g.paint !== undefined;
    const borderEntry = norm.paint.border;
    const fillEntry = norm.paint.fill;
    const bg = priorCompositeLayerTint(glyphs, idx, ctx.resolveColour, ctx.contextBackground);

    const autoContrastTriple =
        hasExplicitPaint &&
        g.colour === undefined &&
        fillEntry === undefined &&
        isTextPaintBorderAuto(borderEntry);
    const noPaintNoColour = !hasExplicitPaint && g.colour === undefined;

    const isPattern = ctx.isPatternSVGElement;

    let outlineStroke: ResolvedFill | undefined;
    let outlineStrokeOpacity = 1;
    let fillOnly: ResolvedFill | undefined;
    let fillOnlyOpacity = 1;

    if (noPaintNoColour || autoContrastTriple) {
        const contrast = bestContrastFillColour(bg, ctx.resolveColour);
        fillOnly = contrast;
        fillOnlyOpacity = 1;
        if (isTextPaintBorderAuto(borderEntry)) {
            outlineStroke = oppositeContrastHex(contrast, ctx.resolveColour);
            outlineStrokeOpacity = 1;
            fillOnly = contrast;
        }
    } else {
        if (fillEntry !== undefined) {
            const colourVal = paintColourValue(fillEntry);
            if (colourVal !== undefined) {
                fillOnly = ctx.resolveFill(
                    colourVal as number | string | Gradient | Colourfuncs,
                    "#000",
                );
                fillOnlyOpacity = paintSlotOpacity(fillEntry);
            } else if (isSlotPaintObject(fillEntry) && fillEntry.opacity !== undefined && fillEntry.colour === undefined) {
                fillOnlyOpacity = fillEntry.opacity;
            }
        }
        if (borderEntry !== undefined) {
            if (isTextPaintBorderAuto(borderEntry)) {
                let fillHex =
                    fillOnly !== undefined
                        ? resolvedFillToString(fillOnly)
                        : undefined;
                if (fillHex === undefined) {
                    fillHex = bestContrastFillColour(bg, ctx.resolveColour);
                    if (fillOnly === undefined) {
                        fillOnly = fillHex;
                        fillOnlyOpacity = 1;
                    }
                }
                outlineStroke = oppositeContrastHex(fillHex, ctx.resolveColour);
                outlineStrokeOpacity = 1;
            } else {
                const borderVal = paintColourValue(borderEntry);
                if (borderVal !== undefined) {
                    outlineStroke = ctx.resolveFill(
                        borderVal as number | string | Gradient | Colourfuncs,
                        "#000",
                    );
                    outlineStrokeOpacity = paintSlotOpacity(borderEntry);
                }
            }
        }
    }

    if (outlineStroke !== undefined && fillOnly !== undefined) {
        got.find("text").each(function (this: SVGElement) {
            applyTextElementStroke(this, outlineStroke!, outlineStrokeOpacity, strokeWidth, isPattern);
            applyTextElementFill(this, fillOnly!, fillOnlyOpacity, isPattern);
        });
        return;
    }

    if (outlineStroke !== undefined && fillOnly === undefined) {
        got.find("text").each(function (this: SVGElement) {
            applyTextElementStroke(this, outlineStroke!, outlineStrokeOpacity, strokeWidth, isPattern);
        });
        return;
    }

    if (fillOnly !== undefined) {
        if (typeof fillOnly === "string" && !isPattern(fillOnly)) {
            ctx.applyPlayerFillTargets(got, "", fillOnly, fillOnlyOpacity);
            return;
        }
        got.find("text").each(function (this: SVGElement) {
            applyTextElementFill(this, fillOnly!, fillOnlyOpacity, isPattern);
        });
    }
}

export function collectPatternsFromGlyphPaint(g: Glyph): Array<number | string | Gradient | Colourfuncs | undefined> {
    if (isTextGlyph(g)) {
        return collectPaintColourValues(normalizeTextGlyphPaint(g).paint);
    }
    const norm = normalizeGlyphPaint(g);
    if (norm === undefined) {
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
