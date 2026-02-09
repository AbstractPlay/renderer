import { Container as SVGContainer, Symbol as SVGSymbol } from "@svgdotjs/svg.js";
import type { ISheet } from "./ISheet";

const sheet: ISheet = {
    name: "dice",
    // tslint:disable-next-line:object-literal-sort-keys
    description: "This contains dice glyphs.",
    cellsize: 100,
    glyphs: new Map<string, (canvas: SVGContainer) => SVGSymbol>(),
};

// Alphabetize by glyph name, please!
// The element's root `id` must be the same as its map key.
// If using groups to make complex glyphs, be sure to include the attribute `data-cellsize` (the greater of width and height) so the renderer can scale it properly.

sheet.glyphs.set("d6-1", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-playerfill", true)
        .attr("data-context-border", true)
        .center(25, 25);
    group.circle(10)
        .fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(25, 25);
    group.viewbox(0, 0, 50, 50);
    return group;
});

sheet.glyphs.set("d6-10", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-context-border", true)
        .attr("data-playerfill", true)
        .center(25, 25);
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

sheet.glyphs.set("d6-11", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-context-border", true)
        .attr("data-playerfill", true)
        .center(25, 25);
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

sheet.glyphs.set("d6-12", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-context-border", true)
        .attr("data-playerfill", true)
        .center(25, 25);
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

sheet.glyphs.set("d6-13", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-context-border", true)
        .attr("data-playerfill", true)
        .center(25, 25);
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

sheet.glyphs.set("d6-14", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-context-border", true)
        .attr("data-playerfill", true)
        .center(25, 25);
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

sheet.glyphs.set("d6-15", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-context-border", true)
        .attr("data-playerfill", true)
        .center(25, 25);
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

sheet.glyphs.set("d6-16", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-context-border", true)
        .attr("data-playerfill", true)
        .center(25, 25);
    group.circle(8).fill("#000")
        .attr("data-context-fill", true)
        .attr("data-playerfill2", true)
        .center(10, 10);
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
        .center(20, 10);
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
        .center(30, 10);
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
        .center(40, 10);
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

sheet.glyphs.set("d6-2", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-playerfill", true)
        .attr("data-context-border", true)
        .center(25, 25);
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

sheet.glyphs.set("d6-3", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-playerfill", true)
        .attr("data-context-border", true)
        .center(25, 25);
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

sheet.glyphs.set("d6-4", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-context-border", true)
        .attr("data-playerfill", true)
        .center(25, 25);
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

sheet.glyphs.set("d6-5", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-context-border", true)
        .attr("data-playerfill", true)
        .center(25, 25);
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

sheet.glyphs.set("d6-6", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-context-border", true)
        .attr("data-playerfill", true)
        .center(25, 25);
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

sheet.glyphs.set("d6-7", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-context-border", true)
        .attr("data-playerfill", true)
        .center(25, 25);
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

sheet.glyphs.set("d6-8", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-context-border", true)
        .attr("data-playerfill", true)
        .center(25, 25);
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

sheet.glyphs.set("d6-9", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-context-border", true)
        .attr("data-playerfill", true)
        .center(25, 25);
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

sheet.glyphs.set("d6-empty", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-context-border", true)
        .attr("data-playerfill", true)
        .center(25, 25);
    group.viewbox(0, 0, 50, 50);
    return group;
});

export { sheet as DiceSheet };
