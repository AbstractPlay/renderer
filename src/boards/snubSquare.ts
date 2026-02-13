import { GridPoints, snubsquare, SnubStart } from "../grids";
import { RendererBase } from "../renderers/_base";
import { rotatePoint } from "../common/plotting";

export const snubSquare = (ctx: RendererBase): GridPoints => {
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

        const buffer = cellsize * 0.75;
        // Columns (letters)
        for (let col = 0; col < width; col++) {
            const pointTop = {x: grid[0][col].x, y: miny - buffer};
            const pointBottom = {x: grid[height - 1][col].x, y: maxy + buffer};
            if (! hideHalf) {
                labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
            }
            labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
        }

        // Rows (numbers)
        for (let row = 0; row < height; row++) {
            const pointL = {x: minx - buffer, y: grid[row][0].y};
            const pointR = {x: maxx + buffer, y: grid[row][width - 1].y};
            labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
            if (! hideHalf) {
                labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
            }
        }
    }

    // Draw grid lines
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const curr = grid[row][col];

            // always connect to previous cell
            if (col > 0) {
                const prev = grid[row][col - 1];
                const x1 = curr.x;
                const y1 = curr.y;
                const x2 = prev.x;
                const y2 = prev.y;
                gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
            }

            if (row > 0) {
                // always connect to cell directly above
                let prev = grid[row - 1][col];
                let x1 = curr.x;
                let y1 = curr.y;
                let x2 = prev.x;
                let y2 = prev.y;
                gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                if (snubStart === "S") {
                    // even row, odd columns connect as well to previous-above cell
                    if ( ( (row % 2) === 0) && ( (col % 2) !== 0) ) {
                        prev = grid[row - 1][col - 1];
                        x1 = curr.x;
                        y1 = curr.y;
                        x2 = prev.x;
                        y2 = prev.y;
                        gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                    // odd row, odd columns connect as well to previous-next cell
                    } else if ( ((row % 2) !== 0) && ((col % 2) !== 0) && (col < (width - 1)) ) {
                        prev = grid[row - 1][col + 1];
                        x1 = curr.x;
                        y1 = curr.y;
                        x2 = prev.x;
                        y2 = prev.y;
                        gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                    }
                } else {
                    // even row, even columns > 0 connect as well to previous-above cell
                    if ( ( (row % 2) === 0) && ( (col % 2) === 0) && col > 0 ) {
                        prev = grid[row - 1][col - 1];
                        x1 = curr.x;
                        y1 = curr.y;
                        x2 = prev.x;
                        y2 = prev.y;
                        gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                    // odd row, even columns connect as well to previous-next cell
                    } else if ( ((row % 2) !== 0) && ((col % 2) === 0) && (col < (width - 1)) ) {
                        prev = grid[row - 1][col + 1];
                        x1 = curr.x;
                        y1 = curr.y;
                        x2 = prev.x;
                        y2 = prev.y;
                        gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                    }
                }
            }
        }
    }

    if (ctx.options.boardClick !== undefined) {
        const rotation = ctx.getRotation();
        const centre = ctx.getBoardCentre();
        const root = ctx.rootSvg;
        const genericCatcher = ((e: { clientX: number; clientY: number; }) => {
            const point = rotatePoint(root.point(e.clientX, e.clientY), rotation*-1, centre);
            let min = Number.MAX_VALUE;
            let row0 = 0;
            let col0 = 0;
            for (let row = 0; row < height; row++) {
                const currRow = grid[row];
                for (let col = 0; col < width; col++) {
                    const curr = currRow[col];
                    const dist2 = Math.pow(point.x - curr.x, 2.0) + Math.pow(point.y - curr.y, 2.0);
                    if (dist2 < min) {
                        min = dist2;
                        row0 = row;
                        col0 = col;
                    }
                }
            }
            ctx.options.boardClick!(row0, col0, "");
        });
        ctx.rootSvg.click(genericCatcher);
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid});

    return grid;
}
