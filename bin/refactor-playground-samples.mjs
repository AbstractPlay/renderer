#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const playgroundPath = path.join(__dirname, "..", "test", "playground.js");
const source = fs.readFileSync(playgroundPath, "utf8");
const startMarker = "var samples = ";
const startIdx = source.indexOf(startMarker);
if (startIdx < 0) throw new Error("samples block not found");

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
        if (ch === inString) inString = null;
        continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
        inString = ch;
        continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
        depth--;
        if (depth === 0) {
            objEnd = i + 1;
            break;
        }
    }
}

const replacement = "var samples = PLAYGROUND_SAMPLES;";
const updated = source.slice(0, startIdx) + replacement + source.slice(objEnd);
fs.writeFileSync(playgroundPath, updated, "utf8");
console.log("Updated test/playground.js to use PLAYGROUND_SAMPLES");
