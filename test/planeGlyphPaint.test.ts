import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { DefaultRenderer } from "../src/renderers/default.js";
import type { APRenderRep } from "../src/schemas/schema.js";

function renderPlane(fill: number): string {
    const window = createSVGWindow();
    registerWindow(window, window.document);
    const draw = SVG(window.document.documentElement) as Svg;
    const json: APRenderRep = {
        board: { style: "squares", width: 1, height: 1 },
        legend: { X: { name: "plane", paint: { fill } } },
        pieces: "X",
    };
    new DefaultRenderer().render(json, draw, {
        contextGlobal: true,
        coloursGlobal: false,
        showAnnotations: false,
        sheets: ["core"],
    });
    return draw.svg();
}

describe("plane glyph paint", () => {
    it("paint.fill recolours wings/fuselage, not only nose bullseyes", () => {
        const p1 = renderPlane(1);
        expect(p1).to.match(/fill="#e31a1c"/);
        const p2 = renderPlane(2);
        expect(p2).to.match(/fill="#1f78b4"/);
    });
});
