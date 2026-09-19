import type { APRenderRep } from "../schemas/schema.js";
import { getBoardStyleEntry } from "./registry.js";

export function isStringGridPieces(pieces: APRenderRep["pieces"]): boolean {
    if (pieces === null || pieces === undefined) {
        return false;
    }
    if (typeof pieces === "string") {
        return pieces.length > 0;
    }
    if (!Array.isArray(pieces)) {
        return false;
    }
    if (pieces.length === 0) {
        return false;
    }
    return pieces.every((row) => typeof row === "string");
}

export function isBoardBasicBoard(
    board: APRenderRep["board"],
): board is NonNullable<APRenderRep["board"]> & { style: string; width?: number; height?: number } {
    if (board === null || board === undefined) {
        return false;
    }
    return "style" in board && typeof board.style === "string";
}

export function isBoardChromeEligible(rep: APRenderRep): boolean {
    if (!isBoardBasicBoard(rep.board)) {
        return false;
    }
    if (!isStringGridPieces(rep.pieces)) {
        return false;
    }
    return getBoardStyleEntry(rep.board.style).customizable;
}
