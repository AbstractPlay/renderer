import { expect } from "chai";
import "mocha";
import type { APRenderRep } from "../../src/schemas/schema";
import { applyBoardChrome, sanitizeRenderRep } from "../../src/boardChrome/index";

describe("sanitizeRenderRep", () => {
    it("strips flood markers on vertex boards", () => {
        const rep: APRenderRep = {
            board: {
                style: "squares",
                width: 2,
                height: 2,
                markers: [
                    {
                        type: "flood",
                        points: [{ row: 0, col: 0 }],
                        colour: 1,
                    },
                ],
            },
            legend: { P: { name: "piece", colour: 1 } },
            pieces: "--\n--",
        };
        const merged = applyBoardChrome(rep, { style: "vertex" });
        const out = sanitizeRenderRep(merged);
        const markers =
            out.board && "markers" in out.board ? out.board.markers : [];
        expect(markers?.length ?? 0).to.equal(0);
    });
});
