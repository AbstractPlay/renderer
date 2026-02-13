import { Colourfuncs, Colourstrings, PositiveInteger } from "../schemas/schema";
import { Orientation } from "honeycomb-grid";

export { cairoCatalan } from "./cairoCatalan";
export { cairoCollinear } from "./cairoCollinear";
export { cobweb } from "./cobweb";
export { conhex, getConhexCells } from "./conhex";
export { conicalHex } from "./conicalHex";
export { dvgc } from "./dvgc";
export { hexOfCir } from "./hexOfCir";
export { hexOfHex } from "./hexOfHex";
export { hexOfTri } from "./hexOfTri";
export { hexOfTriF } from "./hexOfTriF";
export { hexSlanted } from "./hexSlanted";
export { moon } from "./moon";
export { onyx } from "./onyx";
export { pentagonal } from "./pentagonal";
export { pyramidHex } from "./pyramidHex";
export { rectOfHex } from "./rectOfHex";
export { rectOfTri } from "./rectOfTri";
export { snubSquare } from "./snubSquare";
export { snubSquareCells } from "./snubSquareCells";
export { sowing } from "./sowing";
export { sowingRound } from "./sowingRound";
export { squares } from "./squares";
export { squaresDiamonds } from "./squaresDiamonds";
export { squaresStacked } from "./squaresStacked";
export { stackingTriangles } from "./stackingTriangles";
export { vertex } from "./vertex";
export { wheel } from "./wheel";

export type CompassDirection = "N"|"NE"|"E"|"SE"|"S"|"SW"|"W"|"NW";

/**
 * An internal interface used when rendering board buffers.
 *
 */
export interface IBuffer {
    width?: number;
    pattern?: string;
    show?: ("N"|"E"|"S"|"W")[];
    colours?: {
      side: "N" | "E" | "S" | "W";
      colour: PositiveInteger | Colourstrings | Colourfuncs;
    }[];
};

export interface IEdge {
    dir: CompassDirection;
    corners: [0|1|2|3|4|5,0|1|2|3|4|5];
}

export const edges2corners = new Map<Orientation, IEdge[]>([
    [Orientation.FLAT, [
        {dir: "N", corners: [5,0]},
        {dir: "NE", corners: [0,1]},
        {dir: "SE", corners: [1,2]},
        {dir: "S", corners: [2,3]},
        {dir: "SW", corners: [3,4]},
        {dir: "NW", corners: [4,5]},
    ]],
    [Orientation.POINTY, [
        {dir: "NE", corners: [5,0]},
        {dir: "E", corners: [0,1]},
        {dir: "SE", corners: [1,2]},
        {dir: "SW", corners: [2,3]},
        {dir: "W", corners: [3,4]},
        {dir: "NW", corners: [4,5]},
    ]],
]);

/** Helper functions for drawing edge click handlers */
export const sortPoints = (a: [number,number], b: [number,number]) => {
    if (a[0] === b[0]) {
        if (a[1] === b[1]) {
            return 0;
        } else {
            return a[1] - b[1];
        }
    } else {
        return a[0] - b[0];
    }
};
export const pts2id = (a: [number,number], b: [number,number]): string => {
    const x = a.map(n => Math.trunc(n * 1000) / 1000) as [number,number];
    const y = b.map(n => Math.trunc(n * 1000) / 1000) as [number,number];
    return [x,y].sort(sortPoints).map(p => p.join(",")).join(" ");
}

