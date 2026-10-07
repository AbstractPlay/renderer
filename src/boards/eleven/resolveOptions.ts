import type { Colourstrings, Colourfuncs } from "../../schemas/schema.js";
import type { RendererBase } from "../../renderers/_base.js";

export const ELEVEN_DEFAULT_GRASS_LIGHT = "#aaea45";
export const ELEVEN_DEFAULT_GRASS_DARK = "#85d218";
export const ELEVEN_DEFAULT_STROKE_COLOUR = "#559f00";
export const ELEVEN_DEFAULT_STROKE_WEIGHT = 3;
export const ELEVEN_DEFAULT_MARKING_COLOUR = "#ffffff";
export const ELEVEN_MARKING_WEIGHT_MULT = 5 / 3;
export const ELEVEN_CENTER_CIRCLE_WEIGHT_MULT = 7.29 / 3;
export const ELEVEN_DEFAULT_CONNECTION_BOW = 0.15;
export const ELEVEN_DEFAULT_SHOOT_DASH: [number, number] = [3, 6];
export const ELEVEN_PIECE_DIAMETER_FACTOR = 2.35;

export type ResolvedElevenBoardOptions = {
    grassLight: string;
    grassDark: string;
    flatGrass: boolean;
    strokeColour: string;
    strokeWeight: number;
    strokeOpacity: number;
    markingColour: string;
    markingWeight: number;
    centerCircleWeight: number;
    shootDashed: boolean;
    shootDash: [number, number];
    pieceScale: number;
};

type ElevenBoardOptions = {
    grass?: { light?: Colourstrings | Colourfuncs; dark?: Colourstrings | Colourfuncs };
    flatGrass?: boolean;
    markings?: { colour?: Colourstrings | Colourfuncs; weightMult?: number };
    centerCircleWeightMult?: number;
    shootDashed?: boolean;
    shootDash?: [number, number];
    pieceScale?: number;
};

const resolveColour = (
    ctx: RendererBase,
    value: Colourstrings | Colourfuncs | undefined,
    fallback: string,
): string => {
    if (value === undefined) {
        return fallback;
    }
    return ctx.resolveColour(value) as string;
};

export const resolveElevenBoardOptions = (ctx: RendererBase): ResolvedElevenBoardOptions => {
    if (ctx.json?.board === null || ctx.json?.board === undefined) {
        throw new Error("eleven board options require board");
    }
    const board = ctx.json.board;
    const eleven = ("eleven" in board ? board.eleven : undefined) as ElevenBoardOptions | undefined;

    let strokeWeight = ELEVEN_DEFAULT_STROKE_WEIGHT;
    if ("strokeWeight" in board && board.strokeWeight !== undefined) {
        strokeWeight = board.strokeWeight;
    }
    let strokeOpacity = 1;
    if ("strokeOpacity" in board && board.strokeOpacity !== undefined) {
        strokeOpacity = board.strokeOpacity;
    }
    const strokeColour = resolveColour(
        ctx,
        "strokeColour" in board ? board.strokeColour : undefined,
        ELEVEN_DEFAULT_STROKE_COLOUR,
    );

    const markingMult = eleven?.markings?.weightMult ?? ELEVEN_MARKING_WEIGHT_MULT;
    const centerMult = eleven?.centerCircleWeightMult ?? ELEVEN_CENTER_CIRCLE_WEIGHT_MULT;

    const shootDash = eleven?.shootDash ?? ELEVEN_DEFAULT_SHOOT_DASH;
    if (shootDash.length !== 2) {
        throw new Error("eleven.shootDash must have two numbers");
    }

    return {
        grassLight: resolveColour(ctx, eleven?.grass?.light, ELEVEN_DEFAULT_GRASS_LIGHT),
        grassDark: resolveColour(ctx, eleven?.grass?.dark, ELEVEN_DEFAULT_GRASS_DARK),
        flatGrass: eleven?.flatGrass ?? false,
        strokeColour,
        strokeWeight,
        strokeOpacity,
        markingColour: resolveColour(ctx, eleven?.markings?.colour, ELEVEN_DEFAULT_MARKING_COLOUR),
        markingWeight: strokeWeight * markingMult,
        centerCircleWeight: strokeWeight * centerMult,
        shootDashed: eleven?.shootDashed ?? true,
        shootDash: [shootDash[0], shootDash[1]],
        pieceScale: eleven?.pieceScale ?? 1,
    };
};

export const elevenPieceCellsize = (
    medianRingDiameter: number,
    pieceScale: number,
): number => medianRingDiameter * ELEVEN_PIECE_DIAMETER_FACTOR * pieceScale;
