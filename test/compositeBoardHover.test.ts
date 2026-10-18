import { expect } from "chai";
import "mocha";
import { hoverCellKey } from "../src/composite/delegateBoardHover.js";

describe("composite boardHover dedupe", () => {
    it("uses stable keys per panel cell", () => {
        expect(hoverCellKey("west", 0, 0)).to.equal("west:0,0");
        expect(hoverCellKey("west", 0, 0)).to.equal(hoverCellKey("west", 0, 0));
        expect(hoverCellKey("west", 0, 1)).to.not.equal(hoverCellKey("west", 0, 0));
        expect(hoverCellKey("east", 0, 0)).to.not.equal(hoverCellKey("west", 0, 0));
    });

    it("dedupes key rows by piece when row and col are -1", () => {
        expect(hoverCellKey("key", -1, -1, "BN")).to.equal("key:-1,-1:BN");
        expect(hoverCellKey("key", -1, -1, "BU")).to.not.equal(hoverCellKey("key", -1, -1, "BN"));
    });
});
