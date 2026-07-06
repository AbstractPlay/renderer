/* eslint-disable @typescript-eslint/no-require-imports */
import { expect } from "chai";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { icehousePyramidDims, resolvePyramidDims, ICEHOUSE_LARGE_BASE, ICEHOUSE_LARGE_SIDE_HEIGHT, DEFAULT_PYRAMID_SIDE_HEIGHT } from "../src/renderers/isometric/pyramidDims";
import { generatePyramids } from "../src/renderers/isometric/pyramids";
import { ISO_PROJECTION_PRESETS } from "../src/renderers/isometric/projection";
import { isoShadeFace } from "../src/renderers/isometric/shading";
import { isoSymbolPlacement } from "../src/renderers/isometric/symbolPlacement";
import { generateCubes } from "../src/renderers/isometric/cubes";

const { createSVGWindow } = require("svgdom");

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    const document = window.document;
    registerWindow(window, document);
    return SVG(document.documentElement) as Svg;
};

describe("Icehouse pyramid dimensions", () => {
    it("should use physical Icehouse proportions for the large size preset", () => {
        const large = icehousePyramidDims("large");
        expect(large.baseSize).to.equal(ICEHOUSE_LARGE_BASE);
        expect(large.sideHeight).to.equal(ICEHOUSE_LARGE_SIDE_HEIGHT);
    });

    it("should scale medium and small relative to large using Icehouse ratios", () => {
        const medium = icehousePyramidDims("medium");
        const small = icehousePyramidDims("small");
        expect(medium.baseSize).to.be.closeTo(ICEHOUSE_LARGE_BASE * (25 / 32), 1e-6);
        expect(medium.sideHeight).to.be.closeTo(ICEHOUSE_LARGE_BASE * 1.375, 1e-6);
        expect(small.baseSize).to.be.closeTo(ICEHOUSE_LARGE_BASE * (9 / 16), 1e-6);
        expect(small.sideHeight).to.equal(ICEHOUSE_LARGE_BASE);
    });

    it("should prefer size preset over height", () => {
        const dims = resolvePyramidDims({
            piece: "pyramid",
            colour: "#000",
            size: "small",
            height: 200,
        });
        expect(dims).to.deep.equal(icehousePyramidDims("small"));
    });

    it("should default to cell-filling dimensions when size and height are omitted", () => {
        const dims = resolvePyramidDims({ piece: "pyramid", colour: "#000" });
        expect(dims).to.deep.equal({
            baseSize: ICEHOUSE_LARGE_BASE,
            sideHeight: DEFAULT_PYRAMID_SIDE_HEIGHT,
        });
    });

    it("should use custom height with large base when only height is set", () => {
        const dims = resolvePyramidDims({ piece: "pyramid", colour: "#000", height: 120 });
        expect(dims.baseSize).to.equal(ICEHOUSE_LARGE_BASE);
        expect(dims.sideHeight).to.equal(120);
    });
});

describe("pyramid rendering", () => {
    it("should shade visible faces with projected light", () => {
        const draw = makeDraw();
        const base = "#2980b9";
        generatePyramids({
            rootSvg: draw,
            dims: [{ baseSize: 100, sideHeight: 100 }],
            stroke: { width: 1, color: "#000" },
            fill: { color: base },
            baseHex: base,
            projection: ISO_PROJECTION_PRESETS.iso,
            idSymbol: "testPyr",
        });
        const paths = draw.findOne("#testPyr")?.find("path") ?? [];
        expect(paths.length).to.equal(2);
        const fills = paths.map((p: { fill: () => string }) => p.fill().toLowerCase());
        expect(fills).to.include(isoShadeFace(base, "left").toLowerCase());
        expect(fills).to.include(isoShadeFace(base, "right").toLowerCase());
    });

    it("should anchor base contact at the projected base center", () => {
        const draw = makeDraw();
        generatePyramids({
            rootSvg: draw,
            dims: [{ baseSize: 100, sideHeight: 100 }],
            stroke: { width: 1, color: "#000" },
            fill: { color: "#f00" },
            projection: ISO_PROJECTION_PRESETS.iso,
            idSymbol: "testPyrAnchor",
        });
        const symbol = draw.findOne("#testPyrAnchor") as { attr: (n: string) => string };
        const dyBottom = parseFloat(symbol.attr("data-dy-bottom"));
        expect(dyBottom).to.be.at.least(0.4);
        expect(dyBottom).to.be.at.most(0.95);
    });

    it("should draw only the outer silhouette edges", () => {
        const draw = makeDraw();
        generatePyramids({
            rootSvg: draw,
            dims: [{ baseSize: 100, sideHeight: 100 }],
            stroke: { width: 1, color: "#000" },
            fill: { color: "#f00" },
            projection: ISO_PROJECTION_PRESETS.iso,
            idSymbol: "testPyrOutline",
        });
        const symbol = draw.findOne("#testPyrOutline") as Svg;
        expect(symbol.find("line").length).to.equal(4);
    });

    it("should scale Icehouse size presets to different display heights", () => {
        const draw = makeDraw();
        const cellsize = 100;
        const scale = 0.75;
        const dims = {
            large: icehousePyramidDims("large"),
            medium: icehousePyramidDims("medium"),
            small: icehousePyramidDims("small"),
        };
        for (const [id, dim] of Object.entries(dims)) {
            generatePyramids({
                rootSvg: draw,
                dims: [dim],
                stroke: { width: 1, color: "#000" },
                fill: { color: "#000" },
                projection: ISO_PROJECTION_PRESETS.iso,
                idSymbol: id,
            });
        }
        const largeH = isoSymbolPlacement(cellsize, 0, 0, draw.findOne("#large") as Svg, scale).newHeight;
        const mediumH = isoSymbolPlacement(cellsize, 0, 0, draw.findOne("#medium") as Svg, scale).newHeight;
        const smallH = isoSymbolPlacement(cellsize, 0, 0, draw.findOne("#small") as Svg, scale).newHeight;
        expect(largeH).to.be.greaterThan(mediumH);
        expect(mediumH).to.be.greaterThan(smallH);
    });

    it("should match default cube footprint at the same cell scale", () => {
        const draw = makeDraw();
        const cellsize = 100;
        const scale = 0.75;
        generatePyramids({
            rootSvg: draw,
            dims: [{ baseSize: ICEHOUSE_LARGE_BASE, sideHeight: DEFAULT_PYRAMID_SIDE_HEIGHT }],
            stroke: { width: 1, color: "#000" },
            fill: { color: "#000" },
            projection: ISO_PROJECTION_PRESETS.iso,
            idSymbol: "pyr",
        });
        generateCubes({
            rootSvg: draw,
            heights: [100],
            stroke: { width: 1, color: "#000" },
            fill: { color: "#000" },
            projection: ISO_PROJECTION_PRESETS.iso,
            idSymbol: "cube",
        });
        const pyr = isoSymbolPlacement(cellsize, 0, 0, draw.findOne("#pyr") as Svg, scale);
        const cube = isoSymbolPlacement(cellsize, 0, 0, draw.findOne("#cube") as Svg, scale);
        expect(pyr.newWidth).to.be.closeTo(cube.newWidth, 1);
    });

    it("should render Icehouse large taller than the default pyramid at the same base", () => {
        const draw = makeDraw();
        const cellsize = 100;
        const scale = 0.75;
        generatePyramids({
            rootSvg: draw,
            dims: [{ baseSize: ICEHOUSE_LARGE_BASE, sideHeight: DEFAULT_PYRAMID_SIDE_HEIGHT }],
            stroke: { width: 1, color: "#000" },
            fill: { color: "#000" },
            projection: ISO_PROJECTION_PRESETS.iso,
            idSymbol: "defaultPyr",
        });
        generatePyramids({
            rootSvg: draw,
            dims: [icehousePyramidDims("large")],
            stroke: { width: 1, color: "#000" },
            fill: { color: "#000" },
            projection: ISO_PROJECTION_PRESETS.iso,
            idSymbol: "iceLarge",
        });
        const defaultPyr = isoSymbolPlacement(cellsize, 0, 0, draw.findOne("#defaultPyr") as Svg, scale);
        const iceLarge = isoSymbolPlacement(cellsize, 0, 0, draw.findOne("#iceLarge") as Svg, scale);
        expect(iceLarge.newWidth).to.be.closeTo(defaultPyr.newWidth, 1);
        expect(iceLarge.newHeight).to.be.greaterThan(defaultPyr.newHeight);
    });
});
