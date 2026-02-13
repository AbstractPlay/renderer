import { Element as SVGElement, StrokeData } from "@svgdotjs/svg.js";
import { GridPoints, IPoint, Poly } from "../grids";
import { RendererBase } from "../renderers/_base";
import { centroid } from "../common/plotting";
import { hexOfTri as hexOfTriGrid } from "../grids";

export const hexOfTriF = (ctx: RendererBase): [GridPoints, Poly[][]] => {
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
    // height is reduced by 1 for the -f version
    height--;

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
    const gridBase = hexOfTriGrid({gridWidthMin: minWidth, gridWidthMax: maxWidth, cellSize: cellsize, half, alternating});
    // now build the polys and derive the real grid from this
    const polys: Poly[][] = [];
    const grid: GridPoints = [];
    let midrow = maxWidth - minWidth;
    if (half === "bottom") {
        midrow = 0;
    }
    for (let row = 0; row < gridBase.length - 1; row++) {
        const pts: IPoint[] = [];
        const polyrow: Poly[] = [];
        for (let col = 0; col < gridBase[row].length; col++) {
            // above the midrow, start upright and alternate
            if (row < midrow) {
                // every point has an upright
                const pt1 = gridBase[row][col];
                const pt2 = gridBase[row+1][col+1];
                const pt3 = gridBase[row+1][col];
                polyrow.push({
                    type: "poly",
                    points: [pt1, pt2, pt3],
                });
                pts.push(centroid([pt1, pt2, pt3])!);
                // every point except the last has a downward
                if (col < gridBase[row].length - 1) {
                    const pt1 = gridBase[row][col];
                    const pt2 = gridBase[row][col+1];
                    const pt3 = gridBase[row+1][col + 1];
                    polyrow.push({
                        type: "poly",
                        points: [pt1, pt2, pt3],
                    });
                    pts.push(centroid([pt1, pt2, pt3])!);
                }
            }
            // starting at the midrow, start downward and alternate
            else {
                // every point but the first and last has an upright
                if (col > 0 && col < gridBase[row].length - 1) {
                    const pt1 = gridBase[row][col];
                    const pt2 = gridBase[row+1][col];
                    const pt3 = gridBase[row+1][col-1];
                    polyrow.push({
                        type: "poly",
                        points: [pt1, pt2, pt3],
                    });
                    pts.push(centroid([pt1, pt2, pt3])!);
                }
                // every point has a downward except the last
                if (col < gridBase[row].length - 1) {
                    const pt1 = gridBase[row][col];
                    const pt2 = gridBase[row][col+1];
                    const pt3 = gridBase[row+1][col];
                    polyrow.push({
                        type: "poly",
                        points: [pt1, pt2, pt3],
                    });
                    pts.push(centroid([pt1, pt2, pt3])!);
                }
            }
        }
        grid.push(pts);
        polys.push(polyrow);
    }

    const board = ctx.rootSvg.group().id("board");
    const gridlines = board.group().id("gridlines");

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

        for (let row = 0; row < gridBase.length - 1; row++) {
            let leftNum = "1";
            let rightNum = grid[row].length.toString();
            if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("reverse-numbers")) ) {
                const scratch = leftNum;
                leftNum = rightNum;
                rightNum = scratch;
            }

            const pointL = {x: gridBase[row][0].x - cellsize, y: (gridBase[row][0].y + gridBase[row+1][0].y) / 2};
            const pointR = {x: gridBase[row][gridBase[row].length - 1].x + cellsize, y: (gridBase[row][0].y + gridBase[row+1][0].y) / 2};
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
    const strokeAttrs: StrokeData = {color: baseColour, width: baseStroke, opacity: baseOpacity, linecap: "round", linejoin: "round"};

    for (let y = 0; y < polys.length; y++) {
        const slice = polys[y];
        for (let x = 0; x < slice.length; x++) {
            // skip if blocked
            const found = blocked?.find(b => b.col === x && b.row === y);
            if (found !== undefined) {
                continue;
            }
            const cell = slice[x];
            let ele: SVGElement;
            switch (cell.type) {
                case "circle":
                    ele = gridlines.circle(cell.r * 2).fill({color: "white", opacity: 0}).stroke(strokeAttrs).center(cell.cx, cell.cy);
                    break;
                case "poly":
                    ele = gridlines.polygon(cell.points.map(pt => `${pt.x},${pt.y}`).join(" ")).fill({color: "white", opacity: 0}).stroke(strokeAttrs);
                    break;
                case "path":
                    ele = gridlines.path(cell.path).fill({color: "white", opacity: 0}).stroke(strokeAttrs);
                    break;
            }
            if (ctx.options.boardClick !== undefined) {
                ele.click(() => ctx.options.boardClick!(y, x, ""));
            }
        }
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

    return [grid, polys];
}
