import { Matrix } from "transformation-matrix-js";
import { deg2rad } from "../../common/plotting";
import { FillData, StrokeData, Svg, G as SVGG, Rect as SVGRect } from "@svgdotjs/svg.js";
import { IPoint } from "../../grids";

export type Cube = {
    top: Matrix;
    left: Matrix;
    right: Matrix;
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
};

export const genCube = (topSize: number, sideHeight: number): Cube => {
    const tScale = new Matrix().scaleY(Math.cos(deg2rad(30)));
    const tShear = new Matrix().shearX(Math.tan(deg2rad(-30)));
    const tRotate = new Matrix().rotate(deg2rad(30));
    const tFinal = tRotate.multiply(tShear.multiply(tScale));
    const tAnchorBottom = tFinal.applyToPoint(topSize, topSize);
    const lScale = new Matrix().scaleX(Math.cos(deg2rad(30)));
    const lShear = new Matrix().shearY(Math.tan(deg2rad(30)));
    const lPreMove = lShear.multiply(lScale);
    const lAnchor = lPreMove.applyToPoint(topSize,0);
    const lTranslate = new Matrix().translate(tAnchorBottom.x - lAnchor.x, tAnchorBottom.y - lAnchor.y);
    const lFinal = lTranslate.multiply(lPreMove);
    const rScale = new Matrix().scaleX(Math.cos(deg2rad(30)));
    const rShear = new Matrix().shearY(Math.tan(deg2rad(-30)));
    const rPreMove = rShear.multiply(rScale);
    const rAnchor = rPreMove.applyToPoint(0,0);
    const rTranslate = new Matrix().translate(tAnchorBottom.x - rAnchor.x, tAnchorBottom.y - rAnchor.y);
    const rFinal = rTranslate.multiply(rPreMove);

    const ptsTop: [number,number][] = [[0,0], [topSize,0], [topSize,topSize], [0,topSize]];
    const ptsSide: [number,number][] = [[0,0], [topSize,0], [0, sideHeight], [topSize, sideHeight]];
    const ptsTransformed: {x: number; y: number}[] = [];
    for (const pt of ptsTop) {
        ptsTransformed.push(tFinal.applyToPoint(...pt));
    }
    for (const pt of ptsSide) {
        ptsTransformed.push(lFinal.applyToPoint(...pt));
        ptsTransformed.push(rFinal.applyToPoint(...pt));
    }
    const xMin = Math.min(...ptsTransformed.map(pt => pt.x));
    const xMax = Math.max(...ptsTransformed.map(pt => pt.x));
    const yMin = Math.min(...ptsTransformed.map(pt => pt.y));
    const yMax = Math.max(...ptsTransformed.map(pt => pt.y));
    const width = xMax - xMin;
    const height = yMax - yMin;

    const cx = xMin + (width / 2);
    const cy = yMin + (height / 2);
    const {x: cxTop, y: cyTop} = tFinal.applyToPoint(topSize / 2, topSize / 2);
    const dy = Math.abs(tAnchorBottom.y - cyTop);
    const cxBot = cxTop; const cyBot = cyTop + sideHeight;

    return {
        top: tFinal,
        left: lFinal,
        right: rFinal,
        xMin,
        yMin,
        width,
        height,
        cx,
        cy,
        cxTop,
        cyTop,
        cxBot,
        cyBot,
        dy,
    }
}

export const generateCubes = (opts: {rootSvg: Svg, heights: number[], stroke: StrokeData, fill: FillData, idSymbol?: string, sides?: ("N"|"E"|"S"|"W")[]}): void => {
    const { rootSvg, heights, stroke, fill} = opts;
    const tSize = 100;
    let sides: ("N"|"E"|"S"|"W")[] = ["N", "E", "S", "W"];
    if (opts.sides !== undefined) {
        sides = opts.sides;
    }

    for (const sideHeight of heights) {
        const idTop = tSize.toString().replace(".", "_");
        const idSide = sideHeight.toString().replace(".", "_");
        const cube = genCube(tSize, sideHeight);
        const dWidth = 0;
        const dHeight = 0;
        const minx = cube.xMin - (dWidth / 2);
        const miny = cube.yMin - (dHeight / 2);
        let idSymbol = `_isoCube_${idSide}`;
        if (opts.idSymbol !== undefined) {
            idSymbol = opts.idSymbol
        }
        const nested = rootSvg.defs().nested().id(idSymbol)
            .attr("data-width-ratio", cube.width / tSize)
            .attr("data-dy-bottom", Math.abs(miny - cube.cyBot) / cube.height)
            .attr("data-dy-top", Math.abs(miny - cube.cyTop) / cube.height);
        const defs = nested.defs();
        let rectTop: SVGG|null = null;
        let sourceId = `isoRect${idTop}`;
        if (opts.idSymbol !== undefined) {
            sourceId = `isoRect${idTop}_${opts.idSymbol}`;
        }
        rectTop = defs.findOne("#" + sourceId) as SVGG|null;
        if (rectTop === null) {
            rectTop = defs.group().id(sourceId);
            rectTop.rect(tSize, tSize).fill(fill).stroke("none");
            if (sides.includes("N")) {
                rectTop.line(0,0,tSize,0).stroke({linecap: "round", linejoin: "round", ...stroke});
            }
            if (sides.includes("E")) {
                rectTop.line(tSize,0,tSize,tSize).stroke({linecap: "round", linejoin: "round", ...stroke});
            }
            if (sides.includes("S")) {
                rectTop.line(tSize, tSize,0,tSize).stroke({linecap: "round", linejoin: "round", ...stroke});
            }
            if (sides.includes("W")) {
                rectTop.line(0,0,0,tSize).stroke({linecap: "round", linejoin: "round", ...stroke});
            }
        }
        let rectSide: SVGRect|null;
        if (sideHeight > 0 && sides.length > 0) {
            let sideSourceId = `isoRectSide${idSide}`;
            if (opts.idSymbol !== undefined) {
                sideSourceId = `isoRectSide${idSide}_${opts.idSymbol}`;
            }
            rectSide = defs.findOne("#" + sideSourceId) as SVGRect|null;
            if (rectSide === null) {
                rectSide = defs.rect(tSize,sideHeight).id(sideSourceId).fill(fill).stroke("none");
            }
            nested.use(rectSide).matrix(cube.right.toArray());
            nested.use(rectSide).matrix(cube.left.toArray());

            const a1: IPoint = cube.top.applyToPoint(tSize,0);
            const a2: IPoint = cube.right.applyToPoint(tSize,sideHeight);
            const a3: IPoint = cube.right.applyToPoint(0,sideHeight);
            const a4: IPoint = cube.top.applyToPoint(tSize,tSize);
            const a5: IPoint = cube.left.applyToPoint(0,sideHeight);
            const a6: IPoint = cube.top.applyToPoint(0,tSize);
            if ( (!sides.includes("N") && !sides.includes("S")) || (!sides.includes("E") && !sides.includes("W")) ) {
                nested.line(a2.x, a2.y, a3.x, a3.y).stroke({linecap: "round", linejoin: "round", ...stroke});
                nested.line(a3.x, a3.y, a5.x, a5.y).stroke({linecap: "round", linejoin: "round", ...stroke});
            } else if (!sides.includes("N")) {
                nested.line(a2.x, a2.y, a3.x, a3.y).stroke({linecap: "round", linejoin: "round", ...stroke});
                nested.line(a3.x, a3.y, a4.x, a4.y).stroke({linecap: "round", linejoin: "round", ...stroke});
                nested.line(a3.x, a3.y, a5.x, a5.y).stroke({linecap: "round", linejoin: "round", ...stroke});
                nested.line(a5.x, a5.y, a6.x, a6.y).stroke({linecap: "round", linejoin: "round", ...stroke});
            } else if (!sides.includes("E")) {
                nested.line(a1.x, a1.y, a2.x, a2.y).stroke({linecap: "round", linejoin: "round", ...stroke});
                nested.line(a2.x, a2.y, a3.x, a3.y).stroke({linecap: "round", linejoin: "round", ...stroke});
                nested.line(a5.x, a5.y, a3.x, a3.y).stroke({linecap: "round", linejoin: "round", ...stroke});
                nested.line(a5.x, a5.y, a6.x, a6.y).stroke({linecap: "round", linejoin: "round", ...stroke});
            } else if (!sides.includes("S")) {
                nested.line(a1.x, a1.y, a2.x, a2.y).stroke({linecap: "round", linejoin: "round", ...stroke});
                nested.line(a2.x, a2.y, a3.x, a3.y).stroke({linecap: "round", linejoin: "round", ...stroke});
                nested.line(a5.x, a5.y, a3.x, a3.y).stroke({linecap: "round", linejoin: "round", ...stroke});
                nested.line(a5.x, a5.y, a6.x, a6.y).stroke({linecap: "round", linejoin: "round", ...stroke});
            } else if (!sides.includes("W")) {
                nested.line(a1.x, a1.y, a2.x, a2.y).stroke({linecap: "round", linejoin: "round", ...stroke});
                nested.line(a3.x, a3.y, a2.x, a2.y).stroke({linecap: "round", linejoin: "round", ...stroke});
                nested.line(a3.x, a3.y, a4.x, a4.y).stroke({linecap: "round", linejoin: "round", ...stroke});
                nested.line(a3.x, a3.y, a5.x, a5.y).stroke({linecap: "round", linejoin: "round", ...stroke});
            } else {
                nested.line(a1.x, a1.y, a2.x, a2.y).stroke({linecap: "round", linejoin: "round", ...stroke});
                nested.line(a3.x, a3.y, a2.x, a2.y).stroke({linecap: "round", linejoin: "round", ...stroke});
                nested.line(a3.x, a3.y, a4.x, a4.y).stroke({linecap: "round", linejoin: "round", ...stroke});
                nested.line(a3.x, a3.y, a5.x, a5.y).stroke({linecap: "round", linejoin: "round", ...stroke});
                nested.line(a5.x, a5.y, a6.x, a6.y).stroke({linecap: "round", linejoin: "round", ...stroke});
            }
        }
        if (sides.length > 0) {
            nested.use(rectTop).matrix(cube.top.toArray());
        }
        nested.viewbox([minx, miny, cube.width + dWidth, cube.height + dHeight].join(" "));
    }
}
