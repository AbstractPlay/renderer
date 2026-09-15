import { expect } from "chai";
import { isTextGlyphLayer, resolveGlyphNudgeRelativeTo } from "../src/renderers/glyphNudge.js";
import type { Glyph } from "../src/schemas/schema.js";

describe("resolveGlyphNudgeRelativeTo", () => {
    it("defaults text to piece and sheet to glyph", () => {
        const text: Glyph = { text: "1", nudge: { dx: 0, dy: 0 } };
        const sheet: Glyph = { name: "piece", colour: 1, nudge: { dx: 0, dy: 0 } };
        expect(isTextGlyphLayer(text)).to.equal(true);
        expect(resolveGlyphNudgeRelativeTo(text, text.nudge!)).to.equal("piece");
        expect(resolveGlyphNudgeRelativeTo(sheet, sheet.nudge!)).to.equal("glyph");
    });

    it("honours explicit relativeTo", () => {
        const sheet: Glyph = { name: "piece", colour: 1, nudge: { dx: 0, dy: 0, relativeTo: "piece" } };
        const text: Glyph = { text: "1", nudge: { dx: 0, dy: 0, relativeTo: "glyph" } };
        expect(resolveGlyphNudgeRelativeTo(sheet, sheet.nudge!)).to.equal("piece");
        expect(resolveGlyphNudgeRelativeTo(text, text.nudge!)).to.equal("glyph");
    });
});
