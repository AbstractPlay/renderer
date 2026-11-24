import { expect } from "chai";
import "mocha";
import Ajv from "ajv";
import schema from "../src/schemas/schema.json" with { type: "json" };
import type { APRenderRep } from "../src/schemas/schema.js";

const validate = new Ajv({ strict: false, allErrors: true }).compile(schema);

describe("polymatrix schema", () => {
    it("accepts legacy colour-only matrices on a polyomino rep", () => {
        const rep: APRenderRep = {
            renderer: "polyomino",
            board: { style: "squares", width: 2, height: 2 },
            legend: {
                A: [[1, 0], [1, 1]],
            },
            pieces: [{ row: 0, col: 0, matrix: [[1]] }],
            areas: [{ type: "polyomino", label: "sel", matrix: [[1, 1], [1, 0]] }],
        };
        expect(validate(rep)).to.equal(true);
    });

    it("accepts polymatrix cells with fill and glyph", () => {
        const rep: APRenderRep = {
            renderer: "isometric",
            board: { style: "hex-of-hex", minWidth: 3, maxWidth: 5 },
            legend: {
                T: [
                    [
                        { fill: 1, glyph: { name: "circle", paint: { fill: "#000" } } },
                        null,
                    ],
                    [{ fill: 1 }, { fill: 1, glyph: "MINOR_DOT" }],
                ],
                MINOR_DOT: { name: "circle", paint: { fill: "#fff", stroke: "#000" } },
                P: { piece: "hexp", colour: 1 },
            },
            pieces: [
                [[], [], []],
                [[], [], [], []],
                [[], [{ glyph: "P" }], [], [], []],
                [[], [], [], []],
                [[], [], []],
            ],
            areas: [{ type: "polyomino", label: "sel", matrix: [[{ fill: 2 }]] }],
        };
        expect(validate(rep)).to.equal(true, JSON.stringify(validate.errors));
    });
});