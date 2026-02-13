import { genPyramidHexPolys, GridPoints, IPolyPolygon, pyramidHex as pyramidHexGrid } from "../grids";
import { RendererBase } from "../renderers/_base";

export const pyramidHex = (ctx: RendererBase): [GridPoints, IPolyPolygon[][]] => {
    if ( (ctx.json === undefined) || (ctx.rootSvg === undefined) || (ctx.json.board === null) ) {
        throw new Error("Object in an invalid state!");
    }

    // Check required properties
    let gridWidth: number|undefined;
    if ( ("minWidth" in ctx.json.board) && (ctx.json.board.minWidth !== undefined)) {
        gridWidth = ctx.json.board.minWidth;
    }
    if (gridWidth === undefined) {
        throw new Error(`The property 'minWidth' is required.`);
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
    const grid = pyramidHexGrid({gridWidthMin: gridWidth});
    const polys = genPyramidHexPolys({size: gridWidth, scale: cellsize})
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
