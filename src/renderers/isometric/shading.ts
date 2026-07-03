import { hex2rgb, lighten, rgb2hex } from "../../common/colours";
import { IPoint } from "../../grids";

export type IsoFaceRole = "top" | "left" | "right";

export type IsoFaceFills = {
    top: string;
    left: string;
    right: string;
};

/**
 * Saturation/luminance deltas passed to `lighten()` from [`colours.ts`](../common/colours.ts).
 * `ds` shifts saturation; `dl` shifts luminance (positive = lighter).
 * Reduce the absolute values for subtler shading; increase for stronger contrast.
 */
export const ISO_SHADE_TOP = { ds: 1, dl: 0.3 } as const;
export const ISO_SHADE_DARK = { ds: 1, dl: -0.3 } as const;

/** Fixed upper-left light: lighten top, pass left through, darken right. */
export const isoShadeFace = (colour: string, role: IsoFaceRole): string => {
    if (role === "left") {
        return colour;
    }
    const rgb = hex2rgb(colour);
    if (role === "top") {
        return rgb2hex(lighten(rgb, ISO_SHADE_TOP.ds, ISO_SHADE_TOP.dl));
    }
    return rgb2hex(lighten(rgb, ISO_SHADE_DARK.ds, ISO_SHADE_DARK.dl));
};

export const isoShadeFaces = (baseHex: string): IsoFaceFills => ({
    top: isoShadeFace(baseHex, "top"),
    left: isoShadeFace(baseHex, "left"),
    right: isoShadeFace(baseHex, "right"),
});

const ISO_LIGHT_X = -1;
const ISO_LIGHT_Y = -1;

/**
 * Classify a projected side face by how much it faces the fixed upper-left light.
 */
export const shadeRoleForProjectedFace = (
    shapeCentroid: IPoint,
    edgeA: IPoint,
    edgeB: IPoint,
): IsoFaceRole => {
    const edgeDx = edgeB.x - edgeA.x;
    const edgeDy = edgeB.y - edgeA.y;
    let nx = -edgeDy;
    let ny = edgeDx;
    const faceMidX = (edgeA.x + edgeB.x) / 2;
    const faceMidY = (edgeA.y + edgeB.y) / 2;
    const toFaceX = faceMidX - shapeCentroid.x;
    const toFaceY = faceMidY - shapeCentroid.y;
    if (nx * toFaceX + ny * toFaceY < 0) {
        nx = -nx;
        ny = -ny;
    }
    const dot = nx * ISO_LIGHT_X + ny * ISO_LIGHT_Y;
    if (dot > 0.3) {
        return "left";
    }
    if (dot < -0.3) {
        return "right";
    }
    return "left";
};

export const isoShadeProjectedFace = (
    baseHex: string,
    shapeCentroid: IPoint,
    edgeA: IPoint,
    edgeB: IPoint,
): string => isoShadeFace(baseHex, shadeRoleForProjectedFace(shapeCentroid, edgeA, edgeB));
