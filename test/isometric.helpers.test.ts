import { expect } from "chai";
import { Matrix } from "transformation-matrix-js";
import { compareCellSortKeys, computeCellSortKey, ISO_SORT_EPSILON } from "../src/renderers/isometric/cellSort";
import { piecesRowWidth, parseIsoPiecesString } from "../src/renderers/isometric/piecesGrid";
import { buildIsoProjectionMatrix, isoLabelTransform, mapBoardToScreen } from "../src/renderers/isometric/projection";
import { rectOfRects } from "../src/grids";

describe("isometric projection helpers", () => {
    it("should map board-local coordinates through user rotation and isometric projection", () => {
        const tFinal = buildIsoProjectionMatrix();
        const tUserRotate = new Matrix().rotate(Math.PI / 2);
        const p = mapBoardToScreen(50, 0, tUserRotate, tFinal);
        expect(p.x).to.be.a("number");
        expect(p.y).to.be.a("number");
    });

    it("should produce a non-identity label affine for off-origin anchors", () => {
        const tFinal = buildIsoProjectionMatrix();
        const affine = isoLabelTransform(50, 25, new Matrix(), tFinal);
        expect(affine.a).to.not.equal(0);
        expect(affine.d).to.not.equal(0);
        expect(affine.e).to.be.a("number");
        expect(affine.f).to.be.a("number");
    });
});

describe("isometric pieces grid helpers", () => {
    it("should derive row width from the board grid when width is absent", () => {
        const grid = rectOfRects({ gridHeight: 5, gridWidth: 3, cellSize: 50 });
        expect(piecesRowWidth(0, grid, undefined)).to.equal(3);
        expect(piecesRowWidth(2, grid, undefined)).to.equal(3);
    });

    it("should expand underscore rows using per-row grid widths", () => {
        const grid = rectOfRects({ gridHeight: 3, gridWidth: 4, cellSize: 50 });
        const pieces = parseIsoPiecesString("A,,,\n_\n,,,", grid, undefined);
        expect(pieces.length).to.equal(3);
        expect(pieces[0].length).to.equal(4);
        expect(pieces[1].length).to.equal(4);
        expect(pieces[1].every((cell) => cell.length === 0)).to.equal(true);
    });
});

describe("isometric cell sort helpers", () => {
    it("should prefer exact depth ordering over rounded screen ties", () => {
        const a = { depth: 100, topY: 50.0001, rotatedX: 0, row: 2, col: 0 };
        const b = { depth: 100.5, topY: 50, rotatedX: 50, row: 1, col: 1 };
        expect(compareCellSortKeys(a, b)).to.be.lessThan(0);
    });

    it("should treat near-equal depths as ties within epsilon", () => {
        const a = { depth: 100, topY: 50, rotatedX: 0, row: 0, col: 0 };
        const b = { depth: 100 + ISO_SORT_EPSILON / 2, topY: 60, rotatedX: 0, row: 1, col: 0 };
        expect(compareCellSortKeys(a, b)).to.equal(-10);
    });

    it("should rank deeper stacks earlier at the same ground depth", () => {
        const grid = rectOfRects({ gridHeight: 3, gridWidth: 3, cellSize: 50 });
        const boardLocalGrid = grid.map((row) => row.map((pt) => ({ x: pt.x, y: pt.y })));
        const tFinal = buildIsoProjectionMatrix();
        const entry = (row: number, col: number) => {
            const p = tFinal.applyToPoint(grid[row][col].x, grid[row][col].y);
            return { row, col, x: p.x, y: p.y };
        };
        const shallow = computeCellSortKey({
            entry: entry(0, 2),
            cellsize: 50,
            boardLocalGrid,
            tUserRotate: new Matrix(),
            heightmap: undefined,
            pieces: [[[], [], [{ glyph: "X" }]], [], []],
            legend: undefined,
            basePcScale: 1,
            boardRotation: 0,
            rootSvg: { findOne: () => null } as never,
        });
        const deep = computeCellSortKey({
            entry: entry(0, 2),
            cellsize: 50,
            boardLocalGrid,
            tUserRotate: new Matrix(),
            heightmap: undefined,
            pieces: [[[], [], [{ glyph: "X" }, { glyph: "X" }, { glyph: "X" }, { glyph: "X" }]], [], []],
            legend: undefined,
            basePcScale: 1,
            boardRotation: 0,
            rootSvg: { findOne: () => null } as never,
        });
        expect(deep.depth).to.be.lessThan(shallow.depth);
    });
});
