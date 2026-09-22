import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { DefaultRenderer } from "../src/renderers/default.js";
import type { APRenderRep } from "../src/schemas/schema.js";

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    registerWindow(window, window.document);
    return SVG(window.document.documentElement) as Svg;
};

describe("experimental Corey glyphs (two-tone)", () => {
    it("tints raster-traced playerfill backing and leaves ink black when colour2 is omitted", () => {
        const draw = makeDraw();
        const json: APRenderRep = {
            board: { style: "squares", width: 1, height: 1 },
            legend: { A: { name: "ball", colour: 1 } },
            pieces: "A",
        };
        const renderer = new DefaultRenderer();
        renderer.render(json, draw, { sheets: ["experimental"] });
        const svg = draw.svg();
        expect(svg).to.match(/data-playerfill="true"[^>]*fill="#e31a1c"/);
        expect(svg).to.not.match(/<rect[^>]*data-playerfill="true"/);
        expect(svg).to.not.match(/<ellipse[^>]*data-playerfill="true"/);
        const playerFillCount = [...svg.matchAll(/data-playerfill="true"/g)].length;
        expect(playerFillCount).to.be.greaterThan(1);
        const inkMainD = "M349.3 118.8";
        expect(svg).to.not.match(
            new RegExp(`data-playerfill="true"[^>]*\\bd="${inkMainD.replace(".", "\\.")}`),
        );
        const pathTags = [...svg.matchAll(/<path\b([^>]*)>/g)].map((m) => m[1]!);
        expect(
            pathTags.some(
                (attrs) => attrs.includes('data-playerfill="true"') && /\bd="M 84\.223/.test(attrs),
            ),
        ).to.equal(true);
        expect(svg).to.match(/data-playerfill2="true"[^>]*fill="#000000"/);
        expect(svg).to.match(/data-playerstroke2="true"[^>]*stroke="#000000"/);
    });

    it("backs open ink strokes with traced playerfill under stroke2 (head antennae)", () => {
        const draw = makeDraw();
        const json: APRenderRep = {
            board: { style: "squares", width: 1, height: 1 },
            legend: { A: { name: "head", colour: 1 } },
            pieces: "A",
        };
        const renderer = new DefaultRenderer();
        renderer.render(json, draw, { sheets: ["experimental"] });
        const svg = draw.svg();
        const antennaInk = "M199.48 223.79";
        const stroke2Idx = svg.indexOf(antennaInk);
        expect(stroke2Idx).to.be.greaterThan(-1);
        const beforeStroke = svg.slice(0, stroke2Idx);
        expect(beforeStroke).to.match(/data-playerfill="true"[^>]*fill="#e31a1c"/);
        expect(svg).to.match(/data-playerstroke2="true"[^>]*stroke="#000000"/);
        expect(svg).to.not.match(/data-playerstroke="true"/);
    });
});
