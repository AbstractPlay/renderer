import { Svg } from "@svgdotjs/svg.js";
import { Matrix } from "transformation-matrix-js";
import { Glyph, IsoFaceDecor } from "../../schemas/schema";
import { Cube, CubePaintFace, genCube } from "./cubes";
import { genCylinder } from "./cylinders";
import { genHex } from "./hexes";
import { centroid } from "../../common/plotting";
import {
    applyIsoAffineMatrix,
    hexTopOverlayPrepMatrix,
    ISO_FACE_UNIT,
    IsoFaceComposeContext,
    multiplyIsoAffine,
    projectedTopCenterMatrix,
    computeMaxCenteredSquareSide,
    type ProjectedTopSilhouette,
} from "./faceGlyphFit";
import { buildIsoProjectionMatrix, ISO_PROJECTION_PRESETS, IsoProjectionParams, usesLayeredCellDraw } from "./projection";
import { Orientation } from "honeycomb-grid";

export type IsoFaceGlyphComposer = (glyphs: Glyph[], ctx: IsoFaceComposeContext) => Svg;

type IsoIntrinsicFace = keyof IsoFaceDecor;

const INTRINSIC_BY_LEFT: Record<number, IsoIntrinsicFace> = {
    0: "south",
    1: "east",
    2: "north",
    3: "west",
};

const INTRINSIC_BY_RIGHT: Record<number, IsoIntrinsicFace> = {
    0: "east",
    1: "north",
    2: "west",
    3: "south",
};

const intrinsicDecorForPaintFace = (
    paintFace: CubePaintFace,
    effectiveYaw: number,
    cabinet: boolean,
): IsoIntrinsicFace | null => {
    const yaw = ((effectiveYaw % 4) + 4) % 4;
    if (paintFace === "top") {
        return "top";
    }
    if (paintFace === "left") {
        return INTRINSIC_BY_LEFT[yaw] ?? null;
    }
    if (paintFace === "right") {
        return INTRINSIC_BY_RIGHT[yaw] ?? null;
    }
    if (paintFace === "west" && cabinet) {
        return "west";
    }
    return null;
};

const cubeFaceMatrix = (cube: Cube, paintFace: CubePaintFace): Matrix => {
    switch (paintFace) {
        case "top":
            return cube.top;
        case "left":
            return cube.left;
        case "right":
            return cube.right;
        case "west":
            return cube.west;
    }
};

const paintGlyphsOnFaceLayer = (
    nested: Svg,
    faceMatrix: Matrix,
    layer: Svg,
    opts: { localW: number; localH: number; prep?: Matrix },
): void => {
    const outer = nested.group();
    applyIsoAffineMatrix(outer, faceMatrix);
    let host = outer;
    if (opts.prep !== undefined) {
        const prepGroup = outer.group();
        applyIsoAffineMatrix(prepGroup, opts.prep);
        host = prepGroup;
    }
    host.use(layer).size(opts.localW, opts.localH).move(0, 0);
};

const paintGlyphsOnCubeFace = (
    nested: Svg,
    faceMatrix: Matrix,
    glyphs: Glyph[],
    composer: IsoFaceGlyphComposer,
    ctx: IsoFaceComposeContext,
): void => {
    const layer = composer(glyphs, ctx);
    paintGlyphsOnFaceLayer(nested, faceMatrix, layer, { localW: ctx.localW, localH: ctx.localH });
};

const paintGlyphsOnProjectedTop = (
    nested: Svg,
    prep: Matrix,
    projection: Matrix,
    glyphs: Glyph[],
    composer: IsoFaceGlyphComposer,
    ctx: IsoFaceComposeContext,
): void => {
    const layer = composer(glyphs, ctx);
    paintGlyphsOnFaceLayer(nested, projection, layer, {
        prep,
        localW: ctx.localW,
        localH: ctx.localH,
    });
};

export const paintCubeDecorOverlays = (opts: {
    nested: Svg;
    hostSymbolId: string;
    topSize: number;
    sideHeight: number;
    projection: IsoProjectionParams;
    decor: IsoFaceDecor;
    effectiveYaw: number;
    composer: IsoFaceGlyphComposer;
    faceInset: number;
}): void => {
    const { nested, hostSymbolId, topSize, sideHeight, projection, decor, effectiveYaw, composer, faceInset } = opts;
    const cube = genCube(topSize, sideHeight, projection);
    const cabinet = usesLayeredCellDraw(projection);
    const paintFaces: CubePaintFace[] = ["top"];
    if (sideHeight > 0) {
        for (const slot of cube.sideFaces) {
            paintFaces.push(slot === "west" ? "west" : slot);
        }
    }
    for (const paintFace of paintFaces) {
        const intrinsic = intrinsicDecorForPaintFace(paintFace, effectiveYaw, cabinet);
        if (intrinsic === null) {
            continue;
        }
        const glyphs = decor[intrinsic];
        if (glyphs === undefined || glyphs.length === 0) {
            continue;
        }
        const localH = paintFace === "top" ? topSize : sideHeight;
        const matrix = cubeFaceMatrix(cube, paintFace);
        const ctxBase: IsoFaceComposeContext = {
            faceKey: intrinsic,
            hostSymbolId,
            localW: topSize,
            localH,
            faceInset,
            mapping: "cubeUv",
            counterRotateWithBoard: paintFace === "top",
            maxSquareSide: topSize,
            paintFace,
        };
        const ctx: IsoFaceComposeContext = {
            ...ctxBase,
            maxSquareSide: computeMaxCenteredSquareSide(ctxBase, matrix),
        };
        paintGlyphsOnCubeFace(nested, matrix, glyphs, composer, ctx);
    }
};

export const paintCylinderTopOverlays = (opts: {
    nested: Svg;
    hostSymbolId: string;
    topSize: number;
    sideHeight: number;
    projection: IsoProjectionParams;
    glyphs: Glyph[];
    composer: IsoFaceGlyphComposer;
    faceInset: number;
}): void => {
    const { nested, hostSymbolId, topSize, sideHeight, projection, glyphs, composer, faceInset } = opts;
    const cylinder = genCylinder(topSize, sideHeight, projection);
    const faceMatrix = buildIsoProjectionMatrix(projection);
    const prep = projectedTopCenterMatrix(topSize);
    const combined = multiplyIsoAffine(faceMatrix, prep);
    const silhouette: ProjectedTopSilhouette = {
        kind: "ellipse",
        cx: cylinder.cxTop,
        cy: cylinder.cyTop,
        rx: cylinder.rx,
        ry: cylinder.ry,
    };
    const ctxBase: IsoFaceComposeContext = {
        faceKey: "top",
        hostSymbolId,
        localW: topSize,
        localH: topSize,
        faceInset,
        mapping: "projectedTop",
        counterRotateWithBoard: true,
        maxSquareSide: topSize,
        paintFace: "top",
    };
    const ctx: IsoFaceComposeContext = {
        ...ctxBase,
        maxSquareSide: computeMaxCenteredSquareSide(ctxBase, combined, silhouette),
    };
    paintGlyphsOnProjectedTop(
        nested,
        prep,
        faceMatrix,
        glyphs,
        composer,
        ctx,
    );
};

export const paintHexTopOverlays = (opts: {
    nested: Svg;
    hostSymbolId: string;
    topSize: number;
    sideHeight: number;
    orientation: Orientation;
    projection: IsoProjectionParams;
    glyphs: Glyph[];
    composer: IsoFaceGlyphComposer;
    faceInset: number;
}): void => {
    const { nested, hostSymbolId, topSize, sideHeight, orientation, projection, glyphs, composer, faceInset } = opts;
    const hex = genHex(topSize, sideHeight, orientation, projection);
    const faceMatrix = buildIsoProjectionMatrix(projection);
    const prep = hexTopOverlayPrepMatrix(hex, topSize);
    const combined = multiplyIsoAffine(faceMatrix, prep);
    const cWorld = centroid(hex.corners)!;
    const half = topSize / 2;
    const silhouette: ProjectedTopSilhouette = {
        kind: "polygon",
        points: hex.corners.map((c) =>
            combined.applyToPoint(c.x - cWorld.x + half, c.y - cWorld.y + half),
        ),
    };
    const ctxBase: IsoFaceComposeContext = {
        faceKey: "top",
        hostSymbolId,
        localW: topSize,
        localH: topSize,
        faceInset,
        mapping: "projectedTop",
        counterRotateWithBoard: true,
        maxSquareSide: topSize,
        paintFace: "top",
    };
    const ctx: IsoFaceComposeContext = {
        ...ctxBase,
        maxSquareSide: computeMaxCenteredSquareSide(ctxBase, combined, silhouette),
    };
    paintGlyphsOnProjectedTop(
        nested,
        prep,
        faceMatrix,
        glyphs,
        composer,
        ctx,
    );
};

export const paintIsoDecorOnSymbol = (opts: {
    rootSvg: Svg;
    idSymbol: string;
    projection?: IsoProjectionParams;
    sideHeight: number;
    decor?: IsoFaceDecor;
    topGlyphs?: Glyph[];
    topFace?: "cylinder" | "hex";
    effectiveYaw?: number;
    hexOrientation?: Orientation;
    composer: IsoFaceGlyphComposer;
    faceInset: number;
}): void => {
    const projection = opts.projection ?? ISO_PROJECTION_PRESETS.iso;
    const nested = opts.rootSvg.findOne(`#${opts.idSymbol}`) as Svg | null;
    if (nested === null) {
        return;
    }
    const tSize = ISO_FACE_UNIT;

    if (opts.decor !== undefined) {
        paintCubeDecorOverlays({
            nested,
            hostSymbolId: opts.idSymbol,
            topSize: tSize,
            sideHeight: opts.sideHeight,
            projection,
            decor: opts.decor,
            effectiveYaw: opts.effectiveYaw ?? 0,
            composer: opts.composer,
            faceInset: opts.faceInset,
        });
    }
    if (opts.topGlyphs !== undefined && opts.topGlyphs.length > 0) {
        if (opts.topFace === "hex" && opts.hexOrientation !== undefined) {
            paintHexTopOverlays({
                nested,
                hostSymbolId: opts.idSymbol,
                topSize: tSize,
                sideHeight: opts.sideHeight,
                orientation: opts.hexOrientation,
                projection,
                glyphs: opts.topGlyphs,
                composer: opts.composer,
                faceInset: opts.faceInset,
            });
        } else if (opts.topFace === "cylinder") {
            paintCylinderTopOverlays({
                nested,
                hostSymbolId: opts.idSymbol,
                topSize: tSize,
                sideHeight: opts.sideHeight,
                projection,
                glyphs: opts.topGlyphs,
                composer: opts.composer,
                faceInset: opts.faceInset,
            });
        }
    }
};
