import { Container as SVGContainer, G as SVGG } from "@svgdotjs/svg.js";
import { ISheet } from "./ISheet";

const sheet: ISheet = {
    name: "core",
    // tslint:disable-next-line:object-literal-sort-keys
    description: "This is the base contact sheet containing the default versions of all graphics used by Abstract Play.",
    cellsize: 100,
    glyphs: new Map<string, (canvas: SVGContainer) => SVGG>(),
};

// Alphabetize by glyph name, please!
// The element's root `id` must be the same as its map key.
// If using groups to make complex glyphs, be sure to include the attribute `data-cellsize` (the greater of width and height) so the renderer can scale it properly.

sheet.glyphs.set("cannon-piece", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("cannon-piece")
        .attr("data-cellsize", 9.26039);
    group.rect(9.26039, 9.26039).fill({opacity: 0});
    group.path("m 78.838853,129.34362 q 0.206705,0.20671 -0.124023,0.20671 -1.157549,1.03352 -2.893871,1.6123 l -0.578775,-0.95085 q 1.694982,-0.45475 2.893871,-1.48827 z m 4.175442,-6.49054 q 0.08268,0.20671 -0.289387,0.0827 -2.315097,0.24805 -4.960922,0.45475 l 0.04134,1.24024 h 5.70506 v 0.78547 H 81.56736 v 1.98437 h 2.604483 v 0.90951 h -9.260387 v -0.90951 h 2.149733 l -0.206705,-5.0436 0.950843,0.28939 q 2.521802,-0.33073 4.506171,-0.7028 z m -2.273756,4.54751 v -1.98437 h -2.893871 l 0.08268,1.98437 z m 0.248046,1.32292 q 1.157549,0.95084 3.100576,1.44693 l -0.454751,0.95084 q -1.860345,-0.45475 -3.26594,-1.69498 z")
        .translate(-74.911, -121.944)
        .attr("data-playerfill", true)
        .stroke({width: 0})
        .fill("#000");
    return group;
});

sheet.glyphs.set("cannon-town", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("cannon-town")
        .attr("data-cellsize", 9.13636);
    group.rect(9.13636, 9.13636).fill({opacity: 0});
    group.path("m 85.389067,111.12552 v 4.87824 h -0.826821 v -0.2067 h -2.149732 v 1.11621 h 3.224599 v 0.78548 h -3.224599 v 1.24023 h 4.175442 v 0.78548 h -9.136364 v -0.78548 h 4.134101 v -1.24023 h -3.224599 v -0.78548 h 3.224599 v -1.11621 H 79.43596 v 0.37207 h -0.82682 v -5.04361 z m -3.803374,1.94303 V 111.911 H 79.43596 v 1.15755 z m 2.976553,0 V 111.911 h -2.149732 v 1.15755 z m -2.976553,1.94303 v -1.15755 H 79.43596 v 1.15755 z m 2.976553,-1.15755 h -2.149732 v 1.15755 h 2.149732 z")
        .translate(-77.452, -110.857)
        .attr("data-playerfill", true)
        .stroke({width: 0})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piece", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piece")
        .attr("data-cellsize", sheet.cellsize);
    const border = 5;
    group.rect(sheet.cellsize, sheet.cellsize).fill({opacity: 0});
    group.circle(sheet.cellsize - border)
        .attr("data-playerfill", true)
        .fill("#fff")
        .stroke({width: border, color: "#000"})
        .center(sheet.cellsize / 2, sheet.cellsize / 2);
    return group;
});

sheet.glyphs.set("piece-chariot", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piece-chariot")
        .attr("data-cellsize", sheet.cellsize);
    const border = 5;
    group.rect(sheet.cellsize, sheet.cellsize).fill({opacity: 0});
    group.circle(sheet.cellsize - border)
        .attr("data-playerfill", true)
        .fill("#fff")
        .stroke({width: border, color: "#000"})
        .center(sheet.cellsize / 2, sheet.cellsize / 2);
    group.circle(sheet.cellsize * 0.7)
        .fill("none")
        .stroke({width: border * 2, color: "#000"})
        .center(sheet.cellsize / 2, sheet.cellsize / 2);
    group.circle (border * 2)
        .fill("none")
        .stroke({width: border / 4, color: "#000"})
        .center(sheet.cellsize / 2, sheet.cellsize / 2);
    return group;
});

sheet.glyphs.set("piece-horse", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piece-horse")
        .attr("data-cellsize", sheet.cellsize);
    const border = 5;
    group.rect(sheet.cellsize, sheet.cellsize).fill({opacity: 0});
    group.circle(sheet.cellsize - border)
        .attr("data-playerfill", true)
        .fill("#fff")
        .stroke({width: border, color: "#000"})
        .center(sheet.cellsize / 2, sheet.cellsize / 2);
    group.circle(sheet.cellsize * 0.7)
        .fill("none")
        .stroke({width: border * 2, color: "#000", dasharray: "10"})
        .center(sheet.cellsize / 2, sheet.cellsize / 2);
    return group;
});

sheet.glyphs.set("piece-square", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piece-square")
        .attr("data-cellsize", sheet.cellsize);
    group.rect(sheet.cellsize, sheet.cellsize)
        .attr("data-playerfill", true)
        .fill("#fff")
        .stroke({width: 2, color: "#000"})
        .center(sheet.cellsize / 2, sheet.cellsize / 2);
    return group;
});

export { sheet as CoreSheet };
