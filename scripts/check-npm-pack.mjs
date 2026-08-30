/* eslint-env node */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const REQUIRED = [
    "build/index.js",
    "build/renderers/index.js",
    "build/sheets/index.js",
    "build/schemas/schema.json",
];

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(npmCmd, ["pack", "--dry-run"], {
    cwd: ROOT,
    encoding: "utf8",
});

if (result.status !== 0) {
    console.error(result.stderr || result.stdout || "npm pack --dry-run failed");
    process.exit(result.status ?? 1);
}

const combined = `${result.stdout}\n${result.stderr}`;
const missing = REQUIRED.filter((rel) => !combined.includes(rel));

if (missing.length > 0) {
    console.error(`check-npm-pack: tarball would omit required runtime files:\n  ${missing.join("\n  ")}`);
    process.exit(1);
}

console.log("check-npm-pack: required build/*.js and schema present in pack");
