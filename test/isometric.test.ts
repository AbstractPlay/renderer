/* eslint-disable @typescript-eslint/no-require-imports */
import { expect } from "chai";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { IsometricRenderer } from "../src/renderers/isometric";
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
    coloursGlobal: true,
    colourContext: {
        background: "#ccc",
        fill: "#eee",
        strokes: "#000",
        annotations: "#000",
        board: "#ccc",
    },
    showAnnotations: false,
};

const multiFaceRenderRep = (): APRenderRep => ({
    renderer: "isometric",
    board: {
        style: "squares",
        width: 2,
        height: 2,
    },
    legend: {
        D1: {
            piece: "cube",
            height: 30,
            faces: {
                top: "#ff0000",
                north: "#00ff00",
                east: "#0000ff",
                south: "#ffff00",
                west: "#ff00ff",
            },
        },
    },
    pieces: [
        [
            [{ glyph: "D1", yaw: 0 }],
            [],
        ],
        [
            [],
            [],
        ],
    ],
});

const pieceUseHref = (draw: Svg): string | undefined => {
    for (const use of draw.find("#board use")) {
        const href = (use.attr("href") ?? use.attr("xlink:href")) as string | undefined;
        if (href !== undefined && href.includes("D1__y")) {
            return href;
        }
    }
    return undefined;
};

describe("IsometricRenderer multi-face cubes", () => {
    it("should render distinct face-colour symbols for each yaw variant", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        renderer.render(multiFaceRenderRep(), draw, baseOptions);

        expect(draw.findOne("#D1__y0")).to.not.equal(null);
        expect(draw.findOne("#D1__y1")).to.not.equal(null);
        expect(draw.findOne("#D1__y2")).to.not.equal(null);
        expect(draw.findOne("#D1__y3")).to.not.equal(null);
    });

    it("should select a different symbol when the board is rotated", () => {
        const draw0 = makeDraw();
        const draw90 = makeDraw();
        const renderer = new IsometricRenderer();

        renderer.render(multiFaceRenderRep(), draw0, { ...baseOptions, rotate: 0 });
        renderer.render(multiFaceRenderRep(), draw90, { ...baseOptions, rotate: 90 });

        const hrefAt0 = pieceUseHref(draw0);
        const hrefAt90 = pieceUseHref(draw90);
        expect(hrefAt0).to.include("D1__y0");
        expect(hrefAt90).to.include("D1__y1");
    });
});

const keyRenderRep = (position: "left" | "right" = "right"): APRenderRep => ({
    renderer: "isometric",
    board: {
        style: "squares",
        width: 2,
        height: 2,
    },
    legend: {
        R: { piece: "cube", height: 30, colour: "#ff0000" },
        B: { piece: "cylinder", height: 30, colour: "#0000ff" },
        M: {
            piece: "cube",
            height: 30,
            faces: {
                top: "#ff0000",
                north: "#00ff00",
                east: "#0000ff",
                south: "#ffff00",
                west: "#ff00ff",
            },
        },
    },
    pieces: [
        [[{ glyph: "R" }], []],
        [[], []],
    ],
    areas: [{
        type: "key",
        position,
        list: [
            { piece: "R", name: "Red cube" },
            { piece: "B", name: "Blue cylinder" },
            { piece: "M", name: "Multi cube" },
        ],
    }],
});

describe("IsometricRenderer key", () => {
    it("should render a key with cube, cylinder, and multi-face cube entries", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        renderer.render(keyRenderRep(), draw, baseOptions);

        expect(draw.findOne("#_key")).to.not.equal(null);
        const keyUse = draw.find("use").find((u) => {
            const href = (u.attr("href") ?? u.attr("xlink:href")) as string | undefined;
            return href === "#_key";
        });
        expect(keyUse).to.not.equal(undefined);
    });

    it("should honour the position property", () => {
        const drawLeft = makeDraw();
        const drawRight = makeDraw();
        const renderer = new IsometricRenderer();
        renderer.render(keyRenderRep("left"), drawLeft, baseOptions);
        renderer.render(keyRenderRep("right"), drawRight, baseOptions);

        const keyLeft = drawLeft.find("use").find((u) => (u.attr("href") ?? u.attr("xlink:href")) === "#_key");
        const keyRight = drawRight.find("use").find((u) => (u.attr("href") ?? u.attr("xlink:href")) === "#_key");
        expect(keyLeft).to.not.equal(undefined);
        expect(keyRight).to.not.equal(undefined);
        const transformLeft = keyLeft!.attr("transform") as string;
        const transformRight = keyRight!.attr("transform") as string;
        expect(transformLeft).to.not.equal(transformRight);
    });
});

const squaresLabelRep = (options?: APRenderRep["options"]): APRenderRep => ({
    renderer: "isometric",
    options,
    board: {
        style: "squares",
        width: 2,
        height: 2,
    },
    legend: {
        X: { piece: "cube", height: 20, colour: "#c0392b" },
    },
    pieces: [
        [[{ glyph: "X" }], []],
        [[], []],
    ],
});

const labelTexts = (draw: Svg): string[] => {
    const group = draw.findOne("#labels");
    if (group === null) {
        return [];
    }
    return group.find("text").map((t) => t.node.textContent ?? "");
};

describe("IsometricRenderer board labels", () => {
    it("should render column and row labels on a squares board", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        renderer.render(squaresLabelRep(), draw, baseOptions);

        expect(draw.findOne("#labels")).to.not.equal(null);
        const texts = labelTexts(draw);
        expect(texts).to.include("a");
        expect(texts).to.include("b");
        expect(texts).to.include("2");
        expect(texts).to.include("1");
    });

    it("should hide labels when hide-labels is set", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        renderer.render(squaresLabelRep(["hide-labels"]), draw, baseOptions);

        expect(draw.findOne("#labels")).to.equal(null);
    });

    it("should honour reverse-letters", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        renderer.render(squaresLabelRep(["reverse-letters"]), draw, baseOptions);

        const texts = labelTexts(draw);
        const topLabels = texts.filter((t) => t === "a" || t === "b");
        expect(topLabels).to.include("b");
        expect(topLabels).to.include("a");
        // bottom row column 0 should show reversed first letter
        expect(texts.filter((t) => t === "b").length).to.be.greaterThan(0);
    });

    it("should honour hide-labels-half on squares boards", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        renderer.render(squaresLabelRep(["hide-labels-half"]), draw, baseOptions);

        const texts = labelTexts(draw);
        // top column letters and right row numbers are omitted
        const aCount = texts.filter((t) => t === "a").length;
        const bCount = texts.filter((t) => t === "b").length;
        expect(aCount).to.equal(1);
        expect(bCount).to.equal(1);
        const twoCount = texts.filter((t) => t === "2").length;
        const oneCount = texts.filter((t) => t === "1").length;
        expect(twoCount).to.equal(1);
        expect(oneCount).to.equal(1);
    });

    it("should project labels onto the isometric plane", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        renderer.render(squaresLabelRep(), draw, baseOptions);

        const group = draw.findOne("#labels");
        expect(group).to.not.equal(null);
        for (const t of group!.find("text")) {
            expect(t.attr("transform")).to.not.equal(undefined);
        }
    });

    it("should reposition labels when the board is rotated", () => {
        const draw0 = makeDraw();
        const draw90 = makeDraw();
        const renderer = new IsometricRenderer();
        renderer.render(squaresLabelRep(), draw0, { ...baseOptions, rotate: 0 });
        renderer.render(squaresLabelRep(), draw90, { ...baseOptions, rotate: 90 });

        const transformsAt0 = draw0.find("#labels text").map((t) => t.attr("transform") as string);
        const transformsAt90 = draw90.find("#labels text").map((t) => t.attr("transform") as string);
        expect(transformsAt0.length).to.be.greaterThan(0);
        expect(transformsAt90.length).to.equal(transformsAt0.length);
        expect(transformsAt90).to.not.deep.equal(transformsAt0);
    });

    it("should render all distinct labels when rotated 90 degrees on a 4x4 board", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 4, height: 4 },
            legend: { X: { piece: "cube", height: 20, colour: "#c0392b" } },
            pieces: null,
        };
        renderer.render(rep, draw, { ...baseOptions, rotate: 90 });

        const texts = labelTexts(draw);
        expect(texts.length).to.equal(16);
        const transforms = draw.find("#labels text").map((t) => t.attr("transform") as string);
        expect(new Set(transforms).size).to.equal(16);
    });

    it("should render hex-of-cir with cylinders when rotated 90 degrees", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "hex-of-cir", minWidth: 3, maxWidth: 5 },
            legend: {
                R: { piece: "cylinder", height: 30, colour: "#c0392b" },
            },
            pieces: null,
        };
        renderer.render(rep, draw, { ...baseOptions, rotate: 90 });

        expect(draw.findOne("#labels")).to.not.equal(null);
        expect(draw.findOne("#board")).to.not.equal(null);
    });
});
