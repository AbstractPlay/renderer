import { StrokeData, Svg } from "@svgdotjs/svg.js";
import { FillData } from "@svgdotjs/svg.js";
import { IsometricPieces } from "../../schemas/schema.js";
import { generateCubes, CubeFaceFills } from "./cubes.js";
import { generateHexes } from "./hexes.js";
import { ISO_PROJECTION_PRESETS, IsoProjectionParams } from "./projection.js";
import {
    boardHexOrientation,
    drawnCubeEdges,
    effectiveLintelPiece,
    isLintelPiece,
    isSpacerPiece,
    parseLintelPiece,
    resolveHexLintelDrawnEdges,
} from "./lintels.js";
import type { APRenderRep } from "../../schemas/schema.js";

type RenderLegend = NonNullable<APRenderRep["legend"]>;

const legendPieceName = (entry: RenderLegend[string] | undefined): string | undefined => {
    if (entry === undefined || typeof entry !== "object" || Array.isArray(entry)) {
        return undefined;
    }
    if ("piece" in entry && typeof entry.piece === "string") {
        return entry.piece;
    }
    return undefined;
};

/** Scale factor for board/stack placement of an isometric piece glyph. */
export const isoBoardPieceScale = (
    glyph: string,
    legend: RenderLegend | undefined,
    basePcScale: number,
): number => {
    const piece = legendPieceName(legend?.[glyph]);
    const lintel = piece !== undefined && isLintelPiece(piece);
    let pcScale = lintel ? 1 : 0.75;
    const legendEntry = legend?.[glyph];
    if (
        legendEntry !== undefined
        && typeof legendEntry === "object"
        && !Array.isArray(legendEntry)
        && "scale" in legendEntry
        && legendEntry.scale !== undefined
    ) {
        pcScale = legendEntry.scale as number;
    }
    if (lintel) {
        return pcScale;
    }
    return pcScale * basePcScale;
};

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
