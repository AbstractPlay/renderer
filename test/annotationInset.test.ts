import { expect } from "chai";
import "mocha";
import {
    applyCellInsetToMovePoints,
    boardSupportsMoveCellInset,
    rayDistanceToPolygonBoundary,
    squareHalfExtentAlongDirection,
    trimAnnotationEndpoints,
} from "../src/common/annotationInset.js";
import type { IPoint } from "../src/grids/index.js";

describe("annotationInset", () => {
    it("squareHalfExtentAlongDirection is cellsize/4 on axis-aligned directions", () => {
        const cell = 40;
        expect(squareHalfExtentAlongDirection(cell, 0, 1)).to.be.closeTo(cell / 4, 1e-9);
        expect(squareHalfExtentAlongDirection(cell, 1, 0)).to.be.closeTo(cell / 4, 1e-9);
    });

    it("trimAnnotationEndpoints offsets vertical move endpoints inward along travel", () => {
        const cell = 40;
        const centers: IPoint[] = [{ x: 10, y: 0 }, { x: 10, y: 40 }];
        const insetAt = (_index: number, dir: IPoint) =>
            squareHalfExtentAlongDirection(cell, dir.x, dir.y);
        const trimmed = trimAnnotationEndpoints(centers, insetAt);
        expect(trimmed[0]!.y).to.be.closeTo(10, 1e-9);
        expect(trimmed[1]!.y).to.be.closeTo(30, 1e-9);
        expect(trimmed[0]!.x).to.equal(10);
        expect(trimmed[1]!.x).to.equal(10);
    });

    it("rayDistanceToPolygonBoundary hits square half-width on cardinal ray", () => {
        const half = 20;
        const square: IPoint[] = [
            { x: -half, y: -half },
            { x: half, y: -half },
            { x: half, y: half },
            { x: -half, y: half },
        ];
        const dist = rayDistanceToPolygonBoundary({ x: 0, y: 0 }, { x: 0, y: 1 }, square);
        expect(dist).to.be.closeTo(half, 1e-9);
    });

    it("boardSupportsMoveCellInset matches regular grid styles", () => {
        expect(boardSupportsMoveCellInset("squares-checkered")).to.equal(true);
        expect(boardSupportsMoveCellInset("vertex-cross")).to.equal(true);
        expect(boardSupportsMoveCellInset("hex-of-hex")).to.equal(true);
        expect(boardSupportsMoveCellInset("hex-of-tri-f")).to.equal(false);
        expect(boardSupportsMoveCellInset("entropy")).to.equal(false);
    });

    it("applyCellInsetToMovePoints uses cell polys when provided", () => {
        const cell = 40;
        const half = cell / 2;
        const centers: IPoint[] = [{ x: 100, y: 100 }, { x: 100, y: 140 }];
        const targets = [{ row: 0, col: 0 }, { row: 1, col: 0 }];
        const polys = [[{
            type: "poly" as const,
            points: [
                { x: 100 - half, y: 100 - half },
                { x: 100 + half, y: 100 - half },
                { x: 100 + half, y: 100 + half },
                { x: 100 - half, y: 100 + half },
            ],
        }], [{
            type: "poly" as const,
            points: [
                { x: 100 - half, y: 140 - half },
                { x: 100 + half, y: 140 - half },
                { x: 100 + half, y: 140 + half },
                { x: 100 - half, y: 140 + half },
            ],
        }]];
        const trimmed = applyCellInsetToMovePoints(centers, targets, cell, polys);
        expect(trimmed[0]!.y).to.be.closeTo(100 + cell / 4, 1e-9);
        expect(trimmed[1]!.y).to.be.closeTo(140 - cell / 4, 1e-9);
    });
});
