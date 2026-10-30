import tinycolor from "tinycolor2";
import type { RendererBase } from "../renderers/_base.js";
import type { Colourfuncs, Colourstrings } from "../schemas/schema.js";

export type CheckeredTileStyle = {
    color: string;
    opacity: number;
};

export type CheckeredTilePair = {
    light: CheckeredTileStyle;
    dark: CheckeredTileStyle;
};

const legacyCheckeredPair = (
    ctx: RendererBase,
    cellFill: string | undefined,
    baseOpacity: number,
): CheckeredTilePair => {
    const cBg = tinycolor(cellFill ?? ctx.options.colourContext.background);
    const cFill = tinycolor(ctx.options.colourContext.fill);
    if (cBg.getLuminance() > cFill.getLuminance()) {
        return {
            light: {
                color: cellFill ?? ctx.options.colourContext.background,
                opacity: 0,
            },
            dark: {
                color: ctx.options.colourContext.fill,
                opacity: baseOpacity * 0.25,
            },
        };
    }
    return {
        light: {
            color: ctx.options.colourContext.fill,
            opacity: baseOpacity * 0.25,
        },
        dark: {
            color: cellFill ?? ctx.options.colourContext.background,
            opacity: 0,
        },
    };
};

const resolveExplicitSide = (
    ctx: RendererBase,
    value: Colourstrings | Colourfuncs,
    baseOpacity: number,
): CheckeredTileStyle => ({
    color: ctx.resolveColour(value) as string,
    opacity: baseOpacity,
});

/**
 * Light/dark tile colours for `squares-checkered` and `circular-wheel-spaces-checkered`.
 * Omitted or null `checkeredLight` / `checkeredDark` keeps the legacy theme-tinted pattern for that side.
 */
export const resolveCheckeredTilePair = (
    ctx: RendererBase,
    cellFill: string | undefined,
    baseOpacity: number,
): CheckeredTilePair => {
    const board = ctx.json?.board;
    if (board === null || board === undefined) {
        throw new Error("checkered colours require board");
    }
    const legacy = legacyCheckeredPair(ctx, cellFill, baseOpacity);

    let light = legacy.light;
    if ("checkeredLight" in board && board.checkeredLight !== null && board.checkeredLight !== undefined) {
        light = resolveExplicitSide(ctx, board.checkeredLight, baseOpacity);
    }

    let dark = legacy.dark;
    if ("checkeredDark" in board && board.checkeredDark !== null && board.checkeredDark !== undefined) {
        dark = resolveExplicitSide(ctx, board.checkeredDark, baseOpacity);
    }

    return { light, dark };
};
