import { GridPoints, IPolyPolygon, conicalHex as conicalHexGrid, genConicalHexPolys } from "../grids";
import { RendererBase } from "../renderers/_base";

export const conicalHex = (ctx: RendererBase): [GridPoints, IPolyPolygon[][]] => {
    if ( (ctx.json === undefined) || (ctx.rootSvg === undefined) || (ctx.json.board === null) ) {
        throw new Error("Object in an invalid state!");
    }

    // Check required properties
    let gridWidth: number|undefined;
    let gridHeight: number|undefined;
    if ( ("width" in ctx.json.board) && (ctx.json.board.width !== undefined)) {
        gridWidth = ctx.json.board.width;
    }
    if ( ("height" in ctx.json.board) && (ctx.json.board.height !== undefined)) {
        gridHeight = ctx.json.board.height;
    }
    if (gridHeight === undefined && gridWidth !== undefined) {
        gridHeight = gridWidth + 1;
        gridWidth++;
    }
    if (gridHeight === undefined) {
        throw new Error(`One of 'width' or 'height' is required.`);
    }

    const cellsize = ctx.cellsize;

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

    // Get a grid of points
    let narrow = false;
    if ( ("style" in ctx.json.board) && (ctx.json.board.style !== undefined) && (ctx.json.board.style === "conical-hex-narrow") ) {
        narrow = true;
    }
    const grid = conicalHexGrid({gridHeight, conicalNarrow: narrow});
    const polys = genConicalHexPolys({height: gridHeight, narrow, scale: cellsize})
    const board = ctx.rootSvg.group().id("board");
    const gridlines = board.group().id("hexes");

    ctx.markBoard({svgGroup: gridlines, preGridLines: true, grid, polys});

    // No board labels

    // Draw hexes
    for (let iRow = 0; iRow < grid.length; iRow++) {
        const row = polys[iRow];
        for (let iCol = 0; iCol < row.length; iCol++) {
            const p = row[iCol];
            const c = gridlines.polygon(p.points.map(ip => [ip.x, ip.y]).flat()).fill({opacity: 0}).stroke({color: baseColour, width: baseStroke, opacity: baseOpacity});
            if (ctx.options.boardClick !== undefined) {
                c.click(() => ctx.options.boardClick!(iRow, iCol, ""));
            }
        }
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

    return [grid, polys];
}
