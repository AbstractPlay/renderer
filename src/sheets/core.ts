import svg from "svg.js";
import { ISheet } from "../ISheet";

const sheet: ISheet = {
    name: "core",
    // tslint:disable-next-line:object-literal-sort-keys
    description: "This is the base contact sheet containing the default versions of all graphics used by Abstract Play.",
    cellsize: 100,
    glyphs: new Map<string, (canvas: svg.Nested) => svg.Element | svg.Container>(),
};

// Alphabetize by glyph name, please!
// The element's root `id` must be the same as its map key.
// If using groups to make complex glyphs, be sure to include the attribute `data-cellsize` (the greater of width and height) so the renderer can scale it properly.

sheet.glyphs.set("piece", (canvas: svg.Nested) => {
    const group = canvas.group()
        .id("piece")
        .attr("data-cellsize", sheet.cellsize);
    group.circle(sheet.cellsize)
        .fill({color: "#000", opacity: 0});
    group.circle(sheet.cellsize - (sheet.cellsize * 0.15))
        .attr("data-playerfill", true)
        .fill("#fff")
        .stroke({width: 2, color: "#000"})
        .center(sheet.cellsize / 2, sheet.cellsize / 2);
    return group;
});

sheet.glyphs.set("tileDark", (canvas: svg.Nested) => {
    return canvas.rect(sheet.cellsize, sheet.cellsize)
        .id("tileDark")
        .fill({color: "#000", opacity: 0.4});
        // .stroke({width: 1, color: "#000"});
});

sheet.glyphs.set("tileLight", (canvas: svg.Nested) => {
    return canvas.rect(sheet.cellsize, sheet.cellsize)
        .id("tileLight")
        .fill({color: "#000", opacity: 0});
        // .stroke({width: 1, color: "#000"});
});

export { sheet as CoreSheet };
