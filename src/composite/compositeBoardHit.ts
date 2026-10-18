import type { G, Svg } from "@svgdotjs/svg.js";
import { rotatePoint } from "../common/plotting.js";
import type { APRenderComposite } from "../schemas/composite.js";
import type { KeyAreaClickMeta } from "./captureKeyAreaClickMeta.js";
import type { SquareClickMeta } from "./captureSquareClickMeta.js";
import { normalizeDegrees } from "./compositePanelRotation.js";
import type { PanelPlacement } from "./layout.js";
import { panelIdPrefix } from "./importPanel.js";

const isDomElement = (target: EventTarget | null): target is Element =>
    target !== null && typeof target === "object" && "nodeType" in target && (target as Element).nodeType === 1;

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

const domElementId = (el: Element): string => el.getAttribute("id") ?? "";

const pieceIdFromTarget = (panelId: string, target: EventTarget | null): string | undefined => {
    if (!isDomElement(target)) {
        return undefined;
    }
    const prefix = panelIdPrefix(panelId);
    let el: Element | null = target;
    while (el !== null) {
        const id = domElementId(el);
        if (id.length > 0 && id.startsWith(prefix)) {
            const local = id.slice(prefix.length);
            if (local.length > 0 && local !== "board" && !local.startsWith("tile-")) {
                return local;
            }
        }
        const href = el.getAttributeNS("http://www.w3.org/1999/xlink", "href")
            ?? el.getAttribute("href");
        if (href !== null && href.startsWith(`#${prefix}`)) {
            return href.slice(prefix.length + 1);
        }
        const parent: Element | null = el.parentElement;
        el = parent !== null && isDomElement(parent) ? parent : null;
    }
    return undefined;
};

const cellFromPoint = (
    panelRoot: G,
    meta: SquareClickMeta,
    clientX: number,
    clientY: number,
): { row: number; col: number } | undefined => {
    const centre = {
        x: meta.originX + ((meta.width - 1) * meta.cellsize) / 2,
        y: meta.originY + ((meta.height - 1) * meta.cellsize) / 2,
    };
    const click = panelRoot.point(clientX, clientY);
    let px = click.x;
    let py = click.y;
    const boardVisual = normalizeDegrees(meta.boardRotate);
    const panelVisual = normalizeDegrees(meta.panelRotate);
    if (boardVisual !== 0) {
        const unrot = rotatePoint({ x: px, y: py }, boardVisual * -1, centre);
        px = unrot.x;
        py = unrot.y;
    }
    if (panelVisual !== 0) {
        const unrot = rotatePoint({ x: px, y: py }, panelVisual * -1, centre);
        px = unrot.x;
        py = unrot.y;
    }
    const half = meta.cellsize / 2;
    let best: { row: number; col: number } | undefined;
    let bestDist = half * half;
    for (let row = 0; row < meta.height; row++) {
        for (let col = 0; col < meta.width; col++) {
            const centre = meta.cellCenters[`${row},${col}`];
            if (centre === undefined) {
                continue;
            }
            const dx = click.x - centre.x;
            const dy = click.y - centre.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestDist) {
                bestDist = d2;
                best = { row, col };
            }
        }
    }
    if (best !== undefined) {
        return best;
    }
    let col = Math.floor((px - (meta.originX - half)) / meta.cellsize);
    let row = Math.floor((py - (meta.originY - half)) / meta.cellsize);
    if (normalizeDegrees(meta.panelRotate) === 180) {
        col = meta.width - col - 1;
        row = meta.height - row - 1;
    }
    if (col < 0 || col >= meta.width || row < 0 || row >= meta.height) {
        return undefined;
    }
    return { row, col };
};

const keyPieceFromPoint = (
    panelRoot: G,
    keyMeta: KeyAreaClickMeta,
    clientX: number,
    clientY: number,
): string | undefined => {
    const pt = panelRoot.point(clientX, clientY);
    if (
        pt.x < keyMeta.x
        || pt.x > keyMeta.x + keyMeta.width
        || pt.y < keyMeta.y
        || pt.y > keyMeta.y + keyMeta.height
    ) {
        return undefined;
    }
    const numEntries = keyMeta.values.length;
    const btnHeight = keyMeta.height / numEntries;
    const yRelative = pt.y - keyMeta.y;
    const row = Math.floor(yRelative / btnHeight);
    if (row < 0 || row >= numEntries) {
        return undefined;
    }
    return keyMeta.values[row];
};

export type CompositeBoardHit = {
    panelId: string;
    row: number;
    col: number;
    piece: string;
};

/** Resolve panel id, cell, and piece from a pointer event target on a composite SVG. */
export const resolveCompositeBoardHit = (
    draw: Svg,
    json: APRenderComposite,
    placements: PanelPlacement[],
    clickMetaByPanelId: Map<string, SquareClickMeta>,
    keyMetaByPanelId: Map<string, KeyAreaClickMeta>,
    target: EventTarget | null,
    clientX: number,
    clientY: number,
): CompositeBoardHit | undefined => {
    if (!isDomElement(target)) {
        return undefined;
    }
    const panelHost = target.closest("[data-panel-id]");
    if (panelHost === null) {
        return undefined;
    }
    const panelId = panelHost.getAttribute("data-panel-id");
    if (panelId === null || panelId.length === 0) {
        return undefined;
    }
    const panel = json.panels.find((p) => p.id === panelId);
    const meta = clickMetaByPanelId.get(panelId);
    const keyMeta = keyMetaByPanelId.get(panelId);
    const placement = placements.find((p) => p.panel.id === panelId);
    if (panel === undefined || placement === undefined) {
        return undefined;
    }
    if (meta === undefined && keyMeta === undefined) {
        return undefined;
    }

    const pieceFromDom = pieceIdFromTarget(panelId, target);
    const panelRoot = draw.findOne(`#panel-${panelId}`) as G | null;
    if (panelRoot === null) {
        return undefined;
    }

    if (keyMeta !== undefined) {
        const keyPiece = keyPieceFromPoint(panelRoot, keyMeta, clientX, clientY);
        if (keyPiece !== undefined) {
            return { panelId, row: -1, col: -1, piece: keyPiece };
        }
    }

    if (meta === undefined) {
        return undefined;
    }

    const cell = cellFromPoint(panelRoot, meta, clientX, clientY);
    if (cell === undefined) {
        return undefined;
    }

    let piece = pieceFromDom ?? "";
    if (piece.length === 0 && typeof panel.render.pieces === "string") {
        piece = pieceCharAt(panel.render.pieces, cell.row, cell.col);
    }
    return { panelId, row: cell.row, col: cell.col, piece };
};
