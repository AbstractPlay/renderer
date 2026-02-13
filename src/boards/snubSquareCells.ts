import { BoardBasic } from "../schemas/schema";
import { centroid } from "../common/plotting";
import { GridPoints, IPolyPolygon, snubsquare, SnubStart } from "../grids";
import { RendererBase } from "../renderers/_base";

export const snubSquareCells = (ctx: RendererBase): [GridPoints, IPolyPolygon[][]] => {
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
    let snubStart: SnubStart = "S";
    if ("snubStart" in ctx.json.board && ctx.json.board.snubStart !== undefined) {
        snubStart = ctx.json.board.snubStart;
    }

    // Get a grid of points
    const gridOrig = snubsquare({gridHeight: height, gridWidth: width, cellSize: cellsize, snubStart});
    const minx = Math.min(...gridOrig.flat().map(pt => pt.x));
    const maxx = Math.max(...gridOrig.flat().map(pt => pt.x));
    // const miny = Math.min(...grid.flat().map(pt => pt.y));
    // const maxy = Math.max(...grid.flat().map(pt => pt.y));

    // create the polys
    const polys: IPolyPolygon[][] = [];
    for (let row = 0; row < height - 1; row++) {
        const node: IPolyPolygon[] = [];
        for (let col = 0; col < width - 1; col+=2) {
            if (snubStart === "S") {
                if (row % 2 === 0) {
                    const sqpts = [
                        gridOrig[row][col],
                        gridOrig[row][col+1],
                        gridOrig[row+1][col+1],
                        gridOrig[row+1][col],
                    ];
                    node.push({type: "poly", points: sqpts});
                    if (gridOrig[row][col+1] !== undefined && gridOrig[row][col+2] !== undefined && gridOrig[row+1][col+1] !== undefined) {
                        const t1pts = [
                            gridOrig[row][col+1],
                            gridOrig[row][col+2],
                            gridOrig[row+1][col+1],
                        ];
                        node.push({type: "poly", points: t1pts});
                    }
                    if (gridOrig[row][col+2] !== undefined && gridOrig[row+1][col+2] !== undefined && gridOrig[row+1][col+1] !== undefined) {
                        const t2pts = [
                            gridOrig[row][col+2],
                            gridOrig[row+1][col+2],
                            gridOrig[row+1][col+1],
                        ];
                        node.push({type: "poly", points: t2pts});
                    }
                } else {
                    const t1pts = [
                        gridOrig[row][col],
                        gridOrig[row+1][col+1],
                        gridOrig[row+1][col],
                    ];
                    node.push({type: "poly", points: t1pts});
                    if (gridOrig[row][col+1] !== undefined && gridOrig[row+1][col+1] !== undefined) {
                        const t2pts = [
                            gridOrig[row][col],
                            gridOrig[row][col+1],
                            gridOrig[row+1][col+1],
                        ];
                        node.push({type: "poly", points: t2pts});
                    }
                    if (gridOrig[row][col+1] !== undefined && gridOrig[row][col+2] !== undefined && gridOrig[row+1][col+1] !== undefined && gridOrig[row+1][col+2] !== undefined) {
                        const sqpts = [
                            gridOrig[row][col+1],
                            gridOrig[row][col+2],
                            gridOrig[row+1][col+2],
                            gridOrig[row+1][col+1],
                        ];
                        node.push({type: "poly", points: sqpts});
                    }
                }
            }
            else {
                if (row % 2 !== 0) {
                    const sqpts = [
                        gridOrig[row][col],
                        gridOrig[row][col+1],
                        gridOrig[row+1][col+1],
                        gridOrig[row+1][col],
                    ];
                    node.push({type: "poly", points: sqpts});
                    if (gridOrig[row][col+1] !== undefined && gridOrig[row+1][col+1] !== undefined && gridOrig[row+1][col+2] !== undefined) {
                        const t1pts = [
                            gridOrig[row][col+1],
                            gridOrig[row+1][col+1],
                            gridOrig[row+1][col+2],
                        ];
                        node.push({type: "poly", points: t1pts});
                    }
                    if (gridOrig[row][col+1] !== undefined && gridOrig[row][col+2] !== undefined && gridOrig[row+1][col+2] !== undefined) {
                        const t2pts = [
                            gridOrig[row][col+1],
                            gridOrig[row][col+2],
                            gridOrig[row+1][col+2],
                        ];
                        node.push({type: "poly", points: t2pts});
                    }
                } else {
                    const t1pts = [
                        gridOrig[row][col],
                        gridOrig[row][col+1],
                        gridOrig[row+1][col],
                    ];
                    node.push({type: "poly", points: t1pts});
                    if (gridOrig[row][col+1] !== undefined && gridOrig[row+1][col] !== undefined && gridOrig[row+1][col+1] !== undefined) {
                        const t2pts = [
                            gridOrig[row][col+1],
                            gridOrig[row+1][col],
                            gridOrig[row+1][col+1],
                        ];
                        node.push({type: "poly", points: t2pts});
                    }
                    if (gridOrig[row][col+1] !== undefined && gridOrig[row][col+2] !== undefined && gridOrig[row+1][col+1] !== undefined && gridOrig[row+1][col+2] !== undefined) {
                        const sqpts = [
                            gridOrig[row][col+1],
                            gridOrig[row][col+2],
                            gridOrig[row+1][col+2],
                            gridOrig[row+1][col+1],
                        ];
                        node.push({type: "poly", points: sqpts});
                    }
                }
            }
        }
        polys.push(node);
    }
    const grid = polys.map(row => row.map(poly => centroid(poly.points)!));

    // Start building the SVG
    const board = ctx.rootSvg.group().id("board");
    const gridlines = board.group().id("gridlines");

    ctx.markBoard({svgGroup: gridlines, preGridLines: true, grid, polys, gridExpanded: gridOrig});

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
        const labels = board.group().id("labels");
        const columnLabels = ctx.getLabels(undefined, polys.length);
        if ( (ctx.json.options === undefined) || (!ctx.json.options.includes("reverse-numbers")) ) {
            columnLabels.reverse();
        }

        const buffer = cellsize * 0.25;
        // Rows (combined labels)
        for (let row = 0; row < grid.length; row++) {
            const pointL = {x: minx - buffer, y: grid[row][0].y};
            const pointR = {x: maxx + buffer, y: grid[row][grid[row].length - 1].y};
            labels.text(columnLabels[row] + "1").fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
            labels.text(columnLabels[row] + polys[row].length.toString()).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
        }
    }

    // Draw grid lines
    type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
    let blocked: Blocked|undefined;
    ctx.json.board = ctx.json.board as BoardBasic;
    if ( (ctx.json.board.blocked !== undefined) && (ctx.json.board.blocked !== null)  && (Array.isArray(ctx.json.board.blocked)) && (ctx.json.board.blocked.length > 0) ){
        blocked = [...(ctx.json.board.blocked as Blocked)];
    }
    for (let row = 0; row < polys.length; row++) {
        for (let col = 0; col < polys[row].length; col++) {
            const isBlocked = blocked?.find(e => e.row === row && e.col === col) !== undefined;
            if (!isBlocked) {
                const poly = polys[row][col];
                const instance = gridlines.polygon([...poly.points, poly.points[0]].map(pt => `${pt.x},${pt.y}`).join(" ")).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"}).fill({color: "white", opacity: 0});
                if (ctx.options.boardClick !== undefined) {
                    instance.click(() => ctx.options.boardClick!(row, col, ""))
                }
            }
        }
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys, gridExpanded: gridOrig});

    return [grid, polys];
}
