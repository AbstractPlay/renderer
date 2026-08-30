/* eslint-env node */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

function walkTs(dir, out = []) {
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        if (st.isDirectory()) {
            walkTs(full, out);
        } else if (name.endsWith(".ts") && !name.endsWith(".d.ts")) {
            out.push(full);
        }
    }
    return out;
}

function resolveRelative(spec, fromFile) {
    if (!spec.startsWith(".")) {
        return spec;
    }
    if (spec.endsWith(".js") || spec.endsWith(".json")) {
        return spec;
    }
    if (spec === ".") {
        return "./index.js";
    }
    const base = path.resolve(path.dirname(fromFile), spec);
    if (fs.existsSync(`${base}.ts`) || fs.existsSync(`${base}.d.ts`)) {
        return `${spec}.js`;
    }
    if (fs.existsSync(path.join(base, "index.ts"))) {
        return `${spec}/index.js`;
    }
    return `${spec}.js`;
}

let fixed = 0;
for (const file of walkTs(SRC)) {
    let content = fs.readFileSync(file, "utf8");
    const before = content;
    content = content.replace(/from (["'])\.(["'])/g, 'from $1./index.js$2');
    content = content.replace(/from (["'])(\.[^"']+)(["'])/g, (_m, q1, spec, q2) => {
        return `from ${q1}${resolveRelative(spec, file)}${q2}`;
    });
    if (content !== before) {
        fs.writeFileSync(file, content);
        fixed++;
    }
}
console.log(`fix-nodenext-imports: updated ${fixed} files`);
