import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, type Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { render, type APRenderRep } from "../src/index.js";

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    const document = window.document;
    registerWindow(window, document);
    return SVG(document.documentElement) as Svg;
};

describe("buildPolyHex", () => {
    it("places per-cell decorations in a group, not a clipped nested svg", () => {
        const json: APRenderRep = {
            renderer: "isometric",
            board: { style: "hex-of-hex", minWidth: 4, maxWidth: 6 },
            legend: {
                PUNCT_DOT: { name: "circle", paint: { fill: "#111" }, scale: 0.35 },
                T: [
                    [{ fill: 1, glyph: "PUNCT_DOT" }, { fill: 1 }],
                    [{ fill: 1 }, 0],
                ],
            },
            pieces: [
                [[], [], [], []],
                [[], [], [], [], []],
                [[], [], [], [], [], []],
                [[], [], [], [], []],
                [[], [], [], []],
            ] as APRenderRep["pieces"],
        };
        const draw = makeDraw();
        render(json, { target: draw, staticAnimations: true });
        const piece = draw.findOne("#T") as Svg;
        expect(piece).to.not.equal(null);
        const nestedGlyphLayers = piece!.find("svg").length;
        expect(nestedGlyphLayers).to.equal(0);
        expect(piece!.find("g").length).to.be.greaterThan(0);
    });

    it("centers per-cell decorations inside the polymatrix icon bounds", () => {
        const json: APRenderRep = {
            renderer: "isometric",
            board: { style: "hex-of-hex", minWidth: 4, maxWidth: 6 },
            legend: {
                PUNCT_DOT: { name: "circle", paint: { fill: "#111" }, scale: 0.35 },
                MINOR_DOT: { name: "circle", paint: { fill: "#fff", stroke: "#111" }, scale: 0.3 },
                P3b: [
                    [0, { fill: 1, glyph: "MINOR_DOT" }],
                    [{ fill: 1, glyph: "MINOR_DOT" }, { fill: 1, glyph: "PUNCT_DOT" }],
                ],
            },
            pieces: [
                [[], [], [], []],
                [[], [], [], [], []],
                [[], [], [], [], [], []],
                [[], [], [], [], []],
                [[], [], [], []],
            ] as APRenderRep["pieces"],
        };
        const draw = makeDraw();
        render(json, { target: draw, staticAnimations: true });
        const piece = draw.findOne("#P3b");
        expect(piece).to.not.equal(null);
        const iconBox = piece!.bbox();
        const uses = piece!.find("use");
        expect(uses.length).to.equal(3);
        for (const use of uses) {
            const b = use.bbox();
            const cx = b.x + b.width / 2;
            const cy = b.y + b.height / 2;
            expect(cx, "glyph x outside icon").to.be.at.least(iconBox.x - 2);
            expect(cx).to.be.at.most(iconBox.x + iconBox.width + 2);
            expect(cy, "glyph y outside icon").to.be.at.least(iconBox.y - 2);
            expect(cy).to.be.at.most(iconBox.y + iconBox.height + 2);
        }
    });

    it("renders occupied hex polygons for a hex-board polymatrix legend", () => {
        const json: APRenderRep = {
            renderer: "isometric",
            board: {
                style: "hex-of-hex",
                minWidth: 4,
                maxWidth: 6,
            },
            legend: {
                T: [
                    [
                        { fill: 1, glyph: { name: "circle", paint: { fill: "#000" } } },
                        { fill: 1 },
                        null,
                    ],
                    [null, { fill: 1 }, null],
                ],
            },
            pieces: [
                [[], [], [], []],
                [[], [], [], [], []],
                [[], [], [], [], [], []],
                [[], [], [], [], []],
                [[], [], [], []],
            ] as APRenderRep["pieces"],
        };
        const draw = makeDraw();
        render(json, { target: draw, staticAnimations: true });
        const piece = draw.findOne("#T");
        expect(piece).to.not.equal(null);
        expect(piece!.find("polygon").length).to.be.greaterThan(0);
    });
});