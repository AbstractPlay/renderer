import { expect } from "chai";
import "mocha";
import { Element as SVGElement, SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { DefaultRenderer } from "../src/renderers/default";
import { SowingNumeralsRenderer } from "../src/renderers/sowingNumerals";
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

const layerChildIds = (gridlines: SVGElement): string[] =>
    gridlines.children().map((child) => child.id());

const diffusionSowingFixture = (): APRenderRep => ({
    renderer: "sowing-numerals",
    board: {
        style: "sowing",
        width: 6,
        height: 2,
        showEndPits: false,
        markers: [
            {
                type: "shading",
                colour: 1,
                opacity: 0.5,
                belowGrid: true,
                points: [{ row: 0, col: 0 }, { row: 0, col: 2 }, { row: 2, col: 2 }, { row: 2, col: 0 }],
            },
            {
                type: "shading",
                colour: 2,
                opacity: 0.5,
                belowGrid: true,
                points: [{ row: 0, col: 3 }, { row: 0, col: 5 }, { row: 2, col: 5 }, { row: 2, col: 3 }],
            },
        ],
    },
    legend: { P: { name: "piece", colour: 1 } },
    pieces: "3,3,3,3,3,3\n3,3,3,3,3,3",
});

const squaresFloodFixture = (): APRenderRep => ({
    board: {
        style: "squares-checkered",
        width: 4,
        height: 4,
        markers: [
            { type: "flood", colour: 1, belowGrid: true, points: [{ row: 1, col: 1 }] },
        ],
    },
    legend: { P: { name: "piece", colour: 1 } },
    pieces: "----\n----\n----\n----",
});

describe("belowGrid markers above board fill", () => {
    it("should layer sowing board fill below belowGrid shading and above grid strokes", () => {
        const draw = makeDraw();
        const renderer = new SowingNumeralsRenderer();
        renderer.render(diffusionSowingFixture(), draw, {
            ...baseOptions,
            colourContext: { ...baseOptions.colourContext, board: "#ffffff" },
        });

        const gridlines = draw.findOne("#gridlines") as SVGElement;
        expect(gridlines).to.not.equal(null);

        const ids = layerChildIds(gridlines);
        expect(ids.indexOf("gridlines-fill")).to.be.lessThan(ids.indexOf("gridlines-below"));
        expect(ids.indexOf("gridlines-below")).to.be.lessThan(ids.indexOf("gridlines-strokes"));

        const fillLayer = draw.findOne("#gridlines-fill") as SVGElement;
        const belowLayer = draw.findOne("#gridlines-below") as SVGElement;
        const strokesLayer = draw.findOne("#gridlines-strokes") as SVGElement;

        expect(fillLayer.children().length).to.be.greaterThan(0);
        expect(belowLayer.find("polygon").length).to.equal(2);
        expect(strokesLayer.children().length).to.be.greaterThan(0);

        const shading = belowLayer.find("polygon")[0] as SVGElement;
        const fillOpacity = parseFloat(shading.attr("fill-opacity") ?? shading.attr("opacity") ?? "1");
        expect(fillOpacity).to.be.greaterThan(0);
    });

    it("should draw belowGrid flood above gridlines fill layer on squares boards", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(squaresFloodFixture(), draw, {
            ...baseOptions,
            colourContext: { ...baseOptions.colourContext, board: "#ffffff" },
        });

        const gridlines = draw.findOne("#gridlines") as SVGElement;
        const ids = layerChildIds(gridlines);
        expect(ids.indexOf("gridlines-fill")).to.be.lessThan(ids.indexOf("gridlines-below"));

        const belowLayer = draw.findOne("#gridlines-below") as SVGElement;
        const floods = belowLayer.find("polygon").filter((el) => el.attr("fill") !== "none");
        expect(floods.length).to.be.greaterThan(0);
    });

    it("should preserve checkered tile pattern when board fill is set", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(squaresFloodFixture(), draw, {
            ...baseOptions,
            colourContext: { ...baseOptions.colourContext, board: "#ffffff" },
        });

        const tiles = draw.findOne("#tiles") as SVGElement;
        const uses = tiles.find("use");
        const hrefs = uses.map((u) => u.attr("href") ?? u.attr("xlink:href") ?? "");
        const checkeredHrefs = hrefs.filter((h) => h.includes("tile-light") || h.includes("tile-dark"));
        expect(checkeredHrefs.length).to.equal(16);

        const lightCount = checkeredHrefs.filter((h) => h.includes("tile-light")).length;
        const darkCount = checkeredHrefs.filter((h) => h.includes("tile-dark")).length;
        expect(lightCount).to.be.greaterThan(0);
        expect(darkCount).to.be.greaterThan(0);
    });

    it("should cover the bent-tri playfield with board fill", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(
            {
                board: { style: "bent-tri", width: 9 },
                legend: { A: { name: "piece", colour: 1 } },
                pieces: "",
            },
            draw,
            { ...baseOptions, colourContext: { ...baseOptions.colourContext, board: "#cccccc" } },
        );

        const backfill = draw.findOne("#aprender-backfill") as SVGElement;
        const strokes = draw.findOne("#gridlines-strokes") as SVGElement;
        expect(backfill).to.not.equal(null);

        const fillBox = backfill.bbox();
        const strokeBox = strokes.bbox();
        expect(fillBox.width).to.be.greaterThan(strokeBox.width * 0.5);
        expect(fillBox.height).to.be.greaterThan(strokeBox.height * 0.5);
    });
});
