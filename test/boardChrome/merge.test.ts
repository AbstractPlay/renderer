import { expect } from "chai";
import "mocha";
import type { APRenderRep } from "../../src/schemas/schema";
import {
    applyBoardChrome,
    validateRenderCustomization,
} from "../../src/boardChrome/index";

const baseRep: APRenderRep = {
    board: {
        style: "vertex",
        width: 4,
        height: 4,
        markers: [{ type: "dots", points: [{ row: 0, col: 0 }] }],
    },
    legend: { P: { name: "piece", colour: 1 } },
    pieces: "----\n----\n----\n----",
};

describe("applyBoardChrome", () => {
    it("swaps style when compatible", () => {
        const out = applyBoardChrome(baseRep, { style: "squares-checkered" });
        expect(out.board && "style" in out.board && out.board.style).to.equal(
            "squares-checkered",
        );
    });

    it("replaces markers when provided", () => {
        const out = applyBoardChrome(baseRep, { markers: [] });
        expect(
            out.board && "markers" in out.board && out.board.markers,
        ).to.deep.equal([]);
    });

    it("keeps game markers when markers omitted", () => {
        const out = applyBoardChrome(baseRep, { strokeWeight: 2 });
        expect(
            out.board && "markers" in out.board && out.board.markers?.length,
        ).to.equal(1);
    });

    it("rejects width override in validate", () => {
        const result = validateRenderCustomization(baseRep, { width: 99 });
        expect(result.ok).to.equal(false);
        expect(result.errors.some((e) => e.includes("width"))).to.equal(true);
    });
});
