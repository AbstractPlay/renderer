import type { APRenderRep } from "../schemas/schema.js";

/**
 * `board` with `style` but no playfield dimensions — polymatrix lattice/geometry follow `style`; no grid is drawn.
 */
export function isBoardStyleOnlyInline(board: APRenderRep["board"]): board is NonNullable<APRenderRep["board"]> {
    if (board === null || board === undefined) {
        return false;
    }
    if (!("style" in board) || board.style === undefined) {
        return false;
    }
    if ("width" in board && board.width !== undefined) {
        return false;
    }
    if ("height" in board && board.height !== undefined) {
        return false;
    }
    if ("minWidth" in board && board.minWidth !== undefined) {
        return false;
    }
    if ("maxWidth" in board && board.maxWidth !== undefined) {
        return false;
    }
    return true;
}

/** `board: null` or style-only board — single `pieces` key inline glyph (`renderGlyph`). */
export function usesInlineGlyphRender(board: APRenderRep["board"]): boolean {
    return board === null || isBoardStyleOnlyInline(board);
}