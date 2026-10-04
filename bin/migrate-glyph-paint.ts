#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
    findLegendGlyphPaintViolations,
    migratePlaygroundCatalogEntry,
    migrateRenderJson,
    type GlyphPaintViolation,
    type PlaygroundCatalogEntry,
} from "../src/tools/migrateGlyphPaint.js";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

function usage(): never {
    // eslint-disable-next-line no-console
    console.error(`Usage: migrate-glyph-paint [--verify | --write] [files...]

  --verify   Fail if any named legend glyph still uses colour/colour2 (default)
  --write    Migrate legend sheet glyphs to paint in place

Default paths: docs/samples/*.json, test/fixtures/playground-samples.json`);
    process.exit(2);
}

function expandDefaultPaths(): string[] {
    const samplesDir = join(repoRoot, "docs", "samples");
    const files = readdirSync(samplesDir)
        .filter((f) => f.endsWith(".json"))
        .map((f) => join(samplesDir, f));
    files.push(join(repoRoot, "test", "fixtures", "playground-samples.json"));
    return files;
}

function processRenderFile(path: string, write: boolean): GlyphPaintViolation[] {
    const raw = readFileSync(path, "utf8");
    const rel = relative(repoRoot, path);

    if (path.endsWith("playground-samples.json")) {
        const catalog = JSON.parse(raw) as Record<string, PlaygroundCatalogEntry>;
        let fileChanged = false;
        const allViolations: GlyphPaintViolation[] = [];
        for (const [key, entry] of Object.entries(catalog)) {
            const { changed, render, violations } = migratePlaygroundCatalogEntry(entry);
            for (const v of violations) {
                allViolations.push({ ...v, path: `${rel}.${key}${v.path.startsWith("legend") ? v.path.slice(6) : v.path}` });
            }
            if (write && changed) {
                entry.render = render;
                fileChanged = true;
            }
        }
        if (write && fileChanged) {
            writeFileSync(path, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
        }
        return allViolations;
    }

    const rep = JSON.parse(raw) as Record<string, unknown>;
    const violations = findLegendGlyphPaintViolations(rep);
    if (write && violations.length > 0) {
        migrateRenderJson(rep);
        writeFileSync(path, `${JSON.stringify(rep, null, 2)}\n`, "utf8");
    }
    return violations.map((v) => ({ ...v, path: `${rel}.${v.path}` }));
}

function main(): void {
    const args = process.argv.slice(2);
    let write = false;
    let verify = false;
    const paths: string[] = [];

    for (const arg of args) {
        if (arg === "--write") {
            write = true;
        } else if (arg === "--verify") {
            verify = true;
        } else if (arg === "-h" || arg === "--help") {
            usage();
        } else {
            paths.push(resolve(arg));
        }
    }

    if (!write && !verify) {
        verify = true;
    }
    if (write && verify) {
        // eslint-disable-next-line no-console
        console.error("Use either --write or --verify, not both.");
        process.exit(2);
    }

    const targets = paths.length > 0 ? paths : expandDefaultPaths();
    const allViolations: Array<GlyphPaintViolation & { path: string }> = [];

    for (const path of targets) {
        allViolations.push(...processRenderFile(path, write));
    }

    if (write) {
        // eslint-disable-next-line no-console
        console.log(`Migrated ${targets.length} file(s).`);
        return;
    }

    if (allViolations.length === 0) {
        // eslint-disable-next-line no-console
        console.log(`OK — no legacy colour/colour2 on named legend glyphs (${targets.length} files).`);
        return;
    }

    // eslint-disable-next-line no-console
    console.error(`Found ${allViolations.length} legacy sheet glyph colour field(s):`);
    for (const v of allViolations.slice(0, 50)) {
        // eslint-disable-next-line no-console
        console.error(`  ${v.path} (${v.reason})`);
    }
    if (allViolations.length > 50) {
        // eslint-disable-next-line no-console
        console.error(`  … and ${allViolations.length - 50} more`);
    }
    process.exit(1);
}

main();
