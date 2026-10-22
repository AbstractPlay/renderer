import { expect } from "chai";
import "mocha";
import { render, type APRenderRep } from "../src/index.js";
import { coreRenderOptions, makeDraw } from "./helpers/renderTestDraw.js";

const brickaRep = (pieces: string | null): APRenderRep => ({
    board: { style: "bricka" },
    legend: {
        A: { name: "piece", paint: { fill: 1 } },
    },
    pieces,
});

describe("bricka boardClick", () => {
    it("uses one playfield overlay and resolves nearest intersection", () => {
        const draw = makeDraw();
        let clicked: { row: number; col: number; piece: string } | undefined;
        render(brickaRep(null), {
            ...coreRenderOptions,
            target: draw,
            boardClick(row, col, piece) {
                clicked = { row, col, piece };
            },
        });

        const catchers = draw.find("#board-click-catcher");
        expect(catchers.length).to.equal(1);
        const catcher = catchers[0]!.findOne("polygon")!;
        const box = catcher.rbox(draw);
        catcher.fire("click", { clientX: box.cx, clientY: box.cy });

        expect(clicked).to.not.equal(undefined);
        expect(clicked?.piece).to.equal("");
        expect(clicked?.row).to.be.at.least(0).and.lessThan(13);
        expect(clicked?.col).to.be.at.least(0).and.lessThan(13);
    });
});
