import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import {
    addPrefix,
    render,
    renderglyph,
    renderSheetGlyph,
    renderLegendGlyph,
    renderInlineGlyph,
    type APRenderRep,
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

    it("renderLegendGlyph renders decktet-style composite glyphs", () => {
        const entry: APRenderRep["legend"][string] = [
            { name: "piece-square-borderless", colour: 1, scale: 1 },
            {
                name: "decktet-crown",
                scale: 0.5,
                colour: "_context_strokes",
                nudge: { dx: 250, dy: -250 },
            },
            {
                name: "decktet-waves",
                scale: 0.5,
                nudge: { dx: -250, dy: -250 },
            },
        ];
        const opts = glyphOpts();
        const svg = renderLegendGlyph(entry, opts);
        expect(svg).to.include("<svg");
        expect(svg.length).to.be.greaterThan(100);
        const sheetOnly = renderSheetGlyph("piece", 1, opts);
        expect(svg).to.not.equal(sheetOnly);
        const rep: APRenderRep = {
            board: null,
            legend: { A: entry },
            pieces: "A",
        };
        const draw = makeDraw();
        const renderOpts = { ...opts, target: draw, staticAnimations: true };
        const canvas = render(rep, renderOpts);
        expect(svg).to.equal(addPrefix(canvas.svg(), renderOpts));
    });

    it("renderLegendGlyph renders isometric legend entries", () => {
        const entry = { piece: "cube", height: 30, colour: 1 };
        const opts = glyphOpts();
        const svg = renderLegendGlyph(entry, opts);
        expect(svg).to.include("<svg");
        const rep: APRenderRep = {
            renderer: "isometric",
            board: null,
            legend: { A: entry },
            pieces: "A",
        };
        const draw = makeDraw();
        const renderOpts = { ...opts, target: draw, staticAnimations: true };
        const canvas = render(rep, renderOpts);
        expect(svg).to.equal(addPrefix(canvas.svg(), renderOpts));
        expect(svg.length).to.be.greaterThan(500);
        expect(svg).to.not.include('id="board"');
    });

    it("renderLegendGlyph renders polymatrix legend entries on a null board", () => {
        const entry: APRenderRep["legend"][string] = [[1], [2]];
        const opts = glyphOpts();
        const svg = renderLegendGlyph(entry, opts);
        expect(svg).to.include("<svg");
        const rep: APRenderRep = {
            board: null,
            legend: { A: entry },
            pieces: "A",
        };
        const draw = makeDraw();
        const renderOpts = { ...opts, target: draw, staticAnimations: true };
        const canvas = render(rep, renderOpts);
        expect(svg).to.equal(addPrefix(canvas.svg(), renderOpts));
    });
});
