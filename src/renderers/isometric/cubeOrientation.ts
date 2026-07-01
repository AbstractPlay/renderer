import { IsoCubeFaces } from "../../schemas/schema";

export type VisibleCubeFaces = {
    top: IsoCubeFaces["top"];
    left: IsoCubeFaces["north"] | IsoCubeFaces["east"] | IsoCubeFaces["south"] | IsoCubeFaces["west"];
    right: IsoCubeFaces["north"] | IsoCubeFaces["east"] | IsoCubeFaces["south"] | IsoCubeFaces["west"];
};

/**
 * Maps intrinsic cube face colours to the three faces visible in the fixed isometric projection.
 * @param faces - Intrinsic face colours (N/E/S/W + top).
 * @param effectiveYaw - Quarter-turns clockwise viewed from above, including board rotation.
 */
export const permuteCubeFaces = (faces: IsoCubeFaces, effectiveYaw: number): VisibleCubeFaces => {
    const yaw = ((effectiveYaw % 4) + 4) % 4;
    switch (yaw) {
        case 1:
            return { top: faces.top, left: faces.north, right: faces.south };
        case 2:
            return { top: faces.top, left: faces.east, right: faces.west };
        case 3:
            return { top: faces.top, left: faces.south, right: faces.north };
        default:
            return { top: faces.top, left: faces.west, right: faces.east };
    }
};

/**
 * Combines piece yaw with board rotation (in degrees) into a single effective yaw (0–3).
 */
export const effectiveCubeYaw = (pieceYaw: number, boardRotationDeg: number): number => {
    const boardQuarterTurns = Math.floor(boardRotationDeg / 90) % 4;
    return ((pieceYaw + boardQuarterTurns) % 4 + 4) % 4;
};
