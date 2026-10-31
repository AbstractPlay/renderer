import type { IPoint, Poly } from "../grids/index.js";

/** Distance from square cell center to boundary along unit direction (ux, uy). */
export const squareCenterToEdgeAlongDirection = (cellsize: number, ux: number, uy: number): number => {
    const ax = Math.abs(ux);
    const ay = Math.abs(uy);
    if (ax < 1e-12 && ay < 1e-12) {
        return 0;
    }
    const half = cellsize / 2;
    return half / Math.max(ax, ay);
};

/** Halfway from center to edge along direction (default move-arrow inset). */
export const squareHalfExtentAlongDirection = (cellsize: number, ux: number, uy: number): number =>
    squareCenterToEdgeAlongDirection(cellsize, ux, uy) / 2;

const raySegmentHit = (
    ox: number,
    oy: number,
    dx: number,
    dy: number,
    ax: number,
    ay: number,
    bx: number,
    by: number,
): number | undefined => {
    const ex = bx - ax;
    const ey = by - ay;
    const denom = dx * ey - dy * ex;
    if (Math.abs(denom) < 1e-12) {
        return undefined;
    }
    const t = ((ax - ox) * ey - (ay - oy) * ex) / denom;
    const s = ((ax - ox) * dy - (ay - oy) * dx) / denom;
    if (t > 1e-9 && s >= -1e-9 && s <= 1 + 1e-9) {
        return t;
    }
    return undefined;
};

/** Ray from origin along unit dir; returns distance to first polygon edge hit. */
export const rayDistanceToPolygonBoundary = (origin: IPoint, dir: IPoint, vertices: readonly IPoint[]): number => {
    const len = Math.hypot(dir.x, dir.y);
    if (len < 1e-12 || vertices.length < 2) {
        return 0;
    }
    const dx = dir.x / len;
    const dy = dir.y / len;
    let best = Infinity;
    for (let i = 0; i < vertices.length; i++) {
        const a = vertices[i]!;
        const b = vertices[(i + 1) % vertices.length]!;
        const t = raySegmentHit(origin.x, origin.y, dx, dy, a.x, a.y, b.x, b.y);
        if (t !== undefined && t < best) {
            best = t;
        }
    }
    return best === Infinity ? 0 : best;
};

const unitVector = (from: IPoint, to: IPoint): IPoint | undefined => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-12) {
        return undefined;
    }
    return { x: dx / len, y: dy / len };
};

const shiftPoint = (p: IPoint, dir: IPoint, dist: number): IPoint => ({
    x: p.x + dir.x * dist,
    y: p.y + dir.y * dist,
});

/**
 * Trims first/last polyline vertices by `fraction` of the center→boundary distance
 * along the first/last segment direction.
 */
export const trimAnnotationEndpoints = (
    points: readonly IPoint[],
    insetAt: (vertexIndex: number, outwardUnit: IPoint) => number,
    fraction = 1,
): IPoint[] => {
    if (points.length < 2 || fraction <= 0) {
        return points.map((p) => ({ x: p.x, y: p.y }));
    }
    const out = points.map((p) => ({ x: p.x, y: p.y }));
    const firstLeg = unitVector(out[0]!, out[1]!);
    if (firstLeg !== undefined) {
        const inset0 = insetAt(0, firstLeg) * fraction;
        if (inset0 > 0) {
            out[0] = shiftPoint(out[0]!, firstLeg, inset0);
        }
    }
    const n = out.length - 1;
    const lastLeg = unitVector(out[n - 1]!, out[n]!);
    if (lastLeg !== undefined) {
        const insetN = insetAt(n, lastLeg) * fraction;
        if (insetN > 0) {
            out[n] = shiftPoint(out[n]!, lastLeg, -insetN);
        }
    }
    return out;
};

export const boardSupportsMoveCellInset = (style: string | undefined): boolean => {
    if (style === undefined) {
        return false;
    }
    if (style.startsWith("squares") || style === "pegboard") {
        return true;
    }
    if (style.startsWith("vertex")) {
        return true;
    }
    return style === "hex-of-hex" || style === "hex-of-tri" || style === "hex-of-cir";
};

export interface MoveCellInsetTarget {
    row: number;
    col: number;
}

export const shouldApplyMoveCellInset = (
    boardStyle: string | undefined,
    globalInset: boolean | undefined,
    noteCellInset: boolean | undefined,
): boolean => {
    if (!boardSupportsMoveCellInset(boardStyle)) {
        return false;
    }
    if (globalInset === false) {
        return false;
    }
    if (noteCellInset === false) {
        return false;
    }
    return true;
};

const polyVertices = (poly: Poly | null | undefined): IPoint[] | undefined => {
    if (poly === undefined || poly === null) {
        return undefined;
    }
    if (poly.type === "poly") {
        return poly.points;
    }
    if (poly.type === "path" && poly.points.length > 0) {
        return poly.points;
    }
    return undefined;
};

const insetFromCell = (
    center: IPoint,
    outward: IPoint,
    cellsize: number,
    poly: Poly | null | undefined,
): number => {
    const len = Math.hypot(outward.x, outward.y);
    if (len < 1e-12) {
        return 0;
    }
    const ux = outward.x / len;
    const uy = outward.y / len;
    const verts = polyVertices(poly);
    if (verts !== undefined && verts.length >= 3) {
        const toEdge = rayDistanceToPolygonBoundary(center, { x: ux, y: uy }, verts);
        return (toEdge / 2);
    }
    if (poly !== undefined && poly !== null && poly.type === "circle") {
        return poly.r / 2;
    }
    return squareHalfExtentAlongDirection(cellsize, ux, uy);
};

export const applyCellInsetToMovePoints = (
    points: readonly IPoint[],
    targets: readonly MoveCellInsetTarget[],
    cellsize: number,
    polys: (Poly | null)[][] | undefined,
    fraction = 1,
): IPoint[] => {
    if (points.length !== targets.length || points.length < 2) {
        return points.map((p) => ({ x: p.x, y: p.y }));
    }
    return trimAnnotationEndpoints(points, (vertexIndex, outward) => {
        const target = targets[vertexIndex];
        if (target === undefined) {
            return squareHalfExtentAlongDirection(cellsize, outward.x, outward.y);
        }
        const center = points[vertexIndex]!;
        const poly = polys?.[target.row]?.[target.col];
        return insetFromCell(center, outward, cellsize, poly);
    }, fraction);
};
