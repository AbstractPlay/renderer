import { IsoPiece } from "../../schemas/schema";
import { IsoFaceGlyphComposer, paintIsoDecorOnSymbol } from "./faceOverlays";
import { resolveFaceInset } from "./faceGlyphFit";
import { boardHexOrientation, parseLintelPiece } from "./lintels";
import { assertIsoOverlayValid, isoOverlayFromPiece } from "./isoOverlayPiece";
import { isoPieceHeight } from "./stack";
import { IsoProjectionParams } from "./projection";
import { Svg } from "@svgdotjs/svg.js";

export const applyIsoPieceOverlays = (opts: {
    rootSvg: Svg;
    idSymbol: string;
    pc: IsoPiece;
    projection: IsoProjectionParams;
    effectiveYaw: number;
    numRotations: number;
    effPiece: string;
    composer: IsoFaceGlyphComposer;
}): void => {
    assertIsoOverlayValid(opts.pc);
    const spec = isoOverlayFromPiece(opts.pc);
    if (spec === undefined) {
        return;
    }
    const parsed = parseLintelPiece(opts.pc.piece);
    const isHexTop =
        opts.effPiece === "hexp"
        || opts.effPiece === "hexf"
        || (parsed !== null && parsed.kind === "hex");
    const isCylinderTop = opts.effPiece === "cylinder";
    paintIsoDecorOnSymbol({
        rootSvg: opts.rootSvg,
        idSymbol: opts.idSymbol,
        projection: opts.projection,
        sideHeight: isoPieceHeight(opts.pc),
        decor: spec.decor,
        topGlyphs: spec.top,
        topFace: isHexTop ? "hex" : isCylinderTop ? "cylinder" : undefined,
        effectiveYaw: opts.effectiveYaw,
        hexOrientation: isHexTop ? boardHexOrientation(opts.numRotations) : undefined,
        composer: opts.composer,
        faceInset: resolveFaceInset(opts.pc),
    });
};
