import { Orientation } from "honeycomb-grid";
import { CompassDirection } from "../../boards";
import { IsometricPieces } from "../../schemas/schema";

export type HexOrientation = "p" | "f";

export type ParsedLintel =
    | { kind: "cube"; omitted: CompassDirection[] }
    | { kind: "hex"; orientation: HexOrientation; omitted: CompassDirection[] };

export const CUBE_EDGE_ORDER: CompassDirection[] = ["N", "E", "S", "W"];

export const HEX_EDGE_ORDER: Record<HexOrientation, CompassDirection[]> = {
    f: ["N", "NE", "SE", "S", "SW", "NW"],
    p: ["NE", "E", "SE", "SW", "W", "NW"],
};

/** Same corner pairs in edges2corners; labels differ between pointy and flat. */
const POINTY_TO_FLAT_EDGE = {
    NE: "N",
    E: "NE",
    SE: "SE",
    SW: "S",
    W: "SW",
    NW: "NW",
} as const satisfies Partial<Record<CompassDirection, CompassDirection>>;

const FLAT_TO_POINTY_EDGE = {
    N: "NE",
    NE: "E",
    SE: "SE",
    S: "SW",
    SW: "W",
    NW: "NW",
} as const satisfies Partial<Record<CompassDirection, CompassDirection>>;

export const boardHexLabel = (numRotations: number): HexOrientation =>
    numRotations % 2 === 0 ? "p" : "f";

export const boardHexOrientation = (numRotations: number): Orientation =>
    boardHexLabel(numRotations) === "p" ? Orientation.POINTY : Orientation.FLAT;

export const remapHexEdgesBetweenOrientations = (
    from: HexOrientation,
    to: HexOrientation,
    omitted: CompassDirection[],
): CompassDirection[] => {
    if (from === to) {
        return sortByCanonicalOrder(to, omitted);
    }
    const map = from === "p" ? POINTY_TO_FLAT_EDGE : FLAT_TO_POINTY_EDGE;
    return sortByCanonicalOrder(to, omitted.map((edge) => map[edge as keyof typeof map] as CompassDirection));
};

export const resolveHexLintelOmitted = (
    pieceOrientation: HexOrientation,
    omitted: CompassDirection[],
    numRotations: number,
): { boardOrientation: Orientation; boardLabel: HexOrientation; omitted: CompassDirection[] } => {
    const boardLabel = boardHexLabel(numRotations);
    const boardOrientation = boardHexOrientation(numRotations);
    let resolved = [...omitted];
    if (numRotations > 0) {
        resolved = rotateHexOmitted(pieceOrientation, resolved, numRotations);
    }
    if (pieceOrientation !== boardLabel) {
        resolved = remapHexEdgesBetweenOrientations(pieceOrientation, boardLabel, resolved);
    }
    return { boardOrientation, boardLabel, omitted: resolved };
};

const CUBE_LINTEL_NAMES = new Set<IsometricPieces>([
    "lintelN",
    "lintelE",
    "lintelS",
    "lintelW",
    "lintelNS",
    "lintelEW",
]);

const COMPASS_ROTATE_90: Record<CompassDirection, CompassDirection> = {
    N: "E",
    NE: "SE",
    E: "S",
    SE: "SW",
    S: "W",
    SW: "NW",
    W: "N",
    NW: "NE",
};

export const isSpacerPiece = (piece: string): piece is "spaceCube" | "spaceHex" =>
    piece === "spaceCube" || piece === "spaceHex";

export const sortByCanonicalOrder = (
    orientation: HexOrientation,
    edges: CompassDirection[],
): CompassDirection[] => {
    const order = HEX_EDGE_ORDER[orientation];
    return [...edges].sort((a, b) => order.indexOf(a) - order.indexOf(b));
};

export const sortCubeEdges = (edges: CompassDirection[]): CompassDirection[] =>
    [...edges].sort((a, b) => CUBE_EDGE_ORDER.indexOf(a) - CUBE_EDGE_ORDER.indexOf(b));

export const rotateCompass = (dir: CompassDirection, quarterTurns: number): CompassDirection => {
    let result = dir;
    const steps = ((quarterTurns % 4) + 4) % 4;
    for (let i = 0; i < steps; i++) {
        result = COMPASS_ROTATE_90[result];
    }
    return result;
};

export const rotateOmitted = (
    omitted: CompassDirection[],
    quarterTurns: number,
): CompassDirection[] => omitted.map((dir) => rotateCompass(dir, quarterTurns));

/** Board quarter-turns mapped to steps in the orientation's 6-edge clockwise cycle. */
export const hexEdgeStepsForQuarterTurns = (quarterTurns: number): number => {
    const steps = Math.round((quarterTurns * HEX_EDGE_ORDER.p.length) / 4);
    return ((steps % HEX_EDGE_ORDER.p.length) + HEX_EDGE_ORDER.p.length) % HEX_EDGE_ORDER.p.length;
};

export const rotateHexEdge = (
    orientation: HexOrientation,
    edge: CompassDirection,
    quarterTurns: number,
): CompassDirection => {
    const order = HEX_EDGE_ORDER[orientation];
    const idx = order.indexOf(edge);
    const steps = hexEdgeStepsForQuarterTurns(quarterTurns);
    return order[(idx + steps) % order.length];
};

export const rotateHexOmitted = (
    orientation: HexOrientation,
    omitted: CompassDirection[],
    quarterTurns: number,
): CompassDirection[] =>
    sortByCanonicalOrder(
        orientation,
        omitted.map((edge) => rotateHexEdge(orientation, edge, quarterTurns)),
    );

const parseCubeLintelSuffix = (suffix: string): CompassDirection[] | null => {
    const dirs: CompassDirection[] = [];
    for (const ch of suffix) {
        if (ch !== "N" && ch !== "E" && ch !== "S" && ch !== "W") {
            return null;
        }
        dirs.push(ch);
    }
    return sortCubeEdges(dirs);
};

export const cubeLintelName = (omitted: CompassDirection[]): IsometricPieces | "spaceCube" => {
    const sorted = sortCubeEdges(omitted);
    if (sorted.length === 4) {
        return "spaceCube";
    }
    if (sorted.length === 0) {
        throw new Error("A cube lintel must omit at least one edge.");
    }
    const name = `lintel${sorted.join("")}`;
    if (!CUBE_LINTEL_NAMES.has(name as IsometricPieces)) {
        throw new Error(`Unsupported cube lintel omission set: ${sorted.join(", ")}`);
    }
    return name as IsometricPieces;
};

export const hexLintelName = (
    orientation: HexOrientation,
    omitted: CompassDirection[],
): string => {
    if (omitted.length === 6) {
        return "spaceHex";
    }
    if (omitted.length === 0) {
        throw new Error("A hex lintel must omit at least one edge.");
    }
    const sorted = sortByCanonicalOrder(orientation, omitted);
    return `lintel${orientation}_${sorted.join("_")}`;
};

export const parseLintelPiece = (name: string): ParsedLintel | null => {
    if (name === "spaceCube") {
        return { kind: "cube", omitted: [...CUBE_EDGE_ORDER] };
    }
    if (name === "spaceHex") {
        return { kind: "hex", orientation: "p", omitted: [...HEX_EDGE_ORDER.p] };
    }
    if (name.startsWith("lintel") && !name.startsWith("lintelp_") && !name.startsWith("lintelf_")) {
        const suffix = name.slice("lintel".length);
        const omitted = parseCubeLintelSuffix(suffix);
        if (omitted === null || omitted.length === 0) {
            return null;
        }
        return { kind: "cube", omitted };
    }
    const pointyMatch = /^lintelp_(.+)$/.exec(name);
    if (pointyMatch !== null) {
        const omitted = parseHexEdgeTokens(pointyMatch[1], "p");
        if (omitted === null) {
            return null;
        }
        return { kind: "hex", orientation: "p", omitted };
    }
    const flatMatch = /^lintelf_(.+)$/.exec(name);
    if (flatMatch !== null) {
        const omitted = parseHexEdgeTokens(flatMatch[1], "f");
        if (omitted === null) {
            return null;
        }
        return { kind: "hex", orientation: "f", omitted };
    }
    return null;
};

const parseHexEdgeTokens = (
    tokenString: string,
    orientation: HexOrientation,
): CompassDirection[] | null => {
    const valid = new Set(HEX_EDGE_ORDER[orientation]);
    const tokens = tokenString.split("_");
    const omitted: CompassDirection[] = [];
    for (const token of tokens) {
        if (!valid.has(token as CompassDirection)) {
            return null;
        }
        omitted.push(token as CompassDirection);
    }
    if (omitted.length === 0) {
        return null;
    }
    return sortByCanonicalOrder(orientation, omitted);
};

export const drawnCubeEdges = (omitted: CompassDirection[]): ("N" | "E" | "S" | "W")[] =>
    CUBE_EDGE_ORDER.filter((dir) => !omitted.includes(dir)) as ("N" | "E" | "S" | "W")[];

export const drawnHexEdges = (
    orientation: HexOrientation,
    omitted: CompassDirection[],
): CompassDirection[] => HEX_EDGE_ORDER[orientation].filter((dir) => !omitted.includes(dir));

export const resolveHexLintelDrawnEdges = (
    pieceOrientation: HexOrientation,
    omitted: CompassDirection[],
    numRotations: number,
): { orientation: Orientation; drawnEdges: CompassDirection[] } => {
    const resolved = resolveHexLintelOmitted(pieceOrientation, omitted, numRotations);
    return {
        orientation: resolved.boardOrientation,
        drawnEdges: drawnHexEdges(resolved.boardLabel, resolved.omitted),
    };
};

export const hexOrientationToGrid = (orientation: HexOrientation): Orientation =>
    orientation === "p" ? Orientation.POINTY : Orientation.FLAT;

export const allHexLintelOmissions = (orientation: HexOrientation): CompassDirection[][] => {
    const order = HEX_EDGE_ORDER[orientation];
    const subsets: CompassDirection[][] = [];
    const total = 1 << order.length;
    for (let mask = 1; mask < total - 1; mask++) {
        const omitted: CompassDirection[] = [];
        for (let i = 0; i < order.length; i++) {
            if (mask & (1 << i)) {
                omitted.push(order[i]);
            }
        }
        subsets.push(omitted);
    }
    return subsets;
};

export const allHexLintelPieces = (orientation?: HexOrientation): string[] => {
    const orientations: HexOrientation[] = orientation === undefined ? ["p", "f"] : [orientation];
    const pieces: string[] = [];
    for (const orient of orientations) {
        for (const omitted of allHexLintelOmissions(orient)) {
            pieces.push(hexLintelName(orient, omitted));
        }
    }
    return pieces;
};

export const allCubeLintelPieces = (): IsometricPieces[] =>
    [...CUBE_LINTEL_NAMES, "spaceCube"];

export const isLintelPiece = (piece: string): boolean =>
    isSpacerPiece(piece) || parseLintelPiece(piece) !== null;

export const effectiveLintelPiece = (
    piece: IsometricPieces,
    numRotations: number,
): IsometricPieces | string => {
    if (numRotations === 0 || !isLintelPiece(piece)) {
        return piece;
    }
    const parsed = parseLintelPiece(piece);
    if (parsed === null) {
        return piece;
    }
    if (parsed.kind === "cube") {
        return cubeLintelName(rotateOmitted(parsed.omitted, numRotations));
    }
    return hexLintelName(
        parsed.orientation,
        rotateHexOmitted(parsed.orientation, parsed.omitted, numRotations),
    );
};

export const buildLintelRotationMap = (): Map<string, Map<number, string>> => {
    const pieces = [
        ...allCubeLintelPieces(),
        "spaceHex",
        ...allHexLintelPieces(),
    ];
    const map = new Map<string, Map<number, string>>();
    for (const piece of pieces) {
        const entry = new Map<number, string>();
        for (let rotation = 1; rotation <= 3; rotation++) {
            entry.set(rotation, effectiveLintelPiece(piece as IsometricPieces, rotation));
        }
        map.set(piece, entry);
    }
    return map;
};

export const LINTEL_ROTATION_MAP = buildLintelRotationMap();
