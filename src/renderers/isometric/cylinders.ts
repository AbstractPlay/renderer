import { Matrix } from "transformation-matrix-js";
import { circle2poly, projectPoint, ptDistance } from "../../common/plotting";
import { FillData, StrokeData, Svg, Circle as SVGCircle, Gradient as SVGGradient } from "@svgdotjs/svg.js";
import { IPoint } from "../../grids";
import { buildIsoProjectionMatrix } from "./projection";
import { CubeFaceFills } from "./cubes";

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
};

const genCylinder = (topSize: number, sideHeight: number): Cylinder => {
    const r = topSize/2;
    const tFinal = buildIsoProjectionMatrix();

    type Vertex = [number,number];
    const ptsTop: Vertex[] = circle2poly(0, 0, r)
    const ptsTransformed: {x: number; y: number}[] = [];
    for (const pt of ptsTop) {
        ptsTransformed.push(tFinal.applyToPoint(...pt));
    }
    const ptsRadii: IPoint[] = [projectPoint(0, 0, r, 45), projectPoint(0, 0, r, 135)].map(v => tFinal.applyToPoint(...v));
    const ctrEllipse = tFinal.applyToPoint(0,0);
    const rx = ptDistance(ctrEllipse.x, ctrEllipse.y, ptsRadii[0].x, ptsRadii[0].y);
    const ry = ptDistance(ctrEllipse.x, ctrEllipse.y, ptsRadii[1].x, ptsRadii[1].y);
    const ptsEnds: IPoint[] = [projectPoint(0, 0, r, 45), projectPoint(0, 0, r, 225)].map(v => tFinal.applyToPoint(...v));
    ptsTransformed.push({x: ptsEnds[0].x, y: ptsEnds[0].y + sideHeight});
    ptsTransformed.push({x: ptsEnds[1].x, y: ptsEnds[1].y + sideHeight});
    ptsTransformed.push({x: ptsRadii[1].x, y: ptsRadii[1].y + sideHeight});

    const xMin = Math.min(...ptsTransformed.map(pt => pt.x));
    const xMax = Math.max(...ptsTransformed.map(pt => pt.x));
    const yMin = Math.min(...ptsTransformed.map(pt => pt.y));
    const yMax = Math.max(...ptsTransformed.map(pt => pt.y));
    const width = xMax - xMin;
    const height = yMax - yMin;

    const cx = xMin + (width / 2);
    const cy = yMin + (height / 2);

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
        cxBot: ctrEllipse.x,
        cyBot: ctrEllipse.y + sideHeight,
        dy: Math.abs(cy - ctrEllipse.y),
        ptRight: ptsEnds[0],
        ptLeft: ptsEnds[1],
    }
}

const barrelPath = (cylinder: Cylinder, sideHeight: number): string => {
    const {ptRight, ptLeft, rx, ry} = cylinder;
    return `M ${ptRight.x} ${ptRight.y} L ${ptRight.x} ${ptRight.y + sideHeight} A ${rx} ${ry} 0 1 1 ${ptLeft.x} ${ptLeft.y + sideHeight} L ${ptLeft.x} ${ptLeft.y}`;
};

export const generateCylinders = (opts: {rootSvg: Svg, heights: number[], stroke: StrokeData, fill: FillData, faceFills?: CubeFaceFills, idSymbol?: string}): void => {
    const { rootSvg, heights, stroke, fill, faceFills} = opts;
    const tSize = 100;
    const topFill = faceFills?.top ?? fill;
    const barrelFill: FillData | SVGGradient = faceFills !== undefined
        ? fill // placeholder; replaced per-symbol below
        : fill;

    for (const sideHeight of heights) {
        const idTop = tSize.toString().replace(".", "_");
        const idSide = sideHeight.toString().replace(".", "_");
        const cylinder = genCylinder(tSize, sideHeight);
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
        let sourceId = `isoCircle${idTop}`;
        if (opts.idSymbol !== undefined) {
            sourceId = `isoCircle${idTop}_${opts.idSymbol}`;
        }
        circleTop = defs.findOne("#" + sourceId) as SVGCircle|null;
        if (circleTop === null) {
            circleTop = defs.circle(tSize).center(0,0).id(sourceId)
                .fill(topFill)
                .stroke({linecap: "round", linejoin: "round", ...stroke});
        }

        if (sideHeight > 0) {
            const pathD = barrelPath(cylinder, sideHeight);
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
