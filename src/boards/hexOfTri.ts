import { GridPoints } from "../grids";
import { RendererBase } from "../renderers/_base";
import { hexOfTri as hexOfTriGrid } from "../grids";

export const hexOfTri = (ctx: RendererBase): GridPoints => {
    if ( (ctx.json === undefined) || (ctx.rootSvg === undefined) ) {
        throw new Error("Object in an invalid state!");
    }

    // Check required properties
    if ( (ctx.json.board === null) || (! ("minWidth" in ctx.json.board)) || (! ("maxWidth" in ctx.json.board)) || (ctx.json.board.minWidth === undefined) || (ctx.json.board.maxWidth === undefined) ) {
        throw new Error("Both the `minWidth` and `maxWidth` properties are required for this board type.");
    }
    const minWidth: number = ctx.json.board.minWidth;
    const maxWidth: number = ctx.json.board.maxWidth;
    const cellsize = ctx.cellsize;
    let height = ((maxWidth - minWidth) * 2) + 1;
    let half: "top"|"bottom"|undefined;
    let alternating = false;
    if ( ("half" in ctx.json.board) && (ctx.json.board.half !== undefined) && (ctx.json.board.half !== null) ) {
        half = ctx.json.board.half;
        height = maxWidth - minWidth + 1;
    } else if ( ("alternatingSymmetry" in ctx.json.board) && (ctx.json.board.alternatingSymmetry) ) {
        alternating = true;
        const numTop = maxWidth - minWidth + 1
        const numBottom = maxWidth - numTop;
        height = numTop + numBottom;
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

    // Get a grid of points
    const grid = hexOfTriGrid({gridWidthMin: minWidth, gridWidthMax: maxWidth, cellSize: cellsize, half, alternating});
    const board = ctx.rootSvg.group().id("board");
    const gridlines = board.group().id("gridlines");

    ctx.markBoard({svgGroup: gridlines, preGridLines: true, grid});

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

        // Rows (numbers)
        let customLabels: string[]|undefined;
        if ( ("columnLabels" in ctx.json.board) && (ctx.json.board.columnLabels !== undefined) ) {
            customLabels = ctx.json.board.columnLabels;
        }
        const columnLabels = ctx.getLabels(customLabels, height);
        if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("reverse-letters")) ) {
            columnLabels.reverse();
        }

        for (let row = 0; row < grid.length; row++) {
            let leftNum = "1";
            let rightNum = grid[row].length.toString();
            if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("reverse-numbers")) ) {
                const scratch = leftNum;
                leftNum = rightNum;
                rightNum = scratch;
            }

            const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
            const pointR = {x: grid[row][grid[row].length - 1].x + cellsize, y: grid[row][grid[row].length - 1].y};
            labels.text(columnLabels[height - row - 1] + leftNum).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
            labels.text(columnLabels[height - row - 1] + rightNum).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
        }
    }

    // load blocked nodes
    type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
    let blocked: Blocked|undefined;
    if ( (ctx.json.board.blocked !== undefined) && (ctx.json.board.blocked !== null)  && (Array.isArray(ctx.json.board.blocked)) && (ctx.json.board.blocked.length > 0) ){
        blocked = [...(ctx.json.board.blocked as Blocked)];
    }

    // Draw grid lines
    let midrow = maxWidth - minWidth;
    if (half === "bottom") {
        midrow = 0;
    }

    for (let row = 0; row < grid.length; row++) {
        const currRow = grid[row];
        for (let col = 0; col < grid[row].length; col++) {
            const curr = currRow[col];
            const isBlocked = blocked?.find(b => b.row === row && b.col === col);
            if (isBlocked !== undefined) {
                continue;
            }
            // always connect to cell to the left
            if (col > 0) {
                // skip if blocked
                const found = blocked?.find(b => b.row === row && b.col === col - 1);
                if (found === undefined) {
                    const prev = currRow[col - 1];
                    const x1 = curr.x;
                    const y1 = curr.y;
                    const x2 = prev.x;
                    const y2 = prev.y;
                    gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                }
            }

            // connections are built upward, so only continue with rows after the first
            if (row > 0) {
                // always connect to the cell directly above, if one exists
                if (col <= grid[row - 1].length - 1) {
                    const found = blocked?.find(b => b.row === row-1 && b.col === col);
                    if (found === undefined) {
                        const prev = grid[row - 1][col];
                        const x1 = curr.x;
                        const y1 = curr.y;
                        const x2 = prev.x;
                        const y2 = prev.y;
                        gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                    }
                }
                // up to and including the midline, connect to the above-previous cell if there is one
                if ( (row <= midrow) && (col > 0) ) {
                    const found = blocked?.find(b => b.row === row-1 && b.col === col-1);
                    if (found === undefined) {
                        const prev = grid[row - 1][col - 1];
                        const x1 = curr.x;
                        const y1 = curr.y;
                        const x2 = prev.x;
                        const y2 = prev.y;
                        gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                    }
                }
                // after the midline, connect to the above-next cell instead
                if (row > midrow) {
                    const found = blocked?.find(b => b.row === row-1 && b.col === col+1);
                    if (found === undefined) {
                        const prev = grid[row - 1][col + 1];
                        const x1 = curr.x;
                        const y1 = curr.y;
                        const x2 = prev.x;
                        const y2 = prev.y;
                        gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                    }
                }
            }
        }
    }

    if (ctx.options.boardClick !== undefined) {
        // moving to click catchers across the board to make arbitrary rotation easier
        const tiles = board.group().id("tiles");
        const tile = ctx.rootSvg.defs().rect(ctx.cellsize, ctx.cellsize).fill(ctx.options.colourContext.background).opacity(0).id("_clickCatcher");
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                const found = blocked?.find(b => b.row === row && b.col === col);
                if (found !== undefined) {
                    continue;
                }
                const {x, y} = grid[row][col];
                const t = tiles.use(tile).dmove(x - (cellsize / 2), y - (cellsize / 2));
                t.click(() => ctx.options.boardClick!(row, col, ""));
            }
        }
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid});

    return grid;
}
