import { G as SVGG, Svg, Box as SVGBox } from "@svgdotjs/svg.js";
import { Poly } from "../grids/_base";
import { BoardReference } from "../schemas/schema";
import { getReferenceAsset } from "./registry";
import type { AnnulusAnchor, PlayfieldMetrics, ReferencePlacement, ReferenceSide, ResolvedReferenceArt, SidebarAnchor } from "./types";

export type { ReferenceSide } from "./types";

function collectPolyPoints(poly: Poly): { x: number; y: number }[] {
    if (poly.type === "circle") {
        return [
            { x: poly.cx - poly.r, y: poly.cy - poly.r },
            { x: poly.cx + poly.r, y: poly.cy + poly.r },
        ];
    }
    return poly.points;
}

/**
 * Playfield centre and circumradius from board polygons (matches hex-of-* halo math).
 */
export function playfieldHullFromPolys(
    polys: Poly[][],
    cellsize: number,
): { cx: number; cy: number; hullRadius: number } | null {
    const points: { x: number; y: number }[] = [];
    for (const poly of polys.flat()) {
        points.push(...collectPolyPoints(poly));
    }
    if (points.length === 0) {
        return null;
    }
    const minx = Math.min(...points.map((p) => p.x));
    const maxx = Math.max(...points.map((p) => p.x));
    const miny = Math.min(...points.map((p) => p.y));
    const maxy = Math.max(...points.map((p) => p.y));
    const hullWidth = maxx - minx;
    const hullHeight = maxy - miny;
    return {
        cx: minx + hullWidth / 2,
        cy: miny + hullHeight / 2,
        hullRadius: (Math.max(hullHeight, hullWidth) + cellsize / 2) / 2,
    };
}

export function defaultAnnulusAnchor(viewBox: { w: number; h: number }): AnnulusAnchor {
    const r = Math.min(viewBox.w, viewBox.h) / 4;
    return {
        layout: "annulus",
        innerRadius: r,
        center: [viewBox.w / 2, viewBox.h / 2],
    };
}

export function defaultSidebarAnchor(side: ReferenceSide): SidebarAnchor {
    const attach: Record<ReferenceSide, ReferenceSide> = {
        left: "right",
        right: "left",
        top: "bottom",
        bottom: "top",
    };
    return {
        layout: "sidebar",
        attach: attach[side],
    };
}

export function resolveReferenceSides(ref: BoardReference): ReferenceSide[] {
    if (ref.sides !== undefined && ref.sides.length > 0) {
        return ref.sides;
    }
    const position = ref.position ?? "left";
    return [position];
}

export function peripheralReferenceSides(ref: BoardReference): ReferenceSide[] {
    return resolveReferenceSides(ref).filter((side) => side !== "bottom");
}

export function resolveSourceForSide(ref: BoardReference, side: ReferenceSide): string {
    const allSides = resolveReferenceSides(ref);
    const sideIndex = allSides.indexOf(side);
    if (sideIndex < 0) {
        throw new Error(`board.reference does not include side "${side}".`);
    }
    if (typeof ref.source === "string") {
        return ref.source;
    }
    if (ref.source.length !== allSides.length) {
        throw new Error(
            `board.reference.source has ${ref.source.length} entries but sides has ${allSides.length}.`,
        );
    }
    return ref.source[sideIndex];
}

export function referenceSourceString(ref: BoardReference): string {
    if (typeof ref.source === "string") {
        return ref.source;
    }
    if (ref.source.length !== 1) {
        throw new Error("Annulus layout requires a single reference source.");
    }
    return ref.source[0];
}

export type SidebarPlacementMetrics = {
    x: number;
    y: number;
    width: number;
    height: number;
    y2?: number;
};

export function playfieldExtentFromPolys(
    polys: Poly[][],
): { x: number; y: number; width: number; height: number } | null {
    const points: { x: number; y: number }[] = [];
    for (const poly of polys.flat()) {
        points.push(...collectPolyPoints(poly));
    }
    if (points.length === 0) {
        return null;
    }
    const minx = Math.min(...points.map((p) => p.x));
    const maxx = Math.max(...points.map((p) => p.x));
    const miny = Math.min(...points.map((p) => p.y));
    const maxy = Math.max(...points.map((p) => p.y));
    return {
        x: minx,
        y: miny,
        width: maxx - minx,
        height: maxy - miny,
    };
}

export function computePlayfieldMetrics(
    rootSvg: Svg,
    cellsize: number,
    polys?: Poly[][],
): PlayfieldMetrics {
    const tableau = rootSvg.findOne("#board-tableau") as SVGG | null;
    const board = (tableau !== null ? tableau.findOne("#board") : null) as SVGG | null
        ?? (rootSvg.findOne("#board") as SVGG | null);
    if (board === null) {
        throw new Error("Could not find #board when placing board reference.");
    }

    if (polys !== undefined && polys.length > 0) {
        const hull = playfieldHullFromPolys(polys, cellsize);
        const extent = playfieldExtentFromPolys(polys);
        if (hull !== null && extent !== null) {
            return {
                ...extent,
                cx: hull.cx,
                cy: hull.cy,
                hullRadius: hull.hullRadius,
            };
        }
    }

    const playfield = (board.findOne("#gridlines")
        ?? board.findOne("#tiles")
        ?? board.findOne("#hexes")
        ?? board) as SVGG;
    const bbox = playfield.rbox(board);

    return {
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height,
        cx: bbox.cx,
        cy: bbox.cy,
        hullRadius: Math.max(bbox.width, bbox.height) / 2,
    };
}

export function getRegistryReferenceArt(source: string): { svgContent: string; meta: ResolvedReferenceArt } {
    const asset = getReferenceAsset(source);
    if (asset === undefined) {
        throw new Error(`Unknown reference source "${source}". Use a registry id or legend key.`);
    }
    return {
        svgContent: asset.svg,
        meta: {
            viewBox: asset.viewBox,
            anchor: asset.anchor,
            fromLegend: false,
        },
    };
}

export function ensureTableau(rootSvg: Svg): SVGG {
    let tableau = rootSvg.findOne("#board-tableau") as SVGG | null;
    if (tableau !== null) {
        return tableau;
    }
    const board = rootSvg.findOne("#board") as SVGG | null;
    if (board === null) {
        throw new Error("Could not find #board when creating board tableau.");
    }
    tableau = rootSvg.group().id("board-tableau");
    board.before(tableau);
    tableau.add(board);
    return tableau;
}

export function computeSidebarPlacement(
    meta: ResolvedReferenceArt,
    metrics: SidebarPlacementMetrics,
    ref: BoardReference,
    cellsize: number,
    side: ReferenceSide,
): ReferencePlacement {
    const gap = (ref.gap ?? 0.5) * cellsize;
    const { w: vw, h: vh } = meta.viewBox;
    if (side === "left" || side === "right") {
        const scale = metrics.height / vh;
        const width = vw * scale;
        const height = vh * scale;
        const y = metrics.y + (metrics.height - height) / 2;
        const x = side === "left"
            ? metrics.x - gap - width
            : metrics.x + metrics.width + gap;
        return { x, y, width, height };
    }
    const scale = metrics.width / vw;
    const width = vw * scale;
    const height = vh * scale;
    const x = metrics.x + (metrics.width - width) / 2;
    if (side === "top") {
        return { x, y: metrics.y - gap - height, width, height };
    }
    const bottomEdge = metrics.y2 ?? (metrics.y + metrics.height);
    return { x, y: bottomEdge + gap, width, height };
}

export function computeAnnulusPlacement(
    meta: ResolvedReferenceArt,
    metrics: PlayfieldMetrics,
    ref: BoardReference,
    cellsize: number,
): ReferencePlacement {
    const gap = (ref.gap ?? 0.5) * cellsize;
    const anchor = meta.anchor as AnnulusAnchor;
    const { x: vx, y: vy, w: vw, h: vh } = meta.viewBox;
    const targetInner = metrics.hullRadius + gap;
    const scale = targetInner / anchor.innerRadius;
    const width = vw * scale;
    const height = vh * scale;
    const [ax, ay] = anchor.center;
    const x = metrics.cx - (ax - vx) * (width / vw);
    const y = metrics.cy - (ay - vy) * (height / vh);
    return { x, y, width, height };
}

export function sidebarLayoutMetricsInParent(
    parent: SVGG,
    board: SVGG,
    refRoot: SVGG | null,
): SidebarPlacementMetrics {
    const boardBox = board.rbox(parent);
    if (refRoot === null || refRoot.children().length === 0) {
        return {
            x: boardBox.x,
            y: boardBox.y,
            width: boardBox.width,
            height: boardBox.height,
            y2: boardBox.y2,
        };
    }
    const refBox = refRoot.rbox(parent);
    const x = Math.min(boardBox.x, refBox.x);
    const y = Math.min(boardBox.y, refBox.y);
    const x2 = Math.max(boardBox.x2, refBox.x2);
    const y2 = Math.max(boardBox.y2, refBox.y2);
    return { x, y, width: x2 - x, height: y2 - y, y2 };
}

export function registryReferenceDefId(source: string): string {
    return `_board-ref-${source}`;
}

export function referenceInnerMarkup(svg: string): string {
    const match = svg.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/i);
    return match !== null ? match[1] : svg;
}

export function unionBoardReferenceBox(rootSvg: Svg, layoutBox: SVGBox): SVGBox {
    const board = rootSvg.findOne("#board") as SVGG | null;
    const tableau = rootSvg.findOne("#board-tableau") as SVGG | null;
    const refParent = tableau ?? board;
    const ref = refParent?.findOne("#board-reference") as SVGG | null;
    if (ref === null) {
        return layoutBox;
    }
    const refBox = ref.rbox(rootSvg);
    const x = Math.min(layoutBox.x, refBox.x);
    const y = Math.min(layoutBox.y, refBox.y);
    const x2 = Math.max(layoutBox.x2, refBox.x2);
    const y2 = Math.max(layoutBox.y2, refBox.y2);
    return new SVGBox(x, y, x2 - x, y2 - y);
}

/** CSS selectors for a reference style slot id (supports bulk ids like `species` and `glyphs`). */
export function referenceStyleSelectors(slotId: string): { fill: string; stroke: string } {
    switch (slotId) {
        case "species":
        case "hexes":
            return {
                fill: "[data-ref-fill^=\"species-\"]",
                stroke: "[data-ref-stroke^=\"species-\"]",
            };
        case "glyphs":
        case "dots":
            return {
                fill: "[data-ref-fill^=\"glyph-\"]",
                stroke: "[data-ref-fill^=\"glyph-\"]",
            };
        case "text":
            return {
                fill: "[data-ref-fill=\"labels\"]",
                stroke: "[data-ref-stroke=\"labels\"]",
            };
        default:
            return {
                fill: `[data-ref-fill="${slotId}"]`,
                stroke: `[data-ref-stroke="${slotId}"]`,
            };
    }
}
