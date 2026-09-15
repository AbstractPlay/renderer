import { expect } from "chai";
import { auditAllThumbnailFixtures } from "./helpers/thumbnailNudgeReport.js";

describe("thumbnail fixture nudge report", function () {
    this.timeout(180_000);

    it("has no fluid-only legend regressions vs legacy glyph-local at rotate 0", () => {
        const rows = auditAllThumbnailFixtures();
        const failures = rows.flatMap((r) =>
            r.fluidRegressions.map((msg) => `${r.meta}: ${msg}`),
        );
        expect(failures, failures.join("\n")).to.deep.equal([]);
    });

    it("renders every fixture that has legend glyph nudges", () => {
        const rows = auditAllThumbnailFixtures();
        const skippedWithNudges = rows.filter(
            (r) => r.skippedRender && (r.fluidKeys > 0 || r.textKeys > 0),
        );
        expect(
            skippedWithNudges.map((r) => r.meta),
            "add sheets to thumbnailRenderOptions if a nudge meta fails to render",
        ).to.deep.equal([]);
    });
});
