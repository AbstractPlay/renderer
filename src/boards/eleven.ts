import type { G as SVGG, StrokeData } from "@svgdotjs/svg.js";
import { ELEVEN_BOARD_TOPOLOGY } from "../common/eleven/index.js";
import type { ElevenMarker } from "../common/eleven/types.js";
import { GridPoints, IPolyCircle, IPolyPolygon } from "../grids/index.js";
import { RendererBase } from "../renderers/_base.js";
import { BoardReturn, createGridlineLayers } from "./index.js";
import {
    elevenConnectionPathBatch,
    sortUndirectedEdges,
} from "./eleven/connections.js";
import {
    ELEVEN_DEFAULT_CONNECTION_BOW,
    elevenPieceCellsize,
    resolveElevenBoardOptions,
} from "./eleven/resolveOptions.js";

/** Quarter-circle at each corner, bowing toward the pitch centre (inside the field). */
const cornerArcPath = (corner: string, cx: number, cy: number, r: number): string => {
    switch (corner) {
        case "nw":
            return `M ${cx} ${cy + r} A ${r} ${r} 0 0 0 ${cx + r} ${cy}`;
        case "ne":
            return `M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx} ${cy + r}`;
        case "sw":
            return `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
        case "se":
            return `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy - r}`;
        default:
            throw new Error(`unknown eleven corner arc ${corner}`);
    }
};

const drawPitchMarker = (
    layer: SVGG,
    marker: ElevenMarker,
    markingStroke: StrokeData,
    centerCircleStroke: StrokeData,
): void => {
    if (marker.kind === "midline") {
        layer.line(marker.x1, marker.y1, marker.x2, marker.y2).stroke(markingStroke).attr({ "pointer-events": "none" });
    } else if (marker.kind === "centerCircle") {
        layer
            .circle(marker.r * 2)
            .center(marker.cx, marker.cy)
            .fill("none")
            .stroke(centerCircleStroke)
            .attr({ "pointer-events": "none" });
    } else if (marker.kind === "centerSpot" || marker.kind === "penaltyMark") {
        // Spots coincide with Felder centres (C, penalty-line spaces); omit filled dots.
    } else if (marker.kind === "penaltyArea" || marker.kind === "goalArea") {
        const d =
            marker.points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ") + " Z";
        layer.path(d).fill("none").stroke(markingStroke).attr({ "pointer-events": "none" });
        if (marker.bump && marker.bump.length >= 2) {
            const bumpD = marker.bump.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
            layer.path(bumpD).fill("none").stroke(markingStroke).attr({ "pointer-events": "none" });
        }
    } else if (marker.kind === "cornerArc") {
        layer.path(cornerArcPath(marker.corner, marker.cx, marker.cy, marker.r)).fill("none").stroke(markingStroke).attr({ "pointer-events": "none" });
    }
};

export const eleven = (ctx: RendererBase): BoardReturn => {
    if (ctx.json === undefined || ctx.rootSvg === undefined) {
        throw new Error("Object in an invalid state!");
    }
    if (
        ctx.json.board === null ||
        !("style" in ctx.json.board) ||
        ctx.json.board.style !== "eleven"
    ) {
        throw new Error("eleven board renderer requires style eleven");
    }

    const topology = ELEVEN_BOARD_TOPOLOGY;
    const opts = resolveElevenBoardOptions(ctx);

    const radii = topology.spaces.map((s) => s.r).sort((a, b) => a - b);
    const medianRingDiameter = radii[Math.floor(radii.length / 2)]! * 2;
    ctx.cellsize = elevenPieceCellsize(medianRingDiameter, opts.pieceScale);

    const grid: GridPoints = [
        topology.spaces.map((s) => ({ x: s.x, y: s.y })),
    ];

    const polys: IPolyCircle[][] = [
        topology.spaces.map((s) => ({
            type: "circle",
            cx: s.x,
            cy: s.y,
            r: s.r,
        })),
    ];

    const board = ctx.rootSvg.group().id("board");
    const layers = createGridlineLayers(board);
    const gridlines = layers.root;

    const lineStroke: StrokeData = {
        color: opts.strokeColour,
        width: opts.strokeWeight,
        opacity: opts.strokeOpacity,
        linecap: "round",
        linejoin: "round",
    };
    const markingStroke: StrokeData = {
        color: opts.markingColour,
        width: opts.markingWeight,
        opacity: 1,
        linecap: "round",
        linejoin: "round",
    };
    const centerCircleStroke: StrokeData = {
        ...markingStroke,
        width: opts.centerCircleWeight,
    };

    const { originX, originY, cellW, cellH, cols, rows } = topology.grassGrid;
    if (!opts.flatGrass) {
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = originX + col * cellW;
                const y = originY + row * cellH;
                const fill = (row + col) % 2 === 0 ? opts.grassLight : opts.grassDark;
                layers.fill
                    .rect(cellW, cellH)
                    .move(x, y)
                    .fill(fill)
                    .stroke({ width: 0 })
                    .attr({ "pointer-events": "none" });
            }
        }
    }

    ctx.markBoard({ svgGroup: gridlines, preGridLines: true, grid, polys });

    const pitchLayer = layers.below;
    for (const marker of topology.markers) {
        drawPitchMarker(pitchLayer, marker, markingStroke, centerCircleStroke);
    }

    const movePaths = elevenConnectionPathBatch(
        topology,
        ELEVEN_DEFAULT_CONNECTION_BOW,
        topology.moveEdges,
        "move",
    );
    for (const d of movePaths) {
        layers.strokes.path(d).fill("none").stroke(lineStroke).attr({ "pointer-events": "none" });
    }

    const shootEdges = sortUndirectedEdges(topology.shootEdges);
    const shootPaths = elevenConnectionPathBatch(
        topology,
        ELEVEN_DEFAULT_CONNECTION_BOW,
        shootEdges,
        "shoot",
    );
    const shootDash = opts.shootDashed
        ? `${opts.shootDash[0] * opts.strokeWeight} ${opts.shootDash[1] * opts.strokeWeight}`
        : undefined;
    for (const d of shootPaths) {
        layers.strokes
            .path(d)
            .fill("none")
            .stroke({ ...lineStroke, dasharray: shootDash })
            .attr({ "pointer-events": "none" });
    }

    for (let i = 0; i < topology.spaces.length; i++) {
        const s = topology.spaces[i];
        const ring = layers.strokes
            .circle(s.r * 2)
            .center(s.x, s.y)
            .fill("#ffffff")
            .stroke(lineStroke);
        if (ctx.options.boardClick !== undefined) {
            ring.click(() => ctx.options.boardClick!(0, i, ""));
        }
    }

    ctx.markBoard({ svgGroup: gridlines, preGridLines: false, grid, polys });

    const pad = topology.padding ?? 8;
    const maxX = originX + cols * cellW + pad;
    const maxY = originY + rows * cellH + pad;
    const boardFill: IPolyPolygon = {
        type: "poly",
        points: [
            { x: originX - pad, y: originY - pad },
            { x: maxX, y: originY - pad },
            { x: maxX, y: maxY },
            { x: originX - pad, y: maxY },
        ],
    };

    return { grid, polys, boardFill };
};
