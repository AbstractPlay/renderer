import type { G, Svg } from "@svgdotjs/svg.js";
import type { APRenderComposite } from "../schemas/composite.js";
import type { SquareClickMeta } from "./captureSquareClickMeta.js";
import { resolveCompositeBoardHit } from "./compositeBoardHit.js";
import type { PanelPlacement } from "./layout.js";

/** @internal Used to dedupe hover callbacks; exported for unit tests. */
export const hoverCellKey = (panelId: string, row: number, col: number): string =>
    `${panelId}:${row},${col}`;

export const attachCompositeBoardHover = (
    draw: Svg,
    compositeGroup: G,
    json: APRenderComposite,
    placements: PanelPlacement[],
    clickMetaByPanelId: Map<string, SquareClickMeta>,
    boardHover: (panelId: string, row: number, col: number, piece: string) => void,
): void => {
    let lastCellKey: string | undefined;

    const onMove = (e: Event): void => {
        const me = e as MouseEvent;
        const hit = resolveCompositeBoardHit(
            draw,
            json,
            placements,
            clickMetaByPanelId,
            me.target,
            me.clientX,
            me.clientY,
        );
        if (hit === undefined) {
            lastCellKey = undefined;
            return;
        }
        const key = hoverCellKey(hit.panelId, hit.row, hit.col);
        if (key === lastCellKey) {
            return;
        }
        lastCellKey = key;
        boardHover(hit.panelId, hit.row, hit.col, hit.piece);
    };
    compositeGroup.on("pointermove", onMove);
    compositeGroup.on("mousemove", onMove);
};
