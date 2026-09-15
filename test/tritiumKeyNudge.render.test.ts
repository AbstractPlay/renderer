import { expect } from "chai";
import { render } from "../src/index.js";
import tritiumFixture from "./fixtures/tritium-key-nudge.json" with { type: "json" };
import type { APRenderRep } from "../src/schemas/schema.js";
import { legendChildUseMatrices, maxMatrixDelta } from "./helpers/legendUseMatrices.js";
import { withGlyphLocalNudges } from "./helpers/nudgeFixtureUtils.js";
import { coreRenderOptions, makeDraw } from "./helpers/renderTestDraw.js";

describe("tritium key flag nudge parity at rotate 0", () => {
    const rep = tritiumFixture as APRenderRep;
    const legacyRep = withGlyphLocalNudges(rep);

    for (const legendKey of ["KF1", "KF2"] as const) {
        it(`matches legacy glyph-local matrices for ${legendKey}`, () => {
            const drawPiece = makeDraw();
            const drawGlyph = makeDraw();
            render(rep, { ...coreRenderOptions, target: drawPiece, rotate: 0 });
            render(legacyRep, { ...coreRenderOptions, target: drawGlyph, rotate: 0 });

            const piece = legendChildUseMatrices(drawPiece, legendKey);
            const glyph = legendChildUseMatrices(drawGlyph, legendKey);
            expect(piece.length).to.equal(glyph.length);
            expect(maxMatrixDelta(piece, glyph)).to.be.lessThan(0.001);
        });
    }
});
