import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { DefaultRenderer } from "../../src/renderers/default.js";
import type { APRenderRep, Glyph } from "../../src/schemas/schema.js";
import { ArimaaSheet } from "../../src/sheets/contact/arimaa.js";
import { ChessSheet } from "../../src/sheets/contact/chess.js";
import { normalizeSvgForGlyphCompare } from "../helpers/normalizeSvgForGlyphCompare.js";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const baselinePath = join(repoRoot, "test", "fixtures", "chess-arimaa-render-baseline.json");
const baseline = JSON.parse(readFileSync(baselinePath, "utf8")) as Record<string, string>;

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    registerWindow(window, window.document);
    return SVG(window.document.documentElement) as Svg;
};

function renderLegendGlyphs(sheetName: string, glyphs: Glyph[]): string {
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
        sheets: [sheetName],
    });
    return normalizeSvgForGlyphCompare(draw.svg(), { lenientOpacity: true });
}

describe("Phase B2 render parity (chess + arimaa)", () => {
    describe("legacy colour JSON matches pre-B2 baseline captures", () => {
        for (const name of ChessSheet.glyphs.keys()) {
            it(`chess:${name} duotone`, () => {
                const key = `chess:${name}:duotone`;
                const svg = renderLegendGlyphs("chess", [{ name, colour: 1, colour2: 2 }]);
                const expected = normalizeSvgForGlyphCompare(baseline[key]!, { lenientOpacity: true });
                expect(svg).to.equal(expected, key);
            });
            it(`chess:${name} fillOnly`, () => {
                const key = `chess:${name}:fillOnly`;
                const svg = renderLegendGlyphs("chess", [{ name, colour: 1 }]);
                const expected = normalizeSvgForGlyphCompare(baseline[key]!, { lenientOpacity: true });
                expect(svg).to.equal(expected, key);
            });
        }
        for (const name of ArimaaSheet.glyphs.keys()) {
            it(`arimaa:${name} duotone`, () => {
                const key = `arimaa:${name}:duotone`;
                const svg = renderLegendGlyphs("arimaa", [{ name, colour: 1, colour2: 2 }]);
                const expected = normalizeSvgForGlyphCompare(baseline[key]!, { lenientOpacity: true });
                expect(svg).to.equal(expected, key);
            });
            it(`arimaa:${name} fillOnly`, () => {
                const key = `arimaa:${name}:fillOnly`;
                const svg = renderLegendGlyphs("arimaa", [{ name, colour: 1 }]);
                const expected = normalizeSvgForGlyphCompare(baseline[key]!, { lenientOpacity: true });
                expect(svg).to.equal(expected, key);
            });
        }
    });

    describe("paint JSON matches legacy colour for representative glyphs", () => {
        const samples = [
            { sheet: "chess" as const, name: "chess-king-solid-traditional" },
            { sheet: "chess" as const, name: "chess-pawn-solid-traditional" },
            { sheet: "chess" as const, name: "chess-knight-outline-traditional" },
            { sheet: "arimaa" as const, name: "arimaa-elephant" },
            { sheet: "arimaa" as const, name: "arimaa-horse" },
        ];
        for (const { sheet, name } of samples) {
            it(`${sheet}:${name} colour+colour2 vs paint`, () => {
                const legacy = renderLegendGlyphs(sheet, [{ name, colour: 1, colour2: 2 }]);
                const paint = renderLegendGlyphs(sheet, [{ name, paint: { fill: 1, border: 2 } }]);
                expect(normalizeSvgForGlyphCompare(legacy, { lenientOpacity: true })).to.equal(
                    normalizeSvgForGlyphCompare(paint, { lenientOpacity: true }),
                );
            });
            it(`${sheet}:${name} colour-only vs paint.fill`, () => {
                const legacy = renderLegendGlyphs(sheet, [{ name, colour: 1 }]);
                const paint = renderLegendGlyphs(sheet, [{ name, paint: { fill: 1 } }]);
                expect(normalizeSvgForGlyphCompare(legacy, { lenientOpacity: true })).to.equal(
                    normalizeSvgForGlyphCompare(paint, { lenientOpacity: true }),
                );
            });
        }
    });
});
