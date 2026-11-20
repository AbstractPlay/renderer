import { expect } from "chai";
import "mocha";
import { hexOfTri as hexOfTriGrid } from "../src/grids/index.js";
import {
    GIPF_DOT_SIZE,
    gipfShouldOmitPerimeterChord,
    hexOfTriIsPerimeter,
} from "../src/boards/hexOfTri.js";
import { render, type APRenderRep } from "../src/index.js";
import { coreRenderOptions, makeDraw } from "./helpers/renderTestDraw.js";

const grid59 = hexOfTriGrid({ gridWidthMin: 5, gridWidthMax: 9, cellSize: 50 });

const baseGipfRep = (): APRenderRep => ({
    renderer: "default",
    board: { style: "gipf", minWidth: 5, maxWidth: 9 },
    legend: {
        A: { name: "piece", paint: { fill: 1 } },
        B: { name: "piece", paint: { fill: 2 } },
    },
    pieces: null,
});

const baseHexTriRep = (): APRenderRep => ({
    ...baseGipfRep(),
    board: { style: "hex-of-tri", minWidth: 5, maxWidth: 9 },
});

describe("gipf board", () => {
    it("omits every edge between two perimeter nodes", () => {
        expect(gipfShouldOmitPerimeterChord(0, 2, 0, 3, grid59)).to.equal(true);
        expect(gipfShouldOmitPerimeterChord(1, 0, 2, 0, grid59)).to.equal(true);
        expect(
            gipfShouldOmitPerimeterChord(1, grid59[1]!.length - 1, 2, grid59[2]!.length - 1, grid59),
        ).to.equal(true);
        expect(gipfShouldOmitPerimeterChord(1, 0, 0, 1, grid59)).to.equal(true);
        expect(gipfShouldOmitPerimeterChord(0, 0, 1, 0, grid59)).to.equal(true);
        expect(gipfShouldOmitPerimeterChord(0, 2, 1, 2, grid59)).to.equal(false);
    });

    it("exports dot size constant for integrators", () => {
        expect(GIPF_DOT_SIZE).to.be.closeTo(0.33, 0.001);
    });

    it("counts perimeter nodes on hexhex 5", () => {
        let n = 0;
        for (let row = 0; row < grid59.length; row++) {
            for (let col = 0; col < grid59[row]!.length; col++) {
                if (hexOfTriIsPerimeter(row, col, grid59)) {
                    n++;
                }
            }
        }
        expect(n).to.be.greaterThan(0);
    });

    it("draws fewer grid strokes than hex-of-tri and adds gipf dot layer", () => {
        const drawTri = makeDraw();
        const drawGipf = makeDraw();
        render(baseHexTriRep(), { ...coreRenderOptions, target: drawTri });
        render(baseGipfRep(), { ...coreRenderOptions, target: drawGipf });

        const triLines = drawTri.find("#gridlines-strokes")[0]?.find("line").length ?? 0;
        const gipfLines = drawGipf.find("#gridlines-strokes")[0]?.find("line").length ?? 0;
        expect(gipfLines).to.be.lessThan(triLines);

        const dots = drawGipf.find("#gipf-dots")[0]?.find("circle").length ?? 0;
        expect(dots).to.equal(24);
    });
});