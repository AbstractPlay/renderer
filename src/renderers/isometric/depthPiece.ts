import { StrokeData, Svg } from "@svgdotjs/svg.js";
import { IsoPiece, Colourfuncs } from "../../schemas/schema";
import { generateCubes, CubeFaceFills } from "./cubes";
import { permuteCubeFacesForProjection, effectiveCubeYaw } from "./cubeOrientation";
import { generateCylinders } from "./cylinders";
import { generateCones } from "./cones";
import { generateHexes } from "./hexes";
import { generatePyramids } from "./pyramids";
import { resolvePyramidDims, isPyramidPiece } from "./pyramidDims";
import { ISO_PROJECTION_PRESETS, IsoProjectionParams } from "./projection";
import {
    depthBucketIndex,
    depthToNormalized,
    ISO_DEPTH_SHADE_STRENGTH,
    isoDepthModulate,
    isoShadeFace,
    isoShadeFaces,
    IsoFaceFills,
} from "./shading";
import { isMultiFaceCube, isoPieceHeight } from "./stack";
import { effectiveRotatedPiece, generateIsoLintelOrSpacer } from "./pieceSymbols";
import { boardHexOrientation, isSpacerPiece, parseLintelPiece } from "./lintels";

export type IsoOverlayApplier = (idSymbol: string, pc: IsoPiece, effectiveYaw: number) => void;

type ResolveColourFn = (colour: string | number | Colourfuncs, fallback?: string) => string;

const modulateFaceFills = (
    fills: IsoFaceFills,
    normalizedDepth: number,
    strength: number = ISO_DEPTH_SHADE_STRENGTH,
): CubeFaceFills => ({
    top: { color: isoDepthModulate(fills.top, normalizedDepth, strength) },
    left: { color: isoDepthModulate(fills.left, normalizedDepth, strength) },
    right: { color: isoDepthModulate(fills.right, normalizedDepth, strength) },
});

const generateDepthShadedSymbol = (opts: {
    rootSvg: Svg;
    shadedId: string;
    pc: IsoPiece;
    yaw: number;
    numRotations: number;
    normalizedDepth: number;
    pieceStroke: StrokeData;
    resolveColour: ResolveColourFn;
    projection?: IsoProjectionParams;
    overlayApplier?: IsoOverlayApplier;
}): void => {
    const { rootSvg, shadedId, pc, yaw, numRotations, normalizedDepth, pieceStroke, resolveColour } = opts;
    const projection = opts.projection ?? ISO_PROJECTION_PRESETS.iso;
    const effPiece = effectiveRotatedPiece(pc.piece, numRotations);
    const effectiveYaw = effectiveCubeYaw(yaw, numRotations * 90);

    const finish = (): void => {
        opts.overlayApplier?.(shadedId, pc, effectiveYaw);
    };

    if (isMultiFaceCube(pc)) {
        const effectiveYawFace = effectiveCubeYaw(yaw, numRotations * 90);
        const visible = permuteCubeFacesForProjection(pc.faces, effectiveYawFace, projection);
        const top = resolveColour(visible.top, "#000") as string;
        const left = resolveColour(visible.left, "#000") as string;
        const right = resolveColour(visible.right, "#000") as string;
        const faceFills: CubeFaceFills = {
            top: { color: isoDepthModulate(isoShadeFace(top, "top"), normalizedDepth) },
            left: { color: isoDepthModulate(isoShadeFace(left, "left"), normalizedDepth) },
            right: { color: isoDepthModulate(isoShadeFace(right, "right"), normalizedDepth) },
        };
        generateCubes({
            rootSvg,
            projection,
            heights: [isoPieceHeight(pc)],
            stroke: pieceStroke,
            fill: faceFills.top,
            faceFills,
            idSymbol: shadedId,
        });
        finish();
        return;
    }

    if (isSpacerPiece(pc.piece) || parseLintelPiece(pc.piece) !== null) {
        const spacerFill = { color: "transparent" };
        const fills = isSpacerPiece(pc.piece)
            ? { top: spacerFill, left: spacerFill, right: spacerFill }
            : modulateFaceFills(
                isoShadeFaces(resolveColour((pc as { colour: string }).colour, "#000") as string),
                normalizedDepth,
            );
        generateIsoLintelOrSpacer({
            rootSvg,
            piece: pc.piece,
            projection,
            heights: [isoPieceHeight(pc)],
            stroke: pieceStroke,
            fill: fills.top,
            faceFills: fills,
            idSymbol: shadedId,
            numRotations,
        });
        if (!isSpacerPiece(pc.piece)) {
            finish();
        }
        return;
    }

    if (!("colour" in pc)) {
        throw new Error(`Legend entry for depth shading is missing colour.`);
    }

    const base = resolveColour(pc.colour, "#000") as string;
    const fills = modulateFaceFills(isoShadeFaces(base), normalizedDepth);

    if (effPiece === "cube") {
        generateCubes({ rootSvg, projection, heights: [isoPieceHeight(pc)], stroke: pieceStroke, fill: fills.top, faceFills: fills, idSymbol: shadedId });
    } else if (effPiece === "cylinder") {
        generateCylinders({ rootSvg, projection, heights: [isoPieceHeight(pc)], stroke: pieceStroke, fill: fills.top, faceFills: fills, idSymbol: shadedId });
    } else if (effPiece === "cone") {
        generateCones({ rootSvg, projection, heights: [isoPieceHeight(pc)], stroke: pieceStroke, fill: fills.top, faceFills: fills, idSymbol: shadedId });
    } else if (effPiece === "pyramid" && isPyramidPiece(pc)) {
        generatePyramids({
            rootSvg,
            projection,
            dims: [resolvePyramidDims(pc)],
            stroke: pieceStroke,
            fill: { color: base },
            baseHex: base,
            modulateColor: (colour) => isoDepthModulate(colour, normalizedDepth),
            idSymbol: shadedId,
        });
    } else if (effPiece === "hexp" || effPiece === "hexf") {
        generateHexes({
            rootSvg,
            projection,
            heights: [isoPieceHeight(pc)],
            stroke: pieceStroke,
            fill: fills.top,
            faceFills: fills,
            idSymbol: shadedId,
            orientation: boardHexOrientation(numRotations),
        });
    } else {
        throw new Error(`Unrecognized isoPiece type "${effPiece}" for depth shading.`);
    }
    finish();
};

/**
 * Return a depth-shaded symbol id for board placement, generating and caching the symbol
 * in defs on first use.
 */
export const resolveDepthShadedPieceId = (opts: {
    rootSvg: Svg;
    glyph: string;
    pieceId: string;
    yaw: number;
    legend: { [k: string]: IsoPiece };
    depth: number;
    minDepth: number;
    maxDepth: number;
    numRotations: number;
    pieceStroke: StrokeData;
    resolveColour: ResolveColourFn;
    projection?: IsoProjectionParams;
    overlayApplier?: IsoOverlayApplier;
}): string => {
    const normalizedDepth = depthToNormalized(opts.depth, opts.minDepth, opts.maxDepth);
    const bucket = depthBucketIndex(normalizedDepth);
    const shadedId = `${opts.pieceId}__db${bucket}`;
    if (opts.rootSvg.findOne(`#${shadedId}`) !== null) {
        return shadedId;
    }
    const pc = opts.legend[opts.glyph];
    if (pc === undefined) {
        return opts.pieceId;
    }
    generateDepthShadedSymbol({
        rootSvg: opts.rootSvg,
        shadedId,
        pc,
        yaw: opts.yaw,
        numRotations: opts.numRotations,
        normalizedDepth,
        pieceStroke: opts.pieceStroke,
        resolveColour: opts.resolveColour,
        projection: opts.projection,
        overlayApplier: opts.overlayApplier,
    });
    return shadedId;
};
