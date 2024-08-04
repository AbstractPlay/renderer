import { Matrix } from "transformation-matrix-js";
import { circle2poly, deg2rad, projectPoint, ptDistance } from "../../common/plotting";
import { FillData, StrokeData, Svg, Circle as SVGCircle } from "@svgdotjs/svg.js";
import { IPoint } from "../../grids";

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

    const tScale = new Matrix().scaleY(Math.cos(deg2rad(30)));
    const tShear = new Matrix().shearX(Math.tan(deg2rad(-30)));
    const tRotate = new Matrix().rotate(deg2rad(30));
    const tFinal = tRotate.multiply(tShear.multiply(tScale));

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

export const generateCylinders = (opts: {rootSvg: Svg, heights: number[], stroke: StrokeData, fill: FillData, idSymbol?: string}): void => {
    const { rootSvg, heights, stroke, fill} = opts;
    const tSize = 85;

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
            .attr("data-dy-top", Math.abs(miny - cylinder.cxTop) / cylinder.height);
        // add defs
        const defs = nested.defs();
        let circleTop: SVGCircle|null = null;
        let sourceId = `isoCircle${idTop}`;
        if (opts.idSymbol !== undefined) {
            sourceId = `isoCircle${idTop}_${opts.idSymbol}`;
        }
        circleTop = defs.findOne("#" + sourceId) as SVGCircle|null;
        if (circleTop === null) {
            circleTop = defs.circle(tSize).center(0,0).id(sourceId)
                .fill(fill)
                .stroke({linecap: "round", linejoin: "round", ...stroke});
        }

        // instantiate
        if (sideHeight > 0) {
            nested.path(`M ${cylinder.ptRight.x} ${cylinder.ptRight.y} L ${cylinder.ptRight.x} ${cylinder.ptRight.y + sideHeight} A ${cylinder.rx} ${cylinder.ry} 0 1 1 ${cylinder.ptLeft.x} ${cylinder.ptLeft.y + sideHeight} L ${cylinder.ptLeft.x} ${cylinder.ptLeft.y}`)
                .fill(fill)
                .stroke({linecap: "round", linejoin: "round", ...stroke});
        }
        nested.use(circleTop).matrix(cylinder.transform.toArray());
        nested.viewbox([minx, miny, cylinder.width + dWidth, cylinder.height + dHeight].join(" "));
    }
}
