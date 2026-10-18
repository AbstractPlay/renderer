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

        const board = draw.findOne("#board");
        expect(board).to.not.equal(null);
        const box = board!.rbox(draw);
        board!.fire("click", { clientX: box.cx, clientY: box.cy });

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

        const board = draw.findOne("#board");
        expect(board).to.not.equal(null);
        const box = board!.rbox(draw);
        board!.fire("click", { clientX: box.cx, clientY: box.cy });

        expect(clicked).to.not.equal(undefined);
        expect(clicked?.piece).to.equal("");
    });
});
