import { expect } from "chai";
import "mocha";
import { Element as SVGElement, SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { EntropyRenderer } from "../src/renderers/entropy";
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

const entropyFixture = (): APRenderRep => ({
    renderer: "entropy",
    board: { style: "entropy", orientation: "vertical" },
    legend: {
        RD: { name: "piece", colour: 1 },
        BU: { name: "piece", colour: 2 },
    },
    pieces: ",,,,,,,,,,,,,\n,,,,,,,,,,,,,",
});

describe("Entropy renderer", () => {
    it("should fill both boards from colourContext.board", () => {
        const draw = makeDraw();
        const renderer = new EntropyRenderer();
        renderer.render(entropyFixture(), draw, {
            ...baseOptions,
            colourContext: { ...baseOptions.colourContext, board: "#cccccc" },
        });

        for (const boardId of ["boardOne", "boardTwo"]) {
            const fillLayer = draw.findOne(`#${boardId} #gridlines-fill`) as SVGElement;
            expect(fillLayer, boardId).to.not.equal(null);
            const fills = fillLayer.find("rect");
            expect(fills.length, boardId).to.be.greaterThan(0);
            expect(fills[0]!.attr("fill")).to.equal("#cccccc");
            const opacity = parseFloat(fills[0]!.attr("fill-opacity") ?? fills[0]!.attr("opacity") ?? "1");
            expect(opacity, boardId).to.be.greaterThan(0);
        }
    });

    it("should resolve strokeColour through the colour context", () => {
        const draw = makeDraw();
        const renderer = new EntropyRenderer();
        renderer.render(
            {
                ...entropyFixture(),
                board: { style: "entropy", orientation: "vertical", strokeColour: "_context_strokes" },
            },
            draw,
            baseOptions,
        );

        const line = draw.findOne("#boardOne #gridlines-strokes line") as SVGElement;
        expect(line).to.not.equal(null);
        expect(line.attr("stroke")).to.equal("#000000");
    });

    it("should use colourContext.labels for axis labels", () => {
        const draw = makeDraw();
        const renderer = new EntropyRenderer();
        renderer.render(entropyFixture(), draw, {
            ...baseOptions,
            colourContext: { ...baseOptions.colourContext, labels: "#336699" },
        });

        const label = draw.findOne("#boardOne #labels text") as SVGElement;
        expect(label).to.not.equal(null);
        expect(label.attr("fill")).to.equal("#336699");
    });

    it("should draw occlusion above board fill and pieces on the occluded board only", () => {
        const draw = makeDraw();
        const renderer = new EntropyRenderer();
        renderer.render(
            {
                renderer: "entropy",
                board: {
                    style: "entropy",
                    orientation: "horizontal",
                    boardOne: { occluded: true },
                    boardTwo: {},
                },
                legend: {
                    RD: { name: "piece", colour: 1 },
                    BU: { name: "piece", colour: 2 },
                },
                pieces: "RD,-,-,-,-,-,-,-,-,-,-,-,-,-\n".repeat(7),
            },
            draw,
            {
                ...baseOptions,
                colourContext: { ...baseOptions.colourContext, board: "#cccccc" },
            },
        );

        expect(draw.findOne("#boardOne #gridlines-fill rect")).to.not.equal(null);
        expect(draw.findOne("#boardTwo #gridlines-fill rect")).to.not.equal(null);
        expect(draw.findOne("#pieces use")).to.not.equal(null);

        const overlays = draw.find(".aprender-occlusion");
        expect(overlays.length).to.equal(1);

        const piecesIndex = draw.children().findIndex((child) => child.id() === "pieces");
        const overlayIndex = draw.children().findIndex((child) => child.hasClass("aprender-occlusion"));
        expect(piecesIndex).to.be.greaterThan(-1);
        expect(overlayIndex).to.be.greaterThan(piecesIndex);
    });

    it("should allow both boards to be occluded independently", () => {
        const draw = makeDraw();
        const renderer = new EntropyRenderer();
        renderer.render(
            {
                renderer: "entropy",
                board: {
                    style: "entropy",
                    orientation: "horizontal",
                    boardOne: { occluded: true },
                    boardTwo: { occluded: true },
                },
                legend: { RD: { name: "piece", colour: 1 } },
                pieces: ",,,,,,,,,,,,,\n".repeat(7),
            },
            draw,
            baseOptions,
        );

        const overlays = draw.find(".aprender-occlusion");
        expect(overlays.length).to.equal(2);
    });
});
