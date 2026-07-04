import { StrokeData, Svg } from "@svgdotjs/svg.js";
import { Orientation } from "honeycomb-grid";
import { IsometricPieces, IsoPiece, Colourfuncs } from "../../schemas/schema";
import { generateCubes, CubeFaceFills } from "./cubes";
import { permuteCubeFacesForProjection } from "./cubeOrientation";
import { generateCylinders } from "./cylinders";
import { generateHexes } from "./hexes";
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
import { isMultiFaceCube } from "./stack";

const rotationMap = new Map<IsometricPieces, Map<number, IsometricPieces>>([
    ["lintelN", new Map([[1, "lintelE"], [2, "lintelS"], [3, "lintelW"]])],
    ["lintelE", new Map([[1, "lintelS"], [2, "lintelW"], [3, "lintelN"]])],
    ["lintelS", new Map([[1, "lintelW"], [2, "lintelN"], [3, "lintelE"]])],
    ["lintelW", new Map([[1, "lintelN"], [2, "lintelE"], [3, "lintelS"]])],
    ["lintelNS", new Map([[1, "lintelEW"], [2, "lintelNS"], [3, "lintelEW"]])],
    ["lintelEW", new Map([[1, "lintelNS"], [2, "lintelEW"], [3, "lintelNS"]])],
]);

const lintelSides: Partial<Record<IsometricPieces, ("N" | "E" | "S" | "W")[]>> = {
    lintelN: ["E", "S", "W"],
    lintelE: ["N", "S", "W"],
    lintelS: ["E", "N", "W"],
    lintelW: ["E", "S", "N"],
    lintelNS: ["E", "W"],
    lintelEW: ["N", "S"],
    spaceCube: [],
};

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

const effectivePieceType = (pc: IsoPiece, numRotations: number): IsometricPieces => {
    let effPiece = pc.piece;
    if (numRotations > 0 && rotationMap.has(pc.piece)) {
        const next = rotationMap.get(pc.piece)!;
        if (next.has(numRotations)) {
            effPiece = next.get(numRotations)!;
        }
    }
    return effPiece;
};

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
}): void => {
    const { rootSvg, shadedId, pc, yaw, numRotations, normalizedDepth, pieceStroke, resolveColour } = opts;
    const projection = opts.projection ?? ISO_PROJECTION_PRESETS.iso;
    const effPiece = effectivePieceType(pc, numRotations);

    if (isMultiFaceCube(pc)) {
        const visible = permuteCubeFacesForProjection(pc.faces, yaw, projection);
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
            heights: [pc.height ?? 100],
            stroke: pieceStroke,
            fill: faceFills.top,
            faceFills,
            idSymbol: shadedId,
        });
        return;
    }

    if (!("colour" in pc)) {
        throw new Error(`Legend entry for depth shading is missing colour.`);
    }

    const base = resolveColour(pc.colour, "#000") as string;
    const fills = modulateFaceFills(isoShadeFaces(base), normalizedDepth);

    if (effPiece === "cube") {
        generateCubes({ rootSvg, projection, heights: [pc.height], stroke: pieceStroke, fill: fills.top, faceFills: fills, idSymbol: shadedId });
    } else if (effPiece in lintelSides) {
        generateCubes({
            rootSvg,
            projection,
            heights: [pc.height],
            stroke: pieceStroke,
            fill: fills.top,
            faceFills: fills,
            idSymbol: shadedId,
            sides: lintelSides[effPiece],
        });
    } else if (effPiece === "cylinder") {
        generateCylinders({ rootSvg, projection, heights: [pc.height], stroke: pieceStroke, fill: fills.top, faceFills: fills, idSymbol: shadedId });
    } else if (effPiece === "hexp") {
        generateHexes({
            rootSvg,
            projection,
            heights: [pc.height],
            stroke: pieceStroke,
            fill: fills.top,
            faceFills: fills,
            idSymbol: shadedId,
            orientation: Orientation.POINTY,
        });
    } else if (effPiece === "hexf") {
        generateHexes({
            rootSvg,
            projection,
            heights: [pc.height],
            stroke: pieceStroke,
            fill: fills.top,
            faceFills: fills,
            idSymbol: shadedId,
            orientation: Orientation.FLAT,
        });
    } else {
        throw new Error(`Unrecognized isoPiece type "${effPiece}" for depth shading.`);
    }
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
    });
    return shadedId;
};
