import { expect } from "chai";
import { legendChildUseMatrices, maxMatrixDelta } from "./helpers/legendUseMatrices.js";
import { withGlyphLocalNudges } from "./helpers/nudgeFixtureUtils.js";
import { makeDraw } from "./helpers/renderTestDraw.js";
import {
    legendKeysByNudgeClass,
    loadThumbnailFixture,
    THUMBNAIL_FIXTURE_METAS,
    tryRenderThumbnail,
} from "./helpers/nudgeThumbnailAudit.js";

/** Decktet / nudge-heavy thumbnails — uses local fixtures only (no network). */
describe("thumbnail nudge parity at rotate 0 (fixtures)", function () {
    this.timeout(120_000);

    const decktetMetas = THUMBNAIL_FIXTURE_METAS.filter((m) =>
        ["magnate", "fnap", "deckfish", "btt", "biscuit", "emu", "jacynth", "quincunx", "siegeofj"].includes(m),
    );

    for (const meta of decktetMetas) {
        it(`${meta} fluid-only legend nudges match legacy at opts.rotate 0`, () => {
            const rep = loadThumbnailFixture(meta);
            const keys = legendKeysByNudgeClass(rep)["fluid-only"];
            if (keys.length === 0) {
                return;
            }
            const legacyRep = withGlyphLocalNudges(rep);
            const drawDefault = makeDraw();
            const drawLegacy = makeDraw();
            if (!tryRenderThumbnail(rep, drawDefault) || !tryRenderThumbnail(legacyRep, drawLegacy)) {
                return;
            }

            const failures: string[] = [];
            for (const key of keys) {
                const delta = maxMatrixDelta(
                    legendChildUseMatrices(drawDefault, key),
                    legendChildUseMatrices(drawLegacy, key),
                );
                if (delta >= 0.001) {
                    failures.push(`${key} Δ=${delta}`);
                }
            }
            expect(failures, failures.join("; ")).to.deep.equal([]);
        });
    }
});
