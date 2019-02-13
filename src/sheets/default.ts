// import { Nested } from "@svgdotjs/svg.js";
import svg from "svg.js";
import { ISheet } from "../ISheet";

const sheet: ISheet = {
    name: "default",
    // tslint:disable-next-line:object-literal-sort-keys
    description: "This is the base contact sheet containing the default versions of all graphics used by Abstract Play.",
    glyphs: new Map<string, (canvas: svg.Nested) => void>(),
};

// Alphabetize by glyph name, please!

sheet.glyphs.set("piece", (canvas: svg.Nested) => {
    canvas.circle(100)
        .id("piece")
        .addClass("playerfill")
        .fill("#fff")
        .stroke({width: 2, color: "#000"});
});

sheet.glyphs.set("tileDark", (canvas: svg.Nested) => {
    canvas.rect(100, 100)
        .id("tileDark")
        .fill({color: "#000", opacity: 0.4});
        // .stroke({width: 1, color: "#000"});
});

sheet.glyphs.set("tileLight", (canvas: svg.Nested) => {
    canvas.rect(100, 100)
        .id("tileLight")
        .fill({color: "#000", opacity: 0});
        // .stroke({width: 1, color: "#000"});
});

export { sheet as DefaultSheet };
