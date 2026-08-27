"use strict";

const { expect } = require("chai");
const fs = require("fs");
const path = require("path");

const buildIndex = path.join(process.cwd(), "build", "index.js");

describe("bundled build CJS require", function () {
    before(function () {
        if (!fs.existsSync(buildIndex)) {
            this.skip();
        }
    });

    it("should load via CommonJS require (Lambda/thumbnails path)", () => {
        const mod = require("../build/index.js");
        const api = mod.default ?? mod;
        expect(api.addPrefix).to.be.a("function");
        expect(api.render).to.be.a("function");
    });
});
