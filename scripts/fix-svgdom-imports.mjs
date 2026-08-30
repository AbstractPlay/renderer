/* eslint-env node */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEST = path.join(ROOT, "test");

function walkTs(dir, out = []) {
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        if (st.isDirectory()) {
            walkTs(full, out);
        } else if (name.endsWith(".ts")) {
            out.push(full);
        }
    }
    return out;
}

let fixed = 0;
for (const file of walkTs(TEST)) {
    let content = fs.readFileSync(file, "utf8");
    if (!content.includes('require("svgdom")')) {
        continue;
    }
    const before = content;
    content = content.replace(/^\/\* eslint-disable @typescript-eslint\/no-require-imports \*\/\r?\n/m, "");
    if (!content.includes('from "svgdom"')) {
        const importEnd = content.search(/\r?\n(?!\s*(?:import|\/\/|\/\*))/);
        const insertAt = importEnd === -1 ? 0 : importEnd;
        content = `${content.slice(0, insertAt)}\nimport { createSVGWindow } from "svgdom";${content.slice(insertAt)}`;
    }
    content = content.replace(/\r?\nconst \{ createSVGWindow \} = require\("svgdom"\);\r?\n/g, "\n");
    content = content.replace(/\r?\n\/\/ const \{ createSVGWindow \} = require\("svgdom"\);\r?\n/g, "\n");
    if (content !== before) {
        fs.writeFileSync(file, content);
        fixed++;
    }
}
console.log(`fix-svgdom-imports: updated ${fixed} files`);
