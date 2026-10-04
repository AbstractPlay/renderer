import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { DefaultRenderer } from "../../src/renderers/default.js";
import type { APRenderRep, Glyph } from "../../src/schemas/schema.js";
import { normalizeSvgForGlyphCompare } from "../helpers/normalizeSvgForGlyphCompare.js";

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    registerWindow(window, window.document);
    return SVG(window.document.documentElement) as Svg;
};

function renderLegendGlyphs(glyphs: Glyph[]): string {
    const draw = makeDraw();
    const renderer = new DefaultRenderer();
    const json: APRenderRep = {
        board: { style: "squares", width: 1, height: 1 },
        legend: { X: glyphs.length === 1 ? glyphs[0]! : glyphs },
        pieces: "X",
    };
    renderer.render(json, draw, {
        contextGlobal: true,
        coloursGlobal: false,
        showAnnotations: false,
        sheets: ["core"],
    });
    return normalizeSvgForGlyphCompare(draw.svg(), {
        lenientOpacity: true,
        lenientGradientIds: true,
    });
}

const ORB_NAMES = ["orb", "orb1", "orb2", "orb3"] as const;

describe("Phase B4 render parity (orbs)", () => {
    for (const name of ORB_NAMES) {
        it(`${name}: legacy colour matches paint.fill`, () => {
            const legacy = renderLegendGlyphs([{ name, colour: 1 }]);
            const paint = renderLegendGlyphs([{ name, paint: { fill: 1 } }]);
            expect(legacy).to.equal(paint);
        });

        it(`${name}: player 2 colour vs paint.fill`, () => {
            const legacy = renderLegendGlyphs([{ name, colour: 2 }]);
            const paint = renderLegendGlyphs([{ name, paint: { fill: 2 } }]);
            expect(legacy).to.equal(paint);
        });
    }

    it("orca: colour+colour2 maps to fill+detail (legacy playerfill2)", () => {
        const legacy = renderLegendGlyphs([{ name: "orca", colour: 1, colour2: 2 }]);
        const paint = renderLegendGlyphs([{ name: "orca", paint: { fill: 1, detail: 2 } }]);
        expect(legacy).to.equal(paint);
    });
});
