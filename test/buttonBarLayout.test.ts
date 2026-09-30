import { expect } from "chai";
import {
    BUTTON_BAR_DEFAULT_GLYPH_SCALE,
    buttonBarGlyphAllowance,
    buttonBarGlyphCenterX,
    buttonBarGlyphDrawScale,
    buttonBarLabelCenterX,
    buttonBarTotalWidth,
} from "../src/common/buttonBar.js";

describe("buttonBar layout helpers", () => {
    const height = 50;
    const maxLabel = 73;

    it("adds glyph allowance to total width", () => {
        expect(buttonBarTotalWidth(maxLabel, height, false)).to.equal(maxLabel * 1.5);
        expect(buttonBarTotalWidth(maxLabel, height, true)).to.equal(
            buttonBarGlyphAllowance(height) + maxLabel * 1.5,
        );
    });

    it("centres label in the text band beside a prefix glyph", () => {
        const width = buttonBarTotalWidth(maxLabel, height, true);
        const allowance = buttonBarGlyphAllowance(height);
        const labelCx = buttonBarLabelCenterX(width, height, "prefix", true);
        expect(labelCx).to.be.greaterThan(allowance);
        expect(labelCx).to.equal(allowance + (width - allowance) / 2);
    });

    it("uses default glyph draw scale with padding", () => {
        expect(buttonBarGlyphDrawScale()).to.equal(BUTTON_BAR_DEFAULT_GLYPH_SCALE);
        expect(buttonBarGlyphDrawScale(1)).to.equal(1);
    });

    it("centres glyph inside its allowance strip", () => {
        const width = buttonBarTotalWidth(maxLabel, height, true);
        const allowance = buttonBarGlyphAllowance(height);
        expect(buttonBarGlyphCenterX("prefix", width, height)).to.equal(allowance / 2);
        expect(buttonBarGlyphCenterX("suffix", width, height)).to.equal(width - allowance / 2);
    });
});
