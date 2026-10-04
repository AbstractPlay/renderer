import { Container as SVGContainer, Symbol as SVGSymbol } from "@svgdotjs/svg.js";
import { defineGlyph } from "../registry/defineGlyph.js";
import { DISC_FRAME_SLOTS } from "../registry/duotoneGlyph.js";
import type { ISheet } from "../ISheet.js";

const sheet: ISheet = {
    name: "nato",
    // tslint:disable-next-line:object-literal-sort-keys
    description: "NATO joint military symbols, for war-type games.",
    cellsize: 100,
    glyphs: new Map<string, (canvas: SVGContainer) => SVGSymbol>(),
};

const FRAME_STROKE = { width: 10, color: "#000", linejoin: "round" } as const;
const MARK_STROKE = { width: 10, color: "#000", linejoin: "round" } as const;
const LABEL_FONT = { anchor: "middle", fill: "#000", size: 100, family: 'Tahoma,"IBM Plex Sans",sans-serif' } as const;

function registerNatoGlyph(glyphName: string, build: (canvas: SVGContainer) => SVGSymbol): void {
    defineGlyph(
        sheet.name,
        glyphName,
        { slots: DISC_FRAME_SLOTS, colour2Slot: "border", build },
        sheet.glyphs,
    );
}

function addNatoFrame(group: ReturnType<SVGContainer["symbol"]>): void {
    group
        .rect(595, 395)
        .move(5, 5)
        .attr("data-slot-fill", "fill")
        .attr("data-slot-stroke", "border")
        .fill({ color: "#fff", opacity: 1 })
        .stroke(FRAME_STROKE);
}

// Alphabetize by glyph name, please!
// The element's root `id` must be the same as its map key.
// If using groups to make complex glyphs, be sure to include the attribute `data-cellsize` (the greater of width and height) so the renderer can scale it properly.

registerNatoGlyph("nato-artillery", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    addNatoFrame(group);
    group
        .circle(170)
        .center(302.5, 202.5)
        .attr("data-slot-fill", "border")
        .fill({ color: "#000" });
    group.viewbox(0, 0, 605, 405);
    return group;
});

registerNatoGlyph("nato-artillery-towed", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    addNatoFrame(group);
    group
        .circle(170)
        .center(302.5, 202.5)
        .attr("data-slot-fill", "border")
        .fill({ color: "#000" });
    const towed = group.group().fill("none");
    towed
        .path("m 224,295 a 31.5,31.5 0 1 1 -63,0 31.5,31.5 0 1 1 63,0 z")
        .attr("data-slot-stroke", "border")
        .stroke(MARK_STROKE);
    towed
        .path("m 439,295 a 31.5,31.5 0 1 1 -63,0 31.5,31.5 0 1 1 63,0 z")
        .attr("data-slot-stroke", "border")
        .stroke(MARK_STROKE);
    towed.path("m 376,295 H 224").attr("data-slot-stroke", "border").stroke(MARK_STROKE);
    group.viewbox(0, 0, 605, 405);
    return group;
});

registerNatoGlyph("nato-cavalry", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    addNatoFrame(group);
    group
        .line(600, 5, 5, 400)
        .stroke(MARK_STROKE)
        .attr("data-slot-stroke", "border");
    group.viewbox(0, 0, 605, 405);
    return group;
});

registerNatoGlyph("nato-cavalry-heavy", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    addNatoFrame(group);
    group
        .line(600, 5, 5, 400)
        .stroke(MARK_STROKE)
        .attr("data-slot-stroke", "border");
    const text = group
        .text("H")
        .font(LABEL_FONT)
        .attr("data-slot-fill", "border")
        .attr("alignment-baseline", "auto")
        .attr("dominant-baseline", "auto");
    text.path("M5,380 L600,380").attr("startOffset", "50%");
    group.viewbox(0, 0, 605, 405);
    return group;
});

registerNatoGlyph("nato-infantry", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    addNatoFrame(group);
    group
        .line(600, 5, 5, 400)
        .stroke(MARK_STROKE)
        .attr("data-slot-stroke", "border");
    group
        .line(5, 5, 600, 400)
        .stroke(MARK_STROKE)
        .attr("data-slot-stroke", "border");
    group.viewbox(0, 0, 605, 405);
    return group;
});

registerNatoGlyph("nato-infantry-light", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    addNatoFrame(group);
    group
        .line(600, 5, 5, 400)
        .stroke(MARK_STROKE)
        .attr("data-slot-stroke", "border");
    group
        .line(5, 5, 600, 400)
        .stroke(MARK_STROKE)
        .attr("data-slot-stroke", "border");
    const text = group
        .text("L")
        .font(LABEL_FONT)
        .attr("data-slot-fill", "border")
        .attr("alignment-baseline", "auto")
        .attr("dominant-baseline", "auto");
    text.path("M5,380 L600,380").attr("startOffset", "50%");
    group.viewbox(0, 0, 605, 405);
    return group;
});

registerNatoGlyph("nato-infantry-special", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    addNatoFrame(group);
    group
        .line(600, 5, 5, 400)
        .stroke(MARK_STROKE)
        .attr("data-slot-stroke", "border");
    group
        .line(5, 5, 600, 400)
        .stroke(MARK_STROKE)
        .attr("data-slot-stroke", "border");
    const text = group
        .text("SOF")
        .font(LABEL_FONT)
        .attr("data-slot-fill", "border")
        .attr("alignment-baseline", "auto")
        .attr("dominant-baseline", "auto");
    // Path is the alphabetic baseline (resvg ignores hanging on textPath). ~y=100 tops caps below the frame.
    text.path("M5,100 L600,100").attr("startOffset", "50%");
    group.viewbox(0, 0, 605, 405);
    return group;
});

export { sheet as NatoSheet };
