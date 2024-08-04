import { Matrix } from "transformation-matrix-js";
import { deg2rad } from "../../common/plotting";
import { FillData, StrokeData, Svg, Rect as SVGRect } from "@svgdotjs/svg.js";

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

export const generateCubes = (opts: {rootSvg: Svg, heights: number[], stroke: StrokeData, fill: FillData, idSymbol?: string}): void => {
    const { rootSvg, heights, stroke, fill} = opts;
    const tSize = 100;

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
        let rectTop: SVGRect|null = null;
        let sourceId = `isoRect${idTop}`;
        if (opts.idSymbol !== undefined) {
            sourceId = `isoRect${idTop}_${opts.idSymbol}`;
        }
        rectTop = defs.findOne("#" + sourceId) as SVGRect|null;
        if (rectTop === null) {
            rectTop = defs.rect(tSize, tSize).id(sourceId)
                .fill(fill)
                .stroke({linecap: "round", linejoin: "round", ...stroke});
        }
        let rectSide: SVGRect|null = null;
        if (tSize !== sideHeight && sideHeight > 0) {
            rectSide = defs.findOne(`#isoRect${idSide}`) as SVGRect|null;
            if (rectSide === null) {
                rectSide = defs.rect(tSize, sideHeight).id(`isoRect${idSide}`)
                    .fill(fill)
                    .stroke({linecap: "round", linejoin: "round", ...stroke});
            }
        }
        nested.use(rectTop).matrix(cube.top.toArray());
        if (rectSide !== null) {
            nested.use(rectSide).matrix(cube.left.toArray());
            nested.use(rectSide).matrix(cube.right.toArray());
        } else if (sideHeight === tSize) {
            nested.use(rectTop).matrix(cube.left.toArray());
            nested.use(rectTop).matrix(cube.right.toArray());
        }
        nested.viewbox([minx, miny, cube.width + dWidth, cube.height + dHeight].join(" "));
    }
}
