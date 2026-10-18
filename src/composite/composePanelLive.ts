import type { G, Svg } from "@svgdotjs/svg.js";
import { renderRep } from "../renderRep.js";
import type { IRenderCompositeOptions, IRenderOptions } from "../renderOptions.js";
import type { APRenderCompositePanel } from "../schemas/composite.js";
import type { ValidateFunction } from "ajv";
import { panelIdPrefix } from "./importPanel.js";
import { prefixPanelDraw } from "./prefixPanelDraw.js";

/** Clear the scratch SVG between panel renders. Do not call `scratch.off()` — it removes listeners on every node in the tree in svg.js and breaks earlier panels' `#board` click handlers. */
export const clearPanelScratch = (scratch: Svg): void => {
    for (const child of [...scratch.children()]) {
        child.remove();
    }
    scratch.viewbox(0, 0, 0, 0);
};

const adoptRootChildrenInto = (root: Svg, panelGroup: G): void => {
    for (const child of [...root.children()]) {
        child.remove();
        panelGroup.add(child);
    }
};

export const composePanelRenderOpts = (
    opts: IRenderCompositeOptions,
    panelId: string,
): IRenderOptions => {
    const compositeBoardClick = opts.boardClick;
    const compositeBoardHover = opts.boardHover;
    const out = { ...opts } as IRenderOptions;
    delete out.target;
    delete out.divid;
    delete out.divelem;
    delete out.boardClick;
    delete out.boardHover;
    if (compositeBoardClick !== undefined) {
        out.boardClick = (row: number, col: number, piece: string) => {
            compositeBoardClick(panelId, row, col, piece);
        };
    }
    if (compositeBoardHover !== undefined) {
        out.boardHover = (row: number, col: number, piece: string) => {
            compositeBoardHover(panelId, row, col, piece);
        };
    }
    return out;
};

/**
 * Render one panel on the root SVG (must be empty), prefix ids, and move markup under `panelGroup`.
 */
export const composePanelLive = (
    rootDraw: Svg,
    panelGroup: G,
    panel: APRenderCompositePanel,
    opts: IRenderCompositeOptions,
    validateRep: ValidateFunction,
): void => {
    clearPanelScratch(rootDraw);
    renderRep(panel.render, {
        ...composePanelRenderOpts(opts, panel.id),
        target: rootDraw,
        rotate: panel.rotate ?? 0,
        showAnnotations: opts.showAnnotations,
    }, validateRep);
    prefixPanelDraw(rootDraw, panelIdPrefix(panel.id));
    adoptRootChildrenInto(rootDraw, panelGroup);
};
