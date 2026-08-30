import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** IIFE browser bundle for dokuwiki and legacy APRender.min.js consumers. */
export default defineConfig({
    build: {
        lib: {
            entry: path.resolve(repoRoot, "src/index.ts"),
            name: "APRender",
            formats: ["iife"],
            fileName: () => "APRender.min.js",
        },
        outDir: path.resolve(repoRoot, "dist"),
        emptyOutDir: false,
        sourcemap: true,
        commonjsOptions: {
            transformMixedEsModules: true,
        },
    },
    resolve: {
        alias: {
            "@abstractplay/renderer": path.resolve(repoRoot, "src/index.ts"),
        },
    },
    define: {
        global: "globalThis",
    },
});
