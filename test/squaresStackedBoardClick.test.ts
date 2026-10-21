import { expect } from "chai";
import "mocha";
import { render, type APRenderRep } from "../src/index.js";
import { coreRenderOptions, makeDraw } from "./helpers/renderTestDraw.js";

const stackedRep = (pieces: string, boardSize = 5): APRenderRep => ({
    board: { style: "squares-stacked", width: boardSize, height: boardSize },
    legend: {
        A1: [{ name: "piece-borderless", colour: 1, scale: 1.15 }],
        A2: [{ name: "piece-borderless", colour: 1, scale: 1.15 }],
    },
    pieces,
});

describe("squares-stacked boardClick", () => {
    it("uses one playfield overlay instead of per-cell hit targets", () => {
        const draw = makeDraw();
        render(stackedRep("-,-,-,-,-\n".repeat(5)), {
            ...coreRenderOptions,
            target: draw,
            boardClick() { /* handler required to build catcher */ },
        });

        expect(draw.findOne("#board-click-catcher")).to.not.equal(null);
        expect(draw.findOne("#board-click-catcher polygon")).to.not.equal(null);
        expect(draw.find("#click-cells").length).to.equal(0);
    });

    it("fires boardClick from the playfield overlay in open areas", () => {
        const draw = makeDraw();
        let clicked: { row: number; col: number; piece: string } | undefined;
        render(stackedRep("-,-,-,-,-\n".repeat(5)), {
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
        expect(clicked?.row).to.be.at.least(0).and.lessThan(9);
        expect(clicked?.col).to.be.at.least(0).and.lessThan(9);
    });
});
