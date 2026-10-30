import { expect } from "chai";
import "mocha";
import { registerWindow, SVG, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { applyProceduralMarbledPaint } from "../src/glyphs/procedural/marbledShading.js";
import { buildPieceMarbledSymbol } from "../src/sheets/pieceMarbledGeometry.js";
import { DefaultRenderer } from "../src/renderers/default.js";
import type { APRenderRep } from "../src/schemas/schema.js";

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    registerWindow(window, window.document);
    return SVG(window.document.documentElement) as Svg;
};

describe("piece-marbled procedural shading", () => {
    it("applies face gradient and dark edge from one base colour", () => {
        const window = createSVGWindow();
        registerWindow(window, window.document);
        const canvas = SVG(window.document.documentElement) as Svg;
        const sym = buildPieceMarbledSymbol(canvas.defs() as Svg);
        applyProceduralMarbledPaint(sym, "#e6504a");

        const svg = sym.svg();
        expect(svg).to.match(/linearGradient-marbled-/);
        expect(svg).to.include('data-marbled-side="1"');

        const face = sym.find('[data-slot-fill="fill"]')[0]!;
        const side = sym.find("[data-marbled-side]")[0]!;
        expect(String(face.attr("fill") ?? "")).to.match(/url\(#/);
        expect(String(side.attr("fill") ?? "").toLowerCase()).to.match(/^#[0-9a-f]{6}$/);
    });

    it("renders from legend paint.fill only", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        const rep: APRenderRep = {
            board: { style: "squares", width: 2, height: 1 },
            legend: {
                A: { name: "piece-marbled", paint: { fill: 1 } },
                B: { name: "piece-marbled", paint: { fill: 2 } },
            },
            pieces: "AB",
        };
        renderer.render(rep, draw, { sheets: ["core"], showAnnotations: false });
        const uses = draw.find("#pieces use");
        expect(uses.length).to.be.greaterThan(0);
        const defs = draw.find("defs linearGradient").filter((g) => String(g.id() ?? "").includes("marbled"));
        expect(defs.length).to.be.greaterThan(0);
    });
});
