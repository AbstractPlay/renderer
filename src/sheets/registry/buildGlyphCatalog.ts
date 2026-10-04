import { registerWindow, SVG, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import type { GlyphCatalogFile, GlyphCatalogEntryInternal } from "./glyphRegistry.js";
import {
    catalogKey,
    defaultColour2Slot,
    proceduralShadingProfile,
} from "./glyphRegistry.js";
import type { ISheet } from "../ISheet.js";
import { sheets } from "../index.js";
import { getGlyphDefinitionMeta, invokeGlyphBuild, normalizeSheetGlyphEntry } from "./defineGlyph.js";
import { inferSlotsFromSymbol, mergeExplicitSlots } from "./inferSlots.js";
import type { SlotMeta } from "./glyphDefinition.js";

const SLOT_DESCRIPTIONS: Record<string, string> = {
    fill: "Primary player colour (body or main silhouette).",
    border: "Secondary outline, rim, or theme border band.",
    detail: "Interior accent, ink, or pips (not the outer rim).",
    target: "Fixed target ring (plane engine cowlings; default brown unless paint.target is set).",
};

function enrichSlotDescriptions(slots: Record<string, SlotMeta>): Record<string, SlotMeta> {
    const out: Record<string, SlotMeta> = {};
    for (const [name, meta] of Object.entries(slots)) {
        out[name] = {
            channels: meta.channels,
            description: meta.description ?? SLOT_DESCRIPTIONS[name],
        };
    }
    return out;
}

export function buildGlyphCatalogFromSheets(allSheets: Map<string, ISheet> = sheets): GlyphCatalogFile {
    const window = createSVGWindow();
    const document = window.document;
    registerWindow(window, document);
    const canvas = SVG(document.documentElement) as Svg;

    const glyphs: Record<string, GlyphCatalogEntryInternal> = {};

    for (const sheet of allSheets.values()) {
        for (const [glyphName, entry] of sheet.glyphs.entries()) {
            const { build, meta: inlineMeta } = normalizeSheetGlyphEntry(entry as never);
            const registeredMeta = getGlyphDefinitionMeta(sheet.name, glyphName);
            const meta = registeredMeta ?? inlineMeta;

            const colour2Slot = meta?.colour2Slot ?? defaultColour2Slot(sheet.name, glyphName);
            const symbol = invokeGlyphBuild(build, canvas.defs() as Svg);
            let slots: Record<string, SlotMeta>;
            if (meta?.paintMode === "fixed") {
                slots = {};
            } else {
                slots = inferSlotsFromSymbol(symbol, colour2Slot);
                slots = mergeExplicitSlots(slots, meta?.slots);
            }
            slots = enrichSlotDescriptions(slots);

            const profile = meta?.shadingProfile ?? proceduralShadingProfile(glyphName);
            const paintMode = meta?.paintMode ?? (profile !== undefined ? "proceduralShaded" as const : undefined);

            const catalogEntry: GlyphCatalogEntryInternal = {
                sheet: sheet.name,
                name: glyphName,
                slots,
                ...(meta?.paintMode !== "fixed" ? { colour2Slot } : {}),
                ...(paintMode !== undefined ? { paintMode } : {}),
                ...(profile !== undefined ? { shadingProfile: profile } : {}),
            };
            glyphs[catalogKey(sheet.name, glyphName)] = catalogEntry;
        }
    }

    return {
        version: 1,
        generated: new Date().toISOString(),
        glyphs,
    };
}

export function renderGlyphSlotsMarkdown(catalog: GlyphCatalogFile): string {
    const lines: string[] = [
        "# Glyph paint slots",
        "",
        "Author reference for legend **`paint`** on sheet glyphs (`name`). Text glyphs use **`colour`** only.",
        "",
        "Regenerate with `npm run glyph-catalog`. Machine-readable author JSON: `build/glyph-slots-author.json`.",
        "",
        "| Sheet | Glyph | Slots | Notes |",
        "| --- | --- | --- | --- |",
    ];

    const keys = Object.keys(catalog.glyphs).sort();
    for (const key of keys) {
        const entry = catalog.glyphs[key]!;
        const slotList = Object.entries(entry.slots)
            .map(([n, s]) => `${n} (${s.channels.join("+")})`)
            .join(", ");
        const notes: string[] = [];
        if (entry.paintMode === "proceduralShaded") {
            notes.push("shaded sphere (set `paint.fill` only)");
        }
        if (entry.paintMode === "fixed") {
            notes.push("fixed colours (`paint` ignored)");
        }
        lines.push(`| ${entry.sheet} | \`${entry.name}\` | ${slotList} | ${notes.join("; ") || "—"} |`);
    }
    lines.push("");
    return lines.join("\n");
}
