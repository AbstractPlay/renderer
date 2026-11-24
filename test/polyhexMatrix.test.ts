import { expect } from "chai";
import "mocha";
import { matrixHexRotate60, polyformToHexLintels } from "../src/common/polyhexMatrix.js";
import { polymatrixHasCellGlyphs } from "../src/common/polymatrix.js";
import type { Polymatrix } from "../src/schemas/schema.js";

const line3: Polymatrix = [
    [null, 1, 1, 1],
];

const trominoL: Polymatrix = [
    [0, 1],
    [1, 1],
];

describe("polyhex matrix", () => {
    it("matrixHexRotate60 preserves cell count", () => {
        const rotated = matrixHexRotate60(trominoL, 1);
        let count = 0;
        for (const row of rotated) {
            for (const cell of row) {
                if (cell !== null && cell !== 0) {
                    count++;
                }
            }
        }
        expect(count).to.equal(3);
    });

    it("matrixHexRotate60 changes orientation before returning to same cell count at six steps", () => {
        const once = matrixHexRotate60(trominoL, 1);
        const onceSet = new Set(polyformToHexLintels(once).map((c) => `${c.matrixX},${c.matrixY}`));
        const baseSet = new Set(polyformToHexLintels(trominoL).map((c) => `${c.matrixX},${c.matrixY}`));
        expect(onceSet).to.not.deep.equal(baseSet);
        let cur = trominoL;
        for (let i = 0; i < 6; i++) {
            cur = matrixHexRotate60(cur, 1);
        }
        let count = 0;
        for (const row of cur) {
            for (const cell of row) {
                if (cell !== null && cell !== 0) {
                    count++;
                }
            }
        }
        expect(count).to.equal(3);
    });

    it("polyformToHexLintels omits internal edges on a three-hex line", () => {
        const cells = polyformToHexLintels(line3);
        expect(cells).to.have.length(3);
        const middle = cells.find((c) => c.matrixX === 2 && c.matrixY === 0)!;
        expect(middle.omitted.length).to.be.greaterThan(0);
        const ends = cells.filter((c) => c.matrixX !== 2);
        for (const end of ends) {
            expect(end.omitted.length).to.be.lessThan(middle.omitted.length);
        }
    });

    it("polyformToHexLintels names horizontal contact edges E and W", () => {
        const cells = polyformToHexLintels(line3);
        expect(cells.find((c) => c.matrixX === 1)!.lintel).to.equal("lintelp_E");
        expect(cells.find((c) => c.matrixX === 2)!.lintel).to.equal("lintelp_E_W");
        expect(cells.find((c) => c.matrixX === 3)!.lintel).to.equal("lintelp_W");
    });

    it("polymatrixHasCellGlyphs is true only when a cell declares glyph", () => {
        expect(polymatrixHasCellGlyphs(trominoL)).to.equal(false);
        expect(
            polymatrixHasCellGlyphs([
                [0, { fill: 1, glyph: "MINOR_DOT" }],
                [{ fill: 1, glyph: "MINOR_DOT" }, { fill: 1, glyph: "PUNCT_DOT" }],
            ]),
        ).to.equal(true);
    });
});