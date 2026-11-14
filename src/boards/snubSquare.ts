import { IPolyPolygon, snubsquare, SnubStart } from "../grids/index.js";
import { RendererBase } from "../renderers/_base.js";
import { attachNearestGridPointClick, BoardReturn, createGridlineLayers } from "./index.js";

export const snubSquare = (ctx: RendererBase): BoardReturn => {
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
    const grid = snubsquare({gridHeight: height, gridWidth: width, cellSize: cellsize, snubStart});
    const board = ctx.rootSvg.group().id("board");
    const layers = createGridlineLayers(board);
    const gridlines = layers.root;

    ctx.markBoard({svgGroup: gridlines, preGridLines: true, grid});

    type Blocked = [{row: number; col: number;}, ...{row: number; col: number;}[]];
    const boardDef = ctx.json.board;
    let blocked: Blocked | undefined;
    if (
        "blocked" in boardDef
        && boardDef.blocked !== undefined
        && boardDef.blocked !== null
        && Array.isArray(boardDef.blocked)
        && boardDef.blocked.length > 0
    ) {
        blocked = [...(boardDef.blocked as Blocked)];
    }
    const vertexBlocked = (row: number, col: number): boolean =>
        blocked !== undefined && blocked.some((b) => b.row === row && b.col === col);

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
        const minx = Math.min(...grid.flat().map(pt => pt.x));
        const maxx = Math.max(...grid.flat().map(pt => pt.x));
        const miny = Math.min(...grid.flat().map(pt => pt.y));
        const maxy = Math.max(...grid.flat().map(pt => pt.y));

        let hideHalf = false;
        if (ctx.json.options?.includes("hide-labels-half")) {
            hideHalf = true;
        }
        const labels = board.group().id("labels");
        let columnLabels = ctx.getLabels(undefined, width);
        if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("reverse-letters")) ) {
            columnLabels.reverse();
        }

        let rowLabels: string[] = [];
        for (let row = 0; row < height; row++) {
            rowLabels.push((height - row).toString());
        }
        if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("reverse-numbers")) ) {
            rowLabels.reverse();
        }

        if (ctx.json.options?.includes("swap-labels")) {
            const scratch = [...columnLabels];
            columnLabels = [...rowLabels];
            columnLabels.reverse();
            rowLabels = [...scratch];
            rowLabels.reverse();
        }

        const labelGap = ctx.scaleCoordinateLabelGap(cellsize);
        // Columns (letters)
        for (let col = 0; col < width; col++) {
            const pointTop = {x: grid[0][col].x, y: miny - labelGap};
            const pointBottom = {x: grid[height - 1][col].x, y: maxy + labelGap};
            if (! hideHalf) {
                ctx.applyCoordinateLabelStyle(labels.text(columnLabels[col]), labelColour, labelOpacity).center(pointTop.x, pointTop.y);
            }
            ctx.applyCoordinateLabelStyle(labels.text(columnLabels[col]), labelColour, labelOpacity).center(pointBottom.x, pointBottom.y);
        }

        // Rows (numbers)
        for (let row = 0; row < height; row++) {
            const pointL = {x: minx - labelGap, y: grid[row][0].y};
            const pointR = {x: maxx + labelGap, y: grid[row][width - 1].y};
            ctx.applyCoordinateLabelStyle(labels.text(rowLabels[row]), labelColour, labelOpacity).center(pointL.x, pointL.y);
            if (! hideHalf) {
                ctx.applyCoordinateLabelStyle(labels.text(rowLabels[row]), labelColour, labelOpacity).center(pointR.x, pointR.y);
            }
        }
    }

    const strokeLine = (x1: number, y1: number, x2: number, y2: number): void => {
        layers.strokes.line(x1, y1, x2, y2).stroke({
            width: baseStroke,
            color: baseColour,
            opacity: baseOpacity,
            linecap: "round",
            linejoin: "round",
        });
    };

    // Draw grid lines
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            if (vertexBlocked(row, col)) {
                continue;
            }
            const curr = grid[row][col];

            // always connect to previous cell
            if (col > 0 && !vertexBlocked(row, col - 1)) {
                const prev = grid[row][col - 1];
                strokeLine(curr.x, curr.y, prev.x, prev.y);
            }

            if (row > 0) {
                // always connect to cell directly above
                if (!vertexBlocked(row - 1, col)) {
                    const prev = grid[row - 1][col];
                    strokeLine(curr.x, curr.y, prev.x, prev.y);
                }
                if (snubStart === "S") {
                    // even row, odd columns connect as well to previous-above cell
                    if ( ( (row % 2) === 0) && ( (col % 2) !== 0) && !vertexBlocked(row - 1, col - 1) ) {
                        const prev = grid[row - 1][col - 1];
                        strokeLine(curr.x, curr.y, prev.x, prev.y);
                    // odd row, odd columns connect as well to previous-next cell
                    } else if ( ((row % 2) !== 0) && ((col % 2) !== 0) && (col < (width - 1)) && !vertexBlocked(row - 1, col + 1) ) {
                        const prev = grid[row - 1][col + 1];
                        strokeLine(curr.x, curr.y, prev.x, prev.y);
                    }
                } else {
                    // even row, even columns > 0 connect as well to previous-above cell
                    if ( ( (row % 2) === 0) && ( (col % 2) === 0) && col > 0 && !vertexBlocked(row - 1, col - 1) ) {
                        const prev = grid[row - 1][col - 1];
                        strokeLine(curr.x, curr.y, prev.x, prev.y);
                    // odd row, even columns connect as well to previous-next cell
                    } else if ( ((row % 2) !== 0) && ((col % 2) === 0) && (col < (width - 1)) && !vertexBlocked(row - 1, col + 1) ) {
                        const prev = grid[row - 1][col + 1];
                        strokeLine(curr.x, curr.y, prev.x, prev.y);
                    }
                }
            }
        }
    }

    const delta = cellsize / 1.5;
    const xs = grid.flat().map(pt => pt.x);
    const ys = grid.flat().map(pt => pt.y);
    const minx = Math.min(...xs);
    const miny = Math.min(...ys);
    const maxx = Math.max(...xs);
    const maxy = Math.max(...ys);
    const boardFill: IPolyPolygon = {
        type: "poly",
        points: [
            {x: minx - (delta), y: miny - (delta)},
            {x: maxx + (delta), y: miny - (delta)},
            {x: maxx + (delta), y: maxy + (delta)},
            {x: minx - (delta), y: maxy + (delta)},
        ]
    };

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid});
    if (ctx.options.boardClick !== undefined) {
        attachNearestGridPointClick(board, grid, boardFill, ctx.options.boardClick, { blocked });
    }

    return {grid, boardFill};
}
