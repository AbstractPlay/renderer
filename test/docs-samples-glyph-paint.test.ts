import { expect } from "chai";
import fs from "node:fs";
import path from "node:path";
import "mocha";
import { findLegendGlyphPaintViolations } from "../src/tools/migrateGlyphPaint.js";

describe("docs samples glyph paint", () => {
    const samplesDir = path.join(process.cwd(), "docs", "samples");

    it("named legend glyphs use paint, not colour/colour2", () => {
        const files = fs.readdirSync(samplesDir).filter((f) => f.endsWith(".json"));
        const offenders: string[] = [];
        for (const file of files) {
            const rep = JSON.parse(fs.readFileSync(path.join(samplesDir, file), "utf8")) as Record<
                string,
                unknown
            >;
            for (const v of findLegendGlyphPaintViolations(rep)) {
                offenders.push(`${file}: ${v.path}`);
            }
        }
        expect(offenders, offenders.join("\n")).to.deep.equal([]);
    });

    it("pieces-text.json keeps colour on text layers", () => {
        const rep = JSON.parse(
            fs.readFileSync(path.join(samplesDir, "pieces-text.json"), "utf8"),
        ) as {
            legend: { AQ: Array<{ text?: string; colour?: string }> };
        };
        expect(rep.legend.AQ[1]).to.have.property("colour", "#000");
        expect(rep.legend.AQ[1]).to.not.have.property("paint");
    });
});
