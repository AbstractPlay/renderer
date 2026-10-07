import type { ElevenBand, ElevenSide, ElevenTopology } from "./types.js";

/** West half columns (left → right), then east half columns (left → right). */
export const ELEVEN_COLUMN_SLICES: readonly { side: ElevenSide; band: ElevenBand }[] = [
    { side: "W", band: "G" },
    { side: "W", band: "P" },
    { side: "W", band: "F" },
    { side: "W", band: "C" },
    { side: "E", band: "C" },
    { side: "E", band: "F" },
    { side: "E", band: "P" },
    { side: "E", band: "G" },
];

export type ClassifiedSpace = {
    index: number;
    x: number;
    y: number;
    /** Grass-grid column `0`…`cols - 1`. */
    column: number;
    side: ElevenSide;
    band: ElevenBand;
};

export const grassColumnFromX = (topology: ElevenTopology, x: number): number => {
    const { originX, cellW, cols } = topology.grassGrid;
    const col = Math.floor((x - originX) / cellW);
    if (col < 0) {
        return 0;
    }
    if (col >= cols) {
        return cols - 1;
    }
    return col;
};

export const sideBandFromGrassColumn = (
    column: number,
): { side: ElevenSide; band: ElevenBand } => {
    const slice = ELEVEN_COLUMN_SLICES[column];
    if (slice === undefined) {
        throw new Error(`invalid eleven grass column ${column}`);
    }
    return slice;
};

export const classifyElevenSpaces = (topology: ElevenTopology): ClassifiedSpace[] =>
    topology.spaces.map((s) => {
        const column = grassColumnFromX(topology, s.x);
        const { side, band } = sideBandFromGrassColumn(column);
        return { index: s.i, x: s.x, y: s.y, column, side, band };
    });

/** Band numbering order: top → bottom, then left → right. */
export const sortTopLeft = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    a.y - b.y || a.x - b.x;
