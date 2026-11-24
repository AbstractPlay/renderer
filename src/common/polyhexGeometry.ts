import { hexOfHex } from "../grids/hexOfHex.js";
import type { GridPoints, IPoint } from "../grids/_base.js";
import type { Polymatrix } from "../schemas/schema.js";
import {
    isPolymatrixCellEmpty,
    POINTY_HEX_EDGE_ORDER,
    polymatrixOccupiedSet,
    type PointyHexEdge,
} from "./polymatrix.js";

/** Extra viewBox margin so exterior edge strokes are not clipped when icons are scaled. */
export const POLYHEX_ICON_STROKE_PAD = 2;

const pointKey = (p: IPoint): string => `${p.x.toFixed(4)},${p.y.toFixed(4)}`;

const samePoint = (a: IPoint, b: IPoint): boolean => pointKey(a) === pointKey(b);

type ExteriorSegment = { a: IPoint; b: IPoint };

/** Edge index on polygon `a` that is shared with polygon `b` (unset if none). */
export function polyhexOfHexSharedEdgeOnA(a: IPoint[], b: IPoint[]): number | undefined {
    for (let i = 0; i < 6; i++) {
        const e1a = a[i]!;
        const e1b = a[(i + 1) % 6]!;
        for (let j = 0; j < 6; j++) {
            const e2a = b[j]!;
            const e2b = b[(j + 1) % 6]!;
            if (samePoint(e1a, e2b) && samePoint(e1b, e2a)) {
                return i;
            }
        }
    }
    return undefined;
}

/** Exterior edge indices (0..5) for a cell in a hex-of-hex polymatrix icon. */
export function polyhexOfHexExteriorEdges(
    matrix: Polymatrix,
    grid: GridPoints,
    col: number,
    row: number,
    cellSize: number,
): number[] {
    const a = polyhexOfHexCellPolygon(grid, col, row, cellSize);
    if (a === undefined) {
        return [];
    }
    const occupied = polymatrixOccupiedSet(matrix);
    const exterior: number[] = [];
    for (let edge = 0; edge < 6; edge++) {
        let internal = false;
        for (const key of occupied) {
            if (key === `${col},${row}`) {
                continue;
            }
            const [xs, ys] = key.split(",");
            const x = Number(xs);
            const y = Number(ys);
            const b = polyhexOfHexCellPolygon(grid, x, y, cellSize);
            if (b === undefined) {
                continue;
            }
            if (polyhexOfHexSharedEdgeOnA(a, b) === edge) {
                internal = true;
                break;
            }
        }
        if (!internal) {
            exterior.push(edge);
        }
    }
    return exterior;
}

/** Undirected exterior edges for a hex-of-hex polymatrix (one segment per outer edge). */
export function polyhexOfHexExteriorSegments(
    matrix: Polymatrix,
    grid: GridPoints,
    cellSize: number,
): ExteriorSegment[] {
    const out: ExteriorSegment[] = [];
    const seen = new Set<string>();
    for (const key of polymatrixOccupiedSet(matrix)) {
        const [xs, ys] = key.split(",");
        const col = Number(xs);
        const row = Number(ys);
        const pts = polyhexOfHexCellPolygon(grid, col, row, cellSize);
        if (pts === undefined) {
            continue;
        }
        for (const edge of polyhexOfHexExteriorEdges(matrix, grid, col, row, cellSize)) {
            const a = pts[edge]!;
            const b = pts[(edge + 1) % 6]!;
            const ka = pointKey(a);
            const kb = pointKey(b);
            const id = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
            if (seen.has(id)) {
                continue;
            }
            seen.add(id);
            out.push({ a, b });
        }
    }
    return out;
}

/** Chain outer segments into closed path data (local coords after offset). */
export function chainExteriorSegmentsToPathD(
    segments: ExteriorSegment[],
    offsetX: number,
    offsetY: number,
): string[] {
    if (segments.length === 0) {
        return [];
    }
    const remaining = [...segments];
    const paths: string[] = [];
    while (remaining.length > 0) {
        const seg = remaining.pop()!;
        const verts: IPoint[] = [seg.a, seg.b];
        let extended = true;
        while (extended) {
            extended = false;
            const tail = verts[verts.length - 1]!;
            const head = verts[0]!;
            for (let i = 0; i < remaining.length; i++) {
                const s = remaining[i]!;
                if (samePoint(s.a, tail)) {
                    verts.push(s.b);
                    remaining.splice(i, 1);
                    extended = true;
                    break;
                }
                if (samePoint(s.b, tail)) {
                    verts.push(s.a);
                    remaining.splice(i, 1);
                    extended = true;
                    break;
                }
                if (samePoint(s.b, head)) {
                    verts.unshift(s.a);
                    remaining.splice(i, 1);
                    extended = true;
                    break;
                }
                if (samePoint(s.a, head)) {
                    verts.unshift(s.b);
                    remaining.splice(i, 1);
                    extended = true;
                    break;
                }
            }
        }
        const closed = verts.length > 2 && samePoint(verts[0]!, verts[verts.length - 1]!);
        const uniqueVerts = closed ? verts.slice(0, -1) : verts;
        const parts = uniqueVerts.map((p, i) => {
            const x = p.x - offsetX;
            const y = p.y - offsetY;
            return i === 0 ? `M ${x},${y}` : `L ${x},${y}`;
        });
        if (uniqueVerts.length > 2) {
            parts.push("Z");
        }
        paths.push(parts.join(" "));
    }
    return paths;
}

/** Pointy hex polygon matching `boards/hexOfHex.ts` symbol geometry at `cellSize`. */
export function hexOfHexCellTemplate(cellSize: number): IPoint[] {
    const triWidth = cellSize / 2;
    const halfhex = triWidth / 2;
    const triHeight = (triWidth * Math.sqrt(3)) / 2;
    return [
        { x: triHeight, y: 0 },
        { x: triHeight * 2, y: halfhex },
        { x: triHeight * 2, y: halfhex + triWidth },
        { x: triHeight, y: triWidth * 2 },
        { x: 0, y: halfhex + triWidth },
        { x: 0, y: halfhex },
    ];
}

export function polyhexOfHexGridParams(matrix: Polymatrix): { minW: number; maxW: number } {
    const w = Math.max(matrix[0]?.length ?? 1, 1);
    const h = Math.max(matrix.length, 1);
    return { minW: w, maxW: Math.max(w + h - 1, w) };
}

export function polyhexOfHexCenterGrid(matrix: Polymatrix, cellSize: number): GridPoints {
    const { minW, maxW } = polyhexOfHexGridParams(matrix);
    return hexOfHex({ gridWidthMin: minW, gridWidthMax: maxW, cellSize });
}

export function polyhexOfHexCellPolygon(
    grid: GridPoints,
    col: number,
    row: number,
    cellSize: number,
): IPoint[] | undefined {
    const center = grid[row]?.[col];
    if (center === undefined) {
        return undefined;
    }
    const triWidth = cellSize / 2;
    const triHeight = (triWidth * Math.sqrt(3)) / 2;
    const anchorY = cellSize / 2;
    const template = hexOfHexCellTemplate(cellSize);
    return template.map((pt) => ({
        x: pt.x + center.x - triHeight,
        y: pt.y + center.y - anchorY,
    }));
}

/** Exterior edge indices on a polymatrix cell polygon (omit edges shared with another occupied cell). */
export function polymatrixCellExteriorEdgeIndices(
    polygonsByCell: Map<string, IPoint[]>,
    col: number,
    row: number,
): number[] {
    const self = polygonsByCell.get(`${col},${row}`);
    if (self === undefined) {
        return [];
    }
    const exterior: number[] = [];
    for (let edge = 0; edge < 6; edge++) {
        let internal = false;
        for (const [key, poly] of polygonsByCell) {
            if (key === `${col},${row}`) {
                continue;
            }
            if (polyhexOfHexSharedEdgeOnA(self, poly) === edge) {
                internal = true;
                break;
            }
        }
        if (!internal) {
            exterior.push(edge);
        }
    }
    return exterior;
}

export function polymatrixExteriorSegmentsFromPolygons(
    polygonsByCell: Map<string, IPoint[]>,
    exteriorEdges: (col: number, row: number) => number[],
): ExteriorSegment[] {
    const out: ExteriorSegment[] = [];
    const seen = new Set<string>();
    for (const key of polygonsByCell.keys()) {
        const [xs, ys] = key.split(",");
        const col = Number(xs);
        const row = Number(ys);
        const pts = polygonsByCell.get(key)!;
        for (const edge of exteriorEdges(col, row)) {
            const a = pts[edge]!;
            const b = pts[(edge + 1) % 6]!;
            const ka = pointKey(a);
            const kb = pointKey(b);
            const id = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
            if (seen.has(id)) {
                continue;
            }
            seen.add(id);
            out.push({ a, b });
        }
    }
    return out;
}

/**
 * ViewBox and normalization bounds for hex polymatrix icons: one `cellSize` slot per matrix
 * cell (matching square polymatrices), plus stroke padding — not the tight vertex hull.
 */
export function polyhexOfHexIconBounds(
    matrix: Polymatrix,
    cellSize: number,
): { minX: number; minY: number; width: number; height: number } {
    const grid = polyhexOfHexCenterGrid(matrix, cellSize);
    const half = cellSize / 2;
    const pad = POLYHEX_ICON_STROKE_PAD;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let y = 0; y < matrix.length; y++) {
        const row = matrix[y];
        if (row === undefined) {
            continue;
        }
        for (let x = 0; x < row.length; x++) {
            if (isPolymatrixCellEmpty(row[x])) {
                continue;
            }
            const center = grid[y]?.[x];
            if (center === undefined) {
                continue;
            }
            minX = Math.min(minX, center.x - half);
            minY = Math.min(minY, center.y - half);
            maxX = Math.max(maxX, center.x + half);
            maxY = Math.max(maxY, center.y + half);
        }
    }
    if (minX === Infinity) {
        return { minX: -pad, minY: -pad, width: cellSize + pad * 2, height: cellSize + pad * 2 };
    }
    return {
        minX: minX - pad,
        minY: minY - pad,
        width: maxX - minX + pad * 2,
        height: maxY - minY + pad * 2,
    };
}

/** Edges to omit on isometric lintels (shared faces), from hex-of-hex geometry — not odd-r axial labels. */
export function internalHexLintelEdgesForCell(
    matrix: Polymatrix,
    col: number,
    row: number,
    cellSize = 50,
): PointyHexEdge[] {
    const grid = polyhexOfHexCenterGrid(matrix, cellSize);
    const self = polyhexOfHexCellPolygon(grid, col, row, cellSize);
    if (self === undefined) {
        return [];
    }
    const omitted: PointyHexEdge[] = [];
    for (const key of polymatrixOccupiedSet(matrix)) {
        const [xs, ys] = key.split(",");
        const oc = Number(xs);
        const orow = Number(ys);
        if (oc === col && orow === row) {
            continue;
        }
        const other = polyhexOfHexCellPolygon(grid, oc, orow, cellSize);
        if (other === undefined) {
            continue;
        }
        const edgeIdx = polyhexOfHexSharedEdgeOnA(self, other);
        if (edgeIdx === undefined) {
            continue;
        }
        const label = POINTY_HEX_EDGE_ORDER[edgeIdx]!;
        if (!omitted.includes(label)) {
            omitted.push(label);
        }
    }
    return omitted;
}

/** @deprecated Use polyhexOfHexIconBounds; alias for layout normalization. */
export function polyhexOfHexLayoutBox(matrix: Polymatrix, cellSize: number): {
    minX: number;
    minY: number;
    width: number;
    height: number;
} {
    return polyhexOfHexIconBounds(matrix, cellSize);
}