import { Nested } from "@svgdotjs/svg.js";
import { ISheet } from "../sheet";

const sheet: ISheet = {
    name: "default",
    // tslint:disable-next-line:object-literal-sort-keys
    description: "This is the base contact sheet containing the default versions of all graphics used by Abstract Play.",
    glyphs: new Map<string, (svg: Nested) => void>(),
};

sheet.glyphs.set("piece", (svg: Nested) => {
    svg.circle(100)
        .id("playerfill")
        .fill("#fff")
        .stroke({width: 2, color: "#000"});
});

export { sheet as DefaultSheet };
