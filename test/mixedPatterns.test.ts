/* eslint-disable @typescript-eslint/no-require-imports */
import Ajv from "ajv";
import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { DefaultRenderer } from "../src/renderers/default";
import { IRendererOptionsIn } from "../src/renderers/_base";
import { APRenderRep } from "../src/schemas/schema";
const schema = require("../src/schemas/schema.json");

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

const pieceLegend: APRenderRep["legend"] = {
    A: { name: "piece", colour: 1 },
    B: { name: "piece", colour: 2 },
};

/** Self-contained fixture for mixed colour/pattern legend entries (not tied to docs samples). */
const mixedPatternsFixture: APRenderRep = {
    board: { style: "squares", height: 2, width: 2 },
    legend: {
        P1: { name: "piece", colour: 1 },
        P2: { name: "piece", colour: 2 },
        FIXED: { name: "piece", colour: "houndstooth" },
        LIGHT: {
            name: "piece",
            colour: {
                func: "lighten",
                colour: "microbial",
                ds: 0.15,
                dl: 0.1,
            },
        },
        CUSTOM: {
            name: "piece",
            colour: {
                func: "custom",
                default: "chevrons",
                palette: 1,
            },
        },
    },
    pieces: "P1,P2\nFIXED,LIGHT",
};

describe("Mixed colours and patterns", () => {
    it("validates mixed colour and pattern legend entries", () => {
        const ajv = new Ajv();
        expect(ajv.validate(schema, mixedPatternsFixture)).to.equal(true);
    });

    it("validates glyph colour with a pattern name", () => {
        const data = {
            board: { style: "squares", height: 4, width: 4 },
            legend: {
                A: { name: "piece", colour: "chevrons" },
            },
            pieces: "A",
        };
        const ajv = new Ajv();
        expect(ajv.validate(schema, data)).to.equal(true);
    });

    it("renders mixed colours without patterns:true", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        const json: APRenderRep = {
            board: { style: "squares", height: 2, width: 2 },
            legend: pieceLegend,
            pieces: "AB\nBA",
        };
        renderer.render(json, draw, {
            ...baseOptions,
            colours: ["#e31a1c", "dots"],
        });
        const svg = draw.svg();
        expect(svg).to.include('id="dots"');
        expect(svg).to.include("#e31a1c");
    });

    it("patterns:true uses patternList defaults with partial colour override", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        const json: APRenderRep = {
            board: { style: "squares", height: 2, width: 2 },
            legend: pieceLegend,
            pieces: "AB\nBA",
        };
        renderer.render(json, draw, {
            ...baseOptions,
            patterns: true,
            patternList: ["microbial", "honeycomb"],
            colours: [null, "#00ff00"],
        });
        const svg = draw.svg();
        expect(svg).to.include('id="microbial"');
        expect(svg).to.include("#00ff00");
    });

    it("renders a literal pattern on a glyph", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        const json: APRenderRep = {
            board: { style: "squares", height: 1, width: 1 },
            legend: {
                A: { name: "piece", colour: "chevrons" },
            },
            pieces: "A",
        };
        renderer.render(json, draw, baseOptions);
        expect(draw.svg()).to.include('id="chevrons"');
    });

    it("custom respects player override for hex and pattern slots", () => {
        const renderer = new DefaultRenderer();
        const json: APRenderRep = {
            board: { style: "squares", height: 1, width: 1 },
            legend: {
                A: {
                    name: "piece",
                    colour: {
                        func: "custom",
                        default: "houndstooth",
                        palette: 1,
                    },
                },
            },
            pieces: "A",
        };

        const drawHex = makeDraw();
        renderer.render(json, drawHex, {
            ...baseOptions,
            colours: ["#336699"],
        });
        expect(drawHex.svg()).to.include("#336699");

        const drawPattern = makeDraw();
        renderer.render(json, drawPattern, {
            ...baseOptions,
            colours: ["dots"],
        });
        expect(drawPattern.svg()).to.include('id="dots"');
    });

    it("lighten degrades gracefully when a player slot is a pattern", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        const json: APRenderRep = {
            board: { style: "squares", height: 1, width: 1 },
            legend: {
                A: {
                    name: "piece",
                    colour: {
                        func: "lighten",
                        colour: 1,
                        ds: 0.2,
                        dl: 0.2,
                    },
                },
            },
            pieces: "A",
        };
        expect(() => {
            renderer.render(json, draw, {
                ...baseOptions,
                colours: ["dots"],
            });
        }).to.not.throw();
        expect(draw.svg()).to.include('id="dots"');
    });

    it("bestContrast uses background reference when bg player slot is a pattern", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        const json: APRenderRep = {
            board: { style: "squares", height: 1, width: 1 },
            legend: {
                A: {
                    name: "piece",
                    colour: {
                        func: "bestContrast",
                        bg: 1,
                        fg: ["#000", "#fff"],
                    },
                },
            },
            pieces: "A",
        };
        renderer.render(json, draw, {
            ...baseOptions,
            colours: ["chevrons"],
            colourContext: {
                background: "#ffffff",
                fill: "#000",
                strokes: "#000",
                borders: "#000",
                labels: "#000",
                annotations: "#000",
            },
        });
        const svg = draw.svg();
        expect(svg).to.include('id="chevrons"');
    });
});
