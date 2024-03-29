/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Container, Element, Use } from "@svgdotjs/svg.js";

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
export const scale: (element: Element, factor: number, x: number, y: number) => void = (element, factor, x, y) => {
    element.transform({a: factor, b: 0, c: 0, d: factor, e: x - factor * x, f: y - factor * y}, true);
}

/**
 * Rotate an element around a point. For some unknown reason element.rotate(angle, x, y) sometimes gives the wrong results in Safari.
 */
export const rotate: (element: Element, angle: number, x: number, y: number) => void = (element, angle, x, y) => {
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

/**
 * Place (use) piece in svg with center at (x,y), scaling it to fit a cell of size cellsize and further scaling it by scalingFactor.
 * This assumes that the piece was loaded with loadLegend (in particular that it was "designed" for a cell of size 500).
*/
export const usePieceAt: (svg: Container, piece: Element, cellsize: number, x: number, y: number, scalingFactor: number) => Use = (svg, piece, cellsize, x, y, scalingFactor) => {
    const factor = cellsize / 500 * scalingFactor;
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

