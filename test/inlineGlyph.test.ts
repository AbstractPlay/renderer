import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import {
    renderglyph,
    renderSheetGlyph,
    renderLegendGlyph,
    renderInlineGlyph,
} from "../src/index";

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    const document = window.document;
    registerWindow(window, document);
    return SVG(document.documentElement) as Svg;
};

const glyphOpts = () => ({ target: makeDraw() });

describe("inline glyph helpers", () => {
    it("renderSheetGlyph returns a non-empty svg", () => {
        const svg = renderSheetGlyph("piece", 1, glyphOpts());
        expect(svg).to.include("<svg");
        expect(svg.length).to.be.greaterThan(50);
    });

    it("renderglyph matches renderSheetGlyph for the same sheet glyph", () => {
        const fromLegacy = renderglyph("piece", 2, {
            ...glyphOpts(),
            svgid: "parity-test",
        });
        const fromSheet = renderSheetGlyph("piece", 2, {
            ...glyphOpts(),
            svgid: "parity-test",
        });
        expect(fromLegacy).to.equal(fromSheet);
    });

    it("renderInlineGlyph sheet mode matches renderSheetGlyph", () => {
        const svg = renderInlineGlyph(
            { mode: "sheet", name: "piece", colour: 1 },
            glyphOpts(),
        );
        expect(svg).to.include("<svg");
        const direct = renderSheetGlyph("piece", 1, glyphOpts());
        expect(svg).to.equal(direct);
    });

    it("renderLegendGlyph accepts a single Glyph object", () => {
        const svg = renderLegendGlyph({ name: "piece", colour: 3 }, glyphOpts());
        expect(svg).to.include("<svg");
        expect(svg).to.equal(renderSheetGlyph("piece", 3, glyphOpts()));
    });

    it("renderInlineGlyph legend mode matches renderLegendGlyph", () => {
        const entry = { name: "piece", colour: 1 };
        const svg = renderInlineGlyph(
            { mode: "legend", entry },
            glyphOpts(),
        );
        expect(svg).to.equal(renderLegendGlyph(entry, glyphOpts()));
    });
});
