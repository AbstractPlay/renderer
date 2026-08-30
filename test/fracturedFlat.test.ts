import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { DefaultRenderer } from "../src/renderers/default";
import { IRendererOptionsIn } from "../src/renderers/_base";
import { APRenderRep } from "../src/schemas/schema";
import { createSVGWindow } from "svgdom";
import {
    fracturedFlatBoardCenter,
    fracturedFlatCellLabel,
    minVertexBearing,
    prepareFracturedFlatPolys,
} from "../src/boards/fracturedFlat";
import { centroid } from "../src/common/plotting";


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

function centroidInPolyBounds(
    cx: number,
    cy: number,
    points: { x: number; y: number }[],
): boolean {
    const minX = Math.min(...points.map((p) => p.x));
    const maxX = Math.max(...points.map((p) => p.x));
    const minY = Math.min(...points.map((p) => p.y));
    const maxY = Math.max(...points.map((p) => p.y));
    return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;
}

describe("fractured-flat board", () => {
    it("orders polygons by vertex count, then clockwise min-vertex bearing", () => {
        const polys = prepareFracturedFlatPolys();
        expect(polys.map((row) => row.length)).to.deep.equal([24, 15, 5, 1]);
        expect(polys.flat().length).to.equal(45);

        const flat = polys.flat();
        const center = fracturedFlatBoardCenter(flat);

        for (let row = 0; row < polys.length; row++) {
            const expectedVerts = row === 0 ? 3 : row === 1 ? 4 : row === 2 ? 5 : 6;
            for (const poly of polys[row]) {
                expect(poly.points.length).to.equal(expectedVerts);
            }

            const bearings = polys[row].map((poly) => minVertexBearing(poly, center));
            for (let col = 1; col < bearings.length; col++) {
                expect(bearings[col]).to.be.at.least(bearings[col - 1]!);
            }
        }
    });

    it("labels cells by tier letter and 1-based column in sweep order", () => {
        const polys = prepareFracturedFlatPolys();
        expect(fracturedFlatCellLabel(0, 0)).to.equal("A1");
        expect(fracturedFlatCellLabel(0, polys[0].length - 1)).to.equal("A24");
        expect(fracturedFlatCellLabel(3, 0)).to.equal("D1");
    });

    it("translates so the min corner sits at the padding offset", () => {
        const prepared = prepareFracturedFlatPolys().flat();
        const all = prepared.flatMap((p) => p.points);
        expect(Math.min(...all.map((p) => p.x))).to.equal(8);
        expect(Math.min(...all.map((p) => p.y))).to.equal(8);
    });

    it("places grid centroids within polygon vertex bounds", () => {
        const polys = prepareFracturedFlatPolys();
        for (let row = 0; row < polys.length; row++) {
            for (let col = 0; col < polys[row].length; col++) {
                const cell = polys[row][col];
                const c = centroid(cell.points)!;
                expect(
                    centroidInPolyBounds(c.x, c.y, cell.points),
                    `row ${row} col ${col}`,
                ).to.equal(true);
            }
        }
    });

    it("renders with the default renderer", () => {
        const json: APRenderRep = {
            board: {
                style: "fractured-flat",
                strokeWeight: 0.5,
                markers: [
                    {
                        type: "flood",
                        colour: 1,
                        points: [
                            { row: 0, col: 0 },
                            { row: 0, col: 12 },
                            { row: 0, col: 23 },
                        ],
                    },
                ],
            },
            legend: {
                A: { name: "piece", colour: 1 },
            },
            pieces: "A",
        };
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(json, draw, baseOptions);
        expect(draw.findOne("#board")).to.not.equal(null);
        expect(draw.findOne("#gridlines")).to.not.equal(null);
    });
});
