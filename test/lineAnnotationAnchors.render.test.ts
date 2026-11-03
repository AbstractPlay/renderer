import { expect } from "chai";
import "mocha";
import type { Element } from "@svgdotjs/svg.js";
import { render } from "../src/index.js";
import type { APRenderRep } from "../src/schemas/schema.js";
import { coreRenderOptions, makeDraw } from "./helpers/renderTestDraw.js";

const annotationPolyline = (draw: ReturnType<typeof makeDraw>): Element => {
    const board = draw.findOne("#board");
    expect(board).to.not.equal(null);
    const annotations = board!.findOne("#annotations");
    expect(annotations).to.not.equal(null);
    const lines = annotations!.find("polyline").toArray() as Element[];
    expect(lines.length).to.equal(1);
    return lines[0]!;
};

const baseBoard: APRenderRep = {
    board: { style: "squares", width: 4, height: 4 },
    legend: { A: { name: "piece", paint: { fill: 1 } } },
    pieces: "----\n----\n----\n----",
};

const lineAnnotation = {
    type: "line" as const,
    targets: [{ row: 2, col: 1 }, { row: 1, col: 1 }],
};

describe("line annotation anchors (render)", () => {
    it("adds circular endpoint markers by default", () => {
        const draw = makeDraw();
        render({ ...baseBoard, annotations: [lineAnnotation] }, {
            ...coreRenderOptions,
            target: draw,
            showAnnotations: true,
        });
        const poly = annotationPolyline(draw);
        expect(poly.attr("marker-start")).to.not.equal(undefined);
        expect(poly.attr("marker-end")).to.not.equal(undefined);
    });

    it("omits endpoint markers when anchors is false", () => {
        const draw = makeDraw();
        render({
            ...baseBoard,
            annotations: [{ ...lineAnnotation, anchors: false }],
        }, {
            ...coreRenderOptions,
            target: draw,
            showAnnotations: true,
        });
        const poly = annotationPolyline(draw);
        expect(poly.attr("marker-start")).to.equal(undefined);
        expect(poly.attr("marker-end")).to.equal(undefined);
    });
});
