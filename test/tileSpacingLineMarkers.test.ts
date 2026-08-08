/* eslint-disable @typescript-eslint/no-require-imports */
import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { DefaultRenderer } from "../src/renderers/default";
import { IRendererOptionsIn } from "../src/renderers/_base";
import { APRenderRep } from "../src/schemas/schema";
import { expandSquareGrid, rectOfRects, tileCornerXY } from "../src/grids";

const { createSVGWindow } = require("svgdom");

const CELL = 50;
const TILE = 3;
const GAP = 1;

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

const spacedBoardBase = () => ({
    style: "squares" as const,
    width: 9,
    height: 9,
    tileWidth: TILE,
    tileHeight: TILE,
    tileSpacing: GAP,
});

/** Macro-corner lines around tile (0,1) — top row, middle minigrid. */
const macroTile01OutlineFixture = (): APRenderRep => ({
    board: {
        ...spacedBoardBase(),
        markers: [
            { type: "flood", colour: 1, belowGrid: true, points: [{ row: 1, col: 5 }] },
            { type: "line", colour: 1, width: 5, points: [{ row: 0, col: 0 }, { row: 0, col: 3 }] },
            { type: "line", colour: 1, width: 5, points: [{ row: 0, col: 3 }, { row: 0, col: 6 }] },
            { type: "line", colour: 1, width: 5, points: [{ row: 3, col: 3 }, { row: 3, col: 6 }] },
            { type: "line", colour: 1, width: 5, points: [{ row: 0, col: 3 }, { row: 3, col: 3 }] },
            { type: "line", colour: 1, width: 5, points: [{ row: 0, col: 6 }, { row: 3, col: 6 }] },
        ],
    },
    legend: { P: { name: "piece", colour: 1 } },
    pieces: "---------\n".repeat(9).trimEnd(),
});

/** Tile-corner coordinates around tile (1,1) — centre minigrid, flood at (4,4). */
const tileCornerCenterFixture = (): APRenderRep => ({
    board: {
        ...spacedBoardBase(),
        markers: [
            { type: "flood", colour: 1, belowGrid: true, points: [{ row: 4, col: 4 }] },
            { type: "line", colour: 1, width: 5, points: [{ tileRow: 1, tileCol: 1, corner: "nw" }, { tileRow: 1, tileCol: 1, corner: "ne" }] },
            { type: "line", colour: 1, width: 5, points: [{ tileRow: 1, tileCol: 1, corner: "sw" }, { tileRow: 1, tileCol: 1, corner: "se" }] },
            { type: "line", colour: 1, width: 5, points: [{ tileRow: 1, tileCol: 1, corner: "nw" }, { tileRow: 1, tileCol: 1, corner: "sw" }] },
            { type: "line", colour: 1, width: 5, points: [{ tileRow: 1, tileCol: 1, corner: "ne" }, { tileRow: 1, tileCol: 1, corner: "se" }] },
        ],
    },
    legend: { P: { name: "piece", colour: 1 } },
    pieces: "---------\n".repeat(9).trimEnd(),
});

const buildSpacedPolys = () => {
    const grid = rectOfRects({
        gridHeight: 9,
        gridWidth: 9,
        cellSize: CELL,
        tileHeight: TILE,
        tileWidth: TILE,
        tileSpacing: GAP,
    });
    const polys = [];
    for (let y = 0; y < 9; y++) {
        const rowPolys = [];
        for (let x = 0; x < 9; x++) {
            const { x: cx, y: cy } = grid[y][x];
            const half = CELL / 2;
            rowPolys.push({
                type: "poly" as const,
                points: [
                    { x: cx - half, y: cy - half },
                    { x: cx + half, y: cy - half },
                    { x: cx + half, y: cy + half },
                    { x: cx - half, y: cy + half },
                ],
            });
        }
        polys.push(rowPolys);
    }
    return polys;
};

const parsePoints = (pointsAttr: string): { x: number; y: number }[] =>
    pointsAttr.trim().split(/\s+/).map((pair) => {
        const [x, y] = pair.split(",").map(Number);
        return { x: x!, y: y! };
    });

const polygonBounds = (pointsAttr: string) => {
    const pts = parsePoints(pointsAttr);
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    return {
        left: Math.min(...xs),
        right: Math.max(...xs),
        top: Math.min(...ys),
        bottom: Math.max(...ys),
    };
};

const findHorizontalLine = (draw: Svg, y: number, x1: number, x2: number) =>
    draw.findOne(`#gridlines line[x1='${x1}'][y1='${y}'][x2='${x2}'][y2='${y}']`);

describe("expandSquareGrid", () => {
    it("should match unspaced corners when tileSpacing is zero", () => {
        const expanded = expandSquareGrid(9, 9, CELL, TILE, TILE, 0);
        const legacy = rectOfRects({ gridHeight: 10, gridWidth: 10, cellSize: CELL })
            .map((row) => row.map((cell) => ({ x: cell.x - CELL / 2, y: cell.y - CELL / 2 })));
        expect(expanded[0][3].x).to.equal(legacy[0][3].x);
        expect(expanded[0][6].x).to.equal(legacy[0][6].x);
    });

    it("should offset tile-boundary corners by cumulative gap width", () => {
        const expanded = expandSquareGrid(9, 9, CELL, TILE, TILE, GAP);
        const gapPx = GAP * CELL;
        expect(expanded[0][0].x).to.equal(-CELL / 2);
        expect(expanded[0][3].x).to.equal(3 * CELL - CELL / 2);
        expect(expanded[0][6].x).to.equal(6 * CELL - CELL / 2 + gapPx);
        expect(expanded[0][9].x).to.equal(9 * CELL - CELL / 2 + 2 * gapPx);
    });
});

describe("tileSpacing line markers", () => {
    it("should keep macro-corner lines on the legacy unspaced corner grid (backward compatible)", () => {
        const expanded = expandSquareGrid(9, 9, CELL, TILE, TILE, 0);
        const y = expanded[0][3].y;
        const xWest = expanded[0][3].x;
        const xEast = expanded[0][6].x;

        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(macroTile01OutlineFixture(), draw, baseOptions);

        const tile01Top = findHorizontalLine(draw, y, xWest, xEast);
        expect(tile01Top).to.not.equal(null);
    });

    it("should draw a tight box around tile (1,1) using tile-corner coordinates", () => {
        const polys = buildSpacedPolys();
        const [leftX] = tileCornerXY(polys, 1, 1, "nw", TILE, TILE, GAP);
        const [rightX] = tileCornerXY(polys, 1, 1, "ne", TILE, TILE, GAP);
        const [, topY] = tileCornerXY(polys, 1, 1, "nw", TILE, TILE, GAP);
        const [, bottomY] = tileCornerXY(polys, 1, 1, "sw", TILE, TILE, GAP);

        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(tileCornerCenterFixture(), draw, baseOptions);

        expect(findHorizontalLine(draw, topY, leftX, rightX)).to.not.equal(null);
        expect(findHorizontalLine(draw, bottomY, leftX, rightX)).to.not.equal(null);

        const gridlines = draw.findOne("#gridlines");
        const floods = gridlines!.find("polygon").filter((el) => el.attr("fill") !== "none");
        const floodBox = polygonBounds(floods[0]!.attr("points") as string);

        expect(floodBox.left).to.be.at.least(leftX);
        expect(floodBox.right).to.be.at.most(rightX);
        expect(floodBox.top).to.be.at.least(topY);
        expect(floodBox.bottom).to.be.at.most(bottomY);
    });

    it("should keep tile (0,0) top edge unchanged when spacing is added", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(macroTile01OutlineFixture(), draw, baseOptions);

        const tile00Top = findHorizontalLine(draw, -25, -25, 125);
        expect(tile00Top).to.not.equal(null);
    });

    it("should render a scribe-style spaced board with macro line corners without error", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        const rep: APRenderRep = {
            board: {
                ...spacedBoardBase(),
                markers: [
                    { type: "flood", colour: 1, belowGrid: true, points: [{ row: 0, col: 0 }] },
                    { type: "flood", colour: 2, belowGrid: true, points: [{ row: 4, col: 4 }] },
                    { type: "line", colour: 1, width: 5, points: [{ row: 0, col: 0 }, { row: 0, col: 3 }] },
                    { type: "line", colour: 1, width: 5, points: [{ row: 0, col: 3 }, { row: 0, col: 6 }] },
                    { type: "line", colour: 2, width: 5, points: [{ row: 0, col: 6 }, { row: 0, col: 9 }] },
                    { type: "line", colour: 1, width: 5, points: [{ row: 0, col: 3 }, { row: 3, col: 3 }] },
                    { type: "line", colour: 1, width: 5, points: [{ row: 6, col: 0 }, { row: 6, col: 3 }] },
                    { type: "line", colour: 1, width: 5, points: [{ row: 6, col: 0 }, { row: 9, col: 0 }] },
                    { type: "line", colour: 2, width: 5, points: [{ row: 6, col: 3 }, { row: 9, col: 3 }] },
                    { type: "line", colour: 2, width: 5, points: [{ row: 9, col: 0 }, { row: 9, col: 3 }] },
                ],
            },
            legend: {},
            pieces: "---------\n".repeat(9).trimEnd(),
        };
        expect(() => renderer.render(rep, draw, baseOptions)).to.not.throw();
        const lines = draw.find("#gridlines line");
        expect(lines.length).to.be.greaterThan(0);
        for (const line of lines) {
            const x1 = Number(line.attr("x1"));
            const y1 = Number(line.attr("y1"));
            const x2 = Number(line.attr("x2"));
            const y2 = Number(line.attr("y2"));
            expect(x1 === x2 || y1 === y2).to.equal(true);
        }
    });

    it("should keep garden-style row/col label markers on the legacy unspaced corner grid", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        const rep: APRenderRep = {
            options: ["hide-labels"],
            board: {
                style: "squares",
                width: 8,
                height: 8,
                tileWidth: 4,
                tileHeight: 4,
                tileSpacing: 1.25,
                markers: [
                    { type: "label", label: "Placed", points: [{ col: 0, row: 4 }, { col: 4, row: 4 }], size: 15, nudge: { dx: 0, dy: 0.1 } },
                    { type: "label", label: "Flipped", points: [{ col: 4, row: 4 }, { col: 8, row: 4 }], size: 15, nudge: { dx: 1.25, dy: 0.1 } },
                    { type: "label", label: "Scored", points: [{ col: 0, row: 5 }, { col: 4, row: 5 }], size: 15, nudge: { dx: 0, dy: -0.1 } },
                    { type: "label", label: "Current", points: [{ col: 4, row: 5 }, { col: 8, row: 5 }], size: 15, nudge: { dx: 1.25, dy: -0.1 } },
                ],
            },
            legend: { B: { name: "piece", colour: "#000", opacity: 0.5 }, W: { name: "piece", colour: "#fff" } },
            pieces: "WBWWWBWW\nBW--BW--\nWBBWWWBB\nWWBBWWWB\nWBWWWBWW\nBW--BW--\nWWBBWWBB\nWWWBWWWB\n",
        };
        renderer.render(rep, draw, baseOptions);

        const paths = draw.find("path");
        const placed = paths.find((p) => p.attr("d") === "M-25,180 L175,180");
        const flipped = paths.find((p) => p.attr("d") === "M237.5,180 L437.5,180");
        const scored = paths.find((p) => p.attr("d") === "M-25,220 L175,220");
        const current = paths.find((p) => p.attr("d") === "M237.5,220 L437.5,220");
        expect(placed).to.not.equal(undefined);
        expect(flipped).to.not.equal(undefined);
        expect(scored).to.not.equal(undefined);
        expect(current).to.not.equal(undefined);
    });
});
