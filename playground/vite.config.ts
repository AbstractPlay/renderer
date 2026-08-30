import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const playgroundDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(playgroundDir, "..");

/** Vite playground — dev server and production build to dist/ for S3 deploy. */
export default defineConfig(({ mode }) => ({
    root: playgroundDir,
    resolve: {
        alias: {
            "@abstractplay/renderer": path.resolve(repoRoot, "src/index.ts"),
        },
    },
    define: {
        global: "globalThis",
    },
    server: {
        port: 3000,
        strictPort: true,
        open: false,
        fs: {
            allow: [repoRoot],
        },
    },
    preview: {
        port: 4173,
        strictPort: true,
    },
    build: {
        outDir: path.resolve(repoRoot, "dist"),
        emptyOutDir: true,
        sourcemap: mode !== "production",
        commonjsOptions: {
            transformMixedEsModules: true,
        },
        rollupOptions: {
            input: {
                index: path.join(playgroundDir, "index.html"),
                playground: path.join(playgroundDir, "playground.html"),
                harness: path.join(playgroundDir, "harness.html"),
            },
        },
    },
}));
