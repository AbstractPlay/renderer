import { expect } from "chai";
import "mocha";
import { defineHex, Grid, Orientation, rectangle, type Hex } from "honeycomb-grid";
import {
    chainExteriorSegmentsToPathD,
    polymatrixCellExteriorEdgeIndices,
    polymatrixExteriorSegmentsFromPolygons,
} from "../src/common/polyhexGeometry.js";
import type { Polymatrix } from "../src/schemas/schema.js";

const trominoL: Polymatrix = [
    [0, 1],
    [1, 1],
];

describe("polymatrix honeycomb exterior edges", () => {
    it("A3 on hex-even-f shares edges between all three cells", () => {
        const myHex = defineHex({ orientation: Orientation.FLAT, offset: 1, dimensions: 50 });
        const grid = new Grid(myHex, rectangle({ width: 2, height: 2 }));
        const polygonMap = new Map<string, { x: number; y: number }[]>();
        for (let y = 0; y < trominoL.length; y++) {
            const row = trominoL[y];
            if (row === undefined) {
                continue;
            }
            for (let x = 0; x < row.length; x++) {
                if (row[x] === 0 || row[x] === null) {
                    continue;
                }
                const hex = grid.getHex({ col: x, row: y }) as Hex;
                const pts = hex.corners.map((c) => ({ x: c.x, y: c.y }));
                polygonMap.set(`${x},${y}`, pts);
            }
        }
        const exteriorAt = (col: number, row: number) =>
            polymatrixCellExteriorEdgeIndices(polygonMap, col, row);
        const segments = polymatrixExteriorSegmentsFromPolygons(polygonMap, exteriorAt);
        expect(segments.length).to.equal(14);
        let minX = Infinity;
        let minY = Infinity;
        for (const pts of polygonMap.values()) {
            for (const p of pts) {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
            }
        }
        const paths = chainExteriorSegmentsToPathD(segments, minX, minY);
        expect(paths).to.have.length(1);
        expect(paths[0]).to.match(/Z$/);
    });
});