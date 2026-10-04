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

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

describe("glyph catalog", () => {
    it("committed glyph-slots.catalog.json matches live build for core:piece", () => {
        resetGlyphCatalogFromModule();
        const live = buildGlyphCatalogFromSheets().glyphs[catalogKey("core", "piece")];
        const fromFile = getGlyphCatalog().glyphs[catalogKey("core", "piece")];
        expect(fromFile).to.not.equal(undefined);
        expect(fromFile!.slots).to.deep.equal(live!.slots);
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

    it("docs/glyph-slots.md exists after catalog generation", () => {
        const md = readFileSync(join(repoRoot, "docs", "glyph-slots.md"), "utf8");
        expect(md).to.include("core");
        expect(md).to.include("`piece`");
    });
});
