import { expect } from "chai";
import "mocha";
import { render, type APRenderRep } from "../src/index.js";
import { coreRenderOptions, makeDraw } from "./helpers/renderTestDraw.js";

/** Smallest `y` among coordinate labels (north row). */
function northLabelY(svg: string): number | undefined {
    const labels = svg.match(/<g id="labels"[^>]*>[\s\S]*?<\/g>/)?.[0];
    if (!labels) {
        return undefined;
    }
    const ys = [...labels.matchAll(/<text[^>]*y="([^"]+)"/g)].map((m) => parseFloat(m[1]!));
    if (ys.length === 0) {
        return undefined;
    }
    return Math.min(...ys);
}

describe("board.labelOutset", () => {
    it("scales square board north label gap", () => {
        const base: APRenderRep = {
            board: { style: "squares", width: 3, height: 3 },
            legend: { A: { name: "piece", paint: { fill: 1 } } },
            pieces: "---\n---\n---",
        };
        const drawDefault = makeDraw();
        render(base, { ...coreRenderOptions, target: drawDefault });
        const yDefault = northLabelY(drawDefault.svg());

        const drawWide = makeDraw();
        render(
            { ...base, board: { ...base.board!, labelOutset: 2 } },
            { ...coreRenderOptions, target: drawWide },
        );
        const yWide = northLabelY(drawWide.svg());

        expect(yDefault).to.be.a("number");
        expect(yWide).to.be.a("number");
        expect(yWide!).to.be.lessThan(yDefault!);
    });

    it("labelOutset 0 keeps north labels outside the playfield on squares-checkered", () => {
        const rep: APRenderRep = {
            board: { style: "squares-checkered", width: 4, height: 4, labelOutset: 0 },
            legend: { A: { name: "piece", paint: { fill: 1 } } },
            pieces: "----\n----\n----\n----",
        };
        const draw = makeDraw();
        render(rep, { ...coreRenderOptions, target: draw });
        const yNorth = northLabelY(draw.svg());
        expect(yNorth).to.be.a("number");
        expect(yNorth!).to.be.lessThan(-25);
    });

    it("labelOutset 0.5 sits between flush and default on squares-checkered", () => {
        const base: APRenderRep = {
            board: { style: "squares-checkered", width: 4, height: 4 },
            legend: { A: { name: "piece", paint: { fill: 1 } } },
            pieces: "----\n----\n----\n----",
        };
        const drawDefault = makeDraw();
        render(base, { ...coreRenderOptions, target: drawDefault });
        const yDefault = northLabelY(drawDefault.svg());

        const drawHalf = makeDraw();
        render(
            { ...base, board: { ...base.board!, labelOutset: 0.5 } },
            { ...coreRenderOptions, target: drawHalf },
        );
        const yHalf = northLabelY(drawHalf.svg());

        const drawFlush = makeDraw();
        render(
            { ...base, board: { ...base.board!, labelOutset: 0 } },
            { ...coreRenderOptions, target: drawFlush },
        );
        const yFlush = northLabelY(drawFlush.svg());

        expect(yHalf!).to.be.lessThan(yFlush!);
        expect(yHalf!).to.be.greaterThan(yDefault!);
    });
});
