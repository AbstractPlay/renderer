import { deg2rad } from "../../common/plotting";
import { IPoint } from "../../grids";
import { Matrix } from "transformation-matrix-js";

export type IsoProjectionPreset =
    | "iso"
    | "shallow"
    | "very-shallow"
    | "compressed"
    | "cabinet"
    | "dimetric"
    | "trimetric";

/** Screen direction and length of a board ground axis (+X east or +Y south). */
export type IsoGroundAxisParams = {
    /** Degrees from screen +X (right); positive is clockwise toward screen +Y (down). */
    angleDeg: number;
    scale: number;
};

/** Camera elevation above the board plane (degrees). Higher = more top-down. */
export type IsoProjectionParams = {
    elevationDeg: number;
    /** When set with yAxis, overrides symmetric isometric ground foreshortening. */
    xAxis?: IsoGroundAxisParams;
    yAxis?: IsoGroundAxisParams;
};

/** Elevation that reproduces classic 2:1 isometric (axis 30°, vertical scale 1). */
export const ISO_STANDARD_ELEVATION_DEG = 35.264389;

const ISO_STANDARD_AXIS_ANGLE_DEG = 30;

const derivedProjection = (elevationDeg: number): { axisAngleDeg: number; verticalScale: number } => {
    const ε = deg2rad(elevationDeg);
    const ε0 = deg2rad(ISO_STANDARD_ELEVATION_DEG);
    return {
        axisAngleDeg: ISO_STANDARD_AXIS_ANGLE_DEG * Math.tan(ε0) / Math.tan(ε),
        verticalScale: Math.cos(ε) / Math.cos(ε0),
    };
};

const axisVector = ({ angleDeg, scale }: IsoGroundAxisParams): IPoint => ({
    x: Math.cos(deg2rad(angleDeg)) * scale,
    y: Math.sin(deg2rad(angleDeg)) * scale,
});

const rad2deg = (rad: number): number => rad * (180 / Math.PI);

const axisParamsFromVector = (vx: IPoint, scale = 1): IsoGroundAxisParams => ({
    angleDeg: rad2deg(Math.atan2(vx.y, vx.x)),
    scale: Math.hypot(vx.x, vx.y) * scale,
});

/** Asymmetric preset sharing iso axis directions with independent foreshortening. */
const presetFromGroundScales = (
    elevationDeg: number,
    yForeshorten: number,
    xForeshorten = 1,
): IsoProjectionParams => {
    const m = buildSymmetricGroundMatrix(elevationDeg);
    const vx = m.applyToPoint(1, 0);
    const vy = m.applyToPoint(0, 1);
    return {
        elevationDeg,
        xAxis: axisParamsFromVector(vx, xForeshorten),
        yAxis: axisParamsFromVector(vy, yForeshorten),
    };
};

const buildSymmetricGroundMatrix = (elevationDeg: number): Matrix => {
    const { axisAngleDeg } = derivedProjection(elevationDeg);
    const tScale = new Matrix().scaleY(Math.cos(deg2rad(axisAngleDeg)));
    const tShear = new Matrix().shearX(Math.tan(deg2rad(-axisAngleDeg)));
    const tRotate = new Matrix().rotate(deg2rad(axisAngleDeg));
    return tRotate.multiply(tShear.multiply(tScale));
};

export const ISO_PROJECTION_PRESETS: Record<IsoProjectionPreset, IsoProjectionParams> = {
    iso: { elevationDeg: ISO_STANDARD_ELEVATION_DEG },
    shallow: { elevationDeg: 48 },
    "very-shallow": { elevationDeg: 58 },
    /** Iso viewing angle with the depth axis foreshortened to 50%. */
    compressed: presetFromGroundScales(46, 0.5),
    /** Classic cabinet: east–west undistorted, south recedes at 45° at half scale. */
    cabinet: {
        elevationDeg: ISO_STANDARD_ELEVATION_DEG,
        xAxis: { angleDeg: 0, scale: 1 },
        yAxis: { angleDeg: 45, scale: 0.5 },
    },
    /** Both ground axes foreshortened equally. */
    dimetric: presetFromGroundScales(38, 0.82, 0.82),
    /** Both ground axes foreshortened unequally. */
    trimetric: presetFromGroundScales(40, 0.65, 0.88),
};

export const resolveIsoProjection = (
    preset: IsoProjectionPreset | IsoProjectionParams = "iso",
): IsoProjectionParams => {
    if (typeof preset === "string") {
        return ISO_PROJECTION_PRESETS[preset];
    }
    return preset;
};

export type IsoGroundBasis = {
    vx: IPoint;
    vy: IPoint;
    verticalScale: number;
};

const isAsymmetricGround = (params: IsoProjectionParams): boolean =>
    params.xAxis !== undefined && params.yAxis !== undefined;

export type IsoDepthSortMode = "board-local" | "projected";

/** Cell depth keys always use board-local x+y after user rotation (works for all presets). */
export const boardDepthSortMode = (): IsoDepthSortMode => "board-local";

/** Screen basis vectors for board +X and +Y, plus vertical scale for +Z. */
export const resolveGroundBasis = (params: IsoProjectionParams): IsoGroundBasis => {
    const { verticalScale } = derivedProjection(params.elevationDeg);
    if (isAsymmetricGround(params)) {
        return {
            vx: axisVector(params.xAxis!),
            vy: axisVector(params.yAxis!),
            verticalScale,
        };
    }
    const m = buildSymmetricGroundMatrix(params.elevationDeg);
    return {
        vx: m.applyToPoint(1, 0),
        vy: m.applyToPoint(0, 1),
        verticalScale,
    };
};

/** True when east–west columns share depth and need surfaces split from pieces in the draw order. */
export const usesLayeredCellDraw = (params: IsoProjectionParams): boolean => {
    const { vx } = resolveGroundBasis(params);
    return Math.abs(vx.y) < 1e-6;
};

export type CabinetPieceVisibility = {
    /** Side paint slots: south on left, west on right (right slot carries west colour). */
    sideSlots: readonly ["left", "west"];
};

/**
 * Piece geometry visible under true cabinet oblique (E–W horizontal, south at 45° half scale).
 * The viewer is anchored at the southwest / south of the board — not the SE corner used by iso.
 */
export const cabinetPieceVisibility = (params: IsoProjectionParams): CabinetPieceVisibility | undefined => {
    if (!usesLayeredCellDraw(params)) {
        return undefined;
    }
    return {
        sideSlots: ["left", "west"],
    };
};

/** Depth-axis weights for asymmetric ground projections (cabinet: south only). */
export const boardDepthWeight = (params: IsoProjectionParams): { wx: number; wy: number } => {
    const { vx, vy } = resolveGroundBasis(params);
    return { wx: vx.y, wy: vy.y };
};

/**
 * Screen depth for cell sorting. Cabinet oblique uses south (screen Y) plus an
 * east-axis correction so west columns paint over east at equal latitude.
 */
export const projectedCellDepth = (
    entry: { x: number; y: number },
    params: IsoProjectionParams,
): number => {
    if (usesLayeredCellDraw(params)) {
        const { vx, vy } = resolveGroundBasis(params);
        return entry.y - entry.x * (vy.y / vx.x);
    }
    return entry.y;
};

/** Suffix for defs symbol ids so alternate projections do not reuse iso geometry. */
export const isoProjectionCacheSuffix = (params: IsoProjectionParams): string => {
    const isStandardIso =
        Math.abs(params.elevationDeg - ISO_STANDARD_ELEVATION_DEG) < 1e-6
        && !isAsymmetricGround(params);
    if (isStandardIso) {
        return "";
    }
    const parts = [`e${Math.round(params.elevationDeg)}`];
    if (params.xAxis !== undefined) {
        parts.push(`x${Math.round(params.xAxis.angleDeg)}s${Math.round(params.xAxis.scale * 100)}`);
    }
    if (params.yAxis !== undefined) {
        parts.push(`y${Math.round(params.yAxis.angleDeg)}s${Math.round(params.yAxis.scale * 100)}`);
    }
    return `_${parts.join("_")}`;
};

/** Project board-space (x east, y south, z up) to screen coordinates. */
export const projectOblique = (
    x: number,
    y: number,
    z: number,
    params: IsoProjectionParams,
): IPoint => {
    const { vx, vy, verticalScale } = resolveGroundBasis(params);
    return {
        x: x * vx.x + y * vy.x,
        y: x * vx.y + y * vy.y + z * verticalScale,
    };
};

/** Ground-plane projection used for board layout and piece tops. */
export const buildIsoProjectionMatrix = (params?: IsoProjectionParams): Matrix => {
    const resolved = resolveIsoProjection(params ?? "iso");
    const { vx, vy } = resolveGroundBasis(resolved);
    const m = new Matrix() as Matrix & { a: number; b: number; c: number; d: number; e: number; f: number };
    m.a = vx.x;
    m.b = vx.y;
    m.c = vy.x;
    m.d = vy.y;
    m.e = 0;
    m.f = 0;
    return m;
};

type AffineMatrix = Matrix & { a: number; b: number; c: number; d: number; e: number; f: number };

/** Affine mapping a local rectangle (0,0)–(localW,localH) onto three projected corners. */
export const affineFromUnitRect = (
    localW: number,
    localH: number,
    p00: IPoint,
    pw0: IPoint,
    p0h: IPoint,
): Matrix => {
    const m = new Matrix() as AffineMatrix;
    m.a = (pw0.x - p00.x) / localW;
    m.b = (pw0.y - p00.y) / localW;
    m.c = (p0h.x - p00.x) / localH;
    m.d = (p0h.y - p00.y) / localH;
    m.e = p00.x;
    m.f = p00.y;
    return m;
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
