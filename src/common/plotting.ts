/* eslint-disable @typescript-eslint/no-explicit-any */


import { Container, Element, Use } from "@svgdotjs/svg.js";
import { IPoint } from "../grids";

/**
 * Ensures a degree measurement lies [0, 360)
 */
export const normDeg = (deg: number): number => {
    while (deg < 0) {
        deg += 360;
    }
    return deg % 360;
}

/**
 * Converts degrees to radians
 */
export const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
}

/**
 * Converts degrees to radians
 */
export const rad2deg = (rad: number): number => {
    return rad * (180 / Math.PI);
}

/**
 * Converts a "table facing" (0 degrees due north, increases clockwise)
 * to a proper planar value (0 degrees due east, increases counterclockwise)
 * and vice-versa. It's the same process.
 */
export const toggleFacing = (n: number): number => {
    return (360 - n + 90) % 360;
}

/**
 * Given a starting x,y coordinate, a distance, and a facing, return a new x,y coordinate.
 * "Facing" is table facing, meaning 0 is due north and increases clockwise.
 */
export const projectPoint = (x: number, y: number, dist: number, deg: number): [number,number] => {

    const truncNum = (n: number): number => {
        return Math.trunc(n * 100000) / 100000;
    }
    deg = normDeg(deg);
    const facing = normDeg(toggleFacing(deg));
    const m = Math.tan(deg2rad(facing));
    const deltax = dist / (Math.sqrt(1 + m**2));
    let newx: number;
    if (deg > 180) {
        newx = x - deltax;
    } else {
        newx = x + deltax;
    }
    const deltay = Math.sqrt(truncNum(dist**2 - (newx - x)**2));
    let newy: number;
    if (facing > 180) {
        newy = y + deltay;
    } else {
        newy = y - deltay;
    }
    newx = truncNum(newx); newy = truncNum(newy);
    return [newx, newy];
}

/**
 * Given a starting x,y coordinate, a distance, and a facing, return a new x,y coordinate.
 * "Facing" is table facing, meaning 0 is due north and increases clockwise.
 * This is tailored for ellipses. x and y are taken as the centre of the ellipse.
 */
export const projectPointEllipse = (cx: number, cy: number, rx: number, ry: number, deg: number): [number,number] => {
    deg = normDeg(deg);
    const facing = normDeg(toggleFacing(deg));
    if (facing === 0) {
        return [cx + rx, cy];
    } else if (facing === 90) {
        return [cx, cy + ry];
    } else if (facing === 180) {
        return [cx - rx, cy];
    } else if (facing === 270) {
        return [cx, cy - ry];
    } else if (facing > 90 && facing < 270) {
        const rad = Math.sqrt(ry**2 + (rx**2 * Math.tan(facing)**2));
        const nx = (rx * ry) / rad * -1;
        const ny = (rx * ry * Math.tan(facing)) / rad * -1;
        return [nx + cx, ny + cy];
    } else {
        const rad = Math.sqrt(ry**2 + (rx**2 * Math.tan(facing)**2));
        const nx = (rx * ry) / rad;
        const ny = (rx * ry * Math.tan(facing)) / rad;
        return [nx + cx, ny + cy];
    }
}

export const ptDistance = (x1: number, y1: number, x2: number, y2: number): number => {
    return Math.sqrt(((x1 - x2)**2) + ((y1 - y2)**2));
}

export const smallestDegreeDiff = (deg1: number, deg2: number): number => {
    let diff = deg1 - deg2;
    while (diff > 180) {
        diff -= 360;
    }
    while (diff < -180) {
        diff += 360;
    }
    return diff;
}

/**
 * Returns the orientation of point2 in relation to point1 in "table facing"
 * (0 degrees due north, increases clockwise)
 */
export const calcBearing = (x1: number, y1: number, x2: number, y2: number): number => {
    const dx = x2 - x1;
    // flipped because our y axis is mirrored
    const dy = y1 - y2;
    const rad = Math.atan2(dy, dx);
    const deg = rad2deg(rad);
    return toggleFacing(deg);
}

/**
 * Scale an element around a point. For some unknown reason element.scale(factor, x, y) sometimes gives the wrong results in Safari.
 */
export const scale = (element: Element, factor: number, x: number, y: number) => {
    element.transform({a: factor, b: 0, c: 0, d: factor, e: x - factor * x, f: y - factor * y}, true);
}

/**
 * Rotate an element around a point. For some unknown reason element.rotate(angle, x, y) sometimes gives the wrong results in Safari.
 */
export const rotate = (element: Element, angle: number, x: number, y: number) => {
    // Convert t to radians
    const rad = deg2rad(angle);

    // Calculate the values of a, b, c, d, e, and f
    const a = Math.cos(rad);
    const b = Math.sin(rad);
    const c = -b;
    const d = a;
    const e = x - x * a + y * b;
    const f = y - y * a - x * b;

    element.transform({a, b, c, d, e, f}, true);
}

export const rotatePoint = (pt: IPoint, deg: number, cpt: IPoint): IPoint => {
    const rad = deg2rad(deg);
    const {x: cx, y: cy} = cpt;
    return {
        x: ((pt.x - cx) * Math.cos(rad)) - ((pt.y - cy) * Math.sin(rad)) + cx,
        y: ((pt.y - cy) * Math.cos(rad)) + ((pt.x - cx) * Math.sin(rad)) + cy,
    }
}

/**
 * Place (use) piece in svg with center at (x,y), scaling it to fit a cell of size cellsize and further scaling it by scalingFactor.
 * This assumes that the piece was loaded with loadLegend (in particular that it was "designed" for a cell of size 500).
*/
export const usePieceAt = (opts: {svg: Container, piece: Element, cellsize: number, x: number, y: number, scalingFactor?: number, sheetCellSize?: number}): Use => {
    const {svg, piece, cellsize, x, y} = opts;
    let sheetCellSize = 500;
    if (opts.sheetCellSize !== undefined) {
        sheetCellSize = opts.sheetCellSize;
    }
    let scalingFactor = 1;
    if (opts.scalingFactor !== undefined) {
        scalingFactor = opts.scalingFactor;
    }
    const factor = cellsize / (sheetCellSize) * scalingFactor;
    const newsize = factor * (piece.height() as number);
    const newx = x - newsize / 2;
    const newy = y - newsize / 2;
    const use = svg.use(piece).move(newx, newy);
    scale(use, factor, newx, newy);
    return use;
}

// Assumes each row is the same width
export const transposeRect = (lst: any[][]): any[][] => {
    if (lst.length === 0) {
        return [];
    }
    const newWidth = lst.length;
    const newHeight = lst[0].length;
    const transposed: any[][] = Array.from({length: newHeight}, () => Array(newWidth));

    for (let i = 0; i < lst.length; i++) {
        for (let j = 0; j < lst[i].length; j++) {
            transposed[j][i] = lst[i][j];
        }
    }
    return transposed;
}

/**
 * To rotate -90, reverse rows then transpose
 * Assumes the matrix is rectangular
 */
export const matrixRectRotN90 = (lst: any[][]): any[][] => {
    const reversed = lst.map(l => [...l].reverse());
    return transposeRect(reversed);
}

/**
 * To rotate +90, transpose then reverse rows
 * Assumes the matrix is rectangular
 */
export const matrixRectRot90 = (lst: any[][]): any[][] => {
    const transposed: any[][] = transposeRect(lst);
    return transposed.map(row => [...row].reverse());
}

export const calcPyramidOffset = (width: number, height: number, col: number, row: number)
                            : {gridrow: number, gridcol: number, layer: number, offset: boolean}|undefined => {
    if (row < height) {
        return {gridrow: row, gridcol: col, offset: false, layer: 0};
    }
    let maxrow = height - 1;
    let gridrow = row;
    let gridcol = col;
    let layer: number;
    for (layer = 1; layer < height; layer++) {
        gridrow = gridrow - (height - layer) - 1;
        if (layer % 2 === 0) {
            gridrow++;
            gridcol++;
        }
        maxrow += height - layer;
        if (row <= maxrow) {
            break;
        }
    }
    if (row > maxrow) {
        return undefined;
    }
    const maxcol = width - layer;
    if (col >= maxcol) {
        return undefined;
    }

    return {gridrow, gridcol, layer, offset: layer % 2 !== 0};
}

export const calcLazoOffset = (width: number, height: number, col: number, row: number)
                            : {gridrow: number, gridcol: number, layer: number}|undefined => {
    if (row < height) {
        return {gridrow: row, gridcol: col, layer: 0};
    }
    let gridrow = row;
    let gridcol = col;
    let maxrow = height - 1;
    const maxLayers = Math.min(width, height);
    let layer: number;
    for (layer = 1; layer < maxLayers; layer++) {
        gridrow = gridrow - (height - layer) - 1;
        maxrow += height - layer;
        if (row <= maxrow) {
            break;
        }
    }
    if (row > maxrow) {
        return undefined;
    }
    const maxcol = width - layer;
    if (col >= maxcol) {
        return undefined;
    }
    switch (layer % 3) {
        case 0:
            gridrow += 2 * Math.floor(layer / 3)
            gridcol += 2 * Math.floor(layer / 3)
            break;
        case 1:
            gridrow += 0 + (2 * Math.floor(layer / 3));
            gridcol += 1 + (2 * Math.floor(layer / 3));
            break;
        case 2:
            gridrow += 1 + (2 * Math.floor(layer / 3));
            gridcol += 0 + (2 * Math.floor(layer / 3));
            break;
    }

    return {gridrow, gridcol, layer};
}

export const centroid = (pts: IPoint[]): IPoint|undefined => {
    if (pts.length === 0) {
        return undefined;
    }
    const cx = pts.reduce((prev, curr) => prev + curr.x, 0) / pts.length;
    const cy = pts.reduce((prev, curr) => prev + curr.y, 0) / pts.length;
    return {x: cx, y: cy};
}

// Builds a circle as a polygon of `steps` sides
export const circle2poly = (cx: number, cy: number, r: number, steps = 64): [number,number][] => {
    const coordinates: [number,number][] = [];
    for (let i = 0; i < steps; i++) {
        coordinates.push(projectPoint(cx, cy, r, (i * 360) / steps));
    }
    return coordinates;
}

export const areaPolygon = (...pts: IPoint[]): number => {
    if (pts[0].x !== pts[pts.length - 1].x || pts[0].y !== pts[pts.length - 1].y) {
        pts.push(pts[0]);
    }
    let sum = 0;
    for (let i = 0; i < pts.length - 1; i++) {
        sum += (pts[i].x * pts[i+1].y) - (pts[i].y * pts[i+1].x);
    }
    return Math.abs(sum / 2);
}

// https://math.stackexchange.com/questions/3058210/how-to-shorten-a-line-but-maintain-its-angle
// shortens a line by a percent; val must be between 0 and 1
export const shortenLine = (x1: number, y1: number, x2: number, y2: number, val: number)
                            : [number,number,number,number] => {
    if (val < 0 || val > 1) {
        throw new Error("The val parameter must be between 0 and 1.");
    }
    const t0 = val;
    const t1 = 1 - val;
    const newx1 = x1 + (t0 * (x2 - x1));
    const newy1 = y1 + (t0 * (y2 - y1));
    const newx2 = x1 + (t1 * (x2 - x1));
    const newy2 = y1 + (t1 * (y2 - y1));
    return [newx1, newy1, newx2, newy2];
}

/**
 * Takes a closed polygon and generates a polygon of the exact same dimensions and angles
 * but larger or smaller by a fixed amount.
 *
 * @param points - The vertices of the polygon
 * @param distance - The amount to offset the polygon. Positive expands, negative contracts.
 * @returns The new set of vertices
 */
export const offsetPolygon = (points: IPoint[], distance: number): IPoint[] => {
    // Determine winding order (CW is positive area in SVG y-down coords)
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }
    const isCW = area > 0;

    const newPoints: IPoint[] = [];
    for (let i = 0; i < points.length; i++) {
        const prev = points[(i - 1 + points.length) % points.length];
        const curr = points[i];
        const next = points[(i + 1) % points.length];

        const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
        const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        let n1 = { x: -v1.y / len1, y: v1.x / len1 };

        const v2 = { x: next.x - curr.x, y: next.y - curr.y };
        const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        let n2 = { x: -v2.y / len2, y: v2.x / len2 };

        // If CW, normals pointing "right" are pointing inside. Invert to point outside.
        if (isCW) {
            n1 = { x: -n1.x, y: -n1.y };
            n2 = { x: -n2.x, y: -n2.y };
        }

        const p1 = { x: prev.x + n1.x * distance, y: prev.y + n1.y * distance };
        const C1 = n1.x * p1.x + n1.y * p1.y;

        const p2 = { x: curr.x + n2.x * distance, y: curr.y + n2.y * distance };
        const C2 = n2.x * p2.x + n2.y * p2.y;

        const det = n1.x * n2.y - n2.x * n1.y;

        if (Math.abs(det) < 1e-6) {
            newPoints.push({ x: curr.x + n1.x * distance, y: curr.y + n1.y * distance });
        } else {
            const x = (n2.y * C1 - n1.y * C2) / det;
            const y = (n1.x * C2 - n2.x * C1) / det;
            newPoints.push({ x, y });
        }
    }
    return newPoints;
}

export const roundPolygon = (points: IPoint[], radius: number): string => {
    let d = "";
    for (let i = 0; i < points.length; i++) {
        const curr = points[i];
        const prev = points[(i - 1 + points.length) % points.length];
        const next = points[(i + 1) % points.length];

        const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
        const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const v2 = { x: next.x - curr.x, y: next.y - curr.y };
        const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

        if (len1 < 0.001 || len2 < 0.001) {
            if (i === 0) {
                d += `M ${curr.x},${curr.y}`;
            } else {
                d += ` L ${curr.x},${curr.y}`;
            }
            continue;
        }

        const r = Math.min(radius, len1 / 2, len2 / 2);

        const p1 = { x: curr.x - (v1.x / len1) * r, y: curr.y - (v1.y / len1) * r };
        const p2 = { x: curr.x + (v2.x / len2) * r, y: curr.y + (v2.y / len2) * r };

        if (i === 0) {
            d += `M ${p1.x},${p1.y}`;
        } else {
            d += ` L ${p1.x},${p1.y}`;
        }
        d += ` Q ${curr.x},${curr.y} ${p2.x},${p2.y}`;
    }
    d += " Z";
    return d;
}