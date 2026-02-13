import { GridPoints, IPoint, IPolyPolygon, hexOfHex as hexOfHexGrid } from "../grids";
import { RendererBase } from "../renderers/_base";

export const hexOfHex = (ctx: RendererBase, opts?: {noSvg: boolean}): [GridPoints, IPolyPolygon[][]] => {
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
    const grid = hexOfHexGrid({gridWidthMin: minWidth, gridWidthMax: maxWidth, cellSize: cellsize, half, alternating});

    // Build polygons first
    // const myHex = defineHex({orientation: Orientation.POINTY, dimensions: 25})
    // const hexObj = new myHex();
    const triWidth = 50 / 2;
    const halfhex = triWidth / 2;
    const triHeight = (triWidth * Math.sqrt(3)) / 2;

    const pts: IPoint[] = [{x:triHeight,y:0}, {x:triHeight * 2,y:halfhex}, {x:triHeight * 2,y:halfhex + triWidth}, {x:triHeight,y:triWidth * 2}, {x:0,y:halfhex + triWidth}, {x:0,y:halfhex}];
    // const pts = hexObj.corners.map(({x,y}) => { return {x: x+21.650635, y: y+25}; });
    const polys: IPolyPolygon[][] = [];
    for (const row of grid) {
        const rowPolys: IPolyPolygon[] = [];
        for (const p of row) {
            const dx = p.x - triHeight; const dy = p.y - 25;
            rowPolys.push({
                type: "poly",
                points: pts.map(pt => { return {x: pt.x + dx, y: pt.y + dy}}),
            });
        }
        polys.push(rowPolys);
    }

    if (opts !== undefined && opts.noSvg === true) {
        return [grid, polys];
    }

    const board = ctx.rootSvg.group().id("board");
    const gridlines = board.group().id("hexes");
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

    /*
    Flat-topped hexes:
        half, 0
        (half+width), 0
        (width*2), height
        (half+width), (height*2)
        half, (height*2)
        0, height
    Pointy-topped hexes:
        height, 0
        (height*2), half
        (height*2), (half+width)
        height, (width*2)
        0, (half+width)
        0 half
    */

    // Draw the actual hexes
    type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
    let blocked: Blocked|undefined;
    if ( (ctx.json.board.blocked !== undefined) && (ctx.json.board.blocked !== null)  && (Array.isArray(ctx.json.board.blocked)) && (ctx.json.board.blocked.length > 0) ){
        blocked = [...(ctx.json.board.blocked as Blocked)];
    }

    const hex = ctx.rootSvg.defs().symbol().id("hex-symbol").viewbox(-3.3493649053890344, 0, 50, 50);
    hex.polygon(pts.map(pt => `${pt.x},${pt.y}`).join(" "))
        .fill({color: "white", opacity: 0}).id("hex-symbol-poly")
        .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke, linecap: "round", linejoin: "round"});
    for (let iRow = 0; iRow < grid.length; iRow++) {
        const row = grid[iRow];
        for (let iCol = 0; iCol < row.length; iCol++) {
            const p = row[iCol];
            if ( (blocked !== undefined) && (blocked.find(({col: x, row: y}) => x === iCol && y === iRow) !== undefined) ) {
                continue;
            }
            const c = gridlines.use(hex).size(cellsize, cellsize).center(p.x, p.y); // .move(p.x - (cellsize / 2), p.y - (cellsize / 2)); // .center(p.x, p.y);
            if (ctx.options.boardClick !== undefined) {
                c.click(() => ctx.options.boardClick!(iRow, iCol, ""));
            }
        }
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

    return [grid, polys];
}
