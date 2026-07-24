/* eslint-disable @typescript-eslint/no-require-imports */
import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { addPrefix, render, IRenderOptions } from "../src/index";
import { DefaultRenderer } from "../src/renderers/default";
import { IRendererOptionsIn } from "../src/renderers/_base";
import { APRenderRep } from "../src/schemas/schema";

const { createSVGWindow } = require("svgdom");

const prefixOpts = { prefix: "game1-" } as IRenderOptions;

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

describe("addPrefix regression", () => {
    it("prefixes a minimal id and url reference", () => {
        const svg = '<rect id="foo" fill="url(#foo)"/>';
        expect(addPrefix(svg, prefixOpts)).to.equal('<rect id="game1-foo" fill="url(#game1-foo)"/>');
    });

    it("prefixes multiple independent ids and reference forms", () => {
        const svg = [
            '<defs>',
            '<linearGradient id="bar"/>',
            '<pattern id="baz"/>',
            "</defs>",
            '<rect id="foo" fill="url(#bar)" href="#baz"/>',
            '<use xlink:href="#foo"/>',
        ].join("");
        const out = addPrefix(svg, prefixOpts);
        expect(out).to.include('id="game1-foo"');
        expect(out).to.include('id="game1-bar"');
        expect(out).to.include('id="game1-baz"');
        expect(out).to.include('fill="url(#game1-bar)"');
        expect(out).to.include('href="#game1-baz"');
        expect(out).to.include('xlink:href="#game1-foo"');
    });

    it("prefixes chevrons-style internal xlink references", () => {
        const svg = [
            '<pattern id="chevrons">',
            '<defs>',
            '<rect id="_r"/>',
            '<g id="_p"><use xlink:href="#_r"/></g>',
            "</defs>",
            '<use xlink:href="#_p"/>',
            "</pattern>",
            '<rect fill="url(#chevrons)"/>',
        ].join("");
        const out = addPrefix(svg, prefixOpts);
        expect(out).to.include('id="game1-chevrons"');
        expect(out).to.include('id="game1-_r"');
        expect(out).to.include('id="game1-_p"');
        expect(out).to.include('xlink:href="#game1-_r"');
        expect(out).to.include('xlink:href="#game1-_p"');
        expect(out).to.include('fill="url(#game1-chevrons)"');
    });

    it("prefixes sheet-style gradient ids", () => {
        const svg = '<linearGradient id="radialGradient-ff0000"/><circle fill="url(#radialGradient-ff0000)"/>';
        const out = addPrefix(svg, prefixOpts);
        expect(out).to.include('id="game1-radialGradient-ff0000"');
        expect(out).to.include('fill="url(#game1-radialGradient-ff0000)"');
    });

    it("prefixes quoted hash-id references when present", () => {
        const svg = '<rect id="pulse"/><circle marker-start="#pulse"/>';
        const out = addPrefix(svg, prefixOpts);
        expect(out).to.include('id="game1-pulse"');
        expect(out).to.include('marker-start="#game1-pulse"');
    });

    it("prefixes ids that share a common prefix without corrupting longer ids", () => {
        const svg = [
            '<defs>',
            '<pattern id="dot"/>',
            '<pattern id="dots"/>',
            "</defs>",
            '<rect fill="url(#dots)" href="#dots"/>',
        ].join("");
        const out = addPrefix(svg, prefixOpts);
        expect(out).to.include('id="game1-dot"');
        expect(out).to.include('id="game1-dots"');
        expect(out).to.include('fill="url(#game1-dots)"');
        expect(out).to.include('href="#game1-dots"');
    });

    it("leaves svg unchanged when prefix is omitted", () => {
        const svg = '<rect id="foo" fill="url(#foo)"/>';
        expect(addPrefix(svg, {} as Parameters<typeof addPrefix>[1])).to.equal(svg);
    });

    it("prefixes rendered board output via render + addPrefix", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        const json: APRenderRep = {
            board: { style: "squares", height: 1, width: 1 },
            legend: {
                A: { name: "piece", colour: "dots" },
            },
            pieces: "A",
        };
        renderer.render(json, draw, baseOptions);
        const out = addPrefix(draw.svg(), prefixOpts);
        expect(out).to.include('id="game1-dots"');
        expect(out).to.match(/url\(#game1-dots(-\d+)?\)/);
    });

    it("prefixes renderglyph-shaped output", () => {
        const draw = makeDraw();
        const json: APRenderRep = {
            board: null,
            legend: { A: { name: "piece", colour: "chevrons" } },
            pieces: "A",
        };
        render(json, { ...baseOptions, target: draw });
        const out = addPrefix(draw.svg(), { prefix: "g-" } as IRenderOptions);
        expect(out).to.include('id="g-');
        expect(out).to.match(/url\(#g-[^"]+\)/);
    });

    it("prefixes renderStatic-shaped board output", () => {
        const draw = makeDraw();
        const json: APRenderRep = {
            board: { style: "squares", height: 1, width: 1 },
            legend: { A: { name: "piece", colour: 1 } },
            pieces: "A",
        };
        render(json, { ...baseOptions, target: draw });
        const out = addPrefix(draw.svg(), { prefix: "static-" } as IRenderOptions);
        expect(out).to.include('id="static-');
    });
});

describe("addPrefix scaled-pattern collisions", () => {
    it("prefixes scaled pattern ids alongside the base pattern", () => {
        const svg = [
            "<defs>",
            '<pattern id="dots"/>',
            '<pattern id="dots-150"/>',
            '<pattern id="dots-715_315"/>',
            "</defs>",
            '<rect fill="url(#dots-150)" href="#dots-150"/>',
            '<circle fill="url(#dots-715_315)" xlink:href="#dots-715_315"/>',
        ].join("");
        const out = addPrefix(svg, prefixOpts);
        expect(out).to.include('id="game1-dots"');
        expect(out).to.include('id="game1-dots-150"');
        expect(out).to.include('id="game1-dots-715_315"');
        expect(out).to.include('fill="url(#game1-dots-150)"');
        expect(out).to.include('href="#game1-dots-150"');
        expect(out).to.include('fill="url(#game1-dots-715_315)"');
        expect(out).to.include('xlink:href="#game1-dots-715_315"');
    });

    it("prefixes hyphenated ids that extend a shorter id", () => {
        const svg = [
            "<defs>",
            '<pattern id="dots"/>',
            '<pattern id="dots-extra"/>',
            "</defs>",
            '<rect href="#dots-extra" fill="url(#dots-extra)"/>',
        ].join("");
        const out = addPrefix(svg, prefixOpts);
        expect(out).to.include('id="game1-dots-extra"');
        expect(out).to.include('href="#game1-dots-extra"');
        expect(out).to.include('fill="url(#game1-dots-extra)"');
    });
});
