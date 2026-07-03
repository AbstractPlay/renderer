/* eslint-disable @typescript-eslint/no-require-imports */
import { expect } from "chai";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { IsometricRenderer } from "../src/renderers/isometric";
import { isoShadeFace, isoDepthModulate } from "../src/renderers/isometric/shading";
import { SHADOW_OPACITY } from "../src/renderers/isometric/shadow";
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

const boardUseIndices = (draw: Svg, symbolId: string): number[] => {
    const indices: number[] = [];
    draw.find("#board use").forEach((use, index) => {
        const href = (use.attr("href") ?? use.attr("xlink:href")) as string | undefined;
        if (href === `#${symbolId}` || href?.startsWith(`#${symbolId}__db`)) {
            indices.push(index);
        }
    });
    return indices;
};

describe("IsometricRenderer depth sorting", () => {
    // Anti-diagonal cells (0,2) and (2,0) share the same rounded screen Y on a
    // squares board at rotation 0. The old sort tied on Math.round(y) and ordered
    // by screen X, painting the NE stack over the SW front cell.
    it("should paint the SW front cell over a tall NE stack on a 3x3 board", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 3, height: 3 },
            legend: {
                B: { piece: "cube", height: 30, colour: "#2980b9" },
                F: { piece: "cube", height: 30, colour: "#e74c3c" },
            },
            pieces: [
                [[], [], [{ glyph: "B" }, { glyph: "B" }, { glyph: "B" }, { glyph: "B" }, { glyph: "B" }, { glyph: "B" }]],
                [[], [], []],
                [[{ glyph: "F" }], [], []],
            ],
        };
        renderer.render(rep, draw, baseOptions);

        const backStack = boardUseIndices(draw, "B");
        const front = boardUseIndices(draw, "F");
        expect(backStack.length).to.equal(6);
        expect(front.length).to.equal(1);
        expect(front[0]).to.be.greaterThan(Math.max(...backStack));
    });

    it("should paint the SW front cell over a tall NE stack on a 4x4 board", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 4, height: 4 },
            legend: {
                B: { piece: "cube", height: 30, colour: "#2980b9" },
                F: { piece: "cube", height: 30, colour: "#e74c3c" },
            },
            pieces: [
                [[], [], [{ glyph: "B" }, { glyph: "B" }, { glyph: "B" }, { glyph: "B" }, { glyph: "B" }, { glyph: "B" }], []],
                [[], [], [], []],
                [[{ glyph: "F" }], [], [], []],
                [[], [], [], []],
            ],
        };
        renderer.render(rep, draw, baseOptions);

        const backStack = boardUseIndices(draw, "B");
        const front = boardUseIndices(draw, "F");
        expect(backStack.length).to.equal(6);
        expect(front.length).to.equal(1);
        expect(front[0]).to.be.greaterThan(Math.max(...backStack));
    });
});

describe("IsometricRenderer pieces string", () => {
    it("should expand underscore rows to the correct width on hex-of-cir boards", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        const emptyRow = (width: number): string => ",".repeat(width - 1);
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "hex-of-cir", minWidth: 3, maxWidth: 5 },
            legend: {
                R: { piece: "cylinder", height: 30, colour: "#c0392b" },
            },
            pieces: ["R,,", "_", emptyRow(5), emptyRow(4), emptyRow(3)].join("\n"),
        };
        renderer.render(rep, draw, baseOptions);

        const uses = boardUseIndices(draw, "R");
        expect(uses.length).to.equal(1);
    });
});

describe("IsometricRenderer heightmap", () => {
    it("should generate a surface symbol for each distinct heightmap value", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        const rep: APRenderRep = {
            renderer: "isometric",
            board: {
                style: "squares",
                width: 2,
                height: 2,
                heightmap: [[0, 30], [30, 0]],
            },
            legend: {
                X: { piece: "cube", height: 30, colour: "#c0392b" },
            },
            pieces: null,
        };
        renderer.render(rep, draw, baseOptions);

        expect(draw.findOne("#_surface_0")).to.not.equal(null);
        expect(draw.findOne("#_surface_30")).to.not.equal(null);
    });

    it("should render height-0 board surfaces flat without side faces", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 2, height: 2, heightmap: [[0, 30], [30, 0]] },
            legend: { X: { piece: "cube", height: 30, colour: "#c0392b" } },
            pieces: null,
        };
        renderer.render(rep, draw, baseOptions);

        expect(draw.findOne("#isoRectSide100__surface_0")).to.equal(null);
        expect(draw.findOne("#isoRectSide100__surface_0_L")).to.equal(null);
    });
});

describe("IsometricRenderer swap-labels", () => {
    it("should swap letters and numbers on squares boards", () => {
        const drawDefault = makeDraw();
        const drawSwapped = makeDraw();
        const renderer = new IsometricRenderer();
        const rep = squaresLabelRep(["swap-labels"]);
        renderer.render(squaresLabelRep(), drawDefault, baseOptions);
        renderer.render(rep, drawSwapped, baseOptions);

        const defaultTexts = labelTexts(drawDefault);
        const swappedTexts = labelTexts(drawSwapped);
        expect(defaultTexts).to.include("a");
        expect(swappedTexts).to.include("1");
        expect(swappedTexts).to.include("2");
    });
});

describe("IsometricRenderer lintel pieces", () => {
    it("should render lintel pieces when the board is rotated", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 2, height: 2 },
            legend: {
                L: { piece: "lintelN", height: 30, colour: "#8e44ad" },
            },
            pieces: [
                [[{ glyph: "L" }], []],
                [[], []],
            ],
        };
        renderer.render(rep, draw, { ...baseOptions, rotate: 90 });
        expect(draw.findOne("#L")).to.not.equal(null);
        expect(draw.find("#board use").length).to.be.greaterThan(0);
    });
});

describe("IsometricRenderer depth cues", () => {
    const symbolLineStrokeWidth = (draw: Svg, symbolId: string): number => {
        const symbol = draw.findOne(`#${symbolId}`) as Svg;
        const lines = symbol.find("line");
        expect(lines.length).to.be.greaterThan(0);
        return parseFloat((lines[0] as Svg).attr("stroke-width") as string);
    };

    const rectFill = (draw: Svg, rectId: string): string => {
        const rect = draw.findOne(`#${rectId}`) as Svg;
        expect(rect).to.not.equal(null);
        return (rect.fill() as string).toLowerCase();
    };

    it("should use thicker strokes on pieces than on terrain surfaces", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        const rep: APRenderRep = {
            renderer: "isometric",
            board: {
                style: "squares",
                width: 2,
                height: 2,
                strokeWeight: 2,
                heightmap: [[30, 0], [0, 0]],
            },
            legend: { R: { piece: "cube", height: 30, colour: "#c0392b" } },
            pieces: [[[{ glyph: "R" }], []], [[], []]],
        };
        renderer.render(rep, draw, baseOptions);

        const pieceStroke = symbolLineStrokeWidth(draw, "R");
        const surfaceStroke = symbolLineStrokeWidth(draw, "_surface_30");
        // expect(pieceStroke).to.equal(3);
        // expect(surfaceStroke).to.equal(2);
        expect(pieceStroke).to.be.greaterThan(surfaceStroke);
    });

    it("should shade single-colour cube faces with fixed upper-left light", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        const base = "#c0392b";
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 1, height: 1 },
            legend: { R: { piece: "cube", height: 30, colour: base } },
            pieces: [[[{ glyph: "R" }]]],
        };
        renderer.render(rep, draw, baseOptions);

        expect(rectFill(draw, "isoRectSide30_R_L")).to.equal(isoShadeFace(base, "left").toLowerCase());
        expect(rectFill(draw, "isoRectSide30_R_R")).to.equal(isoShadeFace(base, "right").toLowerCase());
    });

    it("should apply tone shading on top of multi-face cube colours", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        renderer.render(multiFaceRenderRep(), draw, baseOptions);

        expect(rectFill(draw, "isoRectSide30_D1__y0_L")).to.equal(isoShadeFace("#ffff00", "left").toLowerCase());
        expect(rectFill(draw, "isoRectSide30_D1__y0_R")).to.equal(isoShadeFace("#0000ff", "right").toLowerCase());
    });

    it("should keep screen-left face at base colour when the board is rotated", () => {
        const draw0 = makeDraw();
        const draw90 = makeDraw();
        const renderer = new IsometricRenderer();
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 2, height: 2 },
            legend: { R: { piece: "cube", height: 30, colour: "#c0392b" } },
            pieces: [[[{ glyph: "R" }], []], [[], []]],
        };
        renderer.render(rep, draw0, { ...baseOptions, rotate: 0 });
        renderer.render(rep, draw90, { ...baseOptions, rotate: 90 });

        const base = "#c0392b";
        expect(rectFill(draw0, "isoRectSide30_R_L")).to.equal(isoShadeFace(base, "left").toLowerCase());
        expect(rectFill(draw90, "isoRectSide30_R_L")).to.equal(isoShadeFace(base, "left").toLowerCase());
    });

    it("should render contact shadows under board pieces", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 2, height: 2 },
            legend: { R: { piece: "cube", height: 30, colour: "#c0392b" } },
            pieces: [[[{ glyph: "R" }], []], [[], []]],
        };
        renderer.render(rep, draw, baseOptions);

        const board = draw.findOne("#board") as Svg;
        expect(board.find("ellipse").length).to.be.greaterThan(0);
    });

    it("should omit contact shadows when no-piece-shadow is set", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        const rep: APRenderRep = {
            renderer: "isometric",
            options: ["no-piece-shadow"],
            board: { style: "squares", width: 2, height: 2 },
            legend: { R: { piece: "cube", height: 30, colour: "#c0392b" } },
            pieces: [[[{ glyph: "R" }], []], [[], []]],
        };
        renderer.render(rep, draw, baseOptions);

        const board = draw.findOne("#board") as Svg;
        expect(board.find("ellipse").length).to.equal(0);
    });

    it("should not add contact shadows to the key", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        renderer.render(keyRenderRep(), draw, baseOptions);

        const key = draw.findOne("#_key") as Svg;
        expect(key.find("ellipse").length).to.equal(0);
    });

    it("should shade the cylinder barrel with a left-to-right gradient", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        const base = "#0000ff";
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "hex-of-cir", minWidth: 3, maxWidth: 5 },
            legend: { B: { piece: "cylinder", height: 30, colour: base } },
            pieces: ["B,,", "_", "_"].join("\n"),
        };
        renderer.render(rep, draw, baseOptions);

        const symbol = draw.findOne("#B") as Svg;
        expect(symbol.find("path").length).to.equal(1);
        const grad = draw.findOne("#isoCylBarrel_B");
        expect(grad).to.not.equal(null);
    });

    it("should render stronger contact shadows on board pieces", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 2, height: 2 },
            legend: { R: { piece: "cube", height: 30, colour: "#c0392b" } },
            pieces: [[[{ glyph: "R" }], []], [[], []]],
        };
        renderer.render(rep, draw, baseOptions);

        const board = draw.findOne("#board") as Svg;
        const shadow = board.find("ellipse")[0] as Svg;
        expect(shadow).to.not.equal(undefined);
        expect(parseFloat(shadow.attr("fill-opacity") as string)).to.equal(SHADOW_OPACITY);
    });

    it("should draw cell footprints under occupied cells", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 2, height: 2 },
            legend: { R: { piece: "cube", height: 30, colour: "#c0392b" } },
            pieces: [[[{ glyph: "R" }], []], [[], []]],
        };
        renderer.render(rep, draw, baseOptions);

        const board = draw.findOne("#board") as Svg;
        expect(board.find("polygon").length).to.be.greaterThan(0);
    });

    it("should omit cell footprints when no-iso-cell-footprint is set", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        const rep: APRenderRep = {
            renderer: "isometric",
            options: ["no-iso-cell-footprint"],
            board: { style: "squares", width: 2, height: 2 },
            legend: { R: { piece: "cube", height: 30, colour: "#c0392b" } },
            pieces: [[[{ glyph: "R" }], []], [[], []]],
        };
        renderer.render(rep, draw, baseOptions);

        const board = draw.findOne("#board") as Svg;
        expect(board.find("polygon").length).to.equal(0);
    });

    it("should generate depth-shaded piece symbols for board placement", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 2, height: 2 },
            legend: { R: { piece: "cube", height: 30, colour: "#c0392b" } },
            pieces: [
                [[{ glyph: "R" }], []],
                [[], [{ glyph: "R" }]],
            ],
        };
        renderer.render(rep, draw, baseOptions);

        const depthSymbols = draw.find("[id^='R__db']");
        expect(depthSymbols.length).to.be.greaterThan(0);
        const hrefs = draw.find("#board use").map((u) => (u.attr("href") ?? u.attr("xlink:href")) as string);
        expect(hrefs.some((h) => h.includes("__db"))).to.equal(true);
    });

    it("should use distinct depth shading between front and back cells", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        const base = "#c0392b";
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "squares", width: 2, height: 2 },
            legend: { R: { piece: "cube", height: 30, colour: base } },
            pieces: [
                [[{ glyph: "R" }], []],
                [[], [{ glyph: "R" }]],
            ],
        };
        renderer.render(rep, draw, baseOptions);

        const backFill = rectFill(draw, "isoRectSide30_R__db0_L");
        const frontFill = rectFill(draw, "isoRectSide30_R__db7_L");
        expect(backFill).to.not.equal(frontFill);
        expect(backFill).to.equal(isoDepthModulate(isoShadeFace(base, "left"), 0).toLowerCase());
        expect(frontFill).to.equal(isoDepthModulate(isoShadeFace(base, "left"), 1).toLowerCase());
    });

    it("should omit depth-shaded symbols when no-iso-depth-shade is set", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        const rep: APRenderRep = {
            renderer: "isometric",
            options: ["no-iso-depth-shade"],
            board: { style: "squares", width: 2, height: 2 },
            legend: { R: { piece: "cube", height: 30, colour: "#c0392b" } },
            pieces: [
                [[{ glyph: "R" }], []],
                [[], [{ glyph: "R" }]],
            ],
        };
        renderer.render(rep, draw, baseOptions);

        expect(draw.find("[id^='R__db']").length).to.equal(0);
        const hrefs = draw.find("#board use").map((u) => (u.attr("href") ?? u.attr("xlink:href")) as string);
        expect(hrefs.some((h) => h.includes("R__db"))).to.equal(false);
    });
});
