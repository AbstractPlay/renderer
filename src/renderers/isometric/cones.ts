import { FillData, StrokeData, Svg, Gradient as SVGGradient } from "@svgdotjs/svg.js";
import { IPoint } from "../../grids";
import { ISO_PROJECTION_PRESETS, IsoProjectionParams, projectOblique } from "./projection";
import { CubeFaceFills } from "./cubes";
import { coneSilhouettePoints } from "./coneSilhouette";

export type Cone = {
    xMin: number;
    yMin: number;
    width: number;
    height: number;
    cx: number;
    cy: number;
    cxTop: number;
    cyTop: number;
    cxBot: number;
    cyBot: number;
    dy: number;
    apex: IPoint;
    ptRight: IPoint;
    ptLeft: IPoint;
    baseArc: IPoint[];
};

const genCone = (
    topSize: number,
    sideHeight: number,
    params: IsoProjectionParams = ISO_PROJECTION_PRESETS.iso,
): Cone => {
    const r = topSize / 2;
    const p = (x: number, y: number, z: number): IPoint => projectOblique(x, y, z, params);

    const { apex, ptsEnds, baseArc, ptsBase } = coneSilhouettePoints(r, sideHeight, params);
    const ctrBase = p(0, 0, sideHeight);
    const silhouette: IPoint[] = [
        apex,
        ...ptsBase,
        ptsEnds[0],
        ...baseArc,
        ptsEnds[1],
    ];

    const xMin = Math.min(...silhouette.map((pt) => pt.x));
    const xMax = Math.max(...silhouette.map((pt) => pt.x));
    const yMin = Math.min(...silhouette.map((pt) => pt.y));
    const yMax = Math.max(...silhouette.map((pt) => pt.y));
    const width = xMax - xMin;
    const height = yMax - yMin;

    const cx = xMin + (width / 2);
    const cy = yMin + (height / 2);

    return {
        xMin,
        yMin,
        width,
        height,
        cx,
        cy,
        cxTop: apex.x,
        cyTop: apex.y,
        cxBot: ctrBase.x,
        cyBot: ctrBase.y,
        dy: Math.abs(cy - apex.y),
        apex,
        ptRight: ptsEnds[0],
        ptLeft: ptsEnds[1],
        baseArc,
    };
};

const sidePath = (cone: Cone): string => {
    const { apex, ptRight, ptLeft, baseArc } = cone;
    const parts = [
        `M ${apex.x} ${apex.y}`,
        `L ${ptRight.x} ${ptRight.y}`,
        ...baseArc.map((pt) => `L ${pt.x} ${pt.y}`),
        `L ${ptLeft.x} ${ptLeft.y}`,
        "Z",
    ];
    return parts.join(" ");
};

export const generateCones = (opts: {
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
    const tSize = 100;
    const sideFill: FillData | SVGGradient = fill;

    for (const sideHeight of heights) {
        const idSide = sideHeight.toString().replace(".", "_");
        const cone = genCone(tSize, sideHeight, projection);
        const dWidth = 0;
        const dHeight = 0;
        const minx = cone.xMin - (dWidth / 2);
        const miny = cone.yMin - (dHeight / 2);
        let idSymbol = `_isoCone_${idSide}`;
        if (opts.idSymbol !== undefined) {
            idSymbol = opts.idSymbol;
        }
        const nested = rootSvg.defs().nested().id(idSymbol)
            .attr("data-width-ratio", cone.width / tSize)
            .attr("data-dy-bottom", Math.abs(miny - cone.cyBot) / cone.height)
            .attr("data-dy-top", Math.abs(miny - cone.cyTop) / cone.height);
        const defs = nested.defs();

        if (sideHeight > 0) {
            const pathD = sidePath(cone);
            let resolvedSideFill: FillData | SVGGradient = sideFill;
            if (faceFills !== undefined) {
                const gradId = `isoConeSide_${idSymbol}`;
                const leftColour = typeof faceFills.left.color === "string" ? faceFills.left.color : "#000";
                const rightColour = typeof faceFills.right.color === "string" ? faceFills.right.color : "#000";
                const { ptLeft, ptRight } = cone;
                resolvedSideFill = defs.gradient("linear", (add) => {
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
                .stroke({ linecap: "round", linejoin: "round", ...stroke });
            if (faceFills !== undefined) {
                path.fill(resolvedSideFill as SVGGradient);
            } else {
                path.fill(resolvedSideFill as FillData);
            }
        }
        nested.viewbox([minx, miny, cone.width + dWidth, cone.height + dHeight].join(" "));
    }
};
