import { Container as SVGContainer, Symbol as SVGSymbol } from "@svgdotjs/svg.js";
import type { ISheet } from "./ISheet.js";
import { projectPoint } from "../common/plotting.js";

const sheet: ISheet = {
    name: "chess",
    // tslint:disable-next-line:object-literal-sort-keys
    description: "Various chess sets based on freely available fonts",
    cellsize: 100,
    glyphs: new Map<string, (canvas: SVGContainer) => SVGSymbol>(),
};

// Alphabetize by glyph name, please!
// The element's root `id` must be the same as its map key.
// If using groups to make complex glyphs, be sure to include the attribute `data-cellsize` (the greater of width and height) so the renderer can scale it properly.

sheet.glyphs.set("chess-amazon-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M22.523 20.294c7.991.733 12.558 5.863 12.177 21.251H17.195c0-6.595 7.61-4.763 6.089-15.388");
    group.path("M24.045 26.157c.289 2.132-4.224 5.4-6.089 6.595-2.283 1.465-2.146 3.18-3.805 2.931-.794-.689 1.073-2.228 0-2.198-.762 0 .144.9-.762 1.465-.76 0-3.046.733-3.044-2.931 0-1.466 4.567-8.794 4.567-8.794s1.438-1.392 1.522-2.564c-.556-.729-.38-1.466-.38-2.199.76-.733 2.283 1.832 2.283 1.832h1.522s.593-1.46 1.903-2.198c.76 0 .76 2.198.76 2.198");
    group.path("M13.009 31.653a.38.366 0 1 1-.761 0 .38.366 0 1 1 .76 0")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("M17.145 24.508a1.11.377-58.8 1 1-.66-.367 1.11.377-58.8 1 1 .66.367")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("M12.597 16.764c6.216-1.088 15.357-1.088 19.745 0l1.828-9.067-5.485 8.341-.22-10.226-3.802 9.864L22.47 5.159l-2.194 10.517-3.802-9.864-.22 10.226-5.485-8.34Z");
    group.path("M12.597 16.764c0 1.45 1.097 1.45 1.828 2.9.731 1.089.731.726.366 2.54 5.734-.686 10.646-.455 15.357 0-.366-1.814-.366-1.451.366-2.54.73-1.45 1.828-1.45 1.828-2.9-6.216-1.088-13.53-1.088-19.745 0");
    group.path("M14.425 19.665c2.56-.726 13.529-.726 16.089 0");
    group.path("M8.94 6.61a1.463 1.45 0 1 0 2.925 0 1.463 1.45 0 1 0-2.925 0");
    group.path("M14.79 4.434a1.463 1.45 0 1 0 2.926 0 1.463 1.45 0 1 0-2.925 0");
    group.path("M21.007 3.708a1.463 1.45 0 1 0 2.925 0 1.463 1.45 0 1 0-2.925 0");
    group.path("M27.223 4.434a1.463 1.45 0 1 0 2.925 0 1.463 1.45 0 1 0-2.925 0");
    group.path("M33.073 6.61a1.463 1.45 0 1 0 2.925 0 1.463 1.45 0 1 0-2.925 0");
    symbol.viewbox(7.4395, 0.7071, 30.059, 42.3379);
    return symbol;
});

sheet.glyphs.set("chess-amazon-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("m22.5 20.3c8 0.7 12.6 5.9 12.2 21.2h-17.5c0-6.6 7.6-4.7 6.1-15.3");
    group.path("m24 26.2c0.3 2.1-4.2 5.4-6 6.6-2.3 1.4-2.2 3.1-3.8 2.9-0.8-0.7 1-2.2 0-2.2-0.8 0 0.1 0.9-0.8 1.4-0.8 0-3.1 0.8-3.1-2.9 0-1.4 4.6-8.8 4.6-8.8 0 0 1.5-1.4 1.5-2.5-0.5-0.8-0.3-1.5-0.3-2.2 0.7-0.8 2.2 1.8 2.2 1.8h1.6c0 0 0.6-1.5 1.9-2.2 0.7 0 0.7 2.2 0.7 2.2");
    group.path("m12.6 16.8c6.2-1.1 15.4-1.1 19.7 0l1.9-9.1-5.5 8.3-0.2-10.2-3.8 9.9-2.2-10.5-2.2 10.5-3.8-9.9-0.2 10.2-5.5-8.3z");
    group.path("m12.6 16.8c0 1.4 1.1 1.4 1.8 2.9 0.8 1.1 0.8 0.7 0.4 2.5 5.7-0.7 10.6-0.5 15.3 0-0.3-1.8-0.3-1.4 0.4-2.5 0.7-1.5 1.8-1.5 1.8-2.9-6.2-1.1-13.5-1.1-19.7 0z");
    group.path("m10.4 8.1c-0.8 0-1.5-0.7-1.5-1.5 0-0.8 0.7-1.4 1.5-1.4 0.8 0 1.5 0.6 1.5 1.4 0 0.8-0.7 1.5-1.5 1.5z");
    group.path("m16.3 5.9c-0.9 0-1.5-0.7-1.5-1.5 0-0.8 0.6-1.4 1.5-1.4 0.8 0 1.4 0.6 1.4 1.4 0 0.8-0.6 1.5-1.4 1.5z");
    group.path("m22.5 5.2c-0.8 0-1.5-0.7-1.5-1.5 0-0.8 0.7-1.4 1.5-1.4 0.8 0 1.4 0.6 1.4 1.4 0 0.8-0.6 1.5-1.4 1.5z");
    group.path("m28.7 5.9c-0.8 0-1.5-0.7-1.5-1.5 0-0.8 0.7-1.4 1.5-1.4 0.8 0 1.4 0.6 1.4 1.4 0 0.8-0.6 1.5-1.4 1.5z");
    group.path("m34.5 8.1c-0.8 0-1.4-0.7-1.4-1.5 0-0.8 0.6-1.4 1.4-1.4 0.8 0 1.5 0.6 1.5 1.4 0 0.8-0.7 1.5-1.5 1.5z");
    group.path("m24.2 19.8l-0.3 1.1 0.3 0.1c2.4 0.8 4.3 1.9 6 5.1 1.7 3.2 2.5 7.8 2.1 15.3v0.4h1.7v-0.4c0.4-7.6-0.7-12.7-2.5-16.1-1.8-3.4-4.3-5-6.9-5.4z")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("m13 31.7q0 0.1-0.1 0.2-0.1 0.1-0.3 0.1-0.1 0-0.2-0.1-0.1-0.1-0.2-0.2 0.1-0.2 0.2-0.3 0.1-0.1 0.2-0.1 0.2 0 0.3 0.1 0.1 0.1 0.1 0.3z")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("m17.1 24.5q-0.2 0.4-0.5 0.6-0.2 0.2-0.4 0.2-0.1-0.1 0-0.4 0.1-0.4 0.3-0.8 0.2-0.3 0.5-0.6 0.2-0.2 0.4-0.1 0.1 0.1 0.1 0.4-0.1 0.3-0.4 0.7z")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("m14.4 19.7c2.6-0.8 13.6-0.8 16.1 0")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.1});
    symbol.viewbox(7.4, 0.8, 30.1, 42.5);
    return symbol;
});

sheet.glyphs.set("chess-archbishop-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("m36 36c-3.4-1-10.1 0.4-13.5-2-3.4 2.4-10.1 1-13.5 2 0 0-1.6 0.5-3 2 0.7 1 1.6 1 3 0.5 3.4-1 10.1 0.5 13.5-1 3.4 1.5 10.1 0 13.5 1 1.4 0.5 2.3 0.5 3-0.5-1.4-1.9-3-2-3-2z");
    group.path("m30 32c-2.5 2.5-12.5 2.5-15 0-0.5-1.5 0-2 0-2h15c0 0 0.5 0.5 0 2z");
    group.path("m30 30h-15")
        .fill("none");
    group.path("m20.3 7.6c8.1 0.8 10.5 6.2 10.1 22.3h-15.8c0-6.9 8-5.1 6.5-16.2");
    group.path("m21.9 13.7c0.3 2.3-4.3 5.7-6.1 6.9-2.3 1.6-2.2 3.4-3.9 3.1-0.8-0.7 1.1-2.3 0-2.3-0.7 0 0.2 0.9-0.7 1.5-0.8 0-3.1 0.8-3.1-3 0-1.6 4.6-9.2 4.6-9.2 0 0 1.4-1.5 1.5-2.7-0.5-0.8-0.4-1.5-0.4-2.3 0.8-0.8 2.3 1.9 2.3 1.9h1.6c0 0 0.6-1.5 1.9-2.3 0.7 0 0.7 2.3 0.7 2.3");
    group.path("m10.8 19.5q0 0.1-0.1 0.3-0.1 0.1-0.3 0.1-0.2 0-0.3-0.1-0.1-0.2-0.1-0.3 0-0.2 0.1-0.3 0.1-0.1 0.3-0.1 0.2 0 0.3 0.1 0.1 0.1 0.1 0.3z")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("m14.9 12c-0.1 0.3-0.3 0.5-0.5 0.7q-0.2 0.2-0.4 0.1-0.1-0.1 0-0.4c0-0.2 0.1-0.5 0.3-0.8 0.1-0.2 0.3-0.5 0.5-0.6q0.2-0.2 0.4-0.2 0.1 0.1 0 0.5c0 0.2-0.1 0.5-0.3 0.7z")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("m29.5 29.8c0.7-15.3-1.9-21-6.9-21.8")
        .fill("none");
    symbol.viewbox(4.5, 3.8, 36, 36.5284);
    return symbol;
});

sheet.glyphs.set("chess-archbishop-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("m36 36c-3.4-1-10.1 0.4-13.5-2-3.4 2.4-10.1 1-13.5 2 0 0-1.6 0.5-3 2 0.7 1 1.6 1 3 0.5 3.4-1 10.1 0.5 13.5-1 3.4 1.5 10.1 0 13.5 1 1.4 0.5 2.3 0.5 3-0.5-1.4-1.9-3-2-3-2z");
    group.path("m30 32c-2.5 2.5-12.5 2.5-15 0-0.5-1.5 0-2 0-2h15c0 0 0.5 0.5 0 2z");
    group.path("m20.3 7.6c8.1 0.8 10.5 6.2 10.1 22.3l-15.8-0.1c0.1-6.9 8-5 6.5-16.1");
    group.path("m21.9 13.7c0.3 2.3-4.3 5.7-6.1 6.9-2.3 1.6-2.2 3.4-3.9 3.1-0.8-0.7 1.1-2.3 0-2.3-0.7 0 0.2 0.9-0.7 1.5-0.8 0-3.1 0.8-3.1-3 0-1.6 4.6-9.2 4.6-9.2 0 0 1.4-1.5 1.5-2.7-0.5-0.8-0.4-1.5-0.4-2.3 0.8-0.8 2.3 1.9 2.3 1.9h1.6c0 0 0.6-1.5 1.9-2.3 0.7 0 0.7 2.3 0.7 2.3");
    group.path("m30 30h-15")
        .fill("none")
        .stroke({color: "#000", width: 1.5});
    group.path("m10.8 19.5q0 0.1-0.1 0.3-0.1 0.1-0.3 0.1-0.2 0-0.3-0.1-0.1-0.2-0.1-0.3 0-0.2 0.1-0.3 0.1-0.1 0.3-0.1 0.2 0 0.3 0.1 0.1 0.1 0.1 0.3z")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("m14.9 12c-0.1 0.3-0.3 0.5-0.5 0.7q-0.2 0.2-0.4 0.1-0.1-0.1 0-0.4c0-0.2 0.1-0.5 0.3-0.8 0.1-0.2 0.3-0.5 0.5-0.6q0.2-0.2 0.4-0.2 0.1 0.1 0 0.5c0 0.2-0.1 0.5-0.3 0.7z")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("m30.4 28.8c0.1-15.4-2.8-19.5-7.8-20.7")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 0.8});
    group.path("m14.9 30.1l15.3-0.1")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5});
    symbol.viewbox(4.5, 3.8, 36, 36.5284);
    return symbol;
});

sheet.glyphs.set("chess-bishop-outline-line", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M1159 2252h1777v-1982h-1777v1982zM1374 3141l673 673l674 -674l-673 -673z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .fill("#fff");
    group.path("M1756 3140l291 -290l291 291l-290 291zM1374 3141l673 673l674 -674l-673 -673zM1436 1980v-1432h1223v1432h-1223zM1159 2252h1777v-1982h-1777v1982z")
        .rotate(180, 0, 0)
        .attr("data-playerfill2", true)
        .fill("#000");
    group.viewbox(-3819.5, -3813.9999999999995, 3544, 3544);
    return group;
});

sheet.glyphs.set("chess-bishop-outline-millenia", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M341 921v410l684 365l347 -185l-725 -383v-207v-263v-180h754v184v259v207l-222 117l345 185l182 -99v-409v-262v-489h-1365v487v263z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .fill("#fff");
    group.path("M1639 922v354l-120 64l-174 -93l124 -66v-259l-1 -512h-888v511v253l630 333l-186 99l-615 -332v-353v-682h1230v683zM341 921v410l684 365l347 -185l-725 -383v-207v-263v-180h754v184v259v207l-222 117l345 185l182 -99v-409v-262v-489h-1365v487v263z")
        .rotate(180, 0, 0)
        .attr("data-playerfill2", true)
        .fill("#000");
    group.viewbox(-1786, -1695.9999999999998, 1525, 1525);
    return group;
});

sheet.glyphs.set("chess-bishop-outline-montreal", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M780 380q41 41 41 66q0 13 -13 22l32 32l-32 32q13 9 13 23q0 24 -41 65l-140 140l-160 -160l-40 40l160 160l-49 49q9 14 9 31q0 25 -17.5 42.5t-42.5 17.5t-42.5 -17.5t-17.5 -42.5q0 -17 9 -31l-229 -229q-41 -41 -41 -65q0 -14 13 -23l-32 -32l32 -32q-13 -9 -13 -22q0 -25 41 -66l141 -139l159 159l40 -40l-159 -159l20 -20l29 -28q-10 -14 -10 -33q0 -25 17.5 -42.5t42.5 -17.5t42.5 17.5t17.5 42.5q0 18 -9 33zM460 500l-20 -20h-180l-20 20l20 20h180zM540 500l20 20h180l20 -20l-20 -20h-180zM500 900q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM500 140q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6z")
        .attr("data-playerfill", true)
        .fill("#fff");
    group.path("M500 100q-8 0 -14 6t-6 14t6 14t14 6t14 -6t6 -14t-6 -14t-14 -6zM500 900q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM480 823q11 -3 20 -3q11 0 20 3l23 -23l-140 -140l77 -77l140 140l134 -134q12 -12 12 -20q0 -9 -12 -9h-222l-32 -32l-32 32h-222q-12 0 -12 9q0 8 12 20zM520 177q-9 3 -20 3q-9 0 -20 -3l-23 23l140 140l-77 77l-140 -140l-134 134q-12 12 -12 20q0 9 12 9h222l32 32l32 -32h222q12 0 12 -9q0 -8 -12 -20zM237 520h215l20 -20l-20 -20h-215l-20 20zM763 480h-215l-20 20l20 20h215l20 -20zM449 151q-9 -13 -9 -31q0 -25 17.5 -42.5t42.5 -17.5t42.5 17.5t17.5 42.5q0 18 -9 31l232 232q30 29 30 56q0 14 -9 25l36 36l-36 37q9 10 9 24q0 27 -30 56l-163 163l-140 -140l-20 20l140 140l-49 49q9 14 9 31q0 25 -17.5 42.5t-42.5 17.5t-42.5 -17.5t-17.5 -42.5q0 -17 9 -31l-232 -232q-30 -30 -30 -56q0 -14 9 -25l-36 -36l36 -36q-9 -10 -9 -24q0 -27 30 -57l163 -163l140 140l20 -20l-140 -140z")
        .attr("data-playerfill2", true)
        .fill("#000");
    group.viewbox(60, 60, 880, 880);
    return group;
});

sheet.glyphs.set("chess-bishop-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4})
        .translate(0, 0.6);
    const bGroup = group.group()
        .stroke({linecap: "butt"});
    bGroup.path("M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z");
    bGroup.path("M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z");
    bGroup.path("M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z");
    group.path("M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#000", linejoin: "miter"});
    symbol.viewbox(5.092, 5.35, 34.816, 34.816);
    return symbol;
});

sheet.glyphs.set("chess-bishop-solid-line", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M1159 2252h1777v-1982h-1777v1982zM1374 3141l673 673l674 -674l-673 -673z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    group.viewbox(-3819.5, -3813.9999999999995, 3544, 3544);
    return group;
});

sheet.glyphs.set("chess-bishop-solid-millenia", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M341 921v410l684 365l347 -185l-725 -383v-207v-263v-180h754v184v259v207l-222 117l345 185l182 -99v-409v-262v-489h-1365v487v263z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    group.viewbox(-1786, -1695.9999999999998, 1525, 1525);
    return group;
});

sheet.glyphs.set("chess-bishop-solid-montreal", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M780 380q41 41 41 66q0 13 -13 22l32 32l-32 32q13 9 13 23q0 24 -41 65l-140 140l-160 -160l-40 40l160 160l-49 49q9 14 9 31q0 25 -17.5 42.5t-42.5 17.5t-42.5 -17.5t-17.5 -42.5q0 -17 9 -31l-229 -229q-41 -41 -41 -65q0 -14 13 -23l-32 -32l32 -32q-13 -9 -13 -22q0 -25 41 -66l141 -139l159 159l40 -40l-159 -159l20 -20l29 -28q-10 -14 -10 -33q0 -25 17.5 -42.5t42.5 -17.5t42.5 17.5t17.5 42.5q0 18 -9 33zM460 500l-20 -20h-180l-20 20l20 20h180zM540 500l20 20h180l20 -20l-20 -20h-180zM500 900q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM500 140q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6z")
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    group.viewbox(60, 60, 880, 880);
    return group;
});

sheet.glyphs.set("chess-bishop-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4})
        .translate(0, 0.6);
    const bGroup = group.group()
        .stroke({linecap: "butt"});
    bGroup.path("M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z");
    bGroup.path("M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z");
    bGroup.path("M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z");
    group.path("M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", linejoin: "miter"});
    symbol.viewbox(5.092, 5.35, 34.816, 34.816);
    return symbol;
});

sheet.glyphs.set("chess-boat-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("m8.323 32.514 28.178.062s.691-.206.748-.25c5.426-4.262 5.034-8.544 5.034-8.544l-5.096 4.045H13.859l-.861-2.384H2.23v2.384h3.95l2.01 4.624");
    group.path("M7.543 25.209 24.984 8.132l14.858 17.672")
        .fill("none");
    group.path("M24.984 8.203v19.169")
        .fill("none");
    group.path("M34.387 24.448s2.03-6.635-1.774-12.545H14.781c3.804 5.91 1.866 12.49 2.005 12.545l.836-.006z");
    symbol.viewbox(0.73, 6.632, 43.0592, 27.444);
    return symbol;
});

sheet.glyphs.set("chess-boat-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M24.989 8.206v19.17")
        .fill("none")
        .stroke({color: "#000", width: 3, linejoin: "miter"});
    group.path("M7.543 25.209l17.42-17.07 14.85 17.67")
        .fill("none")
        .stroke({color: "#000", width: 0.8, linejoin: "miter", linecap: "round"});
    group.path("M25.029 8.206v19.17")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    group.path("m8.369 32.516 28.13.06s.69-.21.75-.25c5.43-4.26 5.03-8.54 5.03-8.54l-5.09 4.04h-23.33l-.89-2.38h-10.7v2.38h3.9l2 4.62")
        .attr("data-playerfill2", true)
        .fill("#fff");
    group.path("M34.389 24.446s2.03-6.63-1.78-12.54h-17.83c3.81 5.91 1.87 12.49 2.01 12.54z")
        .attr("data-playerfill2", true)
        .fill("#fff");
    group.path("M34.389 24.446s2.03-6.63-1.78-12.54h-17.83c3.81 5.91 1.87 12.49 2.01 12.54z");
    group.path("M33.629 23.566s1.755-5.7-1.534-10.78H16.184c3.29 5.077 1.614 10.73 1.734 10.78l.723-.006z")
        .attr("data-playerstroke2", true)
        .stroke({color: "#fff", width: 1});
    group.path("m40.979 26.006-3.22 2.531a.93.93 0 0 1-.562.219h-23.34a.925.925 0 0 1-.875-.625l-.625-1.75H3.17v.5h3a.93.93 0 0 1 .844.562l1.812 4.125 27.59.063c.063-.02.071-.036.156-.063.076-.023.163-.043.22-.062 2.5-1.998 3.64-3.953 4.155-5.375.03-.081.006-.048.031-.125z")
        .attr("data-playerstroke2", true)
        .stroke({color: "#fff", width: 1});
    symbol.viewbox(0.769, 6.706, 43.0166, 27.37);
    return symbol;
});

sheet.glyphs.set("chess-centaur-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M22.637 21.298c9.62.799 15.116 6.386 14.658 23.148h-21.07c0-7.184 9.16-5.188 7.328-16.762");
    group.path("M24.47 27.684c.347 2.323-5.085 5.883-7.33 7.184-2.748 1.596-2.583 3.464-4.58 3.193-.955-.75 1.292-2.427 0-2.395-.916 0 .174.982-.916 1.596-.916 0-3.667.799-3.664-3.192 0-1.597 5.496-9.579 5.496-9.579s1.732-1.516 1.832-2.794c-.668-.793-.458-1.596-.458-2.394.916-.798 2.749 1.995 2.749 1.995h1.832s.714-1.59 2.29-2.394c.916 0 .916 2.394.916 2.394");
    group.path("M11.186 33.67a.458.4 0 0 1-.916 0 .458.4 0 1 1 .916 0")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("M16.163 25.888a1.245.44-55.487 0 1-.793-.4 1.245.44-55.487 0 1 .793.4")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("M22.5 6.33V.7")
        .fill("none");
    group.path("M20 2.7h5")
        .fill("none");
    group.path("M22.5 19.7s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5");
    group.path("M38.5 14.2c-4-6.5-13.5-3.5-16 4v3.5-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10 5.5-3 15.5-3 21 0 0 0 9-4 6-10");
    symbol.viewbox(4.3269, -0.8, 36.2854, 46.746);
    return symbol;
});

sheet.glyphs.set("chess-centaur-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M22.637 21.321c9.568.793 15.036 6.346 14.58 23.003h-20.96c0-7.139 9.114-5.156 7.291-16.657");
    group.path("M24.46 27.667c.346 2.308-5.058 5.845-7.291 7.138-2.734 1.587-2.57 3.443-4.556 3.173-.95-.745 1.284-2.411 0-2.38-.912 0 .173.976-.912 1.587-.911 0-3.648.793-3.645-3.173 0-1.586 5.468-9.518 5.468-9.518s1.722-1.507 1.822-2.776c-.665-.789-.455-1.587-.455-2.38.911-.793 2.734 1.983 2.734 1.983h1.822s.711-1.58 2.279-2.38c.91 0 .91 2.38.91 2.38");
    group.path("M22.5 19.648s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5");
    group.path("M32.5 24.648s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4v3.5-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10 7.216-1.35 14.29-1.695 21 .5");
    group.path("M11.246 33.616a.456.397 0 1 1-.912 0 .456.397 0 1 1 .912 0")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("M16.196 25.882a1.238.438-55.447 1 1-.789-.397 1.238.438-55.447 1 1 .79.397")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("m24.96 21.638-.41 1.15.456.12c2.87.793 5.149 1.974 7.2 5.353 2.05 3.38 2.961 8.178 2.506 16.063l-.046.396h2.05l.046-.396c.456-7.98-.802-13.366-2.962-16.927s-5.276-5.267-8.375-5.68z")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("M22.5 6.278V.648")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    group.path("M20 2.648h5")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    group.path("M32 24.148s8.5-4 6.03-9.65c-3.88-5.85-13.03-1.85-15.53 4.65l.01 2.1-.01-2.1c-2.5-6.5-12.594-10.5-15.503-4.65-2.497 5.65 4.853 9 4.853 9")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5});
    group.path("M11.9 24.247c5.5-3 15.1-2.6 20.6.4")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5});
    symbol.viewbox(4.3269, -0.852, 36.2854, 47.072);
    return symbol;
});

sheet.glyphs.set("chess-champion-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M 22.5 4 C 22.467298 9.7235199 11.24221 10.524784 11 16 C 10.741151 21.804116 11.11112 33.16307 10.5 35.96875 C 10.233176 37.193751 5.0293445 37.220791 5 39 C 4.9746717 40.535701 15.379315 40 22.5 40 C 29.620685 40 40.025328 40.535701 40 39 C 39.970655 37.220791 34.766824 37.193751 34.5 35.96875 C 33.888879 33.16307 34.258849 21.804116 34 16 C 33.75779 10.524784 22.532702 9.7235199 22.5 4 z ");
    group.path("M18.5 19h8");
    group.path("M22.5 19v12");
    symbol.viewbox(3.5, 2.5, 38.0001, 39.0905);
    return symbol;
});

sheet.glyphs.set("chess-champion-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M 22.5 4 C 22.467298 9.7235199 11.24221 10.524784 11 16 C 10.741151 21.804116 11.11112 33.16307 10.5 35.96875 C 10.233176 37.193751 5.0293445 37.220791 5 39 C 4.9746717 40.535701 15.379315 40 22.5 40 C 29.620685 40 40.025328 40.535701 40 39 C 39.970655 37.220791 34.766824 37.193751 34.5 35.96875 C 33.888879 33.16307 34.258849 21.804116 34 16 C 33.75779 10.524784 22.532702 9.7235199 22.5 4 z ");
    group.path("M18.5 19h8")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5});
    group.path("M22.5 19v12")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5});
    symbol.viewbox(3.5, 2.5, 38.0001, 39.0905);
    return symbol;
});

sheet.glyphs.set("chess-chancellor-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("m34 34.82-3-3H14l-3 3");
    group.path("M11 34.82v5h4v-2h5v2h5v-2h5v2h4v-5");
    group.path("M31.553 32.108v-2.115H13.447v2.115");
    group.path("M11 34.82h23")
        .fill("none");
    group.path("M20.345 7.627c8.036.766 12.629 6.124 12.246 22.197H14.987c0-6.889 7.654-4.975 6.123-16.073");
    group.path("M21.875 13.75c.295 2.229-4.25 5.64-6.123 6.89-2.296 1.53-2.158 3.323-3.827 3.06-.797-.722 1.082-2.324 0-2.295-.765 0 .144.942-.765 1.53-.766 0-3.064.766-3.062-3.061 0-1.531 4.593-9.185 4.593-9.185s1.443-1.456 1.53-2.679c-.555-.761-.382-1.53-.382-2.296.765-.765 2.296 1.913 2.296 1.913h1.53s.6-1.524 1.914-2.296c.766 0 .766 2.296.766 2.296");
    group.path("M10.776 19.49a.383.383 0 1 1-.765 0 .383.383 0 1 1 .765 0")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("M14.935 12.028a.383 1.148 29.998 1 1-.662-.383.383 1.148 29.998 1 1 .662.383")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("M31.826 29.824c.765-15.308-4.21-21.048-9.185-21.814")
        .fill("none");
    group.path("M 30,30 L 15,30")
        .fill("none");
    symbol.viewbox(6.598, 3.831, 28.902, 37.489);
    return symbol;
});

sheet.glyphs.set("chess-chancellor-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("m34 34.82-3-3H14l-3 3");
    group.path("M11 34.82v5h4v-2h5v2h5v-2h5v2h4v-5");
    group.path("M31.553 32.108v-2.115H13.447v2.115");
    group.path("M20.345 7.627c8.036.766 12.629 6.124 12.246 22.197H14.987c0-6.889 7.654-4.975 6.123-16.073");
    group.path("M21.875 13.75c.295 2.229-4.25 5.64-6.123 6.89-2.296 1.53-2.158 3.323-3.827 3.06-.797-.722 1.082-2.324 0-2.295-.765 0 .144.942-.765 1.53-.766 0-3.064.766-3.062-3.061 0-1.531 4.593-9.185 4.593-9.185s1.443-1.456 1.53-2.679c-.555-.761-.382-1.53-.382-2.296.765-.765 2.296 1.913 2.296 1.913h1.53s.6-1.524 1.914-2.296c.766 0 .766 2.296.766 2.296");
    group.path("M10.776 19.49a.383.383 0 1 1-.765 0 .383.383 0 1 1 .765 0")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("M14.935 12.028a.383 1.148 29.998 1 1-.662-.383.383 1.148 29.998 1 1 .662.383")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("M11 34.82h23")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    group.path("M 30,30 L 15,30")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linecap: "butt", linejoin: "miter"});
    symbol.viewbox(6.598, 3.831, 28.902, 37.489);
    return symbol;
});

sheet.glyphs.set("chess-commoner-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("m22.5 12.4c-1.5 0-2.7-1.2-2.7-2.7 0-1.5 1.2-2.7 2.7-2.7 1.5 0 2.7 1.2 2.7 2.7 0 1.5-1.2 2.7-2.7 2.7z");
    group.path("m10.6 35.1c6 3.8 16.8 3.8 22.7 0v-7.5c0 0 9.8-4.9 6.5-11.9-5.9-7.6-28.6-7.6-34.6 0-3.2 7 5.4 11.3 5.4 11.3z");
    group.path("m10.6 27.6c6-3.3 16.8-3.3 22.7 0")
        .fill("none");
    group.path("m10.6 31.3c6-3.2 16.8-3.2 22.7 0")
        .fill("none");
    group.path("m10.6 35.1c6-3.2 16.8-3.2 22.7 0")
        .fill("none");
    symbol.viewbox(2.9864, 5.5, 38.9926, 33.95);
    return symbol;
});

sheet.glyphs.set("chess-commoner-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M19.793 9.589a2.733 2.733 0 1 0 5.465 0 2.733 2.733 0 1 0-5.465 0");
    group.path("M10.503 35.274c6.01 3.825 16.94 3.825 22.953 0v-7.653s9.838-4.918 6.558-12.02c-6.01-7.653-28.967-7.653-34.976 0-3.28 7.102 5.465 11.475 5.465 11.475z");
    group.path("M20.886 9.589a1.64 1.64 0 1 0 3.28 0 1.64 1.64 0 1 0-3.28 0")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.64});
    group.path("M32.908 27.076s9.29-4.373 6.558-10.548c-5.847-7.487-28.033-7.487-33.884 0-2.732 6.175 5.303 9.838 5.303 9.838")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.725});
    group.path("M10.503 27.62c6.01-3.276 16.94-3.276 22.953 0")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.725});
    group.path("M10.503 31.445c6.01-3.276 16.94-3.276 22.953 0")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.725});
    group.path("M10.503 35.274c6.01-3.28 16.94-3.28 22.953 0")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.725});
    symbol.viewbox(2.8019, 5.3037, 39.3816, 34.339);
    return symbol;
});

sheet.glyphs.set("chess-dabbaba-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M18.168 10.016H28.23l6.195 22.835-.193 4.65H11.977l-.196-5.035z");
    group.path("M11.588 32.851h22.64")
        .fill("none");
    group.path("M6.754 37.493a4.354 4.452 0 1 0 8.708 0 4.354 4.452 0 1 0-8.708 0");
    group.path("M29.71 37.493a4.354 4.452 0 1 0 8.709 0 4.354 4.452 0 1 0-8.708 0");
    symbol.viewbox(5.254, 8.516, 34.665, 34.8315);
    return symbol;
});

sheet.glyphs.set("chess-dabbaba-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M18.168 10.016H28.23l6.195 22.835-.193 4.65H11.977l-.196-5.035z");
    group.path("M11.588 32.851h22.64");
    group.path("M6.754 37.493a4.354 4.452 0 1 0 8.708 0 4.354 4.452 0 1 0-8.708 0");
    group.path("M29.71 37.493a4.354 4.452 0 1 0 8.709 0 4.354 4.452 0 1 0-8.708 0");
    group.path("M11.626 31.578s4.46.298 5.057 5.65")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.725});
    group.path("M33.388 31.578s-4.46.298-5.057 5.65")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.725});
    group.path("M14.475 32.712H30.52")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.725});
    symbol.viewbox(5.254, 8.516, 34.665, 34.8315);
    return symbol;
});

sheet.glyphs.set("chess-dragon-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18");
    group.path("m 24,18 c 0.38,2.91 -5.55,7.37 -8,9 -3,2 -2.82,4.34 -5,4 -1.042,-0.94 1.41,-3.04 0,-3 -1,0 0.19,1.23 -1,2 C 9,30 5.997,31 6,26 5.2232451,24.93038 5.0722181,24.029914 6.1089615,21.934875 6.7025354,20.735388 7.831639,20.945634 8.3785961,20.130322 9.320582,18.726169 10.5,16.5625 11.0625,15.59375 11.625,14.625 12,14 12,14 14.991608,9.5373817 21.291493,7.177277 23.537399,7.155351 c 0.655351,0.025892 -0.10443,0.3227849 -0.458429,1.079258 -0.353999,0.756473 0.370973,1.920742 0.370973,1.920742");
    group.path("m 8.6714614,23.79114 a 0.5,0.5 0 1 1 -1,0 0.5,0.5 0 1 1 1,0 z")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("M14.933 15.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("m 25.011507,25.943613 c 0,3.469506 3.158804,3.573072 3.10702,0.05178")
        .fill("none");
    group.path("m 30.655926,27.186421 c -0.103567,3.573073 3.210588,3.67664 3.210587,0.05178")
        .fill("none");
    group.path("m 26.875719,31.277331 c -0.05178,3.521288 3.055236,3.624855 3.107019,-0.05179")
        .fill("none");
    group.path("m 21.542002,32.26122 c 0,3.314154 2.899886,3.365938 2.951669,0")
        .fill("none");
    group.path("m 33.037975,33.607595 c -0.103568,2.951669 2.951668,3.003452 2.899885,0")
        .fill("none");
    symbol.viewbox(3.8743, 5.6554, 35.6546, 34.8446);
    return symbol;
});

sheet.glyphs.set("chess-dragon-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18");
    group.path("m 24,18 c 0.38,2.91 -5.55,7.37 -8,9 -3,2 -2.82,4.34 -5,4 -1.042,-0.94 1.41,-3.04 0,-3 -1,0 0.19,1.23 -1,2 C 9,30 5.997,31 6,26 5.2232451,24.93038 5.0722181,24.029914 6.1089615,21.934875 6.7025354,20.735388 7.831639,20.945634 8.3785961,20.130322 9.320582,18.726169 10.5,16.5625 11.0625,15.59375 11.625,14.625 12,14 12,14 14.991608,9.5373817 21.291493,7.177277 23.537399,7.155351 c 0.655351,0.025892 -0.10443,0.3227849 -0.458429,1.079258 -0.353999,0.756473 0.370973,1.920742 0.370973,1.920742");
    group.path("m 8.6714614,23.79114 a 0.5,0.5 0 1 1 -1,0 0.5,0.5 0 1 1 1,0 z")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("M14.933 15.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("m 25.011507,25.943613 c 0,3.469506 3.158804,3.573072 3.10702,0.05178")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    group.path("m 30.655926,27.186421 c -0.103567,3.573073 3.210588,3.67664 3.210587,0.05178")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    group.path("m 26.875719,31.277331 c -0.05178,3.521288 3.055236,3.624855 3.107019,-0.05179")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    group.path("m 21.542002,32.26122 c 0,3.314154 2.899886,3.365938 2.951669,0")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    group.path("m 33.037975,33.607595 c -0.103568,2.951669 2.951668,3.003452 2.899885,0")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    symbol.viewbox(3.8743, 5.6554, 35.6546, 34.8446);
    return symbol;
});

sheet.glyphs.set("chess-elephant-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("m22.708 9.258-3.559 1.317c-3.016 1.115-3.547 1.332-3.49 1.437.038.069.701 1.847 1.48 3.947l1.416 3.817.731-.66c.531-.482.77-.65.874-.614.078.028.142.066.142.082 0 .015-.644.932-1.432 2.04l-1.431 2.012.42.052c.402.047 1.115.386 1.348.642.056.061.103.253.1.427-.004.287.011.309.18.268a1.6 1.6 0 0 1 .289-.043c.082-.001.093-.282.058-1.25a34 34 0 0 0-.085-1.576c-.035-.307-.025-.33.148-.307.183.024.195.082.458 2.793.147 1.52.346 3.21.442 3.755.257 1.466.49 3.741.595 5.776.05.99.114 2.017.142 2.28l.052.48h2.232l.053-.48c.046-.436.163-2.347.258-4.196.046-.907.234-2.415.505-4.061.115-.696.306-2.334.426-3.64s.237-2.454.258-2.549c.025-.109.1-.172.206-.172.154 0 .163.04.126.517-.023.285-.06.972-.084 1.528-.04.917-.029 1.015.105 1.049l.337.086c.167.044.177.031.116-.12-.113-.277-.01-.515.315-.747.446-.318.665-.411 1.127-.464l.41-.048-1.442-2.022c-1.08-1.513-1.414-2.04-1.332-2.088.164-.094.183-.079.943.613l.7.637 1.331-3.587a545 545 0 0 1 1.474-3.952l.148-.359-.306-.11-3.542-1.313z");
    group.path("M18.544 15.849c.141 0 .288.046.41.158.217.197.23.696.022.862-.453.361-1.032.13-1.032-.412 0-.366.29-.608.6-.608");
    group.path("M18.534 15.988a.46.46 0 1 0 .326.785.46.46 0 0 0-.326-.785");
    group.path("m20.455 26.424.947 9.661s-.06-1.08-.179-2.706-.061-1.518-.12-2.385a38 38 0 0 0-.227-2.031 35 35 0 0 0-.421-2.539");
    group.path("m25.492 20.854-.542 5.556c.04-.19.085-.366.126-.517.09-.325.16-.803.216-1.337s.097-1.123.126-1.671c.06-1.097.074-2.031.074-2.031");
    group.path("M24.95 26.41a35 35 0 0 0-.421 2.539c-.117.867-.2 1.652-.227 2.035-.06.867-.002.76-.12 2.386-.12 1.625-.18 2.71-.18 2.71z");
    group.path("m20.034 24.058-.953.216s.12 0 .268-.015a1.5 1.5 0 0 0 .443-.095c.238-.109.242-.106.242-.106");
    group.path("M25.481 24.058s0-.003.237.106c.12.054.299.081.448.095s.268.015.268.015z");
    group.path("M25.54 24.307c-.077.017-.09.135-.127.527-.029.31-.08.679-.11.82l-.058.253.852-.388c.47-.214.858-.413.858-.436s-.12-.174-.263-.335c-.186-.211-.345-.306-.568-.34a7 7 0 0 1-.485-.091.2.2 0 0 0-.1-.01");
    group.path("M19.844 24.317q-.016-.001-.037.005a3 3 0 0 1-.479.09c-.26.033-.402.108-.568.298-.122.139-.235.287-.248.33s.32.233.737.422.792.346.832.35c.04.002.049-.073.021-.168a7 7 0 0 1-.105-.767c-.04-.435-.073-.561-.153-.56");
    group.path("M19.85 20.563s.06 3.74.417 5.04.714 4.227.774 5.094 0 .758.12 2.384c.118 1.626.178 2.71.178 2.71");
    group.path("M23.24 36.09c-.31.005-.538.02-.538.02v.004s-.228-.014-.537-.019a9 9 0 0 0-1.031.033c-.187.02-.358.052-.485.101a.5.5 0 0 0-.152.086.18.18 0 0 0-.063.12.4.4 0 0 0 .015.168.2.2 0 0 0 .106.105c.104.056.285.088.59.13.27.036.662.048.984.052s.573 0 .573 0v-.005s.252.004.574 0 .713-.016.984-.052c.304-.042.485-.074.59-.13a.2.2 0 0 0 .105-.105.4.4 0 0 0 .016-.168.18.18 0 0 0-.063-.12.5.5 0 0 0-.153-.086 2 2 0 0 0-.484-.1 9 9 0 0 0-1.032-.034");
    group.path("M21.139 30.463c.015-.007.052.007.063.014-.032 0-.07-.01-.063-.014");
    group.path("M2.237 17.823s5.623-9.055 8.76-9.656c3.2-.613 7.831 1.226 7.831 1.226l.21.057")
        .fill("none");
    group.path("M15.354 11.577s1.986-1.291 3.472-2.033c.677-.338 1.797-.592 2.192-.61 1.684-.081 1.684-.077 1.684-.077")
        .fill("none");
    group.path("M2.322 17.9s3.621 3.525 6.821 4.904 3.369 1.38 6.064 2.07 1.937.536 3.874.842c1.937.307 1.312.199 1.312.199");
    group.path("M14.926 22.352h2.917v2.033h-2.917Z")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("M15.387 11.522s.219 2.084.607 3.666c.373 1.519.442 2.776 1.104 3.561s1.27 1.1 1.27 1.1")
        .fill("none");
    group.path("M19.003 16.217a.463.46 0 1 1-.926 0 .463.46 0 1 1 .926 0");
    group.path("M20.134 18.321s-1.98 1.686-2.4 2.414c-.422.728-.548.805-.716 1.418-.169.613-.21.843-.21.843");
    group.path("M22.702 35.88s-.904-.055-1.57.017c-.373.04-.682.127-.696.305-.023.279.1.32.708.403.543.074 1.558.052 1.558.052");
    group.path("M43.167 17.816s-5.623-9.055-8.759-9.656c-3.2-.613-7.832 1.227-7.832 1.227l-.21.057");
    group.path("M30.05 11.57s-1.986-1.29-3.471-2.032c-.677-.338-1.797-.592-2.192-.611-1.685-.08-1.685-.077-1.685-.077")
        .fill("none");
    group.path("M25.617 20.65s-.06 3.74-.417 5.04-.715 4.227-.774 5.094 0 .759-.12 2.384c-.118 1.626-.178 2.71-.178 2.71");
    group.path("M43.083 17.893s-3.621 3.525-6.822 4.905-3.368 1.38-6.063 2.069-1.937.536-3.874.843l-1.253.198");
    group.path("M27.93 22.528h3.271v1.945h-3.27Z")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("M30.018 11.515s-.206 2.056-.572 3.616c-.35 1.497-.415 2.737-1.039 3.511-.623.775-1.195 1.085-1.195 1.085")
        .fill("none");
    group.path("M26.402 16.21a.46.463 90 1 0 .926 0 .46.463 90 1 0-.926 0");
    group.path("M25.27 18.315s1.98 1.686 2.401 2.414.548.804.716 1.417.21.843.21.843");
    group.path("M22.702 35.873s.904-.054 1.57.017c.374.04.683.128.697.306.022.278-.1.32-.709.403-.543.074-1.558.052-1.558.052");
    group.path("M19.08 24.04s.476 0 .714-.109l.238-.108");
    group.path("M17.352 22.63c-.349.228-.435.359-.633.644-.82 1.2-1.74 2.458-2.225 3.8-.265.61-.357 1.041-.477 1.518-.128.537-.189 1.085-.06 1.625.15.41.331.691.656 1.084.411.293.787.407 1.25.488.563.119 1.15.144 1.727.162.329 0-.176-.609-.416-.812a9 9 0 0 1-.775-.705c-.267-.281-.476-.678-.476-.867.012-.569.165-1.045.364-1.6.208-.515.406-1.088.781-1.74a8.5 8.5 0 0 1 1.083-1.33c.39-.39 1.433-1.43.85-1.768-.21-.134-.215-.135-.363-.24-.313-.212-.948-.443-1.286-.258");
    group.path("M26.434 24.04s-.477 0-.715-.109l-.238-.108");
    group.path("M28.052 22.624c.35.227.435.358.633.644.821 1.2 1.74 2.457 2.226 3.8.265.61.357 1.04.476 1.517.129.537.19 1.086.06 1.626-.15.41-.33.69-.655 1.084-.412.292-.788.407-1.25.487-.563.12-1.151.145-1.728.163-.328 0 .177-.609.417-.813.335-.284.556-.475.774-.704.267-.282.477-.678.477-.867-.012-.57-.165-1.045-.365-1.6-.207-.516-.405-1.089-.78-1.741-.352-.512-.634-.88-1.083-1.329-.39-.39-1.433-1.43-.851-1.768.21-.134.215-.136.363-.24.313-.213.948-.443 1.286-.259");
    group.path("M21.627 24.18c.54.268 2.133.038 2.133.038");
    group.path("M22.188 29.142c.246.268.97.038.97.038");
    group.path("M21.948 26.632c.38.269 1.505.039 1.505.039");
    group.path("M13.67 23.647c-1.436-.414-3.786-1.333-4.937-1.93-.823-.427-2.355-1.442-3.259-2.16-.933-.74-2.177-1.815-2.177-1.881 0-.032.408-.65.907-1.375 2.667-3.873 4.934-6.392 6.412-7.124.487-.242.672-.281 1.459-.315.559-.025 1.282.014 1.907.102 1.197.168 2.926.568 2.926.678 0 .042-.089.124-.198.18-.707.367-1.92 1.19-2.014 1.367-.154.288-.01 1.491.455 3.781.649 3.206.835 3.73 1.615 4.549l.483.506-.31.485c-.403.627-.586 1.053-.77 1.792-.162.658-.805 1.741-1.028 1.735-.073-.002-.735-.177-1.471-.39");
    group.path("M29.776 23.448a4.5 4.5 0 0 1-.581-1.313 6 6 0 0 0-.606-1.41l-.416-.693.38-.38a4.2 4.2 0 0 0 1.087-1.795c.27-.897.86-3.894 1.03-5.241.138-1.083.14-1.246.025-1.45-.075-.133-.572-.498-1.17-.858-.57-.344-1.038-.653-1.038-.686 0-.088 2.133-.572 3.067-.696 1.24-.165 2.521-.081 3.148.206 1.269.58 3.159 2.547 5.404 5.623.86 1.177 1.883 2.677 1.954 2.864.074.19-2.139 2.017-3.776 3.116-1.696 1.139-4.328 2.293-6.743 2.958-.703.193-1.3.351-1.326.351s-.223-.268-.439-.596");
    symbol.viewbox(0.737, 6.535, 43.93, 31.8568);
    return symbol;
});

sheet.glyphs.set("chess-elephant-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("m22.708 9.258-3.559 1.317c-3.016 1.115-3.547 1.332-3.49 1.437.038.069.701 1.847 1.48 3.947l1.416 3.817.731-.66c.531-.482.77-.65.874-.614.078.028.142.066.142.082 0 .015-.644.932-1.432 2.04l-1.431 2.012.42.052c.402.047 1.115.386 1.348.642.056.061.103.253.1.427-.004.287.011.309.18.268a1.6 1.6 0 0 1 .289-.043c.082-.001.093-.282.058-1.25a34 34 0 0 0-.085-1.576c-.035-.307-.025-.33.148-.307.183.024.195.082.458 2.793.147 1.52.346 3.21.442 3.755.257 1.466.49 3.741.595 5.776.05.99.114 2.017.142 2.28l.052.48h2.232l.053-.48c.046-.436.163-2.347.258-4.196.046-.907.234-2.415.505-4.061.115-.696.306-2.334.426-3.64s.237-2.454.258-2.549c.025-.109.1-.172.206-.172.154 0 .163.04.126.517-.023.285-.06.972-.084 1.528-.04.917-.029 1.015.105 1.049l.337.086c.167.044.177.031.116-.12-.113-.277-.01-.515.315-.747.446-.318.665-.411 1.127-.464l.41-.048-1.442-2.022c-1.08-1.513-1.414-2.04-1.332-2.088.164-.094.183-.079.943.613l.7.637 1.331-3.587a545 545 0 0 1 1.474-3.952l.148-.359-.306-.11-3.542-1.313z");
    group.path("m20.455 26.424.947 9.661s-.06-1.08-.179-2.706-.061-1.518-.12-2.385a38 38 0 0 0-.227-2.031 35 35 0 0 0-.421-2.539");
    group.path("m25.492 20.854-.542 5.556c.04-.19.085-.366.126-.517.09-.325.16-.803.216-1.337s.097-1.123.126-1.671c.06-1.097.074-2.031.074-2.031");
    group.path("M24.95 26.41a35 35 0 0 0-.421 2.539c-.117.867-.2 1.652-.227 2.035-.06.867-.002.76-.12 2.386-.12 1.625-.18 2.71-.18 2.71z");
    group.path("M2.237 17.823s5.623-9.055 8.76-9.656c3.2-.613 7.831 1.226 7.831 1.226l.21.057");
    group.path("M14.926 22.352h2.917v2.033h-2.917Z");
    group.path("M43.167 17.816s-5.623-9.055-8.759-9.656c-3.2-.613-7.832 1.227-7.832 1.227l-.21.057");
    group.path("m 21.125,35.90625 c -0.37295,0.04014 -0.67329,0.103006 -0.6875,0.28125 -0.02219,0.278383 0.11079,0.323675 0.71875,0.40625 1.027931,0.114563 2.083651,0.04814 3.09375,0 0.60795,-0.08258 0.74094,-0.127867 0.71875,-0.40625 -0.01421,-0.178243 -0.31455,-0.272359 -0.6875,-0.3125 -1.047588,-0.05157 -2.156369,0.0028 -3.15625,0.03125 z");
    group.path("M43.083 17.893s-3.621 3.525-6.822 4.905-3.368 1.38-6.063 2.069-1.937.536-3.874.843l-1.253.198");
    group.path("M27.93 22.528h3.271v1.945h-3.27Z");
    group.path("M13.67 23.647c-1.436-.414-3.786-1.333-4.937-1.93-.823-.427-2.355-1.442-3.259-2.16-.933-.74-2.177-1.815-2.177-1.881 0-.032.408-.65.907-1.375 2.667-3.873 4.934-6.392 6.412-7.124.487-.242.672-.281 1.459-.315.559-.025 1.282.014 1.907.102 1.197.168 2.926.568 2.926.678 0 .042-.089.124-.198.18-.707.367-1.92 1.19-2.014 1.367-.154.288-.01 1.491.455 3.781.649 3.206.835 3.73 1.615 4.549l.483.506-.31.485c-.403.627-.586 1.053-.77 1.792-.162.658-.805 1.741-1.028 1.735-.073-.002-.735-.177-1.471-.39");
    group.path("M29.776 23.448a4.5 4.5 0 0 1-.581-1.313 6 6 0 0 0-.606-1.41l-.416-.693.38-.38a4.2 4.2 0 0 0 1.087-1.795c.27-.897.86-3.894 1.03-5.241.138-1.083.14-1.246.025-1.45-.075-.133-.572-.498-1.17-.858-.57-.344-1.038-.653-1.038-.686 0-.088 2.133-.572 3.067-.696 1.24-.165 2.521-.081 3.148.206 1.269.58 3.159 2.547 5.404 5.623.86 1.177 1.883 2.677 1.954 2.864.074.19-2.139 2.017-3.776 3.116-1.696 1.139-4.328 2.293-6.743 2.958-.703.193-1.3.351-1.326.351s-.223-.268-.439-.596");
    group.path("M18.534 15.988a.46.46 0 1 0 .326.785.46.46 0 0 0-.326-.785")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("M2.322 17.9s3.621 3.525 6.821 4.904 3.369 1.38 6.064 2.07 1.937.536 3.874.842c1.937.307 1.312.199 1.312.199")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("M19.003 16.217a.463.46 0 1 1-.926 0 .463.46 0 1 1 .926 0")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("M26.402 16.21a.46.463 90 1 0 .926 0 .46.463 90 1 0-.926 0")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("M19.85 20.563s.06 3.74.417 5.04.715 4.227.774 5.094 0 .758.12 2.384c.118 1.626.178 2.71.178 2.71")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    group.path("M23.24 36.09c-.31.005-.538.02-.538.02v.004s-.228-.014-.537-.019a9 9 0 0 0-1.031.033c-.187.02-.358.052-.485.101a.5.5 0 0 0-.152.086.18.18 0 0 0-.063.12.4.4 0 0 0 .015.168.2.2 0 0 0 .106.105c.104.056.285.088.59.13.27.036.662.048.984.052s.573 0 .573 0v-.005s.252.004.574 0 .713-.016.984-.052c.304-.042.485-.074.59-.13a.2.2 0 0 0 .105-.105.4.4 0 0 0 .016-.168.18.18 0 0 0-.063-.12.5.5 0 0 0-.153-.086 2 2 0 0 0-.484-.1 9 9 0 0 0-1.032-.034")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    group.path("M15.354 11.577s1.986-1.291 3.472-2.033c.677-.338 1.797-.592 2.192-.61 1.684-.081 1.684-.077 1.684-.077")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    group.path("M15.387 11.522s.219 2.084.607 3.666c.373 1.519.442 2.776 1.104 3.561s1.27 1.1 1.27 1.1")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    group.path("M20.134 18.321s-1.98 1.686-2.4 2.414c-.422.728-.548.805-.716 1.418-.169.613-.21.843-.21.843")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    group.path("M30.05 11.57s-1.986-1.29-3.471-2.032c-.677-.338-1.797-.592-2.192-.611-1.685-.08-1.685-.077-1.685-.077")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    group.path("M25.617 20.65s-.06 3.74-.417 5.04-.715 4.227-.774 5.094 0 .759-.12 2.384c-.118 1.626-.178 2.71-.178 2.71")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    group.path("M19.08 24.04s.476 0 .714-.109l.238-.108")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    group.path("M30.018 11.515s-.206 2.056-.572 3.616c-.35 1.497-.415 2.737-1.039 3.511-.623.775-1.195 1.085-1.195 1.085")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    group.path("M25.27 18.315s1.98 1.686 2.401 2.414.548.804.716 1.417.21.843.21.843")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    group.path("M17.352 22.63c-.349.228-.435.359-.632.644-.821 1.2-1.74 2.458-2.226 3.8-.265.61-.357 1.041-.477 1.518-.128.537-.188 1.085-.06 1.625.15.41.331.691.656 1.084.411.293.787.407 1.25.488.563.119 1.15.144 1.727.162.33 0-.176-.609-.416-.812a9 9 0 0 1-.775-.705c-.267-.281-.476-.678-.476-.867.012-.569.165-1.045.365-1.6.207-.515.405-1.088.78-1.74.352-.512.634-.881 1.083-1.33.39-.39 1.433-1.43.851-1.768-.211-.134-.215-.135-.364-.24-.313-.212-.947-.443-1.286-.258")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linecap: "butt", linejoin: "miter"});
    group.path("M26.434 24.04s-.477 0-.715-.109l-.238-.108")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    group.path("M28.052 22.624c.35.227.435.358.633.644.821 1.2 1.74 2.457 2.226 3.8.265.61.357 1.04.476 1.517.129.537.19 1.086.06 1.626-.15.41-.33.69-.655 1.084-.412.292-.788.407-1.25.487-.563.12-1.151.145-1.728.163-.328 0 .177-.609.417-.813.335-.284.556-.475.774-.704.267-.282.477-.678.477-.867-.012-.57-.165-1.045-.365-1.6-.207-.516-.405-1.089-.78-1.741-.352-.512-.634-.88-1.083-1.329-.39-.39-1.433-1.43-.851-1.768.21-.134.215-.136.363-.24.313-.213.948-.443 1.286-.259")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linecap: "butt", linejoin: "miter"});
    group.path("M21.627 24.18c.54.268 2.133.038 2.133.038")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    group.path("M22.188 29.142c.246.268.97.038.97.038")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    group.path("M21.948 26.632c.38.269 1.505.039 1.505.039")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5, linejoin: "miter"});
    symbol.viewbox(0.737, 6.535, 43.93, 31.8568);
    return symbol;
});

sheet.glyphs.set("chess-ex-solid-line", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M825 1117l931 932l-930 931l-1 296l289 -2l933 -933l934 935h290v-297l-931 -931l931 -929v-299h-285l-938 936l-932 -936h-291v297z")
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    group.viewbox(820, 820, 2456, 2456);
    return group;
});

sheet.glyphs.set("chess-ex-solid-millenia", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M1024 878l-556 -555l-146 146l555 556l-555 555l146 146l555 -556l555 556l147 -147l-555 -555l555 -555l-146 -146z")
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    group.viewbox(322, 323, 1403, 1403);
    return group;
});

sheet.glyphs.set("chess-ferz-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M9.464 39.175H35.64c-3.07-5.832-7.34-8.814-12.915-8.75-5.064.2-9.804 2.838-13.262 8.746");
    group.path("M9.328 21.09a13.342 13.115 0 1 0 26.683 0 13.342 13.115 0 1 0-26.683 0");
    group.path("m19.574 18.69 5.88 5.877")
        .fill("none");
    group.path("m19.49 24.491 5.886-5.885")
        .fill("none");
    symbol.viewbox(7.8275, 6.1345, 29.684, 34.5405);
    return symbol;
});

sheet.glyphs.set("chess-ferz-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M9.464 39.175H35.64c-3.07-5.832-7.34-8.814-12.915-8.75-5.064.2-9.804 2.838-13.262 8.746");
    group.path("M9.328 21.09a13.342 13.115 0 1 0 26.683 0 13.342 13.115 0 1 0-26.683 0");
    group.path("m19.574 18.69 5.88 5.877")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.725, linejoin: "miter"});
    group.path("m19.49 24.491 5.886-5.885")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.725, linejoin: "miter"});
    group.path("M14.82 33.154s7.301 5.631 15.461 0")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.1});
    symbol.viewbox(7.8275, 6.1345, 29.684, 34.5405);
    return symbol;
});

sheet.glyphs.set("chess-fool-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M 11,4.03125 C 3.5294233,4.307579 -2.2527669,13.467098 4.875,30.9375 C 2.7190442,20.869809 11.097817,2.189825 15,32 C 15.319206,31.516605 13.03125,37.948069 13.03125,38 C 13.03125,39.64551 17.26649,40.96875 22.5,40.96875 C 27.73351,40.96875 31.96875,39.645509 31.96875,38 C 31.96875,37.948069 29.650157,31.470209 30,32 C 33.902182,2.189825 42.280956,20.869809 40.125,30.9375 C 50.98636,4.3159342 31.825237,-2.998259 22.5,11 C 19.29445,6.1880985 14.913159,3.8865063 11,4.03125 z");
    group.path("M9.71 34.922a3.17 4.831 0 1 1-6.338 0 3.17 4.831 0 1 1 6.338 0");
    group.path("M35.291 34.922a3.17 4.831 0 1 0 6.339 0 3.17 4.831 0 1 0-6.339 0");
    group.path("M 15,32 C 18.081956,26.861014 20.957096,22.849586 22.5,11")
        .fill("none");
    group.path("M30 32c-3.082-5.139-5.957-9.15-7.5-21")
        .fill("none");
    group.path("M 15,32 C 20,30 25,30.01558 30,32")
        .fill("none");
    symbol.viewbox(0.1306, 2.5248, 44.7343, 39.9439);
    return symbol;
});

sheet.glyphs.set("chess-fool-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M 11,4.03125 C 3.5294233,4.307579 -2.2527669,13.467098 4.875,30.9375 C 2.7190442,20.869809 11.097817,2.189825 15,32 C 15.340796,31.483909 14.047114,35.752837 13,37.84375 L 22.5,35 L 31.9375,37.84375 C 30.866729,35.705598 29.617605,31.420914 30,32 C 33.902182,2.189825 42.280956,20.869809 40.125,30.9375 C 50.98636,4.3159342 31.825237,-2.998259 22.5,11 C 19.29445,6.1880985 14.913159,3.8865063 11,4.03125 z");
    group.path("M9.71 34.922a3.17 4.831 0 1 1-6.338 0 3.17 4.831 0 1 1 6.338 0");
    group.path("M35.291 34.922a3.17 4.831 0 1 0 6.339 0 3.17 4.831 0 1 0-6.339 0");
    group.path("M 15,32 C 18.081956,26.861014 20.957096,22.849586 22.5,11")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5});
    group.path("M30 32c-3.082-5.139-5.957-9.15-7.5-21")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5});
    group.path("M 15,32 C 20,30 25,30.01558 30,32")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5});
    symbol.viewbox(0.1306, 2.5248, 44.7343, 37.1885);
    return symbol;
});

sheet.glyphs.set("chess-giraffe-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("m17.6,4.8l3,0")
        .fill("none");
    group.path("m19.2,9.9l0,-7.7")
        .fill("none");
    group.path("m39.5,40.1003l0,-5.478001c-6.243401,-2.459599 -4.459599,-20.018399 -8.919201,-24.117703c1.059601,-1.09367 4.459602,-2.45955 1.783901,-3.279408c-5.351601,-1.63971 -3.567801,0 -7.135401,1.63972c-3.567699,0 -10.703099,-3.27943 -12.486899,6.55879c-1.7838,3.279499 -5.35153,3.279499 -7.13536,6.558897c-1.12738,2.066 1.78383,6.558805 7.13536,1.6397c5.351501,0 8.9192,0 10.703,-3.2794c1.783899,3.2794 4.567699,4.3603 4.567699,20.757404l11.4869,0l0,-1z");
    group.path("m21.1,5.9l3,0")
        .fill("none");
    group.path("m22.7,11l0,-7.7")
        .fill("none");
    group.path("m16.37441,14.57421a0.433,1.299 0 1 1 -0.866,-0.5a0.433,1.299 0 1 1 0.866,0.5z")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("m31.1,22.5a1.73,2.5 0 1 1 -3.46,0a1.73,2.5 0 1 1 3.46,0z")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("m33.3,30.5a1.73,2.5 0 1 1 -3.46,0a1.73,2.5 0 1 1 3.46,0z")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("m37.1,36.5a1.73,2.5 0 1 1 -3.46,0a1.73,2.5 0 1 1 3.46,0z")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    symbol.viewbox(3.8665, 0.7, 37.1335, 41.9003);
    return symbol;
});

sheet.glyphs.set("chess-giraffe-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("m39.5,40.1003l0,-5.478001c-6.243401,-2.459599 -4.459599,-20.018399 -8.919201,-24.117703c1.059601,-1.09367 4.459602,-2.45955 1.783901,-3.279408c-5.351601,-1.63971 -3.567801,0 -7.135401,1.63972c-3.567699,0 -10.703099,-3.27943 -12.486899,6.55879c-1.7838,3.279499 -5.35153,3.279499 -7.13536,6.558897c-1.12738,2.066 1.78383,6.558805 7.13536,1.6397c5.351501,0 8.9192,0 10.703,-3.2794c1.783899,3.2794 4.567699,4.3603 4.567699,20.757404l11.4869,0l0,-1z");
    group.path("m17.6,4.8l3,0")
        .fill("none")
        .stroke({color: "#000", width: 1.5});
    group.path("m19.2,9.9l0,-7.7")
        .fill("none")
        .stroke({color: "#000", width: 1.5});
    group.path("m21.1,5.9l3,0")
        .fill("none")
        .stroke({color: "#000", width: 1.5});
    group.path("m22.7,11l0,-7.7")
        .fill("none")
        .stroke({color: "#000", width: 1.5});
    group.path("m16.37441,14.57421a0.433,1.299 0 1 1 -0.866,-0.5a0.433,1.299 0 1 1 0.866,0.5z")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("m31.1,22.5a1.73,2.5 0 1 1 -3.46,0a1.73,2.5 0 1 1 3.46,0z")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("m33.3,30.5a1.73,2.5 0 1 1 -3.46,0a1.73,2.5 0 1 1 3.46,0z")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("m37.1,36.5a1.73,2.5 0 1 1 -3.46,0a1.73,2.5 0 1 1 3.46,0z")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    symbol.viewbox(3.8665, 0.7, 37.1335, 41.9003);
    return symbol;
});

sheet.glyphs.set("chess-king-outline-line", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M2048 3348h-612v271h477v207h270v-207h476v-271h-611zM1159 1298h1777v-1028h-1777v1028zM2392 2096h369l356 518l-360 2zM1703 2096l-361 518h-363l367 -518h357zM1900 2616v-520h297v520h-297zM2936 1570h-1777l-966 1499h3710z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .fill("#fff");
    group.path("M2048 3348h-612v271h477v207h270v-207h476v-271h-611zM2773 1844l622 954h-2698l626 -954h1450zM2936 1570h-1777l-966 1499h3710zM1913 2591h270v-471h-270v471zM1792 2120l-324 -1l-333 470h330zM2304 2120l330 471l327 -1l-323 -470h-334zM1436 1027v-479h1223v479 h-1223zM1159 1298h1777v-1028h-1777v1028z")
        .rotate(180, 0, 0)
        .attr("data-playerfill2", true)
        .fill("#000");
    group.viewbox(-3903.0000000000005, -3902.9999999999995, 3710, 3710);
    return group;
});

sheet.glyphs.set("chess-king-outline-millenia", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M1178 1399v-93l528 -282v-853h-1365v853l530 280v95h-291v307h291v171h307v-171h290v-307h-290zM1401 820l-374 199l-380 -199v-342h754v342z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .fill("#fff");
    group.path("M1470 855l-2 -445h-888v450l445 232zM1178 1399v-93l528 -282v-853h-1365v853l530 280v95h-291v307h291v171h307v-171h290v-307h-290zM1401 820l-374 199l-380 -199v-342h754v342zM1110 1264l-1 203h292v171h-292v171h-170v-171h-292v-171h292l-1 -205l-529 -284v-739 h1230v744z")
        .rotate(180, 0, 0)
        .attr("data-playerfill2", true)
        .fill("#000");
    group.viewbox(-1876.5000000000002, -1877, 1706.0000000000002, 1706.0000000000002);
    return group;
});

sheet.glyphs.set("chess-king-outline-montreal", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M397 353q16 -11 31 -18q-19 -87 -65 -141t-103 -54q-50 0 -85 35t-35 85q0 57 54 103t141 66q5 -15 17 -32q-74 -11 -123 -49t-49 -88q0 -33 23.5 -56.5t56.5 -23.5q50 0 88 49t49 124zM500 600q-41 0 -70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5t-29.5 70.5t-70.5 29.5zM665 429q87 -20 141 -66t54 -103q0 -50 -35 -85t-85 -35q-57 0 -103 54t-65 141q15 7 31 18q11 -75 49 -124t88 -49q33 0 56.5 23.5t23.5 56.5q0 50 -49 88t-123 49q12 17 17 32zM647 603q75 11 124 49t49 88q0 33 -23.5 56.5t-56.5 23.5q-50 0 -88 -49t-49 -124q-12 9 -31 18q19 87 65 141t103 54q50 0 85 -35t35 -85q0 -57 -54 -103t-141 -65q-9 19 -18 31zM397 647q-11 75 -49 124t-88 49q-33 0 -56.5 -23.5t-23.5 -56.5q0 -50 49 -88t124 -49q-9 -12 -18 -31q-86 19 -139.5 65t-53.5 103q0 49 35 84.5t83 35.5q57 0 103 -54t66 -141q-18 -8 -32 -18zM500 640q58 0 99 -41t41 -99t-41 -99t-99 -41t-99 41t-41 99t41 99t99 41zM440 811q-36 61 -82 95t-98 34q-41 0 -77 -15.5t-64 -43t-43.5 -64t-15.5 -77.5q0 -52 34 -98t95 -82h-69v-120h69q-61 -36 -95 -82t-34 -98q0 -41 15.5 -77t43.5 -64t64 -43.5t77 -15.5q52 0 98 34t82 95v-69h120v69q36 -61 82.5 -95t97.5 -34q41 0 77.5 15.5t64 43.5t43 64t15.5 77q0 52 -34 98t-95 82h69v120h-69q61 36 95 82t34 98q0 41 -15.5 77.5t-43 64t-64 43t-77.5 15.5q-51 0 -97.5 -34t-82.5 -95v69h-120v-69z")
        .attr("data-playerfill", true)
        .fill("#fff");
    group.path("M500 560q25 0 42.5 -17.5t17.5 -42.5t-17.5 -42.5t-42.5 -17.5t-42.5 17.5t-17.5 42.5t17.5 42.5t42.5 17.5zM500 600q-41 0 -70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5t-29.5 70.5t-70.5 29.5zM320 500q0 -18 5 -40h-165v40v40h165q-5 -22 -5 -40zM342 415q25 -47 73 -74q-6 -50 -20.5 -95t-35.5 -77.5t-46.5 -50.5t-52.5 -18q-32 0 -61.5 12.5t-51.5 34.5t-34.5 51.5t-12.5 61.5q0 55 68.5 98t173.5 57zM658 415q106 -14 174 -57t68 -98q0 -32 -12.5 -61.5t-34.5 -51.5t-51.5 -34.5t-61.5 -12.5q-27 0 -52.5 18t-46.5 50.5t-35.5 77t-20.5 95.5q49 27 73 74zM880 500v80h-101q75 29 118 70.5t43 89.5q0 41 -15.5 77.5t-43 64t-64 43t-77.5 15.5q-48 0 -90 -43t-70 -117v100h-80h-80v-100q-27 74 -69.5 117t-90.5 43q-41 0 -77 -15.5t-64 -43t-43.5 -64t-15.5 -77.5q0 -48 43 -89.5t118 -70.5h-101v-80v-80h101q-75 -28 -118 -70t-43 -90q0 -41 15.5 -77t43.5 -64t64 -43.5t77 -15.5q48 0 90.5 43t69.5 117v-100h80h80v100q28 -74 70 -117t90 -43q41 0 77.5 15.5t64 43.5t43 64t15.5 77q0 48 -43 90t-118 70h101v80zM500 160h-40v124v40q26 -4 40 -4t40 4v-40v-124h-40zM680 500q0 18 -5 40h165v-40v-40h-165q5 22 5 40zM360 500q0 58 41 99t99 41t99 -41t41 -99t-41 -99t-99 -41t-99 41t-41 99zM500 840h40v-124v-40q-26 4 -40 4t-40 -4v40v124h40zM658 585q-24 47 -73 74q6 50 20.5 95t35.5 77.5t46.5 50.5t52.5 18q32 0 61.5 -12.5t51.5 -34.5t34.5 -51.5t12.5 -61.5q0 -55 -68 -98t-174 -57zM342 585q-105 14 -173.5 57t-68.5 98q0 32 12.5 61.5t34.5 51.5t51.5 34.5t61.5 12.5q27 0 52.5 -18t46.5 -50.5t35.5 -77t20.5 -95.5q-48 -27 -73 -74z")
        .attr("data-playerfill2", true)
        .fill("#000");
    group.viewbox(60, 60, 880, 880);
    return group;
});

sheet.glyphs.set("chess-king-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerstroke2", true)
        .fill({color: "none", rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round"})
    group.path("M22.5 11.63V6M20 8h5")
        .stroke({color: "#000", linejoin: "miter"});
    group.path("M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5")
        .attr("data-playerfill", true)
        .fill("#fff")
        .stroke({linejoin: "miter", linecap: "butt"})
    group.path("M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7")
        .attr("data-playerfill", true)
        .fill("#fff")
    group.path("M12.5 30c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0")
    symbol.viewbox(4.922, 5.25, 35.157, 35.157);
    return symbol;
});

sheet.glyphs.set("chess-king-solid-line", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M2048 3348h-612v271h477v207h270v-207h476v-271h-611zM1159 1298h1777v-1028h-1777v1028zM2392 2096h369l356 518l-360 2zM1703 2096l-361 518h-363l367 -518h357zM1900 2616v-520h297v520h-297zM2936 1570h-1777l-966 1499h3710z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    group.viewbox(-3903.0000000000005, -3902.9999999999995, 3710, 3710);
    return group;
});

sheet.glyphs.set("chess-king-solid-millenia", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M1178 1399v-93l528 -282v-853h-1365v853l530 280v95h-291v307h291v171h307v-171h290v-307h-290zM1401 820l-374 199l-380 -199v-342h754v342z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    group.viewbox(-1876.5000000000002, -1877, 1706.0000000000002, 1706.0000000000002);
    return group;
});

sheet.glyphs.set("chess-king-solid-montreal", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M397 353q16 -11 31 -18q-19 -87 -65 -141t-103 -54q-50 0 -85 35t-35 85q0 57 54 103t141 66q5 -15 17 -32q-74 -11 -123 -49t-49 -88q0 -33 23.5 -56.5t56.5 -23.5q50 0 88 49t49 124zM500 600q-41 0 -70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5t-29.5 70.5t-70.5 29.5zM665 429q87 -20 141 -66t54 -103q0 -50 -35 -85t-85 -35q-57 0 -103 54t-65 141q15 7 31 18q11 -75 49 -124t88 -49q33 0 56.5 23.5t23.5 56.5q0 50 -49 88t-123 49q12 17 17 32zM647 603q75 11 124 49t49 88q0 33 -23.5 56.5t-56.5 23.5q-50 0 -88 -49t-49 -124q-12 9 -31 18q19 87 65 141t103 54q50 0 85 -35t35 -85q0 -57 -54 -103t-141 -65q-9 19 -18 31zM397 647q-11 75 -49 124t-88 49q-33 0 -56.5 -23.5t-23.5 -56.5q0 -50 49 -88t124 -49q-9 -12 -18 -31q-86 19 -139.5 65t-53.5 103q0 49 35 84.5t83 35.5q57 0 103 -54t66 -141q-18 -8 -32 -18zM500 640q58 0 99 -41t41 -99t-41 -99t-99 -41t-99 41t-41 99t41 99t99 41zM440 811q-36 61 -82 95t-98 34q-41 0 -77 -15.5t-64 -43t-43.5 -64t-15.5 -77.5q0 -52 34 -98t95 -82h-69v-120h69q-61 -36 -95 -82t-34 -98q0 -41 15.5 -77t43.5 -64t64 -43.5t77 -15.5q52 0 98 34t82 95v-69h120v69q36 -61 82.5 -95t97.5 -34q41 0 77.5 15.5t64 43.5t43 64t15.5 77q0 52 -34 98t-95 82h69v120h-69q61 36 95 82t34 98q0 41 -15.5 77.5t-43 64t-64 43t-77.5 15.5q-51 0 -97.5 -34t-82.5 -95v69h-120v-69z")
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    group.viewbox(60, 60, 880, 880);
    return group;
});

sheet.glyphs.set("chess-king-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4})
    group.path("M 22.5,11.63 L 22.5,6")
        .stroke({linejoin: "miter"});
    group.path("M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25")
        .stroke({linecap: "butt", linejoin: "miter"});
    group.path("M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37");
    group.path("M 20,8 L 25,8")
        .stroke({linejoin: "miter"});
    group.path("M 32,29.5 C 32,29.5 40.5,25.5 38.03,19.85 C 34.15,14 25,18 22.5,24.5 L 22.5,26.6 L 22.5,24.5 C 20,18 10.85,14 6.97,19.85 C 4.5,25.5 13,29.5 13,29.5")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke("#fff");
    group.path("M 12.5,30 C 18,27 27,27 32.5,30 M 12.5,33.5 C 18,30.5 27,30.5 32.5,33.5 M 12.5,37 C 18,34 27,34 32.5,37")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke("#fff");
    symbol.viewbox(4.922, 5.250, 35.157, 35.157);
    return symbol;
});

sheet.glyphs.set("chess-knight-outline-line", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M3113 1196l1 850l-398 398l-268 -119l394 -395v-734h271zM1953 2914q-170 0 -170 -170t170 -170q171 0 171 170t-171 170zM1627 3137q42 10 96 47q49 34 77 73l215 151l-214 216l196 196l1565 -1572v-1978l-2385 1v289l548 1162l-767 -280l-431 924z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .fill("#fff");
    group.path("M2014 2867q185 0 185 -185t-185 -185q-184 0 -184 185t184 185zM3031 1155h-271v734l-394 395l268 120l398 -399zM3562 549v-279h-2384l-2 278l549 1174l-767 -280l-431 924l1488 1042l-214 216l196 196l1565 -1576v-1695zM2095 1860l-612 -1312h1809l1 1587l-1075 1075 l-1341 -938l223 -479l1059 386l95 -260z")
        .rotate(180, 0, 0)
        .attr("data-playerfill2", true)
        .fill("#000");
    group.viewbox(-3819.5000000000005, -3819.9999999999995, 3550, 3550);
    return group;
});

sheet.glyphs.set("chess-knight-outline-millenia", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M1024 1020l-377 -200v-342h754v342zM1706 1706v-323l-334 -180l334 -179v-853h-1365v853l708 375h-708v307h1365z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .fill("#fff");
    group.path("M1639 1422v216h-1230v-171h911l-911 -485v-743h1230v748l-410 215zM1706 1706v-323l-334 -180l334 -179v-853h-1365v853l708 375h-708v307h1365zM1470 855l-2 -445h-888v450l445 232zM1024 1020l-377 -200v-342h754v342z")
        .rotate(180, 0, 0)
        .attr("data-playerfill2", true)
        .fill("#000");
    group.viewbox(-1791.0000000000002, -1706, 1535.0000000000002, 1535.0000000000002);
    return group;
});

sheet.glyphs.set("chess-knight-outline-montreal", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M631 347l149 93l60 60l-60 60q14 7 22.5 25.5t12 39t4.5 35t1 20.5q0 56 -24.5 104.5t-62.5 85t-79 59.5t-74 31v-80h-280q-36 -14 -55.5 -41.5t-19.5 -58.5t19.5 -58t55.5 -42h60q0 -13 9 -27l-149 -93l-60 -60l60 -60q-14 -7 -22.5 -25.5t-12 -39t-4.5 -35t-1 -20.5q0 -56 24.5 -104.5t62.5 -85t79 -59.5t74 -31v80h280q36 15 55.5 42t19.5 58t-19.5 58.5t-55.5 41.5h-60q0 14 -9 27zM460 360l20 40zM300 440q-14 -7 -22.5 -25.5t-12 -39t-4.5 -35t-1 -20.5q0 -48 17 -83t39.5 -56t39 -29.5t24.5 -11.5v-40q-10 4 -32.5 16t-52.5 38.5t-52.5 68.5t-22.5 97q0 6 1 20.5t4.5 35t12 39t22.5 25.5h40zM605 370l-20 -40q-23 14 -55.5 22t-69.5 8l20 40q37 0 69.5 -8t55.5 -22zM395 630l20 40q23 -14 55.5 -22t69.5 -8l-20 -40q-37 0 -69.5 8t-55.5 22zM740 560h-40q14 7 22.5 25.5t12 39t4.5 35t1 20.5q0 48 -17 83t-39.5 56t-39 30t-24.5 11v40q10 -4 32.5 -16t52.5 -38.5t52.5 -68.5t22.5 -97q0 -6 -1 -20.5t-4.5 -35t-12 -39t-22.5 -25.5zM420 200q-8 0 -14 6t-6 14t6 14t14 6t14 -6t6 -14t-6 -14t-14 -6zM580 800q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM780 500l-20 -20h-200l-20 20l20 20h200zM220 500l20 20h200l20 -20l-20 -20h-200z")
        .attr("data-playerfill", true)
        .fill("#fff");
    group.path("M420 200q8 0 14 6t6 14t-6 14t-14 6t-14 -6t-6 -14t6 -14t14 -6zM580 800q-8 0 -14 -6t-6 -14t6 -14t14 -6t14 6t6 14t-6 14t-14 6zM468 440l32 32l32 -32h168l-104 -65q-34 16 -67 20.5t-49 4.5l-20 -40q10 0 32 -1.5t52.5 -9.5t53 -24.5t22.5 -44.5h60q45 -30 45 -60t-45 -60h-300v-60q-10 4 -32.5 16t-52.5 38.5t-52.5 68.5t-22.5 97q0 6 1 20.5t4.5 35t12 39t22.5 25.5h208zM532 560l-32 -32l-32 32h-168l104 65q34 -16 67 -20.5t49 -4.5l20 40q-10 0 -32 2t-52.5 9.5t-53 24.5t-22.5 44h-60q-45 30 -45 60t45 60h300v60q10 -4 32.5 -16t52.5 -38.5t52.5 -68.5t22.5 -97q0 -6 -1 -20.5t-4.5 -35t-12 -39t-22.5 -25.5h-208zM548 480l-20 20l20 20h212l20 -20l-20 -20h-212zM452 520l20 -20l-20 -20h-212l-20 20l20 20h212zM160 500l60 -60q-14 -7 -22.5 -25.5t-12 -39t-4.5 -35t-1 -20.5q0 -56 24.5 -104.5t62.5 -85t79 -59.5t74 -31v80h280q36 15 55.5 42t19.5 58t-19.5 58.5t-55.5 41.5h-60q0 14 -8 27l148 93l60 60l-60 60q14 7 22.5 25.5t12 39t4.5 35t1 20.5q0 56 -24.5 104.5t-62.5 85t-79 59.5t-74 31v-80h-280q-36 -14 -55.5 -41.5t-19.5 -58.5t19.5 -58t55.5 -42h60q0 -14 8 -27l-148 -93z")
        .attr("data-playerfill2", true)
        .fill("#000");
    group.viewbox(40, 40, 920, 920);
    return group;
});

sheet.glyphs.set("chess-knight-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4})
        .translate(0, 0.3);
    group.path("M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18");
    group.path("M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10");
    group.path("M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z")
        .attr("data-playerfill2", true)
        .fill("#000");
    group.path("M 15 15.5 A 0.5 1.5 0 1 1  14,15.5 A 0.5 1.5 0 1 1  15 15.5 z")
        .attr("data-playerfill2", true)
        .fill("#000")
        .matrix(0.866,0.5,-0.5,0.866,9.693,-5.173);
    symbol.viewbox(5.25, 6.5355, 33.529, 33.529);
    return symbol;
});

sheet.glyphs.set("chess-knight-solid-line", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M3113 1196l1 850l-398 398l-268 -119l394 -395v-734h271zM1953 2914q-170 0 -170 -170t170 -170q171 0 171 170t-171 170zM1627 3137q42 10 96 47q49 34 77 73l215 151l-214 216l196 196l1565 -1572v-1978l-2385 1v289l548 1162l-767 -280l-431 924z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    group.viewbox(-3819.5000000000005, -3819.9999999999995, 3550, 3550);
    return group;
});

sheet.glyphs.set("chess-knight-solid-millenia", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M1024 1020l-377 -200v-342h754v342zM1706 1706v-323l-334 -180l334 -179v-853h-1365v853l708 375h-708v307h1365z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    group.viewbox(-1791.0000000000002, -1706, 1535.0000000000002, 1535.0000000000002);
    return group;
});

sheet.glyphs.set("chess-knight-solid-montreal", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M631 347l149 93l60 60l-60 60q14 7 22.5 25.5t12 39t4.5 35t1 20.5q0 56 -24.5 104.5t-62.5 85t-79 59.5t-74 31v-80h-280q-36 -14 -55.5 -41.5t-19.5 -58.5t19.5 -58t55.5 -42h60q0 -13 9 -27l-149 -93l-60 -60l60 -60q-14 -7 -22.5 -25.5t-12 -39t-4.5 -35t-1 -20.5q0 -56 24.5 -104.5t62.5 -85t79 -59.5t74 -31v80h280q36 15 55.5 42t19.5 58t-19.5 58.5t-55.5 41.5h-60q0 14 -9 27zM460 360l20 40zM300 440q-14 -7 -22.5 -25.5t-12 -39t-4.5 -35t-1 -20.5q0 -48 17 -83t39.5 -56t39 -29.5t24.5 -11.5v-40q-10 4 -32.5 16t-52.5 38.5t-52.5 68.5t-22.5 97q0 6 1 20.5t4.5 35t12 39t22.5 25.5h40zM605 370l-20 -40q-23 14 -55.5 22t-69.5 8l20 40q37 0 69.5 -8t55.5 -22zM395 630l20 40q23 -14 55.5 -22t69.5 -8l-20 -40q-37 0 -69.5 8t-55.5 22zM740 560h-40q14 7 22.5 25.5t12 39t4.5 35t1 20.5q0 48 -17 83t-39.5 56t-39 30t-24.5 11v40q10 -4 32.5 -16t52.5 -38.5t52.5 -68.5t22.5 -97q0 -6 -1 -20.5t-4.5 -35t-12 -39t-22.5 -25.5zM420 200q-8 0 -14 6t-6 14t6 14t14 6t14 -6t6 -14t-6 -14t-14 -6zM580 800q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM780 500l-20 -20h-200l-20 20l20 20h200zM220 500l20 20h200l20 -20l-20 -20h-200z")
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    group.viewbox(40, 40, 920, 920);
    return group;
});

sheet.glyphs.set("chess-knight-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4})
        .translate(0, 0.3);
    group.path("M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18");
    group.path("M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10");
    const bGroup = group.group()
        .attr("data-playerfill2", true)
        .fill("#fff");
    bGroup.path("M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z");
    bGroup.path("M 15 15.5 A 0.5 1.5 0 1 1  14,15.5 A 0.5 1.5 0 1 1  15 15.5 z")
        .matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)
        .stroke({color: "#fff", linejoin: "miter"});
    bGroup.path("M 24.55,10.4 L 24.1,11.85 L 24.6,12 C 27.75,13 30.25,14.49 32.5,18.75 C 34.75,23.01 35.75,29.06 35.25,39 L 35.2,39.5 L 37.45,39.5 L 37.5,39 C 38,28.94 36.62,22.15 34.25,17.66 C 31.88,13.17 28.46,11.02 25.06,10.5 L 24.55,10.4 z")
        .stroke("none");
    symbol.viewbox(5.25, 6.5355, 33.529, 33.529);
    return symbol;
});

sheet.glyphs.set("chess-mann-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("m22.5 1.9883-4.661 11.427-9.0148-8.872 2.6828 11.601-6.5109 3.4966 6.9219 3.998v9.6403l-3.957 2.8363v6.0039h7.1328v-2.3398h3.8125v2.3398h7.1875v-2.3398h3.8125v2.3398h7.1328l-.0039-5.9922-3.9531-2.7679v-9.7204l6.9219-3.998-6.5109-3.4966 2.6828-11.601-9.0148 8.872z");
    group.path("M22.5 29.213v4.3784m-4-8.3784v4.3784m8-4.3784v4.3784m6.566 3.8566H11.934m25.115 3H7.951M26.5 33.413l2 3.078m-10-3.078-2 3.078")
        .fill("none");
    group.path("m18.53 19.449 3.9699-3.9699 3.9699 3.9699-3.9699 3.9699z")
        .fill("none");
    group.path("M32.796 29.448H12.203m20.593-4H12.203")
        .fill("none");
    group.path("M11.928 16.852v6.7875")
        .fill("none");
    group.path("M11.928 17.64A10.572 4.0519 0 0 1 22.5 13.5881 10.572 4.0519 0 0 1 33.072 17.64")
        .fill("none");
    group.path("M33.072 16.852v6.7875")
        .fill("none");
    symbol.viewbox(3.4961, 0.4883, 38.0079, 43.1311);
    return symbol;
});

sheet.glyphs.set("chess-mann-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("m22.5 1.9883-4.661 11.427-9.0148-8.872 2.6828 11.601-6.5109 3.4966 6.9219 3.998v9.6403l-3.957 2.8363v6.0039h7.1328v-2.3398h3.8125v2.3398h7.1875v-2.3398h3.8125v2.3398h7.1328l-.0039-5.9922-3.9531-2.7679v-9.7204l6.9219-3.998-6.5109-3.4966 2.6828-11.601-9.0148 8.872z");
    group.path("M22.5 29.213v4.3784m-4-8.3784v4.3784m8-4.3784v4.3784m6.566 3.8566H11.934m25.115 3H7.951M26.5 33.413l2 3.078m-10-3.078-2 3.078")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 0.9});
    group.path("m18.52992 19.44895 3.96993-3.96992 3.96993 3.96992-3.96993 3.96993z")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.5});
    group.path("M32.796 29.448H12.203m20.593-4H12.203")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 0.9});
    group.path("M13.344 15.614a10.572 4.0519 0 0 1 9.1558-2.026 10.572 4.0519 0 0 1 9.1558 2.026")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 0.9});
    symbol.viewbox(3.4961, 0.4883, 38.0079, 43.1311);
    return symbol;
});

sheet.glyphs.set("chess-nightrider-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M21.504 10c10.999 1.002 17 8.002 16.497 29.002H15.004c0-9 10.001-6.499 8.002-21");
    group.path("M24.001 18.002c.381 2.91-5.55 7.37-7.998 9-3.001 2-2.822 4.34-5 4.002-1.045-.939 1.407-3.044 0-3-1.002 0 .187 1.228-1.002 1.999-1.001 0-4.002 1.001-4-4C6.002 24.002 12.004 14 12.004 14s1.889-1.9 1.997-3.498c-.498-1.002-.498-2.504-2.5-5C13.002 4.5 16.5 10 16.5 10h2.003C19 8 19.5 6 19 4.5c1.501-.5 2.002 2.503 2.503 5.5");
    group.path("m13 13-4 6 25-3-6-5Z")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("M9.5 25.503a.5.5 0 1 1-.998 0 .5.5 0 1 1 .998 0")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("M15.8 14.751a.5 1.502 60 1 1-2.6 1.502.5 1.502 60 1 1 2.6-1.502")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("M30.003 12.003h7.5V14h-7.5Z");
    group.path("M34.002 16.003h6.502v2h-6.502Z");
    group.path("M36.004 20.002h6.002v2h-6.002Z");
    group.path("M37.006 25.002h5.498v2h-5.501Z");
    group.path("M38.001 30.003h5.003v2h-5.003Z");
    group.path("M38.001 35.003h5.003v2h-5.003Z");
    symbol.viewbox(4.501, 2.9451, 40.003, 37.5569);
    return symbol;
});

sheet.glyphs.set("chess-nightrider-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M21.504 10c10.999 1.002 17 8.002 16.497 29.002H15.004c0-9 10.001-6.499 8.002-21");
    group.path("M24.001 18.002c.381 2.91-5.55 7.37-7.998 9-3.001 2-2.822 4.34-5 4.002-1.045-.939 1.407-3.044 0-3-1.002 0 .187 1.228-1.002 1.999-1.001 0-4.002 1.001-4-4C6.002 24.002 12.004 14 12.004 14s1.889-1.9 1.997-3.498c-.498-1.002-.498-2.504-2.5-5C13.002 4.5 16.5 10 16.5 10h2.003C19 8 19.5 6 19 4.5c1.501-.5 2.002 2.503 2.503 5.5");
    group.path("M30.003 12.003h7.5V14h-7.5Z");
    group.path("M34.002 16.003h6.502v2h-6.502Z");
    group.path("M36.004 20.002h6.002v2h-6.002Z");
    group.path("M37.006 25.002h5.498v2h-5.501Z");
    group.path("M38.001 30.003h5.003v2h-5.003Z");
    group.path("M38.001 35.003h5.003v2h-5.003Z");
    group.path("M12.8 12.999C11.8 14 10 17 9.102 19l23.902-2.998-6.002-5Z")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("m24.553 10.402-.45 1.45.498.149c3.152 1 5.652 2.491 7.902 6.752 2.25 4.258 3.251 10.308 2.75 20.252l-.05.498h2.25l.05-.5c.501-10.061-.881-16.85-3.25-21.342s-5.79-6.639-9.188-7.16Z")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("M9.5 25.503a.5.5 0 1 1-.998 0 .5.5 0 1 1 .998 0")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("M15.8 14.751a.5 1.502 60 1 1-2.6 1.502.5 1.502 60 1 1 2.6-1.502");
    symbol.viewbox(4.501, 2.9451, 40.003, 38.0579);
    return symbol;
});

sheet.glyphs.set("chess-pawn-outline-line", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M1159 1298h1777v-1028h-1777v1028zM1572 2526h952v-956h-952v956z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .fill("#fff");
    group.path("M1159 1298h1777v-1028h-1777v1028zM1436 1027v-479h1223v479h-1223zM1842 2255v-414h412v414h-412zM1572 2526h952v-956h-952v956z")
        .rotate(180, 0, 0)
        .attr("data-playerstroke2", true)
        .stroke({width: 5, color: "#000"})
        .attr("data-playerfill2", true)
        .fill("#000");
    group.viewbox(-3175.5, -2526, 2256.0000000000005, 2256.0000000000005);
    return group;
});

sheet.glyphs.set("chess-pawn-outline-millenia", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M341 1024l686 364l679 -364v-853h-1365v853zM1025 1020l-378 -200v-342h754v342z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .fill("#fff");
    group.path("M1470 855q-1 -111 -1.5 -222.5t-0.5 -222.5h-444h-444v224.5v225.5q111 57 222.5 115.5t222.5 116.5q111 -60 222 -119t223 -118zM1639 983l-612 326l-618 -331v-739h1230v744zM341 1024l686 364l679 -364v-853h-1365v853zM1025 1020q-95 -50 -189.5 -100t-188.5 -100 v-171.5v-170.5h376.5h377.5v170.5v171.5q-95 50 -189 100t-187 100z")
        .rotate(180, 0, 0)
        .attr("data-playerfill2", true)
        .fill("#000");
    group.viewbox(-1706.0000000000002, -1462, 1365.0000000000002, 1365.0000000000002);
    return group;
});

sheet.glyphs.set("chess-pawn-outline-montreal", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M500 620q-50 0 -85 -35t-35 -85t35 -85t85 -35t85 35t35 85t-35 85t-85 35zM500 660q32 0 61.5 -12.5t51.5 -34.5t34.5 -51.5t12.5 -61.5t-12.5 -61.5t-34.5 -51.5t-51.5 -34.5t-61.5 -12.5t-61.5 12.5t-51.5 34.5t-34.5 51.5t-12.5 61.5t12.5 61.5t34.5 51.5t51.5 34.5t61.5 12.5zM500 720q-45 0 -85 -17t-70.5 -47.5t-47.5 -70.5t-17 -85t17 -85t47.5 -70.5t70.5 -47.5t85 -17t85 17t70.5 47.5t47.5 70.5t17 85t-17 85t-47.5 70.5t-70.5 47.5t-85 17z")
        .attr("data-playerfill", true)
        .fill("#fff");
    group.path("M500 680q37 0 69.5 -14t57.5 -39t39 -57.5t14 -69.5t-14 -69.5t-39 -57.5t-57.5 -39t-69.5 -14t-69.5 14t-57.5 39t-39 57.5t-14 69.5t14 69.5t39 57.5t57.5 39t69.5 14zM500 600q41 0 70.5 -29.5t29.5 -70.5t-29.5 -70.5t-70.5 -29.5t-70.5 29.5t-29.5 70.5t29.5 70.5t70.5 29.5zM500 640q-58 0 -99 -41t-41 -99t41 -99t99 -41t99 41t41 99t-41 99t-99 41zM500 720q-45 0 -85 -17t-70.5 -47.5t-47.5 -70.5t-17 -85t17 -85t47.5 -70.5t70.5 -47.5t85 -17t85 17t70.5 47.5t47.5 70.5t17 85t-17 85t-47.5 70.5t-70.5 47.5t-85 17z")
        .attr("data-playerfill2", true)
        .fill("#000");
    group.viewbox(280, 280, 440, 440);
    return group;
});

sheet.glyphs.set("chess-pawn-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    symbol.path("m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z")
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", rule: "nonzero"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "miter", miterlimit: 4});
    symbol.viewbox(6.5, 8.25, 32, 32);
    return symbol;
});

sheet.glyphs.set("chess-pawn-solid-line", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M1159 1298h1777v-1028h-1777v1028zM1572 2526h952v-956h-952v956z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .fill("#000");
    group.viewbox(-3175.5, -2526, 2256.0000000000005, 2256.0000000000005);
    return group;
});

sheet.glyphs.set("chess-pawn-solid-millenia", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M341 1024l686 364l679 -364v-853h-1365v853zM1025 1020l-378 -200v-342h754v342z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    group.viewbox(-1706.0000000000002, -1462, 1365.0000000000002, 1365.0000000000002);
    return group;
});

sheet.glyphs.set("chess-pawn-solid-montreal", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M500 620q-50 0 -85 -35t-35 -85t35 -85t85 -35t85 35t35 85t-35 85t-85 35zM500 660q32 0 61.5 -12.5t51.5 -34.5t34.5 -51.5t12.5 -61.5t-12.5 -61.5t-34.5 -51.5t-51.5 -34.5t-61.5 -12.5t-61.5 12.5t-51.5 34.5t-34.5 51.5t-12.5 61.5t12.5 61.5t34.5 51.5t51.5 34.5t61.5 12.5zM500 720q-45 0 -85 -17t-70.5 -47.5t-47.5 -70.5t-17 -85t17 -85t47.5 -70.5t70.5 -47.5t85 -17t85 17t70.5 47.5t47.5 70.5t17 85t-17 85t-47.5 70.5t-70.5 47.5t-85 17z")
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    group.viewbox(280, 280, 440, 440);
    return group;
});

sheet.glyphs.set("chess-pawn-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    symbol.path("m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z")
        .attr("data-playerfill", true)
        .fill({color: "#000", rule: "nonzero"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "miter", miterlimit: 4});
    symbol.viewbox(6.5, 8.25, 32, 32);
    return symbol;
});

sheet.glyphs.set("chess-queen-outline-line", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M1159 1298h1777v-1028h-1777v1028zM3905 3068l-969 -1498h-1777l-965 1498l1291 -349l563 975l564 -973zM2048 2120h281l-281 488l-285 -488h285z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .fill("#fff");
    group.path("M2048 2120h-285l285 488l281 -488h-281zM3282 2622l-802 -218l-432 749l-431 -747l-802 214l508 -776h1450zM3905 3068l-969 -1498h-1777l-965 1498l1291 -349l563 975l564 -973zM1436 1027v-479h1223v479h-1223zM1159 1298h1777v-1028h-1777v1028z")
        .rotate(180, 0, 0)
        .attr("data-playerfill2", true)
        .fill("#000");
    group.viewbox(-3905.0000000000005, -3837.4999999999995, 3711, 3711);
    return group;
});

sheet.glyphs.set("chess-queen-outline-millenia", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M1176 1467l225 121v289h305v-494l-336 -179l336 -180v-853h-1365v853l339 178l-339 181v494h306v-289l225 -119l-1 408h306zM1401 820l-376 200l-378 -200v-342h754v342z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .fill("#fff");
    group.path("M1470 855l-2 -445h-888v450l445 232zM1176 1467l225 121v289h305v-494l-336 -179l336 -180v-853h-1365v853l339 178l-339 181v494h306v-289l225 -119l-1 408h306zM1401 820l-376 200l-378 -200v-342h754v342zM1639 987l-410 215l410 222v385h-171v-260l-359 -193v453 h-170v-453l-359 193v260h-171l1 -385l409 -222l-409 -215l-1 -748h1230v748z")
        .rotate(180, 0, 0)
        .attr("data-playerfill2", true)
        .fill("#000");
    group.viewbox(-1876.5000000000002, -1877, 1706.0000000000002, 1706.0000000000002);
    return group;
});

sheet.glyphs.set("chess-queen-outline-montreal", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M500 520q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM240 780q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM140 520q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM240 260q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM500 160q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM760 260q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM860 520q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM760 780q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM500 880q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM960 500q0 41 -29.5 70.5t-70.5 29.5q-22 0 -42 -9.5t-34 -25.5l-62 26l30 69h8q41 0 70.5 29.5t29.5 70.5t-29.5 70.5t-70.5 29.5t-70.5 -29.5t-29.5 -70.5v-8l-70 -30l-26 62q17 14 26.5 34t9.5 42q0 41 -29.5 70.5t-70.5 29.5t-70.5 -29.5t-29.5 -70.5q0 -22 9.5 -42t26.5 -34l-26 -62l-70 30v8q0 41 -29.5 70.5t-70.5 29.5t-70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5h8l30 -69l-62 -26q-14 16 -34 25.5t-42 9.5q-41 0 -70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5q22 0 42 9.5t34 25.5l62 -26l-30 -69h-8q-41 0 -70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5v8l70 30l26 -62q-17 -14 -26.5 -34t-9.5 -42q0 -41 29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5q0 22 -9.5 42t-26.5 34l26 62l70 -30v-8q0 -41 29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5t-29.5 70.5t-70.5 29.5h-8l-30 69l62 26q14 -16 34 -25.5t42 -9.5q41 0 70.5 29.5t29.5 70.5zM500 640q58 0 99 -41t41 -99t-41 -99t-99 -41t-99 41t-41 99t41 99t99 41zM500 600q-41 0 -70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5t-29.5 70.5t-70.5 29.5z")
        .attr("data-playerfill", true)
        .fill("#fff");
    group.path("M500 520q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM500 560q-25 0 -42.5 -17.5t-17.5 -42.5t17.5 -42.5t42.5 -17.5t42.5 17.5t17.5 42.5t-17.5 42.5t-42.5 17.5zM500 600q41 0 70.5 -29.5t29.5 -70.5t-29.5 -70.5t-70.5 -29.5t-70.5 29.5t-29.5 70.5t29.5 70.5t70.5 29.5zM500 640q-58 0 -99 -41t-41 -99t41 -99t99 -41t99 41t41 99t-41 99t-99 41zM273 710q-17 -10 -33 -10q-25 0 -42.5 17.5t-17.5 42.5t17.5 42.5t42.5 17.5t42.5 -17.5t17.5 -42.5q0 -16 -10 -33l140 -57l54 132q-19 5 -31.5 21t-12.5 37q0 25 17.5 42.5t42.5 17.5t42.5 -17.5t17.5 -42.5q0 -21 -12.5 -37t-31.5 -21l54 -132l140 57q-10 17 -10 33q0 25 17.5 42.5t42.5 17.5t42.5 -17.5t17.5 -42.5t-17.5 -42.5t-42.5 -17.5q-16 0 -33 10l-57 -139l132 -55q5 19 21 31.5t37 12.5q25 0 42.5 -17.5t17.5 -42.5t-17.5 -42.5t-42.5 -17.5q-21 0 -37 12.5t-21 31.5l-132 -55l57 -139q17 10 33 10q25 0 42.5 -17.5t17.5 -42.5t-17.5 -42.5t-42.5 -17.5t-42.5 17.5t-17.5 42.5q0 16 10 33l-140 57l-54 -132q19 -5 31.5 -21t12.5 -37q0 -25 -17.5 -42.5t-42.5 -17.5t-42.5 17.5t-17.5 42.5q0 21 12.5 37t31.5 21l-54 132l-103 -42l-37 -15q10 -17 10 -33q0 -25 -17.5 -42.5t-42.5 -17.5t-42.5 17.5t-17.5 42.5t17.5 42.5t42.5 17.5q16 0 33 -10l57 139l-132 55q-5 -19 -21 -31.5t-37 -12.5q-25 0 -42.5 17.5t-17.5 42.5t17.5 42.5t42.5 17.5q21 0 37 -12.5t21 -31.5l132 55zM960 500q0 41 -29.5 70.5t-70.5 29.5q-22 0 -42 -9.5t-34 -25.5l-62 26l30 69h8q41 0 70.5 29.5t29.5 70.5t-29.5 70.5t-70.5 29.5t-70.5 -29.5t-29.5 -70.5v-8l-70 -30l-26 62q17 14 26.5 34t9.5 42q0 41 -29.5 70.5t-70.5 29.5t-70.5 -29.5t-29.5 -70.5q0 -22 9.5 -42t26.5 -34l-26 -62l-70 30v8q0 41 -29.5 70.5t-70.5 29.5t-70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5h8l30 -69l-62 -26q-14 16 -34 25.5t-42 9.5q-41 0 -70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5q22 0 42 9.5t34 25.5l62 -26l-30 -69h-8q-41 0 -70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5v8l70 30l26 -62q-17 -14 -26.5 -34t-9.5 -42q0 -41 29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5q0 22 -9.5 42t-26.5 34l26 62l70 -30v-8q0 -41 29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5t-29.5 70.5t-70.5 29.5h-8l-30 69l62 26q14 -16 34 -25.5t42 -9.5q41 0 70.5 29.5t29.5 70.5z")
        .attr("data-playerfill2", true)
        .fill("#000");
    group.viewbox(40, 40, 920, 920);
    return group;
});

sheet.glyphs.set("chess-queen-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill("#fff")
        .stroke({color: "#000", width: 1.5, linejoin: "round"})
    group.path("M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z");
    group.path("M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z");
    group.path("M 11.5,30 C 15,29 30,29 33.5,30");
    group.path("M 12,33.5 C 18,32.5 27,32.5 33,33.5");
    group.circle(4).center(6, 12);
    group.circle(4).center(14, 9);
    group.circle(4).center(22.5, 8);
    group.circle(4).center(31, 9);
    group.circle(4).center(39, 12);
    symbol.viewbox(3.25, 3.9715, 38.5, 38.5);
    return symbol;
});

sheet.glyphs.set("chess-queen-solid-line", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M1159 1298h1777v-1028h-1777v1028zM3905 3068l-969 -1498h-1777l-965 1498l1291 -349l563 975l564 -973zM2048 2120h281l-281 488l-285 -488h285z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    group.viewbox(-3905.0000000000005, -3837.4999999999995, 3711, 3711);
    return group;
});

sheet.glyphs.set("chess-queen-solid-millenia", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M1176 1467l225 121v289h305v-494l-336 -179l336 -180v-853h-1365v853l339 178l-339 181v494h306v-289l225 -119l-1 408h306zM1401 820l-376 200l-378 -200v-342h754v342z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    group.viewbox(-1876.5000000000002, -1877, 1706.0000000000002, 1706.0000000000002);
    return group;
});

sheet.glyphs.set("chess-queen-solid-montreal", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M500 520q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM240 780q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM140 520q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM240 260q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM500 160q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM760 260q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM860 520q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM760 780q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM500 880q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM960 500q0 41 -29.5 70.5t-70.5 29.5q-22 0 -42 -9.5t-34 -25.5l-62 26l30 69h8q41 0 70.5 29.5t29.5 70.5t-29.5 70.5t-70.5 29.5t-70.5 -29.5t-29.5 -70.5v-8l-70 -30l-26 62q17 14 26.5 34t9.5 42q0 41 -29.5 70.5t-70.5 29.5t-70.5 -29.5t-29.5 -70.5q0 -22 9.5 -42t26.5 -34l-26 -62l-70 30v8q0 41 -29.5 70.5t-70.5 29.5t-70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5h8l30 -69l-62 -26q-14 16 -34 25.5t-42 9.5q-41 0 -70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5q22 0 42 9.5t34 25.5l62 -26l-30 -69h-8q-41 0 -70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5v8l70 30l26 -62q-17 -14 -26.5 -34t-9.5 -42q0 -41 29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5q0 22 -9.5 42t-26.5 34l26 62l70 -30v-8q0 -41 29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5t-29.5 70.5t-70.5 29.5h-8l-30 69l62 26q14 -16 34 -25.5t42 -9.5q41 0 70.5 29.5t29.5 70.5zM500 640q58 0 99 -41t41 -99t-41 -99t-99 -41t-99 41t-41 99t41 99t99 41zM500 600q-41 0 -70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5t-29.5 70.5t-70.5 29.5z")
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    group.viewbox(40, 40, 920, 920);
    return group;
});

sheet.glyphs.set("chess-queen-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round"})
    group.path("M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z")
        .stroke({linecap: "butt"});
    group.path("m 9,26 c 0,2 1.5,2 2.5,4 1,1.5 1,1 0.5,3.5 -1.5,1 -1,2.5 -1,2.5 -1.5,1.5 0,2.5 0,2.5 6.5,1 16.5,1 23,0 0,0 1.5,-1 0,-2.5 0,0 0.5,-1.5 -1,-2.5 -0.5,-2.5 -0.5,-2 0.5,-3.5 1,-2 2.5,-2 2.5,-4 -8.5,-1.5 -18.5,-1.5 -27,0 z");
    group.path("M 11.5,30 C 15,29 30,29 33.5,30");
    group.path("m 12,33.5 c 6,-1 15,-1 21,0");
    group.circle(4).center(6, 12);
    group.circle(4).center(14, 9);
    group.circle(4).center(22.5, 8);
    group.circle(4).center(31, 9);
    group.circle(4).center(39, 12);
    group.path("M 11,38.5 A 35,35 1 0 0 34,38.5")
        .fill("none")
        .stroke({linecap: "butt"})
    const lgroup = group.group()
        .fill("none")
        .stroke({color: "#fff"})
        .attr("data-playerstroke2", true);
    lgroup.path("M 11,29 A 35,35 1 0 1 34,29");
    lgroup.path("M 12.5,31.5 L 32.5,31.5");
    lgroup.path("M 11.5,34.5 A 35,35 1 0 0 33.5,34.5");
    lgroup.path("M 10.5,37.5 A 35,35 1 0 0 34.5,37.5");
    symbol.viewbox(3.25, 3.9715, 38.5, 38.5);
    return symbol;
});

sheet.glyphs.set("chess-rook-outline-line", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M2762 2798v-678h345v678h-345zM1877 2798v-678h341v678h-341zM988 2798v-678h345v678h-345zM406 3076h3277v-1506h-3277v1506zM1159 1298h1777v-1028h-1777v1028z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .fill("#fff");
    group.path("M1436 1027v-479h1223v479h-1223zM1159 1298h1777v-1028h-1777v1028zM2048 2255h-135v543h-477v-543h-277v543h-476v-957h2729v957h-476v-543h-277v543h-476v-543h-135zM406 3076h3277v-1506h-3277v1506z")
        .rotate(180, 0, 0)
        .attr("data-playerfill2", true)
        .fill("#000");
    group.viewbox(-3683.0000000000005, -3311.5, 3277.0000000000005, 3277.0000000000005);
    return group;
});

sheet.glyphs.set("chess-rook-outline-millenia", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M1024 1020l-377 -200v-342h754v342zM341 1024l339 179l-339 180v323h306v-118l381 -200l373 200v118h305v-323l-334 -180l334 -179v-853h-1365v853z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .fill("#fff");
    group.path("M341 1024l339 179l-339 180v323h306v-118l381 -200l373 200v118h305v-323l-334 -180l334 -179v-853h-1365v853zM1024 1020l-377 -200v-342h754v342zM1470 855l-2 -445h-888v450l445 232zM580 1549v89h-171l1 -214l409 -222l-409 -215l-1 -748h1230v748l-410 215l410 222 v214h-171v-89l-444 -238l-440 236z")
        .rotate(180, 0, 0)
        .attr("data-playerfill2", true)
        .fill("#000");
    group.viewbox(-1791.0000000000002, -1706, 1535.0000000000002, 1535.0000000000002);
    return group;
});

sheet.glyphs.set("chess-rook-outline-montreal", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M858 540q-7 61 -34 116.5t-70 98.5t-98 69.5t-116 33.5v-61q-19 3 -40 3q-20 0 -40 -3v61q-61 -7 -116 -33.5t-98 -69.5t-70 -98t-34 -117h61q-3 -19 -3 -40q0 -20 3 -40h-61q7 -61 34 -116t70 -98t98 -70t116 -34v61q20 -3 40 -3q21 0 40 3v-61q61 7 116 34t98 70t70 98t34 116h-61q3 20 3 40q0 21 -3 40h61zM420 727q-51 -18 -89.5 -57t-56.5 -90h-83q7 24 13 40h43q21 44 55 78t78 55v43q15 7 40 14v-83zM420 274v-84q-25 7 -40 14v44q-43 20 -77.5 54t-55.5 78h-43q-6 16 -13 40h83q18 -51 56.5 -89.5t89.5 -56.5zM580 274q51 18 89.5 56.5t56.5 89.5h84q-3 -14 -13 -40h-44q-20 -43 -54.5 -77.5t-78.5 -55.5v-43q-15 -7 -40 -14v84zM726 580q-18 51 -56.5 90t-89.5 57v83q24 -7 40 -13v-44q43 -20 77.5 -54.5t55.5 -78.5h44q6 -16 13 -40h-84z")
        .attr("data-playerfill", true)
        .fill("#fff");
    group.path("M274 580h-83q22 84 83.5 145.5t145.5 84.5v-83q-51 -18 -89.5 -57t-56.5 -90zM274 420q18 -51 56.5 -89.5t89.5 -56.5v-84q-84 23 -145.5 85t-83.5 145h83zM696 540h61q3 -19 3 -40q0 -20 -3 -40h-61q-12 -58 -55 -101t-101 -55v-61q-19 -3 -40 -3q-20 0 -40 3v61q-58 12 -101 55t-55 101h-61q-3 20 -3 40q0 21 3 40h61q12 58 55 101t101 55v61q20 3 40 3q21 0 40 -3v-61q58 -12 101 -55t55 -101zM858 540q-7 61 -34 116.5t-70 98.5t-98 69.5t-116 33.5v-61q-19 3 -40 3q-20 0 -40 -3v61q-61 -7 -116 -33.5t-98 -69.5t-70 -98t-34 -117h61q-3 -19 -3 -40q0 -20 3 -40h-61q7 -61 34 -116t70 -98t98 -70t116 -34v61q20 -3 40 -3q21 0 40 3v-61q61 7 116 34t98 70t70 98t34 116h-61q3 20 3 40q0 21 -3 40h61zM580 274q51 18 89.5 56.5t56.5 89.5h84q-22 -84 -84 -145.5t-146 -84.5v84zM580 727v83q84 -23 146 -84.5t84 -145.5h-84q-18 51 -56.5 90t-89.5 57z")
        .attr("data-playerfill2", true)
        .fill("#000");
    group.viewbox(142, 142, 716, 716);
    return group;
});

sheet.glyphs.set("chess-rook-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4})
        .translate(0, 0.3);
    group.path("M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z").stroke({linecap: "butt"});
    group.path("M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z").stroke({linecap: "butt"});
    group.path("M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14").stroke({linecap: "butt"});
    group.path("M 34,14 L 31,17 L 14,17 L 11,14");
    group.path("M 31,17 L 31,29.5 L 14,29.5 L 14,17").stroke({linecap: "butt", linejoin: "miter"});
    group.path("M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5");
    group.path("M 11,14 L 34,14").stroke({linejoin: "miter"});
    symbol.viewbox(6.75, 8.55, 31.5, 31.5);
    return symbol;
});

sheet.glyphs.set("chess-rook-solid-line", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M2762 2798v-678h345v678h-345zM1877 2798v-678h341v678h-341zM988 2798v-678h345v678h-345zM406 3076h3277v-1506h-3277v1506zM1159 1298h1777v-1028h-1777v1028z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    group.viewbox(-3683.0000000000005, -3311.5, 3277.0000000000005, 3277.0000000000005);
    return group;
});

sheet.glyphs.set("chess-rook-solid-millenia", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M1024 1020l-377 -200v-342h754v342zM341 1024l339 179l-339 180v323h306v-118l381 -200l373 200v118h305v-323l-334 -180l334 -179v-853h-1365v853z")
        .rotate(180, 0, 0)
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    group.viewbox(-1791.0000000000002, -1706, 1535.0000000000002, 1535.0000000000002);
    return group;
});

sheet.glyphs.set("chess-rook-solid-montreal", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("M858 540q-7 61 -34 116.5t-70 98.5t-98 69.5t-116 33.5v-61q-19 3 -40 3q-20 0 -40 -3v61q-61 -7 -116 -33.5t-98 -69.5t-70 -98t-34 -117h61q-3 -19 -3 -40q0 -20 3 -40h-61q7 -61 34 -116t70 -98t98 -70t116 -34v61q20 -3 40 -3q21 0 40 3v-61q61 7 116 34t98 70t70 98t34 116h-61q3 20 3 40q0 21 -3 40h61zM420 727q-51 -18 -89.5 -57t-56.5 -90h-83q7 24 13 40h43q21 44 55 78t78 55v43q15 7 40 14v-83zM420 274v-84q-25 7 -40 14v44q-43 20 -77.5 54t-55.5 78h-43q-6 16 -13 40h83q18 -51 56.5 -89.5t89.5 -56.5zM580 274q51 18 89.5 56.5t56.5 89.5h84q-3 -14 -13 -40h-44q-20 -43 -54.5 -77.5t-78.5 -55.5v-43q-15 -7 -40 -14v84zM726 580q-18 51 -56.5 90t-89.5 57v83q24 -7 40 -13v-44q43 -20 77.5 -54.5t55.5 -78.5h44q6 -16 13 -40h-84z")
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    group.viewbox(142, 142, 716, 716);
    return group;
});

sheet.glyphs.set("chess-rook-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4})
        .translate(0, 0.3);
    const bgroup = group.group()
        .stroke({linecap: "butt"});
    bgroup.path("M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z");
    bgroup.path("M 12.5,32 L 14,29.5 L 31,29.5 L 32.5,32 L 12.5,32 z");
    bgroup.path("M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z");
    bgroup.path("M 14,29.5 L 14,16.5 L 31,16.5 L 31,29.5 L 14,29.5 z").stroke({linejoin: "miter"});
    bgroup.path("M 14,16.5 L 11,14 L 34,14 L 31,16.5 L 14,16.5 z");
    bgroup.path("M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z");
    const lgroup = group.group()
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1, linejoin: "miter"});
    lgroup.path("M 12,35.5 L 33,35.5 L 33,35.5");
    lgroup.path("M 13,31.5 L 32,31.5");
    lgroup.path("M 14,29.5 L 31,29.5");
    lgroup.path("M 14,16.5 L 31,16.5");
    lgroup.path("M 11,14 L 34,14");
    symbol.viewbox(6.75, 8.55, 31.5, 31.5);
    return symbol;
});

sheet.glyphs.set("chess-short-rook-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M10.998 20.001v-5H17v2.003h11v-2.003h6v5l-2.997 2.003v9.498l2 1.5v3.002H12v-3.001l2.003-1.5v-9.506Z");
    group.path("M8.999 39.004h27.005v-3H8.995Z");
    group.path("M10.998 20.001H34")
        .fill("none");
    group.path("M14 22h17.003")
        .fill("none");
    group.path("M14 31.502h17.003")
        .fill("none");
    group.path("M12 33.003h21.003")
        .fill("none");
    symbol.viewbox(7.495, 13.501, 30.009, 27.003);
    return symbol;
});

sheet.glyphs.set("chess-short-rook-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M10.998 20.001v-5H17v2.003h11v-2.003h6v5l-2.997 2.003v9.498l2 1.5v3.002H12v-3.001l2.003-1.5v-9.506Z");
    group.path("M8.999 39.004h27.005v-3H8.995Z");
    group.path("M10.998 20.001H34")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.2});
    group.path("M14 22h17.003")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 0.8});
    group.path("M14 31.502h17.003")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 0.8});
    group.path("M12 33.003h21.003")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.2});
    group.path("M12 35.5h21.003")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.2});
    symbol.viewbox(7.495, 13.501, 30.009, 27.003);
    return symbol;
});

sheet.glyphs.set("chess-unicorn-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18");
    group.path("m24,18c0.38,2.91 -5.55,7.37 -8,9c-3,2 -2.82,4.34 -5,4c-1.042,-0.94 1.41,-3.04 0,-3c-1,0 0.19,1.23 -1,2c-1,0 -4,1 -4,-4c0,-2 6,-12 6,-12c0,0 -7.5275,-6.475 -7.0413,-7.15c0.4863,-0.675 8.9863,4.45 9.0413,3.65c-0.73,-0.994 -0.5,-2 -0.5,-3c1,-1 3,2.5 3,2.5l2,0c0,0 0.78,-1.992 2.5,-3c1,0 1,3 1,3");
    group.path("M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("M14.933 15.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    symbol.viewbox(3.4361, 5.2885, 36.0928, 35.2115);
    return symbol;
});

sheet.glyphs.set("chess-unicorn-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18");
    group.path("m24,18c0.38,2.91 -5.55,7.37 -8,9c-3,2 -2.82,4.34 -5,4c-1.042,-0.94 1.41,-3.04 0,-3c-1,0 0.19,1.23 -1,2c-1,0 -4,1 -4,-4c0,-2 6,-12 6,-12c0,0 -7.5275,-6.475 -7.0413,-7.15c0.4863,-0.675 8.9863,4.45 9.0413,3.65c-0.73,-0.994 -0.5,-2 -0.5,-3c1,-1 3,2.5 3,2.5l2,0c0,0 0.78,-1.992 2.5,-3c1,0 1,3 1,3");
    group.path("M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("M14.933 15.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("M 24.55,10.4 L 24.1,11.85 L 24.6,12 C 27.75,13 30.25,14.49 32.5,18.75 C 34.75,23.01 35.75,29.06 35.25,39 L 35.2,39.5 L 37.45,39.5 L 37.5,39 C 38,28.94 36.62,22.15 34.25,17.66 C 31.88,13.17 28.46,11.02 25.06,10.5 L 24.55,10.4 z ")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    symbol.viewbox(3.4361, 5.2885, 36.0928, 35.7115);
    return symbol;
});

sheet.glyphs.set("chess-wazir-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M9.464 39.175H35.64c-3.07-5.832-7.34-8.814-12.915-8.75-5.064.2-9.804 2.838-13.262 8.746");
    group.path("M9.328 21.09a13.342 13.115 0 1 0 26.683 0 13.342 13.115 0 1 0-26.683 0");
    group.path("M22.284 17.548v8.289")
        .fill("none");
    group.path("M18.142 21.58h8.284")
        .fill("none");
    symbol.viewbox(7.8275, 6.1345, 29.684, 34.5405);
    return symbol;
});

sheet.glyphs.set("chess-wazir-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M9.464 39.175H35.64c-3.07-5.832-7.34-8.814-12.915-8.75-5.064.2-9.804 2.838-13.262 8.746");
    group.path("M9.328 21.09a13.342 13.115 0 1 0 26.683 0 13.342 13.115 0 1 0-26.683 0");
    group.path("M22.284 17.548v8.289")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.725, linejoin: "miter"});
    group.path("M18.142 21.58h8.284")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.725, linejoin: "miter"});
    group.path("M14.82 33.154s7.301 5.631 15.461 0")
        .attr("data-playerstroke2", true)
        .fill("none")
        .stroke({color: "#fff", width: 1.1});
    symbol.viewbox(7.8275, 6.1345, 29.684, 34.5405);
    return symbol;
});

sheet.glyphs.set("chess-wizard-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M22.338 7.41c4.008 2.333 6.706 6.66 6.706 11.628 0 7.433-6.035 13.468-13.467 13.468a13.4 13.4 0 0 1-8.816-3.3c2.334 5.94 8.108 10.169 14.874 10.169 8.826 0 16.01-7.184 16.01-16.01 0-8.586-6.812-15.581-15.307-15.955");
    symbol.viewbox(5.261, 5.91, 33.884, 34.965);
    return symbol;
});

sheet.glyphs.set("chess-wizard-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M22.338 7.41c4.008 2.333 6.706 6.66 6.706 11.628 0 7.433-6.035 13.468-13.467 13.468a13.4 13.4 0 0 1-8.816-3.3c2.334 5.94 8.108 10.169 14.874 10.169 8.826 0 16.01-7.184 16.01-16.01 0-8.586-6.812-15.581-15.307-15.955");
    symbol.viewbox(5.261, 5.91, 33.884, 34.965);
    return symbol;
});

sheet.glyphs.set("chess-zebra-outline-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .attr("data-playerstroke2", true)
        .fill({color: "#fff", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M22.484 9.317c10.647 1.014 16.731 8.112 16.224 29.406H15.386c0-9.126 10.14-6.591 8.112-21.294");
    group.path("M24.512 17.429c.39 2.952-5.63 7.472-8.112 9.126-3.042 2.028-2.86 4.404-5.07 4.056-1.057-.957 1.433-3.08 0-3.042-1.014 0 .19 1.25-1.014 2.028-1.014 0-4.059 1.014-4.056-4.056 0-2.028 6.084-12.168 6.084-12.168s1.912-1.929 2.028-3.549c-.736-1.008-.507-2.028-.507-3.042 1.014-1.014 3.042 2.535 3.042 2.535h2.028s.793-2.02 2.535-3.042c1.014 0 1.014 3.042 1.014 3.042");
    group.path("M8.795 25.034a.507.507 0 1 0 1.014 0 .507.507 0 1 0-1.014 0");
    group.path("M14.441 14.641a.507 1.521 29.999 1 0 .878.507.507 1.521 29.999 1 0-.878-.507");
    group.path("M37.694 38.723c1.014-20.28-5.577-27.885-12.168-28.899")
        .fill("none");
    group.path("M13.936 16.932c-.915-.345-.862-1.6.13-3.062.262-.387.649-.76.94-.913.275-.142.802-.128 1.052.027.606.375.538 1.465-.166 2.642-.568.951-1.407 1.511-1.955 1.306")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("M8.907 26.2a1.23 1.23 0 0 1-.53-1.977c.252-.286.52-.4.934-.4.706 0 1.204.497 1.204 1.203 0 .576-.284.982-.818 1.17-.334.118-.47.119-.79.005")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("M14.636 38.89c.006-2.206.473-3.859 1.547-5.465.524-.785 1.085-1.406 2.92-3.236 1.6-1.595 2.274-2.48 2.88-3.781.48-1.034.815-2.317.947-3.63.036-.346.054-.641.04-.653s-.145.11-.296.274c-.384.415-1.922 1.8-2.717 2.444a43 43 0 0 1-2.702 2.028c-1.504 1.058-1.887 1.43-3.002 2.909-.875 1.16-1.413 1.52-2.352 1.57-.333.017-.637 0-.776-.046-.263-.088-.649-.507-.707-.77l-.04-.18-.898.038c-.724.03-.978.017-1.31-.067-1.235-.315-2.046-1.188-2.403-2.583-.162-.637-.28-1.888-.227-2.398.091-.852.584-2.072 1.842-4.564.91-1.803 2.022-3.836 3.388-6.195.64-1.102 1.018-1.676 1.507-2.282.65-.803 1.28-1.89 1.28-2.21 0-.073-.068-.287-.15-.476-.234-.527-.294-.933-.294-1.96 0-1.112.052-1.297.446-1.557.392-.26.94-.284 1.421-.063.56.255 1.432 1.15 2.092 2.147l.242.365h.593c.326 0 .593-.025.593-.054s.198-.353.44-.72c.493-.747 1.226-1.514 1.84-1.928.344-.231.462-.277.716-.277.852 0 1.365.723 1.6 2.257.06.38.116.722.127.76s.186.092.39.117c1.125.135 2.823.54 4.013.956.868.302 2.41 1.058 3.169 1.552 2.87 1.87 4.96 4.678 6.411 8.611 1.259 3.412 1.978 7.723 2.209 13.252.069 1.647.083 5.79.021 6.163l-.04.237h-24.76zM37.29 36.1a68 68 0 0 0-.19-6.547c-.557-6.6-2.213-11.737-4.858-15.059-1.768-2.22-4.736-3.691-8.672-4.297a29 29 0 0 0-1.091-.152c-.492-.045-.746-.385-.747-1.004 0-.435-.168-1.536-.259-1.706-.067-.126-.091-.112-.479.271a6.9 6.9 0 0 0-1.25 1.75c-.339.674-.35.679-1.748.7-1.49.024-1.446.043-2.092-.923-.492-.732-1.162-1.535-1.283-1.535-.046 0-.057.177-.034.548.03.467.068.613.27 1.013.222.436.236.495.206.894-.063.852-.637 1.97-1.651 3.218-1.28 1.574-5.365 9.118-6.162 11.377l-.234.664.036.823c.065 1.495.453 2.35 1.21 2.666.312.129 1.632.148 1.78.025.065-.053.091-.21.092-.528 0-.601.097-.916.355-1.158.343-.324 1.03-.407 1.483-.178.378.191.616.675.541 1.095-.023.127-.182.552-.355.942-.333.754-.379.946-.213.882a.6.6 0 0 1 .16-.039c.113 0 .631-.527.99-1.007 1.034-1.382 1.712-2.062 2.864-2.871 3.54-2.484 5.864-4.57 7.037-6.317.474-.703.717-1.304.746-1.846.033-.578.107-.788.34-.953.38-.27.852-.13 1.092.324.223.42.049 1.448-.402 2.383-.246.507-.252.538-.252 1.205 0 2.535-.426 4.697-1.267 6.449-.678 1.412-1.345 2.26-3.49 4.44-.962.976-1.92 2.005-2.128 2.287a7.4 7.4 0 0 0-1.39 3.32c-.049.332-.09.625-.09.65s4.745.048 10.545.048h10.545z")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("M29.709 38.216c4.479-3.915 4.797-1.274 8.872-2.408l-.253-1.521c-5.474.24-8.807 1.281-12.549 4.182z")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("M20.71 38.343c5.166-5.392 8.53-6.703 17.491-7.352l-.127-1.267c-4.823.124-15.103 1.809-20.153 8.999Z")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("M24.005 23.767c4.575-.035 7.9-1.748 12.675-2.282-.38-1.187-.38-2.35-.76-1.901-2.755 2.086-6.84 1.965-12.042 3.042-.388-.505.21.113.127 1.14")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("M24.512 19.457c3.802-1.901 8.196-1.69 9.633-3.295l-1.14-1.395c-.964 2.468-5.811 2.466-8.113 3.93z")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("m31.23 12.612-3.676 1.395 2.028-2.789z")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("m25.78 9.697-1.395 2.789-.76-3.042c4.676.635 1.379.219 2.154.253")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    group.path("M37.44 24.78c-4.43 1.233-8.715 2.607-14.449 2.535l-4.436 4.817c4.13-2.652 9.053-5.053 19.52-5.704z")
        .attr("data-playerfill2", true)
        .fill("#000")
        .stroke("none");
    symbol.viewbox(4.0272, 4.07, 36.9483, 36.905);
    return symbol;
});

sheet.glyphs.set("chess-zebra-solid-traditional", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const group = symbol.group()
        .attr("data-playerfill", true)
        .fill({color: "#000", opacity: 1, rule: "evenodd"})
        .stroke({color: "#000", width: 1.5, linecap: "round", linejoin: "round", miterlimit: 4});
    group.path("M22.482 9.5c10.5 1 16.5 8 16 29h-23c0-9 10-6.5 8-21");
    group.path("M24.482 17.5c.384 2.911-5.553 7.369-8 9-3 2-2.82 4.343-5 4-1.042-.944 1.413-3.038 0-3-1 0 .187 1.232-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.886-1.902 2-3.5c-.726-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.782-1.992 2.5-3c1 0 1 3 1 3");
    group.path("M15.05 37.96c.136-1.796.559-3.153 1.384-4.445.233-.364 1.313-1.579 2.399-2.699 1.994-2.056 2.893-3.226 3.454-4.494.447-1.01.8-2.508.89-3.78l.08-1.113-1.109 1.075c-1.509 1.463-2.577 2.35-4.42 3.673-1.7 1.22-2.545 2.007-3.666 3.418-.775.976-1.422 1.388-2.187 1.393-.575.004-.855-.176-1.012-.652l-.134-.407-1.032.041c-1.253.051-1.836-.109-2.462-.675-.62-.559-.992-1.445-1.135-2.698-.14-1.225-.027-1.826.634-3.372 1.153-2.698 4.86-9.36 5.972-10.734.361-.447.803-1.12.981-1.496.321-.679.322-.688.107-1.25-.12-.312-.247-1.077-.283-1.701-.065-1.124-.062-1.137.28-1.406.19-.15.502-.272.693-.272.5 0 1.32.673 2.101 1.724l.67.901h1.467l.27-.531c.15-.292.679-.94 1.177-1.438.781-.782.965-.906 1.346-.906.335 0 .515.089.753.371.304.363.582 1.3.586 1.979.003.508.127.617.81.713 6.883.968 11.353 4.977 13.519 12.125 1.123 3.707 1.627 7.688 1.755 13.843l.08 3.844h-1.001l.06-3.127c.125-6.497-.568-11.664-2.148-16.031-1.71-4.723-4.734-8.075-8.449-9.365-.532-.184-2.215-.602-2.429-.602-.083 0-.329 1.016-.268 1.113.036.06.33.148.653.196 2.436.366 5.129 1.936 6.703 3.91 3.062 3.836 4.213 8.694 4.212 17.781 0 2.028-.036 4.236-.08 4.906l-.081 1.22H14.971zm-4.88-12.276c.62-.62.181-1.693-.693-1.693-.514 0-1 .486-1 1s.486 1 1 1c.244 0 .5-.113.694-.307m4.663-9.016c.72-.43 1.52-1.843 1.52-2.688 0-.482-.46-.9-.874-.799-.471.116-1.091.779-1.507 1.61-.434.87-.474 1.47-.12 1.825.302.302.541.315.981.052");
    group.path("M8.982 25a.5.5 0 1 0 1 0 .5.5 0 1 0-1 0")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("M14.549 14.75a.5 1.5 30 1 0 .866.5.5 1.5 30 1 0-.866-.5")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("m25.032 9.9-.3 1.1.55.1c3.101.477 6.324 2.234 8.575 6.494s2.922 10.963 2.425 20.906l-.05.5h1.75v-.5c.503-10.057-.876-16.853-3.25-21.344S28.943 10.523 25.545 10Z")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("M20.482 37.5c5-5 11.375-5.625 16.375-6.625l.125.75c-5 1-10.75 1.875-14.75 5.875Z")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("M36.732 28c-5.547.614-12.711 1.06-18.25 5.25 2.125-2.625 2.823-2.542 3.625-3.875 4-1 9.188-2.068 14.375-2.875z")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("M24.232 25.25c6.01-.943 8.145-1.984 11.25-2.75v-1c-3.366.835-6.665 2.155-11 2.5z")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("M36.982 35.125c-3.847.338-5.611.87-7.875 2.375l3.125-.125c2.229-1.604 3.357-1.372 4.625-1.375z")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("M33.607 17.25c-1.651 1.498-5.12 2.268-8.375 3.125l.125-.75c2.192-.758 2.842.157 7.5-3.375z")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("M25.607 10.75 23.857 13l.375-2.625z")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    group.path("M30.482 12.875c-2.648 2.504-2.72 2.48-5.25 3.375 1.858-1.621 2.685-2.344 3.875-4.75z")
        .attr("data-playerfill2", true)
        .fill("#fff")
        .stroke("none");
    symbol.viewbox(4.547, 4.616, 35.971, 35.884);
    return symbol;
});

sheet.glyphs.set("piece-janggi", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const border = 5;
    const radius = 100;
    const pts: [number, number][] = [];
    for (let i = 0; i < 8; i++) {
        const degrees = 22.5 + (45 * i);
        const [x, y] = projectPoint(0, 0, radius, degrees);
        pts.push([x, y]);
    }
    symbol.polygon(pts)
        .attr("data-context-border", true)
        .attr("data-playerfill", true)
        .fill("#fff")
        .stroke({width: border, color: "#000"});

    const minX = Math.min(...pts.map(([x]) => x));
    const maxX = Math.max(...pts.map(([x]) => x));
    const minY = Math.min(...pts.map(([, y]) => y));
    const maxY = Math.max(...pts.map(([, y]) => y));
    symbol.viewbox(
        minX - border, minY - border,
        maxX - minX + (border * 2), maxY - minY + (border * 2),
    );
    return symbol;
});

sheet.glyphs.set("piece-shogi", (canvas: SVGContainer) => {
    const symbol = canvas.symbol();
    const border = 5;
    const pts: [number, number][] = [
        [-92, 105],
        [92, 105],
        [73, -66],
        [0, -105],
        [-73, -66],
    ];
    symbol.polygon(pts)
        .attr("data-context-border", true)
        .attr("data-playerfill", true)
        .fill("#fff")
        .stroke({width: border, color: "#000"});

    const minX = Math.min(...pts.map(([x]) => x));
    const maxX = Math.max(...pts.map(([x]) => x));
    const minY = Math.min(...pts.map(([, y]) => y));
    const maxY = Math.max(...pts.map(([, y]) => y));
    symbol.viewbox(
        minX - border, minY - border,
        maxX - minX + (border * 2), maxY - minY + (border * 2),
    );
    return symbol;
});

export { sheet as ChessSheet };


