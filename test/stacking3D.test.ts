/* eslint-disable @typescript-eslint/no-require-imports */
import { expect } from "chai";
import "mocha";
import { Element as SVGElement, SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { Stacking3DRenderer } from "../src/renderers/stacking3D";
import { IRendererOptionsIn } from "../src/renderers/_base";
import { APRenderRep } from "../src/schemas/schema";

const { createSVGWindow } = require("svgdom");

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    const document = window.document;
    registerWindow(window, document);
    return SVG(document.documentElement) as Svg;
};

const baseOptions: IRendererOptionsIn = {
    contextGlobal: true,
    coloursGlobal: false,
    showAnnotations: false,
    sheets: ["core"],
};

const stacking3DFixture = (): APRenderRep => ({
    renderer: "stacking-3D",
    board: { style: "squares", width: 5, height: 5 },
    legend: {},
    pieces: [[[]], [[]], [[]], [[]], [[]]],
});

const polygonArea = (pointsAttr: string): number => {
    const pairs = pointsAttr.trim().split(/\s+/).map((p) => p.split(",").map(Number) as [number, number]);
    let area = 0;
    for (let i = 0; i < pairs.length; i++) {
        const [x1, y1] = pairs[i]!;
        const [x2, y2] = pairs[(i + 1) % pairs.length]!;
        area += x1 * y2 - x2 * y1;
    }
    return Math.abs(area) / 2;
};

describe("Stacking-3D renderer", () => {
    it("should fill the board from colourContext.board as a perspective polygon", () => {
        const draw = makeDraw();
        const renderer = new Stacking3DRenderer();
        renderer.render(stacking3DFixture(), draw, {
            ...baseOptions,
            colourContext: { ...baseOptions.colourContext, board: "#cccccc" },
        });

        const fillLayer = draw.findOne("#board #gridlines-fill") as SVGElement;
        expect(fillLayer).to.not.equal(null);

        const fillPoly = fillLayer.findOne("polygon") as SVGElement;
        expect(fillPoly).to.not.equal(null);
        expect(fillPoly.attr("fill")).to.equal("#cccccc");
        const opacity = parseFloat(fillPoly.attr("fill-opacity") ?? fillPoly.attr("opacity") ?? "1");
        expect(opacity).to.be.greaterThan(0);

        const points = fillPoly.attr("points") ?? "";
        const corners = points.trim().split(/\s+/);
        expect(corners.length).to.equal(4);
        expect(polygonArea(points)).to.be.greaterThan(0);

        const strokes = draw.findOne("#board #gridlines-strokes") as SVGElement;
        expect(strokes).to.not.equal(null);
        expect(strokes.find("line").length).to.be.greaterThan(0);
    });

    it("should paint board fill below grid strokes", () => {
        const draw = makeDraw();
        const renderer = new Stacking3DRenderer();
        renderer.render(stacking3DFixture(), draw, {
            ...baseOptions,
            colourContext: { ...baseOptions.colourContext, board: "#cccccc" },
        });

        const gridlines = draw.findOne("#board #gridlines") as SVGElement;
        const children = gridlines.children();
        const fillIdx = children.findIndex((c) => c.id() === "gridlines-fill");
        const strokesIdx = children.findIndex((c) => c.id() === "gridlines-strokes");
        expect(fillIdx).to.be.greaterThan(-1);
        expect(strokesIdx).to.be.greaterThan(-1);
        expect(fillIdx).to.be.lessThan(strokesIdx);
    });
});
