import { expect } from "chai";
import { assertIsoOverlayValid, pieceUsesDecorOverlay, pieceUsesTopOverlay } from "../src/renderers/isometric/isoOverlayPiece";

describe("iso overlay piece validation", () => {
    it("should classify piece kinds for top vs decor overlays", () => {
        expect(pieceUsesTopOverlay("cylinder")).to.equal(true);
        expect(pieceUsesTopOverlay("hexp")).to.equal(true);
        expect(pieceUsesTopOverlay("lintelp_NE")).to.equal(true);
        expect(pieceUsesDecorOverlay("cube")).to.equal(true);
        expect(pieceUsesDecorOverlay("lintelE")).to.equal(true);
        expect(pieceUsesDecorOverlay("cylinder")).to.equal(false);
    });

    it("should reject top overlays on cubes", () => {
        expect(() =>
            assertIsoOverlayValid({
                piece: "cube",
                colour: 1,
                top: [{ name: "piecepack-number-1" }],
            }),
        ).to.throw(/does not support `top`/);
    });

    it("should reject decor on cylinders", () => {
        expect(() =>
            assertIsoOverlayValid({
                piece: "cylinder",
                colour: 1,
                decor: { top: [{ name: "piecepack-number-1" }] },
            }),
        ).to.throw(/does not support `decor`/);
    });
});
