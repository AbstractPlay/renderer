import { expect } from "chai";
import "mocha";
import { DefaultRenderer } from "../../src/renderers/default";
import type { APRenderRep } from "../../src/schemas/schema";
import { makeDraw, coreRenderOptions } from "../helpers/renderTestDraw";

const base: APRenderRep = {
    board: { style: "squares", width: 2, height: 2 },
    legend: { P: { name: "piece", colour: 1 } },
    pieces: "--\n--",
};

function labelFontSizesFromSvg(draw: ReturnType<typeof makeDraw>): number[] {
    const svg = draw.svg();
    const sizes: number[] = [];
    const attrRe = /font-size="([0-9.]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = attrRe.exec(svg)) !== null) {
        sizes.push(Number.parseFloat(m[1]!));
    }
    expect(sizes.length, "expected label font-size in SVG").to.be.greaterThan(0);
    return sizes;
}

describe("board.labelScale", () => {
    it("scales coordinate label font size on squares", () => {
        const renderer = new DefaultRenderer();
        const drawDefault = makeDraw();
        renderer.render(base, drawDefault, coreRenderOptions);
        const baseSize = labelFontSizesFromSvg(drawDefault)[0]!;

        const drawScaled = makeDraw();
        renderer.render(
            { ...base, board: { ...base.board!, labelScale: 2 } },
            drawScaled,
            coreRenderOptions,
        );
        const scaledSize = labelFontSizesFromSvg(drawScaled)[0]!;
        expect(scaledSize).to.be.closeTo(baseSize * 2, 0.01);
    });

    it("scales coordinate label font size on vertex", () => {
        const renderer = new DefaultRenderer();
        const vertexBase: APRenderRep = {
            ...base,
            board: { style: "vertex", width: 2, height: 2 },
        };
        const drawDefault = makeDraw();
        renderer.render(vertexBase, drawDefault, coreRenderOptions);
        const baseSize = labelFontSizesFromSvg(drawDefault)[0]!;

        const drawScaled = makeDraw();
        renderer.render(
            {
                ...base,
                board: { style: "vertex", width: 2, height: 2, labelScale: 1.5 },
            },
            drawScaled,
            coreRenderOptions,
        );
        const scaledSize = labelFontSizesFromSvg(drawScaled)[0]!;
        expect(scaledSize).to.be.closeTo(baseSize * 1.5, 0.01);
    });
});
