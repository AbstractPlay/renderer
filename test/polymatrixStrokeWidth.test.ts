import { expect } from "chai";
import "mocha";
import { defineHex, Grid, Orientation, rectangle } from "honeycomb-grid";
import { polyhexOfHexIconBounds } from "../src/common/polyhexGeometry.js";
import { polymatrixExteriorStrokeWidth } from "../src/common/polymatrix.js";
import type { Polymatrix } from "../src/schemas/schema.js";

const trominoL: Polymatrix = [
    [0, 1],
    [1, 1],
];

function honeycombLayoutBox(matrix: Polymatrix, cellsize: number): { width: number; height: number } {
    const g = new Grid(
        defineHex({ orientation: Orientation.POINTY, offset: 1, dimensions: cellsize }),
        rectangle({ width: matrix[0]?.length ?? 1, height: matrix.length }),
    );
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let y = 0; y < matrix.length; y++) {
        const row = matrix[y];
        if (row === undefined) {
            continue;
        }
        for (let x = 0; x < row.length; x++) {
            if (row[x] === 0 || row[x] === null) {
                continue;
            }
            const h = g.getHex({ col: x, row: y });
            for (const c of h.corners) {
                minX = Math.min(minX, c.x);
                minY = Math.min(minY, c.y);
                maxX = Math.max(maxX, c.x);
                maxY = Math.max(maxY, c.y);
            }
        }
    }
    return { width: maxX - minX, height: maxY - minY };
}

describe("polymatrixExteriorStrokeWidth", () => {
    it("matches hex-of-hex and honeycomb A3 after legend viewBox normalization", () => {
        const cs = 50;
        const honeyBox = honeycombLayoutBox(trominoL, cs);
        const hofBox = polyhexOfHexIconBounds(trominoL, cs);
        const honeyW = polymatrixExteriorStrokeWidth(trominoL, honeyBox, cs, 1);
        const hofW = polymatrixExteriorStrokeWidth(trominoL, hofBox, cs, 1);
        const honeyPerView = honeyW / Math.max(honeyBox.width, honeyBox.height);
        const hofPerView = hofW / Math.max(hofBox.width, hofBox.height);
        expect(honeyPerView).to.be.closeTo(hofPerView, 0.02);
    });
});