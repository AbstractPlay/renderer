import { expect } from "chai";
import { glyphKeepsUpright } from "../src/renderers/isometric/faceGlyphFit.js";
import { rotatePieceNudgeVector } from "../src/renderers/glyphNudge.js";

describe("upright piece nudge viewer compensation", () => {
    it("treats vertical sheet glyphs as upright like default text", () => {
        expect(glyphKeepsUpright({ name: "piece", colour: 1, orientation: "vertical" })).to.equal(true);
        expect(glyphKeepsUpright({ name: "plane", colour: 1 })).to.equal(false);
        expect(glyphKeepsUpright({ text: "1", colour: "#000" })).to.equal(true);
        expect(glyphKeepsUpright({ text: "1", colour: "#000", orientation: "fluid" })).to.equal(false);
    });

    it("rotates piece nudge vectors for viewer spin", () => {
        const { dx, dy } = rotatePieceNudgeVector(0, 400, 90);
        expect(dx).to.be.closeTo(-400, 0.001);
        expect(dy).to.be.closeTo(0, 0.001);
    });
});
