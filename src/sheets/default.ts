// import { Nested } from "@svgdotjs/svg.js";
import svg from "svg.js";
import { ISheet } from "../sheet";

const sheet: ISheet = {
    name: "default",
    // tslint:disable-next-line:object-literal-sort-keys
    description: "This is the base contact sheet containing the default versions of all graphics used by Abstract Play.",
    glyphs: new Map<string, (canvas: svg.Nested) => void>(),
};

sheet.glyphs.set("piece", (canvas: svg.Nested) => {
    canvas.circle(100)
        .id("playerfill")
        .fill("#fff")
        .stroke({width: 2, color: "#000"});
});

export { sheet as DefaultSheet };
