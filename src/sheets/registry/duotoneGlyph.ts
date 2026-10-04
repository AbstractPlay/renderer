import type { Container as SVGContainer, Symbol as SVGSymbol } from "@svgdotjs/svg.js";
import type { SlotMeta } from "./glyphDefinition.js";
import { defineGlyph } from "./defineGlyph.js";
import type { ISheet } from "../ISheet.js";

/** Chess / arimaa duotone: body `fill`, rim/ink `border` (legacy colour2). */
export const DUOTONE_FILL_BORDER_SLOTS: Record<string, SlotMeta> = {
    fill: { channels: ["fill"] },
    border: { channels: ["fill", "stroke"] },
};

/** B1-style token frame: player fill on body, player border on outline stroke only. */
export const DISC_FRAME_SLOTS: Record<string, SlotMeta> = {
    fill: { channels: ["fill"] },
    border: { channels: ["stroke"] },
};

export function registerDuotoneGlyph(
    sheet: ISheet,
    glyphName: string,
    build: (canvas: SVGContainer) => SVGSymbol,
): void {
    defineGlyph(
        sheet.name,
        glyphName,
        {
            slots: DUOTONE_FILL_BORDER_SLOTS,
            colour2Slot: "border",
            build,
        },
        sheet.glyphs,
    );
}

/** Die faces: outline `border`, pips `detail` (legacy colour2); optional face `fill`. */
export const DICE_FACE_SLOTS: Record<string, SlotMeta> = {
    fill: { channels: ["fill"] },
    border: { channels: ["stroke"] },
    detail: { channels: ["fill"], description: "Die face pips." },
};

export function registerDiceGlyph(
    sheet: ISheet,
    glyphName: string,
    build: (canvas: SVGContainer) => SVGSymbol,
): void {
    defineGlyph(
        sheet.name,
        glyphName,
        {
            slots: DICE_FACE_SLOTS,
            colour2Slot: "detail",
            build,
        },
        sheet.glyphs,
    );
}

/** Simple piece outline (disc, hex, shogi wedge, …) — same slot model as core B1 tokens. */
export function registerDiscFrameGlyph(
    sheet: ISheet,
    glyphName: string,
    build: (canvas: SVGContainer) => SVGSymbol,
): void {
    defineGlyph(
        sheet.name,
        glyphName,
        {
            slots: DISC_FRAME_SLOTS,
            colour2Slot: "border",
            build,
        },
        sheet.glyphs,
    );
}
