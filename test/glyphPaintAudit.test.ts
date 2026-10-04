import { expect } from "chai";
import "mocha";
import { assertGlyphPaintAuditClean } from "../src/sheets/registry/glyphPaintAudit.js";

describe("glyph paint slot audit", () => {
    it("contact glyphs recolour uniformly under paint.fill, paint.border, and paint.detail", () => {
        const result = assertGlyphPaintAuditClean();
        expect(result.report.glyphsAudited).to.be.greaterThan(0);
    });
});
