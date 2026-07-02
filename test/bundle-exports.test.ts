import { expect } from "chai";
import fs from "fs";
import path from "path";

const buildIndex = path.join(process.cwd(), "build", "index.js");

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
});
