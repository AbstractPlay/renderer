import { expect } from "chai";
import "mocha";
import type { APRenderRep } from "../../src/schemas/schema";
import { validateRenderCustomization } from "../../src/boardChrome/index";

const baseRep: APRenderRep = {
    board: { style: "squares-stacked", width: 4, height: 4 },
    legend: { P: { name: "piece", colour: 1 } },
    pieces: "----\n----\n----\n----",
};

describe("validateRenderCustomization", () => {
    it("errors on stacked to vertex style change", () => {
        const result = validateRenderCustomization(baseRep, {
            style: "vertex",
        });
        expect(result.ok).to.equal(false);
        expect(result.errors.length).to.be.greaterThan(0);
    });

    it("ok for stacked to checkered", () => {
        const result = validateRenderCustomization(baseRep, {
            style: "squares-checkered",
        });
        expect(result.ok).to.equal(true);
        expect(result.sanitized?.board).to.not.equal(undefined);
    });
});
