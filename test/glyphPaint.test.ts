import { expect } from "chai";
import "mocha";
import Ajv from "ajv";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { DefaultRenderer } from "../src/renderers/default.js";
import type { APRenderRep, Glyph } from "../src/schemas/schema.js";
import schema from "../src/schemas/schema.json" with { type: "json" };
import {
    normalizeGlyphPaint,
    paintFingerprint,
    priorCompositeLayerTint,
} from "../src/renderers/glyphPaint.js";
import { normalizeSvgForGlyphCompare } from "./helpers/normalizeSvgForGlyphCompare.js";

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    registerWindow(window, window.document);
    return SVG(window.document.documentElement) as Svg;
};

const baseOptions = {
    contextGlobal: true,
    coloursGlobal: false,
    showAnnotations: false,
    sheets: ["core", "chess"],
};

function renderLegendGlyphs(glyphs: Glyph[], sheets: string[] = ["core", "chess"]): string {
    const draw = makeDraw();
    const renderer = new DefaultRenderer();
    const json: APRenderRep = {
        board: { style: "squares", width: 1, height: 1 },
        legend: { X: glyphs.length === 1 ? glyphs[0]! : glyphs },
        pieces: "X",
    };
    renderer.render(json, draw, { ...baseOptions, sheets });
    return draw.svg();
}

describe("glyphPaint", () => {
    describe("normalizeGlyphPaint", () => {
        it("shims colour and colour2 to fill and border", () => {
            const norm = normalizeGlyphPaint({
                name: "piece",
                colour: 1,
                colour2: 2,
            })!;
            expect(norm.paint.fill).to.equal(1);
            expect(norm.paint.border).to.equal(2);
            expect(norm.layerOpacity).to.equal(1);
        });

        it("does not run for text glyphs", () => {
            expect(normalizeGlyphPaint({ text: "1", colour: 1 })).to.equal(undefined);
        });

        it("maps legacy glyph opacity to paint.fill only", () => {
            const norm = normalizeGlyphPaint({
                name: "piece",
                colour: 1,
                opacity: 0.5,
            })!;
            expect(norm.layerOpacity).to.equal(1);
            expect(norm.paint.fill).to.deep.equal({ colour: 1, opacity: 0.5 });
            expect(norm.paint.border).to.equal(undefined);
        });

        it("keeps layer opacity when paint is explicit", () => {
            const norm = normalizeGlyphPaint({
                name: "piece",
                paint: { fill: 1 },
                opacity: 0.5,
            })!;
            expect(norm.layerOpacity).to.equal(0.5);
            expect(norm.paint.fill).to.equal(1);
        });
    });

    describe("render parity (legacy colour vs paint)", () => {
        it("piece: colour matches paint.fill", () => {
            const legacy = renderLegendGlyphs([{ name: "piece", colour: 1 }]);
            const paint = renderLegendGlyphs([{ name: "piece", paint: { fill: 1 } }]);
            expect(normalizeSvgForGlyphCompare(legacy, { lenientOpacity: true })).to.equal(
                normalizeSvgForGlyphCompare(paint, { lenientOpacity: true }),
            );
        });

        it("hex-flat, hex-pointy, and meeple: legacy colour2 matches paint.border", () => {
            for (const name of ["hex-flat", "hex-pointy", "meeple"] as const) {
                const legacy = renderLegendGlyphs([{ name, colour2: 2 }]);
                const paint = renderLegendGlyphs([{ name, paint: { border: 2 } }]);
                expect(normalizeSvgForGlyphCompare(legacy, { lenientOpacity: true })).to.equal(
                    normalizeSvgForGlyphCompare(paint, { lenientOpacity: true }),
                    name,
                );
            }
        });

        it("piece: colour+colour2 matches paint fill+border", () => {
            const legacy = renderLegendGlyphs([{ name: "piece", colour: 1, colour2: 2 }]);
            const paint = renderLegendGlyphs([{ name: "piece", paint: { fill: 1, border: 2 } }]);
            expect(normalizeSvgForGlyphCompare(legacy, { lenientOpacity: true })).to.equal(
                normalizeSvgForGlyphCompare(paint, { lenientOpacity: true }),
            );
        });

        it("piece: legacy opacity matches paint.fill opacity (border stays opaque)", () => {
            const legacy = renderLegendGlyphs([{ name: "piece", colour: 1, colour2: 2, opacity: 0.5 }]);
            const paint = renderLegendGlyphs([
                { name: "piece", paint: { fill: { colour: 1, opacity: 0.5 }, border: 2 } },
            ]);
            expect(normalizeSvgForGlyphCompare(legacy, { lenientOpacity: true })).to.equal(
                normalizeSvgForGlyphCompare(paint, { lenientOpacity: true }),
            );
        });

        it("chess-king: colour+colour2 matches paint fill+border", () => {
            const glyph = { name: "chess-king-solid-traditional", colour: 1, colour2: 2 } as const;
            const legacy = renderLegendGlyphs([glyph], ["chess"]);
            const paint = renderLegendGlyphs(
                [{ name: glyph.name, paint: { fill: 1, border: 2 } }],
                ["chess"],
            );
            expect(normalizeSvgForGlyphCompare(legacy, { lenientOpacity: true })).to.equal(
                normalizeSvgForGlyphCompare(paint, { lenientOpacity: true }),
            );
        });

        it("legacy glyph opacity applies to fill slot, not the placed use", () => {
            const legacy = renderLegendGlyphs([
                { name: "piece", colour: 1, opacity: 0.5 },
                { name: "piece", colour: 1, opacity: 0.9 },
            ]);
            const paint = renderLegendGlyphs([
                { name: "piece", paint: { fill: { colour: 1, opacity: 0.5 } } },
                { name: "piece", paint: { fill: { colour: 1, opacity: 0.9 } } },
            ]);
            expect(normalizeSvgForGlyphCompare(legacy, { lenientOpacity: true })).to.equal(
                normalizeSvgForGlyphCompare(paint, { lenientOpacity: true }),
            );
            expect(legacy).to.not.match(/<g id="pieces"><use[^>]*opacity=/);
            expect(legacy).to.match(/fill-opacity="0\.5"|opacity="0\.5"/);
        });

        it("explicit paint: layer opacity applies on use, not baked into shared symbol", () => {
            const legacy = renderLegendGlyphs([
                { name: "piece", paint: { fill: 1 }, opacity: 0.5 },
                { name: "piece", paint: { fill: 1 }, opacity: 0.9 },
            ]);
            const paint = renderLegendGlyphs([
                { name: "piece", paint: { fill: 1 }, opacity: 0.5 },
                { name: "piece", paint: { fill: 1 }, opacity: 0.9 },
            ]);
            expect(normalizeSvgForGlyphCompare(legacy, { lenientOpacity: true })).to.equal(
                normalizeSvgForGlyphCompare(paint, { lenientOpacity: true }),
            );
            expect(legacy).to.match(/opacity="0\.5"/);
            expect(legacy).to.match(/opacity="0\.9"/);
        });

        it("pieces-text-style composite: legacy colour vs paint.fill parity", () => {
            const legacy = renderLegendGlyphs([
                { name: "piece", colour: 1 },
                { text: "18" },
            ]);
            const paint = renderLegendGlyphs([
                { name: "piece", paint: { fill: 1 } },
                { text: "18" },
            ]);
            expect(normalizeSvgForGlyphCompare(legacy, { lenientOpacity: true })).to.equal(
                normalizeSvgForGlyphCompare(paint, { lenientOpacity: true }),
            );
        });

        it("text without colour uses bestContrast against prior sheet fill", () => {
            const svg = renderLegendGlyphs([
                { name: "piece", colour: 1 },
                { text: "7" },
            ]);
            expect(svg).to.match(/<text[^>]*>[\s\S]*?7[\s\S]*?<\/text>/);
            const textTag = svg.match(/<text[\s\S]*?<\/text>/)?.[0] ?? "";
            expect(textTag).to.include("7");
            expect(textTag).to.match(/fill="#(fff|ffffff)"/);
        });

        it("d6-1: detail slot uses context fill when colour2 / paint.detail omitted", () => {
            const draw = makeDraw();
            const renderer = new DefaultRenderer();
            renderer.render(
                {
                    board: { style: "squares", width: 1, height: 1 },
                    legend: { A: { name: "d6-1", colour: 1 } },
                    pieces: "A",
                },
                draw,
                {
                    contextGlobal: true,
                    coloursGlobal: false,
                    showAnnotations: false,
                    sheets: ["dice"],
                    colourContext: {
                        background: "#ffffff",
                        fill: "#8844aa",
                        strokes: "#000000",
                        borders: "#000000",
                        labels: "#000000",
                        annotations: "#000000",
                    },
                },
            );
            const svg = draw.svg();
            expect(svg).to.match(/<circle\b[^>]*\bfill="#8844aa"/);
            expect(svg).to.match(/<rect\b[^>]*\bfill="#e31a1c"/);
        });

        for (const name of ["orb", "orb1", "orb2", "orb3"] as const) {
            it(`${name}: legacy colour matches paint.fill`, () => {
                const orbOpts = { lenientOpacity: true, lenientGradientIds: true } as const;
                const legacy = normalizeSvgForGlyphCompare(
                    renderLegendGlyphs([{ name, colour: 1 }], ["core"]),
                    orbOpts,
                );
                const paint = normalizeSvgForGlyphCompare(
                    renderLegendGlyphs([{ name, paint: { fill: 1 } }], ["core"]),
                    orbOpts,
                );
                expect(legacy).to.equal(paint);
            });
        }

        it("orca: colour+colour2 maps to fill+detail", () => {
            const legacy = normalizeSvgForGlyphCompare(
                renderLegendGlyphs([{ name: "orca", colour: 1, colour2: 2 }], ["core"]),
                { lenientOpacity: true },
            );
            const paint = normalizeSvgForGlyphCompare(
                renderLegendGlyphs([{ name: "orca", paint: { fill: 1, detail: 2 } }], ["core"]),
                { lenientOpacity: true },
            );
            expect(legacy).to.equal(paint);
        });
    });

    describe("paintFingerprint", () => {
        it("legacy opacity is part of paint fingerprint", () => {
            const a = normalizeGlyphPaint({ name: "piece", colour: 1, opacity: 0.5 })!;
            const b = normalizeGlyphPaint({ name: "piece", colour: 1, opacity: 0.9 })!;
            expect(paintFingerprint(a.paint)).to.not.equal(paintFingerprint(b.paint));
        });

        it("ignores explicit layer opacity on glyph", () => {
            const a = normalizeGlyphPaint({ name: "piece", paint: { fill: 1 }, opacity: 0.5 })!;
            const b = normalizeGlyphPaint({ name: "piece", paint: { fill: 1 }, opacity: 0.9 })!;
            expect(paintFingerprint(a.paint)).to.equal(paintFingerprint(b.paint));
        });

        it("differs when fill changes", () => {
            const a = normalizeGlyphPaint({ name: "piece", colour: 1 })!;
            const b = normalizeGlyphPaint({ name: "piece", colour: 2 })!;
            expect(paintFingerprint(a.paint)).to.not.equal(paintFingerprint(b.paint));
        });
    });

    describe("glyphCache", () => {
        it("reuses one styled symbol for same explicit paint and different layer opacity", () => {
            const draw = makeDraw();
            const renderer = new DefaultRenderer();
            renderer.render(
                {
                    board: { style: "squares", width: 1, height: 1 },
                    legend: {
                        X: [
                            { name: "piece", paint: { fill: 1 }, opacity: 0.5 },
                            { name: "piece", paint: { fill: 1 }, opacity: 0.9 },
                        ],
                    },
                    pieces: "X",
                },
                draw,
                { ...baseOptions, sheets: ["core"] },
            );
            const cache = (renderer as unknown as { glyphCache: Map<string, unknown> }).glyphCache;
            expect(cache.size).to.equal(1);
        });

        it("does not share styled symbols when legacy opacity differs", () => {
            const draw = makeDraw();
            const renderer = new DefaultRenderer();
            renderer.render(
                {
                    board: { style: "squares", width: 1, height: 1 },
                    legend: {
                        X: [
                            { name: "piece", colour: 1, opacity: 0.5 },
                            { name: "piece", colour: 1, opacity: 0.9 },
                        ],
                    },
                    pieces: "X",
                },
                draw,
                { ...baseOptions, sheets: ["core"] },
            );
            const cache = (renderer as unknown as { glyphCache: Map<string, unknown> }).glyphCache;
            expect(cache.size).to.equal(2);
        });

        it("does not reuse styled symbols when paint.fill differs", () => {
            const draw = makeDraw();
            const renderer = new DefaultRenderer();
            renderer.render(
                {
                    board: { style: "squares", width: 1, height: 1 },
                    legend: {
                        X: [
                            { name: "piece", colour: 1 },
                            { name: "piece", colour: 2 },
                        ],
                    },
                    pieces: "X",
                },
                draw,
                { ...baseOptions, sheets: ["core"] },
            );
            const cache = (renderer as unknown as { glyphCache: Map<string, unknown> }).glyphCache;
            expect(cache.size).to.equal(2);
        });
    });

    describe("schema", () => {
        const ajv = new Ajv({ strict: false, allErrors: true });
        const validate = ajv.compile(schema);

        it("accepts sheet glyph with paint and without legacy colour", () => {
            expect(
                validate({
                    board: null,
                    legend: { A: { name: "piece", paint: { fill: 1 } } },
                    pieces: "A",
                }),
            ).to.equal(true);
        });

        it("accepts sheet glyph with legacy colour only", () => {
            expect(
                validate({
                    board: null,
                    legend: { A: { name: "piece", colour: 1 } },
                    pieces: "A",
                }),
            ).to.equal(true);
        });

        it("accepts text glyph with colour and rejects paint on text", () => {
            expect(
                validate({
                    board: null,
                    legend: { T: { text: "9", colour: 1 } },
                    pieces: "T",
                }),
            ).to.equal(true);
            expect(
                validate({
                    board: null,
                    legend: { T: { text: "9", paint: { fill: 1 } } },
                    pieces: "T",
                }),
            ).to.equal(false);
        });
    });

    describe("priorCompositeLayerTint", () => {
        it("reads paint.fill from a prior sheet layer", () => {
            const glyphs: Glyph[] = [
                { name: "piece", paint: { fill: 1 } },
                { text: "9" },
            ];
            const bg = priorCompositeLayerTint(
                glyphs,
                1,
                () => "#resolved",
                "#default",
            );
            expect(bg).to.equal("#resolved");
        });
    });
});
