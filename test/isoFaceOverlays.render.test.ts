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

describe("isometric face glyph overlays", () => {
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

    /** SVG matrix `b` (sin θ) from baked glyph `use` transform — +90° board-lock ≈ +1, counter-rotate ≈ −1. */
    const overlayGlyphMatrixB = (useTag: string): number | null => {
        const m = useTag.match(/transform="matrix\(([^)]+)\)"/);
        if (m === null) {
            return null;
        }
        const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
        if (parts.length < 2 || !Number.isFinite(parts[1])) {
            return null;
        }
        return parts[1];
    };

    const overlayGlyphUseAttrs = (draw: Svg, symbolId: string): { width: number; height: number; x: number; y: number } | null => {
        const symbol = draw.findOne(`#${symbolId}`) as Svg | null;
        if (symbol === null) {
            return null;
        }
        const uses = draw.find(`#${symbolId} use, #${symbolId} use use`);
        let found: { width: number; height: number; x: number; y: number } | null = null;
        uses.forEach((node) => {
            const href = (node.attr("href") ?? node.attr("xlink:href") ?? "") as string;
            if (!href.includes("aprender-glyph") || found !== null) {
                return;
            }
            const width = parseFloat(node.attr("width") as string);
            const height = parseFloat(node.attr("height") as string);
            const x = parseFloat(node.attr("x") as string);
            const y = parseFloat(node.attr("y") as string);
            if (Number.isFinite(width) && Number.isFinite(height) && Number.isFinite(x) && Number.isFinite(y)) {
                found = { width, height, x, y };
            }
        });
        if (found !== null) {
            return found;
        }
        const defsText = draw.svg();
        const symStart = defsText.indexOf(`id="${symbolId}"`);
        if (symStart < 0) {
            return null;
        }
        const slice = defsText.slice(symStart, symStart + 12000);
        const useChunk = slice.match(/<use[^>]*aprender-glyph[^>]*>/);
        if (useChunk === null) {
            return null;
        }
        const tag = useChunk[0];
        const width = tag.match(/\bwidth="([^"]+)"/);
        const height = tag.match(/\bheight="([^"]+)"/);
        const x = tag.match(/\bx="([^"]+)"/);
        const y = tag.match(/\by="([^"]+)"/);
        if (width === null || height === null || x === null || y === null) {
            return null;
        }
        return {
            width: parseFloat(width[1]),
            height: parseFloat(height[1]),
            x: parseFloat(x[1]),
            y: parseFloat(y[1]),
        };
    };

    it("should bake sheet glyphs into a cylinder legend symbol", () => {
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 1, height: 1 },
            legend: {
                A: {
                    piece: "cylinder",
                    colour: 1,
                    height: 40,
                    top: [{ name: "piecepack-number-3", colour: 1, scale: 0.7 }],
                },
            },
            pieces: [[["A"]]],
        };
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        renderer.render(rep, draw, baseOptions);

        const symbol = draw.findOne("#A") as Svg | null;
        expect(symbol).to.not.equal(null);
        const overlayUses = symbol!.find("use");
        expect(overlayUses.length).to.be.greaterThan(1);
        const glyphUse = overlayGlyphUseAttrs(draw, "A");
        expect(glyphUse).to.not.equal(null);
        expect(glyphUse!.width).to.be.lessThan(75);
        expect(glyphUse!.width).to.be.greaterThan(35);
    });

    it("should ignore board rotation on cube side decor overlays", () => {
        const legendEntry = {
            piece: "cube" as const,
            colour: 1,
            decor: {
                south: [{ name: "piecepack-number-1", colour: 1 }],
            },
        };
        const draw0 = makeDraw();
        const draw90 = makeDraw();
        const renderer0 = new IsometricRenderer();
        const renderer90 = new IsometricRenderer();
        const rep0: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 1, height: 1, rotate: 0 },
            legend: { Side: legendEntry },
            pieces: [[[{ glyph: "Side" }]]],
        };
        const rep90: APRenderRep = {
            ...rep0,
            board: { style: "squares", width: 1, height: 1, rotate: 90 },
        };
        renderer0.render(rep0, draw0, baseOptions);
        renderer90.render(rep90, draw90, baseOptions);

        const use0 = overlayGlyphUseTag(draw0, "Side");
        const use90 = overlayGlyphUseTag(draw90, "Side");
        expect(use0).to.not.equal(null);
        expect(use90).to.not.equal(null);
        expect(use0).to.equal(use90);
    });

    it("should use a larger face inset when isoPiece scale is 1", () => {
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 1, height: 1 },
            legend: {
                C1: {
                    piece: "cube",
                    colour: 1,
                    scale: 1,
                    decor: {
                        top: [{ name: "piecepack-number-1", colour: 1 }],
                    },
                },
            },
            pieces: [[[{ glyph: "C1" }]]],
        };
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        renderer.render(rep, draw, baseOptions);

        const symbol = draw.findOne("#C1") as Svg | null;
        expect(symbol).to.not.equal(null);
        const glyphUse = overlayGlyphUseAttrs(draw, "C1");
        expect(glyphUse).to.not.equal(null);
        expect(glyphUse!.width).to.be.at.most(100);
        expect(glyphUse!.width).to.be.greaterThan(70);
    });

    it("should bake fluid sheet glyphs on cube top with board rotation at iso bake time", () => {
        const legendEntry = {
            piece: "cube" as const,
            colour: 1,
            decor: {
                top: [{ name: "piecepack-number-1", colour: 1 }],
            },
        };
        const draw0 = makeDraw();
        const draw90 = makeDraw();
        const renderer0 = new IsometricRenderer();
        const renderer90 = new IsometricRenderer();
        const rep0: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 1, height: 1, rotate: 0 },
            legend: { S: legendEntry },
            pieces: [[[{ glyph: "S" }]]],
        };
        const rep90: APRenderRep = {
            ...rep0,
            board: { style: "squares", width: 1, height: 1, rotate: 90 },
        };
        renderer0.render(rep0, draw0, baseOptions);
        renderer90.render(rep90, draw90, baseOptions);

        const use0 = overlayGlyphUseTag(draw0, "S");
        const use90 = overlayGlyphUseTag(draw90, "S");
        expect(use0).to.not.equal(null);
        expect(use90).to.not.equal(null);
        expect(use0).to.not.equal(use90);
        expect(use90).to.match(/transform="/);
    });

    it("should bake DomR lintel top fluid glyph with +board.rotate at 90°", () => {
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 2, height: 1, rotate: 90 },
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
        };
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        renderer.render(rep, draw, baseOptions);
        const tag = overlayGlyphUseTag(draw, "DomR");
        expect(tag).to.not.equal(null);
        expect(tag).to.match(/transform="/);
    });

    it("should symbol-fit cube crown decor smaller than the raw face inset box", () => {
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 1, height: 1 },
            legend: {
                CubeCrown: {
                    piece: "cube",
                    colour: 1,
                    decor: {
                        top: [{ name: "piecepack-suit-crowns", colour: 1 }],
                    },
                },
            },
            pieces: [[[{ glyph: "CubeCrown" }]]],
        };
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        renderer.render(rep, draw, baseOptions);

        const glyphUse = overlayGlyphUseAttrs(draw, "CubeCrown");
        expect(glyphUse).to.not.equal(null);
        expect(glyphUse!.width).to.be.at.most(100);
        expect(glyphUse!.height).to.be.at.most(100);
        expect(glyphUse!.width).to.be.greaterThan(60);
    });

    it("should not bake board rotation into vertical text on iso cube tops", () => {
        const legendEntry = {
            piece: "cube" as const,
            colour: 1,
            decor: {
                top: [{ text: "V", colour: 1 }],
            },
        };
        const draw0 = makeDraw();
        const draw90 = makeDraw();
        const renderer0 = new IsometricRenderer();
        const renderer90 = new IsometricRenderer();
        const rep0: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 1, height: 1, rotate: 0 },
            legend: { T: legendEntry },
            pieces: [[[{ glyph: "T" }]]],
        };
        const rep90: APRenderRep = {
            ...rep0,
            board: { style: "squares", width: 1, height: 1, rotate: 90 },
        };
        renderer0.render(rep0, draw0, baseOptions);
        renderer90.render(rep90, draw90, baseOptions);

        const use0 = overlayGlyphUseTag(draw0, "T");
        const use90 = overlayGlyphUseTag(draw90, "T");
        expect(use0).to.not.equal(null);
        expect(use90).to.not.equal(null);
        expect(overlayGlyphMatrixB(use90!)).to.be.closeTo(0, 0.02);
        expect(overlayGlyphMatrixB(use0!)).to.be.closeTo(0, 0.02);
    });

    it("should not bake board rotation into multi-face cube top text at board.rotate 90°", () => {
        const cubeLegend = {
            piece: "cube" as const,
            faces: { top: 1, north: 2, east: 3, south: 4, west: 5 },
            decor: {
                top: [{ text: "A", colour: 1 }],
                south: [{ name: "piecepack-number-1", colour: 1 }],
            },
        } satisfies import("../src/schemas/schema").IsoPiece;
        const rep = (rotate: number): APRenderRep => ({
            renderer: "isometric",
            board: { style: "squares", width: 3, height: 2, rotate },
            legend: { Cube: cubeLegend },
            pieces: [[[], [], [{ glyph: "Cube", yaw: 0 }]], []],
        });
        const draw0 = makeDraw();
        const draw90 = makeDraw();
        new IsometricRenderer().render(rep(0), draw0, baseOptions);
        new IsometricRenderer().render(rep(90), draw90, baseOptions);
        const use0 = overlayGlyphUseTag(draw0, "Cube__y0");
        const use90 = overlayGlyphUseTag(draw90, "Cube__y1__db7");
        expect(use0).to.not.equal(null);
        expect(use90).to.not.equal(null);
        expect(overlayGlyphMatrixB(use0!)).to.be.closeTo(0, 0.02);
        expect(overlayGlyphMatrixB(use90!)).to.be.closeTo(0, 0.02);
    });

    it("should keep text glyph symbols out of face overlay layers and use unique aprender-glyph ids", () => {
        const cubeLegend = {
            piece: "cube" as const,
            faces: { top: 1, north: 2, east: 3, south: 4, west: 5 },
            decor: {
                top: [{ text: "A", colour: 1 }],
            },
        } satisfies import("../src/schemas/schema").IsoPiece;
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 3, height: 2, rotate: 90 },
            legend: { Cube: cubeLegend },
            pieces: [[[], [], [{ glyph: "Cube", yaw: 0 }]], []],
        };
        const draw = makeDraw();
        new IsometricRenderer().render(rep, draw, baseOptions);
        const svg = draw.svg();

        const glyphIds = [...svg.matchAll(/\bid="(aprender-glyph-[^"]+)"/g)].map((m) => m[1]);
        expect(glyphIds.length).to.be.greaterThan(0);
        expect(new Set(glyphIds).size).to.equal(glyphIds.length);

        for (const match of svg.matchAll(/<svg viewBox="0 0 100 100" id="[^"]*">([\s\S]*?)<\/svg>/g)) {
            const body = match[1];
            if (!body.includes("aprender-glyph")) {
                continue;
            }
            expect(body).to.not.include("<symbol");
        }

        const boardStart = svg.indexOf('id="board"');
        const boardEnd = svg.indexOf("</svg>", boardStart);
        const boardSlice = svg.slice(boardStart, boardEnd);
        const placedPieceId = (boardSlice.match(/href="#(Cube[^"]+)"/) ?? [])[1];
        expect(placedPieceId).to.equal("Cube__y1__db7");
        const pieceStart = svg.indexOf(`id="${placedPieceId}"`);
        expect(pieceStart).to.be.greaterThan(-1);
        const pieceSlice = svg.slice(pieceStart, pieceStart + 20000);
        const topGlyphUses = pieceSlice.match(/<use[^>]*aprender-glyph[^>]*>/g) ?? [];
        expect(topGlyphUses).to.have.length(1);
    });

    it("should bake decor onto cube lintel symbols", () => {
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 2, height: 1 },
            legend: {
                L: {
                    piece: "lintelE",
                    colour: 2,
                    decor: {
                        top: [{ name: "piecepack-number-1", colour: 1 }],
                    },
                },
            },
            pieces: [[[{ glyph: "L" }], [{ glyph: "L" }]]],
        };
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        renderer.render(rep, draw, baseOptions);

        const symbol = draw.findOne("#L") as Svg | null;
        expect(symbol).to.not.equal(null);
        expect(symbol!.find("use").length).to.be.greaterThan(1);
    });

    it("should fit cube side decor within short side height without over-wide glyph use", () => {
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 1, height: 1 },
            legend: {
                Short: {
                    piece: "cube",
                    colour: 1,
                    height: 35,
                    decor: {
                        south: [{ name: "piecepack-number-1", colour: 1 }],
                    },
                },
            },
            pieces: [[[{ glyph: "Short" }]]],
        };
        const draw = makeDraw();
        new IsometricRenderer().render(rep, draw, baseOptions);
        const glyphUse = overlayGlyphUseAttrs(draw, "Short");
        expect(glyphUse).to.not.equal(null);
        expect(glyphUse!.width).to.be.at.most(35);
        expect(glyphUse!.height).to.be.at.most(35);
    });

    it("should mount face overlays without clip-path and center UV on the face", () => {
        const rep: APRenderRep = {
            renderer: "isometric",
            options: ["no-iso-depth-shade"],
            board: { style: "squares", width: 2, height: 1 },
            legend: {
                Cyl: {
                    piece: "cylinder",
                    colour: 1,
                    height: 35,
                    top: [{ name: "piecepack-number-3", colour: 1 }],
                },
                CubeTop: {
                    piece: "cube",
                    colour: 1,
                    height: 35,
                    decor: { top: [{ name: "piecepack-number-1", colour: 1 }] },
                },
            },
            pieces: [[[{ glyph: "Cyl" }, { glyph: "CubeTop" }]]],
        };
        const draw = makeDraw();
        new IsometricRenderer().render(rep, draw, baseOptions);

        const cylSymbol = (draw.findOne("#Cyl") as Svg).svg();
        expect(cylSymbol).to.not.include("clip-path");
        expect(cylSymbol).to.match(
            /<g transform="matrix\([^)]+\)"><g transform="matrix\([^)]+\)"><use[^>]+href="#SvgjsSvg/,
        );

        const cubeSymbol = (draw.findOne("#CubeTop") as Svg).svg();
        expect(cubeSymbol).to.not.include("clip-path");
        expect(cubeSymbol).to.match(/<g transform="matrix\([^)]+\)"><use[^>]+href="#SvgjsSvg/);
    });

    it("should align projected-top overlay outer matrix with mesh and size the face layer use", () => {
        const rep: APRenderRep = {
            renderer: "isometric",
            options: ["no-iso-depth-shade"],
            board: { style: "squares", width: 2, height: 1 },
            legend: {
                Cyl: {
                    piece: "cylinder",
                    colour: 1,
                    height: 35,
                    top: [{ name: "piecepack-number-3", colour: 1 }],
                },
                Hex: {
                    piece: "hexp",
                    colour: 2,
                    height: 30,
                    top: [{ name: "piecepack-suit-hearts", colour: 2 }],
                },
            },
            pieces: [[[{ glyph: "Cyl" }, { glyph: "Hex" }]]],
        };
        const draw = makeDraw();
        new IsometricRenderer().render(rep, draw, baseOptions);

        const parseMatrixTail = (transform: string): { e: number; f: number } | null => {
            const m = transform.match(/matrix\(([^)]+)\)/);
            if (m === null) {
                return null;
            }
            const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
            if (parts.length !== 6) {
                return null;
            }
            return { e: parts[4], f: parts[5] };
        };

        const assertOverlayMatchesMesh = (symbolId: string, meshHref: RegExp): void => {
            const sym = (draw.findOne(`#${symbolId}`) as Svg).svg();
            const meshUse = sym.match(new RegExp(`<use[^>]+href="[^"]*${meshHref.source}[^"]*"[^>]*transform="matrix\\([^"]+\\)"`));
            expect(meshUse).to.not.equal(null);
            const meshTail = parseMatrixTail(meshUse![0]);
            expect(meshTail).to.not.equal(null);

            const overlayOuter = sym.match(
                /<g transform="matrix\([^)]+\)"><g transform="matrix\([^)]+\)"><use[^>]+href="#SvgjsSvg/,
            );
            expect(overlayOuter).to.not.equal(null);
            const outerTransform = overlayOuter![0].match(/<g transform="(matrix\([^"]+\))">/);
            expect(outerTransform).to.not.equal(null);
            const overlayTail = parseMatrixTail(outerTransform![1]);
            expect(overlayTail).to.not.equal(null);
            expect(overlayTail!.e).to.be.closeTo(meshTail!.e, 1e-6);
            expect(overlayTail!.f).to.be.closeTo(meshTail!.f, 1e-6);

            const layerUse = sym.match(/<use[^>]+href="#SvgjsSvg[^"]*"[^>]*>/);
            expect(layerUse).to.not.equal(null);
            expect(layerUse![0]).to.match(/\bwidth="100"/);
            expect(layerUse![0]).to.match(/\bheight="100"/);
        };

        assertOverlayMatchesMesh("Cyl", /isoCircle100_Cyl/);
        assertOverlayMatchesMesh("Hex", /isoHex100_Hex/);
    });
});
