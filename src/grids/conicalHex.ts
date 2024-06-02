import { GridPoints, IGeneratorArgs, IPoint } from "./_base";
import { IPolyPolygon } from "../renderers/_base";
import { centroid } from "../common/plotting";

type Vertex = [number,number];
type Hex = Vertex[];

/**
 * Generates a hexagonal field of center points that will accommodate hexagons.
 *
 * @param args - Generator options
 * @returns Map of x,y coordinates to row/column locations
 */
export const conicalHex = (args: IGeneratorArgs): GridPoints => {
    let cellSize = 50;
    if (args.cellSize !== undefined) {
        cellSize = args.cellSize;
    }
    let gridHeight = 8;
    if (args.gridHeight !== undefined) {
        gridHeight = args.gridHeight;
    }
    let narrow = false;
    if (args.conicalNarrow !== undefined) {
        narrow = args.conicalNarrow;
    }
    const polys = genPolys({height: gridHeight, scale: cellSize, narrow});
    const grid: GridPoints = [];
    for (const pRow of polys) {
        const row: IPoint[] = [];
        for (const poly of pRow) {
            row.push(centroid(poly.points)!);
        }
        grid.push(row);
    }
    return grid;
}

export const genPolys = (opts: {height: number, scale: number, narrow: boolean}): IPolyPolygon[][] => {
    const baseHex: Hex = [];
    const s32 = Math.sqrt(3) / 2;
    const rad = 1 / Math.sqrt(3);

    for (let i = 0; i < 6; i++) {
        const alpha = (i + 0.5) * 2 * Math.PI / 6;
        baseHex.push([rad * Math.cos(alpha), rad * Math.sin(alpha)])
    }

    const hexes: Hex[][] = [];
    for (let y = 0; y < opts.height; y++) {
        const row: Hex[] = [];
        for (let x = 1; x < opts.height; x++) {
            const yshift = opts.narrow ? 0.5 : -0.5;
            const dx = x + yshift * y;
            const dy = s32 * y;
            const hex: Vertex[] = [];
            for (let i = 0; i < 6; i++) {
                hex.push([baseHex[i][0] + dx, baseHex[i][1] + dy]);
            }
            row.push(hex);
        }
        hexes.push(row);
    }

    const toSegments = (hex: Hex): Vertex[] => {
        const coords: Vertex[] = [];
        for (let i = 0; i < 6; i++) {
            const a = hex[i];
            const b = hex[(i + 1) % 6];
            const steps = 15;
            for (let j = 0; j <= steps; j++) {
                const s = j / steps;
                coords.push([(1 - s) * a[0] + s * b[0], (1 - s) * a[1] + s * b[1]]);
            }
        }
        return coords;
    }

    const fold = (p: [number,number], factor: number): [number,number] => {
        const d = Math.sqrt(p[0]**2 + p[1]**2);
        let a = Math.atan2(p[1], p[0]);
        a = a * factor;

        const x = d * Math.cos(a);
        const y = d * Math.sin(a);
        return [x,y];
    }

    const truncate = (n: number): number => {
        return Math.round(n * 100) / 100;
    }

    const f = opts.narrow ? 6 : 3;
    const polys: IPolyPolygon[][] = [];
    for (const row of hexes) {
        const pRow: IPolyPolygon[] = [];
        for (const hex of row) {
            const coords: Vertex[] = [];
            for (const pt of toSegments(hex)) {
                const folded = fold(pt, f);
                coords.push([truncate(opts.scale * folded[0]), truncate(opts.scale * folded[1])]);
            }
            // rotate all the polygons 90 degrees
            pRow.push({type: "poly", points: coords.map(v => { return {x: v[1], y: v[0] * -1}; })});
        }
        polys.push(pRow);
    }
    return polys;
}