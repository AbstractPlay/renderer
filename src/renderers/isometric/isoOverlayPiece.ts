import { Glyph, IsoFaceDecor, IsoPiece } from "../../schemas/schema";
import { isSpacerPiece, parseLintelPiece } from "./lintels";

export type IsoOverlaySpec = {
    top?: Glyph[];
    decor?: IsoFaceDecor;
};

/** True when a legend value is an isometric 3D piece definition (not a flat glyph composite). */
export const isIsoLegendPiece = (entry: unknown): entry is IsoPiece =>
    typeof entry === "object" && entry !== null && !Array.isArray(entry) && "piece" in entry;

export const isoOverlayFromPiece = (pc: IsoPiece): IsoOverlaySpec | undefined => {
    const top = "top" in pc && pc.top !== undefined && pc.top.length > 0 ? pc.top : undefined;
    const decor = "decor" in pc && pc.decor !== undefined ? pc.decor : undefined;
    if (top === undefined && decor === undefined) {
        return undefined;
    }
    return { top, decor };
};

export const collectIsoOverlayGlyphs = (pc: IsoPiece): Glyph[] => {
    const spec = isoOverlayFromPiece(pc);
    if (spec === undefined) {
        return [];
    }
    const glyphs: Glyph[] = [];
    if (spec.top !== undefined) {
        glyphs.push(...spec.top);
    }
    if (spec.decor !== undefined) {
        for (const key of Object.keys(spec.decor) as (keyof IsoFaceDecor)[]) {
            const list = spec.decor[key];
            if (list !== undefined) {
                glyphs.push(...list);
            }
        }
    }
    return glyphs;
};

const isHexLintelPiece = (piece: string): boolean =>
    piece.startsWith("lintelp_") || piece.startsWith("lintelf_") || piece === "spaceHex";

export const pieceUsesTopOverlay = (piece: string): boolean => {
    if (piece === "cylinder" || piece === "hexp" || piece === "hexf") {
        return true;
    }
    return isHexLintelPiece(piece);
};

export const pieceUsesDecorOverlay = (piece: string): boolean => {
    if (piece === "cube") {
        return true;
    }
    if (isSpacerPiece(piece)) {
        return false;
    }
    const parsed = parseLintelPiece(piece);
    return parsed !== null && parsed.kind === "cube";
};

export const assertIsoOverlayValid = (pc: IsoPiece): void => {
    const piece = pc.piece;
    const spec = isoOverlayFromPiece(pc);
    if (spec === undefined) {
        return;
    }
    if (spec.top !== undefined && !pieceUsesTopOverlay(piece)) {
        throw new Error(
            `Legend isoPiece "${piece}" does not support \`top\` overlays (use \`decor\` for cubes and cube lintels).`,
        );
    }
    if (spec.decor !== undefined && !pieceUsesDecorOverlay(piece)) {
        throw new Error(
            `Legend isoPiece "${piece}" does not support \`decor\` overlays (use \`top\` for cylinders and hex prisms).`,
        );
    }
};
