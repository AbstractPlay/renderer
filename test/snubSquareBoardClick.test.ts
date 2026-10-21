import { expect } from "chai";
import "mocha";
import { render, type APRenderRep } from "../src/index.js";
import { coreRenderOptions, makeDraw } from "./helpers/renderTestDraw.js";

const snubRep = (pieces: string): APRenderRep => ({
    renderer: "stacking-offset",
    board: { style: "snubsquare", width: 7, height: 7 },
    legend: {
        A: { name: "piece", paint: { fill: 1 } },
        B: { name: "piece", paint: { fill: 2 } },
    },
    pieces,
});

const onyxRep = (pieces: string): APRenderRep => ({
    renderer: "stacking-offset",
    board: { style: "onyx", width: 5, height: 5 },
    legend: {
        A: { name: "piece", paint: { fill: 1 } },
    },
    pieces,
});

const hexOfTriRep = (pieces: string | null): APRenderRep => ({
    renderer: "stacking-offset",
    board: { style: "hex-of-tri", minWidth: 4, maxWidth: 7 },
    legend: {
        A: { name: "piece", paint: { fill: 1 } },
        B: { name: "piece", paint: { fill: 2 } },
    },
    pieces,
});

const vertexRep = (pieces: string | null, width = 19, height = 19): APRenderRep => ({
    board: { style: "vertex", width, height },
    legend: {
        A: { name: "piece", paint: { fill: 1 } },
        B: { name: "piece", paint: { fill: 2 } },
    },
    pieces,
});

describe("line-grid nearest boardClick", () => {
    it("snubsquare: click in open grid area resolves nearest vertex", () => {
        const draw = makeDraw();
        let clicked: { row: number; col: number; piece: string } | undefined;
        render(snubRep("-,-,-,-,-,-,-\n-,-,-,-,-,-,-\n-,-,-,-,-,-,-\n-,-,-,-,-,-,-\n-,-,-,-,-,-,-\n-,-,-,-,-,-,-\n-,-,-,-,-,-,-"), {
            ...coreRenderOptions,
            target: draw,
            boardClick(row, col, piece) {
                clicked = { row, col, piece };
            },
        });

        const catcher = draw.findOne("#board-click-catcher polygon")!;
        expect(catcher).to.not.equal(null);
        const box = catcher.rbox(draw);
        catcher.fire("click", { clientX: box.cx, clientY: box.cy });

        expect(clicked).to.not.equal(undefined);
        expect(clicked?.piece).to.equal("");
        expect(clicked?.row).to.be.at.least(0).and.lessThan(7);
        expect(clicked?.col).to.be.at.least(0).and.lessThan(7);
    });

    it("onyx: click in open grid area resolves nearest vertex", () => {
        const draw = makeDraw();
        let clicked: { row: number; col: number; piece: string } | undefined;
        render(onyxRep("-,-,-,-,-\n-,-,-,-,-\n-,-,-,-,-\n-,-,-,-,-\n-,-,-,-,-"), {
            ...coreRenderOptions,
            target: draw,
            boardClick(row, col, piece) {
                clicked = { row, col, piece };
            },
        });

        const catcher = draw.findOne("#board-click-catcher polygon")!;
        const box = catcher.rbox(draw);
        catcher.fire("click", { clientX: box.cx, clientY: box.cy });

        expect(clicked).to.not.equal(undefined);
        expect(clicked?.piece).to.equal("");
    });

    it("stacking-offset: stacked piece click returns stack index, not playfield", () => {
        const draw = makeDraw();
        let clicked: { row: number; col: number; piece: string } | undefined;
        render(snubRep("AB,-,-,-,-,-,-\n" + "-,-,-,-,-,-,-\n".repeat(6)), {
            ...coreRenderOptions,
            target: draw,
            boardClick(row, col, piece) {
                clicked = { row, col, piece };
            },
        });

        expect(draw.findOne("#board-click-catcher")).to.not.equal(null);
        const uses = draw.find("#pieces use");
        expect(uses.length).to.equal(2);
        uses[1]!.fire("click");

        expect(clicked).to.deep.equal({ row: 0, col: 0, piece: "1" });
    });

    it("hex-of-tri: open grid click uses playfield overlay", () => {
        const draw = makeDraw();
        let clicked: { row: number; col: number; piece: string } | undefined;
        render(hexOfTriRep(null), {
            ...coreRenderOptions,
            target: draw,
            boardClick(row, col, piece) {
                clicked = { row, col, piece };
            },
        });

        const catcher = draw.findOne("#board-click-catcher polygon")!;
        expect(catcher).to.not.equal(null);
        const box = catcher.rbox(draw);
        catcher.fire("click", { clientX: box.cx, clientY: box.cy });

        expect(clicked).to.not.equal(undefined);
        expect(clicked?.piece).to.equal("");
    });

    it("vertex (default renderer): open grid click uses playfield overlay", () => {
        const draw = makeDraw();
        let clicked: { row: number; col: number; piece: string } | undefined;
        render(vertexRep(null), {
            ...coreRenderOptions,
            target: draw,
            boardClick(row, col, piece) {
                clicked = { row, col, piece };
            },
        });

        const catcher = draw.findOne("#board-click-catcher polygon")!;
        expect(catcher).to.not.equal(null);
        const box = catcher.rbox(draw);
        catcher.fire("click", { clientX: box.cx, clientY: box.cy });

        expect(clicked).to.not.equal(undefined);
        expect(clicked?.piece).to.equal("");
        expect(clicked?.row).to.be.at.least(0).and.lessThan(19);
        expect(clicked?.col).to.be.at.least(0).and.lessThan(19);
    });
});
