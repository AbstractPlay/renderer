import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const navPath = join(repoRoot, "docs", "nav.json");
const docsDir = join(repoRoot, "docs");

const nav = JSON.parse(readFileSync(navPath, "utf8"));
let failed = false;

for (const item of nav) {
    const md = join(docsDir, `${item.slug}.md`);
    const indexMd = join(docsDir, item.slug, "index.md");
    const exists = (() => {
        try {
            readFileSync(md);
            return true;
        } catch {
            try {
                readFileSync(indexMd);
                return true;
            } catch {
                return false;
            }
        }
    })();
    if (!exists) {
        // eslint-disable-next-line no-console
        console.error(`docs:check:local ERROR missing page for nav slug "${item.slug}" (${md})`);
        failed = true;
    }
}

if (failed) {
    process.exit(1);
}

// eslint-disable-next-line no-console
console.log("docs:check:local OK");
