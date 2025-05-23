#!/usr/bin/env node

import { registerWindow, SVG, Svg } from "@svgdotjs/svg.js";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { sheets } from "../src/sheets";

// tslint:disable-next-line: no-unused-expression
yargs(hideBin(process.argv))
  .command("$0 <sheet> <glyph>", "export a glyph", (y) => {
      return y.positional("sheet", {
        demandOption: true,
        describe: "name of sheet where the glyph is defined",
        type: "string",
      })
      .positional("glyph", {
        demandOption: true,
        describe: "name of the glyph you wish to export",
        type: "string",
      });
    }, (a) => {
        // tslint:disable-next-line: no-console
        console.log(exportGlyph(a.sheet, a.glyph));
    })
  .scriptName("export")
  .usage("From root of project folder: npx ts-node bin/export <sheet> <glyph>")
  .help(true)
  .argv;

function exportGlyph(sheetName: string, glyphName: string): string {
    // validate input first
    if ( (sheets === undefined) || (sheetName === undefined) || (! sheets.has(sheetName)) ) {
        throw new Error("The sheet '" + sheetName + "' does not exist.");
    }
    const sheet = sheets.get(sheetName);
    if ( (sheet === undefined) || (glyphName === undefined) || (! sheet.glyphs.has(glyphName)) ) {
        throw new Error("The glyph '" + glyphName + "' does not exist in the sheet '" + sheetName + ".'");
    }
    const glyph = sheet.glyphs.get(glyphName);
    if (glyph === undefined) {
        throw new Error("The sheet and glyph were valid, but no glyph was loaded. This should never happen.");
    }

    // tslint:disable-next-line: no-var-requires
    const { createSVGWindow } = require("svgdom");
    const window = createSVGWindow();
    const document = window.document;

    // register window and document
    registerWindow(window, document);

    // create canvas
    const canvas = SVG(document.documentElement) as Svg;

    // add glyph to defs then use
    const placed = glyph(canvas.defs());
    canvas.use(placed);

    // return canvas SVG code
    return canvas.svg().replaceAll(" href=", " xlink:href=");
}
