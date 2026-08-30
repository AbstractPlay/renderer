import { G as SVGG } from "@svgdotjs/svg.js";
import { RendererBase } from "../renderers/_base.js";
import { GridPoints, Poly } from "../grids/index.js";
import { Colourfuncs, Colourstrings, PositiveInteger } from "../schemas/schema.js";
import { Orientation } from "honeycomb-grid";

export { cairoCatalan } from "./cairoCatalan.js";
export { cairoCollinear } from "./cairoCollinear.js";
export { cobweb } from "./cobweb.js";
export { conhex, getConhexCells } from "./conhex.js";
export { conicalHex } from "./conicalHex.js";
export { dvgc } from "./dvgc.js";
export { hexOfCir } from "./hexOfCir.js";
export { hexOfHex } from "./hexOfHex.js";
export { hexOfTri } from "./hexOfTri.js";
export { hexOfTriF } from "./hexOfTriF.js";
export { hexSlanted } from "./hexSlanted.js";
export { fracturedFlat } from "./fracturedFlat.js";
export { moon } from "./moon.js";
export { onyx } from "./onyx.js";
export { pentagonal } from "./pentagonal.js";
export { bentTri } from "./bentTri.js";
export { star } from "./star.js";
export { pyramidHex } from "./pyramidHex.js";
export { rectOfHex } from "./rectOfHex.js";
export { rectOfTri } from "./rectOfTri.js";
export { snubSquare } from "./snubSquare.js";
export { snubSquareCells } from "./snubSquareCells.js";
export { sowing } from "./sowing.js";
export { sowingRound } from "./sowingRound.js";
export { squares } from "./squares.js";
export { squaresDiamonds } from "./squaresDiamonds.js";
export { squaresStacked } from "./squaresStacked.js";
export { stackingTriangles } from "./stackingTriangles.js";
export { vertex } from "./vertex.js";
export { wheel } from "./wheel.js";

export type CompassDirection = "N"|"NE"|"E"|"SE"|"S"|"SW"|"W"|"NW";

export type BoardReturn = {
    grid: GridPoints;
    polys?: Poly[][];
    boardFill?: Poly;
};

export interface GridlineLayers {
    root: SVGG;
    fill: SVGG;
    below: SVGG;
    strokes: SVGG;
    markers: SVGG;
}

export function createGridlineLayers(parent: SVGG, id = "gridlines"): GridlineLayers {
    const root = parent.group().id(id);
    return {
        root,
        fill: root.group().id(`${id}-fill`),
        below: root.group().id(`${id}-below`),
        strokes: root.group().id(`${id}-strokes`),
        markers: root.group().id(`${id}-markers`),
    };
}

/** Alias for boards that use a `#cells` group instead of `#gridlines`. */
export const createCellsLayers = createGridlineLayers;

/** Add marker sublayers to an existing group (e.g. `#board`) used as the markBoard target. */
export function ensureBoardMarkerLayers(root: SVGG): GridlineLayers {
    const id = root.id();
    if (!id) {
        throw new Error("Group must have an id for marker layers");
    }
    const below = root.findOne(`#${id}-below`) as SVGG | undefined;
    if (below) {
        return {
            root,
            fill: root.findOne(`#${id}-fill`) as SVGG,
            below,
            strokes: root.findOne(`#${id}-strokes`) as SVGG,
            markers: root.findOne(`#${id}-markers`) as SVGG,
        };
    }
    return {
        root,
        fill: root.group().id(`${id}-fill`),
        below: root.group().id(`${id}-below`),
        strokes: root.group().id(`${id}-strokes`),
        markers: root.group().id(`${id}-markers`),
    };
}

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

// helpers for getting settings consistently across the boards
export const getBoardFill = (ctx: RendererBase, defColour: string|undefined = undefined, defOpacity = 0): [string|undefined, number] => {
    if (ctx.json === undefined || ctx.json.board === null) {
        throw new Error(`Context object in an invalid state.`);
    }
    let hexFill = defColour;
    let hexOpacity = defOpacity;
    if (ctx.options.colourContext.board !== undefined) {
        hexFill = ctx.options.colourContext.board;
        hexOpacity = 1;
    }
    // Because of how board fills are now implemented, a fill of type `full`
    // automatically implies `board` as well.
    if ( ("backFill" in ctx.json.board) && (ctx.json.board.backFill !== undefined) && (ctx.json.board.backFill !== null) ){
        hexFill = ctx.resolveColour(ctx.json.board.backFill.colour) as string;
        hexOpacity = ctx.json.board.backFill.opacity ?? 1;
    }
    return [hexFill, hexOpacity];
}
