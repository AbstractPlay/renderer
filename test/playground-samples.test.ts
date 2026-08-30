import { expect } from "chai";
import fs from "node:fs";
import path from "node:path";
import "mocha";

const jsonPath = path.join(process.cwd(), "test", "fixtures", "playground-samples.json");

describe("playground samples catalog", () => {
    it("playground-samples.json has at least one sample with render JSON", () => {
        const json = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as Record<string, { name: string; render: string }>;
        const keys = Object.keys(json);
        expect(keys.length).to.be.greaterThan(0);
        for (const key of keys) {
            expect(json[key]).to.have.property("name");
            expect(json[key]).to.have.property("render");
            JSON.parse(json[key]!.render);
        }
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
