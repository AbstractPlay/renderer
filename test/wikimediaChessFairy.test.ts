import "mocha";
import { expect } from "chai";
import fs from "node:fs";

function extractGlyphBlock(source: string, glyphName: string): string {
    const marker = `sheet.glyphs.set("${glyphName}"`;
    const start = source.indexOf(marker);
    expect(start).to.be.greaterThan(-1, `missing glyph ${glyphName}`);
    const end = source.indexOf("\n});", start);
    expect(end).to.be.greaterThan(start, `unterminated glyph ${glyphName}`);
    return source.slice(start, end);
}

/**
 * Regression guards for Wikimedia fairy-chess solid glyph emit rules.
 * Champion T bars must stay stroke2 (open paths with relative h/v segments).
 */
describe("Wikimedia fairy chess import", () => {
    it("champion solid T uses data-playerstroke2", () => {
        const chessTs = fs.readFileSync("src/sheets/chess.ts", "utf8");
        const block = extractGlyphBlock(chessTs, "chess-champion-solid-traditional");
        expect(block).to.include("M18.5 19h8");
        expect(block).to.include("M22.5 19v12");
        expect(block).to.match(/M18\.5 19h8[\s\S]*data-playerstroke2/);
        expect(block).to.match(/M22\.5 19v12[\s\S]*data-playerstroke2/);
    });

    it("giraffe solid horns stay black strokeOnly", () => {
        const chessTs = fs.readFileSync("src/sheets/chess.ts", "utf8");
        const block = extractGlyphBlock(chessTs, "chess-giraffe-solid-traditional");
        expect(block).to.match(/m17\.6,4\.8[\s\S]*\.stroke\(\{color: "#000"/);
        expect(block).to.match(/m22\.7,11[\s\S]*\.stroke\(\{color: "#000"/);
        expect(block).not.to.match(/m17\.6,4\.8[\s\S]*data-playerstroke2/);
    });

    it("nightrider outline eye uses fill2 white on blindfold", () => {
        const chessTs = fs.readFileSync("src/sheets/chess.ts", "utf8");
        const block = extractGlyphBlock(chessTs, "chess-nightrider-outline-traditional");
        expect(block).to.match(/M15\.8 14\.751[\s\S]*data-playerfill2[\s\S]*\.fill\("#fff"\)/);
    });

    it("nightrider solid scales to ~45px tile like knight", () => {
        const chessTs = fs.readFileSync("src/sheets/chess.ts", "utf8");
        const block = extractGlyphBlock(chessTs, "chess-nightrider-solid-traditional");
        const vb = block.match(/symbol\.viewbox\(([^)]+)\)/);
        expect(vb).to.not.equal(null);
        const parts = vb![1].split(",").map((s) => Number.parseFloat(s.trim()));
        expect(parts[2]).to.be.greaterThan(30, "viewbox width should match knight-scale tile");
        expect(parts[3]).to.be.greaterThan(30, "viewbox height should match knight-scale tile");
        expect(block).to.include("M21.");
    });
});
