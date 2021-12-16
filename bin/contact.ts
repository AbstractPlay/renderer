import moment from "moment";
import { sheets } from "../src/sheets";

// tslint:disable-next-line: no-var-requires
const { createSVGWindow } = require("svgdom");
const window = createSVGWindow();
const document = window.document;
import { registerWindow, SVG, Svg, Symbol as SVGSymbol } from "@svgdotjs/svg.js";

// register window and document
registerWindow(window, document);

// create canvas
const canvas = SVG(document.documentElement) as Svg;

const tileSizeOuter = 200;
const tileSizeInner = 150;
const factor = tileSizeInner / tileSizeOuter;
const innerTL = (tileSizeOuter - tileSizeInner) / 2;
const numimgswide = 6;
const rowPadding = 5;
const sheetPadding = 40;
const width = tileSizeOuter * numimgswide;

const title = canvas.nested().id("title");
title.text("Renderer Contact Sheet\n(Generated " + moment().format("DD MMM YYYY") + ")").move(0, 0);

const nestedSheets = new Array();
Array.from(sheets.values()).forEach((sheet) => {
    const nstSheet = canvas.nested().id("sheet_" + sheet.name);

    // Create title
    const sheetTitle = nstSheet.nested();
    sheetTitle.plain("Sheet Name: " + sheet.name).move(0, 0);

    // Create glyph tiles
    const names = Array.from(sheet.glyphs.keys());
    const glyphs = Array.from(sheet.glyphs.values());
    const tiles = new Array();
    for (let idx = 0; idx < glyphs.length; idx++) {
        const name = names[idx];
        const glyph = glyphs[idx];
        const tile = nstSheet.nested().size(tileSizeOuter, tileSizeOuter);
        const symbol = glyph(canvas.defs());
        const used = tile.use(canvas.findOne("#" + symbol.id()) as SVGSymbol);
        // Scale it appropriately
        used.dmove(innerTL, innerTL);
        used.scale(factor, innerTL, innerTL);
        tile.plain(name).move(0, tileSizeOuter - innerTL);
        tiles.push(tile);
    }

    // Arrange tiles
    let numrows = Math.floor(names.length / numimgswide);
    if ( (names.length % numimgswide) > 0 ) {
        numrows += 1;
    }
    for (let row = 0; row < numrows; row++) {
        for (let col = 0; col < numimgswide; col++) {
            const idx = (row * numimgswide) + col;
            if (idx < tiles.length) {
                const outerx = tileSizeOuter * col;
                const outery = (tileSizeOuter * row) + rowPadding;
                tiles[idx].move(outerx, outery);
            }
        }
    }
    const height = (numrows * tileSizeOuter) + (numrows * rowPadding);
    // nstSheet.viewbox(0, 0, width, height);
    nstSheet.size(width, height);
    nestedSheets.push(nstSheet);
});

// Arrange sheets
let currY = 40;
nestedSheets.forEach((sheet: Svg) => {
    sheet.move(0, currY);
    currY += (sheet.height() as number) + sheetPadding;
});

// Calculate total image size and resize the canvas
const height = currY;
canvas.viewbox(0, 0, width, height);
// canvas.size(width, height);
canvas.rect(width, height).fill("#fff").back();

// tslint:disable-next-line: no-console
console.log(canvas.svg());
