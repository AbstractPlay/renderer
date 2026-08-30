import { IsoPiece } from "../../schemas/schema.js";
import { IsoFaceGlyphComposer, paintIsoDecorOnSymbol } from "./faceOverlays.js";
import { resolveFaceInset } from "./faceGlyphFit.js";
import { boardHexOrientation, parseLintelPiece } from "./lintels.js";
import { assertIsoOverlayValid, isoOverlayFromPiece } from "./isoOverlayPiece.js";
import { isoPieceHeight } from "./stack.js";
import { IsoProjectionParams } from "./projection.js";
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
