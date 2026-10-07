/**
 * Render move/shoot connection paths from the eleven board algorithm (tuning aid).
 *
 * Usage: npx tsx scripts/render-eleven-connection-debug.ts [output.svg]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ELEVEN_BOARD_TOPOLOGY } from "../src/common/eleven/index.js";
import { elevenConnectionPathBatch } from "../src/boards/eleven/connections.js";
import { ELEVEN_DEFAULT_CONNECTION_BOW } from "../src/boards/eleven/resolveOptions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const DEFAULT_OUT = path.join(REPO_ROOT, "test/fixtures/eleven-connections-render.svg");

const outPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_OUT;
const topology = ELEVEN_BOARD_TOPOLOGY;
const bow = ELEVEN_DEFAULT_CONNECTION_BOW;
const pad = topology.padding ?? 8;
const { originX, originY, cellW, cellH, cols, rows } = topology.grassGrid;
const maxX = originX + cols * cellW + pad;
const maxY = originY + rows * cellH + pad;

const move = elevenConnectionPathBatch(topology, bow, topology.moveEdges);
const shoot = elevenConnectionPathBatch(topology, bow, topology.shootEdges);

const parts: string[] = [];
for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        const x = originX + col * cellW;
        const y = originY + row * cellH;
        const fill = (row + col) % 2 === 0 ? "#e8f4c8" : "#d0e8a0";
        parts.push(`<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="${fill}"/>`);
    }
}
for (const s of topology.spaces) {
    parts.push(`<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="none" stroke="#ccc" stroke-width="1"/>`);
}
for (const d of move) {
    parts.push(`<path d="${d}" fill="none" stroke="#559f00" stroke-width="3" stroke-linecap="round"/>`);
}
for (const d of shoot) {
    parts.push(
        `<path d="${d}" fill="none" stroke="#559f00" stroke-width="3" stroke-dasharray="9 18" stroke-linecap="round"/>`,
    );
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${maxX}" height="${maxY}" viewBox="0 0 ${maxX} ${maxY}">
  <title>Eleven connection paths (bow=${bow})</title>
  ${parts.join("\n  ")}
</svg>
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, svg);
console.log(outPath);
