import { expect } from "chai";
import "mocha";
import { render, type APRenderRep } from "../src/index.js";
import { coreRenderOptions, makeDraw } from "./helpers/renderTestDraw.js";

const snubRep = (blocked?: { row: number; col: number }[], width = 5, height = 5): APRenderRep => ({
    renderer: "stacking-offset",
    board: {
        style: "snubsquare",
        width,
        height,
        ...(blocked !== undefined ? { blocked } : {}),
    },
    legend: { A: { name: "piece", paint: { fill: 1 } } },
    pieces: Array.from({ length: height }, () => Array.from({ length: width }, () => "-").join(",")).join("\n"),
});

describe("snubsquare blocked vertices", () => {
    it("omits grid lines incident on blocked intersections", () => {
        const drawFull = makeDraw();
        const drawBlocked = makeDraw();
        render(snubRep(undefined), { ...coreRenderOptions, target: drawFull });
        render(snubRep([{ row: 2, col: 2 }]), { ...coreRenderOptions, target: drawBlocked });

        const fullLines = (drawFull.findOne("#board #gridlines-strokes") as { find: (sel: string) => { length: number } }).find("line").length;
        const blockedLines = (drawBlocked.findOne("#board #gridlines-strokes") as { find: (sel: string) => { length: number } }).find("line").length;
        expect(blockedLines).to.be.lessThan(fullLines);
    });
});