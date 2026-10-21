import type { APRenderCompositePanel } from "../schemas/composite.js";
import type { APRenderRep } from "../schemas/schema.js";

export const normalizeDegrees = (deg: number): number => {
    let n = deg % 360;
    if (n < 0) {
        n += 360;
    }
    return n;
};

/** `board.rotate` from a panel render rep (0 when absent). */
export const boardRotateFromRender = (render: APRenderRep): number => {
    const board = render.board;
    if (board === null || board === undefined || typeof board !== "object") {
        return 0;
    }
    if ("rotate" in board && board.rotate !== undefined) {
        const r = Number(board.rotate);
        return Number.isFinite(r) ? normalizeDegrees(r) : 0;
    }
    return 0;
};

/**
 * Total rotation for composite cell hit-testing and annotations on a panel.
 * Matches single-board {@link Renderer.getRotation}: `panels[].rotate` + `render.board.rotate`.
 */
export const compositePanelClickRotation = (panel: APRenderCompositePanel): number =>
    normalizeDegrees((panel.rotate ?? 0) + boardRotateFromRender(panel.render));

export const compositeVisualRotation = (panelRotate: number, boardRotate: number): number =>
    normalizeDegrees(panelRotate + boardRotate);
