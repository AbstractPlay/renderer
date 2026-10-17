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
});
