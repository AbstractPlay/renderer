import { projectPoint } from "../common/plotting.js";
import { GridPoints, IGeneratorArgs, IPoint, IPolyPath, IPolyPolygon } from "./_base.js";

export interface IWheelArgs extends IGeneratorArgs {
    start?: number;
    /** Inner hole radius in cell-size units (default 0). */
    innerRadius?: number;
}

export interface IWheelSpokeData {
    pts: IPoint[][];
    dists: number[];
    gridWidth: number;
    gridHeight: number;
    innerR: number;
    cellSize: number;
    start: number;
}

export function resolveWheelArgs(args: IWheelArgs): IWheelSpokeData {
    let cellSize = 50;
    if (args.cellSize !== undefined) {
        cellSize = args.cellSize;
    }

    let gridHeight = 4;
    let gridWidth = 8;
    if (args.gridHeight !== undefined) {
        gridHeight = args.gridHeight;
    }
    if (args.gridWidth !== undefined) {
        gridWidth = args.gridWidth;
    }
    let start = 0;
    if (args.start !== undefined) {
        start = args.start;
    }
    let innerR = 0;
    if (args.innerRadius !== undefined) {
        innerR = args.innerRadius * cellSize;
    }

    const dists: number[] = [];
    for (let j = 0; j <= gridHeight; j++) {
        dists.push(innerR + cellSize * j);
    }

    const phi = 360 / gridWidth;
    const pts: IPoint[][] = [];
    for (let i = 0; i < gridWidth; i++) {
        const line: IPoint[] = [];
        const angle = start + (phi * i);
        for (const dist of dists) {
            const [x, y] = projectPoint(0, 0, dist, angle);
            line.push({x, y});
        }
        pts.push(line);
    }
    pts.push(pts[0].map(pt => ({...pt})));

    return {pts, dists, gridWidth, gridHeight, innerR, cellSize, start};
}

/** Radial centroid of an annular sector between `rInner` and `rOuter`. */
export function annularSectorCentroidRadius(rInner: number, rOuter: number): number {
    if (rOuter <= rInner) {
        return rInner;
    }
    const outer2 = rOuter * rOuter;
    const inner2 = rInner * rInner;
    return (2 / 3) * (outer2 * rOuter - inner2 * rInner) / (outer2 - inner2);
}

function spaceCentroid(args: IWheelArgs, row: number, col: number): IPoint {
    const {dists, gridWidth, gridHeight, start} = resolveWheelArgs(args);
    const bottom = gridHeight - 1 - row;
    const top = bottom + 1;
    const rBar = annularSectorCentroidRadius(dists[bottom], dists[top]);
    const phi = 360 / gridWidth;
    const midAngle = start + phi * (col + 0.5);
    const [x, y] = projectPoint(0, 0, rBar, midAngle);
    return {x, y};
}

/**
 * Space centroids only — one row per ring. Row 0 is the outermost ring.
 */
export const wheelGridSpaces = (args: IWheelArgs): GridPoints => {
    const {gridWidth, gridHeight} = resolveWheelArgs(args);
    const grid: GridPoints = [];
    for (let row = 0; row < gridHeight; row++) {
        const spaces: IPoint[] = [];
        for (let col = 0; col < gridWidth; col++) {
            spaces.push(spaceCentroid(args, row, col));
        }
        grid.push(spaces);
    }
    return grid;
};

/**
 * Intersection points only — one row per ring radius. Row 0 is the outermost ring.
 * When innerRadius is 0, the innermost row places all spokes at the centre.
 */
export const wheelGridVertices = (args: IWheelArgs): GridPoints => {
    const {pts, gridHeight, gridWidth} = resolveWheelArgs(args);
    const grid: GridPoints = [];
    for (let ring = gridHeight; ring >= 0; ring--) {
        const row: IPoint[] = [];
        for (let i = 0; i < gridWidth; i++) {
            row.push(pts[i][ring]);
        }
        grid.push(row);
    }
    return grid;
};

/**
 * Vertices and spaces interlaced (legacy). Row 0 is outer vertices; odd rows are spaces.
 * Final row is the centre point when innerRadius is 0.
 */
export const wheelGridBoth = (args: IWheelArgs): GridPoints => {
    const polys = wheelPolys(args);
    const {innerR} = resolveWheelArgs(args);
    const grid: GridPoints = [];
    for (let row = 0; row < polys.length; row++) {
        const slice = polys[row];
        const verts: IPoint[] = [];
        const spaces: IPoint[] = [];
        for (const poly of slice) {
            verts.push(poly.points[1]);
            spaces.push(spaceCentroid(args, row, spaces.length));
        }
        grid.push(verts);
        grid.push(spaces);
    }
    if (innerR === 0) {
        grid.push([{x: 0, y: 0}]);
    }
    return grid;
};

/** @deprecated Use wheelGridBoth, wheelGridSpaces, or wheelGridVertices. */
export const wheel = wheelGridBoth;

export const wheelPolys = (args: IWheelArgs): (IPolyPolygon|IPolyPath)[][] => {
    const {pts, dists, gridHeight} = resolveWheelArgs(args);

    const polys: (IPolyPolygon|IPolyPath)[][] = [];
    for (let slice = 0; slice < pts.length - 1; slice++) {
        const left = pts[slice];
        const right = pts[slice + 1];
        const slicePolys: (IPolyPolygon|IPolyPath)[] = [];
        for (let cell = 0; cell < gridHeight; cell++) {
            const bottom = cell;
            const top = bottom + 1;

            const bl = left[bottom];
            const tl = left[top];
            const tr = right[top];
            const br = right[bottom];
            const bottomR = dists[bottom];
            const topR = dists[top];

            if (cell === gridHeight - 1) {
                slicePolys.push({
                    type: "path",
                    points: [bl, tl, tr, br],
                    path: `M${tl.x},${tl.y} A ${topR} ${topR} 0 0 1 ${tr.x},${tr.y} L${br.x},${br.y} A ${bottomR} ${bottomR} 0 0 0 ${bl.x},${bl.y} Z`,
                });
            } else if (cell === 0 && bottomR === 0) {
                slicePolys.push({
                    type: "path",
                    points: [bl, tl, tr],
                    path: `M${tl.x},${tl.y} A ${topR} ${topR} 0 0 1 ${tr.x},${tr.y} L${bl.x},${bl.y} Z`,
                });
            } else {
                slicePolys.push({
                    type: "path",
                    points: [bl, tl, tr, br],
                    path: `M${tl.x},${tl.y} A ${topR} ${topR} 0 0 1 ${tr.x},${tr.y} L${br.x},${br.y} A ${bottomR} ${bottomR} 0 0 0 ${bl.x},${bl.y} Z`,
                });
            }
        }
        polys.push(slicePolys);
    }

    const rearranged: (IPolyPolygon|IPolyPath)[][] = [];
    for (let row = 0; row < gridHeight; row++) {
        rearranged.push([...polys.map(col => col[gridHeight - 1 - row])]);
    }
    return rearranged;
};

export const wheelLabels = (args: IWheelArgs): IPoint[] => {
    const {dists, gridWidth, gridHeight, cellSize, start} = resolveWheelArgs(args);
    const outerR = dists[gridHeight];
    const phi = 360 / gridWidth;
    const pts: IPoint[] = [];
    for (let i = 0; i < gridWidth; i++) {
        const angle = start + (phi * (i + 0.5));
        const [x, y] = projectPoint(0, 0, outerR + (cellSize / 2), angle);
        pts.push({x, y});
    }
    return pts;
};

/** Interlace space-ring polys with empty rows for legacy both-mode flood markers. */
export const wheelPolysInterlaced = (args: IWheelArgs): (IPolyPolygon | IPolyPath)[][] =>
    wheelPolys(args).reduce((prev, curr) => [...prev, curr, []], [[]] as (IPolyPolygon | IPolyPath)[][]);
