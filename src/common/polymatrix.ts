import { Orientation, type HexOffset } from "honeycomb-grid";
import type {
    APRenderRep,
    BoardStyles,
    Glyph,
    Polymatrix,
    PolymatrixHexCell,
    PolymatrixCellGlyph,
} from "../schemas/schema.js";

export type PolymatrixLegendLatticeInput = Pick<APRenderRep, "board">;

type Legend = NonNullable<APRenderRep["legend"]>;
import type { ColourResolvable } from "../index.js";

export type PolyLattice = "square" | "hex";

export function isPolymatrixCellEmpty(val: Polymatrix[number][number] | undefined): boolean {
    return val === undefined || val === null || val === 0;
}

export function isPolymatrixHexCell(val: unknown): val is PolymatrixHexCell {
    return typeof val === "object" && val !== null && "fill" in val;
}

/** True when any occupied cell declares a per-cell overlay (PUNCT-style decorations, etc.). */
export function polymatrixHasCellGlyphs(matrix: Polymatrix): boolean {
    for (const row of matrix) {
        if (row === undefined) {
            continue;
        }
        for (const val of row) {
            if (isPolymatrixHexCell(val) && val.glyph !== undefined) {
                return true;
            }
        }
    }
    return false;
}

export interface ResolvedPolymatrixCell {
    fill: ColourResolvable;
    glyphs: Glyph[];
}

export function resolvePolymatrixCellGlyphs(
    glyph: PolymatrixCellGlyph | undefined,
    legend: Legend | undefined,
): Glyph[] {
    if (glyph === undefined) {
        return [];
    }
    if (typeof glyph === "string") {
        if (legend === undefined || !(glyph in legend)) {
            throw new Error(`Polymatrix cell references missing legend key "${glyph}".`);
        }
        const entry = legend[glyph];
        if (Array.isArray(entry)) {
            return entry as Glyph[];
        }
        if (typeof entry === "object" && entry !== null) {
            return [entry as Glyph];
        }
        throw new Error(`Legend key "${glyph}" is not a glyph entry.`);
    }
    if (Array.isArray(glyph)) {
        return glyph;
    }
    return [glyph];
}

export function resolvePolymatrixCell(
    val: Polymatrix[number][number],
    legend: Legend | undefined,
): ResolvedPolymatrixCell | undefined {
    if (isPolymatrixCellEmpty(val)) {
        return undefined;
    }
    if (isPolymatrixHexCell(val)) {
        return {
            fill: val.fill,
            glyphs: resolvePolymatrixCellGlyphs(val.glyph, legend),
        };
    }
    return { fill: val as ColourResolvable, glyphs: [] };
}

/**
 * Lattice for legend / staging polymatrix icons. Uses `board.style` when present;
 * otherwise square (e.g. `board: null` inline glyphs without a style hint).
 */
export function resolvePolymatrixLegendLattice(rep: PolymatrixLegendLatticeInput | undefined): PolyLattice {
    if (rep === undefined) {
        return "square";
    }
    const board = rep.board;
    if (board !== null && board !== undefined && "style" in board && board.style !== undefined) {
        return polymatrixLattice(board.style);
    }
    return "square";
}

export function polymatrixLattice(style: string | undefined): PolyLattice {
    if (style === undefined) {
        return "square";
    }
    if (style.startsWith("squares") || style === "vertex" || style.startsWith("heightmap-squares")) {
        return "square";
    }
    if (
        style.startsWith("hex-") ||
        style === "conical-hex" ||
        style === "conical-hex-narrow" ||
        style === "pyramid-hex"
    ) {
        return "hex";
    }
    return "square";
}

export function hexOffsetParams(style: BoardStyles | string | undefined): {
    orientation: Orientation;
    offset: HexOffset;
} {
    let orientation = Orientation.POINTY;
    if (style !== undefined && style.endsWith("f")) {
        orientation = Orientation.FLAT;
    }
    let offset: HexOffset = -1;
    if (style !== undefined && style.includes("-even")) {
        offset = 1;
    }
    return { orientation, offset };
}

export interface PolymatrixOccupied {
    x: number;
    y: number;
    cell: ResolvedPolymatrixCell;
}

export function polymatrixOccupied(matrix: Polymatrix, legend: Legend | undefined): PolymatrixOccupied[] {
    const out: PolymatrixOccupied[] = [];
    for (let y = 0; y < matrix.length; y++) {
        const row = matrix[y];
        if (row === undefined) {
            continue;
        }
        for (let x = 0; x < row.length; x++) {
            const cell = resolvePolymatrixCell(row[x], legend);
            if (cell !== undefined) {
                out.push({ x, y, cell });
            }
        }
    }
    return out;
}

/** Odd-r offset neighbour deltas (col, row). Index 0..5 matches pointy `HEX_EDGE_ORDER.p`. */
const ODD_R_DELTA: readonly [readonly [number, number][], readonly [number, number][]] = [
    [
        [1, 0],
        [0, -1],
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, 1],
    ],
    [
        [1, 0],
        [1, -1],
        [0, -1],
        [-1, 0],
        [0, 1],
        [1, 1],
    ],
] as const;

export function hexNeighborAt(
    col: number,
    row: number,
    dir: number,
): { col: number; row: number } {
    const parity = row & 1;
    const delta = ODD_R_DELTA[parity]![dir]!;
    return { col: col + delta[0], row: row + delta[1] };
}

/**
 * Exterior outline width for hex polymatrix icons. Honeycomb rect-of-hex layouts span
 * more user units per matrix cell than hex-of-hex icon slots, so a fixed stroke of `1`
 * scales thinner once the shared legend viewBox is normalized.
 */
export function polymatrixExteriorStrokeWidth(
    matrix: Polymatrix,
    layoutBox: { width: number; height: number },
    cellsize: number,
    baseStrokeWidth: number,
): number {
    const gridW = Math.max(matrix[0]?.length ?? 1, 1);
    const gridH = Math.max(matrix.length, 1);
    const span = Math.max(layoutBox.width, layoutBox.height);
    const denom = cellsize * Math.max(gridW, gridH);
    if (denom <= 0) {
        return baseStrokeWidth;
    }
    return baseStrokeWidth * (span / denom);
}

export function polymatrixOccupiedSet(matrix: Polymatrix): Set<string> {
    const set = new Set<string>();
    for (let y = 0; y < matrix.length; y++) {
        const row = matrix[y];
        if (row === undefined) {
            continue;
        }
        for (let x = 0; x < row.length; x++) {
            if (!isPolymatrixCellEmpty(row[x])) {
                set.add(`${x},${y}`);
            }
        }
    }
    return set;
}

/** Compass edge between matrix cells for odd-r pointy (omit on internal edges). */
export const POINTY_HEX_EDGE_ORDER = ["NE", "E", "SE", "SW", "W", "NW"] as const;
export type PointyHexEdge = (typeof POINTY_HEX_EDGE_ORDER)[number];

export function internalHexEdgesForCell(
    matrix: Polymatrix,
    col: number,
    row: number,
): PointyHexEdge[] {
    const occupied = polymatrixOccupiedSet(matrix);
    const omitted: PointyHexEdge[] = [];
    for (let dir = 0; dir < 6; dir++) {
        const nb = hexNeighborAt(col, row, dir);
        if (occupied.has(`${nb.col},${nb.row}`)) {
            omitted.push(POINTY_HEX_EDGE_ORDER[dir]!);
        }
    }
    return omitted;
}