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
        expect(Math.max(parts[2], parts[3])).to.be.lessThan(48, "viewbox should not retain Wikimedia 55px padding");
        expect(block).to.include("M21.");
    });

    it("fairy traditional glyphs avoid oversized Wikimedia viewboxes", () => {
        const chessTs = fs.readFileSync("src/sheets/chess.ts", "utf8");
        const fairy = [
            "amazon", "archbishop", "boat", "centaur", "champion", "chancellor", "commoner",
            "dabbaba", "dragon", "elephant", "ferz", "fool", "giraffe", "mann", "nightrider",
            "short-rook", "unicorn", "wazir", "wizard", "zebra",
        ];
        for (const piece of fairy) {
            for (const variant of ["outline", "solid"]) {
                const name = `chess-${piece}-${variant}-traditional`;
                const block = extractGlyphBlock(chessTs, name);
                const vb = block.match(/symbol\.viewbox\(([^)]+)\)/);
                expect(vb, name).to.not.equal(null);
                const parts = vb![1].split(",").map((s) => Number.parseFloat(s.trim()));
                const maxDim = Math.max(parts[2], parts[3]);
                expect(maxDim, `${name} viewbox max`).to.be.lessThan(48);
                expect(vb![1], `${name} Wikimedia padding`).to.not.match(/-5\.1,\s*-5\.1,\s*55\.2,\s*55\.2/);
            }
        }
    });

    it("short rook renders smaller than standard rook", () => {
        const chessTs = fs.readFileSync("src/sheets/chess.ts", "utf8");
        const maxDim = (name: string): number => {
            const block = extractGlyphBlock(chessTs, name);
            const vb = block.match(/symbol\.viewbox\(([^)]+)\)/)!;
            const parts = vb[1].split(",").map((s) => Number.parseFloat(s.trim()));
            return Math.max(parts[2], parts[3]);
        };
        expect(maxDim("chess-short-rook-outline-traditional")).to.be.lessThan(
            maxDim("chess-rook-outline-traditional"),
        );
        expect(maxDim("chess-short-rook-solid-traditional")).to.be.lessThan(
            maxDim("chess-rook-solid-traditional"),
        );
    });
});
