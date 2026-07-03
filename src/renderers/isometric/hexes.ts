import { Matrix } from "transformation-matrix-js";
import { centroid } from "../../common/plotting";
import { FillData, StrokeData, Svg, Polygon as SVGPoly } from "@svgdotjs/svg.js";
import { IPoint } from "../../grids";
import { defineHex, Orientation } from "honeycomb-grid";
import { buildIsoProjectionMatrix } from "./projection";
import { CubeFaceFills } from "./cubes";
import { isoShadeProjectedFace } from "./shading";

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
};

const genHex = (topSize: number, sideHeight: number, orientation: Orientation): Hex => {
    const tFinal = buildIsoProjectionMatrix();

    type Vertex = [number,number];
    const pHex = defineHex({orientation, dimensions: topSize});
    const hex = new pHex();

    const xMinOrig = Math.min(...hex.corners.map(pt => pt.x));
    const xMaxOrig = Math.max(...hex.corners.map(pt => pt.x));
    const yMinOrig = Math.min(...hex.corners.map(pt => pt.y));
    const yMaxOrig = Math.max(...hex.corners.map(pt => pt.y));
    const widthOrig = xMaxOrig - xMinOrig;
    const heightOrig = yMaxOrig - yMinOrig;

    const ptsTop: Vertex[] = hex.corners.map(({x,y}) => [x,y]);
    const ptsTransformed: {x: number; y: number}[] = [];
    for (const pt of ptsTop) {
        ptsTransformed.push(tFinal.applyToPoint(...pt));
    }
    const tCorners = ptsTransformed.map(pt => {return {...pt};});
    const xMinPost = Math.min(...tCorners.map(pt => pt.x));
    const xMaxPost = Math.max(...tCorners.map(pt => pt.x));
    const yMinPost = Math.min(...tCorners.map(pt => pt.y));
    const yMaxPost = Math.max(...tCorners.map(pt => pt.y));
    const widthPost = xMaxPost - xMinPost;
    const heightPost = yMaxPost - yMinPost;

    ptsTransformed.push({x: tCorners[0].x, y: tCorners[0].y + sideHeight});
    ptsTransformed.push({x: tCorners[1].x, y: tCorners[1].y + sideHeight});
    ptsTransformed.push({x: tCorners[2].x, y: tCorners[2].y + sideHeight});
    ptsTransformed.push({x: tCorners[3].x, y: tCorners[3].y + sideHeight});

    const xMin = Math.min(...ptsTransformed.map(pt => pt.x));
    const xMax = Math.max(...ptsTransformed.map(pt => pt.x));
    const yMin = Math.min(...ptsTransformed.map(pt => pt.y));
    const yMax = Math.max(...ptsTransformed.map(pt => pt.y));
    const width = xMax - xMin;
    const height = yMax - yMin;

    const cx = xMin + (width / 2);
    const cy = yMin + (height / 2);
    const cTop = centroid(tCorners)!;
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
        cxBot: cTop.x,
        cyBot: cTop.y + sideHeight,
        dy: Math.abs(cy - cTop.y),
        corners: hex.corners,
        tCorners,
    }
}

const sideFaceFill = (
    baseHex: string,
    hex: Hex,
    i: number,
    faceFills?: CubeFaceFills,
): FillData => {
    if (faceFills === undefined) {
        return {color: baseHex};
    }
    const a = hex.tCorners[i];
    const b = hex.tCorners[i + 1];
    const centroidTop: IPoint = {x: hex.cxTop, y: hex.cyTop};
    const shaded = isoShadeProjectedFace(baseHex, centroidTop, a, b);
    return {color: shaded};
};

export const generateHexes = (opts: {rootSvg: Svg, heights: number[], orientation: Orientation, stroke: StrokeData, fill: FillData, faceFills?: CubeFaceFills, idSymbol?: string}): void => {
    const { rootSvg, heights, stroke, fill, orientation, faceFills} = opts;
    const tSize = 100;
    const topFill = faceFills?.top ?? fill;
    const baseHex = typeof (faceFills?.left ?? fill).color === "string"
        ? (faceFills?.left ?? fill).color as string
        : "#000";

    for (const sideHeight of heights) {
        const idTop = tSize.toString().replace(".", "_");
        const idSide = sideHeight.toString().replace(".", "_");
        const hex = genHex(tSize, sideHeight, orientation);
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
        let hexTop: SVGPoly|null = null;
        let sourceId = `isoHex${idTop}`;
        if (opts.idSymbol !== undefined) {
            sourceId = `isoHex${idTop}_${opts.idSymbol}`;
        }
        hexTop = defs.findOne("#" + sourceId) as SVGPoly|null;
        if (hexTop === null) {
            hexTop = defs.polygon(hex.corners.map(({x,y}) => [x,y].join(",")).join(" "))
                .id(sourceId)
                .fill(topFill)
                .stroke({linecap: "round", linejoin: "round", ...stroke});
        }

        if (sideHeight > 0) {
            for (let i = 0; i < 3; i++) {
                const a = hex.tCorners[i];
                const b = hex.tCorners[i + 1];
                nested.path(`M ${a.x} ${a.y} L ${a.x} ${a.y + sideHeight} L ${b.x} ${b.y + sideHeight} L ${b.x} ${b.y}`)
                    .fill(sideFaceFill(baseHex, hex, i, faceFills))
                    .stroke({linecap: "round", linejoin: "round", ...stroke});
            }
        }
        nested.use(hexTop).matrix(hex.transform.toArray());
        nested.viewbox([minx, miny, hex.width + dWidth, hex.height + dHeight].join(" "));
    }
}
