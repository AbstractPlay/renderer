import type { G, Svg } from "@svgdotjs/svg.js";
import type { APRenderComposite } from "../schemas/composite.js";
import type { SquareClickMeta } from "./captureSquareClickMeta.js";
import { resolveCompositeBoardHit } from "./compositeBoardHit.js";
import type { PanelPlacement } from "./layout.js";

export const attachCompositeBoardClick = (
    draw: Svg,
    compositeGroup: G,
    json: APRenderComposite,
    placements: PanelPlacement[],
    clickMetaByPanelId: Map<string, SquareClickMeta>,
    boardClick: (panelId: string, row: number, col: number, piece: string) => void,
): void => {
    compositeGroup.on("click", (e: Event) => {
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
            return;
        }
        boardClick(hit.panelId, hit.row, hit.col, hit.piece);
        me.stopPropagation();
    });
};
