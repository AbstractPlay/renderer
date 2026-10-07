import type { ElevenGraphHelpers } from "./types.js";

export type ElevenCellRef = number | string;

export type ElevenResolvedCell = {
    index: number;
    pitchId: string;
    row: number;
    col: number;
    x: number;
    y: number;
};

const normalizePitchRef = (ref: string): string => ref.trim();

export const elevenResolveCell = (
    helpers: ElevenGraphHelpers,
    ref: ElevenCellRef,
): ElevenResolvedCell => {
    let index: number;
    if (typeof ref === "number") {
        if (!Number.isInteger(ref) || ref < 0 || ref >= helpers.spaces.length) {
            throw new Error(`invalid eleven space index ${ref}`);
        }
        index = ref;
    } else {
        const pitchId = normalizePitchRef(ref);
        const found = helpers.indexByPitchId.get(pitchId);
        if (found === undefined) {
            throw new Error(`unknown eleven pitch id ${pitchId}`);
        }
        index = found;
    }
    const space = helpers.spaces[index];
    const topo = helpers.topology.spaces[index];
    return {
        index,
        pitchId: space.pitchId,
        row: 0,
        col: index,
        x: topo.x,
        y: topo.y,
    };
};

export const elevenMarkerTarget = (
    helpers: ElevenGraphHelpers,
    ref: ElevenCellRef,
): { row: number; col: number } => {
    const cell = elevenResolveCell(helpers, ref);
    return { row: cell.row, col: cell.col };
};
