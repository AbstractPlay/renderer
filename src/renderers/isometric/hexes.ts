import { Matrix } from "transformation-matrix-js";
import { centroid } from "../../common/plotting";
import { FillData, StrokeData, Svg, Polygon as SVGPoly, G as SVGG } from "@svgdotjs/svg.js";
import { IPoint } from "../../grids";
import { CompassDirection, edges2corners } from "../../boards";
import { defineHex, Orientation } from "honeycomb-grid";
import { buildIsoProjectionMatrix, ISO_PROJECTION_PRESETS, IsoProjectionParams, isoProjectionCacheSuffix, projectOblique, usesLayeredCellDraw } from "./projection";
import { CubeFaceFills } from "./cubes";
import { isoShadeProjectedFace } from "./shading";
import { applyIsoAffineMatrix } from "./faceGlyphFit";

export type Hex = {
    transform: Matrix;
    xMin: number;
    yMin: number;
    width: number;
    height: number;
    widthOrig: number;
    heightOrig: number;
    widthPost: number;
    heightPost: number;
    cx: number;
    cy: number;
    cxTop: number;
    cyTop: number;
    cxBot: number;
    cyBot: number;
    dy: number;
    corners: IPoint[];
    tCorners: IPoint[];
    tBottomCorners: IPoint[];
};

export const genHex = (
    topSize: number,
    sideHeight: number,
    orientation: Orientation,
    params: IsoProjectionParams = ISO_PROJECTION_PRESETS.iso,
): Hex => {
    const tFinal = buildIsoProjectionMatrix(params);
    const p = (x: number, y: number, z: number): IPoint => projectOblique(x, y, z, params);

    type Vertex = [number, number];
    const pHex = defineHex({ orientation, dimensions: topSize });
    const hex = new pHex();

    const xMinOrig = Math.min(...hex.corners.map((pt) => pt.x));
    const xMaxOrig = Math.max(...hex.corners.map((pt) => pt.x));
    const yMinOrig = Math.min(...hex.corners.map((pt) => pt.y));
    const yMaxOrig = Math.max(...hex.corners.map((pt) => pt.y));
    const widthOrig = xMaxOrig - xMinOrig;
    const heightOrig = yMaxOrig - yMinOrig;

    const ptsTop: Vertex[] = hex.corners.map(({ x, y }) => [x, y]);
    const ptsTransformed: IPoint[] = [];
    for (const pt of ptsTop) {
        ptsTransformed.push(p(...pt, 0));
    }
    const tCorners = ptsTransformed.map((pt) => ({ ...pt }));
    const tBottomCorners = ptsTop.map(([x, y]) => p(x, y, sideHeight));
    const xMinPost = Math.min(...tCorners.map((pt) => pt.x));
    const xMaxPost = Math.max(...tCorners.map((pt) => pt.x));
    const yMinPost = Math.min(...tCorners.map((pt) => pt.y));
    const yMaxPost = Math.max(...tCorners.map((pt) => pt.y));
    const widthPost = xMaxPost - xMinPost;
    const heightPost = yMaxPost - yMinPost;

    ptsTransformed.push(...tBottomCorners);

    const xMin = Math.min(...ptsTransformed.map((pt) => pt.x));
    const xMax = Math.max(...ptsTransformed.map((pt) => pt.x));
    const yMin = Math.min(...ptsTransformed.map((pt) => pt.y));
    const yMax = Math.max(...ptsTransformed.map((pt) => pt.y));
    const width = xMax - xMin;
    const height = yMax - yMin;

    const cx = xMin + (width / 2);
    const cy = yMin + (height / 2);
    const cTop = centroid(tCorners)!;
    const cWorld = centroid(hex.corners)!;
    const contact = p(cWorld.x, cWorld.y, sideHeight);
    return {
        transform: tFinal,
        xMin,
        yMin,
        width,
        height,
        widthOrig,
        heightOrig,
        widthPost,
        heightPost,
        cx,
        cy,
        cxTop: cTop.x,
        cyTop: cTop.y,
        cxBot: contact.x,
        cyBot: contact.y,
        dy: Math.abs(cy - cTop.y),
        corners: hex.corners,
        tCorners,
        tBottomCorners,
    };
};

const sideFaceFill = (
    baseHex: string,
    hex: Hex,
    i: number,
    faceFills?: CubeFaceFills,
): FillData => {
    if (faceFills === undefined) {
        return { color: baseHex };
    }
    const a = hex.tCorners[i];
    const b = hex.tCorners[(i + 1) % hex.tCorners.length];
    const centroidTop: IPoint = { x: hex.cxTop, y: hex.cyTop };
    const shaded = isoShadeProjectedFace(baseHex, centroidTop, a, b);
    return { color: shaded };
};

const strokeLine = (
    parent: Svg,
    a: IPoint,
    b: IPoint,
    stroke: StrokeData,
): void => {
    parent.line(a.x, a.y, b.x, b.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
};

export const generateHexes = (opts: {
    rootSvg: Svg;
    heights: number[];
    orientation: Orientation;
    stroke: StrokeData;
    fill: FillData;
    faceFills?: CubeFaceFills;
    idSymbol?: string;
    projection?: IsoProjectionParams;
    drawnEdges?: CompassDirection[];
}): void => {
    const { rootSvg, heights, stroke, fill, orientation, faceFills } = opts;
    const projection = opts.projection ?? ISO_PROJECTION_PRESETS.iso;
    const projectionSuffix = isoProjectionCacheSuffix(projection);
    const tSize = 100;
    const topFill = faceFills?.top ?? fill;
    const baseHex = typeof (faceFills?.left ?? fill).color === "string"
        ? (faceFills?.left ?? fill).color as string
        : "#000";
    const edgeDirs = edges2corners.get(orientation)!;
    const allEdgeDirs = edgeDirs.map((edge) => edge.dir);
    const drawnEdges = opts.drawnEdges ?? allEdgeDirs;
    const drawnSet = new Set(drawnEdges);
    const isLintel = opts.drawnEdges !== undefined;
    const isSpacer = isLintel && drawnEdges.length === 0;
    const edgeDrawn = (edgeIdx: number): boolean => drawnSet.has(edgeDirs[edgeIdx].dir);
    const edgeIndexForCorners = (c0: number, c1: number): number =>
        edgeDirs.findIndex(
            (edge) =>
                (edge.corners[0] === c0 && edge.corners[1] === c1)
                || (edge.corners[0] === c1 && edge.corners[1] === c0),
        );
    const cornerVerticalDrawn = (corner: number): boolean => {
        for (let edgeIdx = 0; edgeIdx < edgeDirs.length; edgeIdx++) {
            const [c0, c1] = edgeDirs[edgeIdx].corners;
            if ((c0 === corner || c1 === corner) && edgeDrawn(edgeIdx)) {
                return true;
            }
        }
        return false;
    };

    for (const sideHeight of heights) {
        const idTop = tSize.toString().replace(".", "_");
        const idSide = sideHeight.toString().replace(".", "_");
        const hex = genHex(tSize, sideHeight, orientation, projection);
        const dWidth = 0;
        const dHeight = 0;
        const minx = hex.xMin - (dWidth / 2);
        const miny = hex.yMin - (dHeight / 2);
        let idSymbol = `_isoHex_${idSide}`;
        if (opts.idSymbol !== undefined) {
            idSymbol = opts.idSymbol;
        }
        const nested = rootSvg.defs().nested().id(idSymbol)
            .attr("data-width-ratio", hex.width / hex.widthOrig)
            .attr("data-height-ratio", hex.height / hex.heightOrig)
            .attr("data-dy-bottom", Math.abs(miny - hex.cyBot) / hex.height)
            .attr("data-dy-top", Math.abs(miny - hex.cyTop) / hex.height);
        const defs = nested.defs();
        let hexTop: SVGPoly | SVGG | null = null;
        let sourceId = `isoHex${idTop}${projectionSuffix}`;
        if (opts.idSymbol !== undefined) {
            sourceId = `isoHex${idTop}_${opts.idSymbol}${projectionSuffix}`;
        }
        hexTop = defs.findOne("#" + sourceId) as SVGPoly | SVGG | null;
        if (hexTop === null) {
            if (isLintel) {
                const topGroup = defs.group().id(sourceId);
                if (!isSpacer) {
                    topGroup.polygon(hex.corners.map(({ x, y }) => [x, y].join(",")).join(" "))
                        .fill(topFill)
                        .stroke("none");
                    for (let edgeIdx = 0; edgeIdx < edgeDirs.length; edgeIdx++) {
                        if (!edgeDrawn(edgeIdx)) {
                            continue;
                        }
                        const [c0, c1] = edgeDirs[edgeIdx].corners;
                        const a = hex.corners[c0];
                        const b = hex.corners[c1];
                        topGroup.line(a.x, a.y, b.x, b.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
                    }
                }
                hexTop = topGroup;
            } else {
                hexTop = defs.polygon(hex.corners.map(({ x, y }) => [x, y].join(",")).join(" "))
                    .id(sourceId)
                    .fill(topFill)
                    .stroke({ linecap: "round", linejoin: "round", ...stroke });
            }
        }

        if (sideHeight > 0 && !isSpacer && (!isLintel || drawnEdges.length > 0)) {
            const cWorld = centroid(hex.corners)!;
            const cabinet = usesLayeredCellDraw(projection);
            const sideFaceIndices = cabinet
                ? Array.from({ length: 6 }, (_, i) => i)
                    .map((i) => {
                        const a = hex.corners[i];
                        const b = hex.corners[(i + 1) % 6];
                        const midX = (a.x + b.x) / 2;
                        const midY = (a.y + b.y) / 2;
                        const score = (cWorld.x - midX) + (midY - cWorld.y);
                        return { i, score };
                    })
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 3)
                    .map(({ i }) => i)
                : [0, 1, 2];
            for (const i of sideFaceIndices) {
                const next = (i + 1) % hex.tCorners.length;
                const edgeIdx = edgeIndexForCorners(i, next);
                const a = hex.tCorners[i];
                const b = hex.tCorners[next];
                const aBot = hex.tBottomCorners[i];
                const bBot = hex.tBottomCorners[next];
                const sidePath = nested.path(`M ${a.x} ${a.y} L ${aBot.x} ${aBot.y} L ${bBot.x} ${bBot.y} L ${b.x} ${b.y}`)
                    .fill(sideFaceFill(baseHex, hex, edgeIdx >= 0 ? edgeIdx : i, faceFills));
                if (isLintel) {
                    sidePath.stroke("none");
                } else {
                    sidePath.stroke({ linecap: "round", linejoin: "round", ...stroke });
                }
                if (isLintel && edgeIdx >= 0) {
                    if (edgeDrawn(edgeIdx)) {
                        strokeLine(nested, a, b, stroke);
                    }
                    if (cornerVerticalDrawn(i)) {
                        strokeLine(nested, a, aBot, stroke);
                    }
                    if (cornerVerticalDrawn(next)) {
                        strokeLine(nested, b, bBot, stroke);
                    }
                }
            }
        }
        if (!isSpacer && hexTop !== null) {
            applyIsoAffineMatrix(nested.use(hexTop), hex.transform);
        }
        nested.viewbox([minx, miny, hex.width + dWidth, hex.height + dHeight].join(" "));
    }
};
