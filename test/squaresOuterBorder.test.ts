import { expect } from "chai";
import "mocha";
import { Element as SVGElement, SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { DefaultRenderer } from "../src/renderers/default";
import { IRendererOptionsIn } from "../src/renderers/_base";
import { APRenderRep } from "../src/schemas/schema";
import { createSVGWindow } from "svgdom";

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

const lineStrokeWidth = (line: SVGElement): number => {
    const w = line.attr("stroke-width");
    if (w !== undefined && w !== null && w !== "") {
        return parseFloat(w);
    }
    return parseFloat(line.attr("stroke-width") ?? "0");
};

const countLinesAtWidth = (strokes: SVGElement, width: number): number =>
    strokes.find("line").filter((el) => lineStrokeWidth(el as SVGElement) === width).length;

const squaresFixture = (overrides?: Partial<APRenderRep>): APRenderRep => ({
    board: { style: "squares", width: 3, height: 3, strokeWeight: 2 },
    legend: { P: { name: "piece", colour: 1 } },
    pieces: "---\n---\n---",
    ...overrides,
});

const diamondsFixture = (sdStart: "S" | "D"): APRenderRep => ({
    board: { style: "squares-diamonds", width: 3, height: 3, strokeWeight: 2, sdStart },
    legend: { P: { name: "piece", colour: 1 } },
    pieces: "---\n---\n---",
});

describe("squares outer border emphasis", () => {
    it("should draw four 2× stroke lines around a plain squares board", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(squaresFixture(), draw, baseOptions);

        const strokes = draw.findOne("#gridlines-strokes") as SVGElement;
        expect(strokes).to.not.equal(null);
        expect(countLinesAtWidth(strokes, 4)).to.equal(4);
    });

    it("should omit 2× outer lines when no-border is set", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(squaresFixture({ options: ["no-border"] }), draw, baseOptions);

        const strokes = draw.findOne("#gridlines-strokes") as SVGElement;
        expect(countLinesAtWidth(strokes, 4)).to.equal(0);
        expect(strokes.find("line").length).to.be.greaterThan(0);
    });

    it("should not emphasize outer border when cells are blocked", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(
            squaresFixture({
                board: {
                    style: "squares",
                    width: 3,
                    height: 3,
                    strokeWeight: 2,
                    blocked: [{ row: 0, col: 0 }],
                },
            }),
            draw,
            baseOptions,
        );

        const strokes = draw.findOne("#gridlines-strokes") as SVGElement;
        expect(countLinesAtWidth(strokes, 4)).to.equal(0);
    });

    it("should emphasize scalloped outer edges on squares-diamonds for both sdStart modes", () => {
        const drawS = makeDraw();
        const drawD = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(diamondsFixture("S"), drawS, baseOptions);
        renderer.render(diamondsFixture("D"), drawD, baseOptions);

        const strokesS = drawS.findOne("#gridlines-strokes") as SVGElement;
        const strokesD = drawD.findOne("#gridlines-strokes") as SVGElement;
        const thickS = countLinesAtWidth(strokesS, 4);
        const thickD = countLinesAtWidth(strokesD, 4);

        expect(thickS).to.be.greaterThan(0);
        expect(thickD).to.be.greaterThan(0);
        expect(thickS).to.not.equal(thickD);
    });

    it("should draw 2× outer frame on contiguous tiled boards (Azacru-style)", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(
            squaresFixture({
                board: {
                    style: "squares-checkered",
                    width: 9,
                    height: 9,
                    strokeWeight: 1,
                    tileWidth: 3,
                    tileHeight: 3,
                    tileLineMult: 5,
                },
                pieces: Array(9).fill("-,-,-,-,-,-,-,-,-").join("\n"),
            }),
            draw,
            baseOptions,
        );

        const strokes = draw.findOne("#gridlines-strokes") as SVGElement;
        expect(countLinesAtWidth(strokes, 2)).to.equal(4);
        expect(strokes.find("line").length).to.be.greaterThan(0);
    });

    it("should omit 2× outer frame but keep cell outlines when tileSpacing is set (Garden-style)", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(
            squaresFixture({
                options: ["hide-labels"],
                board: {
                    style: "squares",
                    width: 8,
                    height: 8,
                    strokeWeight: 1,
                    tileWidth: 4,
                    tileHeight: 4,
                    tileSpacing: 1.25,
                },
                pieces: Array(8).fill("-,-,-,-,-,-,-,-").join("\n"),
            }),
            draw,
            baseOptions,
        );

        const strokes = draw.findOne("#gridlines-strokes") as SVGElement;
        expect(countLinesAtWidth(strokes, 2)).to.equal(0);
        expect(strokes.find("line").length).to.be.greaterThan(0);
    });
});
