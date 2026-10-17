import { rotatePoint } from "../common/plotting.js";
import type { PanelBBox, PanelPlacement } from "./layout.js";
import type { SquareClickMeta } from "./captureSquareClickMeta.js";

export const boardCentreFromMeta = (meta: SquareClickMeta): { x: number; y: number } => ({
    x: meta.originX + ((meta.width - 1) * meta.cellsize) / 2,
    y: meta.originY + ((meta.height - 1) * meta.cellsize) / 2,
});

/** Cell centre in panel inner SVG coordinates (matches imported panel markup). */
export const logicalCellCenter = (
    meta: SquareClickMeta,
    row: number,
    col: number,
): { x: number; y: number } | undefined => {
    if (row < 0 || row >= meta.height || col < 0 || col >= meta.width) {
        return undefined;
    }
    let c = col;
    let r = row;
    if (meta.seatRotate === 180) {
        c = meta.width - c - 1;
        r = meta.height - r - 1;
    }
    let x = meta.originX + c * meta.cellsize;
    let y = meta.originY + r * meta.cellsize;
    const centre = boardCentreFromMeta(meta);
    if (meta.seatRotate === 90 || meta.seatRotate === 270) {
        const p = rotatePoint({ x, y }, meta.seatRotate, centre);
        x = p.x;
        y = p.y;
    }
    return { x, y };
};

export const cellCenterInComposite = (
    meta: SquareClickMeta,
    bbox: PanelBBox,
    placement: PanelPlacement,
    row: number,
    col: number,
): { x: number; y: number } | undefined => {
    const inner = logicalCellCenter(meta, row, col);
    if (inner === undefined) {
        return undefined;
    }
    return {
        x: inner.x - bbox.x + placement.boardX,
        y: inner.y - bbox.y + placement.boardTop,
    };
};
