import type { Element, Svg } from "@svgdotjs/svg.js";
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
    /** Measured tile centres in panel SVG space (`row,col` → point). */
    cellCenters: Record<string, { x: number; y: number }>;
};

const sampleSquareCellCenters = (
    draw: Svg,
    width: number,
    height: number,
): Record<string, { x: number; y: number }> => {
    const tiles = draw.find("#tiles use");
    const out: Record<string, { x: number; y: number }> = {};
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = row * width + col;
            const el = tiles[idx];
            if (el === undefined) {
                continue;
            }
            const box = el.rbox(draw);
            out[`${row},${col}`] = { x: box.cx, y: box.cy };
        }
    }
    return out;
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
    const originX = box.cx;
    const originY = box.cy;
    const br = boardRotate ?? boardRotateFromRender(render);
    const pr = normalizeDegrees(panelRotate);
    const seatRotate = compositeVisualRotation(pr, br);
    return {
        originX,
        originY,
        cellsize,
        width,
        height,
        panelRotate: pr,
        boardRotate: br,
        seatRotate,
        cellCenters: sampleSquareCellCenters(draw, width, height),
    };
};
