import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, type Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { isBoardStyleOnlyInline, render, renderLegendGlyph, type APRenderRep } from "../src/index.js";

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    const document = window.document;
    registerWindow(window, document);
    return SVG(document.documentElement) as Svg;
};

const trominoL: NonNullable<APRenderRep["legend"]>["A3"] = [
    [0, 1],
    [1, 1],
];

describe("inline polymatrix glyph (board: null)", () => {
    it("isBoardStyleOnlyInline requires style without grid dimensions", () => {
        expect(isBoardStyleOnlyInline(null)).to.equal(false);
        expect(isBoardStyleOnlyInline({ style: "hex-of-hex" })).to.equal(true);
        expect(isBoardStyleOnlyInline({ style: "hex-even-f", minWidth: 3, maxWidth: 5 })).to.equal(false);
    });

    it("defaults legend polymatrix to square cells", () => {
        const json: APRenderRep = {
            board: null,
            legend: { A3: trominoL },
            pieces: "A3",
        };
        const draw = makeDraw();
        render(json, { target: draw, staticAnimations: true });
        const piece = draw.findOne("#A3");
        expect(piece).to.not.equal(null);
        expect(piece!.find("rect").length).to.be.greaterThan(0);
        expect(piece!.find("polygon").length).to.equal(0);
    });

    it("uses hex-of-hex cells for style-only board", () => {
        const json: APRenderRep = {
            board: { style: "hex-of-hex" },
            legend: { A3: trominoL },
            pieces: "A3",
        };
        const draw = makeDraw();
        render(json, { target: draw, staticAnimations: true });
        const piece = draw.findOne("#A3");
        expect(piece).to.not.equal(null);
        expect(piece!.find("polygon").length).to.be.greaterThan(0);
        expect(piece!.find("rect").length).to.equal(0);
        expect(draw.findOne("#board")).to.equal(null);
    });

    it("uses honeycomb hex-even-f placement for style-only board (connected L)", () => {
        const json: APRenderRep = {
            board: { style: "hex-even-f" },
            legend: { A3: trominoL },
            pieces: "A3",
        };
        const draw = makeDraw();
        render(json, { target: draw, staticAnimations: true });
        const piece = draw.findOne("#A3");
        expect(piece).to.not.equal(null);
        expect(piece!.find("polygon").length).to.equal(3);
        expect(piece!.find("path").length).to.equal(1);
        expect(draw.findOne("#board")).to.equal(null);
    });

    it("renderLegendGlyph forwards style-only board", () => {
        const svg = renderLegendGlyph(trominoL, {
            board: { style: "hex-of-hex" },
            target: makeDraw(),
            staticAnimations: true,
        });
        expect(svg).to.include("polygon");
        expect(svg).to.not.include("<rect");
    });
});