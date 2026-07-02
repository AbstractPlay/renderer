import { deg2rad } from "../../common/plotting";
import { IPoint } from "../../grids";
import { Matrix } from "transformation-matrix-js";

/** 2:1 isometric projection used for board layout and piece symbols. */
export const buildIsoProjectionMatrix = (): Matrix => {
    const tScale = new Matrix().scaleY(Math.cos(deg2rad(30)));
    const tShear = new Matrix().shearX(Math.tan(deg2rad(-30)));
    const tRotate = new Matrix().rotate(deg2rad(30));
    return tRotate.multiply(tShear.multiply(tScale));
};

export const mapBoardToScreen = (
    localX: number,
    localY: number,
    tUserRotate: Matrix,
    tFinal: Matrix,
): IPoint => {
    const rotated = tUserRotate.applyToPoint(localX, localY);
    return tFinal.applyToPoint(rotated.x, rotated.y);
};

export type IsoLabelAffine = { a: number; b: number; c: number; d: number; e: number; f: number };

/** Affine transform that lays label text in the isometric plane. */
export const isoLabelTransform = (
    localX: number,
    localY: number,
    tUserRotate: Matrix,
    tFinal: Matrix,
): IsoLabelAffine => {
    const p = mapBoardToScreen(localX, localY, tUserRotate, tFinal);
    const o = mapBoardToScreen(0, 0, tUserRotate, tFinal);
    const ux = mapBoardToScreen(1, 0, tUserRotate, tFinal);
    const uy = mapBoardToScreen(0, 1, tUserRotate, tFinal);
    return {
        a: ux.x - o.x,
        b: ux.y - o.y,
        c: uy.x - o.x,
        d: uy.y - o.y,
        e: p.x,
        f: p.y,
    };
};
