import { StrokeData, Svg } from "@svgdotjs/svg.js";
import { FillData } from "@svgdotjs/svg.js";
import { IsometricPieces } from "../../schemas/schema";
import { generateCubes, CubeFaceFills } from "./cubes";
import { generateHexes } from "./hexes";
import { ISO_PROJECTION_PRESETS, IsoProjectionParams } from "./projection";
import {
    boardHexOrientation,
    drawnCubeEdges,
    effectiveLintelPiece,
    isSpacerPiece,
    parseLintelPiece,
    resolveHexLintelDrawnEdges,
} from "./lintels";

export const effectiveRotatedPiece = (
    piece: IsometricPieces | string,
    numRotations: number,
): IsometricPieces | string => {
    if (numRotations === 0) {
        return piece;
    }
    const parsed = parseLintelPiece(piece);
    if (parsed?.kind === "hex") {
        return piece;
    }
    return effectiveLintelPiece(piece as IsometricPieces, numRotations);
};

export const generateIsoLintelOrSpacer = (opts: {
    rootSvg: Svg;
    piece: IsometricPieces | string;
    projection?: IsoProjectionParams;
    heights: number[];
    stroke: StrokeData;
    fill: FillData;
    faceFills?: CubeFaceFills;
    idSymbol: string;
    numRotations: number;
}): boolean => {
    const projection = opts.projection ?? ISO_PROJECTION_PRESETS.iso;

    if (isSpacerPiece(opts.piece)) {
        if (opts.piece === "spaceCube") {
            generateCubes({
                rootSvg: opts.rootSvg,
                projection,
                heights: opts.heights,
                stroke: opts.stroke,
                fill: opts.fill,
                faceFills: opts.faceFills,
                idSymbol: opts.idSymbol,
                sides: [],
            });
        } else {
            generateHexes({
                rootSvg: opts.rootSvg,
                projection,
                heights: opts.heights,
                stroke: opts.stroke,
                fill: opts.fill,
                faceFills: opts.faceFills,
                idSymbol: opts.idSymbol,
                orientation: boardHexOrientation(opts.numRotations),
                drawnEdges: [],
            });
        }
        return true;
    }

    const parsed = parseLintelPiece(opts.piece);
    if (parsed === null) {
        return false;
    }

    if (parsed.kind === "cube") {
        const cubePiece = opts.numRotations > 0
            ? effectiveLintelPiece(opts.piece as IsometricPieces, opts.numRotations)
            : opts.piece;
        const cubeParsed = parseLintelPiece(cubePiece);
        if (cubeParsed === null || cubeParsed.kind !== "cube") {
            return false;
        }
        generateCubes({
            rootSvg: opts.rootSvg,
            projection,
            heights: opts.heights,
            stroke: opts.stroke,
            fill: opts.fill,
            faceFills: opts.faceFills,
            idSymbol: opts.idSymbol,
            sides: drawnCubeEdges(cubeParsed.omitted),
        });
        return true;
    }

    const { orientation, drawnEdges } = resolveHexLintelDrawnEdges(
        parsed.orientation,
        parsed.omitted,
        opts.numRotations,
    );
    generateHexes({
        rootSvg: opts.rootSvg,
        projection,
        heights: opts.heights,
        stroke: opts.stroke,
        fill: opts.fill,
        faceFills: opts.faceFills,
        idSymbol: opts.idSymbol,
        orientation,
        drawnEdges,
    });
    return true;
};
