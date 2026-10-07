export type ElevenSide = "W" | "E";

export type ElevenPitchAreaMarker = {
    kind: "penaltyArea" | "goalArea";
    side: "w" | "e";
    points: { x: number; y: number }[];
    bump?: { x: number; y: number }[];
};

/**
 * Grass-grid column band (vertical checker slice).
 * West columns left→right: G, P, F, C; east columns: C, F, P, G.
 */
export type ElevenBand = "G" | "P" | "F" | "C";

export type ElevenSpace = {
    i: number;
    x: number;
    y: number;
    r: number;
};

export type ElevenMarker =
    | { kind: "midline"; x1: number; y1: number; x2: number; y2: number }
    | { kind: "centerCircle"; cx: number; cy: number; r: number }
    | { kind: "centerSpot"; cx: number; cy: number; r?: number }
    | { kind: "penaltyMark"; cx: number; cy: number; side: "w" | "e"; r?: number }
    | ElevenPitchAreaMarker
    | { kind: "cornerArc"; corner: string; cx: number; cy: number; r: number };

export type ElevenEdgePathSet = Record<string, [number, number][]>;

export type ElevenTopology = {
    version: number;
    padding?: number;
    spaces: ElevenSpace[];
    moveEdges: [number, number][];
    shootEdges: [number, number][];
    /** Fine-sampled Linien subpaths per undirected edge (`"lo|hi"`). */
    edgePaths?: {
        move: ElevenEdgePathSet;
        shoot: ElevenEdgePathSet;
    };
    markers: ElevenMarker[];
    grassGrid: {
        originX: number;
        originY: number;
        cols: number;
        rows: number;
        cellW: number;
        cellH: number;
    };
};

/** One play space: topology index plus pitch-oriented id parts. */
export type ElevenSpaceRef = {
    index: number;
    /** Grass-grid column `0`…`7` on the committed board. */
    column: number;
    side: ElevenSide;
    band: ElevenBand;
    /**
     * 1-based sequence within `(side, band)`, top-to-bottom then left-to-right.
     * `null` for reserved ids `WG`, `EG`, and `C` (excluded from band numbering).
     */
    number: number | null;
    pitchId: string;
    x: number;
    y: number;
};

export type ElevenGraphHelpers = {
    topology: ElevenTopology;
    spaces: ElevenSpaceRef[];
    pitchIdByIndex: ReadonlyMap<number, string>;
    indexByPitchId: ReadonlyMap<string, number>;
    moveNeighbors: ReadonlyMap<number, readonly number[]>;
    shootNeighbors: ReadonlyMap<number, readonly number[]>;
};
