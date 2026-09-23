import { G as SVGG } from "@svgdotjs/svg.js";
import { GridPoints, IPolyPolygon } from "../grids/index.js";
import { APRenderRep } from "../schemas/schema.js";

type RenderOptions = APRenderRep["options"];

const strokeAttrs = {
    linecap: "round" as const,
    linejoin: "round" as const,
};

export function hasNoBorder(options?: RenderOptions): boolean {
    return options !== undefined && options.includes("no-border");
}

export function shouldEmphasizeSquaresOuterBorder(
    options?: RenderOptions,
    blocked?: readonly unknown[],
): boolean {
    if (hasNoBorder(options)) {
        return false;
    }
    if (blocked !== undefined && blocked.length > 0) {
        return false;
    }
    return true;
}

export type SquaresOuterBorderParams = {
    grid: GridPoints;
    width: number;
    height: number;
    cellsize: number;
    baseStroke: number;
    baseColour: string;
    baseOpacity: number;
    tilex: number;
    tiley: number;
    options?: RenderOptions;
    blocked?: readonly unknown[];
};

export function drawSquaresOuterBorder(strokes: SVGG, params: SquaresOuterBorderParams): void {
    const {
        grid,
        width,
        height,
        cellsize,
        baseStroke,
        baseColour,
        baseOpacity,
        tilex,
        tiley,
        options,
        blocked,
    } = params;
    if (!shouldEmphasizeSquaresOuterBorder(options, blocked)) {
        return;
    }

    const half = cellsize / 2;
    const xLeft = grid[0][0].x - half;
    const xRight = grid[0][width - 1].x + half;
    const yTop = grid[0][0].y - half;
    const yBottom = grid[height - 1][0].y + half;
    const outerStroke = baseStroke * 2;
    const stroke = {
        width: outerStroke,
        color: baseColour,
        opacity: baseOpacity,
        ...strokeAttrs,
    };

    if (tiley === 0) {
        strokes.line(xLeft, yTop, xRight, yTop).stroke(stroke).attr({ "pointer-events": "none" });
        strokes.line(xLeft, yBottom, xRight, yBottom).stroke(stroke).attr({ "pointer-events": "none" });
    }
    if (tilex === 0) {
        strokes.line(xLeft, yTop, xLeft, yBottom).stroke(stroke).attr({ "pointer-events": "none" });
        strokes.line(xRight, yTop, xRight, yBottom).stroke(stroke).attr({ "pointer-events": "none" });
    }
}

export type SquareCellGridParams = {
    row: number;
    col: number;
    width: number;
    height: number;
    cx: number;
    cy: number;
    half: number;
    baseStroke: number;
    baseColour: string;
    baseOpacity: number;
    options?: RenderOptions;
    blocked?: readonly unknown[];
};

function drawSegment(
    strokes: SVGG,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    baseStroke: number,
    baseColour: string,
    baseOpacity: number,
): void {
    strokes.line(x1, y1, x2, y2)
        .stroke({ width: baseStroke, color: baseColour, opacity: baseOpacity, ...strokeAttrs });
}

export function drawSquareCellGridEdges(strokes: SVGG, params: SquareCellGridParams): void {
    const {
        row,
        col,
        width,
        height,
        cx,
        cy,
        half,
        baseStroke,
        baseColour,
        baseOpacity,
        options,
        blocked,
    } = params;

    const topLeft = { x: cx - half, y: cy - half };
    const topRight = { x: cx + half, y: cy - half };
    const bottomRight = { x: cx + half, y: cy + half };
    const bottomLeft = { x: cx - half, y: cy + half };

    const emphasizeOuter = shouldEmphasizeSquaresOuterBorder(options, blocked);
    const noBorder = hasNoBorder(options);

    const onTop = row === 0;
    const onBottom = row === height - 1;
    const onLeft = col === 0;
    const onRight = col === width - 1;

    const drawTop = !noBorder || !onTop;
    const drawBottom = !noBorder || !onBottom;
    const drawLeft = !noBorder || !onLeft;
    const drawRight = !noBorder || !onRight;

    if (emphasizeOuter) {
        if (!onTop && drawTop) {
            drawSegment(strokes, topLeft.x, topLeft.y, topRight.x, topRight.y, baseStroke, baseColour, baseOpacity);
        }
        if (!onRight && drawRight) {
            drawSegment(strokes, topRight.x, topRight.y, bottomRight.x, bottomRight.y, baseStroke, baseColour, baseOpacity);
        }
        if (!onBottom && drawBottom) {
            drawSegment(strokes, bottomRight.x, bottomRight.y, bottomLeft.x, bottomLeft.y, baseStroke, baseColour, baseOpacity);
        }
        if (!onLeft && drawLeft) {
            drawSegment(strokes, bottomLeft.x, bottomLeft.y, topLeft.x, topLeft.y, baseStroke, baseColour, baseOpacity);
        }
        return;
    }

    if (drawTop) {
        drawSegment(strokes, topLeft.x, topLeft.y, topRight.x, topRight.y, baseStroke, baseColour, baseOpacity);
    }
    if (drawRight) {
        drawSegment(strokes, topRight.x, topRight.y, bottomRight.x, bottomRight.y, baseStroke, baseColour, baseOpacity);
    }
    if (drawBottom) {
        drawSegment(strokes, bottomRight.x, bottomRight.y, bottomLeft.x, bottomLeft.y, baseStroke, baseColour, baseOpacity);
    }
    if (drawLeft) {
        drawSegment(strokes, bottomLeft.x, bottomLeft.y, topLeft.x, topLeft.y, baseStroke, baseColour, baseOpacity);
    }
}

function segmentKey(x1: number, y1: number, x2: number, y2: number): string {
    const ax = Math.round(x1 * 1000);
    const ay = Math.round(y1 * 1000);
    const bx = Math.round(x2 * 1000);
    const by = Math.round(y2 * 1000);
    if (ax < bx || (ax === bx && ay <= by)) {
        return `${ax},${ay},${bx},${by}`;
    }
    return `${bx},${by},${ax},${ay}`;
}

function parseSegmentKey(key: string): [number, number, number, number] {
    const parts = key.split(",").map(Number);
    return [parts[0]! / 1000, parts[1]! / 1000, parts[2]! / 1000, parts[3]! / 1000];
}

export function collectPolyBoundarySegmentKeys(
    polys: IPolyPolygon[][],
    blocked?: readonly { row: number; col: number }[],
): string[] {
    const counts = new Map<string, number>();
    for (let row = 0; row < polys.length; row++) {
        for (let col = 0; col < polys[row].length; col++) {
            const isBlocked = blocked?.find(entry => entry.row === row && entry.col === col) !== undefined;
            if (isBlocked) {
                continue;
            }
            const points = polys[row][col].points;
            for (let i = 0; i < points.length; i++) {
                const a = points[i]!;
                const b = points[(i + 1) % points.length]!;
                const key = segmentKey(a.x, a.y, b.x, b.y);
                counts.set(key, (counts.get(key) ?? 0) + 1);
            }
        }
    }
    const boundary: string[] = [];
    for (const [key, count] of counts) {
        if (count === 1) {
            boundary.push(key);
        }
    }
    return boundary;
}

export type PolyBoundaryEmphasisParams = {
    polys: IPolyPolygon[][];
    baseStroke: number;
    baseColour: string;
    baseOpacity: number;
    options?: RenderOptions;
    blocked?: readonly { row: number; col: number }[];
};

export function drawPolyBoundaryEmphasis(strokes: SVGG, params: PolyBoundaryEmphasisParams): void {
    const { polys, baseStroke, baseColour, baseOpacity, options, blocked } = params;
    if (!shouldEmphasizeSquaresOuterBorder(options, blocked)) {
        return;
    }
    const keys = collectPolyBoundarySegmentKeys(polys, blocked);
    const stroke = {
        width: baseStroke * 2,
        color: baseColour,
        opacity: baseOpacity,
        ...strokeAttrs,
    };
    for (const key of keys) {
        const [x1, y1, x2, y2] = parseSegmentKey(key);
        strokes.line(x1, y1, x2, y2).stroke(stroke).attr({ "pointer-events": "none" });
    }
}
