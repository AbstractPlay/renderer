/* eslint-env node */
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

try {
    const mod = await import(pathToFileURL(path.join(ROOT, "build", "index.js")).href);
    const api = mod.default ?? mod;
    const { render, renderglyph, addPrefix, sheets } = api;

    if (typeof render !== "function" || typeof renderglyph !== "function") {
        throw new Error("build/index.js missing render exports");
    }
    if (typeof addPrefix !== "function") {
        throw new Error("build/index.js missing addPrefix");
    }
    if (!(sheets instanceof Map) || sheets.size === 0) {
        throw new Error("build/index.js missing sheets map");
    }
    console.log("smoke-esm-entry: import(build/index.js) OK");
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`smoke-esm-entry: ${message}`);
    process.exit(1);
}
