import { StrokeData } from "@svgdotjs/svg.js";
import { GridPoints, IPolyPath, IPolyPolygon, Poly } from "../grids";
import { RendererBase } from "../renderers/_base";
import { ptDistance, rotatePoint } from "../common/plotting";
import { IWheelArgs, wheelLabels, wheelPolys, wheel as wheelGrid } from "../grids/wheel";

export const wheel = (ctx: RendererBase): [GridPoints, Poly[][]] => {
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
    const strokeAttrs: StrokeData = {color: baseColour, width: baseStroke, opacity: baseOpacity, linecap: "round", linejoin: "round"};

    let start = 0;
    if ( ("circular-start" in ctx.json.board) && (ctx.json.board["circular-start"] !== undefined) ) {
        start = ctx.json.board["circular-start"];
    }

    // Get a grid of points
    const args: IWheelArgs = {gridHeight: height, gridWidth: width, cellSize: cellsize, start};
    const grid = wheelGrid(args);
    // interlace empty rows so that poly coordinates line up
    const polys: (IPolyPolygon | IPolyPath)[][] = wheelPolys(args).reduce((prev, curr) => [...prev, curr, []], [[]] as (IPolyPolygon | IPolyPath)[][])
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
        const labelPts = wheelLabels(args);
        const labels = board.group().id("labels");
        const columnLabels = ctx.getLabels(undefined, width);
        if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("reverse-letters")) ) {
            columnLabels.reverse();
        }

        // Columns (letters)
        for (let col = 0; col < width; col++) {
            const pt = labelPts[col];
            labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pt.x, pt.y);
        }
    }

    // Draw grid lines
    for (const cell of polys.flat()) {
        switch (cell.type) {
            case "poly":
                gridlines.polygon(cell.points.map(pt => `${pt.x},${pt.y}`).join(" ")).fill({color: "white", opacity: 0}).stroke(strokeAttrs);
                break;
            case "path":
                gridlines.path(cell.path).fill({color: "white", opacity: 0}).stroke(strokeAttrs);
                break;
        }
    }

    if (ctx.options.boardClick !== undefined) {
        const rotation = ctx.getRotation();
        const centre = ctx.getBoardCentre();
        const root = ctx.rootSvg;
        const genericCatcher = ((e: { clientX: number; clientY: number; }) => {
            const clicked = rotatePoint(root.point(e.clientX, e.clientY), rotation*-1, centre);
            // simply find the point that's closest to the click
            const closest = {
                dist: Infinity,
                row: null as (null|number),
                col: null as (null|number),
            };
            for (let row = 0; row < grid.length; row++) {
                for (let col = 0; col < grid[row].length; col++) {
                    const pt = grid[row][col];
                    const dist = ptDistance(pt.x, pt.y, clicked.x, clicked.y);
                    if (dist < closest.dist) {
                        closest.dist = dist;
                        closest.row = row;
                        closest.col = col;
                    }
                }
            }
            if (closest.dist !== Infinity && closest.row !== null && closest.col !== null) {
                ctx.options.boardClick!(closest.row, closest.col, "");
            }
        });
        ctx.rootSvg.click(genericCatcher);
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

    return [grid, polys];
}
