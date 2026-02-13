import { Element as SVGElement, StrokeData } from "@svgdotjs/svg.js";
import { GridPoints, Poly } from "../grids";
import { RendererBase } from "../renderers/_base";
import { ICobwebArgs, cobweb as cobwebGrid, cobwebLabels, cobwebPolys } from "../grids/cobweb";

export const cobweb = (ctx: RendererBase): [GridPoints, Poly[][]] => {
    if ( (ctx.json === undefined) || (ctx.rootSvg === undefined) ) {
        throw new Error("Object in an invalid state!");
    }

    // Check required properties
    if ( (ctx.json.board === null) || (! ("width" in ctx.json.board)) || (! ("height" in ctx.json.board)) || (ctx.json.board.width === undefined) || (ctx.json.board.height === undefined) ) {
        throw new Error("Both the `width` and `height` properties are required for this board type.");
    }
    const width: number = ctx.json.board.width;
    const height: number = ctx.json.board.height;
    const cellsize = ctx.cellsize;
    if (width % 2 !== 0) {
        throw new Error("The number of sections in a cobweb board must be even.");
    }

    let baseStroke = 1;
    let baseColour = ctx.options.colourContext.strokes;
    let baseOpacity = 1;
    if ( ("strokeWeight" in ctx.json.board) && (ctx.json.board.strokeWeight !== undefined) ) {
        baseStroke = ctx.json.board.strokeWeight;
    }
    if ( ("strokeColour" in ctx.json.board) && (ctx.json.board.strokeColour !== undefined) ) {
        baseColour = ctx.resolveColour(ctx.json.board.strokeColour) as string;
    }
    if ( ("strokeOpacity" in ctx.json.board) && (ctx.json.board.strokeOpacity !== undefined) ) {
        baseOpacity = ctx.json.board.strokeOpacity;
    }
    const strokeAttrs: StrokeData = {color: baseColour, width: baseStroke, opacity: baseOpacity, linecap: "round", linejoin: "round"};

    let start = 0;
    if ( ("circular-start" in ctx.json.board) && (ctx.json.board["circular-start"] !== undefined) ) {
        start = ctx.json.board["circular-start"];
    }

    // Get a grid of points
    const args: ICobwebArgs = {gridHeight: height, gridWidth: width, cellSize: cellsize, start};
    const grid = cobwebGrid(args);
    const polys = cobwebPolys(args);
    const board = ctx.rootSvg.group().id("board");
    const gridlines = board.group().id("gridlines");

    ctx.markBoard({svgGroup: gridlines, preGridLines: true, grid, polys});

    // Add board labels
    let labelColour = ctx.options.colourContext.labels;
    if ( ("labelColour" in ctx.json.board) && (ctx.json.board.labelColour !== undefined) ) {
        labelColour = ctx.resolveColour(ctx.json.board.labelColour) as string;
    }
    let labelOpacity = 1;
    if ( ("labelOpacity" in ctx.json.board) && (ctx.json.board.labelOpacity !== undefined) ) {
        labelOpacity = ctx.json.board.labelOpacity;
    }
    if ( (! ctx.json.options) || (! ctx.json.options.includes("hide-labels") ) ) {
        const labelPts = cobwebLabels(args);
        const labels = board.group().id("labels");
        const columnLabels = ctx.getLabels(undefined, width);
        if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("reverse-letters")) ) {
            columnLabels.reverse();
        }

        // Columns (letters)
        for (let col = 0; col < width; col++) {
            const pt = labelPts[col];
            labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pt.x, pt.y);
        }
    }

    // Draw grid lines
    for (let y = 0; y < polys.length; y++) {
        const slice = polys[y];
        for (let x = 0; x < slice.length; x++) {
            const cell = slice[x];
            let ele: SVGElement;
            switch (cell.type) {
                case "circle":
                    ele = gridlines.circle(cell.r * 2).fill({color: "white", opacity: 0}).stroke(strokeAttrs).center(cell.cx, cell.cy);
                    break;
                case "poly":
                    ele = gridlines.polygon(cell.points.map(pt => `${pt.x},${pt.y}`).join(" ")).fill({color: "white", opacity: 0}).stroke(strokeAttrs);
                    break;
                case "path":
                    ele = gridlines.path(cell.path).fill({color: "white", opacity: 0}).stroke(strokeAttrs);
                    break;
            }
            if (ctx.options.boardClick !== undefined) {
                ele.click(() => ctx.options.boardClick!(y, x, ""));
            }
        }
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

    return [grid, polys];
}
