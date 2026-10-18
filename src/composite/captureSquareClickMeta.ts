import type { Element, G, Svg } from "@svgdotjs/svg.js";
import { rotatePoint } from "../common/plotting.js";
import { rectOfRects } from "../grids/index.js";
import type { APRenderRep } from "../schemas/schema.js";
import { boardRotateFromRender, compositeVisualRotation, normalizeDegrees } from "./compositePanelRotation.js";

export type SquareClickMeta = {
    originX: number;
    originY: number;
    cellsize: number;
    width: number;
    height: number;
    /** `panels[].rotate` (composite seat / opts.rotate). */
    panelRotate: number;
    /** `render.board.rotate` on this panel. */
    boardRotate: number;
    /** Combined rotation applied to `#board` (panel + board). */
    seatRotate: number;
    /** Logical cell centres in panel SVG space (`row,col` → point). */
    cellCenters: Record<string, { x: number; y: number }>;
};

/** Absolute row/col centres from the square grid (blocked cells do not shift indices). */
const logicalSquareCellCenters = (
    draw: Svg,
    render: APRenderRep,
    width: number,
    height: number,
    cellsize: number,
    seatRotate: number,
): { centers: Record<string, { x: number; y: number }>; origin: { x: number; y: number } } => {
    const boardJson = render.board;
    const grid = rectOfRects({
        gridWidth: width,
        gridHeight: height,
        cellSize: cellsize,
        tileWidth: boardJson !== null && boardJson !== undefined && "tileWidth" in boardJson
            ? boardJson.tileWidth
            : undefined,
        tileHeight: boardJson !== null && boardJson !== undefined && "tileHeight" in boardJson
            ? boardJson.tileHeight
            : undefined,
        tileSpacing: boardJson !== null && boardJson !== undefined && "tileSpacing" in boardJson
            ? boardJson.tileSpacing
            : undefined,
    });

    const board = draw.findOne("#board") as G | null;
    const pivot = board !== null
        ? (() => {
            const bb = board.bbox();
            return { x: bb.cx, y: bb.cy };
        })()
        : grid[0][0];

    const centers: Record<string, { x: number; y: number }> = {};
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            let pt = { ...grid[row][col] };
            if (seatRotate !== 0) {
                pt = rotatePoint(pt, seatRotate, pivot);
            }
            centers[`${row},${col}`] = pt;
        }
    }
    let origin = { ...grid[0][0] };
    if (seatRotate !== 0) {
        origin = rotatePoint(origin, seatRotate, pivot);
    }
    return { centers, origin };
};

/** Read grid origin and cell size from a freshly rendered square board on `draw`. */
export const captureSquareClickMeta = (
    draw: Svg,
    render: APRenderRep,
    panelRotate: number,
    boardRotate?: number,
): SquareClickMeta | undefined => {
    const board = render.board;
    if (board === null || board === undefined || !("width" in board) || !("height" in board)) {
        return undefined;
    }
    const width = Number(board.width);
    const height = Number(board.height);
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
        return undefined;
    }
    const tile = draw.findOne("#tiles use") as Element | null;
    if (tile === null) {
        return undefined;
    }
    const box = tile.bbox();
    const cellsize = box.width;
    if (!Number.isFinite(cellsize) || cellsize <= 0) {
        return undefined;
    }
    const br = boardRotate ?? boardRotateFromRender(render);
    const pr = normalizeDegrees(panelRotate);
    const seatRotate = compositeVisualRotation(pr, br);
    const { centers, origin } = logicalSquareCellCenters(draw, render, width, height, cellsize, seatRotate);
    return {
        originX: origin.x,
        originY: origin.y,
        cellsize,
        width,
        height,
        panelRotate: pr,
        boardRotate: br,
        seatRotate,
        cellCenters: centers,
    };
};
