#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { buildGlyphCatalogFromSheets, renderGlyphSlotsMarkdown } from "../src/sheets/registry/buildGlyphCatalog.js";
import { reloadGlyphCatalogFromDisk, toAuthorCatalog } from "../src/sheets/registry/glyphRegistry.js";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

function main(): void {
    const catalog = buildGlyphCatalogFromSheets();
    const catalogPath = join(repoRoot, "src", "sheets", "registry", "glyph-slots.catalog.json");
    writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

    mkdirSync(join(repoRoot, "build"), { recursive: true });
    writeFileSync(join(repoRoot, "build", "glyph-slots.json"), `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

    const author = toAuthorCatalog(catalog);
    writeFileSync(
        join(repoRoot, "build", "glyph-slots-author.json"),
        `${JSON.stringify(author, null, 2)}\n`, "utf8",
    );

    writeFileSync(
        join(repoRoot, "docs", "glyph-slots.md"),
        renderGlyphSlotsMarkdown(catalog),
        "utf8",
    );

    // eslint-disable-next-line no-console
    console.log(
        `Wrote ${Object.keys(catalog.glyphs).length} glyphs to src/sheets/registry/glyph-slots.catalog.json, ` +
        "build/glyph-slots.json, build/glyph-slots-author.json, and docs/glyph-slots.md",
    );
    reloadGlyphCatalogFromDisk();
}

main();
