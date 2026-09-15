import type { Svg } from "@svgdotjs/svg.js";

export type Affine2 = { a: number; b: number; c: number; d: number; e: number; f: number };

export const parseTransformMatrix = (transform: string | null | undefined): Affine2 | null => {
    if (transform === null || transform === undefined) {
        return null;
    }
    const m = transform.match(/matrix\(([^)]+)\)/);
    if (m === null) {
        return null;
    }
    const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
    if (parts.length < 6 || parts.some((n) => !Number.isFinite(n))) {
        return null;
    }
    return { a: parts[0], b: parts[1], c: parts[2], d: parts[3], e: parts[4], f: parts[5] };
};

export const applyAffine = (m: Affine2, x: number, y: number): { x: number; y: number } => ({
    x: m.a * x + m.c * y + m.e,
    y: m.b * x + m.d * y + m.f,
});

/** Each direct child `use` transform under a legend nested symbol, in tree order. */
export const legendChildUseMatrices = (draw: Svg, legendKey: string): Affine2[] => {
    const symbol = draw.findOne(`#${legendKey}`) as Svg | null;
    if (symbol === null) {
        return [];
    }
    const out: Affine2[] = [];
    symbol.find("use").forEach((node) => {
        const m = node.matrixify();
        out.push({ a: m.a, b: m.b, c: m.c, d: m.d, e: m.e, f: m.f });
    });
    return out;
};

export const maxMatrixDelta = (a: Affine2[], b: Affine2[]): number => {
    const n = Math.min(a.length, b.length);
    let max = 0;
    for (let i = 0; i < n; i++) {
        for (const k of ["a", "b", "c", "d", "e", "f"] as const) {
            max = Math.max(max, Math.abs(a[i][k] - b[i][k]));
        }
    }
    if (a.length !== b.length) {
        max = Math.max(max, Math.abs(a.length - b.length));
    }
    return max;
};
