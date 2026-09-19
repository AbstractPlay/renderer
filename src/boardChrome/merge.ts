import type { APRenderRep, BoardBasic } from "../schemas/schema.js";
import {
    BOARD_CHROME_BOARD_KEYS,
    BOARD_CHROME_DENIED_KEYS,
} from "./allowlist.js";
import type { BoardChromeInput } from "./types.js";

function pickBoardChrome(boardChrome: BoardChromeInput): Partial<BoardBasic> {
    const out: Partial<BoardBasic> = {};
    for (const key of Object.keys(boardChrome)) {
        if (key === "options") {
            continue;
        }
        if (BOARD_CHROME_DENIED_KEYS.has(key)) {
            continue;
        }
        if (!BOARD_CHROME_BOARD_KEYS.has(key)) {
            continue;
        }
        // @ts-expect-error dynamic pick from allowlist
        out[key] = boardChrome[key];
    }
    return out;
}

/**
 * Deep-merge user board chrome onto a render rep (does not mutate input).
 */
export function applyBoardChrome(
    rep: APRenderRep,
    boardChrome: BoardChromeInput | null | undefined,
): APRenderRep {
    if (!boardChrome || typeof boardChrome !== "object") {
        return rep;
    }
    const merged = structuredClone(rep) as APRenderRep;
    if (merged.board === null || merged.board === undefined || !("style" in merged.board)) {
        return rep;
    }

    const patch = pickBoardChrome(boardChrome);
    merged.board = { ...(merged.board as BoardBasic), ...patch };

    if (boardChrome.options !== undefined) {
        merged.options = [...boardChrome.options] as APRenderRep["options"];
    }

    return merged;
}
