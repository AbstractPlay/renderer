import { Container as SVGContainer, Symbol as SVGSymbol } from "@svgdotjs/svg.js";
import type { ISheet } from "./ISheet";

const sheet: ISheet = {
    name: "nato",
    // tslint:disable-next-line:object-literal-sort-keys
    description: "NATO joint military symbols, for war-type games.",
    cellsize: 100,
    glyphs: new Map<string, (canvas: SVGContainer) => SVGSymbol>(),
};

// Alphabetize by glyph name, please!
// The element's root `id` must be the same as its map key.
// If using groups to make complex glyphs, be sure to include the attribute `data-cellsize` (the greater of width and height) so the renderer can scale it properly.

sheet.glyphs.set("nato-artillery", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(595, 395)
        .move(5,5)
        .fill({color: "#fff", opacity: 1})
        .attr("data-playerfill", true)
        .stroke({width: 10, color: "#000", linejoin: "round"})
        .attr("data-context-border", true);
    group.circle(170)
        .center(302.5, 202.5)
        .fill({color: "#000"})
        .attr("data-context-border-fill");
    group.viewbox(0,0,605,405);
    return group;
});

sheet.glyphs.set("nato-artillery-towed", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(595, 395)
        .move(5,5)
        .fill({color: "#fff", opacity: 1})
        .attr("data-playerfill", true)
        .stroke({width: 10, color: "#000", linejoin: "round"})
        .attr("data-context-border", true);
    group.circle(170)
        .center(302.5, 202.5)
        .fill({color: "#000"})
        .attr("data-context-border-fill");
    const towed = group.group()
        .fill("none")
        .stroke({color: "#000", width: 10})
        .attr("data-context-border", true);
    towed.path("m 224,295 a 31.5,31.5 0 1 1 -63,0 31.5,31.5 0 1 1 63,0 z");
    towed.path("m 439,295 a 31.5,31.5 0 1 1 -63,0 31.5,31.5 0 1 1 63,0 z");
    towed.path("m 376,295 H 224");
    group.viewbox(0,0,605,405);
    return group;
});

sheet.glyphs.set("nato-cavalry", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(595, 395)
        .move(5,5)
        .fill({color: "#fff", opacity: 1})
        .attr("data-playerfill", true)
        .stroke({width: 10, color: "#000", linejoin: "round"})
        .attr("data-context-border", true);
    group.line(600, 5, 5, 400)
        .stroke({width: 10, color: "#000", linejoin: "round"})
        .attr("data-context-border", true);
    group.viewbox(0,0,605,405);
    return group;
});

sheet.glyphs.set("nato-cavalry-heavy", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(595, 395)
        .move(5,5)
        .fill({color: "#fff", opacity: 1})
        .attr("data-playerfill", true)
        .stroke({width: 10, color: "#000", linejoin: "round"})
        .attr("data-context-border", true);
    group.line(600, 5, 5, 400)
        .stroke({width: 10, color: "#000", linejoin: "round"})
        .attr("data-context-border", true);
    const text = group.text("H")
        .font({anchor: "middle", fill: "#000", size: 100, family: "Tahoma,\"IBM Plex Sans\",sans-serif"})
        .attr("data-context-border-fill", true)
        .attr("alignment-baseline", "auto")
        .attr("dominant-baseline", "auto");
    text.path(`M5,380 L600,380`)
        .attr("startOffset", "50%");
    group.viewbox(0,0,605,405);
    return group;
});

sheet.glyphs.set("nato-infantry", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(595, 395)
        .move(5,5)
        .fill({color: "#fff", opacity: 1})
        .attr("data-playerfill", true)
        .stroke({width: 10, color: "#000", linejoin: "round"})
        .attr("data-context-border", true);
    group.line(600, 5, 5, 400)
        .stroke({width: 10, color: "#000", linejoin: "round"})
        .attr("data-context-border", true);
    group.line(5, 5, 600, 400)
        .stroke({width: 10, color: "#000", linejoin: "round"})
        .attr("data-context-border", true);
    group.viewbox(0,0,605,405);
    return group;
});

sheet.glyphs.set("nato-infantry-light", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(595, 395)
        .move(5,5)
        .fill({color: "#fff", opacity: 1})
        .attr("data-playerfill", true)
        .stroke({width: 10, color: "#000", linejoin: "round"})
        .attr("data-context-border", true);
    group.line(600, 5, 5, 400)
        .stroke({width: 10, color: "#000", linejoin: "round"})
        .attr("data-context-border", true);
    group.line(5, 5, 600, 400)
        .stroke({width: 10, color: "#000", linejoin: "round"})
        .attr("data-context-border", true);
    const text = group.text("L")
        .font({anchor: "middle", fill: "#000", size: 100, family: "Tahoma,\"IBM Plex Sans\",sans-serif"})
        .attr("data-context-border-fill", true)
        .attr("alignment-baseline", "auto")
        .attr("dominant-baseline", "auto");
    text.path(`M5,380 L600,380`)
        .attr("startOffset", "50%");
    group.viewbox(0,0,605,405);
    return group;
});

sheet.glyphs.set("nato-infantry-special", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.rect(595, 395)
        .move(5,5)
        .fill({color: "#fff", opacity: 1})
        .attr("data-playerfill", true)
        .stroke({width: 10, color: "#000", linejoin: "round"})
        .attr("data-context-border", true);
    group.line(600, 5, 5, 400)
        .stroke({width: 10, color: "#000", linejoin: "round"})
        .attr("data-context-border", true);
    group.line(5, 5, 600, 400)
        .stroke({width: 10, color: "#000", linejoin: "round"})
        .attr("data-context-border", true);
    const text = group.text("SOF")
        .font({anchor: "middle", fill: "#000", size: 100, family: "Tahoma,\"IBM Plex Sans\",sans-serif"})
        .attr("data-context-border-fill", true)
        .attr("alignment-baseline", "hanging")
        .attr("dominant-baseline", "hanging");
    text.path(`M5,20 L600,20`)
        .attr("startOffset", "50%");
    group.viewbox(0,0,605,405);
    return group;
});

export { sheet as NatoSheet };
