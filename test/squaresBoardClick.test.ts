import { expect } from "chai";
import "mocha";
import { render, type APRenderRep } from "../src/index.js";
import { coreRenderOptions, makeDraw } from "./helpers/renderTestDraw.js";

const checkeredRep = (pieces: string, rotate?: number): APRenderRep => ({
    board: {
        style: "squares-checkered",
        width: 2,
        height: 2,
        ...(rotate !== undefined ? { rotate } : {}),
    },
    legend: {
        A: { name: "piece", paint: { fill: 1 } },
    },
    pieces,
});

describe("squares boardClick (single-board render)", () => {
    it("invokes boardClick for empty checkered cells", () => {
        const draw = makeDraw();
        let clicked: { row: number; col: number; piece: string } | undefined;
        render(checkeredRep("A-\n--"), {
            ...coreRenderOptions,
            target: draw,
            boardClick(row, col, piece) {
                clicked = { row, col, piece };
            },
        });

        const board = draw.findOne("#board");
        expect(board).to.not.equal(null);
        const cellUse = draw.find("#tiles use")[3]!;
        const box = cellUse.rbox(draw);
        board!.fire("click", { clientX: box.cx, clientY: box.cy });

        expect(clicked).to.not.equal(undefined);
        expect(clicked?.piece).to.equal("");
    });

    it("invokes boardClick for empty cells when board.rotate is 180", () => {
        const draw = makeDraw();
        let clicked: { row: number; col: number; piece: string } | undefined;
        render(checkeredRep("A-\n--", 180), {
            ...coreRenderOptions,
            target: draw,
            rotate: 180,
            boardClick(row, col, piece) {
                clicked = { row, col, piece };
            },
        });

        const board = draw.findOne("#board");
        const cellUse = draw.find("#tiles use")[3]!;
        const box = cellUse.rbox(draw);
        board!.fire("click", { clientX: box.cx, clientY: box.cy });

        expect(clicked?.piece).to.equal("");
        expect(clicked?.row).to.be.at.least(0);
        expect(clicked?.col).to.be.at.least(0);
    });
});
