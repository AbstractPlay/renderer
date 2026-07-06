import { FillData, StrokeData, Svg } from "@svgdotjs/svg.js";
import { IPoint } from "../../grids";
import { ISO_PROJECTION_PRESETS, IsoProjectionParams, projectOblique, usesLayeredCellDraw } from "./projection";
import { isoShadeFace, IsoFaceRole } from "./shading";
import { ICEHOUSE_LARGE_BASE, PyramidDims } from "./pyramidDims";

export type PyramidFace = "north" | "east" | "south" | "west";

export type Pyramid = {
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
    faces: Record<PyramidFace, [IPoint, IPoint, IPoint]>;
};

const genPyramid = (
    baseSize: number,
    sideHeight: number,
    params: IsoProjectionParams = ISO_PROJECTION_PRESETS.iso,
): Pyramid => {
    const p = (x: number, y: number, z: number): IPoint => projectOblique(x, y, z, params);
    const apex = p(baseSize / 2, baseSize / 2, 0);
    const nw = p(0, 0, sideHeight);
    const ne = p(baseSize, 0, sideHeight);
    const se = p(baseSize, baseSize, sideHeight);
    const sw = p(0, baseSize, sideHeight);
    const faces: Record<PyramidFace, [IPoint, IPoint, IPoint]> = {
        north: [apex, nw, ne],
        east: [apex, ne, se],
        south: [apex, se, sw],
        west: [apex, sw, nw],
    };

    const silhouette = [apex, nw, ne, se, sw];
    const xMin = Math.min(...silhouette.map((pt) => pt.x));
    const xMax = Math.max(...silhouette.map((pt) => pt.x));
    const yMin = Math.min(...silhouette.map((pt) => pt.y));
    const yMax = Math.max(...silhouette.map((pt) => pt.y));
    const width = xMax - xMin;
    const height = yMax - yMin;
    const cx = xMin + (width / 2);
    const cy = yMin + (height / 2);
    const ctrBase = p(baseSize / 2, baseSize / 2, sideHeight);

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
        faces,
    };
};

const facePaintDepth = (pts: [IPoint, IPoint, IPoint]): number =>
    (pts[0].y + pts[1].y + pts[2].y) / 3;

const visibleFaces = (projection: IsoProjectionParams): PyramidFace[] => {
    if (usesLayeredCellDraw(projection)) {
        return ["south", "west"];
    }
    return ["south", "east"];
};

/** Silhouette edges only — omit hidden ridges that would cut across visible faces. */
const silhouetteOutlineEdges = (
    pyramid: Pyramid,
    projection: IsoProjectionParams,
): [IPoint, IPoint][] => {
    const [, nw, ne] = pyramid.faces.north;
    const [, , se] = pyramid.faces.east;
    const [, , sw] = pyramid.faces.south;
    if (usesLayeredCellDraw(projection)) {
        return [[pyramid.apex, nw], [nw, sw], [sw, se], [pyramid.apex, se]];
    }
    return [[pyramid.apex, ne], [ne, se], [se, sw], [pyramid.apex, sw]];
};

/** Compass faces use the same upper-left light convention as cubes (south = lit, east/west = darker). */
const PYRAMID_FACE_SHADE: Record<PyramidFace, IsoFaceRole> = {
    north: "right",
    east: "right",
    south: "left",
    west: "right",
};

const trianglePath = ([a, b, c]: [IPoint, IPoint, IPoint]): string =>
    `M ${a.x} ${a.y} L ${b.x} ${b.y} L ${c.x} ${c.y} Z`;

export const generatePyramids = (opts: {
    rootSvg: Svg;
    dims: PyramidDims[];
    stroke: StrokeData;
    fill: FillData;
    baseHex?: string;
    modulateColor?: (colour: string) => string;
    idSymbol?: string;
    projection?: IsoProjectionParams;
}): void => {
    const { rootSvg, dims, stroke, fill } = opts;
    const projection = opts.projection ?? ISO_PROJECTION_PRESETS.iso;
    const baseHex = opts.baseHex ?? (typeof fill.color === "string" ? fill.color : "#000");
    const modulate = opts.modulateColor ?? ((c: string) => c);

    for (const { baseSize, sideHeight } of dims) {
        const pyramid = genPyramid(baseSize, sideHeight, projection);
        const dWidth = 0;
        const dHeight = 0;
        const minx = pyramid.xMin - (dWidth / 2);
        const miny = pyramid.yMin - (dHeight / 2);
        const idBase = baseSize.toString().replace(".", "_");
        const idSide = sideHeight.toString().replace(".", "_");
        let idSymbol = `_isoPyramid_${idBase}_${idSide}`;
        if (opts.idSymbol !== undefined) {
            idSymbol = opts.idSymbol;
        }
        const nested = rootSvg.defs().nested().id(idSymbol)
            .attr("data-width-ratio", pyramid.width / ICEHOUSE_LARGE_BASE)
            .attr("data-dy-bottom", Math.abs(miny - pyramid.cyBot) / pyramid.height)
            .attr("data-dy-top", Math.abs(miny - pyramid.cyTop) / pyramid.height);

        if (sideHeight > 0) {
            const faces = visibleFaces(projection)
                .sort((a, b) => facePaintDepth(pyramid.faces[a]) - facePaintDepth(pyramid.faces[b]));
            for (const face of faces) {
                const pts = pyramid.faces[face];
                const shaded = modulate(
                    opts.baseHex !== undefined
                        ? isoShadeFace(baseHex, PYRAMID_FACE_SHADE[face])
                        : baseHex,
                );
                nested.path(trianglePath(pts))
                    .fill({ color: shaded })
                    .stroke({ linecap: "round", linejoin: "round", ...stroke });
            }

            for (const [a, b] of silhouetteOutlineEdges(pyramid, projection)) {
                nested.line(a.x, a.y, b.x, b.y).stroke({ linecap: "round", linejoin: "round", ...stroke });
            }
        }
        nested.viewbox([minx, miny, pyramid.width + dWidth, pyramid.height + dHeight].join(" "));
    }
};
