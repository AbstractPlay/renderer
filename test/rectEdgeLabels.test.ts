import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { DefaultRenderer } from "../src/renderers/default.js";
import type { APRenderRep } from "../src/schemas/schema.js";

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    registerWindow(window, window.document);
    return SVG(window.document.documentElement) as Svg;
};

const labelTexts = (draw: Svg): string[] => {
    const group = draw.findOne("#labels");
    if (group === null) {
        return [];
    }
    return group.find("text").map((t) => t.node.textContent ?? "");
};

const squaresLabelRep = (options?: APRenderRep["options"], board?: APRenderRep["board"]): APRenderRep => ({
    board: {
        style: "squares",
        width: 2,
        height: 2,
        ...board,
    },
    legend: { X: "piece" },
    pieces: "X-\n-X",
    options,
});

const vertexLabelRep = (options?: APRenderRep["options"], board?: APRenderRep["board"]): APRenderRep => ({
    board: {
        style: "vertex",
        width: 2,
        height: 2,
        ...board,
    },
    legend: { X: "piece" },
    pieces: "X-\n-X",
    options,
});

describe("rect edge labels (squares and vertex)", () => {
    const renderer = new DefaultRenderer();

    describe("squares", () => {
        it("should honour hide-labels-half", () => {
            const draw = makeDraw();
            renderer.render(squaresLabelRep(["hide-labels-half"]), draw, {});
            const texts = labelTexts(draw);
            expect(texts.filter((t) => t === "a").length).to.equal(1);
            expect(texts.filter((t) => t === "b").length).to.equal(1);
            expect(texts.filter((t) => t === "2").length).to.equal(1);
            expect(texts.filter((t) => t === "1").length).to.equal(1);
        });

        it("should treat hide-labels-north and hide-labels-east like hide-labels-half", () => {
            const drawHalf = makeDraw();
            const drawParts = makeDraw();
            renderer.render(squaresLabelRep(["hide-labels-half"]), drawHalf, {});
            renderer.render(squaresLabelRep(["hide-labels-north", "hide-labels-east"]), drawParts, {});
            expect(labelTexts(drawHalf).sort().join(",")).to.equal(labelTexts(drawParts).sort().join(","));
        });

        it("should honour hide-labels-south only", () => {
            const draw = makeDraw();
            renderer.render(squaresLabelRep(["hide-labels-south"]), draw, {});
            const texts = labelTexts(draw);
            expect(texts.filter((t) => t === "a").length).to.equal(1);
            expect(texts.filter((t) => t === "b").length).to.equal(1);
            expect(texts.filter((t) => t === "2").length).to.equal(2);
            expect(texts.filter((t) => t === "1").length).to.equal(2);
        });

        it("should not require columnLabels length to match width when edgeLabels is omitted", () => {
            const draw = makeDraw();
            renderer.render(
                squaresLabelRep(undefined, {
                    style: "squares",
                    width: 5,
                    height: 3,
                    columnLabels: ["", "", "", ""],
                    rowLabels: ["", "", ""],
                }),
                draw,
                {},
            );
            expect(draw.findOne("#labels")).to.not.equal(null);
        });

        it("should apply edgeLabels overrides literally on one side", () => {
            const draw = makeDraw();
            renderer.render(
                squaresLabelRep(undefined, {
                    style: "squares",
                    width: 2,
                    height: 2,
                    edgeLabels: { south: ["α", "β"] },
                }),
                draw,
                {},
            );
            const texts = labelTexts(draw);
            expect(texts).to.include("α");
            expect(texts).to.include("β");
            expect(texts.filter((t) => t === "a").length).to.equal(1);
        });
    });

    describe("vertex", () => {
        it("should honour hide-labels-west", () => {
            const draw = makeDraw();
            renderer.render(vertexLabelRep(["hide-labels-west"]), draw, {});
            const texts = labelTexts(draw);
            expect(texts.filter((t) => t === "2").length).to.equal(1);
            expect(texts.filter((t) => t === "1").length).to.equal(1);
            expect(texts.filter((t) => t === "a").length).to.equal(2);
        });
    });
});
