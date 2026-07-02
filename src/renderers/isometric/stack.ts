import { IsoCubeFaces, IsoPiece, IsoStackPiece } from "../../schemas/schema";

export type IsoStackEntry = string | IsoStackPiece;
export type IsoPiecesGrid = IsoStackEntry[][][];

export const isMultiFaceCube = (pc: IsoPiece): pc is Extract<IsoPiece, { faces: IsoCubeFaces }> =>
    pc.piece === "cube" && "faces" in pc;

export const parseStackEntry = (item: IsoStackEntry): { glyph: string; yaw: number } => {
    if (typeof item === "string") {
        return { glyph: item, yaw: 0 };
    }
    return { glyph: item.glyph, yaw: item.yaw ?? 0 };
};
