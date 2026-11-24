import { expect } from "chai";
import "mocha";
import { isBoardStyleOnlyInline, usesInlineGlyphRender } from "../src/common/inlineGlyphBoard.js";

describe("inlineGlyphBoard", () => {
    it("usesInlineGlyphRender is true for null and style-only boards", () => {
        expect(usesInlineGlyphRender(null)).to.equal(true);
        expect(usesInlineGlyphRender({ style: "hex-of-hex" })).to.equal(true);
        expect(usesInlineGlyphRender({ style: "hex-even-f" })).to.equal(true);
        expect(usesInlineGlyphRender({ style: "squares", width: 4, height: 4 })).to.equal(false);
        expect(usesInlineGlyphRender({ style: "bricka" })).to.equal(false);
        expect(usesInlineGlyphRender({ style: "eleven" })).to.equal(false);
    });

    it("isBoardStyleOnlyInline rejects boards with grid dimensions", () => {
        expect(isBoardStyleOnlyInline({ style: "hex-of-hex", minWidth: 2 })).to.equal(false);
        expect(isBoardStyleOnlyInline({ style: "squares", height: 8 })).to.equal(false);
    });
});