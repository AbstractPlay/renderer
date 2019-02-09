/* tslint:disable:no-console */

import { rectOfSquares } from "../../src/grids";

test("default params (chess board, size 50)", () => {
    const points = rectOfSquares({});
    expect(points.length).toBe(8);
    for (const row of points) {
        expect(row.length).toBe(8);
    }
    expect(points[0][0].x).toBe(25);
    expect(points[0][0].y).toBe(25);
    expect(points[7][7].x).toBe(375);
    expect(points[7][7].y).toBe(375);
});

test("4 by 8, size 21", () => {
    const points = rectOfSquares({cellSize: 21, gridWidth: 4});
    expect(points.length).toBe(8);
    for (const row of points) {
        expect(row.length).toBe(4);
    }
    expect(points[0][0].x).toBe(10.5);
    expect(points[0][0].y).toBe(10.5);
    expect(points[7][3].x).toBe(73.5);
    expect(points[7][3].y).toBe(157.5);
});
