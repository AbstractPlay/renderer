/**
 * Visual debug SVG from committed topology.json (spaces + move/shoot edges).
 *
 * Usage:
 *   npx tsx scripts/render-eleven-topology-debug.ts [output.svg]
 *   npx tsx scripts/render-eleven-topology-debug.ts --pitch [output.svg]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
    ELEVEN_BOARD_TOPOLOGY,
    ELEVEN_GRAPH,
    renderElevenTopologyDebugSvg,
} from "../src/common/eleven/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const DEFAULT_OUT = path.join(REPO_ROOT, "test/fixtures/eleven-topology-render.svg");

const args = process.argv.slice(2);
const pitch = args.includes("--pitch");
const outArg = args.find((a) => a !== "--pitch");
const outPath = outArg ? path.resolve(outArg) : DEFAULT_OUT;

const svg = renderElevenTopologyDebugSvg(ELEVEN_BOARD_TOPOLOGY, {
    label: pitch ? "pitch" : "index",
    helpers: pitch ? ELEVEN_GRAPH : undefined,
});

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, svg);
console.log(outPath);
