import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { addPrefix, render, IRenderOptions } from "../src/index";
import { IRendererOptionsIn } from "../src/renderers/_base";
import { APRenderRep } from "../src/schemas/schema";

const pulseFixture: APRenderRep = {
    board: {
        style: "squares",
        height: 1,
        width: 1,
        markers: [{
            type: "flood",
            colour: 1,
            opacity: 0.5,
            pulse: 1500,
            points: [{ row: 0, col: 0 }],
        }],
    },
    legend: {
        A: { name: "piece", colour: 1 },
    },
    pieces: "A",
};

const baseOptions: IRendererOptionsIn = {
    contextGlobal: true,
    coloursGlobal: false,
    showAnnotations: false,
    sheets: ["core"],
};

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    const document = window.document;
    registerWindow(window, document);
    return SVG(document.documentElement) as Svg;
};

const staticPulseSvg = (prefix?: string): string => {
    const draw = makeDraw();
    render(pulseFixture, {
        ...baseOptions,
        target: draw,
        staticAnimations: true,
    } as IRenderOptions);
    const opts = prefix !== undefined ? { prefix } as IRenderOptions : {} as IRenderOptions;
    return addPrefix(draw.svg(), opts);
};

describe("marker pulse static output", () => {
    it("staticAnimations emits CSS keyframes and per-marker animation duration", () => {
        const out = staticPulseSvg("wiki-1-");
        expect(out).to.include("@keyframes aprender-marker-pulse");
        expect(out).to.match(/animation:\s*aprender-marker-pulse\s+1500ms/i);
        expect(out).to.include('id="wiki-1-aprender-pulse-keyframes"');
    });

    it("live render without staticAnimations omits pulse keyframes in serialized svg", () => {
        const draw = makeDraw();
        render(pulseFixture, {
            ...baseOptions,
            target: draw,
            staticAnimations: false,
        } as IRenderOptions);
        const out = draw.svg();
        expect(out).not.to.include("@keyframes aprender-marker-pulse");
    });

    it("addPrefix keeps glyph font selectors aligned with prefixed symbol ids", () => {
        const svg = [
            "<defs>",
            "<style>#glyphA text { font-family: CustomLabel !important; }</style>",
            '<symbol id="glyphA"><text>A</text></symbol>',
            "</defs>",
            '<use href="#glyphA"/>',
        ].join("");
        const out = addPrefix(svg, { prefix: "g-" } as IRenderOptions);
        expect(out).to.include('id="g-glyphA"');
        expect(out).to.include("#g-glyphA text");
    });
});
