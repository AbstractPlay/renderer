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

    it("allows labelScale on specialized pegboard style", () => {
        const pegRep: APRenderRep = {
            board: { style: "pegboard", width: 4, height: 4 },
            legend: { P: { name: "piece", colour: 1 } },
            pieces: "----\n----\n----\n----",
        };
        const result = validateRenderCustomization(pegRep, {
            labelScale: 1.5,
        });
        expect(result.ok).to.equal(true);
        expect(result.sanitized?.board?.labelScale).to.equal(1.5);
    });

    it("keeps pegboard line and edge markers when applying labelScale", () => {
        const pegRep: APRenderRep = {
            board: {
                style: "pegboard",
                width: 4,
                height: 4,
                markers: [
                    {
                        type: "line",
                        points: [{ row: 1, col: 1 }, { row: 1, col: 3 }],
                        colour: 1,
                        width: 5,
                    },
                    { type: "edge", edge: "N", colour: 1 },
                ],
            },
            legend: { P: { name: "piece", colour: 1 } },
            pieces: "----\n----\n----\n----",
        };
        const result = validateRenderCustomization(pegRep, {
            labelScale: 1.25,
        });
        expect(result.ok).to.equal(true);
        expect(result.warnings).to.deep.equal([]);
        const markers =
            result.sanitized?.board && "markers" in result.sanitized.board
                ? result.sanitized.board.markers
                : [];
        expect(markers?.length).to.equal(2);
    });

    it("rejects style override on pegboard", () => {
        const pegRep: APRenderRep = {
            board: { style: "pegboard", width: 4, height: 4 },
            legend: { P: { name: "piece", colour: 1 } },
            pieces: "----\n----\n----\n----",
        };
        const result = validateRenderCustomization(pegRep, {
            style: "squares-checkered",
        });
        expect(result.ok).to.equal(false);
    });

    const hexRep: APRenderRep = {
        board: { style: "hex-of-hex", minWidth: 3, maxWidth: 5 },
        legend: { P: { name: "piece", colour: 1 } },
        pieces: "---\n----\n-----",
    };

    it("ok for hex-of-hex to hex-of-tri style change", () => {
        const result = validateRenderCustomization(hexRep, {
            style: "hex-of-tri",
        });
        expect(result.ok).to.equal(true);
        expect(result.sanitized?.board?.style).to.equal("hex-of-tri");
    });

    it("rejects hex-of-hex to hex-of-tri-f", () => {
        const result = validateRenderCustomization(hexRep, {
            style: "hex-of-tri-f",
        });
        expect(result.ok).to.equal(false);
    });

    it("strips flood markers when swapping hex-of-hex to hex-of-tri", () => {
        const withFlood: APRenderRep = {
            ...hexRep,
            board: {
                ...hexRep.board,
                markers: [
                    {
                        type: "flood",
                        colour: 1,
                        points: [{ row: 0, col: 0 }],
                    },
                ],
            },
        };
        const result = validateRenderCustomization(withFlood, {
            style: "hex-of-tri",
        });
        expect(result.ok).to.equal(true);
        expect(result.warnings.length).to.be.greaterThan(0);
        const markers =
            result.sanitized?.board && "markers" in result.sanitized.board
                ? result.sanitized.board.markers
                : [];
        expect(markers?.length).to.equal(0);
    });
});
