import { expect } from "chai";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const buildIndex = path.join(process.cwd(), "build", "index.js");
const buildIndexUrl = pathToFileURL(buildIndex).href;
const buildEleven = path.join(process.cwd(), "build", "eleven", "index.js");
const buildElevenUrl = pathToFileURL(buildEleven).href;

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
        const {
            render,
            renderglyph,
            renderSheetGlyph,
            renderLegendGlyph,
            renderInlineGlyph,
            addPrefix,
            sheets,
        } = bundled.default;

        expect(render).to.be.a("function");
        expect(renderglyph).to.be.a("function");
        expect(renderSheetGlyph).to.be.a("function");
        expect(renderLegendGlyph).to.be.a("function");
        expect(renderInlineGlyph).to.be.a("function");
        expect(addPrefix).to.be.a("function");
        expect(sheets).to.be.instanceOf(Map);
        expect(sheets.size).to.be.greaterThan(0);
    });

    it("should export eleven graph helpers from build/eleven/index.js", async function () {
        if (!fs.existsSync(buildEleven)) {
            this.skip();
        }
        const eleven = await import(buildElevenUrl);
        expect(eleven.ELEVEN_GRAPH.spaces).to.have.length(65);
        expect(eleven.elevenPitchId(eleven.ELEVEN_GRAPH, 0)).to.be.a("string");
        expect(eleven.parsePitchId("C").kind).to.equal("center");
    });
});
