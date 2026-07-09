import { copyFileSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { Resvg } from "@resvg/resvg-js";
import {
    CONTACT_SHEET_FONT_FAMILY,
    CONTACT_SHEET_VIEWBOX_WIDTH,
    generateContactSheetSvg,
} from "./contact";

const SVG_BASE_DPI = 96;
const TARGET_DPI = Number(process.env.CONTACT_SHEET_DPI ?? 96);

const fontSource = join(__dirname, "..", "node_modules", "dejavu-fonts-ttf", "ttf", "DejaVuSans.ttf");
const fontDestDir = join(__dirname, "..", "docs", "fonts");
const fontDest = join(fontDestDir, "dejavu-sans.ttf");

mkdirSync(fontDestDir, { recursive: true });
copyFileSync(fontSource, fontDest);

const svg = generateContactSheetSvg();
writeFileSync("docs/contact-sheet.svg", svg, "utf8");

const outputWidth = Math.round(CONTACT_SHEET_VIEWBOX_WIDTH * (TARGET_DPI / SVG_BASE_DPI));
const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: outputWidth },
    font: {
        fontFiles: [fontDest],
        loadSystemFonts: false,
        defaultFontFamily: CONTACT_SHEET_FONT_FAMILY,
    },
});
writeFileSync("contact.png", resvg.render().asPng());

// tslint:disable-next-line: no-console
console.log(
    `Wrote docs/contact-sheet.svg, docs/fonts/dejavu-sans.ttf, and contact.png ` +
    `(${outputWidth}px wide, ${TARGET_DPI} DPI, font: ${CONTACT_SHEET_FONT_FAMILY})`,
);
