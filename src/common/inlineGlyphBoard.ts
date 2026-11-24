import type { APRenderRep } from "../schemas/schema.js";
import { polymatrixLattice } from "./polymatrix.js";

/**
 * `board` with `style` but no playfield dimensions — polymatrix lattice/geometry follow `style`; no grid is drawn.
 * Only honeycomb / rect-of-hex styles (e.g. `hex-even-f`, `hex-of-hex`). Styles like `bricka` or `eleven` omit
 * width/height in the schema but still render a full playfield and must not use the inline-glyph path.
 */
export function isBoardStyleOnlyInline(board: APRenderRep["board"]): board is NonNullable<APRenderRep["board"]> {
    if (board === null || board === undefined) {
        return false;
    }
    if (!("style" in board) || board.style === undefined) {
        return false;
    }
    if (polymatrixLattice(board.style) !== "hex") {
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