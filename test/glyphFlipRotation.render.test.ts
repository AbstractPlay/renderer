import { expect } from "chai";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { DefaultRenderer } from "../src/renderers/default";
import { IRendererOptionsIn } from "../src/renderers/_base";
import { APRenderRep } from "../src/schemas/schema";
import arimaaFixture from "./fixtures/arimaa-vertical-flip.json" with { type: "json" };
import { createSVGWindow } from "svgdom";


const makeDraw = (): Svg => {
    const window = createSVGWindow();
    const document = window.document;
    registerWindow(window, document);
    return SVG(document.documentElement) as Svg;
};

const baseOptions: IRendererOptionsIn = {
    contextGlobal: true,
    coloursGlobal: true,
    colourContext: {
        background: "#ccc",
        fill: "#eee",
        strokes: "#000",
        annotations: "#000",
        board: "#ccc",
    },
    showAnnotations: false,
    sheets: ["core", "arimaa"],
};

type Affine2 = { a: number; b: number; c: number; d: number; e: number; f: number };

const parseTransformMatrix = (transform: string | null | undefined): Affine2 | null => {
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

const multiplyAffine = (left: Affine2, right: Affine2): Affine2 => ({
    a: left.a * right.a + left.c * right.b,
    b: left.b * right.a + left.d * right.b,
    c: left.a * right.c + left.c * right.d,
    d: left.b * right.c + left.d * right.d,
    e: left.a * right.e + left.c * right.f + left.e,
    f: left.b * right.e + left.d * right.f + left.f,
});

const rotationMatrix = (deg: number): Affine2 => {
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
};

/** First aprender-glyph `use` transform baked into a legend nested symbol. */
const legendGlyphMatrix = (draw: Svg, legendKey: string): Affine2 | null => {
    const symbol = draw.findOne(`#${legendKey}`) as Svg | null;
    if (symbol === null) {
        return null;
    }
    let found: Affine2 | null = null;
    symbol.find("use").forEach((node) => {
        if (found !== null) {
            return;
        }
        const href = (node.attr("href") ?? node.attr("xlink:href") ?? "") as string;
        if (!href.includes("aprender-glyph")) {
            return;
        }
        found = parseTransformMatrix(node.attr("transform") as string);
    });
    return found;
};

const linearDet = (m: Affine2): number => m.a * m.d - m.b * m.c;

describe("glyph flip with board rotation", () => {
    const rotations = [0, 90, 180, 270] as const;

    for (const boardRotate of rotations) {
        it(`should keep silver horizontally mirrored vs gold on screen at board.rotate ${boardRotate}°`, () => {
            const renderer = new DefaultRenderer();
            const draw = makeDraw();
            renderer.render(arimaaFixture as APRenderRep, draw, { ...baseOptions, rotate: boardRotate });

            for (const [goldKey, silverKey] of [["E1", "E2"], ["M1", "M2"]] as const) {
                const bakedGold = legendGlyphMatrix(draw, goldKey);
                const bakedSilver = legendGlyphMatrix(draw, silverKey);
                expect(bakedGold, goldKey).to.not.equal(null);
                expect(bakedSilver, silverKey).to.not.equal(null);

                const boardRot = rotationMatrix(boardRotate);
                const onScreenGold = multiplyAffine(boardRot, bakedGold!);
                const onScreenSilver = multiplyAffine(boardRot, bakedSilver!);

                expect(Math.sign(linearDet(onScreenGold))).to.equal(1, `${goldKey} det at ${boardRotate}°`);
                expect(Math.sign(linearDet(onScreenSilver))).to.equal(-1, `${silverKey} det at ${boardRotate}°`);
            }
        });
    }
});
