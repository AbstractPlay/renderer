import type { Colour2Slot } from "../../renderers/glyphPaint.js";
import type { SlotMeta } from "./glyphDefinition.js";
import catalogSnapshot from "./glyph-slots.catalog.json" with { type: "json" };

export interface GlyphCatalogEntryInternal {
    sheet: string;
    name: string;
    slots: Record<string, SlotMeta>;
    colour2Slot?: Colour2Slot;
    paintMode?: "proceduralShaded" | "fixed";
    shadingProfile?: string;
}

export interface GlyphCatalogAuthorEntry {
    sheet: string;
    name: string;
    slots: Record<string, Pick<SlotMeta, "description"> & { channels: string[] }>;
}

export interface GlyphCatalogFile {
    version: number;
    generated?: string;
    glyphs: Record<string, GlyphCatalogEntryInternal>;
}

const SHEET_COLOUR2_DEFAULT: Record<string, Colour2Slot> = {
    chess: "border",
    arimaa: "border",
    experimental: "border",
    dice: "detail",
};

const PROCEDURAL_SHADED_GLYPHS = new Set(["orb", "orb1", "orb2", "orb3"]);

function cloneBundledCatalog(): GlyphCatalogFile {
    return structuredClone(catalogSnapshot as GlyphCatalogFile);
}

let catalog: GlyphCatalogFile = cloneBundledCatalog();

export function setGlyphCatalogForTests(next: GlyphCatalogFile): void {
    catalog = next;
}

export function resetGlyphCatalogFromModule(): void {
    catalog = cloneBundledCatalog();
}

/** Re-reads the catalog baked into the bundle (same as reset in browser builds). */
export function reloadGlyphCatalogFromDisk(): void {
    catalog = cloneBundledCatalog();
}

export function getGlyphCatalog(): GlyphCatalogFile {
    return catalog;
}

export function catalogKey(sheet: string, glyphName: string): string {
    return `${sheet}:${glyphName}`;
}

export function defaultColour2Slot(sheet: string, glyphName: string): Colour2Slot {
    if (sheet === "dice" || /^d6-/.test(glyphName)) {
        return "detail";
    }
    return SHEET_COLOUR2_DEFAULT[sheet] ?? "border";
}

export function resolveCatalogEntry(
    glyphName: string,
    sheetSearchOrder: string[],
): GlyphCatalogEntryInternal | undefined {
    for (const sheet of sheetSearchOrder) {
        const hit = catalog.glyphs[catalogKey(sheet, glyphName)];
        if (hit !== undefined) {
            return hit;
        }
    }
    for (const entry of Object.values(catalog.glyphs)) {
        if (entry.name === glyphName) {
            return entry;
        }
    }
    return undefined;
}

export function knownPaintSlotNames(
    glyphName: string,
    sheetSearchOrder: string[],
): string[] {
    const entry = resolveCatalogEntry(glyphName, sheetSearchOrder);
    if (entry === undefined) {
        return [];
    }
    return Object.keys(entry.slots);
}

export function resolveColour2SlotForGlyph(
    glyphName: string,
    sheetSearchOrder: string[],
): Colour2Slot {
    const entry = resolveCatalogEntry(glyphName, sheetSearchOrder);
    if (entry?.colour2Slot !== undefined) {
        return entry.colour2Slot;
    }
    if (entry !== undefined) {
        return defaultColour2Slot(entry.sheet, entry.name);
    }
    for (const sheet of sheetSearchOrder) {
        if (catalog.glyphs[catalogKey(sheet, glyphName)] !== undefined) {
            return defaultColour2Slot(sheet, glyphName);
        }
    }
    return "border";
}

export function proceduralShadingProfile(glyphName: string): string | undefined {
    if (!PROCEDURAL_SHADED_GLYPHS.has(glyphName)) {
        return undefined;
    }
    return glyphName === "orb" ? "orb" : glyphName;
}

const warnedPaintSlots = new Set<string>();

/** Warn once per glyph/slot when legend uses a slot name absent from the catalog. */
export function warnUnknownPaintSlot(
    glyphName: string,
    slot: string,
    knownSlots: string[],
): void {
    if (knownSlots.includes(slot)) {
        return;
    }
    const key = `${glyphName}\0${slot}`;
    if (warnedPaintSlots.has(key)) {
        return;
    }
    warnedPaintSlots.add(key);
    console.warn(
        `[glyphPaint] Unknown paint slot "${slot}" for glyph "${glyphName}" (not listed in glyph-slots catalog).`,
    );
}

export function toAuthorCatalog(catalogFile: GlyphCatalogFile): { version: number; glyphs: Record<string, GlyphCatalogAuthorEntry> } {
    const glyphs: Record<string, GlyphCatalogAuthorEntry> = {};
    for (const [key, entry] of Object.entries(catalogFile.glyphs)) {
        const slots: GlyphCatalogAuthorEntry["slots"] = {};
        for (const [slotName, slot] of Object.entries(entry.slots)) {
            slots[slotName] = {
                channels: [...slot.channels],
                ...(slot.description !== undefined ? { description: slot.description } : {}),
            };
        }
        glyphs[key] = {
            sheet: entry.sheet,
            name: entry.name,
            slots,
        };
    }
    return { version: catalogFile.version, glyphs };
}
