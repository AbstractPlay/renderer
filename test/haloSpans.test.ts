import { expect } from "chai";
import "mocha";
import {
    HaloSegmentDegreesError,
    haloIsFullCircle,
    resolveHaloSegmentSpans,
} from "../src/markers/haloSpans.js";

describe("resolveHaloSegmentSpans", () => {
    it("splits 360 equally when no segment has degrees", () => {
        const spans = resolveHaloSegmentSpans([{ colour: 1 }, { colour: 2 }, { colour: 3 }]);
        expect(spans).to.have.length(3);
        for (const s of spans) {
            expect(s.spanDeg).to.equal(120);
            expect(s.draw).to.equal(true);
        }
        expect(spans[2]!.endDeg).to.equal(360);
    });

    it("uses explicit degrees when every segment specifies them", () => {
        const spans = resolveHaloSegmentSpans([
            { degrees: 90, colour: 1 },
            { degrees: 60, colour: 2 },
        ]);
        expect(spans[0]!.spanDeg).to.equal(90);
        expect(spans[1]!.spanDeg).to.equal(60);
        expect(spans[1]!.endDeg).to.equal(150);
    });

    it("splits remainder among segments without degrees in mixed mode", () => {
        const spans = resolveHaloSegmentSpans([
            { degrees: 40, colour: 1 },
            { degrees: 30, colour: 2 },
            { colour: 3 },
            { colour: 4 },
            { skip: true },
        ]);
        expect(spans[0]!.spanDeg).to.equal(40);
        expect(spans[1]!.spanDeg).to.equal(30);
        expect(spans[2]!.spanDeg).to.equal(290 / 3);
        expect(spans[3]!.spanDeg).to.equal(290 / 3);
        expect(spans[4]!.spanDeg).to.equal(290 / 3);
        expect(spans[4]!.draw).to.equal(false);
    });

    it("throws when explicit degrees exceed 360 in mixed mode", () => {
        expect(() => resolveHaloSegmentSpans([
            { degrees: 200 },
            { degrees: 200 },
            { colour: 1 },
        ])).to.throw(HaloSegmentDegreesError);
    });

    it("detects full circle for a single default segment", () => {
        const spans = resolveHaloSegmentSpans([{ colour: 1 }]);
        expect(haloIsFullCircle(spans)).to.equal(true);
    });
});
