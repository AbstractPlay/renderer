import { expect } from "chai";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const buildIndex = path.join(process.cwd(), "build", "index.js");
const buildIndexUrl = pathToFileURL(buildIndex).href;

describe("bundled build exports", function () {
    this.timeout(15_000);

    let bundled: typeof import("../build/index.js");

    before(async function () {
        if (!fs.existsSync(buildIndex)) {
            this.skip();
        }
        bundled = await import(buildIndexUrl);
    });

    it("should export the public API from build/index.js", () => {
        const { render, renderglyph, addPrefix, sheets } = bundled.default;

        expect(render).to.be.a("function");
        expect(renderglyph).to.be.a("function");
        expect(addPrefix).to.be.a("function");
        expect(sheets).to.be.instanceOf(Map);
        expect(sheets.size).to.be.greaterThan(0);
    });
});
