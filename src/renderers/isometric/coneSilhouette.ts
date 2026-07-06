import { circle2poly, projectPoint } from "../../common/plotting";
import { IPoint } from "../../grids";
import { ISO_PROJECTION_PRESETS, IsoProjectionParams, projectOblique } from "./projection";

const normDeg = (deg: number): number => ((deg % 360) + 360) % 360;

/** Left/right silhouette tangent angles on the base circle at z = sideHeight. */
export const coneSilhouette = (
    r: number,
    sideHeight: number,
    params: IsoProjectionParams = ISO_PROJECTION_PRESETS.iso,
): { rightDeg: number; leftDeg: number; arcDegrees: number[] } => {
    const p = (x: number, y: number, z: number): IPoint => projectOblique(x, y, z, params);

    let rightDeg = 0;
    let leftDeg = 0;
    let minX = Infinity;
    let maxX = -Infinity;
    let frontDeg = 0;
    let maxBaseY = -Infinity;

    for (let deg = 0; deg < 360; deg++) {
        const w = projectPoint(0, 0, r, deg);
        const base = p(...w, sideHeight);
        if (base.x < minX) {
            minX = base.x;
            leftDeg = deg;
        }
        if (base.x > maxX) {
            maxX = base.x;
            rightDeg = deg;
        }
        if (base.y > maxBaseY) {
            maxBaseY = base.y;
            frontDeg = deg;
        }
    }

    const walk = (step: number): number[] => {
        const path: number[] = [];
        let d = rightDeg;
        for (let i = 0; i <= 360; i++) {
            const n = normDeg(d);
            path.push(n);
            if (n === normDeg(leftDeg)) {
                break;
            }
            d += step;
        }
        return path;
    };

    const forward = walk(1);
    const backward = walk(-1);
    const includes = (path: number[], target: number): boolean =>
        path.some((deg) => deg === normDeg(target));
    const arcPath = includes(forward, frontDeg) ? forward : backward;

    return {
        rightDeg,
        leftDeg,
        arcDegrees: arcPath.slice(1, -1),
    };
};

export const coneSilhouettePoints = (
    r: number,
    sideHeight: number,
    params: IsoProjectionParams,
): {
    apex: IPoint;
    ptsEnds: IPoint[];
    baseArc: IPoint[];
    ptsBase: IPoint[];
} => {
    const p = (x: number, y: number, z: number): IPoint => projectOblique(x, y, z, params);
    const { rightDeg, leftDeg, arcDegrees } = coneSilhouette(r, sideHeight, params);
    const apex = p(0, 0, 0);
    const ptsEnds: IPoint[] = [
        p(...projectPoint(0, 0, r, rightDeg), sideHeight),
        p(...projectPoint(0, 0, r, leftDeg), sideHeight),
    ];
    const baseArc = arcDegrees.map((deg) => p(...projectPoint(0, 0, r, deg), sideHeight));
    const ptsBase = circle2poly(0, 0, r).map(([x, y]) => p(x, y, sideHeight));
    return { apex, ptsEnds, baseArc, ptsBase };
};
