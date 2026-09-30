import { expect } from "chai";
import {
    assertButtonBarButton,
    buttonBarClickValue,
} from "../src/common/buttonBar.js";

describe("buttonBar button validation", () => {
    it("requires at least one of label or glyph", () => {
        expect(() => assertButtonBarButton({}, 0)).to.throw(/at least one/);
    });

    it("rejects attributes without a label", () => {
        expect(() =>
            assertButtonBarButton({ glyph: "P", attributes: [{ name: "font-style", value: "italic" }] }, 1),
        ).to.throw(/attributes.*label/);
    });

    it("resolves click value from glyph when label is omitted", () => {
        expect(buttonBarClickValue({ glyph: "P" })).to.equal("P");
        expect(buttonBarClickValue({ glyph: "P", value: "play" })).to.equal("play");
    });
});
