/* tslint:disable:no-console */

import "mocha";
import { sheets } from "../../src/sheets";

describe("Glyph sheets", () => {
    it ("sheet names should match the file name", () => {
        const fs = require("fs");
        fs
            .readdirSync("src/sheets/")
            .filter((file: string) => (file.indexOf(".") !== 0) && (! file.startsWith("index")) && (file.slice(-3) === ".ts"))
            .forEach((file: string) => {
                const root = file.slice(0, -3);
                if (! sheets.has(root)) {
                    throw new Error("There is not a parsed sheet with the same name as '" + root + "'");
                }
            });
    });

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

    it("should be in alphabetical order", (done) => {
        const fs = require("fs");
        const readline = require("readline");
        const reGlyph: RegExp = /^sheet\.glyphs\.set\(\"(\S+)\"/;

        fs
            .readdirSync("src/sheets/")
            .filter((file: string) => (file.indexOf(".") !== 0) && (file.slice(-3) === ".ts"))
            .forEach((file: string) => {
                const full = "src/sheets/" + file;

                const rl = readline.createInterface({
                    crlfDelay: Infinity,
                    input: fs.createReadStream(full),
                });

                const names: Array<string> = new Array();
                rl.on("line", (line: string) => {
                    const m = reGlyph.exec(line);
                    if (m !== null) {
                        const name = m[1];
                        if (names.length === 0) {
                            names.push(name);
                        } else if (name < names[names.length - 1]) {
                            throw new Error("Glyph sheet: " + file + "\nThe glyph '" + name + "' is out of order");
                        } else {
                            names.push(name);
                        }
                    }
                });
            });
        done();
    });
});
