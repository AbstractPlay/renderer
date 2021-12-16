import { Container as SVGContainer, Symbol as SVGSymbol } from "@svgdotjs/svg.js";
import { ISheet } from "./ISheet";

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
    const group = canvas.symbol()
        .id("d6-1");
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-playerfill", true)
        .center(25, 25);
    group.circle(10)
        .fill("#000")
        .center(25, 25);
    group.viewbox(0, 0, 50, 50);
    return group;
});

sheet.glyphs.set("d6-2", (canvas: SVGContainer) => {
    const group = canvas.symbol()
        .id("d6-2");
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-playerfill", true)
        .center(25, 25);
    group.circle(10).fill("#000")
        .center(13.5, 13.5);
    group.circle(10).fill("#000")
        .center(36.5, 36.5);
    group.viewbox(0, 0, 50, 50);
    return group;
});

sheet.glyphs.set("d6-3", (canvas: SVGContainer) => {
    const group = canvas.symbol()
        .id("d6-3");
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-playerfill", true)
        .center(25, 25);
    group.circle(10).fill("#000")
        .center(13.5, 13.5);
    group.circle(10).fill("#000")
        .center(25, 25);
    group.circle(10).fill("#000")
        .center(36.5, 36.5);
    group.viewbox(0, 0, 50, 50);
    return group;
});

sheet.glyphs.set("d6-4", (canvas: SVGContainer) => {
    const group = canvas.symbol()
        .id("d6-4");
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-playerfill", true)
        .center(25, 25);
    group.circle(10).fill("#000")
        .center(13.5, 13.5);
    group.circle(10).fill("#000")
        .center(36.5, 36.5);
    group.circle(10).fill("#000")
        .center(36.5, 13.5);
    group.circle(10).fill("#000")
        .center(13.5, 36.5);
    group.viewbox(0, 0, 50, 50);
    return group;
});

sheet.glyphs.set("d6-5", (canvas: SVGContainer) => {
    const group = canvas.symbol()
        .id("d6-5");
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-playerfill", true)
        .center(25, 25);
    group.circle(10).fill("#000")
        .center(13.5, 13.5);
    group.circle(10).fill("#000")
        .center(36.5, 36.5);
    group.circle(10).fill("#000")
        .center(36.5, 13.5);
    group.circle(10).fill("#000")
        .center(13.5, 36.5);
    group.circle(10).fill("#000")
        .center(25, 25);
    group.viewbox(0, 0, 50, 50);
    return group;
});

sheet.glyphs.set("d6-6", (canvas: SVGContainer) => {
    const group = canvas.symbol()
        .id("d6-6");
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-playerfill", true)
        .center(25, 25);
    group.circle(10).fill("#000")
        .center(13.5, 10);
    group.circle(10).fill("#000")
        .center(36.5, 40);
    group.circle(10).fill("#000")
        .center(36.5, 10);
    group.circle(10).fill("#000")
        .center(13.5, 40);
    group.circle(10).fill("#000")
        .center(13.5, 25);
    group.circle(10).fill("#000")
        .center(36.5, 25);
    group.viewbox(0, 0, 50, 50);
    return group;
});

export { sheet as DiceSheet };
