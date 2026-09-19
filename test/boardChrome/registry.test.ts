import { expect } from "chai";
import "mocha";
import {
    getCompatibleStyles,
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
});
