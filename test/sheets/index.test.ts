/* tslint:disable:no-console */

import "mocha";
import { sheets } from "../../src/sheets";

describe("All glyph sheets", () => {
    it("explicit ids should match internal SVG ids", () => {
        const window = require("svgdom");
        const SVG = require("svg.js")(window);
        const document = window.document;
        Array.from(sheets.values()).forEach((sheet) => {
            sheet.glyphs.forEach((v, k) => {
                const canvas: svgjs.Doc = SVG(document.documentElement);
                v(canvas.defs());
                const retrieved = SVG.get(k);
                if ( (retrieved === undefined) || (retrieved === null) ) {
                    throw new Error("ID mismatch for glyph '" + k + "'");
                }
            });
        });
    });
});

describe("Default glyph sheet", () => {
    it("should be in alphabetical order", (done) => {
        const fs = require("fs");
        const readline = require("readline");
        const reGlyph: RegExp = /^sheet\.glyphs\.set\(\"(\S+)\"/;

        const rl = readline.createInterface({
            crlfDelay: Infinity,
            input: fs.createReadStream("src/sheets/default.ts"),
        });

        let error: Error;
        const names: Array<string> = new Array();
        rl.on("line", (line: string) => {
            const m = reGlyph.exec(line);
            if (m !== null) {
                const name = m[1];
                if (names.length === 0) {
                    names.push(name);
                } else if (name < names[names.length - 1]) {
                    if (error === undefined) {
                        error = new Error("The glyph '" + name + "' is out of order");
                    }
                } else {
                    names.push(name);
                }
            }
        });
        rl.on("close", () => done(error));
    });
});
