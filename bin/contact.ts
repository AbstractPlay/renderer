import { sheets } from "../src/sheets";
import { registerWindow, SVG, Svg } from "@svgdotjs/svg.js";

/** SVG viewBox width (user units at 96 DPI baseline). */
export const CONTACT_SHEET_VIEWBOX_WIDTH = 1200;

/** Bundled font for contact sheet labels (DejaVu Sans, OFL). */
export const CONTACT_SHEET_FONT_FAMILY = "DejaVu Sans";

/** Relative URL from contact-sheet.svg on the docs site. */
export const CONTACT_SHEET_FONT_URL = "fonts/dejavu-sans.ttf";

const TITLE_SIZE = 28;
const SHEET_TITLE_SIZE = 20;
const GLYPH_LABEL_SIZE = 15;
const GLYPH_LABEL_SIZE_MIN = 9;
const GLYPH_LABEL_PADDING = 20;

function contactText(parent: Svg, content: string, size: number): ReturnType<Svg["text"]> {
    return parent.text(content).font({
        family: CONTACT_SHEET_FONT_FAMILY,
        size,
        anchor: "start",
        fill: "#000",
    });
}

function contactLabelText(
    parent: Svg,
    content: string,
    size: number,
    x: number,
    y: number,
): ReturnType<Svg["text"]> {
    return parent.text(content).font({
        family: CONTACT_SHEET_FONT_FAMILY,
        size,
        anchor: "middle",
        fill: "#000",
    }).attr({ x, y });
}

function splitLabelAtHyphen(name: string): [string, string] {
    const hyphenIndices: number[] = [];
    for (let i = 0; i < name.length; i++) {
        if (name[i] === "-") {
            hyphenIndices.push(i);
        }
    }
    if (hyphenIndices.length === 0) {
        const mid = Math.ceil(name.length / 2);
        return [name.slice(0, mid), name.slice(mid)];
    }
    const target = name.length / 2;
    let best = hyphenIndices[0];
    for (const h of hyphenIndices) {
        if (Math.abs(h - target) < Math.abs(best - target)) {
            best = h;
        }
    }
    return [name.slice(0, best), name.slice(best + 1)];
}

function fitGlyphLabel(
    tile: Svg,
    name: string,
    tileSizeOuter: number,
    innerTL: number,
): void {
    const maxWidth = tileSizeOuter - GLYPH_LABEL_PADDING;
    const centerX = tileSizeOuter / 2;
    const baselineY = tileSizeOuter - innerTL;

    let size = GLYPH_LABEL_SIZE;
    const text = contactLabelText(tile, name, size, centerX, baselineY);
    while (text.bbox().width > maxWidth && size > GLYPH_LABEL_SIZE_MIN) {
        size -= 0.5;
        text.font({ size });
    }

    if (text.bbox().width <= maxWidth) {
        return;
    }

    text.remove();
    const [line1, line2] = splitLabelAtHyphen(name);
    const lineHeight = GLYPH_LABEL_SIZE_MIN * 1.15;
    contactLabelText(tile, line1, GLYPH_LABEL_SIZE_MIN, centerX, baselineY - lineHeight);
    contactLabelText(tile, line2, GLYPH_LABEL_SIZE_MIN, centerX, baselineY);
}

function injectContactSheetFont(svg: string): string {
    const style =
        `<style>` +
        `@font-face{font-family:'${CONTACT_SHEET_FONT_FAMILY}';` +
        `src:url('${CONTACT_SHEET_FONT_URL}') format('truetype');font-weight:400;}` +
        `text{font-family:'${CONTACT_SHEET_FONT_FAMILY}',system-ui,sans-serif;}` +
        `</style>`;
    return svg.replace(/(<svg[^>]*>)/, `$1${style}`);
}

export function generateContactSheetSvg(): string {
    // tslint:disable-next-line: no-var-requires
    const { createSVGWindow } = require("svgdom");
    const window = createSVGWindow();
    const document = window.document;
    registerWindow(window, document);

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
    contactText(title, "Renderer Contact Sheet", TITLE_SIZE).move(0, 0);

    const nestedSheets = new Array<Svg>();
    Array.from(sheets.values()).forEach((sheet) => {
        const nstSheet = canvas.nested().id("sheet_" + sheet.name);

        const sheetTitle = nstSheet.nested();
        contactText(sheetTitle, "Sheet Name: " + sheet.name, SHEET_TITLE_SIZE).move(0, 0);

        const names = Array.from(sheet.glyphs.keys());
        const glyphs = Array.from(sheet.glyphs.values());
        const tiles = new Array<Svg>();
        for (let idx = 0; idx < glyphs.length; idx++) {
            const name = names[idx];
            const glyph = glyphs[idx];
            const tile = nstSheet.nested().size(tileSizeOuter, tileSizeOuter);
            const symbol = glyph(tile, "#ccc");

            const used = tile.use(symbol).size(tileSizeInner, tileSizeInner);
            used.move(innerTL, innerTL);
            used.scale(factor, factor, innerTL, innerTL);
            fitGlyphLabel(tile, name, tileSizeOuter, innerTL);
            tiles.push(tile);
        }

        let numrows = Math.floor(names.length / numimgswide);
        if ((names.length % numimgswide) > 0) {
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
        nstSheet.size(width, height);
        nestedSheets.push(nstSheet);
    });

    let currY = 40;
    nestedSheets.forEach((sheet: Svg) => {
        sheet.move(0, currY);
        currY += (sheet.height() as number) + sheetPadding;
    });

    const height = currY;
    canvas.viewbox(0, 0, width, height);
    canvas.rect(width, height).fill("#fff").back();

    return injectContactSheetFont(canvas.svg());
}

if (require.main === module) {
    // tslint:disable-next-line: no-console
    console.log(generateContactSheetSvg());
}
