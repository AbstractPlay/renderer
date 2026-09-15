import { expect } from "chai";
import { render } from "../src/index.js";
import { crosshairsRep } from "./helpers/crosshairsAltitudeFixture.js";
import { coreRenderOptions, makeDraw } from "./helpers/renderTestDraw.js";

const firstTextUseTransform = (draw: ReturnType<typeof makeDraw>): string | undefined => {
    const sym = draw.findOne("#P1NE_1");
    const use = sym?.findOne("use");
    return use?.attr("transform") as string | undefined;
};

/** Upright bake is rotate+uniform scale only (det > 0), not a mirror (e.g. matrix(-s,0,0,+s)). */
const isUprightLegendUseTransform = (transform: string): boolean => {
    const m = /^matrix\(([^,]+),([^,]+),([^,]+),([^,]+),/.exec(transform);
    if (m === null) {
        return false;
    }
    const a = Number(m[1]);
    const b = Number(m[2]);
    const c = Number(m[3]);
    const d = Number(m[4]);
    return a * d - b * c > 0;
};

describe("Crosshairs playground viewer rotation", () => {
    it("counter-rotates upright text for opts.rotate while keeping wing nudge placement", () => {
        const draw0 = makeDraw();
        const draw90 = makeDraw();
        render(crosshairsRep, { ...coreRenderOptions, target: draw0, rotate: 0 });
        render(crosshairsRep, { ...coreRenderOptions, target: draw90, rotate: 90 });
        const t0 = firstTextUseTransform(draw0);
        const t90 = firstTextUseTransform(draw90);
        expect(t0).to.be.a("string");
        expect(t90).to.be.a("string");
        expect(isUprightLegendUseTransform(t0!)).to.equal(true);
        expect(isUprightLegendUseTransform(t90!)).to.equal(true);
        expect(t90).to.not.equal(t0);
    });
});
