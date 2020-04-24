/* tslint:disable:no-console */
import { expect } from "chai";
import "mocha";
import { rectOfSquares } from "../../src/grids";

describe("RectofSquares math", () => {

    it("default params (chess board, size 50)", () => {
        const points = rectOfSquares({});
        expect(points.length).to.equal(8);
        for (const row of points) {
            expect(row.length).to.equal(8);
        }
        expect(points[0][0].x).to.equal(25);
        expect(points[0][0].y).to.equal(25);
        expect(points[7][7].x).to.equal(375);
        expect(points[7][7].y).to.equal(375);
    });

    it("4 by 8, size 21", () => {
        const points = rectOfSquares({cellSize: 21, gridWidth: 4});
        expect(points.length).to.equal(8);
        for (const row of points) {
            expect(row.length).to.equal(4);
        }
        expect(points[0][0].x).to.equal(10.5);
        expect(points[0][0].y).to.equal(10.5);
        expect(points[7][3].x).to.equal(73.5);
        expect(points[7][3].y).to.equal(157.5);
    });
});
