import { expect } from "chai";
import fs from "node:fs";
import path from "node:path";
import "mocha";

const jsonPath = path.join(process.cwd(), "test", "fixtures", "playground-samples.json");
const jsPath = path.join(process.cwd(), "test", "playground-samples.js");

describe("playground samples catalog", () => {
    it("playground-samples.js matches playground-samples.json keys", () => {
        const json = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as Record<string, unknown>;
        const jsSource = fs.readFileSync(jsPath, "utf8");
        const match = jsSource.match(/var PLAYGROUND_SAMPLES = (\{[\s\S]*\});/);
        expect(match).to.not.equal(null);

        const fromJs = JSON.parse(match![1]!) as Record<string, unknown>;        expect(Object.keys(fromJs).sort()).to.deep.equal(Object.keys(json).sort());
    });

    it("includes niche-areas-track regression sample", () => {
        const json = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as Record<string, { render: string }>;
        expect(json).to.have.property("niche-areas-track");
        const rep = JSON.parse(json["niche-areas-track"]!.render) as {
            areas?: Array<{ type: string; position: string }>;
        };
        expect(rep.areas?.[0]?.type).to.equal("track");
        expect(rep.areas?.[0]?.position).to.equal("bottom");
    });
});
