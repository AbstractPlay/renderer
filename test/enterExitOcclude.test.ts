import { expect } from "chai";
import "mocha";
import { Element as SVGElement } from "@svgdotjs/svg.js";
import { StackingOffsetRenderer } from "../src/renderers/stackingOffset.js";
import type { APRenderRep } from "../src/schemas/schema.js";
import { coreRenderOptions, makeDraw } from "./helpers/renderTestDraw.js";

const backFillHex = "#cfc39e";

const enterExitBackFillFixture: APRenderRep = {
    renderer: "stacking-offset",
    board: {
        style: "snubsquare",
        snubStart: "T",
        width: 8,
        height: 8,
        blocked: [{ row: 0, col: 0 }, { row: 7, col: 7 }],
        backFill: {
            type: "board",
            colour: {
                func: "custom",
                default: backFillHex,
                palette: "_context_board",
            },
        },
    },
    legend: {
        A: { name: "piece", colour: { func: "custom", default: "#007f00", palette: 1 }, scale: 0.85 },
    },
    pieces: "-,-,-,-,-,-,-,-\n-,A,-,-,-,-,-,-\n-,-,-,-,-,-,-,-\n-,-,-,-,-,-,-,-\n-,-,-,-,-,-,-,-\n-,-,-,-,-,-,-,-\n-,-,-,-,-,-,-,-\n-,-,-,-,-,-,-,-",
    annotations: [
        { type: "enter", shape: "circle", targets: [{ row: 3, col: 1 }] },
        { type: "exit", shape: "circle", opacity: 0.5, targets: [{ row: 4, col: 2 }] },
    ],
};

const occludeStrokes = (drawRoot: SVGElement): SVGElement[] => {
    const ann = drawRoot.find('[class*="aprender-annotation"]') as unknown as SVGElement[];
    return ann.filter((el) => {
        const dash = el.attr("stroke-dasharray");
        return dash === undefined || dash === null || dash === "";
    });
};

describe("enter/exit annotation occlude stroke", () => {
    it("uses resolved board backFill colour for dashed gap under-strokes", () => {
        const draw = makeDraw();
        const renderer = new StackingOffsetRenderer();
        renderer.render(enterExitBackFillFixture, draw, {
            ...coreRenderOptions,
            showAnnotations: true,
        });

        const underStrokes = occludeStrokes(draw);
        expect(underStrokes.length).to.be.greaterThan(0);
        for (const el of underStrokes) {
            expect(el.attr("stroke")?.toLowerCase()).to.equal(backFillHex);
        }
    });
});