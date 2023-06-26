import { Container as SVGContainer, Symbol as SVGSymbol } from "@svgdotjs/svg.js";
import { ISheet } from "./ISheet";

const sheet: ISheet = {
    name: "looney",
    // tslint:disable-next-line:object-literal-sort-keys
    description: "This sheet contains Looney pyramids of different sizes and orientations.",
    cellsize: 100,
    glyphs: new Map<string, (canvas: SVGContainer) => SVGSymbol>(),
};

// Alphabetize by glyph name, please!
// The element's root `id` must be the same as its map key.
// If using groups to make complex glyphs, be sure to include the attribute `data-cellsize` (the greater of width and height) so the renderer can scale it properly.

/*
    Dimensional notes:

    - Large: 1" base, 1.75" height; ratio 1.75 h/w
    - Medium: 25/32" (0.78125") base, 1-3/8" (1.375") height; ratio 1.76 h/w
    - Small: 9/16" (0.5625") base, 1" height; ratio 1.78 h/w
*/

const pipWidth = 10;
const pipHeight = 20;
const pipOpacity = 0.75;
const strokeWeight = 2;
const strokeOpacity = 0.5;
const cellsize = 180;
const halfcell = cellsize / 2;
const upCellsize = 100;
const upHalfcell = upCellsize / 2;

const vstrokeIn = 5;
const vstrokeOut = 8;
const vheight3 = 50;
const vwidth3 = vheight3 / 2;
const vbottom3 = 50 / 3;
const vheight2 = vheight3 * 2 / 3;
const vwidth2 = vheight2 / 2;
// vbottom + vheight = vbottom3 + vheight3
const vbottom2 = vbottom3 + vheight3 - vheight2;
const vheight1 = vheight3 * 1 / 3;
const vwidth1 = vheight1 / 2;
const vbottom1 = vbottom3 + vheight3 - vheight1;

// set vbottom1 = 50
// we also want vbottomn + vheightn = vbottom3 + vheight3
// and vheight3 = 50
// so vbottom1 + vheight1 = 50 + vheigth3 / 3 = vbottom3 + vheight3 => vbottom3 = 50 - 2/3 * vheight3 = 50 / 3
// vbottom1 = 25 + 50 - 16.66666666666667 = 58.33333333333333
// vbottom1 - vbottom2 = vheight2 - vheight1 = vheight3 / 3 = 16.66666666666667

sheet.glyphs.set("pyramid-flat-large", (canvas: SVGContainer) => {
    const height = 175;
    const base = 100;
    const group = canvas.symbol();
    group.polygon(`${halfcell},${halfcell - height / 2} ${(halfcell) - (base / 2)},${halfcell + height / 2} ${(halfcell) + (base / 2)},${halfcell + height / 2}`)
        .attr("data-playerfill", true)
        .stroke({width: strokeWeight, color: "#000", opacity: strokeOpacity})
        .fill("#fff");
    const xStart = halfcell - (base / 2) + (pipWidth * 1.25);
    const xOffset = pipWidth * 1.5;
    const y = halfcell + (height / 2) - (pipHeight / 2);
    group.circle(pipWidth, pipHeight)
        .fill("#000")
        .opacity(pipOpacity)
        .center(xStart, y);
    group.circle(pipWidth, pipHeight)
        .fill("#000")
        .opacity(pipOpacity)
        .center(xStart + xOffset, y);
    group.circle(pipWidth, pipHeight)
        .fill("#000")
        .opacity(pipOpacity)
        .center(xStart + (xOffset * 2), y);
    group.viewbox(0, 0, cellsize, cellsize);
    return group;
});

sheet.glyphs.set("pyramid-flat-medium", (canvas: SVGContainer) => {
    const height = 137.5;
    const base = 78.125;
    const group = canvas.symbol();
    group.polygon(`${halfcell},${halfcell - height / 2} ${(halfcell) - (base / 2)},${halfcell + height / 2} ${(halfcell) + (base / 2)},${halfcell + height / 2}`)
        .attr("data-playerfill", true)
        .stroke({width: strokeWeight, color: "#000", opacity: strokeOpacity})
        .fill("#fff");
    const xStart = halfcell - (base / 2) + (pipWidth * 1.25);
    const xOffset = pipWidth * 1.5;
    const y = halfcell + (height / 2) - (pipHeight / 2);
    group.circle(pipWidth, pipHeight)
        .fill("#000")
        .opacity(pipOpacity)
        .center(xStart, y);
    group.circle(pipWidth, pipHeight)
        .fill("#000")
        .opacity(pipOpacity)
        .center(xStart + xOffset, y);
    group.viewbox(0, 0, cellsize, cellsize);
    return group;
});

sheet.glyphs.set("pyramid-flat-small", (canvas: SVGContainer) => {
    const height = 100;
    const base = 56.25;
    const group = canvas.symbol();
    group.polygon(`${halfcell},${halfcell - height / 2} ${(halfcell) - (base / 2)},${halfcell + height / 2} ${(halfcell) + (base / 2)},${halfcell + height / 2}`)
        .attr("data-playerfill", true)
        .stroke({width: strokeWeight, color: "#000", opacity: strokeOpacity})
        .fill("#fff");
    const xStart = halfcell - (base / 2) + (pipWidth * 1.25);
    const y = halfcell + (height / 2) - (pipHeight / 2);
    group.circle(pipWidth, pipHeight)
        .fill("#000")
        .opacity(pipOpacity)
        .center(xStart, y);
    group.viewbox(0, 0, cellsize, cellsize);
    return group;
});

// "Flattened" pyramids are simply aligned with the bottom of the sheet instead of the centre
sheet.glyphs.set("pyramid-flattened-large", (canvas: SVGContainer) => {
    const height = 175;
    const base = 100;
    const group = canvas.symbol();
    const tri = group.group();
    tri.polygon(`${halfcell},${halfcell - height / 2} ${(halfcell) - (base / 2)},${halfcell + height / 2} ${(halfcell) + (base / 2)},${halfcell + height / 2}`)
        .attr("data-playerfill", true)
        .stroke({width: strokeWeight, color: "#000", opacity: strokeOpacity})
        .fill("#fff");
    const xStart = halfcell - (base / 2) + (pipWidth * 1.25);
    const xOffset = pipWidth * 1.5;
    const y = halfcell + (height / 2) - (pipHeight / 2);
    tri.circle(pipWidth, pipHeight)
        .fill("#000")
        .opacity(pipOpacity)
        .center(xStart, y);
    tri.circle(pipWidth, pipHeight)
        .fill("#000")
        .opacity(pipOpacity)
        .center(xStart + xOffset, y);
    tri.circle(pipWidth, pipHeight)
        .fill("#000")
        .opacity(pipOpacity)
        .center(xStart + (xOffset * 2), y);
    group.viewbox(0, ((cellsize - (halfcell + height / 2)) * -1) + 1, cellsize, cellsize);
    return group;
});

sheet.glyphs.set("pyramid-flattened-medium", (canvas: SVGContainer) => {
    const height = 137.5;
    const base = 78.125;
    const group = canvas.symbol();
    const tri = group.group();
    tri.polygon(`${halfcell},${halfcell - height / 2} ${(halfcell) - (base / 2)},${halfcell + height / 2} ${(halfcell) + (base / 2)},${halfcell + height / 2}`)
        .attr("data-playerfill", true)
        .stroke({width: strokeWeight, color: "#000", opacity: strokeOpacity})
        .fill("#fff");
    const xStart = halfcell - (base / 2) + (pipWidth * 1.25);
    const xOffset = pipWidth * 1.5;
    const y = halfcell + (height / 2) - (pipHeight / 2);
    tri.circle(pipWidth, pipHeight)
        .fill("#000")
        .opacity(pipOpacity)
        .center(xStart, y);
    tri.circle(pipWidth, pipHeight)
        .fill("#000")
        .opacity(pipOpacity)
        .center(xStart + xOffset, y);
    group.viewbox(0, ((cellsize - (halfcell + height / 2)) * -1) + 1, cellsize, cellsize);
    return group;
});

sheet.glyphs.set("pyramid-flattened-small", (canvas: SVGContainer) => {
    const height = 100;
    const base = 56.25;
    const group = canvas.symbol();
    const tri = group.group();
    tri.polygon(`${halfcell},${halfcell - height / 2} ${(halfcell) - (base / 2)},${halfcell + height / 2} ${(halfcell) + (base / 2)},${halfcell + height / 2}`)
        .attr("data-playerfill", true)
        .stroke({width: strokeWeight, color: "#000", opacity: strokeOpacity})
        .fill("#fff");
    const xStart = halfcell - (base / 2) + (pipWidth * 1.25);
    const y = halfcell + (height / 2) - (pipHeight / 2);
    tri.circle(pipWidth, pipHeight)
        .fill("#000")
        .opacity(pipOpacity)
        .center(xStart, y);
    group.viewbox(0, ((cellsize - (halfcell + height / 2)) * -1) + 1, cellsize, cellsize);
    return group;
});

sheet.glyphs.set("pyramid-up-large", (canvas: SVGContainer) => {
    const base = 100;
    const halfbase = base / 2;
    const group = canvas.symbol();
    group.rect(base, base)
        .attr("data-playerfill", true)
        .stroke({width: strokeWeight, color: "#000", opacity: strokeOpacity})
        .fill("#fff")
        .center(halfcell, halfcell);
    group.line(halfcell - halfbase, halfcell + halfbase, halfcell + halfbase, halfcell - halfbase)
        .stroke({width: strokeWeight / 2, color: "#000", opacity: strokeOpacity * 0.5});
    group.line(halfcell - halfbase, halfcell - halfbase, halfcell + halfbase, halfcell + halfbase)
        .stroke({width: strokeWeight / 2, color: "#000", opacity: strokeOpacity * 0.5});
    group.circle(strokeWeight * 2).center(halfcell, halfcell).fill("#000").opacity(strokeOpacity * 0.5);

    // bottom
    let x = halfcell - halfbase + pipWidth;
    let xOffset = pipWidth * 1.5;
    let y = halfcell + halfbase - (strokeWeight * 2);
    group.line(x, y, (x + pipWidth), y)
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});
    x = x + xOffset;
    group.line(x, y, (x + pipWidth), y)
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});
    x = x + xOffset;
    group.line(x, y, (x + pipWidth), y)
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});

    // top
    x = halfcell + halfbase - pipWidth;
    xOffset = pipWidth * 1.5;
    y = halfcell - halfbase + (strokeWeight * 2);
    group.line(x, y, (x - pipWidth), y)
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});
    x = x - xOffset;
    group.line(x, y, (x - pipWidth), y)
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});
    x = x - xOffset;
    group.line(x, y, (x - pipWidth), y)
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});

    // left
    x = halfcell - halfbase + (strokeWeight * 2);
    let yOffset = pipWidth * 1.5;
    y = halfcell - halfbase + pipWidth;
    group.line(x, y, x, (y + pipWidth))
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});
    y = y + yOffset;
    group.line(x, y, x, (y + pipWidth))
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});
    y = y + yOffset;
    group.line(x, y, x, (y + pipWidth))
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});

    // right
    x = halfcell + halfbase - (strokeWeight * 2);
    yOffset = pipWidth * 1.5;
    y = halfcell + halfbase - pipWidth;
    group.line(x, y, x, (y - pipWidth))
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});
    y = y - yOffset;
    group.line(x, y, x, (y - pipWidth))
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});
    y = y - yOffset;
    group.line(x, y, x, (y - pipWidth))
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});

    group.viewbox(0, 0, cellsize, cellsize);
    return group;
});

sheet.glyphs.set("pyramid-up-large-upscaled", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(upCellsize, upCellsize).fill("none");

    group.polyline([[upHalfcell - vwidth3, upCellsize - vbottom3], [upHalfcell, upCellsize - (vbottom3 + vheight3)], [upHalfcell + vwidth3, upCellsize - vbottom3]])
        .fill("none")
        .stroke({width: vstrokeOut, color: "#000", linecap: "round", linejoin: "round"});

    group.polyline([[upHalfcell - vwidth3, upCellsize - vbottom3], [upHalfcell, upCellsize - (vbottom3 + vheight3)], [upHalfcell + vwidth3, upCellsize - vbottom3]])
        .attr("data-playerstroke", true)
        .fill("none")
        .stroke({width: vstrokeIn, color: "#000", linecap: "round", linejoin: "round"});

    group.viewbox(0, 0, upCellsize, upCellsize);
    return group;
});

sheet.glyphs.set("pyramid-up-medium", (canvas: SVGContainer) => {
    const base = 78.125;
    const halfbase = base / 2;
    const group = canvas.symbol();
    group.rect(cellsize, cellsize).fill("none");
    group.rect(base, base)
        .attr("data-playerfill", true)
        .stroke({width: strokeWeight, color: "#000", opacity: strokeOpacity})
        .fill("#fff")
        .center(halfcell, halfcell);
    group.line(halfcell - halfbase, halfcell + halfbase, halfcell + halfbase, halfcell - halfbase)
        .stroke({width: strokeWeight / 2, color: "#000", opacity: strokeOpacity * 0.5});
    group.line(halfcell - halfbase, halfcell - halfbase, halfcell + halfbase, halfcell + halfbase)
        .stroke({width: strokeWeight / 2, color: "#000", opacity: strokeOpacity * 0.5});
    group.circle(strokeWeight * 2).center(halfcell, halfcell).fill("#000").opacity(strokeOpacity * 0.5);

    // bottom
    let x = halfcell - halfbase + pipWidth;
    let xOffset = pipWidth * 1.5;
    let y = halfcell + halfbase - (strokeWeight * 2);
    group.line(x, y, (x + pipWidth), y)
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});
    x = x + xOffset;
    group.line(x, y, (x + pipWidth), y)
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});

    // top
    x = halfcell + halfbase - pipWidth;
    xOffset = pipWidth * 1.5;
    y = halfcell - halfbase + (strokeWeight * 2);
    group.line(x, y, (x - pipWidth), y)
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});
    x = x - xOffset;
    group.line(x, y, (x - pipWidth), y)
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});

    // left
    x = halfcell - halfbase + (strokeWeight * 2);
    let yOffset = pipWidth * 1.5;
    y = halfcell - halfbase + pipWidth;
    group.line(x, y, x, (y + pipWidth))
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});
    y = y + yOffset;
    group.line(x, y, x, (y + pipWidth))
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});

    // right
    x = halfcell + halfbase - (strokeWeight * 2);
    yOffset = pipWidth * 1.5;
    y = halfcell + halfbase - pipWidth;
    group.line(x, y, x, (y - pipWidth))
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});
    y = y - yOffset;
    group.line(x, y, x, (y - pipWidth))
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});

    group.viewbox(0, 0, cellsize, cellsize);
    return group;
});

sheet.glyphs.set("pyramid-up-medium-upscaled", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(upCellsize, upCellsize).fill("none");

    group.polyline([[upHalfcell - vwidth2, upCellsize - vbottom2], [upHalfcell, upCellsize - (vbottom2 + vheight2)], [upHalfcell + vwidth2, upCellsize - vbottom2]])
        .fill("none")
        .stroke({width: vstrokeOut, color: "#000", linecap: "round", linejoin: "round"});

    group.polyline([[upHalfcell - vwidth2, upCellsize - vbottom2], [upHalfcell, upCellsize - (vbottom2 + vheight2)], [upHalfcell + vwidth2, upCellsize - vbottom2]])
        .attr("data-playerstroke", true)
        .fill("none")
        .stroke({width: vstrokeIn, color: "#000", linecap: "round", linejoin: "round"});

    group.viewbox(0, 0, upCellsize, upCellsize);
    return group;
});

sheet.glyphs.set("pyramid-up-small", (canvas: SVGContainer) => {
    const base = 56.25;
    const halfbase = base / 2;
    const group = canvas.symbol();
    group.rect(cellsize, cellsize).fill("none");
    group.rect(base, base)
        .attr("data-playerfill", true)
        .stroke({width: strokeWeight, color: "#000", opacity: strokeOpacity})
        .fill("#fff")
        .center(halfcell, halfcell);
    group.line(halfcell - halfbase, halfcell + halfbase, halfcell + halfbase, halfcell - halfbase)
        .stroke({width: strokeWeight / 2, color: "#000", opacity: strokeOpacity * 0.5});
    group.line(halfcell - halfbase, halfcell - halfbase, halfcell + halfbase, halfcell + halfbase)
        .stroke({width: strokeWeight / 2, color: "#000", opacity: strokeOpacity * 0.5});
    group.circle(strokeWeight * 2).center(halfcell, halfcell).fill("#000").opacity(strokeOpacity * 0.5);

    // bottom
    let x = halfcell - halfbase + pipWidth;
    let y = halfcell + halfbase - (strokeWeight * 2);
    group.line(x, y, (x + pipWidth), y)
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});

    // top
    x = halfcell + halfbase - pipWidth;
    y = halfcell - halfbase + (strokeWeight * 2);
    group.line(x, y, (x - pipWidth), y)
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});

    // left
    x = halfcell - halfbase + (strokeWeight * 2);
    y = halfcell - halfbase + pipWidth;
    group.line(x, y, x, (y + pipWidth))
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});

    // right
    x = halfcell + halfbase - (strokeWeight * 2);
    y = halfcell + halfbase - pipWidth;
    group.line(x, y, x, (y - pipWidth))
        .stroke({width: strokeWeight, color: "#000", opacity: pipOpacity});

    group.viewbox(0, 0, cellsize, cellsize);
    return group;
});

sheet.glyphs.set("pyramid-up-small-upscaled", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(upCellsize, upCellsize).fill("none");

    group.polyline([[upHalfcell - vwidth1, upCellsize - vbottom1], [upHalfcell, upCellsize - (vbottom1 + vheight1)], [upHalfcell + vwidth1, upCellsize - vbottom1]])
        .fill("none")
        .stroke({width: vstrokeOut, color: "#000", linecap: "round", linejoin: "round"});

    group.polyline([[upHalfcell - vwidth1, upCellsize - vbottom1], [upHalfcell, upCellsize - (vbottom1 + vheight1)], [upHalfcell + vwidth1, upCellsize - vbottom1]])
        .attr("data-playerstroke", true)
        .fill("none")
        .stroke({width: vstrokeIn, color: "#000", linecap: "round", linejoin: "round"});

    group.viewbox(0, 0, upCellsize, upCellsize);
    return group;
});

export { sheet as LooneySheet };
