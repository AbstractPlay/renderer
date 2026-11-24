import type { Glyph, Polymatrix } from "../schemas/schema.js";
import {
    POINTY_HEX_EDGE_ORDER,
    polymatrixOccupied,
    resolvePolymatrixCell,
    type PointyHexEdge,
} from "./polymatrix.js";
import { internalHexLintelEdgesForCell, polyhexOfHexCenterGrid, polyhexOfHexCellPolygon, polyhexOfHexSharedEdgeOnA } from "./polyhexGeometry.js";
import { hexLintelName, type HexOrientation } from "../renderers/isometric/lintels.js";
import type { CompassDirection } from "../boards/index.js";
import type { APRenderRep } from "../schemas/schema.js";

type Legend = NonNullable<APRenderRep["legend"]>;

function offsetToAxial(col: number, row: number): { q: number; r: number } {
    const q = col - (row - (row & 1)) / 2;
    return { q, r: row };
}

function axialToOffset(q: number, r: number): { col: number; row: number } {
    const col = q + (r - (r & 1)) / 2;
    return { col, row: r };
}

function rotateAxial60(q: number, r: number, steps: number): { q: number; r: number } {
    let cq = q;
    let cr = r;
    const n = ((steps % 6) + 6) % 6;
    for (let i = 0; i < n; i++) {
        const nq = -cr;
        const nr = cq + cr;
        cq = nq;
        cr = nr;
    }
    return { q: cq, r: cr };
}

function axialRound(qf: number, rf: number): { q: number; r: number } {
    const sf = -qf - rf;
    let rq = Math.round(qf);
    let rr = Math.round(rf);
    const rs = Math.round(sf);
    const qDiff = Math.abs(rq - qf);
    const rDiff = Math.abs(rr - rf);
    const sDiff = Math.abs(rs - sf);
    if (qDiff > rDiff && qDiff > sDiff) {
        rq = -rr - rs;
    } else if (rDiff > sDiff) {
        rr = -rq - rs;
    }
    return { q: rq, r: rr };
}

/** Rotate polymatrix around occupied shape centre; +1 = clockwise 60°. */
export function matrixHexRotate60(matrix: Polymatrix, steps: number): Polymatrix {
    const occupied = polymatrixOccupied(matrix, undefined);
    if (occupied.length === 0) {
        return matrix.map((row) => [...row]);
    }
    const axial = occupied.map(({ x, y, cell }) => ({
        ...offsetToAxial(x, y),
        raw: matrix[y]![x]!,
        cell,
    }));
    const cq = axial.reduce((s, p) => s + p.q, 0) / axial.length;
    const cr = axial.reduce((s, p) => s + p.r, 0) / axial.length;
    const rotated = axial.map((p) => {
        const tq = p.q - cq;
        const tr = p.r - cr;
        const { q, r } = rotateAxial60(tq, tr, steps);
        const rounded = axialRound(q + cq, r + cr);
        const { col, row } = axialToOffset(rounded.q, rounded.r);
        return { col, row, raw: p.raw };
    });
    let minCol = Infinity;
    let minRow = Infinity;
    let maxCol = -Infinity;
    let maxRow = -Infinity;
    for (const p of rotated) {
        minCol = Math.min(minCol, p.col);
        minRow = Math.min(minRow, p.row);
        maxCol = Math.max(maxCol, p.col);
        maxRow = Math.max(maxRow, p.row);
    }
    const width = maxCol - minCol + 1;
    const height = maxRow - minRow + 1;
    const next: Polymatrix = [];
    for (let y = 0; y < height; y++) {
        const row: Polymatrix[number] = [];
        for (let x = 0; x < width; x++) {
            row.push(0);
        }
        next.push(row);
    }
    for (const p of rotated) {
        const x = p.col - minCol;
        const y = p.row - minRow;
        next[y]![x] = p.raw;
    }
    return next;
}

export interface PolyformLintelCell {
    matrixX: number;
    matrixY: number;
    lintel: string;
    omitted: PointyHexEdge[];
    fill: Polymatrix[number][number];
}

export function polyformToHexLintels(
    matrix: Polymatrix,
    orientation: HexOrientation = "p",
): PolyformLintelCell[] {
    const out: PolyformLintelCell[] = [];
    for (let y = 0; y < matrix.length; y++) {
        const row = matrix[y];
        if (row === undefined) {
            continue;
        }
        for (let x = 0; x < row.length; x++) {
            if (row[x] === undefined || row[x] === null || row[x] === 0) {
                continue;
            }
            const omitted = internalHexLintelEdgesForCell(matrix, x, y);
            const omittedCompass = omitted as CompassDirection[];
            const lintel =
                omitted.length === 0
                    ? (orientation === "f" ? "hexf" : "hexp")
                    : hexLintelName(orientation, omittedCompass);
            out.push({ matrixX: x, matrixY: y, lintel, omitted, fill: row[x]! });
        }
    }
    return out;
}

function cellFillColour(
    val: Polymatrix[number][number],
    legend: Legend | undefined,
): number | undefined {
    const resolved = resolvePolymatrixCell(val, legend);
    if (resolved === undefined) {
        return undefined;
    }
    const fill = resolved.fill;
    return typeof fill === "number" ? fill : undefined;
}

function cellDecorTop(
    val: Polymatrix[number][number],
    legend: Legend | undefined,
): Glyph[] | undefined {
    const resolved = resolvePolymatrixCell(val, legend);
    if (resolved === undefined || resolved.glyphs.length === 0) {
        return undefined;
    }
    return resolved.glyphs;
}

export interface PolyformBoardIsoPiece {
    row: number;
    col: number;
    piece: string;
    colour?: number;
    top?: Glyph[];
}

/**
 * Expand a polymatrix into per-cell isometric hex lintel placements at board anchor.
 */
export function polyformToBoardPieces(
    matrix: Polymatrix,
    anchorRow: number,
    anchorCol: number,
    legend: Legend | undefined,
    orientation: HexOrientation = "p",
): PolyformBoardIsoPiece[] {
    const lintels = polyformToHexLintels(matrix, orientation);
    return lintels.map((cell) => {
        const nb = { row: anchorRow + cell.matrixY, col: anchorCol + cell.matrixX };
        const colour = cellFillColour(cell.fill, legend);
        const top = cellDecorTop(cell.fill, legend);
        const piece: PolyformBoardIsoPiece = {
            row: nb.row,
            col: nb.col,
            piece: cell.lintel,
        };
        if (colour !== undefined) {
            piece.colour = colour;
        }
        if (top !== undefined) {
            piece.top = top;
        }
        return piece;
    });
}

/** Exported for tests: neighbour direction from (col,row) toward occupied neighbour. */
export function edgeTowardNeighbor(
    matrix: Polymatrix,
    col: number,
    row: number,
    ncol: number,
    nrow: number,
    cellSize = 50,
): PointyHexEdge | undefined {
    const grid = polyhexOfHexCenterGrid(matrix, cellSize);
    const self = polyhexOfHexCellPolygon(grid, col, row, cellSize);
    const other = polyhexOfHexCellPolygon(grid, ncol, nrow, cellSize);
    if (self === undefined || other === undefined) {
        return undefined;
    }
    const edgeIdx = polyhexOfHexSharedEdgeOnA(self, other);
    if (edgeIdx === undefined) {
        return undefined;
    }
    return POINTY_HEX_EDGE_ORDER[edgeIdx];
}