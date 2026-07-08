import { GridPoints, IPoint, IPolyPolygon, Poly } from "../../grids/_base";

export type EdgeSide = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

export type LineSegment = { x1: number; y1: number; x2: number; y2: number };

/** Offset from cell centre to edge marker line (matches squares-diamonds in markBoard). */
export const isoEdgeMarkerBuffer = (cellsize: number, baseStroke: number): number =>
    cellsize / 2 + baseStroke * 3;

/** Extra label offset when an edge marker occupies that side. */
export const isoEdgeLabelOutset = (baseStroke: number): number => baseStroke * 3;

export const activeEdgeSides = (
    markers: ReadonlyArray<{ type: string; edge?: string }>,
): Set<EdgeSide> => {
    const sides = new Set<EdgeSide>();
    for (const marker of markers) {
        if (marker.type === "edge" && marker.edge !== undefined) {
            sides.add(marker.edge as EdgeSide);
        }
    }
    return sides;
};

const pushSegment = (segments: LineSegment[], x1: number, y1: number, x2: number, y2: number): void => {
    segments.push({ x1, y1, x2, y2 });
};

export const squaresEdgeSegments = (
    edge: EdgeSide,
    grid: GridPoints,
    buffer: number,
): LineSegment[] => {
    const flat = grid.flat();
    if (flat.length === 0) {
        return [];
    }
    const xMin = Math.min(...flat.map((pt) => pt.x));
    const yMin = Math.min(...flat.map((pt) => pt.y));
    const xMax = Math.max(...flat.map((pt) => pt.x));
    const yMax = Math.max(...flat.map((pt) => pt.y));

    const segments: LineSegment[] = [];
    switch (edge) {
        case "N":
            pushSegment(segments, xMin - buffer, yMin - buffer, xMax + buffer, yMin - buffer);
            break;
        case "E":
            pushSegment(segments, xMax + buffer, yMin - buffer, xMax + buffer, yMax + buffer);
            break;
        case "S":
            pushSegment(segments, xMin - buffer, yMax + buffer, xMax + buffer, yMax + buffer);
            break;
        case "W":
            pushSegment(segments, xMin - buffer, yMin - buffer, xMin - buffer, yMax + buffer);
            break;
        default:
            break;
    }
    return segments;
};

/** Centroid of all grid cell centres. */
const gridCentre = (grid: GridPoints): IPoint => {
    const flat = grid.flat();
    return {
        x: flat.reduce((sum, pt) => sum + pt.x, 0) / flat.length,
        y: flat.reduce((sum, pt) => sum + pt.y, 0) / flat.length,
    };
};

/** Offset a line segment outward from the board centre by `buffer`. */
const offsetSegmentOutside = (p1: IPoint, p2: IPoint, centre: IPoint, buffer: number): LineSegment => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) {
        return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    }
    const ex = dx / len;
    const ey = dy / len;
    const n1x = -ey;
    const n1y = ex;
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const dot1 = n1x * (mx - centre.x) + n1y * (my - centre.y);
    const nx = dot1 > 0 ? n1x : -n1x;
    const ny = dot1 > 0 ? n1y : -n1y;
    return {
        x1: p1.x + nx * buffer,
        y1: p1.y + ny * buffer,
        x2: p2.x + nx * buffer,
        y2: p2.y + ny * buffer,
    };
};

/**
 * Single edge line spanning the terminal circle centres on a hex-of-cir board,
 * offset outside the board.
 */
export const hexOfCirEdgeSegments = (
    edge: EdgeSide,
    grid: GridPoints,
    buffer: number,
): LineSegment[] => {
    if (grid.length === 0) {
        return [];
    }

    const midrow = Math.floor(grid.length / 2);
    const last = grid.length - 1;
    let p1: IPoint | undefined;
    let p2: IPoint | undefined;

    switch (edge) {
        case "N":
            p1 = grid[0][0];
            p2 = grid[0][grid[0].length - 1];
            break;
        case "S":
            p1 = grid[last][0];
            p2 = grid[last][grid[last].length - 1];
            break;
        case "NE":
            p1 = grid[0][grid[0].length - 1];
            p2 = grid[midrow][grid[midrow].length - 1];
            break;
        case "SE":
            p1 = grid[midrow][grid[midrow].length - 1];
            p2 = grid[last][grid[last].length - 1];
            break;
        case "SW":
            p1 = grid[last][0];
            p2 = grid[midrow][0];
            break;
        case "NW":
            p1 = grid[0][0];
            p2 = grid[midrow][0];
            break;
        default:
            return [];
    }

    if (p1 === undefined || p2 === undefined) {
        return [];
    }

    return [offsetSegmentOutside(p1, p2, gridCentre(grid), buffer)];
};

/** Pointy-top hex template polys aligned to hex-of-hex grid centres. */
export const hexCellPolysFromGrid = (grid: GridPoints, cellsize: number): IPolyPolygon[][] => {
    const triWidth = cellsize / 2;
    const halfhex = triWidth / 2;
    const triHeight = (triWidth * Math.sqrt(3)) / 2;
    const centerYOffset = cellsize / 2;
    const template: IPoint[] = [
        { x: triHeight, y: 0 },
        { x: triHeight * 2, y: halfhex },
        { x: triHeight * 2, y: halfhex + triWidth },
        { x: triHeight, y: triWidth * 2 },
        { x: 0, y: halfhex + triWidth },
        { x: 0, y: halfhex },
    ];
    return grid.map((row) =>
        row.map((p) => ({
            type: "poly" as const,
            points: template.map((pt) => ({
                x: pt.x + p.x - triHeight,
                y: pt.y + p.y - centerYOffset,
            })),
        })),
    );
};

/**
 * Edge segments along a hex-of-hex board outline.
 * Point 0 is the top vertex; corners share edges between adjacent cells.
 */
export const hexOfHexEdgeSegments = (edge: EdgeSide, polys: Poly[][]): LineSegment[] => {
    if (polys.length === 0) {
        return [];
    }

    const midrow = Math.floor(polys.length / 2);
    let hexes: Poly[];
    let idxs: [[number, number], [number, number]];

    switch (edge) {
        case "N":
            hexes = polys[0];
            idxs = [[5, 0], [0, 1]];
            break;
        case "NE":
            hexes = [];
            for (let row = 0; row <= midrow; row++) {
                hexes.push(polys[row][polys[row].length - 1]);
            }
            idxs = [[0, 1], [1, 2]];
            break;
        case "SE":
            hexes = [];
            for (let row = midrow; row < polys.length; row++) {
                hexes.push(polys[row][polys[row].length - 1]);
            }
            idxs = [[1, 2], [2, 3]];
            break;
        case "S":
            hexes = [...polys[polys.length - 1]];
            hexes.reverse();
            idxs = [[2, 3], [3, 4]];
            break;
        case "SW":
            hexes = [];
            for (let row = midrow; row < polys.length; row++) {
                hexes.push(polys[row][0]);
            }
            hexes.reverse();
            idxs = [[3, 4], [4, 5]];
            break;
        case "NW":
            hexes = [];
            for (let row = 0; row <= midrow; row++) {
                hexes.push(polys[row][0]);
            }
            hexes.reverse();
            idxs = [[4, 5], [5, 0]];
            break;
        default:
            return [];
    }

    const segments: LineSegment[] = [];
    for (let i = 0; i < hexes.length; i++) {
        const hex = hexes[i] as IPolyPolygon;
        const pt1 = hex.points[idxs[0][0]];
        const pt2 = hex.points[idxs[0][1]];
        const pt3 = hex.points[idxs[1][1]];
        if (i === 0) {
            const midx = (pt1.x + pt2.x) / 2;
            const midy = (pt1.y + pt2.y) / 2;
            pushSegment(segments, midx, midy, pt2.x, pt2.y);
            pushSegment(segments, pt2.x, pt2.y, pt3.x, pt3.y);
        } else if (i === hexes.length - 1) {
            const midx = (pt2.x + pt3.x) / 2;
            const midy = (pt2.y + pt3.y) / 2;
            pushSegment(segments, pt1.x, pt1.y, pt2.x, pt2.y);
            pushSegment(segments, pt2.x, pt2.y, midx, midy);
        } else {
            pushSegment(segments, pt1.x, pt1.y, pt2.x, pt2.y);
            pushSegment(segments, pt2.x, pt2.y, pt3.x, pt3.y);
        }
    }
    return segments;
};

export type IsoBoardStyle = "squares" | "heightmap-squares" | "hex-of-hex" | "hex-of-cir";

export const collectEdgeMarkerSegments = (
    style: IsoBoardStyle,
    edge: EdgeSide,
    grid: GridPoints,
    polys: Poly[][],
    cellsize: number,
    baseStroke: number,
): LineSegment[] => {
    const buffer = isoEdgeMarkerBuffer(cellsize, baseStroke);
    switch (style) {
        case "heightmap-squares":
        case "squares":
            return squaresEdgeSegments(edge, grid, buffer);
        case "hex-of-hex":
            return hexOfHexEdgeSegments(edge, polys);
        case "hex-of-cir":
            return hexOfCirEdgeSegments(edge, grid, buffer);
        default:
            return [];
    }
};
