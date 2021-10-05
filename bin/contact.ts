import moment from "moment";
import { sheets } from "../src/sheets";

// tslint:disable-next-line: no-var-requires
const { createSVGWindow } = require("svgdom");
const window = createSVGWindow();
const document = window.document;
import { registerWindow, SVG, Svg } from "@svgdotjs/svg.js";

// register window and document
registerWindow(window, document);

// create canvas
const canvas = SVG(document.documentElement) as Svg;

const tileSizeOuter = 200;
const tileSizeInner = 150;
const innerTL = (tileSizeOuter - tileSizeInner) / 2;
const numimgswide = 6;
const rowPadding = 5;
const sheetPadding = 40;

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
        const placed = glyph(tile);
        // Scale it appropriately
        placed.size(tileSizeInner);
        placed.move(innerTL, innerTL);
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
    nstSheet.height((numrows * tileSizeOuter) + (numrows * rowPadding));
    nestedSheets.push(nstSheet);
});

// Arrange sheets
let currY = 40;
nestedSheets.forEach((sheet) => {
    sheet.move(0, currY);
    currY += sheet.height() + sheetPadding;
});

// Calculate total image size and resize the canvas
const height = currY;
const width = tileSizeOuter * numimgswide;
canvas.size(width, height);

// tslint:disable-next-line: no-console
console.log(canvas.svg());
