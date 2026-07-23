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
    sheets: ["piecepack"],
};

const domRLintelRep = (rotate: number): APRenderRep => ({
    renderer: "isometric",
    board: { style: "squares", width: 2, height: 1, rotate },
    legend: {
        DomR: {
            piece: "lintelW",
            colour: 3,
            decor: {
                top: [{ name: "piecepack-number-4", colour: 2 }],
            },
        },
    },
    pieces: [[[], [{ glyph: "DomR" }]]],
});

const overlayGlyphUseTag = (draw: Svg, symbolId: string): string | null => {
    const defsText = draw.svg();
    const symStart = defsText.indexOf(`id="${symbolId}"`);
    if (symStart < 0) {
        return null;
    }
    const slice = defsText.slice(symStart, symStart + 12000);
    const useChunk = slice.match(/<use[^>]*aprender-glyph[^>]*>/);
    return useChunk?.[0] ?? null;
};

const overlayGlyphUseAttrs = (draw: Svg, symbolId: string): { width: number } | null => {
    const tag = overlayGlyphUseTag(draw, symbolId);
    if (tag === null) {
        return null;
    }
    const width = tag.match(/\bwidth="([^"]+)"/);
    if (width === null) {
        return null;
    }
    return { width: parseFloat(width[1]) };
};

describe("isometric face overlay integration", () => {
    it("should embed DomR fluid overlay with board rotation at 90°", () => {
        const draw = makeDraw();
        new IsometricRenderer().render(domRLintelRep(90), draw, baseOptions);
        const tag = overlayGlyphUseTag(draw, "DomR");
        expect(tag).to.not.equal(null);
        const draw0 = makeDraw();
        new IsometricRenderer().render(domRLintelRep(0), draw0, baseOptions);
        const tag0 = overlayGlyphUseTag(draw0, "DomR");
        expect(tag).to.not.equal(tag0);
        expect(tag).to.match(/transform="/);
    });

    it("should keep DomR fluid overlay unrotated at board 0°", () => {
        const draw = makeDraw();
        new IsometricRenderer().render(domRLintelRep(0), draw, baseOptions);
        const tag = overlayGlyphUseTag(draw, "DomR");
        expect(tag).to.not.equal(null);
        expect(tag).to.not.match(/rotate\(/);
    });

    it("should produce depth-shaded board symbols with unclipped face overlays", () => {
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 1, height: 1 },
            legend: {
                Box: {
                    piece: "cube",
                    colour: 1,
                    height: 35,
                    decor: {
                        top: [{ name: "piecepack-number-1", colour: 1 }],
                    },
                },
            },
            pieces: [[[{ glyph: "Box" }]]],
        };
        const draw = makeDraw();
        new IsometricRenderer().render(rep, draw, baseOptions);
        expect(draw.svg()).to.match(/id="Box__db\d+"/);
        expect(draw.svg()).to.not.include("clip-path");
    });

    it("should scale iso face decor with legend scale using the viewBox fit budget", () => {
        const cubeLegend = (scale: number) => ({
            piece: "cube" as const,
            colour: 1,
            height: 35,
            scale,
            decor: {
                top: [{ name: "piecepack-number-1", colour: 1 }],
            },
        });
        const rep: APRenderRep = {
            renderer: "isometric",
            options: ["no-iso-depth-shade"],
            board: { style: "squares", width: 2, height: 1 },
            legend: {
                Full: cubeLegend(1),
                Half: cubeLegend(0.5),
            },
            pieces: [[[{ glyph: "Full" }, { glyph: "Half" }]]],
        };
        const draw = makeDraw();
        new IsometricRenderer().render(rep, draw, baseOptions);
        const full = overlayGlyphUseAttrs(draw, "Full");
        const half = overlayGlyphUseAttrs(draw, "Half");
        expect(full).to.not.equal(null);
        expect(half).to.not.equal(null);
        expect(full!.width).to.be.greaterThan(half!.width * 1.5);
        expect(full!.width).to.be.at.most(100);
    });

    it("should allow cube top decor to use more face UV than cylinder ellipse tops", () => {
        const rep: APRenderRep = {
            renderer: "isometric",
            options: ["no-iso-depth-shade"],
            board: { style: "squares", width: 2, height: 1 },
            legend: {
                Cyl: {
                    piece: "cylinder",
                    colour: 1,
                    height: 35,
                    scale: 1,
                    top: [{ name: "piecepack-number-1", colour: 1 }],
                },
                Cube: {
                    piece: "cube",
                    colour: 1,
                    height: 35,
                    scale: 1,
                    decor: {
                        top: [{ name: "piecepack-number-1", colour: 1 }],
                    },
                },
            },
            pieces: [[[{ glyph: "Cyl" }, { glyph: "Cube" }]]],
        };
        const draw = makeDraw();
        new IsometricRenderer().render(rep, draw, baseOptions);
        const cyl = overlayGlyphUseAttrs(draw, "Cyl");
        const cube = overlayGlyphUseAttrs(draw, "Cube");
        expect(cyl).to.not.equal(null);
        expect(cube).to.not.equal(null);
        expect(cube!.width).to.be.greaterThan(cyl!.width);
        expect(cyl!.width).to.be.at.most(100);
        expect(cube!.width).to.be.at.most(100);
    });
});
