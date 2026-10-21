import { expect } from "chai";
import "mocha";
import {
    boardRotateFromRender,
    compositePanelClickRotation,
} from "../src/composite/compositePanelRotation.js";
import type { APRenderCompositePanel } from "../src/schemas/composite.js";
import type { APRenderRep } from "../src/schemas/schema.js";

const panel = (rotate: number | undefined, boardRotate: number | undefined): APRenderCompositePanel => ({
    id: "p",
    rotate,
    render: {
        board: {
            style: "squares",
            width: 2,
            height: 2,
            ...(boardRotate !== undefined ? { rotate: boardRotate } : {}),
        },
        legend: { A: { name: "piece", paint: { fill: 1 } } },
        pieces: "AA\nAA",
    } as APRenderRep,
});

describe("compositePanelClickRotation", () => {
    it("sums panels[].rotate and render.board.rotate", () => {
        expect(compositePanelClickRotation(panel(90, 90))).to.equal(180);
        expect(compositePanelClickRotation(panel(undefined, 180))).to.equal(180);
        expect(compositePanelClickRotation(panel(270, 90))).to.equal(0);
    });

    it("boardRotateFromRender returns 0 when board has no rotate", () => {
        const rep = panel(undefined, undefined).render;
        expect(boardRotateFromRender(rep)).to.equal(0);
    });
});
