import { GridPoints } from "../../grids/_base";
import { IsoPiece } from "../../schemas/schema";
import { Svg } from "@svgdotjs/svg.js";
import { Matrix } from "transformation-matrix-js";
import { effectiveCubeYaw } from "./cubeOrientation";
import { isoSymbolPlacement } from "./symbolPlacement";
import { IsoPiecesGrid, isMultiFaceCube, parseStackEntry } from "./stack";

export type IsoCellSortKey = {
    depth: number;
    topY: number;
    rotatedX: number;
    row: number;
    col: number;
};

export const ISO_SORT_EPSILON = 1e-4;

export type CellSortEntry = {
    row: number;
    col: number;
    x: number;
    y: number;
};

export const compareCellSortKeys = (a: IsoCellSortKey, b: IsoCellSortKey): number => {
    if (Math.abs(a.depth - b.depth) > ISO_SORT_EPSILON) {
        return a.depth - b.depth;
    }
    if (Math.abs(a.topY - b.topY) > ISO_SORT_EPSILON) {
        return a.topY - b.topY;
    }
    if (Math.abs(a.rotatedX - b.rotatedX) > ISO_SORT_EPSILON) {
        return a.rotatedX - b.rotatedX;
    }
    if (a.row !== b.row) {
        return a.row - b.row;
    }
    return a.col - b.col;
};

export const computeCellSortKey = (opts: {
    entry: CellSortEntry;
    cellsize: number;
    boardLocalGrid: GridPoints;
    tUserRotate: Matrix;
    heightmap: number[][] | undefined;
    pieces: IsoPiecesGrid | undefined;
    legend: { [k: string]: IsoPiece } | undefined;
    basePcScale: number;
    boardRotation: number;
    rootSvg: Svg;
}): IsoCellSortKey => {
    const {
        entry,
        cellsize,
        boardLocalGrid,
        tUserRotate,
        heightmap,
        pieces,
        legend,
        basePcScale,
        boardRotation,
        rootSvg,
    } = opts;

    const local = boardLocalGrid[entry.row][entry.col];
    const rotated = tUserRotate.applyToPoint(local.x, local.y);
    let depth = rotated.x + rotated.y;

    let terrainHeight = 0;
    if (heightmap !== undefined && heightmap.length > entry.row && heightmap[entry.row].length > entry.col) {
        terrainHeight = heightmap[entry.row][entry.col];
    }
    depth += terrainHeight * (cellsize / 100) * 0.4;

    let anchorY = entry.y;
    const surface = rootSvg.findOne(`#_surface_${terrainHeight.toString().replace(".", "_")}`) as Svg | null;
    if (surface !== null) {
        anchorY = isoSymbolPlacement(cellsize, entry.x, anchorY, surface, 1).anchorY;
    }

    let stackCount = 0;
    if (pieces !== undefined) {
        const stack = pieces[entry.row]?.[entry.col] ?? [];
        for (const stackItem of stack) {
            const { glyph, yaw } = parseStackEntry(stackItem);
            if (glyph === "" || glyph === "-") {
                continue;
            }
            stackCount++;
            let pieceId = glyph;
            if (legend !== undefined && legend[glyph] !== undefined && isMultiFaceCube(legend[glyph])) {
                pieceId = `${glyph}__y${effectiveCubeYaw(yaw, boardRotation)}`;
            }
            const piece = rootSvg.findOne("#" + pieceId) as Svg | null;
            if (piece !== null) {
                let pcScale = 0.75;
                if (legend !== undefined && glyph in legend && "scale" in legend[glyph] && legend[glyph].scale !== undefined) {
                    pcScale = legend[glyph].scale as number;
                }
                pcScale *= basePcScale;
                anchorY = isoSymbolPlacement(cellsize, entry.x, anchorY, piece, pcScale).anchorY;
            }
        }
    }
    depth -= stackCount * (cellsize / 100) * 0.12;

    return { depth, topY: anchorY, rotatedX: rotated.x, row: entry.row, col: entry.col };
};
