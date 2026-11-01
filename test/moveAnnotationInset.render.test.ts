import { expect } from "chai";
import "mocha";
import type { Element } from "@svgdotjs/svg.js";
import { render } from "../src/index.js";
import type { APRenderRep } from "../src/schemas/schema.js";
import { coreRenderOptions, makeDraw } from "./helpers/renderTestDraw.js";

const annotationPolylines = (draw: ReturnType<typeof makeDraw>): Element[] => {
    const board = draw.findOne("#board");
    expect(board).to.not.equal(null);
    const annotations = board!.findOne("#annotations");
    expect(annotations).to.not.equal(null);
    return annotations!.find("polyline").toArray() as Element[];
};

const verticalSpan = (raw: string): number => {
    const pairs = raw.trim().split(/\s+/);
    expect(pairs.length).to.be.at.least(2);
    const [x1, y1] = pairs[0]!.split(",").map(Number);
    const [x2, y2] = pairs[pairs.length - 1]!.split(",").map(Number);
    expect(x1).to.be.closeTo(x2, 0.01);
    return Math.abs(y2 - y1);
};

const baseBoard: APRenderRep = {
    board: { style: "squares", width: 4, height: 4 },
    legend: { A: { name: "piece", paint: { fill: 1 } } },
    pieces: "----\n----\n----\n----",
};

describe("move annotation cell inset (render)", () => {
    it("shortens default move arrow span by 0.1 cellsize at each end", () => {
        const draw = makeDraw();
        render({
            ...baseBoard,
            annotations: [{ type: "move", targets: [{ row: 2, col: 1 }, { row: 1, col: 1 }] }],
        }, {
            ...coreRenderOptions,
            target: draw,
            showAnnotations: true,
        });
        const lines = annotationPolylines(draw);
        expect(lines.length).to.equal(1);
        const span = verticalSpan(lines[0]!.attr("points") as string);
        expect(span).to.be.closeTo(40, 0.5);
    });

    it("line annotations stay centre-to-centre", () => {
        const draw = makeDraw();
        render({
            ...baseBoard,
            annotations: [{ type: "line", targets: [{ row: 2, col: 1 }, { row: 1, col: 1 }] }],
        }, {
            ...coreRenderOptions,
            target: draw,
            showAnnotations: true,
        });
        const lines = annotationPolylines(draw);
        expect(lines.length).to.equal(1);
        const span = verticalSpan(lines[0]!.attr("points") as string);
        expect(span).to.be.closeTo(50, 0.5);
    });

    it("moveAnnotationCellInset false restores centre-to-centre move span", () => {
        const draw = makeDraw();
        render({
            ...baseBoard,
            annotations: [{ type: "move", targets: [{ row: 2, col: 1 }, { row: 1, col: 1 }] }],
        }, {
            ...coreRenderOptions,
            target: draw,
            showAnnotations: true,
            moveAnnotationCellInset: false,
        });
        const lines = annotationPolylines(draw);
        expect(lines.length).to.equal(1);
        const span = verticalSpan(lines[0]!.attr("points") as string);
        expect(span).to.be.closeTo(50, 0.5);
    });
});
