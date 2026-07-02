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
