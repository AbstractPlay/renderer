import { matrixRectRotN90 } from "../common/plotting";
import { GridPoints, IPoint, IPolyPolygon, rectOfRects } from "../grids";
import { RendererBase } from "../renderers/_base";

export const conhex = (ctx: RendererBase): [GridPoints, IPolyPolygon[][]] => {
    if ( (ctx.json === undefined) || (ctx.json.board === null) || ( (! ("width" in ctx.json.board)) && (! ("height" in ctx.json.board)) ) || (ctx.rootSvg === undefined) ) {
        throw new Error("Object in an invalid state!");
    }

    // Check required properties
    let width = ctx.json.board.width;
    let height = ctx.json.board.height;
    if (width === undefined && height === undefined) {
        throw new Error("You must provide at least one of `width` or `height`");
    }
    if (width !== undefined && height !== undefined && width !== height) {
        throw new Error("ConHex boards must be square.");
    }
    const boardsize = (width !== undefined ? width : height) as number;
    if (boardsize % 2 === 0) {
        throw new Error("ConHex board size must be odd.");
    }
    if (boardsize < 5) {
        throw new Error("The minimum ConHex board size is 5.");
    }
    if (width === undefined) {
        width = height;
    } else if (height === undefined) {
        height = width;
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

    // Get cell polys
    const conhexCells = getConhexCells(boardsize, cellsize);
    const poly2point = (poly: IPolyPolygon): IPoint => {
        const sumx = poly.points.map(pt => pt.x).reduce((prev, curr) => prev + curr, 0);
        const sumy = poly.points.map(pt => pt.y).reduce((prev, curr) => prev + curr, 0);
        return {
            x: sumx / poly.points.length,
            y: sumy / poly.points.length,
        };
    }
    const grid: GridPoints = [];
    for (const row of conhexCells) {
        const pts: IPoint[] = [];
        for (const poly of row) {
            pts.push(poly2point(poly));
        }
        grid.push(pts);
    }
    const board = ctx.rootSvg.group().id("board");

    // Make an expanded grid for markers, to accommodate edge marking and shading
    // Add one row and one column and shift all points up and to the left by half a cell size
    let gridExpanded = rectOfRects({gridHeight: boardsize + 1, gridWidth: boardsize + 1, cellSize: cellsize});
    gridExpanded = gridExpanded.map((row) => row.map((cell) => ({x: cell.x - (cellsize / 2), y: cell.y - (cellsize / 2)} as IPoint)));

    const gridlines = board.group().id("gridlines");
    const cells = getConhexCells(boardsize, cellsize);

    ctx.markBoard({svgGroup: gridlines, preGridLines: true, grid, gridExpanded, polys: cells});

    // no board labels

    // Now the tiles
    type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
    let blocked: Blocked|undefined;
    if ( ("blocked" in ctx.json.board) && (ctx.json.board.blocked !== undefined) && (ctx.json.board.blocked !== null)  && (Array.isArray(ctx.json.board.blocked)) && (ctx.json.board.blocked.length > 0) ){
        blocked = [...(ctx.json.board.blocked as Blocked)];
    }

    // place cells and give them a base, empty fill
    for (let row = 0; row < cells.length; row++) {
        for (let col = 0; col < cells[row].length; col++) {
            if (blocked !== undefined && blocked.find(obj => obj.col === col && obj.row === row) !== undefined) {
                continue;
            }
            const poly = cells[row][col];
            const p = board.polygon(poly.points.map(pt => `${pt.x},${pt.y}`).join(" ")).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"}).fill({color: "white", opacity: 0});
            if (ctx.options.boardClick !== undefined) {
                p.click(() => ctx.options.boardClick!(row, col, "cell"))
            }
        }
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid, gridExpanded, polys: cells});

    return [grid, cells];
}

export const getConhexCells = (boardsize: number, cellsize: number): IPolyPolygon[][] => {
    const numLayers = Math.floor(boardsize / 2);
    let grid = rectOfRects({gridHeight: boardsize, gridWidth: boardsize, cellSize: cellsize});

    const polys: IPolyPolygon[][] = [];
    // for each layer (except the last one)
    for (let layer = 0; layer < numLayers - 1; layer++) {
        const tlx = layer;
        const tly = layer;
        const row: IPolyPolygon[] = [];
        // do the following four times, rotating after each time
        for (let i = 0; i < 4; i++) {
            for (let segment = 0; segment < numLayers - 1 - layer; segment++) {
                // corner
                if (segment === 0) {
                    // outer layer corners are unique
                    if (layer === 0) {
                        row.push({
                            type: "poly",
                            points: [
                                grid[tly][tlx],
                                grid[tly][tlx+2],
                                grid[tly+1][tlx+2],
                                grid[tly+2][tlx+1],
                                grid[tly+2][tlx],
                            ]
                        });
                    }
                    // interior corner
                    else {
                        row.push({
                            type: "poly",
                            points: [
                                grid[tly][tlx+1],
                                grid[tly][tlx+2],
                                grid[tly+1][tlx+2],
                                grid[tly+2][tlx+1],
                                grid[tly+2][tlx],
                                grid[tly+1][tlx],
                            ]
                        });
                    }
                }
                // everything else
                else {
                    const xoffset = tlx + (2 * segment);
                    row.push({
                        type: "poly",
                        points: [
                            grid[tly][xoffset],
                            grid[tly][xoffset+2],
                            grid[tly+1][xoffset+2],
                            grid[tly+1][xoffset],
                        ]
                    });
                }
            }

            // rotate after each pass
            grid = matrixRectRotN90(grid) as GridPoints;
        }
        polys.push(row);
    }
    // now add the center diamond poly
    const ctr = Math.floor(boardsize / 2);
    polys.push([{
        type: "poly",
        points: [
            grid[ctr-1][ctr],
            grid[ctr][ctr+1],
            grid[ctr+1][ctr],
            grid[ctr][ctr-1],
        ],
    }]);

    // all done
    return polys;
}
