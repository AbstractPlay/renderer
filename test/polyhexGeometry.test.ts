import { expect } from "chai";
import "mocha";
import {
    polyhexOfHexCenterGrid,
    polyhexOfHexCellPolygon,
    polyhexOfHexExteriorEdges,
    polyhexOfHexExteriorSegments,
    chainExteriorSegmentsToPathD,
    polyhexOfHexIconBounds,
} from "../src/common/polyhexGeometry.js";
import type { Polymatrix } from "../src/schemas/schema.js";

function cornerSet(pts: { x: number; y: number }[]): Set<string> {
    return new Set(pts.map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`));
}

describe("polyhexOfHex geometry", () => {
    it("places horizontally adjacent cells flush (shared corners)", () => {
        const matrix: Polymatrix = [[1, 1]];
        const cellSize = 50;
        const grid = polyhexOfHexCenterGrid(matrix, cellSize);
        const left = polyhexOfHexCellPolygon(grid, 0, 0, cellSize);
        const right = polyhexOfHexCellPolygon(grid, 1, 0, cellSize);
        expect(left).to.not.equal(undefined);
        expect(right).to.not.equal(undefined);
        const leftCorners = cornerSet(left!);
        const shared = [...cornerSet(right!)].filter((c) => leftCorners.has(c));
        expect(shared.length).to.be.greaterThan(1);
    });

    it("polyhexOfHexExteriorEdges omits geometrically shared edges", () => {
        const matrix: Polymatrix = [[1, 1]];
        const cellSize = 50;
        const grid = polyhexOfHexCenterGrid(matrix, cellSize);
        const extLeft = polyhexOfHexExteriorEdges(matrix, grid, 0, 0, cellSize);
        const extRight = polyhexOfHexExteriorEdges(matrix, grid, 1, 0, cellSize);
        expect(extLeft).to.not.include(1);
        expect(extRight).to.not.include(4);
    });

    it("chains staging tromino exterior into one closed path", () => {
        const matrix: Polymatrix = [
            [{ fill: 1 }, { fill: 1 }],
            [{ fill: 1 }, 0],
        ];
        const cellSize = 50;
        const grid = polyhexOfHexCenterGrid(matrix, cellSize);
        const box = polyhexOfHexIconBounds(matrix, cellSize);
        const segs = polyhexOfHexExteriorSegments(matrix, grid, cellSize);
        expect(segs.length).to.be.greaterThan(5);
        const paths = chainExteriorSegmentsToPathD(segs, box.minX, box.minY);
        expect(paths).to.have.length(1);
        expect(paths[0]).to.match(/Z$/);
    });
});