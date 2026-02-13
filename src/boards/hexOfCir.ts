import { GridPoints, IPolyCircle, hexOfCir as hexOfCirGrid } from "../grids";
import { RendererBase } from "../renderers/_base";

export const hexOfCir = (ctx: RendererBase, opts?: {noSvg: boolean}): [GridPoints, IPolyCircle[][]] => {
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
    const grid = hexOfCirGrid({gridWidthMin: minWidth, gridWidthMax: maxWidth, cellSize: cellsize, half, alternating});
    const board = ctx.rootSvg.group().id("board");
    const gridlines = board.group().id("circles");

    // build polys
    const polys: IPolyCircle[][] = [];
    for (const row of grid) {
        const polyRow: IPolyCircle[] = [];
        for (const p of row) {
            polyRow.push({type: "circle", r: cellsize/2, cx: p.x, cy: p.y});
        }
        polys.push(polyRow);
    }

    if (opts !== undefined && opts.noSvg === true) {
        return [grid, polys];
    }

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

        for (let row = 0; row < height; row++) {
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

    // Draw circles
    const circle = ctx.rootSvg.defs().symbol().id("circle-symbol").viewbox(0, 0, cellsize, cellsize);
    circle.circle(cellsize)
        .fill({color: "black", opacity: 0})
        .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke});
    for (let iRow = 0; iRow < grid.length; iRow++) {
        const row = grid[iRow];
        for (let iCol = 0; iCol < row.length; iCol++) {
            const p = row[iCol];
            const c = gridlines.use(circle).size(cellsize, cellsize).center(p.x, p.y);
            if (ctx.options.boardClick !== undefined) {
                c.click(() => ctx.options.boardClick!(iRow, iCol, ""));
            }
        }
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

    return [grid, polys];
}
