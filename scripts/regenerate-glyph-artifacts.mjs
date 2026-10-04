/**
 * Regenerate committed artifacts after editing sheet glyphs (contact sheet + slot catalog).
 * With --verify: regenerate then fail if git would diff any committed output (CI).
 */
import { spawnSync } from "child_process";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const verify = process.argv.includes("--verify");
const require = createRequire(import.meta.url);

/** Paths checked into git; must match CI verify-glyphs step. */
const COMMITTED_GLYPH_ARTIFACT_PATHS = [
    "contact.png",
    "docs/contact-sheet.svg",
    "docs/fonts/dejavu-sans.ttf",
    "src/sheets/registry/glyph-slots.catalog.json",
    "docs/glyph-slots.md",
];

const GENERATED_JSON = /"generated"\s*:\s*"[^"]*"/;

function runTsxScript(relativeScript) {
    const tsxCli = require.resolve("tsx/cli");
    const scriptPath = join(repoRoot, relativeScript);
    const result = spawnSync(process.execPath, [tsxCli, scriptPath], {
        cwd: repoRoot,
        stdio: "inherit",
        env: process.env,
    });
    if (result.error) {
        // eslint-disable-next-line no-console
        console.error(result.error.message);
        process.exit(1);
    }
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

function readGitHeadBytes(relPath) {
    const result = spawnSync("git", ["show", `HEAD:${relPath}`], {
        cwd: repoRoot,
        encoding: "buffer",
        maxBuffer: 64 * 1024 * 1024,
    });
    if (result.status !== 0) {
        return null;
    }
    return result.stdout;
}

/** Compare regenerated files to HEAD; ignore volatile catalog `generated` timestamp. */
function glyphArtifactsMatchHead() {
    for (const relPath of COMMITTED_GLYPH_ARTIFACT_PATHS) {
        const absPath = join(repoRoot, relPath);
        if (!existsSync(absPath)) {
            return false;
        }
        const headBytes = readGitHeadBytes(relPath);
        if (headBytes === null) {
            return false;
        }
        const diskBytes = readFileSync(absPath);
        if (relPath === "src/sheets/registry/glyph-slots.catalog.json") {
            const headText = headBytes.toString("utf8").replace(GENERATED_JSON, '"generated": "<verify>"');
            const diskText = diskBytes.toString("utf8").replace(GENERATED_JSON, '"generated": "<verify>"');
            if (headText !== diskText) {
                return false;
            }
            continue;
        }
        if (!headBytes.equals(diskBytes)) {
            return false;
        }
    }
    return true;
}

function printHeadDiff() {
    spawnSync(
        "git",
        ["diff", "HEAD", "--", ...COMMITTED_GLYPH_ARTIFACT_PATHS],
        { cwd: repoRoot, stdio: "inherit" },
    );
}

runTsxScript("scripts/contact-export.ts");
runTsxScript("scripts/glyph-catalog.ts");
runTsxScript("scripts/glyph-paint-audit.ts");

if (verify) {
    if (!glyphArtifactsMatchHead()) {
        printHeadDiff();
        // eslint-disable-next-line no-console
        console.error(
            "Committed glyph artifacts are out of date. Run `npm run regenerate-glyphs` and commit the changes.",
        );
        process.exit(1);
    }
    // eslint-disable-next-line no-console
    console.log("verify-glyphs OK");
}
