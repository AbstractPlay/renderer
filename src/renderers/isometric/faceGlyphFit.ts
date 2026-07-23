import { Matrix } from "transformation-matrix-js";
import { Svg } from "@svgdotjs/svg.js";
import { centroid } from "../../common/plotting";
import { IsoPiece, Glyph } from "../../schemas/schema";
import { Hex } from "./hexes";
import { glyphViewBoxSquareDrawSize } from "./symbolPlacement";
import type { CubePaintFace } from "./cubes";

export const ISO_FACE_UNIT = 100;

type SvgMatrixTarget = {
    matrix(a: number, b: number, c: number, d: number, e: number, f: number): unknown;
};

/** Apply an affine matrix the same way on mesh faces and glyph overlays (six scalars, not toArray()). */
export const applyIsoAffineMatrix = (target: SvgMatrixTarget, m: Matrix): void => {
    const x = m as Matrix & { a: number; b: number; c: number; d: number; e: number; f: number };
    target.matrix(x.a, x.b, x.c, x.d, x.e, x.f);
};

type AffineScalars = { a: number; b: number; c: number; d: number; e: number; f: number };

const affineScalars = (m: Matrix): AffineScalars => m as Matrix & AffineScalars;

/** Copy an affine matrix (Matrix.multiply mutates the receiver). */
export const copyIsoAffine = (m: Matrix): Matrix => {
    const x = affineScalars(m);
    const out = new Matrix();
    const y = affineScalars(out);
    y.a = x.a;
    y.b = x.b;
    y.c = x.c;
    y.d = x.d;
    y.e = x.e;
    y.f = x.f;
    return out;
};

/** Return left × right without mutating left. */
export const multiplyIsoAffine = (left: Matrix, right: Matrix): Matrix => copyIsoAffine(left).multiply(right);

/** Face decor at legend `scale: 1` uses the full computed face square (users shrink with lower `scale`). */
export const ISO_FACE_DECOR_MARGIN = 1;

const DEFAULT_FACE_INSET = 1;

export type IsoFaceMapping = "cubeUv" | "projectedTop";

export type IsoFaceComposeContext = {
    faceKey: string;
    /** Piece symbol id (e.g. Cube__y1__db7) — scopes glyph uids so overlays do not collide. */
    hostSymbolId: string;
    localW: number;
    localH: number;
    faceInset: number;
    mapping: IsoFaceMapping;
    /** When true, vertical/text glyphs on iso tops skip board rotation bake (face geometry handles alignment). */
    counterRotateWithBoard: boolean;
    /** Max centered square side in face UV that fits the visible face after transform. */
    maxSquareSide: number;
    paintFace?: CubePaintFace;
};

export type ProjectedTopSilhouette =
    | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number }
    | { kind: "polygon"; points: { x: number; y: number }[] };

export const resolveFaceInset = (pc: IsoPiece): number => {
    let inset = DEFAULT_FACE_INSET;
    if ("scale" in pc && pc.scale !== undefined) {
        inset = pc.scale;
    }
    if (inset <= 0) {
        inset = DEFAULT_FACE_INSET;
    }
    if (inset > 1) {
        inset = 1;
    }
    if (inset >= 1) {
        return ISO_FACE_DECOR_MARGIN;
    }
    return inset;
};

/** Sheet glyphs default fluid; text defaults vertical unless orientation is fluid. */
export const glyphKeepsUpright = (g: Glyph): boolean => {
    if (("text" in g) && (g.text !== undefined) && (g.text.length > 0)) {
        return g.orientation === undefined || g.orientation !== "fluid";
    }
    return g.orientation === "vertical";
};

export type GlyphRotationOptions = {
    /** When false, never subtract board rotation (iso cube sides). Legend layout defaults to true. */
    counterRotateWithBoard?: boolean;
    /**
     * Iso top faces only: isometric layout does not call rotateBoard(), so fluid glyphs need
     * +board.rotate baked into the overlay. Legend layout must leave this false.
     */
    rotateFluidWithBoard?: boolean;
};

/** Degrees to apply at bake time; `null` when `rotate: null` disables all rotation. */
export const resolveGlyphRotationDegrees = (
    g: Glyph,
    boardRotation: number,
    opts?: GlyphRotationOptions,
): number | null => {
    if (g.rotate === null) {
        return null;
    }
    let rotation = 0;
    if (g.rotate !== undefined) {
        rotation += g.rotate;
    }
    const counterRotate = opts?.counterRotateWithBoard !== false;
    if (counterRotate && glyphKeepsUpright(g)) {
        if (!opts?.rotateFluidWithBoard) {
            rotation -= boardRotation;
        }
    } else if (counterRotate && opts?.rotateFluidWithBoard && !glyphKeepsUpright(g)) {
        rotation += boardRotation;
    }
    return rotation;
};

/**
 * Conservative shrink so a centered square in face UV stays inside a skewed cube face parallelogram.
 */
export const cubeFaceDecorUvScale = (matrix: Matrix, localW: number, localH: number): number => {
    const p0 = matrix.applyToPoint(0, 0);
    const p1 = matrix.applyToPoint(localW, 0);
    const p2 = matrix.applyToPoint(localW, localH);
    const p3 = matrix.applyToPoint(0, localH);
    const e01 = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    const e12 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const e23 = Math.hypot(p3.x - p2.x, p3.y - p2.y);
    const e30 = Math.hypot(p0.x - p3.x, p0.y - p3.y);
    const minEdge = Math.min(e01, e12, e23, e30);
    const maxEdge = Math.max(e01, e12, e23, e30);
    if (maxEdge <= 0 || !Number.isFinite(minEdge)) {
        return 1;
    }
    return Math.min(1, minEdge / maxEdge);
};

const pointInConvexPolygon = (px: number, py: number, poly: { x: number; y: number }[]): boolean => {
    const cross = (ax: number, ay: number, bx: number, by: number, cx2: number, cy2: number): number =>
        (bx - ax) * (cy2 - ay) - (by - ay) * (cx2 - ax);
    const n = poly.length;
    if (n < 3) {
        return false;
    }
    let sign = 0;
    for (let i = 0; i < n; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % n];
        const c = cross(a.x, a.y, b.x, b.y, px, py);
        if (Math.abs(c) < 1e-9) {
            continue;
        }
        if (sign === 0) {
            sign = Math.sign(c);
        } else if (Math.sign(c) !== sign) {
            return false;
        }
    }
    return true;
};

const centeredSquareCorners = (
    side: number,
    localW: number,
    localH: number,
): [number, number][] => {
    const x = localW / 2 - side / 2;
    const y = localH / 2 - side / 2;
    return [
        [x, y],
        [x + side, y],
        [x + side, y + side],
        [x, y + side],
    ];
};

/** Largest centered square side in face UV whose corners stay inside the visible face after `faceMatrix`. */
export const computeMaxCenteredSquareSide = (
    ctx: Pick<IsoFaceComposeContext, "localW" | "localH" | "mapping">,
    faceMatrix: Matrix,
    silhouette?: ProjectedTopSilhouette,
): number => {
    const cap = Math.min(ctx.localW, ctx.localH);
    if (ctx.mapping === "cubeUv") {
        const inscribe = cubeFaceDecorUvScale(faceMatrix, ctx.localW, ctx.localH);
        return cap * inscribe;
    }
    const fits = (side: number): boolean => {
        if (side <= 0) {
            return true;
        }
        if (side > cap + 1e-9) {
            return false;
        }
        if (silhouette === undefined) {
            return side <= cap;
        }
        return squareFitsProjectedSilhouette(side, ctx.localW, ctx.localH, faceMatrix, silhouette);
    };
    if (!fits(cap)) {
        let lo = 0;
        let hi = cap;
        for (let i = 0; i < 28; i++) {
            const mid = (lo + hi) / 2;
            if (fits(mid)) {
                lo = mid;
            } else {
                hi = mid;
            }
        }
        return lo;
    }
    return cap;
};

const squareFitsProjectedSilhouette = (
    side: number,
    localW: number,
    localH: number,
    faceMatrix: Matrix,
    silhouette: ProjectedTopSilhouette,
): boolean => {
    const inside = (px: number, py: number): boolean => {
        if (silhouette.kind === "ellipse") {
            const nx = (px - silhouette.cx) / silhouette.rx;
            const ny = (py - silhouette.cy) / silhouette.ry;
            return (nx * nx + ny * ny) <= 1 + 1e-6;
        }
        return pointInConvexPolygon(px, py, silhouette.points);
    };
    return centeredSquareCorners(side, localW, localH).every(([ux, uy]) => {
        const p = faceMatrix.applyToPoint(ux, uy);
        return inside(p.x, p.y);
    });
};

/** Square draw size for a sheet glyph in face-local units (viewBox-only, legend-style square use). */
export const isoFaceGlyphDrawSize = (
    symbol: Svg,
    basis: number,
    faceInset: number,
    glyphScale = 1,
    maxSquareSide = basis,
): number => {
    const budget = Math.min(basis, maxSquareSide) * faceInset * glyphScale;
    const fitted = glyphViewBoxSquareDrawSize(budget, symbol);
    return Math.min(budget, fitted);
};

export type IsoFaceGlyphPlacement = {
    drawSize: number;
    x: number;
    y: number;
};

/** Place glyph so viewBox center sits on the face center (square use maps full viewBox like flat legend). */
export const isoFaceGlyphPlacement = (
    _symbol: Svg,
    drawSize: number,
    faceLocalW: number,
    faceLocalH: number,
): IsoFaceGlyphPlacement => {
    const faceCx = faceLocalW / 2;
    const faceCy = faceLocalH / 2;
    const mappedCx = drawSize / 2;
    const mappedCy = drawSize / 2;
    return {
        drawSize,
        x: faceCx - mappedCx,
        y: faceCy - mappedCy,
    };
};

/** Center a topSize square overlay on the cylinder/board origin before projection. */
export const projectedTopCenterMatrix = (topSize: number): Matrix => {
    const half = topSize / 2;
    return new Matrix().translate(-half, -half);
};

/** Center overlay square on hex top in honeycomb coordinates before projection. */
export const hexTopOverlayPrepMatrix = (hex: Hex, topSize: number): Matrix => {
    const cWorld = centroid(hex.corners)!;
    const half = topSize / 2;
    return new Matrix().translate(cWorld.x - half, cWorld.y - half);
};
