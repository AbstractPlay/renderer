import { legendChildUseMatrices, maxMatrixDelta } from "./legendUseMatrices.js";
import { withGlyphLocalNudges } from "./nudgeFixtureUtils.js";
import { makeDraw } from "./renderTestDraw.js";
import {
    THUMBNAIL_FIXTURE_METAS,
    legendKeysByNudgeClass,
    loadThumbnailFixture,
    tryRenderThumbnail,
} from "./nudgeThumbnailAudit.js";

export type ThumbnailAuditRow = {
    meta: string;
    fluidKeys: number;
    fluidRegressions: string[];
    textKeys: number;
    textChangedFromLegacy: Array<{ key: string; delta: number }>;
    textUnchanged: string[];
    skippedRender: boolean;
};

export const auditAllThumbnailFixtures = (): ThumbnailAuditRow[] => {
    const rows: ThumbnailAuditRow[] = [];
    for (const meta of THUMBNAIL_FIXTURE_METAS) {
        const rep = loadThumbnailFixture(meta);
        const classes = legendKeysByNudgeClass(rep);
        const legacyRep = withGlyphLocalNudges(rep);
        const drawDefault = makeDraw();
        const drawLegacy = makeDraw();
        const ok =
            tryRenderThumbnail(rep, drawDefault) && tryRenderThumbnail(legacyRep, drawLegacy);
        if (!ok) {
            rows.push({
                meta,
                fluidKeys: classes["fluid-only"].length,
                fluidRegressions: [],
                textKeys: classes["has-text-nudge"].length,
                textChangedFromLegacy: [],
                textUnchanged: [],
                skippedRender: true,
            });
            continue;
        }
        const fluidRegressions: string[] = [];
        for (const key of classes["fluid-only"]) {
            const delta = maxMatrixDelta(
                legendChildUseMatrices(drawDefault, key),
                legendChildUseMatrices(drawLegacy, key),
            );
            if (delta >= 0.001) {
                fluidRegressions.push(`${key} Δ=${delta}`);
            }
        }
        const textChangedFromLegacy: Array<{ key: string; delta: number }> = [];
        const textUnchanged: string[] = [];
        for (const key of classes["has-text-nudge"]) {
            const delta = maxMatrixDelta(
                legendChildUseMatrices(drawDefault, key),
                legendChildUseMatrices(drawLegacy, key),
            );
            if (delta >= 0.001) {
                textChangedFromLegacy.push({ key, delta });
            } else {
                textUnchanged.push(key);
            }
        }
        rows.push({
            meta,
            fluidKeys: classes["fluid-only"].length,
            fluidRegressions,
            textKeys: classes["has-text-nudge"].length,
            textChangedFromLegacy,
            textUnchanged,
            skippedRender: false,
        });
    }
    return rows;
};
