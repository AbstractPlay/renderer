/* eslint-disable @typescript-eslint/no-require-imports */
import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { DefaultRenderer } from "../src/renderers/default";
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

describe("loadPattern", () => {
    it("is idempotent for base pattern ids", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        renderer.render(
            {
                board: null,
                legend: { A: { name: "piece", colour: "dots" } },
                pieces: "A",
            },
            draw,
            baseOptions,
        );
        const loadPattern = (renderer as unknown as {
            loadPattern: (name: string) => string;
        }).loadPattern.bind(renderer);
        const first = loadPattern("dots");
        const second = loadPattern("dots");
        expect(first).to.equal("dots");
        expect(second).to.equal("dots");
        expect(draw.svg().match(/id="dots"/g)?.length).to.equal(1);
    });

    it("uses distinct variant ids for custom fg/bg", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        renderer.render(
            {
                board: null,
                legend: { A: { name: "piece", colour: "dots" } },
                pieces: "A",
            },
            draw,
            baseOptions,
        );
        const loadPattern = (renderer as unknown as {
            loadPattern: (name: string, opts: { fg?: string; bg?: string }) => string;
        }).loadPattern.bind(renderer);
        const variantId = loadPattern("cross", { bg: "none", fg: "#ff0000" });
        expect(variantId).to.equal("cross--fg-_ff0000--bg-none");
        expect(draw.svg()).to.include(`id="${variantId}"`);
        loadPattern("cross", { bg: "none", fg: "#ff0000" });
        expect(draw.svg().match(new RegExp(`id="${variantId}"`, "g"))?.length).to.equal(1);
    });

    it("normalizes equivalent numeric scale keys", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        renderer.render(
            {
                board: null,
                legend: { A: { name: "piece", colour: "dots" } },
                pieces: "A",
            },
            draw,
            baseOptions,
        );
        const getScaledPattern = (renderer as unknown as {
            getScaledPattern: (name: string, useSize: number) => { id: () => string };
        }).getScaledPattern.bind(renderer);
        const fromNumber = getScaledPattern("dots", 100);
        const fromScientific = getScaledPattern("dots", 1e2);
        expect(fromNumber.id()).to.equal("dots-100");
        expect(fromScientific.id()).to.equal("dots-100");
    });

    it("loads flood-marker pattern variants with custom colour", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        const json: APRenderRep = {
            board: {
                style: "squares",
                height: 2,
                width: 2,
                markers: [{
                    type: "flood",
                    colour: "#336699",
                    pattern: "cross",
                    points: [{ row: 0, col: 0 }],
                }],
            },
            legend: {},
            pieces: null,
        };
        renderer.render(json, draw, baseOptions);
        const svg = draw.svg();
        expect(svg).to.include('id="cross--fg-_336699--bg-none"');
        expect(svg).to.match(/url\(#cross--fg-_336699--bg-none\)/);
    });
});
