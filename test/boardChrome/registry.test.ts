import { expect } from "chai";
import "mocha";
import {
    getCompatibleStyles,
    isBoardChromeEligible,
    isInvalidStylePair,
} from "../../src/boardChrome/index";

describe("boardChrome registry", () => {
    it("allows vertex and flat squares to swap", () => {
        const fromVertex = getCompatibleStyles("vertex");
        expect(fromVertex).to.include("squares-checkered");
        const fromRect = getCompatibleStyles("squares");
        expect(fromRect).to.include("vertex");
    });

    it("rejects vertex ↔ squares-stacked pairs", () => {
        expect(isInvalidStylePair("vertex", "squares-stacked")).to.equal(true);
        expect(isInvalidStylePair("squares-stacked", "vertex-cross")).to.equal(
            true,
        );
    });

    it("allows stacked ↔ flat rect", () => {
        expect(isInvalidStylePair("squares-stacked", "squares-beveled")).to.equal(
            false,
        );
        const stacked = getCompatibleStyles("squares-stacked");
        expect(stacked).to.include("squares-checkered");
        expect(stacked).to.not.include("vertex");
    });

    it("excludes squares-diamonds from style swap options", () => {
        expect(getCompatibleStyles("vertex")).to.not.include("squares-diamonds");
        expect(getCompatibleStyles("squares-checkered")).to.not.include(
            "squares-diamonds",
        );
        expect(getCompatibleStyles("squares-diamonds")).to.deep.equal([]);
        const rep = {
            board: { style: "squares-diamonds", width: 4, height: 4 },
            legend: { P: { name: "piece", colour: 1 } },
            pieces: "----\n----\n----\n----",
        };
        expect(isBoardChromeEligible(rep)).to.equal(false);
    });

    it("excludes pegboard and vertex-fanorona from customization", () => {
        expect(getCompatibleStyles("vertex")).to.not.include("pegboard");
        expect(getCompatibleStyles("vertex")).to.not.include("vertex-fanorona");
        expect(getCompatibleStyles("squares-checkered")).to.not.include("pegboard");
        expect(getCompatibleStyles("pegboard")).to.deep.equal([]);
        expect(getCompatibleStyles("vertex-fanorona")).to.deep.equal([]);

        const pegRep = {
            board: { style: "pegboard", width: 4, height: 4 },
            legend: { P: { name: "piece", colour: 1 } },
            pieces: "----\n----\n----\n----",
        };
        expect(isBoardChromeEligible(pegRep)).to.equal(false);

        const fanRep = {
            board: { style: "vertex-fanorona", width: 4, height: 4 },
            legend: { P: { name: "piece", colour: 1 } },
            pieces: "----\n----\n----\n----",
        };
        expect(isBoardChromeEligible(fanRep)).to.equal(false);
    });
});
