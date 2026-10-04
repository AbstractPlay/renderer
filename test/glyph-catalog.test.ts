import { expect } from "chai";
import "mocha";
import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { buildGlyphCatalogFromSheets } from "../src/sheets/registry/buildGlyphCatalog.js";
import {
    catalogKey,
    getGlyphCatalog,
    resetGlyphCatalogFromModule,
    toAuthorCatalog,
} from "../src/sheets/registry/glyphRegistry.js";
import { inferSlotsFromSymbol } from "../src/sheets/registry/inferSlots.js";
import { invokeGlyphBuild } from "../src/sheets/registry/defineGlyph.js";
import { CoreSheet } from "../src/sheets/contact/core.js";
import { registerWindow, SVG, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

describe("glyph catalog", () => {
    it("buildGlyphCatalogFromSheets includes core:piece with fill and border slots", () => {
        const catalog = buildGlyphCatalogFromSheets();
        const piece = catalog.glyphs[catalogKey("core", "piece")];
        expect(piece).to.not.equal(undefined);
        expect(piece!.slots.fill).to.not.equal(undefined);
        expect(piece!.slots.border).to.not.equal(undefined);
        expect(piece!.slots.fill!.channels).to.include("fill");
        expect(piece!.slots.border!.channels).to.include("stroke");
    });

    it("committed glyph-slots.catalog.json matches live inference for piece", () => {
        resetGlyphCatalogFromModule();
        const fromFile = getGlyphCatalog().glyphs[catalogKey("core", "piece")];
        expect(fromFile).to.not.equal(undefined);
        expect(Object.keys(fromFile!.slots).sort()).to.deep.equal(["border", "fill"]);
    });

    it("author export omits colour2Slot and paintMode", () => {
        const catalog = buildGlyphCatalogFromSheets();
        const author = toAuthorCatalog(catalog);
        const sample = author.glyphs[catalogKey("core", "piece")];
        expect(sample).to.not.equal(undefined);
        expect(sample).to.not.have.property("colour2Slot");
        expect(sample).to.not.have.property("paintMode");
        const raw = JSON.stringify(author);
        expect(raw).to.not.include("colour2Slot");
        expect(raw).to.not.include("shadingProfile");
    });

    it("d6-1 uses detail colour2Slot in internal catalog", () => {
        resetGlyphCatalogFromModule();
        const entry = getGlyphCatalog().glyphs[catalogKey("dice", "d6-1")];
        expect(entry?.colour2Slot).to.equal("detail");
        expect(entry?.slots.detail).to.not.equal(undefined);
    });

    it("inferSlotsFromSymbol maps legacy playerfill2 using colour2Slot", () => {
        const window = createSVGWindow();
        registerWindow(window, window.document);
        const canvas = SVG(window.documentElement) as Svg;
        const build = CoreSheet.glyphs.get("piece");
        expect(build).to.not.equal(undefined);
        const symbol = invokeGlyphBuild(build!, canvas.defs() as Svg);
        const borderDefault = inferSlotsFromSymbol(symbol, "border");
        expect(borderDefault.fill).to.not.equal(undefined);
        expect(borderDefault.border).to.not.equal(undefined);
    });

    it("docs/glyph-slots.md exists after catalog generation", () => {
        const md = readFileSync(join(repoRoot, "docs", "glyph-slots.md"), "utf8");
        expect(md).to.include("core");
        expect(md).to.include("`piece`");
    });
});
