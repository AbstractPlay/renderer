import { Element as SVGElement, StrokeData } from "@svgdotjs/svg.js";
import { GridPoints, IPolyPath, IPolyPolygon } from "../grids/index.js";
import { RendererBase } from "../renderers/_base.js";
import { ptDistance, rotatePoint } from "../common/plotting.js";
import tinycolor from "tinycolor2";
import {
    IWheelArgs,
    resolveWheelArgs,
    wheelGridBoth,
    wheelGridSpaces,
    wheelGridVertices,
    wheelLabels,
    wheelPolys,
    wheelPolysInterlaced,
} from "../grids/wheel.js";
import { BoardReturn, createGridlineLayers, getBoardFill } from "./index.js";

type WheelStyle =
    | "circular-wheel"
    | "circular-wheel-spaces"
    | "circular-wheel-vertices"
    | "circular-wheel-spaces-checkered";

type Blocked = [{row: number; col: number;}, ...{row: number; col: number;}[]];

function isBlocked(blocked: Blocked | undefined, row: number, col: number): boolean {
    if (blocked === undefined) {
        return false;
    }
    return blocked.some(o => o.row === row && o.col === col);
}

function drawPolyFill(
    layers: ReturnType<typeof createGridlineLayers>,
    cell: IPolyPolygon | IPolyPath,
    fill: {color: string; opacity: number},
): void {
    switch (cell.type) {
        case "poly":
            layers.fill.polygon(cell.points.map(pt => `${pt.x},${pt.y}`).join(" "))
                .fill({color: fill.color, opacity: fill.opacity}).stroke("none");
            break;
        case "path":
            layers.fill.path(cell.path).fill({color: fill.color, opacity: fill.opacity}).stroke("none");
            break;
    }
}

function drawPolyStroke(
    layers: ReturnType<typeof createGridlineLayers>,
    cell: IPolyPolygon | IPolyPath,
    strokeAttrs: StrokeData,
    onClick?: () => void,
): SVGElement {
    let ele: SVGElement;
    switch (cell.type) {
        case "poly":
            ele = layers.strokes.polygon(cell.points.map(pt => `${pt.x},${pt.y}`).join(" "))
                .fill({color: "white", opacity: 0}).stroke(strokeAttrs);
            break;
        case "path":
            ele = layers.strokes.path(cell.path).fill({color: "white", opacity: 0}).stroke(strokeAttrs);
            break;
        default:
            throw new Error("Unexpected poly type");
    }
    if (onClick !== undefined) {
        ele.click(onClick);
    }
    return ele;
}

function deriveBoardFill(grid: GridPoints, cellsize: number): IPolyPolygon {
    const delta = cellsize / 1.5;
    const xs = grid.flat().map(pt => pt.x);
    const ys = grid.flat().map(pt => pt.y);
    const minx = Math.min(...xs);
    const miny = Math.min(...ys);
    const maxx = Math.max(...xs);
    const maxy = Math.max(...ys);
    return {
        type: "poly",
        points: [
            {x: minx - delta, y: miny - delta},
            {x: maxx + delta, y: miny - delta},
            {x: maxx + delta, y: maxy + delta},
            {x: minx - delta, y: maxy + delta},
        ],
    };
}

function nearestGridClick(
    ctx: RendererBase,
    grid: GridPoints,
    blocked: Blocked | undefined,
    rowFilter?: (row: number) => boolean,
): void {
    const rotation = ctx.getRotation();
    const centre = ctx.getBoardCentre();
    const root = ctx.rootSvg!;
    const handler = (e: { clientX: number; clientY: number; }) => {
        const clicked = rotatePoint(root.point(e.clientX, e.clientY), rotation * -1, centre);
        const closest = {dist: Infinity, row: null as null | number, col: null as null | number};
        for (let row = 0; row < grid.length; row++) {
            if (rowFilter !== undefined && !rowFilter(row)) {
                continue;
            }
            for (let col = 0; col < grid[row].length; col++) {
                if (isBlocked(blocked, row, col)) {
                    continue;
                }
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
    };
    root.click(handler);
}

export const wheel = (ctx: RendererBase): BoardReturn => {
    if ( (ctx.json === undefined) || (ctx.rootSvg === undefined) ) {
        throw new Error("Object in an invalid state!");
    }

    if ( (ctx.json.board === null) || (! ("width" in ctx.json.board)) || (! ("height" in ctx.json.board)) || (ctx.json.board.width === undefined) || (ctx.json.board.height === undefined) ) {
        throw new Error("Both the `width` and `height` properties are required for this board type.");
    }
    if ( (! ("style" in ctx.json.board)) || (ctx.json.board.style === undefined) ) {
        throw new Error("This function requires that a board style be defined.");
    }

    const style = ctx.json.board.style as WheelStyle;
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
    let innerRadius = 0;
    if ( ("circular-inner" in ctx.json.board) && (ctx.json.board["circular-inner"] !== undefined) ) {
        innerRadius = ctx.json.board["circular-inner"];
    }

    const args: IWheelArgs = {gridHeight: height, gridWidth: width, cellSize: cellsize, start, innerRadius};

    const spacesMode = style === "circular-wheel-spaces" || style === "circular-wheel-spaces-checkered";
    const verticesMode = style === "circular-wheel-vertices";
    const checkered = style === "circular-wheel-spaces-checkered";

    const ringPolys = wheelPolys(args);
    let grid: GridPoints;
    let polys: (IPolyPolygon | IPolyPath)[][];
    if (spacesMode) {
        grid = wheelGridSpaces(args);
        polys = ringPolys;
    } else if (verticesMode) {
        grid = wheelGridVertices(args);
        polys = ringPolys;
    } else {
        grid = wheelGridBoth(args);
        polys = wheelPolysInterlaced(args);
    }

    let blocked: Blocked | undefined;
    if ( (ctx.json.board.blocked !== undefined) && (ctx.json.board.blocked !== null) && (Array.isArray(ctx.json.board.blocked)) && (ctx.json.board.blocked.length > 0) ) {
        blocked = [...(ctx.json.board.blocked as Blocked)];
    }

    const board = ctx.rootSvg.group().id("board");
    const layers = createGridlineLayers(board);
    const gridlines = layers.root;

    const [cellFill, cellOpacity] = getBoardFill(ctx, ctx.options.colourContext.background);

    if (spacesMode) {
        if (checkered) {
            const cBg = tinycolor(cellFill ?? ctx.options.colourContext.background);
            const cFill = tinycolor(ctx.options.colourContext.fill);
            let lightOpacity = 0;
            let darkOpacity = baseOpacity * 0.25;
            let lightColor = cellFill ?? ctx.options.colourContext.background;
            let darkColor = ctx.options.colourContext.fill;
            if (cBg.getLuminance() <= cFill.getLuminance()) {
                lightOpacity = baseOpacity * 0.25;
                darkOpacity = 0;
                lightColor = ctx.options.colourContext.fill;
                darkColor = cellFill ?? ctx.options.colourContext.background;
            }

            let startLight = 1;
            if (height % 2 === 0) {
                startLight = 0;
            }
            if ("startLight" in ctx.json.board) {
                startLight = ctx.json.board.startLight ? 0 : 1;
            }

            for (let row = 0; row < ringPolys.length; row++) {
                let lightCol = 1;
                if (row % 2 === startLight) {
                    lightCol = 0;
                }
                for (let col = 0; col < ringPolys[row].length; col++) {
                    if (isBlocked(blocked, row, col)) {
                        continue;
                    }
                    const cell = ringPolys[row][col];
                    const dark = col % 2 !== lightCol;
                    drawPolyFill(layers, cell, {
                        color: dark ? darkColor : lightColor,
                        opacity: dark ? darkOpacity : lightOpacity,
                    });
                }
            }
        } else {
            for (let row = 0; row < ringPolys.length; row++) {
                for (let col = 0; col < ringPolys[row].length; col++) {
                    if (isBlocked(blocked, row, col)) {
                        continue;
                    }
                    drawPolyFill(layers, ringPolys[row][col], {
                        color: cellFill ?? ctx.options.colourContext.background,
                        opacity: cellOpacity,
                    });
                }
            }
        }
    } else if (verticesMode) {
        for (let row = 0; row < ringPolys.length; row++) {
            for (let col = 0; col < ringPolys[row].length; col++) {
                drawPolyFill(layers, ringPolys[row][col], {
                    color: cellFill ?? ctx.options.colourContext.background,
                    opacity: cellOpacity,
                });
            }
        }
    } else {
        for (const row of ringPolys) {
            for (const cell of row) {
                drawPolyFill(layers, cell, {
                    color: cellFill ?? ctx.options.colourContext.background,
                    opacity: cellOpacity,
                });
            }
        }
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: true, grid, polys});

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
        let customLabels: string[] | undefined;
        if ( ("columnLabels" in ctx.json.board) && (ctx.json.board.columnLabels !== undefined) ) {
            customLabels = ctx.json.board.columnLabels;
        }
        let columnLabels: string[];
        if (customLabels !== undefined) {
            columnLabels = ctx.getLabels(customLabels, width);
        } else if (ctx.json.options?.includes("swap-labels")) {
            columnLabels = ctx.getRowLabels(undefined, width);
            columnLabels.reverse();
        } else {
            columnLabels = ctx.getLabels(undefined, width);
        }
        if ( (ctx.json.options !== undefined) && (
            ctx.json.options.includes("reverse-letters") || ctx.json.options.includes("reverse-numbers")
        ) ) {
            columnLabels.reverse();
        }
        for (let col = 0; col < width; col++) {
            const pt = labelPts[col];
            labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pt.x, pt.y);
        }
    }

    if (verticesMode) {
        const spoke = resolveWheelArgs(args);
        const {pts, dists, gridHeight, gridWidth} = spoke;
        for (let i = 0; i < gridWidth; i++) {
            const outerRow = 0;
            const innerRow = gridHeight;
            const outerBlocked = isBlocked(blocked, outerRow, i);
            const innerBlocked = isBlocked(blocked, innerRow, i);
            if (!outerBlocked && !innerBlocked) {
                const p0 = pts[i][0];
                const p1 = pts[i][gridHeight];
                layers.strokes.line(p0.x, p0.y, p1.x, p1.y)
                    .stroke(strokeAttrs)
                    .attr({"pointer-events": "none"});
            }
        }
        for (let ring = 0; ring <= gridHeight; ring++) {
            const row = gridHeight - ring;
            const r = dists[ring];
            for (let i = 0; i < gridWidth; i++) {
                const col = i;
                const nextCol = (i + 1) % gridWidth;
                const blockedHere = isBlocked(blocked, row, col);
                const blockedNext = isBlocked(blocked, row, nextCol);
                if (blockedHere || blockedNext) {
                    continue;
                }
                const p0 = pts[i][ring];
                const p1 = pts[i + 1][ring];
                layers.strokes.path(`M${p0.x},${p0.y} A ${r} ${r} 0 0 1 ${p1.x},${p1.y}`)
                    .fill({color: "white", opacity: 0})
                    .stroke(strokeAttrs)
                    .attr({"pointer-events": "none"});
            }
        }
    } else if (spacesMode) {
        for (let row = 0; row < ringPolys.length; row++) {
            for (let col = 0; col < ringPolys[row].length; col++) {
                if (isBlocked(blocked, row, col)) {
                    continue;
                }
                const cell = ringPolys[row][col];
                const onClick = ctx.options.boardClick !== undefined
                    ? () => ctx.options.boardClick!(row, col, "")
                    : undefined;
                drawPolyStroke(layers, cell, strokeAttrs, onClick);
            }
        }
    } else {
        for (const cell of polys.flat()) {
            if (cell === undefined || cell === null || !("type" in cell)) {
                continue;
            }
            drawPolyStroke(layers, cell, strokeAttrs);
        }
    }

    if (ctx.options.boardClick !== undefined) {
        if (verticesMode) {
            nearestGridClick(ctx, grid, blocked);
        } else if (!spacesMode) {
            nearestGridClick(ctx, grid, blocked);
        }
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

    const boardFill = deriveBoardFill(grid, cellsize);
    return {grid, polys, boardFill};
};
