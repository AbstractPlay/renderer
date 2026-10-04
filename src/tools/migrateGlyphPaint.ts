import type { Glyph } from "../schemas/schema.js";
import {
    isColourfuncs,
    isGradientPaint,
    normalizeSheetGlyphPaint,
    type NormalizedPaintMap,
    type PaintValue,
} from "../renderers/glyphPaint.js";
import { resolveColour2SlotForGlyph } from "../sheets/registry/glyphRegistry.js";

/** Default sheet search order (matches RendererBase). */
export const DEFAULT_SHEET_SEARCH_ORDER = [
    "core",
    "dice",
    "dominoes",
    "looney",
    "piecepack",
    "chess",
    "streetcar",
    "nato",
    "decktet",
    "arimaa",
    "gnostica",
    "experimental",
] as const;

export interface MigrateGlyphPaintOptions {
    sheetSearchOrder?: readonly string[];
}

export interface GlyphPaintViolation {
    path: string;
    reason: "colour" | "colour2";
}

function isRecord(val: unknown): val is Record<string, unknown> {
    return typeof val === "object" && val !== null && !Array.isArray(val);
}

function isSheetGlyphObject(obj: Record<string, unknown>): boolean {
    return typeof obj.name === "string" && obj.name.length > 0 && !("text" in obj);
}

function isTextGlyphObject(obj: Record<string, unknown>): boolean {
    return typeof obj.text === "string" && obj.text.length > 0;
}

function slotPaintHasOpacity(val: PaintValue): boolean {
    if (isColourfuncs(val) || isGradientPaint(val)) {
        return false;
    }
    return (
        typeof val === "object" &&
        val !== null &&
        !Array.isArray(val) &&
        "opacity" in val &&
        (val as { opacity?: number }).opacity !== undefined
    );
}

function paintToJson(paint: NormalizedPaintMap): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [slot, val] of Object.entries(paint)) {
        if (val !== undefined) {
            out[slot] = val;
        }
    }
    return out;
}

/**
 * Migrate one legend glyph object in place. Returns whether the object changed.
 * Text glyphs and non-glyph objects are untouched.
 */
export function migrateSheetGlyphInPlace(
    obj: Record<string, unknown>,
    sheetSearchOrder: readonly string[],
): boolean {
    if (!isSheetGlyphObject(obj)) {
        return false;
    }
    const hasLegacy = obj.colour !== undefined || obj.colour2 !== undefined;
    if (!hasLegacy) {
        return false;
    }

    const glyph = obj as unknown as Glyph;
    const colour2Slot = resolveColour2SlotForGlyph(String(obj.name), [...sheetSearchOrder]);
    const hadExplicitPaint = obj.paint !== undefined;
    const norm = normalizeSheetGlyphPaint(glyph, colour2Slot);

    obj.paint = paintToJson(norm.paint);
    delete obj.colour;
    delete obj.colour2;

    if (!hadExplicitPaint && obj.opacity !== undefined) {
        const fill = norm.paint.fill;
        if (fill !== undefined && slotPaintHasOpacity(fill)) {
            delete obj.opacity;
        }
    } else if (hadExplicitPaint && norm.layerOpacity !== 1) {
        obj.opacity = norm.layerOpacity;
    }

    return true;
}

function walkGlyphList(
    glyphs: unknown[],
    sheetSearchOrder: readonly string[],
    pathPrefix: string,
    migrate: boolean,
    violations: GlyphPaintViolation[],
): boolean {
    let changed = false;
    glyphs.forEach((item, idx) => {
        if (!isRecord(item)) {
            return;
        }
        const path = `${pathPrefix}[${idx}]`;
        if (isTextGlyphObject(item)) {
            return;
        }
        if (isSheetGlyphObject(item)) {
            if (item.colour !== undefined) {
                violations.push({ path: `${path}.colour`, reason: "colour" });
            }
            if (item.colour2 !== undefined) {
                violations.push({ path: `${path}.colour2`, reason: "colour2" });
            }
            if (migrate) {
                changed = migrateSheetGlyphInPlace(item, sheetSearchOrder) || changed;
            }
            return;
        }
    });
    return changed;
}

function walkIsoFaceDecor(
    decor: Record<string, unknown>,
    sheetSearchOrder: readonly string[],
    pathPrefix: string,
    migrate: boolean,
    violations: GlyphPaintViolation[],
): boolean {
    let changed = false;
    for (const [face, list] of Object.entries(decor)) {
        if (Array.isArray(list)) {
            changed =
                walkGlyphList(list, sheetSearchOrder, `${pathPrefix}.decor.${face}`, migrate, violations) ||
                changed;
        }
    }
    return changed;
}

function walkLegendEntry(
    value: unknown,
    sheetSearchOrder: readonly string[],
    pathPrefix: string,
    migrate: boolean,
    violations: GlyphPaintViolation[],
): boolean {
    if (typeof value === "string" || value === null || value === undefined) {
        return false;
    }
    if (Array.isArray(value)) {
        return walkGlyphList(value, sheetSearchOrder, pathPrefix, migrate, violations);
    }
    if (!isRecord(value)) {
        return false;
    }

    let changed = false;

    if (isSheetGlyphObject(value)) {
        if (value.colour !== undefined) {
            violations.push({ path: `${pathPrefix}.colour`, reason: "colour" });
        }
        if (value.colour2 !== undefined) {
            violations.push({ path: `${pathPrefix}.colour2`, reason: "colour2" });
        }
        if (migrate) {
            changed = migrateSheetGlyphInPlace(value, sheetSearchOrder) || changed;
        }
        return changed;
    }

    if (Array.isArray(value.top)) {
        changed =
            walkGlyphList(value.top, sheetSearchOrder, `${pathPrefix}.top`, migrate, violations) || changed;
    }
    if (isRecord(value.decor)) {
        changed = walkIsoFaceDecor(value.decor, sheetSearchOrder, pathPrefix, migrate, violations) || changed;
    }

    return changed;
}

/**
 * Migrate named legend glyphs under `legend` (and iso face overlays). Does not touch board/marker/area colours.
 */
export function migrateRenderJson(
    rep: Record<string, unknown>,
    options: MigrateGlyphPaintOptions = {},
): { changed: boolean; violations: GlyphPaintViolation[] } {
    const sheetSearchOrder = options.sheetSearchOrder ?? DEFAULT_SHEET_SEARCH_ORDER;
    const violations: GlyphPaintViolation[] = [];
    let changed = false;

    const legend = rep.legend;
    if (!isRecord(legend)) {
        return { changed: false, violations };
    }

    for (const [key, entry] of Object.entries(legend)) {
        changed =
            walkLegendEntry(entry, sheetSearchOrder, `legend.${key}`, true, violations) || changed;
    }

    return { changed, violations: [] };
}

/** Collect legacy colour/colour2 on named legend glyphs without mutating. */
export function findLegendGlyphPaintViolations(
    rep: Record<string, unknown>,
    options: MigrateGlyphPaintOptions = {},
): GlyphPaintViolation[] {
    const sheetSearchOrder = options.sheetSearchOrder ?? DEFAULT_SHEET_SEARCH_ORDER;
    const violations: GlyphPaintViolation[] = [];
    const legend = rep.legend;
    if (!isRecord(legend)) {
        return violations;
    }
    for (const [key, entry] of Object.entries(legend)) {
        walkLegendEntry(entry, sheetSearchOrder, `legend.${key}`, false, violations);
    }
    return violations;
}

export interface PlaygroundCatalogEntry {
    name?: string;
    description?: string;
    render: string;
}

export function migratePlaygroundCatalogEntry(
    entry: PlaygroundCatalogEntry,
    options: MigrateGlyphPaintOptions = {},
): { changed: boolean; render: string; violations: GlyphPaintViolation[] } {
    const rep = JSON.parse(entry.render) as Record<string, unknown>;
    const before = findLegendGlyphPaintViolations(rep, options);
    const { changed } = migrateRenderJson(rep, options);
    return {
        changed,
        render: JSON.stringify(rep),
        violations: before,
    };
}
