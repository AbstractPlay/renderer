import { rotatePoint } from "../common/plotting.js";
import type { PanelBBox, PanelPlacement } from "./layout.js";
import type { SquareClickMeta } from "./captureSquareClickMeta.js";
import { normalizeDegrees } from "./compositePanelRotation.js";

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
    const sampled = meta.cellCenters[`${row},${col}`];
    if (sampled !== undefined) {
        return { x: sampled.x, y: sampled.y };
    }
    let c = col;
    let r = row;
    // Match squares `boardClick`: row/col flip only for opts.rotate / panels[].rotate, not board.rotate.
    if (normalizeDegrees(meta.panelRotate) === 180) {
        c = meta.width - c - 1;
        r = meta.height - r - 1;
    }
    let x = meta.originX + c * meta.cellsize;
    let y = meta.originY + r * meta.cellsize;
    const centre = boardCentreFromMeta(meta);
    const boardVisual = normalizeDegrees(meta.boardRotate);
    if (boardVisual === 90 || boardVisual === 270) {
        const p = rotatePoint({ x, y }, boardVisual, centre);
        x = p.x;
        y = p.y;
    } else if (boardVisual === 180) {
        const p = rotatePoint({ x, y }, 180, centre);
        x = p.x;
        y = p.y;
    }
    const panelVisual = normalizeDegrees(meta.panelRotate);
    if (panelVisual === 90 || panelVisual === 270) {
        const p = rotatePoint({ x, y }, panelVisual, centre);
        x = p.x;
        y = p.y;
    } else if (panelVisual === 180) {
        const p = rotatePoint({ x, y }, 180, centre);
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
