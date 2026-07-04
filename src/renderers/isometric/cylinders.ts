import { Matrix } from "transformation-matrix-js";
import { ptDistance } from "../../common/plotting";
import { FillData, StrokeData, Svg, Circle as SVGCircle, Gradient as SVGGradient } from "@svgdotjs/svg.js";
import { IPoint } from "../../grids";
import { buildIsoProjectionMatrix, ISO_PROJECTION_PRESETS, IsoProjectionParams, isoProjectionCacheSuffix, projectOblique } from "./projection";
import { CubeFaceFills } from "./cubes";
import { cylinderSilhouettePoints } from "./cylinderSilhouette";

export type Cylinder = {
    transform: Matrix;
    xMin: number;
    yMin: number;
    width: number;
    height: number;
    rx: number;
    ry: number;
    cx: number;
    cy: number;
    cxTop: number;
    cyTop: number;
    cxBot: number;
    cyBot: number;
    dy: number;
    ptLeft: IPoint;
    ptRight: IPoint;
    ptRightBot: IPoint;
    ptLeftBot: IPoint;
    barrelBottom: IPoint[];
};

const genCylinder = (
    topSize: number,
    sideHeight: number,
    params: IsoProjectionParams = ISO_PROJECTION_PRESETS.iso,
): Cylinder => {
    const r = topSize / 2;
    const tFinal = buildIsoProjectionMatrix(params);
    const p = (x: number, y: number, z: number): IPoint => projectOblique(x, y, z, params);

    const { ptsEnds, ptsEndsBot, barrelBottom, ptsTop } = cylinderSilhouettePoints(r, sideHeight, params);
    const ctrEllipse = p(0, 0, 0);
    const rx = ptDistance(ctrEllipse.x, ctrEllipse.y, ptsEnds[0].x, ptsEnds[0].y);
    const ry = ptDistance(ctrEllipse.x, ctrEllipse.y, ptsEnds[1].x, ptsEnds[1].y);
    const silhouette: IPoint[] = [
        ...ptsTop,
        ptsEnds[0],
        ptsEndsBot[0],
        ...barrelBottom,
        ptsEndsBot[1],
        ptsEnds[1],
    ];

    const xMin = Math.min(...silhouette.map(pt => pt.x));
    const xMax = Math.max(...silhouette.map(pt => pt.x));
    const yMin = Math.min(...silhouette.map(pt => pt.y));
    const yMax = Math.max(...silhouette.map(pt => pt.y));
    const width = xMax - xMin;
    const height = yMax - yMin;

    const cx = xMin + (width / 2);
    const cy = yMin + (height / 2);
    const contact = p(0, 0, sideHeight);

    return {
        transform: tFinal,
        xMin,
        yMin,
        width,
        height,
        rx,
        ry,
        cx,
        cy,
        cxTop: ctrEllipse.x,
        cyTop: ctrEllipse.y,
        cxBot: contact.x,
        cyBot: contact.y,
        dy: Math.abs(cy - ctrEllipse.y),
        ptRight: ptsEnds[0],
        ptLeft: ptsEnds[1],
        ptRightBot: ptsEndsBot[0],
        ptLeftBot: ptsEndsBot[1],
        barrelBottom,
    };
};

const barrelPath = (cylinder: Cylinder): string => {
    const { ptRight, ptLeft, ptRightBot, ptLeftBot, barrelBottom } = cylinder;
    const parts = [
        `M ${ptRight.x} ${ptRight.y}`,
        `L ${ptRightBot.x} ${ptRightBot.y}`,
        ...barrelBottom.map((pt) => `L ${pt.x} ${pt.y}`),
        `L ${ptLeftBot.x} ${ptLeftBot.y}`,
        `L ${ptLeft.x} ${ptLeft.y}`,
    ];
    return parts.join(" ");
};

export const generateCylinders = (opts: {
    rootSvg: Svg;
    heights: number[];
    stroke: StrokeData;
    fill: FillData;
    faceFills?: CubeFaceFills;
    idSymbol?: string;
    projection?: IsoProjectionParams;
}): void => {
    const { rootSvg, heights, stroke, fill, faceFills } = opts;
    const projection = opts.projection ?? ISO_PROJECTION_PRESETS.iso;
    const projectionSuffix = isoProjectionCacheSuffix(projection);
    const tSize = 100;
    const topFill = faceFills?.top ?? fill;
    const barrelFill: FillData | SVGGradient = faceFills !== undefined
        ? fill // placeholder; replaced per-symbol below
        : fill;

    for (const sideHeight of heights) {
        const idTop = tSize.toString().replace(".", "_");
        const idSide = sideHeight.toString().replace(".", "_");
        const cylinder = genCylinder(tSize, sideHeight, projection);
        const dWidth = 0;
        const dHeight = 0;
        const minx = cylinder.xMin - (dWidth / 2);
        const miny = cylinder.yMin - (dHeight / 2);
        let idSymbol = `_isoCylinder_${idSide}`;
        if (opts.idSymbol !== undefined) {
            idSymbol = opts.idSymbol;
        }
        const nested = rootSvg.defs().nested().id(idSymbol)
            .attr("data-width-ratio", cylinder.width / tSize)
            .attr("data-dy-bottom", Math.abs(miny - cylinder.cyBot) / cylinder.height)
            .attr("data-dy-top", Math.abs(miny - cylinder.cyTop) / cylinder.height);
        const defs = nested.defs();
        let circleTop: SVGCircle|null = null;
        let sourceId = `isoCircle${idTop}${projectionSuffix}`;
        if (opts.idSymbol !== undefined) {
            sourceId = `isoCircle${idTop}_${opts.idSymbol}${projectionSuffix}`;
        }
        circleTop = defs.findOne("#" + sourceId) as SVGCircle|null;
        if (circleTop === null) {
            circleTop = defs.circle(tSize).center(0,0).id(sourceId)
                .fill(topFill)
                .stroke({linecap: "round", linejoin: "round", ...stroke});
        }

        if (sideHeight > 0) {
            const pathD = barrelPath(cylinder);
            let sideFill: FillData | SVGGradient = barrelFill;
            if (faceFills !== undefined) {
                const gradId = `isoCylBarrel_${idSymbol}`;
                const leftColour = typeof faceFills.left.color === "string" ? faceFills.left.color : "#000";
                const rightColour = typeof faceFills.right.color === "string" ? faceFills.right.color : "#000";
                const {ptLeft, ptRight} = cylinder;
                sideFill = defs.gradient("linear", (add) => {
                    add.stop(0, leftColour);
                    add.stop(1, rightColour);
                }).id(gradId).attr({
                    gradientUnits: "userSpaceOnUse",
                    x1: ptLeft.x,
                    y1: ptLeft.y,
                    x2: ptRight.x,
                    y2: ptRight.y,
                });
            }
            const path = nested.path(pathD)
                .stroke({linecap: "round", linejoin: "round", ...stroke});
            if (faceFills !== undefined) {
                path.fill(sideFill as SVGGradient);
            } else {
                path.fill(sideFill as FillData);
            }
        }
        nested.use(circleTop).matrix(cylinder.transform.toArray());
        nested.viewbox([minx, miny, cylinder.width + dWidth, cylinder.height + dHeight].join(" "));
    }
}
