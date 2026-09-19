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

const cannonFixture: APRenderRep = {
    board: { style: "squares-checkered", width: 10, height: 10 },
    legend: {
        A: [{ name: "piece", colour: 1 }],
        B: [{ name: "piece-square", colour: 1 }],
    },
    pieces: "----------\n".repeat(10).trimEnd(),
};

function labelFontSizesFromSvg(svg: string): number[] {
    const sizes: number[] = [];
    const attrRe = /font-size="([0-9.]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = attrRe.exec(svg)) !== null) {
        sizes.push(Number.parseFloat(m[1]!));
    }
    return sizes;
}

describe("board.labelScale", () => {
    it("defaults coordinate labels to 16px on squares", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        renderer.render(base, draw, coreRenderOptions);
        const sizes = labelFontSizesFromSvg(draw.svg());
        expect(sizes.length).to.be.greaterThan(0);
        expect(sizes[0]).to.equal(16);
        expect(renderer.boardLabelFontSize()).to.equal(16);
    });

    it("defaults coordinate labels to 16px on squares-checkered (cannon-style)", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        renderer.render(cannonFixture, draw, coreRenderOptions);
        const sizes = labelFontSizesFromSvg(draw.svg());
        expect(sizes[0]).to.equal(16);
    });

    it("labelScale 2 yields 32px on squares", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        renderer.render(
            { ...base, board: { ...base.board!, labelScale: 2 } },
            draw,
            coreRenderOptions,
        );
        const sizes = labelFontSizesFromSvg(draw.svg());
        expect(sizes[0]).to.equal(32);
        expect(renderer.boardLabelFontSize()).to.equal(32);
    });

    it("rect-of-hex defaults to cellsize/5 and labelScale doubles it", () => {
        const renderer = new DefaultRenderer();
        const rep: APRenderRep = {
            board: { style: "hex-odd-p", width: 2, height: 2 },
            legend: { P: { name: "piece", colour: 1 } },
            pieces: "--\n--",
        };
        const drawDefault = makeDraw();
        renderer.render(rep, drawDefault, coreRenderOptions);
        const base = renderer.cellsize / 5;
        expect(renderer.coordinateLabelBaseFontSize()).to.equal(base);
        expect(labelFontSizesFromSvg(drawDefault.svg())[0]).to.equal(base);

        const drawScaled = makeDraw();
        renderer.render(
            { ...rep, board: { ...rep.board!, labelScale: 2 } },
            drawScaled,
            coreRenderOptions,
        );
        expect(labelFontSizesFromSvg(drawScaled.svg())[0]).to.equal(base * 2);
    });

    it("scales coordinate label font size on vertex when labelScale is set", () => {
        const renderer = new DefaultRenderer();
        const vertexBase: APRenderRep = {
            ...base,
            board: { style: "vertex", width: 2, height: 2 },
        };
        const drawDefault = makeDraw();
        renderer.render(vertexBase, drawDefault, coreRenderOptions);
        const baseSize = labelFontSizesFromSvg(drawDefault.svg())[0]!;

        const drawScaled = makeDraw();
        renderer.render(
            {
                ...base,
                board: { style: "vertex", width: 2, height: 2, labelScale: 1.5 },
            },
            drawScaled,
            coreRenderOptions,
        );
        const scaledSize = labelFontSizesFromSvg(drawScaled.svg())[0]!;
        expect(scaledSize).to.be.closeTo(baseSize * 1.5, 0.01);
        expect(scaledSize).to.equal(24);
    });
});
