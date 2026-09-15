import { expect } from "chai";
import { render } from "../src/index.js";
import {
    crosshairsRep,
    textNudgedLegendKeys,
    textOffsetFromPlane,
} from "./helpers/crosshairsAltitudeFixture.js";
import { coreRenderOptions, makeDraw } from "./helpers/renderTestDraw.js";

const OPT_ROTATIONS = [0, 30, 90, 180, 270, 330];

describe("Crosshairs numeric altitude fixture (integration)", function () {
    this.timeout(120_000);

    it("matches the expected board rotation baked into the fixture", () => {
        expect(crosshairsRep.board.rotate).to.equal(90);
    });

    it("renders the full hex-of-hex board without error", () => {
        const draw = makeDraw();
        render(crosshairsRep, { ...coreRenderOptions, target: draw, rotate: 0 });
        expect(draw.findOne("#board")).to.not.equal(null);
    });

    it("keeps every nudged altitude text offset from its plane across opts.rotate", () => {
        const keys = textNudgedLegendKeys();
        expect(keys.length).to.be.greaterThan(0);
        const deltasByKey = new Map(keys.map((k) => [k, [] as Array<{ x: number; y: number }>]));

        for (const rotation of OPT_ROTATIONS) {
            const draw = makeDraw();
            render(crosshairsRep, { ...coreRenderOptions, target: draw, rotate: rotation });
            for (const key of keys) {
                deltasByKey.get(key)!.push(textOffsetFromPlane(draw, key));
            }
        }

        for (const key of keys) {
            const deltas = deltasByKey.get(key)!;
            const [first, ...rest] = deltas;
            for (const d of rest) {
                expect(d.x, key).to.be.closeTo(first.x, 0.05);
                expect(d.y, key).to.be.closeTo(first.y, 0.05);
            }
        }
    });
});
