import { expect } from "chai";
import { legendChildUseMatrices, maxMatrixDelta } from "./helpers/legendUseMatrices.js";
import { withGlyphLocalNudges } from "./helpers/nudgeFixtureUtils.js";
import { makeDraw } from "./helpers/renderTestDraw.js";
import {
    THUMBNAIL_FIXTURE_METAS,
    legendKeysByNudgeClass,
    loadThumbnailFixture,
    tryRenderThumbnail,
} from "./helpers/nudgeThumbnailAudit.js";

const maxDeltaForKeys = (
    drawDefault: ReturnType<typeof makeDraw>,
    drawLegacy: ReturnType<typeof makeDraw>,
    keys: string[],
): Array<{ key: string; delta: number }> => {
    const rows: Array<{ key: string; delta: number }> = [];
    for (const key of keys) {
        const delta = maxMatrixDelta(
            legendChildUseMatrices(drawDefault, key),
            legendChildUseMatrices(drawLegacy, key),
        );
        rows.push({ key, delta });
    }
    return rows;
};

describe("thumbnail fixture nudge audit (local JSON)", function () {
    this.timeout(120_000);

    for (const meta of THUMBNAIL_FIXTURE_METAS) {
        describe(meta, () => {
            const rep = loadThumbnailFixture(meta);
            const classes = legendKeysByNudgeClass(rep);

            it("fluid-only nudged legend keys match legacy glyph-local at rotate 0", () => {
                const keys = classes["fluid-only"];
                if (keys.length === 0) {
                    return;
                }
                const legacyRep = withGlyphLocalNudges(rep);
                const drawDefault = makeDraw();
                const drawLegacy = makeDraw();
                if (!tryRenderThumbnail(rep, drawDefault) || !tryRenderThumbnail(legacyRep, drawLegacy)) {
                    return;
                }
                const failures = maxDeltaForKeys(drawDefault, drawLegacy, keys)
                    .filter((r) => r.delta >= 0.001);
                expect(
                    failures,
                    failures.map((f) => `${f.key} Δ=${f.delta}`).join("; "),
                ).to.deep.equal([]);
            });

        });
    }
});
