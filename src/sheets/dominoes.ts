import { Container as SVGContainer, Symbol as SVGSymbol } from "@svgdotjs/svg.js";
import type { ISheet } from "./ISheet";

const sheet: ISheet = {
    name: "dominoes",
    // tslint:disable-next-line:object-literal-sort-keys
    description: "This contains domino glyphs.",
    cellsize: 100,
    glyphs: new Map<string, (canvas: SVGContainer) => SVGSymbol>(),
};

// Alphabetize by glyph name, please!
// The element's root `id` must be the same as its map key.
// If using groups to make complex glyphs, be sure to include the attribute `data-cellsize` (the greater of width and height) so the renderer can scale it properly.

sheet.glyphs.set("tile-01", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.circle(10)
        .fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(25, 25);
    group.viewbox(0, 0, 50, 50);
    return group;
});

sheet.glyphs.set("tile-02", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(13.5, 13.5);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(36.5, 36.5);
    group.viewbox(0, 0, 50, 50);
    return group;
});

sheet.glyphs.set("tile-03", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(13.5, 13.5);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(25, 25);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(36.5, 36.5);
    group.viewbox(0, 0, 50, 50);
    return group;
});

sheet.glyphs.set("tile-04", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(13.5, 13.5);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(36.5, 36.5);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(36.5, 13.5);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(13.5, 36.5);
    group.viewbox(0, 0, 50, 50);
    return group;
});

sheet.glyphs.set("tile-05", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(13.5, 13.5);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(36.5, 36.5);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(36.5, 13.5);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(13.5, 36.5);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(25, 25);
    group.viewbox(0, 0, 50, 50);
    return group;
});

sheet.glyphs.set("tile-06", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(13.5, 10);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(36.5, 40);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(36.5, 10);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(13.5, 40);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(13.5, 25);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(36.5, 25);
    group.viewbox(0, 0, 50, 50);
    return group;
});

sheet.glyphs.set("tile-07", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 10);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 40);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 10);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 40);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 25);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 25);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(25, 25);
    group.viewbox(0, 0, 50, 50);
    return group;
});

sheet.glyphs.set("tile-08", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 10);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 40);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 10);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 40);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 25);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 25);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(25, 10);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(25, 40);
    group.viewbox(0, 0, 50, 50);
    return group;
});

sheet.glyphs.set("tile-09", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 10);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 40);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 10);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 40);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 25);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 25);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(25, 10);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(25, 25);
    group.circle(10).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(25, 40);
    group.viewbox(0, 0, 50, 50);
    return group;
});

sheet.glyphs.set("tile-10", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 10);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 40);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 10);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 40);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 20);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 30);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 20);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 30);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(25, 10);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(25, 40);
    group.viewbox(0, 0, 50, 50);
    return group;
});

sheet.glyphs.set("tile-11", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 10);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 40);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 10);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 40);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 20);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 30);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 20);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 30);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(25, 10);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(25, 25);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(25, 40);
    group.viewbox(0, 0, 50, 50);
    return group;
});

sheet.glyphs.set("tile-12", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 10);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 40);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 10);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 40);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 20);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 30);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 20);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 30);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(25, 10);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(25, 20);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(25, 30);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(25, 40);
    group.viewbox(0, 0, 50, 50);
    return group;
});

sheet.glyphs.set("tile-13", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(25, 10);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 20);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 30);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 40);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(20, 20);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(20, 30);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(20, 40);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(30, 20);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(30, 30);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(30, 40);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 20);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 30);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 40);
    group.viewbox(0, 0, 50, 50);
    return group;
});

sheet.glyphs.set("tile-14", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(15, 10);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(35, 10);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 20);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 30);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 40);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(20, 20);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(20, 30);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(20, 40);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(30, 20);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(30, 30);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(30, 40);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 20);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 30);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 40);
    group.viewbox(0, 0, 50, 50);
    return group;
});

sheet.glyphs.set("tile-15", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(15, 10);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(25, 10);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(35, 10);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 20);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 30);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 40);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(20, 20);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(20, 30);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(20, 40);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(30, 20);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(30, 30);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(30, 40);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 20);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 30);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(40, 40);
    group.viewbox(0, 0, 50, 50);
    return group;
});

export { sheet as DominoSheet };
