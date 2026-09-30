import type { BoardStyles } from "../schemas/schema.js";

/** Flat rect row/col grids that share the same coordinate system (swappable via customization). */
export const ROW_COL_FLAT_RECT: BoardStyles[] = [
    "squares",
    "squares-checkered",
    "squares-beveled",
];

export const VERTEX_STYLES: BoardStyles[] = ["vertex", "vertex-cross"];

export const ROW_COL_GRID_STACKED: BoardStyles[] = ["squares-stacked"];

/** minWidth/maxWidth hex apex boards — swappable spaces (hex-of-hex) vs vertices (hex-of-tri). */
export const HEX_MINMAX_STYLES: BoardStyles[] = ["hex-of-hex", "hex-of-tri"];

const ROW_COL_MARKER_TYPES = [
    "dots",
    "shading",
    "flood",
    "outline",
    "line",
    "label",
    "edge",
    "fence",
    "fences",
    "glyph",
] as const;

export type RowColMarkerType = (typeof ROW_COL_MARKER_TYPES)[number];

export type CompatibilityGroup =
    | "rowColGrid"
    | "rowColGridStacked"
    | "hexMinMaxGrid"
    | "none";

export interface BoardStyleRegistryEntry {
    compatibilityGroup: CompatibilityGroup;
    compatibleStyles: BoardStyles[];
    hasPolys: boolean;
    supportedMarkers: readonly string[];
    customizable: boolean;
}

const ROW_COL_GRID_COMPATIBLE: BoardStyles[] = [
    ...VERTEX_STYLES,
    ...ROW_COL_FLAT_RECT,
];

const ROW_COL_STACKED_COMPATIBLE: BoardStyles[] = [
    "squares-stacked",
    ...ROW_COL_FLAT_RECT,
];

function entryRowColGrid(hasPolys: boolean): BoardStyleRegistryEntry {
    return {
        compatibilityGroup: "rowColGrid",
        compatibleStyles: ROW_COL_GRID_COMPATIBLE,
        hasPolys,
        supportedMarkers: hasPolys
            ? ROW_COL_MARKER_TYPES
            : ROW_COL_MARKER_TYPES.filter((t) => t !== "flood"),
        customizable: true,
    };
}

function entryRowColStacked(): BoardStyleRegistryEntry {
    return {
        compatibilityGroup: "rowColGridStacked",
        compatibleStyles: ROW_COL_STACKED_COMPATIBLE,
        hasPolys: true,
        supportedMarkers: ROW_COL_MARKER_TYPES,
        customizable: true,
    };
}

const HEX_MINMAX_MARKER_TYPES_NO_FLOOD = ROW_COL_MARKER_TYPES.filter(
    (t) => t !== "flood",
);

function entryHexMinMaxGrid(hasPolys: boolean): BoardStyleRegistryEntry {
    return {
        compatibilityGroup: "hexMinMaxGrid",
        compatibleStyles: [...HEX_MINMAX_STYLES],
        hasPolys,
        supportedMarkers: hasPolys
            ? ROW_COL_MARKER_TYPES
            : HEX_MINMAX_MARKER_TYPES_NO_FLOOD,
        customizable: true,
    };
}

const NO_CUSTOMIZE: BoardStyleRegistryEntry = {
    compatibilityGroup: "none",
    compatibleStyles: [],
    hasPolys: false,
    supportedMarkers: [],
    customizable: false,
};

/** Pegboard shares square-grid marker drawing (Twixt, Connections, …); style is not swappable. */
function entryPegboard(): BoardStyleRegistryEntry {
    return {
        compatibilityGroup: "none",
        compatibleStyles: [],
        hasPolys: true,
        supportedMarkers: ROW_COL_MARKER_TYPES,
        customizable: false,
    };
}

const REGISTRY: Partial<Record<BoardStyles, BoardStyleRegistryEntry>> = {};

for (const s of VERTEX_STYLES) {
    REGISTRY[s] = entryRowColGrid(false);
}
for (const s of ROW_COL_FLAT_RECT) {
    REGISTRY[s] = entryRowColGrid(true);
}
for (const s of ROW_COL_GRID_STACKED) {
    REGISTRY[s] = entryRowColStacked();
}
REGISTRY["hex-of-hex"] = entryHexMinMaxGrid(true);
REGISTRY["hex-of-tri"] = entryHexMinMaxGrid(false);

/** Distinct or specialized topologies — not in the row/col style swap group. */
REGISTRY["squares-diamonds"] = NO_CUSTOMIZE;
REGISTRY["pegboard"] = entryPegboard();
REGISTRY["vertex-fanorona"] = NO_CUSTOMIZE;

export function getBoardStyleEntry(style: string | undefined): BoardStyleRegistryEntry {
    if (style === undefined) {
        return NO_CUSTOMIZE;
    }
    return REGISTRY[style as BoardStyles] ?? NO_CUSTOMIZE;
}

export function getCompatibleStyles(style: string | undefined): BoardStyles[] {
    return [...getBoardStyleEntry(style).compatibleStyles];
}

export function isInvalidStylePair(from: string, to: string): boolean {
    const fromVertex = VERTEX_STYLES.includes(from as BoardStyles);
    const toVertex = VERTEX_STYLES.includes(to as BoardStyles);
    const fromStacked = from === "squares-stacked";
    const toStacked = to === "squares-stacked";
    return (fromVertex && toStacked) || (fromStacked && toVertex);
}

export function isCrossGroupStyleChange(from: string, to: string): boolean {
    const a = getBoardStyleEntry(from);
    const b = getBoardStyleEntry(to);
    if (a.compatibilityGroup === "none" || b.compatibilityGroup === "none") {
        return true;
    }
    if (a.compatibilityGroup !== b.compatibilityGroup) {
        return isInvalidStylePair(from, to);
    }
    return false;
}

export function markerSupportedOnStyle(
    style: string | undefined,
    markerType: string,
): boolean {
    const entry = getBoardStyleEntry(style);
    return entry.supportedMarkers.includes(markerType);
}
