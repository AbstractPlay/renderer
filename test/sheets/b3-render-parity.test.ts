import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { DefaultRenderer } from "../../src/renderers/default.js";
import type { APRenderRep, Glyph } from "../../src/schemas/schema.js";
import { DiceSheet } from "../../src/sheets/contact/dice.js";
import { normalizeSvgForGlyphCompare } from "../helpers/normalizeSvgForGlyphCompare.js";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const baselinePath = join(repoRoot, "test", "fixtures", "dice-render-baseline.json");
const baseline = JSON.parse(readFileSync(baselinePath, "utf8")) as Record<string, string>;

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
        sheets: ["dice"],
    });
    return normalizeSvgForGlyphCompare(draw.svg(), { lenientOpacity: true });
}

describe("dice render parity (slot migration)", () => {
    describe("legacy colour JSON matches pre-migration baseline", () => {
        for (const name of DiceSheet.glyphs.keys()) {
            it(`dice:${name} duotone`, () => {
                const key = `dice:${name}:duotone`;
                const svg = renderLegendGlyphs([{ name, colour: 1, colour2: 2 }]);
                const expected = normalizeSvgForGlyphCompare(baseline[key]!, { lenientOpacity: true });
                expect(svg).to.equal(expected, key);
            });
            it(`dice:${name} fillOnly`, () => {
                const key = `dice:${name}:fillOnly`;
                const svg = renderLegendGlyphs([{ name, colour: 1 }]);
                const expected = normalizeSvgForGlyphCompare(baseline[key]!, { lenientOpacity: true });
                expect(svg).to.equal(expected, key);
            });
        }
    });

    describe("paint JSON matches legacy colour for representative glyphs", () => {
        const samples = [
            { name: "d6-1" },
            { name: "d6-6" },
            { name: "d6-empty" },
        ];
        for (const { name } of samples) {
            it(`${name}: paint mirrors colour`, () => {
                const legacyDuotone = renderLegendGlyphs([{ name, colour: 1, colour2: 2 }]);
                const paintDuotone = renderLegendGlyphs([
                    { name, paint: { fill: 1, detail: 2 } },
                ]);
                expect(paintDuotone).to.equal(legacyDuotone);
            });
            it(`${name}: paint fill mirrors colour only`, () => {
                const legacy = renderLegendGlyphs([{ name, colour: 1 }]);
                const paintOnly = renderLegendGlyphs([{ name, paint: { fill: 1 } }]);
                expect(paintOnly).to.equal(legacy);
            });
        }
    });

    it("d6-1: detail slot uses context fill when colour2 / paint.detail omitted", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        const json: APRenderRep = {
            board: { style: "squares", width: 1, height: 1 },
            legend: { A: { name: "d6-1", colour: 1 } },
            pieces: "A",
        };
        renderer.render(json, draw, {
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
        });
        const svg = draw.svg();
        expect(svg).to.match(/<circle\b[^>]*\bfill="#8844aa"/);
        expect(svg).to.match(/<rect\b[^>]*\bfill="#e31a1c"/);
    });
});
