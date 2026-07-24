import type { G, Svg } from "@svgdotjs/svg.js";
import type { AreaPieces, DominoTileRef } from "../schemas/schema";
import { usePieceAt } from "./plotting";

/** Matches default renderer piece scale on `square*` boards. */
export const DOMINO_HAND_PIECE_SCALE = 0.85;

/** Legend composites are authored for a 500-unit cell (see `usePieceAt`). */
const LEGEND_CELL_SIZE = 500;

export const isDominoTileRef = (entry: string | DominoTileRef): entry is DominoTileRef => {
    return typeof entry === "object" && entry !== null && "domino" in entry;
};

/** Whether hand pieces in a `pieces` area should receive board rotation at placement time. */
export const shouldRotateAreaPieces = (area: AreaPieces): boolean => {
    if (area.rotateWithBoard !== undefined) {
        return area.rotateWithBoard;
    }
    return !area.pieces.every(isDominoTileRef);
};

export const piecesAreaSlotWidth = (entry: string | DominoTileRef, ordinaryCellsize: number, boardCellsize: number): number => {
    return isDominoTileRef(entry) ? boardCellsize * 2 : ordinaryCellsize;
};

export const piecesAreaSlotHeight = (entry: string | DominoTileRef, ordinaryCellsize: number, boardCellsize: number): number => {
    return isDominoTileRef(entry) ? boardCellsize : ordinaryCellsize;
};

/** Board cells consumed by one entry when wrapping a `pieces` area row. */
export const piecesAreaCellSpan = (entry: string | DominoTileRef): number => {
    return isDominoTileRef(entry) ? 2 : 1;
};

/**
 * Pack area entries into rows by board cell width. Domino tiles count as two cells
 * and are never split across rows.
 */
export const buildPiecesAreaRows = (
    pieces: (string | DominoTileRef)[],
    maxCellsPerRow: number,
): number[][] => {
    const rows: number[][] = [];
    let currentRow: number[] = [];
    let cellsInRow = 0;
    for (let i = 0; i < pieces.length; i++) {
        const span = piecesAreaCellSpan(pieces[i]);
        if (cellsInRow > 0 && cellsInRow + span > maxCellsPerRow) {
            rows.push(currentRow);
            currentRow = [];
            cellsInRow = 0;
        }
        currentRow.push(i);
        cellsInRow += span;
    }
    if (currentRow.length > 0) {
        rows.push(currentRow);
    }
    return rows;
};

/** Extra horizontal space after each domino tile in a `pieces` area (fraction of board cell size). */
export const DOMINO_HAND_TILE_GAP = 0.25;

/** Vertical space between wrapped rows in a `pieces` area (fraction of board cell size). */
export const PIECES_AREA_ROW_GAP = 0.10;

export const piecesAreaHorizontalGap = (
    entry: string | DominoTileRef,
    hpad: number,
    boardCellsize: number,
): number => {
    return hpad + (isDominoTileRef(entry) ? boardCellsize * DOMINO_HAND_TILE_GAP : 0);
};

export const piecesAreaVerticalGap = (hpad: number, boardCellsize: number): number => {
    return hpad + boardCellsize * PIECES_AREA_ROW_GAP;
};

export const dominoClickPayload = (handle: string | number, leftKey: string, rightKey: string, end: "L" | "R"): string => {
    return `_domino_${handle}_${leftKey}_${rightKey}_${end}`;
};

/**
 * Place two legend halves as adjacent board cells: same centres, scale, and
 * sheetCellSize as the default renderer on `square*` boards.
 */
export const composeDominoTile = (
    parent: Svg,
    rootSvg: Svg,
    leftKey: string,
    rightKey: string,
    tileHeight: number,
    scalingFactor: number = DOMINO_HAND_PIECE_SCALE,
): G => {
    const leftPiece = rootSvg.findOne("#" + leftKey) as Svg;
    const rightPiece = rootSvg.findOne("#" + rightKey) as Svg;
    if ( (leftPiece === null) || (leftPiece === undefined) ) {
        throw new Error(`Could not find the requested domino end (${leftKey}). Each end *must* exist in the \`legend\`.`);
    }
    if ( (rightPiece === null) || (rightPiece === undefined) ) {
        throw new Error(`Could not find the requested domino end (${rightKey}). Each end *must* exist in the \`legend\`.`);
    }
    const tileWidth = tileHeight * 2;
    const tile = parent.nested().size(tileWidth, tileHeight).viewbox(0, 0, tileWidth, tileHeight);
    const centerY = tileHeight / 2;
    usePieceAt({
        svg: tile,
        piece: leftPiece,
        cellsize: tileHeight,
        x: tileHeight / 2,
        y: centerY,
        scalingFactor,
        sheetCellSize: LEGEND_CELL_SIZE,
    });
    usePieceAt({
        svg: tile,
        piece: rightPiece,
        cellsize: tileHeight,
        x: tileHeight + (tileHeight / 2),
        y: centerY,
        scalingFactor,
        sheetCellSize: LEGEND_CELL_SIZE,
    });
    return tile;
};
