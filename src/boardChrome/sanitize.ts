import type { APRenderRep, BoardBasic } from "../schemas/schema.js";
import { getBoardStyleEntry, markerSupportedOnStyle } from "./registry.js";
import { isBoardBasicBoard } from "./piecesShape.js";

export function filterBoardMarkers(
    board: BoardBasic,
    warnings: string[],
): BoardBasic {
    const style = board.style;
    const markers = board.markers;
    if (!markers || !Array.isArray(markers)) {
        return board;
    }
    const kept: NonNullable<BoardBasic["markers"]> = [];
    for (const marker of markers) {
        const type = marker.type;
        if (!markerSupportedOnStyle(style, type)) {
            warnings.push(`Removed unsupported marker type "${type}" for board style "${style}".`);
            continue;
        }
        if (type === "flood" && !getBoardStyleEntry(style).hasPolys) {
            warnings.push(`Removed flood marker (no polygons on "${style}").`);
            continue;
        }
        if (type === "halo") {
            warnings.push(`Removed halo marker (not supported on "${style}").`);
            continue;
        }
        kept.push(marker);
    }
    return { ...board, markers: kept };
}

export function sanitizeRenderRep(rep: APRenderRep): APRenderRep {
    const warnings: string[] = [];
    return sanitizeRenderRepWithWarnings(rep, warnings);
}

export function sanitizeRenderRepWithWarnings(
    rep: APRenderRep,
    warnings: string[],
): APRenderRep {
    const out = structuredClone(rep) as APRenderRep;
    if (!isBoardBasicBoard(out.board)) {
        return out;
    }
    out.board = filterBoardMarkers(out.board as BoardBasic, warnings);
    if (out.areas) {
        out.areas = out.areas.map((area) => {
            if (area.type !== "track" || !area.board) {
                return area;
            }
            const board = filterBoardMarkers(area.board, warnings);
            return { ...area, board };
        });
    }
    return out;
}
