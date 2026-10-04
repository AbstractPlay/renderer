import { expect } from "chai";
import "mocha";
import {
    DEFAULT_SHEET_SEARCH_ORDER,
    findLegendGlyphPaintViolations,
    migratePlaygroundCatalogEntry,
    migrateRenderJson,
    migrateSheetGlyphInPlace,
} from "../src/tools/migrateGlyphPaint.js";

describe("migrateGlyphPaint scope", () => {
    it("migrates named legend glyphs only", () => {
        const rep = {
            board: { style: "squares", width: 1, height: 1, strokeColour: 1 },
            legend: {
                A: { name: "piece", colour: 1 },
                T: { text: "9", colour: 1 },
                C: [
                    { name: "piece", colour: 2, colour2: 3 },
                    { text: "1" },
                ],
            },
            pieces: "A",
        };
        migrateRenderJson(rep);
        expect(rep.legend.A).to.deep.equal({ name: "piece", paint: { fill: 1 } });
        expect(rep.legend.T).to.deep.equal({ text: "9", colour: 1 });
        expect(rep.legend.C[0]).to.deep.equal({
            name: "piece",
            paint: { fill: 2, border: 3 },
        });
        expect(rep.board.strokeColour).to.equal(1);
    });

    it("maps dice colour2 to paint.detail via catalog", () => {
        const obj = { name: "d6-3", colour: 1, colour2: 2 };
        migrateSheetGlyphInPlace(obj, DEFAULT_SHEET_SEARCH_ORDER);
        expect(obj).to.deep.equal({
            name: "d6-3",
            paint: { fill: 1, detail: 2 },
        });
    });

    it("legacy opacity moves into paint.fill and drops top-level opacity", () => {
        const obj = { name: "piece", colour: 1, opacity: 0.5 };
        migrateSheetGlyphInPlace(obj, DEFAULT_SHEET_SEARCH_ORDER);
        expect(obj).to.deep.equal({
            name: "piece",
            paint: { fill: { colour: 1, opacity: 0.5 } },
        });
        expect(obj).to.not.have.property("opacity");
    });

    it("keeps layer opacity when paint was explicit", () => {
        const obj = { name: "piece", paint: { fill: 1 }, opacity: 0.5 };
        migrateSheetGlyphInPlace(obj, DEFAULT_SHEET_SEARCH_ORDER);
        expect(obj).to.deep.equal({ name: "piece", paint: { fill: 1 }, opacity: 0.5 });
    });

    it("migrates iso face overlays without touching iso piece colour", () => {
        const rep = {
            board: { style: "squares", width: 1, height: 1 },
            legend: {
                X: {
                    piece: "cube",
                    colour: 1,
                    top: [{ name: "piece", colour: 2 }],
                },
            },
            pieces: "X",
        };
        migrateRenderJson(rep);
        expect(rep.legend.X.colour).to.equal(1);
        expect(rep.legend.X.top[0]).to.deep.equal({ name: "piece", paint: { fill: 2 } });
    });

    it("playground catalog migrates embedded render JSON", () => {
        const entry = {
            name: "test",
            render: JSON.stringify({
                board: { style: "squares", width: 1, height: 1 },
                legend: { A: { name: "piece", colour: 1 } },
                pieces: "A",
            }),
        };
        const { changed, render } = migratePlaygroundCatalogEntry(entry);
        expect(changed).to.equal(true);
        const parsed = JSON.parse(render) as { legend: { A: { paint: { fill: number } } } };
        expect(parsed.legend.A.paint.fill).to.equal(1);
    });

    it("verify finds remaining legacy fields", () => {
        const rep = {
            legend: {
                A: { name: "piece", colour: 1 },
                T: { text: "1", colour: 2 },
            },
        };
        const violations = findLegendGlyphPaintViolations(rep);
        expect(violations).to.have.length(1);
        expect(violations[0]!.path).to.equal("legend.A.colour");
    });
});
