import { expect } from "chai";
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const buildIndex = path.join(process.cwd(), "build", "index.js");
const require = createRequire(import.meta.url);

describe("bundled build exports", function () {
    before(function () {
        if (!fs.existsSync(buildIndex)) {
            this.skip();
        }
    });

    it("should export the public API from build/index.js", async () => {
        const mod = await import("../build/index.js");
        const { render, renderglyph, addPrefix, sheets } = mod.default;

        expect(render).to.be.a("function");
        expect(renderglyph).to.be.a("function");
        expect(addPrefix).to.be.a("function");
        expect(sheets).to.be.instanceOf(Map);
        expect(sheets.size).to.be.greaterThan(0);
    });

    it("should load via CommonJS require (Lambda/thumbnails path)", () => {
        const mod = require("../build/index.js");
        const api = mod.default ?? mod;
        expect(api.addPrefix).to.be.a("function");
        expect(api.render).to.be.a("function");
    });
});
