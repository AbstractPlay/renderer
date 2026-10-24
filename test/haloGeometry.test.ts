import { expect } from "chai";
import "mocha";
import { projectPoint, projectPointEllipse } from "../src/common/plotting.js";

describe("halo geometry", () => {
    it("projectPointEllipse disagrees with projectPoint on circular halos for some bearings", () => {
        const cx = 300;
        const cy = 300;
        const r = 320;
        const deg = 140;
        const [ex, ey] = projectPoint(cx, cy, r, deg);
        const [exEll, eyEll] = projectPointEllipse(cx, cy, r, r, deg);
        expect(ey).to.be.greaterThan(cy);
        expect(ex).to.be.greaterThan(cx);
        expect(eyEll).to.be.lessThan(cy);
        expect(exEll).not.to.equal(ex);
    });
});
