import { IsoPiece, IsoPyramidSize } from "../../schemas/schema";

/** Reference base width in symbol units (cell-filling footprint, like other iso pieces). */
export const ICEHOUSE_LARGE_BASE = 100;

/** Default pyramid height when `size` and `height` are both omitted. */
export const DEFAULT_PYRAMID_SIDE_HEIGHT = 100;

/** Icehouse large pyramid side height at the reference base (1" × 1.75" proportions). */
export const ICEHOUSE_LARGE_SIDE_HEIGHT = ICEHOUSE_LARGE_BASE * 1.75;

/** Physical Icehouse dimensions in inches from https://www.wunderland.com/icehouse/MakingIcehouse.html */
const ICEHOUSE_INCHES: Record<IsoPyramidSize, { base: number; height: number }> = {
    large: { base: 1, height: 1.75 },
    medium: { base: 25 / 32, height: 1.375 },
    small: { base: 9 / 16, height: 1 },
};

export type PyramidDims = {
    baseSize: number;
    sideHeight: number;
};

/** Icehouse size presets: cell-filling base for large, physical inch ratios for all sizes. */
export const icehousePyramidDims = (size: IsoPyramidSize): PyramidDims => {
    const spec = ICEHOUSE_INCHES[size];
    return {
        baseSize: ICEHOUSE_LARGE_BASE * spec.base,
        sideHeight: ICEHOUSE_LARGE_BASE * spec.height,
    };
};

export type IsoPyramidPiece = IsoPiece & { piece: "pyramid" };

export const isPyramidPiece = (pc: IsoPiece): pc is IsoPyramidPiece =>
    pc.piece === "pyramid";

export const resolvePyramidDims = (pc: IsoPyramidPiece): PyramidDims => {
    if (pc.size !== undefined) {
        return icehousePyramidDims(pc.size);
    }
    if (pc.height !== undefined) {
        return { baseSize: ICEHOUSE_LARGE_BASE, sideHeight: pc.height };
    }
    return { baseSize: ICEHOUSE_LARGE_BASE, sideHeight: DEFAULT_PYRAMID_SIDE_HEIGHT };
};
