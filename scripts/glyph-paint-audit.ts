#!/usr/bin/env node
import {
    formatGlyphPaintAuditFailure,
    runGlyphPaintAudit,
} from "../src/sheets/registry/glyphPaintAudit.js";

const writeArtifacts = process.argv.includes("--write");

const result = runGlyphPaintAudit({ writeArtifacts });

if (result.ok) {
    // eslint-disable-next-line no-console
    console.log(
        `glyph-paint-audit OK (${result.report.glyphsAudited} glyphs, ` +
            `${result.report.skippedGlyphs} skipped fixed/procedural)`,
    );
    process.exit(0);
}

// eslint-disable-next-line no-console
console.error(formatGlyphPaintAuditFailure(result));
process.exit(1);
