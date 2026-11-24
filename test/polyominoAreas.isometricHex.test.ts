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

describe("isometric hex polymatrix stash hand", () => {
    it("scales stash icons to board cells, not the 500-unit sheet default", () => {
        const json: APRenderRep = {
            renderer: "isometric",
            board: { style: "hex-of-hex", minWidth: 4, maxWidth: 6 },
            legend: {
                M1T: [
                    [0, { fill: 1 }],
                    [{ fill: 1 }, { fill: 1, glyph: "circle" }],
                ],
                circle: { name: "circle", scale: 0.26 },
            },
            pieces: [
                [[], [], [], []],
                [[], [], [], [], []],
                [[], [], [], [], [], []],
                [[], [], [], [], []],
                [[], [], [], []],
            ],
            areas: [
                {
                    type: "pieces",
                    label: "Player 1 stash",
                    width: 4,
                    pieces: ["M1T"],
                },
            ],
        };
        const draw = makeDraw();
        render(json, { target: draw, staticAnimations: true });
        const stashLayer = draw.findOne("#_pieces0");
        expect(stashLayer).to.not.equal(null);
        const use = stashLayer!.findOne("use") as Svg | null;
        expect(use).to.not.equal(null);
        const w = Number(use!.width());
        const h = Number(use!.height());
        expect(Math.max(w, h)).to.be.greaterThan(30);
        expect(Math.max(w, h)).to.be.lessThan(120);
    });

    it("does not lay out hex stash wider than the board (viewBox stays board-scaled)", () => {
        const json: APRenderRep = {
            renderer: "isometric",
            board: { style: "hex-of-hex", minWidth: 4, maxWidth: 6 },
            legend: { M1T: [[1, 2, 1]] },
            pieces: [
                [[], [], [], []],
                [[], [], [], [], []],
                [[], [], [], [], [], []],
                [[], [], [], [], []],
                [[], [], [], []],
            ],
            areas: [
                {
                    type: "pieces",
                    label: "stash",
                    width: 9,
                    pieces: ["M1T", "M1T", "M1T", "M1T", "M1T", "M1T", "M1T", "M1T", "M1T", "M1T"],
                },
            ],
        };
        const draw = makeDraw();
        render(json, { target: draw, staticAnimations: true });
        const board = draw.findOne("#board") as Svg;
        const stash = draw.findOne("#_pieces0") as Svg;
        const boardW = board.rbox(draw).width;
        const stashW = stash.rbox(draw).width;
        expect(stashW).to.be.at.most(boardW * 1.02);
    });

    it("sizes monohex and large polyhex stash entries to the same use box (shared legend viewbox)", () => {
        const json: APRenderRep = {
            renderer: "isometric",
            board: { style: "hex-of-hex", minWidth: 4, maxWidth: 6 },
            legend: {
                B1: [[2]],
                A4: [[0, 2, 0], [2, 2, 2], [0, 2, 0]],
            },
            pieces: [
                [[], [], [], []],
                [[], [], [], [], []],
                [[], [], [], [], [], []],
                [[], [], [], [], []],
                [[], [], [], []],
            ],
            areas: [
                {
                    type: "pieces",
                    label: "stash",
                    width: 2,
                    pieces: ["B1", "A4"],
                },
            ],
        };
        const draw = makeDraw();
        render(json, { target: draw, staticAnimations: true });
        const stashLayer = draw.findOne("#_pieces0") as Svg;
        const uses = stashLayer!.find("use");
        expect(uses.length).to.equal(2);
        const w0 = Number(uses[0]!.width());
        const h0 = Number(uses[0]!.height());
        const w1 = Number(uses[1]!.width());
        const h1 = Number(uses[1]!.height());
        expect(w0).to.equal(w1);
        expect(h0).to.equal(h1);
    });

    it("keeps straight and angled trominos at similar hex size in the stash", () => {
        const json: APRenderRep = {
            renderer: "isometric",
            board: { style: "hex-of-hex", minWidth: 4, maxWidth: 6 },
            legend: {
                STR: [[1, 2, 1]],
                ANG: [
                    [2, 1],
                    [1, 0],
                ],
            },
            pieces: [
                [[], [], [], []],
                [[], [], [], [], []],
                [[], [], [], [], [], []],
                [[], [], [], [], []],
                [[], [], [], []],
            ],
            areas: [
                {
                    type: "pieces",
                    label: "stash",
                    width: 2,
                    pieces: ["STR", "ANG"],
                },
            ],
        };
        const draw = makeDraw();
        render(json, { target: draw, staticAnimations: true });
        const stashLayer = draw.findOne("#_pieces0") as Svg;
        const uses = stashLayer!.find("use");
        expect(uses.length).to.equal(2);
        const span = (u: Svg) => Math.max(Number(u.width()), Number(u.height()));
        const s0 = span(uses[0]!);
        const s1 = span(uses[1]!);
        expect(s0).to.be.greaterThan(20);
        expect(s1).to.be.greaterThan(20);
        expect(Math.max(s0, s1) / Math.min(s0, s1)).to.be.lessThan(1.85);
    });
});