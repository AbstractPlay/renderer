#!/usr/bin/env node
/**
 * Generate browser shims from test/fixtures/playground-samples.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const jsonPath = path.join(root, "test", "fixtures", "playground-samples.json");

const samples = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const body = `/* eslint-disable */\n/* AUTO-GENERATED from test/fixtures/playground-samples.json — run: node bin/sync-playground-samples.mjs */\nvar PLAYGROUND_SAMPLES = ${JSON.stringify(samples)};\n`;

const targets = [
    path.join(root, "test", "playground-samples.js"),
    path.join(root, "test", "browser", "playground-samples.js"),
];

for (const target of targets) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, body, "utf8");
    console.log(`Wrote ${target}`);
}
