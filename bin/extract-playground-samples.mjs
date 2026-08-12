#!/usr/bin/env node
/**
 * One-time / maintenance: extract `var samples = { ... }` from test/playground.js
 * into test/fixtures/playground-samples.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const playgroundPath = path.join(root, "test", "playground.js");
const outPath = path.join(root, "test", "fixtures", "playground-samples.json");

const source = fs.readFileSync(playgroundPath, "utf8");
const startMarker = "var samples = ";
const startIdx = source.indexOf(startMarker);
if (startIdx < 0) {
    throw new Error("Could not find `var samples =` in test/playground.js");
}

const objStart = startIdx + startMarker.length;
let depth = 0;
let inString = null;
let escape = false;
let objEnd = -1;

for (let i = objStart; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
        if (escape) {
            escape = false;
            continue;
        }
        if (ch === "\\") {
            escape = true;
            continue;
        }
        if (ch === inString) {
            inString = null;
        }
        continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
        inString = ch;
        continue;
    }
    if (ch === "{") {
        depth++;
    } else if (ch === "}") {
        depth--;
        if (depth === 0) {
            objEnd = i + 1;
            break;
        }
    }
}

if (objEnd < 0) {
    throw new Error("Could not find end of samples object");
}

const samplesExpr = source.slice(objStart, objEnd);
const samples = vm.runInNewContext(`(${samplesExpr})`, {}, { timeout: 5000 });

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(samples, null, 2) + "\n", "utf8");
console.log(`Wrote ${Object.keys(samples).length} samples to ${outPath}`);
