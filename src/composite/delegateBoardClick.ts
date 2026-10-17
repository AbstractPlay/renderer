import type { G, Svg } from "@svgdotjs/svg.js";
import { rotatePoint } from "../common/plotting.js";
import type { APRenderComposite } from "../schemas/composite.js";
import type { PanelPlacement } from "./layout.js";
import type { SquareClickMeta } from "./captureSquareClickMeta.js";
import { panelIdPrefix } from "./importPanel.js";

const pieceCharAt = (pieces: string, row: number, col: number): string => {
    const rows = pieces.trim().split("\n");
    const line = rows[row];
    if (line === undefined) {
        return "";
    }
    const ch = line[col];
    if (ch === undefined || ch === "-" || ch === ".") {
        return "";
    }
    return ch;
};

const pieceIdFromTarget = (panelId: string, target: EventTarget | null): string | undefined => {
    if (target === null || !(target instanceof Element)) {
        return undefined;
    }
    const prefix = panelIdPrefix(panelId);
    let el: Element | null = target;
    while (el !== null) {
        if (el.id.length > 0 && el.id.startsWith(prefix)) {
            const local = el.id.slice(prefix.length);
            if (local.length > 0 && local !== "board" && !local.startsWith("tile-")) {
                return local;
            }
        }
        const href = el.getAttributeNS("http://www.w3.org/1999/xlink", "href")
            ?? el.getAttribute("href");
        if (href !== null && href.startsWith(`#${prefix}`)) {
            return href.slice(prefix.length + 1);
        }
        el = el.parentElement;
    }
    return undefined;
};

const cellFromPoint = (
    panelRoot: G,
    meta: SquareClickMeta,
    clientX: number,
    clientY: number,
): { row: number; col: number } | undefined => {
    const rotation = meta.seatRotate;
    const centre = {
        x: meta.originX + ((meta.width - 1) * meta.cellsize) / 2,
        y: meta.originY + ((meta.height - 1) * meta.cellsize) / 2,
    };
    const point = rotatePoint(panelRoot.point(clientX, clientY), rotation * -1, centre);
    const half = meta.cellsize / 2;
    let col = Math.floor((point.x - (meta.originX - half)) / meta.cellsize);
    let row = Math.floor((point.y - (meta.originY - half)) / meta.cellsize);
    if (meta.seatRotate === 180) {
        col = meta.width - col - 1;
        row = meta.height - row - 1;
    }
    if (col < 0 || col >= meta.width || row < 0 || row >= meta.height) {
        return undefined;
    }
    return { row, col };
};

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
        const target = me.target;
        if (target === null || !(target instanceof Element)) {
            return;
        }
        const panelHost = target.closest("[data-panel-id]");
        if (panelHost === null) {
            return;
        }
        const panelId = panelHost.getAttribute("data-panel-id");
        if (panelId === null || panelId.length === 0) {
            return;
        }
        const panel = json.panels.find((p) => p.id === panelId);
        const meta = clickMetaByPanelId.get(panelId);
        const placement = placements.find((p) => p.panel.id === panelId);
        if (panel === undefined || meta === undefined || placement === undefined) {
            return;
        }

        const pieceFromDom = pieceIdFromTarget(panelId, target);
        const panelRoot = draw.findOne(`#panel-${panelId}`) as G | null;
        if (panelRoot === null) {
            return;
        }
        const cell = cellFromPoint(panelRoot, meta, me.clientX, me.clientY);
        if (cell === undefined) {
            return;
        }

        let piece = pieceFromDom ?? "";
        if (piece.length === 0 && typeof panel.render.pieces === "string") {
            piece = pieceCharAt(panel.render.pieces, cell.row, cell.col);
        }
        boardClick(panelId, cell.row, cell.col, piece);
        me.stopPropagation();
    });
};
