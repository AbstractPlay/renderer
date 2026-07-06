/* eslint-disable @typescript-eslint/no-require-imports */
import { expect } from "chai";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { IsometricRenderer } from "../src/renderers/isometric";
import {
    collectEdgeMarkerSegments,
    hexCellPolysFromGrid,
    hexOfCirEdgeSegments,
    isoEdgeMarkerBuffer,
    squaresEdgeSegments,
} from "../src/renderers/isometric/edgeMarkers";
import { mapBoardToScreen, buildIsoProjectionMatrix, resolveIsoProjection } from "../src/renderers/isometric/projection";
import { IRendererOptionsIn } from "../src/renderers/_base";
import { APRenderRep } from "../src/schemas/schema";
import { rectOfRects, hexOfCir } from "../src/grids";
import { hexOfHex } from "../src/grids";
import { Matrix } from "transformation-matrix-js";

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
        labels: "#333",
    },
    showAnnotations: false,
};

describe("iso edge marker geometry", () => {
    it("should place squares edge lines outside the cell grid with stroke buffer", () => {
        const grid = rectOfRects({ gridHeight: 2, gridWidth: 2, cellSize: 50 });
        const buffer = isoEdgeMarkerBuffer(50, 1);
        const north = squaresEdgeSegments("N", grid, buffer);
        expect(north).to.have.length(1);
        expect(north[0].y1).to.equal(grid[0][0].y - buffer);
        expect(north[0].x1).to.equal(grid[0][0].x - buffer);
        expect(north[0].x2).to.equal(grid[0][1].x + buffer);
    });

    it("should ignore invalid diagonal edges on squares boards", () => {
        const grid = rectOfRects({ gridHeight: 2, gridWidth: 2, cellSize: 50 });
        const buffer = isoEdgeMarkerBuffer(50, 1);
        expect(squaresEdgeSegments("NE", grid, buffer)).to.have.length(0);
    });

    it("should trace hex-of-hex outline edges", () => {
        const grid = hexOfHex({ gridWidthMin: 2, gridWidthMax: 4, cellSize: 50 });
        const polys = hexCellPolysFromGrid(grid, 50);
        const segments = collectEdgeMarkerSegments("hex-of-hex", "N", grid, polys, 50, 1);
        expect(segments.length).to.be.greaterThan(0);
    });

    it("should draw a single outside line through terminal circle centres on hex-of-cir", () => {
        const grid = hexOfCir({ gridWidthMin: 2, gridWidthMax: 4, cellSize: 50 });
        const buffer = isoEdgeMarkerBuffer(50, 1);
        const segments = hexOfCirEdgeSegments("NE", grid, buffer);
        expect(segments).to.have.length(1);
        const midrow = Math.floor(grid.length / 2);
        const p1 = grid[0][grid[0].length - 1];
        const p2 = grid[midrow][grid[midrow].length - 1];
        const seg = segments[0];
        const segDx = seg.x2 - seg.x1;
        const segDy = seg.y2 - seg.y1;
        const edgeDx = p2.x - p1.x;
        const edgeDy = p2.y - p1.y;
        expect(Math.abs(segDx * edgeDy - segDy * edgeDx)).to.be.lessThan(1e-6);
        const segMid = { x: (seg.x1 + seg.x2) / 2, y: (seg.y1 + seg.y2) / 2 };
        const edgeMid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        const flat = grid.flat();
        const centre = {
            x: flat.reduce((sum, pt) => sum + pt.x, 0) / flat.length,
            y: flat.reduce((sum, pt) => sum + pt.y, 0) / flat.length,
        };
        const edgeDist = Math.hypot(edgeMid.x - centre.x, edgeMid.y - centre.y);
        const segDist = Math.hypot(segMid.x - centre.x, segMid.y - centre.y);
        expect(segDist).to.be.greaterThan(edgeDist);
    });
});

describe("IsometricRenderer edge markers", () => {
    const edgeSquaresRep = (): APRenderRep => ({
        renderer: "isometric",
        board: {
            style: "squares",
            width: 3,
            height: 3,
            markers: [
                { type: "edge", edge: "N", colour: 1 },
                { type: "edge", edge: "S", colour: 2 },
                { type: "edge", edge: "E", colour: 3 },
                { type: "edge", edge: "W", colour: 4 },
            ],
        },
        legend: {
            X: { piece: "cube", height: 20, colour: "#c0392b" },
        },
        pieces: [
            [[{ glyph: "X" }], [], []],
            [[], [], []],
            [[], [], []],
        ],
    });

    it("should render projected edge marker lines on squares boards", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        renderer.render(edgeSquaresRep(), draw, baseOptions);

        const group = draw.findOne("#edge-markers");
        expect(group).to.not.equal(null);
        const lines = group!.find("line");
        expect(lines.length).to.equal(4);
        lines.forEach((line) => {
            expect(line.attr("stroke-width")).to.equal(3);
        });
    });

    it("should draw edge markers above labels in the paint stack", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        renderer.render(edgeSquaresRep(), draw, baseOptions);

        const board = draw.findOne("#board")!;
        const children = board.children().map((c) => c.id());
        const edgeIdx = children.indexOf("edge-markers");
        const labelIdx = children.indexOf("labels");
        expect(edgeIdx).to.be.greaterThan(-1);
        expect(labelIdx).to.be.greaterThan(-1);
        expect(edgeIdx).to.be.greaterThan(labelIdx);
    });

    it("should project edge lines through the isometric transform", () => {
        const grid = rectOfRects({ gridHeight: 2, gridWidth: 2, cellSize: 50 });
        const buffer = isoEdgeMarkerBuffer(50, 1);
        const north = squaresEdgeSegments("N", grid, buffer)[0];
        const tFinal = buildIsoProjectionMatrix(resolveIsoProjection("iso"));
        const tUserRotate = new Matrix();
        const from = mapBoardToScreen(north.x1, north.y1, tUserRotate, tFinal);
        const to = mapBoardToScreen(north.x2, north.y2, tUserRotate, tFinal);
        expect(from.x).to.not.equal(north.x1);
        expect(to.x).to.not.equal(north.x2);
        expect(from.y).to.not.equal(to.y);
    });

    it("should render edge markers on hex-of-hex boards", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        const rep: APRenderRep = {
            renderer: "isometric",
            board: {
                style: "hex-of-hex",
                minWidth: 2,
                maxWidth: 4,
                markers: [{ type: "edge", edge: "N", colour: "#ff0000" }],
            },
            legend: {
                X: { piece: "hexp", height: 30, colour: 1 },
            },
            pieces: [[["X"]]],
        };
        renderer.render(rep, draw, baseOptions);
        const lines = draw.find("#edge-markers line");
        expect(lines.length).to.be.greaterThan(0);
    });

    it("should render edge markers on hex-of-cir boards", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        const rep: APRenderRep = {
            renderer: "isometric",
            board: {
                style: "hex-of-cir",
                minWidth: 2,
                maxWidth: 4,
                markers: [{ type: "edge", edge: "NE", colour: "#00ff00" }],
            },
            legend: {
                X: { piece: "cylinder", height: 20, colour: 1 },
            },
            pieces: [[["X"]]],
        };
        renderer.render(rep, draw, baseOptions);
        const lines = draw.find("#edge-markers line");
        expect(lines.length).to.equal(1);
    });
});
