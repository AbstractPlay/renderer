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
        throw new Error("The glyph '" + glyphName + "' does not exist in the sheet '" + glyphName + ".'");
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

    // add glyph to defs section
    const defd = glyph(canvas.defs());
    // get size of glyph
    const tileSize = defd.attr("data-cellsize");
    if ( (tileSize === null) || (tileSize === undefined) ) {
        throw new Error("The glyph does not have appropriate size metadata. This should never happen.");
    }
    // resize SVG container
    canvas.size(tileSize, tileSize);
    // add glyph to canvas
    const placed = canvas.use(defd);
    placed.move(0, 0);
    // return canvas SVG code
    return canvas.svg();
}
