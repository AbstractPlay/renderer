import { GridPoints, IPoint, IPolyPolygon } from "../grids/index.js";
import { RendererBase } from "../renderers/_base.js";
import { hexOfTri as hexOfTriGrid } from "../grids/index.js";
import { attachNearestGridPointClick, BoardReturn, createGridlineLayers } from "./index.js";
import { offsetPolygon } from "../common/plotting.js";

/** Tip dot diameter as a fraction of `cellsize` (matches common `markers` dot sizing). */
export const GIPF_DOT_SIZE = 0.33;

export function hexOfTriIsPerimeter(row: number, col: number, grid: GridPoints): boolean {
    const lastRow = grid.length - 1;
    if (row === 0 || row === lastRow) {
        return true;
    }
    const lastCol = grid[row]!.length - 1;
    return col === 0 || col === lastCol;
}

/** Whether a grid edge is an outer dot-to-dot chord on a GIPF board (any link between two perimeter nodes). */
export function gipfShouldOmitPerimeterChord(
    rowA: number,
    colA: number,
    rowB: number,
    colB: number,
    grid: GridPoints,
): boolean {
    return hexOfTriIsPerimeter(rowA, colA, grid) && hexOfTriIsPerimeter(rowB, colB, grid);
}

export const hexOfTri = (ctx: RendererBase): BoardReturn => {
    if ( (ctx.json === undefined) || (ctx.rootSvg === undefined) ) {
        throw new Error("Object in an invalid state!");
    }

    // Check required properties
    if ( (ctx.json.board === null) || (! ("minWidth" in ctx.json.board)) || (! ("maxWidth" in ctx.json.board)) || (ctx.json.board.minWidth === undefined) || (ctx.json.board.maxWidth === undefined) ) {
        throw new Error("Both the `minWidth` and `maxWidth` properties are required for this board type.");
    }
    const minWidth: number = ctx.json.board.minWidth;
    const maxWidth: number = ctx.json.board.maxWidth;
    const boardStyle = ctx.json.board.style;
    const isGipf = boardStyle === "gipf";
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
    const layers = createGridlineLayers(board);
    const gridlines = layers.root;

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
        const labelGap = ctx.scaleCoordinateLabelGap(cellsize);

        for (let row = 0; row < grid.length; row++) {
            let leftNum = "1";
            let rightNum = grid[row].length.toString();
            if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("reverse-numbers")) ) {
                const scratch = leftNum;
                leftNum = rightNum;
                rightNum = scratch;
            }

            const pointL = {x: grid[row][0].x - labelGap, y: grid[row][0].y};
            const pointR = {x: grid[row][grid[row].length - 1].x + labelGap, y: grid[row][grid[row].length - 1].y};
            ctx.applyCoordinateLabelStyle(labels.text(columnLabels[height - row - 1] + leftNum), labelColour, labelOpacity).center(pointL.x, pointL.y);
            ctx.applyCoordinateLabelStyle(labels.text(columnLabels[height - row - 1] + rightNum), labelColour, labelOpacity).center(pointR.x, pointR.y);
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

    const strokeAttrs = {width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round" as const, linejoin: "round" as const};
    const drawGridLine = (rowA: number, colA: number, rowB: number, colB: number, a: IPoint, b: IPoint) => {
        if (isGipf && gipfShouldOmitPerimeterChord(rowA, colA, rowB, colB, grid)) {
            return;
        }
        layers.strokes.line(a.x, a.y, b.x, b.y).stroke(strokeAttrs);
    };
    const nodeBlocked = (r: number, c: number) => blocked?.find(b => b.row === r && b.col === c) !== undefined;

    for (let row = 0; row < grid.length; row++) {
        const currRow = grid[row];
        for (let col = 0; col < grid[row].length; col++) {
            const curr = currRow[col];
            if (nodeBlocked(row, col)) {
                continue;
            }
            // always connect to cell to the left
            if (col > 0) {
                if (!nodeBlocked(row, col - 1)) {
                    const prev = currRow[col - 1];
                    drawGridLine(row, col, row, col - 1, curr, prev);
                }
            }

            // connections are built upward, so only continue with rows after the first
            if (row > 0) {
                // always connect to the cell directly above, if one exists
                if (col <= grid[row - 1].length - 1) {
                    if (!nodeBlocked(row - 1, col)) {
                        const prev = grid[row - 1][col];
                        drawGridLine(row, col, row - 1, col, curr, prev);
                    }
                }
                // up to and including the midline, connect to the above-previous cell if there is one
                if ( (row <= midrow) && (col > 0) ) {
                    if (!nodeBlocked(row - 1, col - 1)) {
                        const prev = grid[row - 1][col - 1];
                        drawGridLine(row, col, row - 1, col - 1, curr, prev);
                    }
                }
                // after the midline, connect to the above-next cell instead
                if (row > midrow) {
                    if (!nodeBlocked(row - 1, col + 1)) {
                        const prev = grid[row - 1][col + 1];
                        drawGridLine(row, col, row - 1, col + 1, curr, prev);
                    }
                }
            }
        }
    }

    if (isGipf) {
        const dotDiameter = cellsize * GIPF_DOT_SIZE;
        const dotLayer = board.group().id("gipf-dots");
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                if (nodeBlocked(row, col) || !hexOfTriIsPerimeter(row, col, grid)) {
                    continue;
                }
                const pt = grid[row][col];
                dotLayer
                    .circle(dotDiameter)
                    .fill(baseColour)
                    .opacity(baseOpacity)
                    .stroke({width: 0})
                    .center(pt.x, pt.y)
                    .attr({"pointer-events": "none"});
            }
        }
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid});

    // build backFill
    const numTop = 0;
    const numBottom = grid.length - 1;
    const widest = Math.max(...grid.map(row => row.length));
    const numWidest = grid.findIndex(row => row.length === widest);
    let boardFill: IPolyPolygon;
    // if numWidest is not the top or the bottom, then we have a full hex
    if (numWidest !== numTop && numWidest !== numBottom) {
        boardFill = {
            type: "poly",
            points: offsetPolygon([
                {x: grid[numTop][0].x, y: grid[numTop][0].y},
                {x: grid[numTop][grid[numTop].length - 1].x, y: grid[numTop][grid[numTop].length - 1].y},
                {x: grid[numWidest][grid[numWidest].length - 1].x, y: grid[numWidest][grid[numWidest].length - 1].y},
                {x: grid[numBottom][grid[numBottom].length - 1].x, y: grid[numBottom][grid[numBottom].length - 1].y},
                {x: grid[numBottom][0].x, y: grid[numBottom][0].y},
                {x: grid[numWidest][0].x, y: grid[numWidest][0].y},
            ], cellsize / 1.5),
        };
    }
    // otherwise we just have a four-point poly
    else {
        const ptWideL = {
            x: grid[numWidest][0].x,
            y: grid[numWidest][0].y,
        };
        const ptWideR = {
            x: grid[numWidest][grid[numWidest].length - 1].x,
            y: grid[numWidest][grid[numWidest].length - 1].y,
        };
        let ptOtherL: IPoint; let ptOtherR: IPoint;
        if (half === "top") {
            ptOtherL = {
                x: grid[numTop][0].x,
                y: grid[numTop][0].y
            };
            ptOtherR = {
                x: grid[numTop][grid[numTop].length - 1].x,
                y: grid[numTop][grid[numTop].length - 1].y
            };
        } else {
            ptOtherL = {
                x: grid[numBottom][0].x,
                y: grid[numBottom][0].y
            };
            ptOtherR = {
                x: grid[numBottom][grid[numBottom].length - 1].x,
                y: grid[numBottom][grid[numBottom].length - 1].y
            };
        }
        boardFill = {
            type: "poly",
            points: offsetPolygon([ptWideL, ptOtherL, ptOtherR, ptWideR], cellsize / 1.5),
        };
    }

    if (ctx.options.boardClick !== undefined) {
        attachNearestGridPointClick(board, grid, boardFill, ctx.options.boardClick, { blocked });
    }

    return {grid, boardFill};
}
