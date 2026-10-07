import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { DefaultRenderer } from "../src/renderers/default.js";
import type { APRenderRep } from "../src/schemas/schema.js";

const renderOpts = {
    contextGlobal: true,
    coloursGlobal: false,
    showAnnotations: false,
    sheets: ["core"],
};

function renderLegend(name: string, paint: Record<string, number>): string {
    const window = createSVGWindow();
    registerWindow(window, window.document);
    const draw = SVG(window.document.documentElement) as Svg;
    const json: APRenderRep = {
        board: { style: "squares", width: 1, height: 1 },
        legend: { X: { name, paint } },
        pieces: "X",
    };
    new DefaultRenderer().render(json, draw, renderOpts);
    return draw.svg();
}

describe("hemisphere piece glyphs", () => {
    it("piece-tb paints top and bottom independently", () => {
        const svg = renderLegend("piece-tb", { top: 1, bottom: 2, border: 3 });
        expect(svg).to.match(/fill="#e31a1c"/);
        expect(svg).to.match(/fill="#1f78b4"/);
        expect(svg).to.match(/stroke="#33a02c"|stroke-width/);
    });

    it("piece-lr paints left and right independently", () => {
        const svg = renderLegend("piece-lr", { left: 1, right: 2, border: 3 });
        expect(svg).to.match(/fill="#e31a1c"/);
        expect(svg).to.match(/fill="#1f78b4"/);
    });
});
