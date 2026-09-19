import type { APRenderRep } from "../schemas/schema.js";
import { BOARD_CHROME_BOARD_KEYS, BOARD_CHROME_DENIED_KEYS } from "./allowlist.js";
import { applyBoardChrome } from "./merge.js";
import { isBoardChromeEligible } from "./piecesShape.js";
import {
    getBoardStyleEntry,
    getCompatibleStyles,
    isInvalidStylePair,
} from "./registry.js";
import { sanitizeRenderRepWithWarnings } from "./sanitize.js";
import type { BoardChromeInput, ValidateResult } from "./types.js";

export function validateRenderCustomization(
    baseRep: APRenderRep,
    boardChrome: BoardChromeInput | null | undefined,
): ValidateResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!boardChrome || typeof boardChrome !== "object") {
        return { ok: true, errors, warnings, sanitized: baseRep };
    }

    for (const key of Object.keys(boardChrome)) {
        if (key === "options") {
            continue;
        }
        if (BOARD_CHROME_DENIED_KEYS.has(key)) {
            errors.push(`Key "${key}" cannot be customized.`);
        } else if (!BOARD_CHROME_BOARD_KEYS.has(key)) {
            errors.push(`Key "${key}" is not allowed in board customization.`);
        }
    }

    if (!isBoardChromeEligible(baseRep)) {
        if (boardChrome.style !== undefined) {
            errors.push("Board style cannot be customized for this render representation.");
        }
    }

    const baseStyle =
        baseRep.board && "style" in baseRep.board
            ? String(baseRep.board.style)
            : undefined;

    if (boardChrome.style !== undefined && baseStyle !== undefined) {
        const target = String(boardChrome.style);
        if (isInvalidStylePair(baseStyle, target)) {
            errors.push(
                `Cannot change board style between "${baseStyle}" and "${target}" (vertex and squares-stacked are incompatible).`,
            );
        } else {
            const allowed = getCompatibleStyles(baseStyle);
            if (!allowed.includes(target as typeof allowed[number])) {
                errors.push(
                    `Board style "${target}" is not compatible with the game's board style "${baseStyle}".`,
                );
            }
        }
    } else if (boardChrome.style !== undefined && baseStyle === undefined) {
        errors.push("Cannot set board style when the game has no boardBasic board.");
    }

    if (boardChrome.labelScale !== undefined) {
        const ls = boardChrome.labelScale;
        if (typeof ls !== "number" || !(ls > 0)) {
            errors.push("labelScale must be a number greater than 0.");
        }
    }

    if (errors.length > 0) {
        return { ok: false, errors, warnings, sanitized: null };
    }

    let merged = applyBoardChrome(baseRep, boardChrome);
    const effectiveStyle =
        merged.board && "style" in merged.board
            ? String(merged.board.style)
            : undefined;
    if (effectiveStyle && !getBoardStyleEntry(effectiveStyle).customizable) {
        errors.push(`Board style "${effectiveStyle}" does not support customization.`);
        return { ok: false, errors, warnings, sanitized: null };
    }

    merged = sanitizeRenderRepWithWarnings(merged, warnings);

    return { ok: true, errors, warnings, sanitized: merged };
}
