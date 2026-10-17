import type { Element, Svg } from "@svgdotjs/svg.js";
import type { APRenderRep } from "../schemas/schema.js";

export type SquareClickMeta = {
    originX: number;
    originY: number;
    cellsize: number;
    width: number;
    height: number;
    seatRotate: number;
};

/** Read grid origin and cell size from a freshly rendered square board on `draw`. */
export const captureSquareClickMeta = (
    draw: Svg,
    render: APRenderRep,
    seatRotate: number,
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
    return { originX, originY, cellsize, width, height, seatRotate };
};
