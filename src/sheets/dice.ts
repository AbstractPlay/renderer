import { Container as SVGContainer, G as SVGG } from "@svgdotjs/svg.js";
import { ISheet } from "./ISheet";

const sheet: ISheet = {
    name: "dice",
    // tslint:disable-next-line:object-literal-sort-keys
    description: "This contains dice glyphs.",
    cellsize: 100,
    glyphs: new Map<string, (canvas: SVGContainer) => SVGG>(),
};

// Alphabetize by glyph name, please!
// The element's root `id` must be the same as its map key.
// If using groups to make complex glyphs, be sure to include the attribute `data-cellsize` (the greater of width and height) so the renderer can scale it properly.

sheet.glyphs.set("d6-1", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("d6-1")
        .attr("data-cellsize", 50);
    group.rect(50, 50).fill("none");
    group.rect(48, 48)
        .radius(10, 10)
        .fill("none")
        .stroke({width: 1, color: "#000"})
        .attr("data-playerfill", true)
        .center(25, 25);
    group.circle(10)
        .fill("#000")
        .center(25, 25);
    return group;
});

sheet.glyphs.set("d6-2", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("d6-2")
        .attr("data-cellsize", 50);
    group.rect(50, 50).fill("none");
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
    return group;
});

sheet.glyphs.set("d6-3", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("d6-3")
        .attr("data-cellsize", 50);
    group.rect(50, 50).fill("none");
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
    return group;
});

sheet.glyphs.set("d6-4", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("d6-4")
        .attr("data-cellsize", 50);
    group.rect(50, 50).fill("none");
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
    return group;
});

sheet.glyphs.set("d6-5", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("d6-5")
        .attr("data-cellsize", 50);
    group.rect(50, 50).fill("none");
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
    return group;
});

sheet.glyphs.set("d6-6", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("d6-6")
        .attr("data-cellsize", 50);
    group.rect(50, 50).fill("none");
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
    return group;
});

export { sheet as DiceSheet };
