import { circle2poly, projectPoint } from "../../common/plotting";
import { IPoint } from "../../grids";
import { ISO_PROJECTION_PRESETS, IsoProjectionParams, projectOblique } from "./projection";

const normDeg = (deg: number): number => ((deg % 360) + 360) % 360;

/** Left/right silhouette tangent angles and the bottom-arc degrees between them through the front. */
export const cylinderSilhouette = (
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
    let maxBotY = -Infinity;

    for (let deg = 0; deg < 360; deg++) {
        const w = projectPoint(0, 0, r, deg);
        const top = p(...w, 0);
        const bot = p(...w, sideHeight);
        if (top.x < minX) {
            minX = top.x;
            leftDeg = deg;
        }
        if (top.x > maxX) {
            maxX = top.x;
            rightDeg = deg;
        }
        if (bot.y > maxBotY) {
            maxBotY = bot.y;
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

export const cylinderSilhouettePoints = (
    r: number,
    sideHeight: number,
    params: IsoProjectionParams,
): {
    ptsEnds: IPoint[];
    ptsEndsBot: IPoint[];
    barrelBottom: IPoint[];
    ptsTop: IPoint[];
} => {
    const p = (x: number, y: number, z: number): IPoint => projectOblique(x, y, z, params);
    const { rightDeg, leftDeg, arcDegrees } = cylinderSilhouette(r, sideHeight, params);
    const ptsEnds: IPoint[] = [
        p(...projectPoint(0, 0, r, rightDeg), 0),
        p(...projectPoint(0, 0, r, leftDeg), 0),
    ];
    const ptsEndsBot: IPoint[] = [
        p(...projectPoint(0, 0, r, rightDeg), sideHeight),
        p(...projectPoint(0, 0, r, leftDeg), sideHeight),
    ];
    const barrelBottom = arcDegrees.map((deg) => p(...projectPoint(0, 0, r, deg), sideHeight));
    const ptsTop = circle2poly(0, 0, r).map(([x, y]) => p(x, y, 0));
    return { ptsEnds, ptsEndsBot, barrelBottom, ptsTop };
};
