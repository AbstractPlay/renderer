import { G as SVGG } from "@svgdotjs/svg.js";
import { ptDistance } from "../common/plotting.js";
import { RendererBase } from "../renderers/_base.js";
import { GridPoints, IPolyPolygon, IPoint, Poly } from "../grids/index.js";
import { Colourfuncs, Colourstrings, PositiveInteger } from "../schemas/schema.js";
import { Orientation } from "honeycomb-grid";

export { cairoCatalan } from "./cairoCatalan.js";
export { cairoCollinear } from "./cairoCollinear.js";
export { cobweb } from "./cobweb.js";
export { conhex, getConhexCells } from "./conhex.js";
export { conicalHex } from "./conicalHex.js";
export { dvgc } from "./dvgc.js";
export { eleven } from "./eleven.js";
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

/**
 * Map a pointer event to `#board` local coordinates. Unlike `rootSvg.point()`, this
 * already inverses the board group's rotation from {@link RendererBase.rotateBoard};
 * do not apply `rotatePoint` again for `getRotation()`.
 */
export function boardClickLocalPoint(
    board: SVGG,
    clientX: number,
    clientY: number,
): IPoint {
    return board.point(clientX, clientY);
}

/**
 * Transparent playfield overlay for `boardClick` (same geometry as `boardFill`, not the
 * backfill layer). Call after `markBoard` so it sits above grid chrome and below `#pieces`.
 * `stacking-offset` stacks must append `#pieces` after board dispatch so per-piece handlers
 * (with `stopPropagation`) stay above this layer. Group `pointer-events: bounding-box` is
 * unreliable in Firefox.
 */
export function attachBoardNearestClick(
    board: SVGG,
    handler: (e: { clientX: number; clientY: number }) => void,
    hitArea: IPolyPolygon,
): void {
    const catcher = board.group().id("board-click-catcher");
    const pointStr = hitArea.points.map((p) => `${p.x},${p.y}`).join(" ");
    catcher
        .polygon(pointStr)
        .fill({ color: "#000", opacity: 0 })
        .attr({ "pointer-events": "all" })
        .click(handler);
}

/** Axis-aligned playfield bounds around a vertex grid (padding ≈ one cell). */
export function boardFillBBoxFromGrid(grid: GridPoints, cellsize: number): IPolyPolygon {
    const delta = cellsize / 1.5;
    const xs = grid.flat().map((pt) => pt.x);
    const ys = grid.flat().map((pt) => pt.y);
    const minx = Math.min(...xs);
    const miny = Math.min(...ys);
    const maxx = Math.max(...xs);
    const maxy = Math.max(...ys);
    return {
        type: "poly",
        points: [
            { x: minx - delta, y: miny - delta },
            { x: maxx + delta, y: miny - delta },
            { x: maxx + delta, y: maxy + delta },
            { x: minx - delta, y: maxy + delta },
        ],
    };
}

export type BoardClickBlockedCell = { row: number; col: number };

/** Nearest grid vertex for line-grid boards; call after `markBoard`. */
export function attachNearestGridPointClick(
    board: SVGG,
    grid: GridPoints,
    boardFill: IPolyPolygon,
    boardClick: (row: number, col: number, piece: string) => void,
    options?: {
        blocked?: readonly BoardClickBlockedCell[];
        rowFilter?: (row: number) => boolean;
    },
): void {
    const handler = (e: { clientX: number; clientY: number }) => {
        const clicked = boardClickLocalPoint(board, e.clientX, e.clientY);
        let closestDist = Infinity;
        let closestRow: number | null = null;
        let closestCol: number | null = null;
        for (let row = 0; row < grid.length; row++) {
            if (options?.rowFilter !== undefined && !options.rowFilter(row)) {
                continue;
            }
            const currRow = grid[row];
            for (let col = 0; col < currRow.length; col++) {
                if (options?.blocked?.some((b) => b.row === row && b.col === col)) {
                    continue;
                }
                const pt = currRow[col];
                const dist = ptDistance(pt.x, pt.y, clicked.x, clicked.y);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestRow = row;
                    closestCol = col;
                }
            }
        }
        if (closestRow !== null && closestCol !== null) {
            boardClick(closestRow, closestCol, "");
        }
    };
    attachBoardNearestClick(board, handler, boardFill);
}

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
