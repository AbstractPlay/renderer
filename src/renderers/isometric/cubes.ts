import { Matrix } from "transformation-matrix-js";
import { FillData, StrokeData, Svg, G as SVGG, Rect as SVGRect } from "@svgdotjs/svg.js";
import { IPoint } from "../../grids";
import {
    affineFromUnitRect,
    cabinetPieceVisibility,
    ISO_PROJECTION_PRESETS,
    IsoProjectionParams,
    isoProjectionCacheSuffix,
    projectOblique,
    usesLayeredCellDraw,
} from "./projection";

export type CubeSideFace = "left" | "right" | "west";

export type Cube = {
    top: Matrix;
    left: Matrix;
    right: Matrix;
    west: Matrix;
    /** Side faces to paint (cabinet: south + west). */
    sideFaces: CubeSideFace[];
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

export const genCube = (
    topSize: number,
    sideHeight: number,
    params: IsoProjectionParams = ISO_PROJECTION_PRESETS.iso,
): Cube => {
    const p = (x: number, y: number, z: number): IPoint => projectOblique(x, y, z, params);
    const cabinet = cabinetPieceVisibility(params);

    const nw = p(0, 0, 0);
    const ne = p(topSize, 0, 0);
    const se = p(topSize, topSize, 0);
    const sw = p(0, topSize, 0);

    const top = affineFromUnitRect(topSize, topSize, nw, ne, sw);

    const ptsTransformed: IPoint[] = [
        nw,
        ne,
        se,
        sw,
        p(0, topSize, sideHeight),
        p(topSize, topSize, sideHeight),
        p(topSize, 0, sideHeight),
    ];
    if (cabinet !== undefined) {
        ptsTransformed.push(p(0, 0, sideHeight));
    }
    const left = affineFromUnitRect(
        topSize,
        sideHeight,
        p(0, topSize, 0),
        p(topSize, topSize, 0),
        p(0, topSize, sideHeight),
    );
    const right = affineFromUnitRect(
        topSize,
        sideHeight,
        p(topSize, topSize, 0),
        p(topSize, 0, 0),
        p(topSize, topSize, sideHeight),
    );
    const west = affineFromUnitRect(
        topSize,
        sideHeight,
        p(0, 0, 0),
        p(0, topSize, 0),
        p(0, 0, sideHeight),
    );

    const xMin = Math.min(...ptsTransformed.map((pt) => pt.x));
    const xMax = Math.max(...ptsTransformed.map((pt) => pt.x));
    const yMin = Math.min(...ptsTransformed.map((pt) => pt.y));
    const yMax = Math.max(...ptsTransformed.map((pt) => pt.y));
    const width = xMax - xMin;
    const height = yMax - yMin;

    const cx = xMin + (width / 2);
    const cy = yMin + (height / 2);
    const tAnchorBottom = p(topSize, topSize, 0);
    const contact = p(topSize / 2, topSize / 2, sideHeight);
    const { x: cxTop, y: cyTop } = p(topSize / 2, topSize / 2, 0);
    const dy = Math.abs(tAnchorBottom.y - cyTop);
    const cxBot = contact.x;
    const cyBot = contact.y;

    return {
        top,
        left,
        right,
        west,
        sideFaces: cabinet !== undefined ? ["left", "west"] : ["left", "right"],
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
    };
};

export type CubePaintFace = "top" | "left" | "right" | "west";

/** Screen Y of a face centre in board space — higher means closer to the viewer. */
const cubeFacePaintDepth = (
    face: CubePaintFace,
    topSize: number,
    sideHeight: number,
    params: IsoProjectionParams,
): number => {
    switch (face) {
        case "top":
            return projectOblique(topSize / 2, topSize / 2, 0, params).y;
        case "left":
            return projectOblique(topSize / 2, topSize, sideHeight / 2, params).y;
        case "right":
            return projectOblique(topSize, topSize / 2, sideHeight / 2, params).y;
        case "west":
            return projectOblique(0, topSize / 2, sideHeight / 2, params).y;
    }
};

/** Paint-order for cube faces: back (smaller screen Y) first, front last. */
export const cubeFacePaintOrder = (
    cube: Cube,
    sideHeight: number,
    topSize: number,
    params: IsoProjectionParams = ISO_PROJECTION_PRESETS.iso,
): CubePaintFace[] => {
    const faces: CubePaintFace[] = ["top"];
    if (sideHeight > 0) {
        for (const slot of cube.sideFaces) {
            faces.push(slot === "west" ? "west" : slot);
        }
    }
    return faces.sort((a, b) =>
        cubeFacePaintDepth(a, topSize, sideHeight, params) - cubeFacePaintDepth(b, topSize, sideHeight, params),
    );
};

export type CubeFaceFills = {
    top: FillData;
    left: FillData;
    right: FillData;
};

export const generateCubes = (opts: {
    rootSvg: Svg;
    heights: number[];
    stroke: StrokeData;
    fill: FillData;
    faceFills?: CubeFaceFills;
    idSymbol?: string;
    sides?: ("N" | "E" | "S" | "W")[];
    projection?: IsoProjectionParams;
}): void => {
    const { rootSvg, heights, stroke, fill, faceFills } = opts;
    const projection = opts.projection ?? ISO_PROJECTION_PRESETS.iso;
    const projectionSuffix = isoProjectionCacheSuffix(projection);
    const tSize = 100;
    const cabinet = usesLayeredCellDraw(projection);
    let sides: ("N" | "E" | "S" | "W")[] = ["N", "E", "S", "W"];
    if (opts.sides !== undefined) {
        sides = opts.sides;
    } else if (cabinet) {
        sides = ["W", "S"];
    }

    for (const sideHeight of heights) {
        const idTop = tSize.toString().replace(".", "_");
        const idSide = sideHeight.toString().replace(".", "_");
        const cube = genCube(tSize, sideHeight, projection);
        const dWidth = 0;
        const dHeight = 0;
        const minx = cube.xMin - (dWidth / 2);
        const miny = cube.yMin - (dHeight / 2);
        let idSymbol = `_isoCube_${idSide}`;
        if (opts.idSymbol !== undefined) {
            idSymbol = opts.idSymbol;
        }
        const nested = rootSvg.defs().nested().id(idSymbol)
            .attr("data-width-ratio", cube.width / tSize)
            .attr("data-dy-bottom", Math.abs(miny - cube.cyBot) / cube.height)
            .attr("data-dy-top", Math.abs(miny - cube.cyTop) / cube.height);
        const defs = nested.defs();
        let rectTop: SVGG | null = null;
        let sourceId = `isoRect${idTop}${projectionSuffix}`;
        if (opts.idSymbol !== undefined) {
            sourceId = `isoRect${idTop}_${opts.idSymbol}${projectionSuffix}`;
        }
        rectTop = defs.findOne("#" + sourceId) as SVGG | null;
        if (rectTop === null) {
            rectTop = defs.group().id(sourceId);
            rectTop.rect(tSize, tSize).fill(faceFills?.top ?? fill).stroke("none");
            if (sides.includes("N")) {
                rectTop.line(0, 0, tSize, 0).stroke({ linecap: "round", linejoin: "round", ...stroke });
            }
            if (sides.includes("E")) {
                rectTop.line(tSize, 0, tSize, tSize).stroke({ linecap: "round", linejoin: "round", ...stroke });
            }
            if (sides.includes("S")) {
                rectTop.line(tSize, tSize, 0, tSize).stroke({ linecap: "round", linejoin: "round", ...stroke });
            }
            if (sides.includes("W")) {
                rectTop.line(0, 0, 0, tSize).stroke({ linecap: "round", linejoin: "round", ...stroke });
            }
        }
        let rectSideLeft: SVGRect | null = null;
        let rectSideRight: SVGRect | null = null;
        if (sideHeight > 0 && sides.length > 0) {
            let sideSourceId = `isoRectSide${idSide}${projectionSuffix}`;
            if (opts.idSymbol !== undefined) {
                sideSourceId = `isoRectSide${idSide}_${opts.idSymbol}${projectionSuffix}`;
            }
            if (faceFills !== undefined) {
                const sideSourceIdLeft = `${sideSourceId}_L`;
                const sideSourceIdRight = `${sideSourceId}_R`;
                rectSideLeft = defs.findOne("#" + sideSourceIdLeft) as SVGRect | null;
                if (rectSideLeft === null) {
                    rectSideLeft = defs.rect(tSize, sideHeight).id(sideSourceIdLeft).fill(faceFills.left).stroke("none");
                }
                rectSideRight = defs.findOne("#" + sideSourceIdRight) as SVGRect | null;
                if (rectSideRight === null) {
                    rectSideRight = defs.rect(tSize, sideHeight).id(sideSourceIdRight).fill(faceFills.right).stroke("none");
                }
            } else {
                rectSideLeft = defs.findOne("#" + sideSourceId) as SVGRect | null;
                if (rectSideLeft === null) {
                    rectSideLeft = defs.rect(tSize, sideHeight).id(sideSourceId).fill(fill).stroke("none");
                }
            }

            const paintTop = (): void => {
                if (rectTop !== null) {
                    nested.use(rectTop).matrix(cube.top.toArray());
                }
            };

            const paintFace = (face: CubePaintFace): void => {
                if (face === "left" && cube.sideFaces.includes("left") && rectSideLeft !== null) {
                    nested.use(rectSideLeft).matrix(cube.left.toArray());
                } else if (face === "right" && cube.sideFaces.includes("right")) {
                    const sideRect = faceFills !== undefined ? rectSideRight : rectSideLeft;
                    if (sideRect !== null) {
                        nested.use(sideRect).matrix(cube.right.toArray());
                    }
                } else if (face === "west" && cube.sideFaces.includes("west")) {
                    const sideRect = faceFills !== undefined ? rectSideRight : rectSideLeft;
                    if (sideRect !== null) {
                        nested.use(sideRect).matrix(cube.west.toArray());
                    }
                } else if (face === "top") {
                    paintTop();
                }
            };
            for (const face of cubeFacePaintOrder(cube, sideHeight, tSize, projection)) {
                paintFace(face);
            }

            const a1: IPoint = cube.top.applyToPoint(tSize, 0);
            const a2: IPoint = cube.right.applyToPoint(tSize, sideHeight);
            const a3: IPoint = cube.right.applyToPoint(0, sideHeight);
            const a4: IPoint = cube.top.applyToPoint(tSize, tSize);
            const a5: IPoint = cube.left.applyToPoint(0, sideHeight);
            const a6: IPoint = cube.top.applyToPoint(0, tSize);
            const aWestTop: IPoint = cube.west.applyToPoint(0, 0);
            const aWestBot: IPoint = cube.west.applyToPoint(0, sideHeight);
            if (cabinet) {
                nested.line(aWestTop.x, aWestTop.y, aWestBot.x, aWestBot.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
                nested.line(aWestBot.x, aWestBot.y, a5.x, a5.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
                nested.line(a3.x, a3.y, a4.x, a4.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
                nested.line(a3.x, a3.y, a5.x, a5.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
                nested.line(a5.x, a5.y, a6.x, a6.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
            } else if ((!sides.includes("N") && !sides.includes("S")) || (!sides.includes("E") && !sides.includes("W"))) {
                nested.line(a2.x, a2.y, a3.x, a3.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
                nested.line(a3.x, a3.y, a5.x, a5.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
            } else if (!sides.includes("N")) {
                nested.line(a2.x, a2.y, a3.x, a3.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
                nested.line(a3.x, a3.y, a4.x, a4.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
                nested.line(a3.x, a3.y, a5.x, a5.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
                nested.line(a5.x, a5.y, a6.x, a6.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
            } else if (!sides.includes("E")) {
                nested.line(a1.x, a1.y, a2.x, a2.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
                nested.line(a2.x, a2.y, a3.x, a3.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
                nested.line(a5.x, a5.y, a3.x, a3.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
                nested.line(a5.x, a5.y, a6.x, a6.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
            } else if (!sides.includes("S")) {
                nested.line(a1.x, a1.y, a2.x, a2.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
                nested.line(a2.x, a2.y, a3.x, a3.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
                nested.line(a5.x, a5.y, a3.x, a3.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
                nested.line(a5.x, a5.y, a6.x, a6.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
            } else if (!sides.includes("W")) {
                nested.line(a1.x, a1.y, a2.x, a2.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
                nested.line(a3.x, a3.y, a2.x, a2.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
                nested.line(a3.x, a3.y, a4.x, a4.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
                nested.line(a3.x, a3.y, a5.x, a5.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
            } else {
                nested.line(a1.x, a1.y, a2.x, a2.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
                nested.line(a3.x, a3.y, a2.x, a2.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
                nested.line(a3.x, a3.y, a4.x, a4.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
                nested.line(a3.x, a3.y, a5.x, a5.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
                nested.line(a5.x, a5.y, a6.x, a6.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
            }
        } else if (sides.length > 0) {
            if (rectTop !== null) {
                nested.use(rectTop).matrix(cube.top.toArray());
            }
        }
        nested.viewbox([minx, miny, cube.width + dWidth, cube.height + dHeight].join(" "));
    }
};
