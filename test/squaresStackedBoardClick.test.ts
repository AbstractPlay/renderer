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
    it("fires boardClick for upper-layer sub-cells (e.g. Upper Hand 2f2 → row 7, col 5)", () => {
        const pieces =
            "_\n"
            + "A1,A1,-,-,-\n"
            + "-,-,-,-,-\n"
            + "-,-,-,-,-\n"
            + "-,-,-,-,-\n"
            + "_\n"
            + "-,-,-,-\n"
            + "-,-,-,-\n"
            + "-,-,-,-\n"
            + "-,-,-,-";
        const draw = makeDraw();
        let clicked: { row: number; col: number; piece: string } | undefined;
        render(stackedRep(pieces), {
            ...coreRenderOptions,
            target: draw,
            boardClick(row, col, piece) {
                clicked = { row, col, piece };
            },
        });

        const cell = draw.findOne('[data-ap-click-row="7"][data-ap-click-col="5"]')!;
        expect(cell).to.not.equal(null);
        cell.fire("click");

        expect(clicked).to.deep.equal({ row: 7, col: 5, piece: "" });
    });

    it("fires boardClick for base-layer sub-cells", () => {
        const draw = makeDraw();
        let clicked: { row: number; col: number; piece: string } | undefined;
        render(stackedRep("-,-,-,-,-\n".repeat(5)), {
            ...coreRenderOptions,
            target: draw,
            boardClick(row, col, piece) {
                clicked = { row, col, piece };
            },
        });

        const cell = draw.findOne('[data-ap-click-row="8"][data-ap-click-col="8"]')!;
        cell.fire("click");

        expect(clicked).to.deep.equal({ row: 8, col: 8, piece: "" });
    });
});
