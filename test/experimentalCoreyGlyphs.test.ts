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
    it("tints slotted fill backing and leaves ink black when colour2 is omitted", () => {
        const draw = makeDraw();
        const json: APRenderRep = {
            board: { style: "squares", width: 1, height: 1 },
            legend: { A: { name: "ball", colour: 1 } },
            pieces: "A",
        };
        const renderer = new DefaultRenderer();
        renderer.render(json, draw, { sheets: ["experimental"] });
        const svg = draw.svg();
        expect(svg).to.match(/data-slot-fill="fill"[^>]*fill="#e31a1c"/);
        expect(svg).to.not.match(/<rect[^>]*data-slot-fill="fill"/);
        expect(svg).to.not.match(/<ellipse[^>]*data-slot-fill="fill"/);
        const fillSlotCount = [...svg.matchAll(/data-slot-fill="fill"/g)].length;
        expect(fillSlotCount).to.be.greaterThan(1);
        const inkMainD = "M349.3 118.8";
        expect(svg).to.not.match(
            new RegExp(`data-slot-fill="fill"[^>]*\\bd="${inkMainD.replace(".", "\\.")}`),
        );
        const pathTags = [...svg.matchAll(/<path\b([^>]*)>/g)].map((m) => m[1]!);
        expect(
            pathTags.some(
                (attrs) => attrs.includes('data-slot-fill="fill"') && /\bd="M 85\.894/.test(attrs),
            ),
        ).to.equal(true);
        expect(svg).to.match(/data-slot-fill="border"[^>]*fill="#000000"/);
        expect(svg).to.match(/data-slot-stroke="border"[^>]*stroke="#000000"/);
    });

    it("viewBox includes the full head silhouette including the lower face", () => {
        const draw = makeDraw();
        const json: APRenderRep = {
            board: { style: "squares", width: 1, height: 1 },
            legend: { A: { name: "head", colour: 1 } },
            pieces: "A",
        };
        const renderer = new DefaultRenderer();
        renderer.render(json, draw, { sheets: ["experimental"] });
        const symVb = draw.svg().match(/<symbol[^>]*viewBox="([^"]+)"/)?.[1]?.split(/\s+/).map(Number);
        expect(symVb?.length).to.equal(4);
        const [, y0, , h] = symVb!;
        expect(y0! + h!).to.be.greaterThan(448);
    });

    it("backs open ink strokes with traced fill under border stroke (head antennae)", () => {
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
        const strokeIdx = svg.indexOf(antennaInk);
        expect(strokeIdx).to.be.greaterThan(-1);
        const beforeStroke = svg.slice(0, strokeIdx);
        expect(beforeStroke).to.match(/data-slot-fill="fill"[^>]*fill="#e31a1c"/);
        expect(svg).to.match(/data-slot-stroke="border"[^>]*stroke="#000000"/);
        expect(svg).to.not.match(/data-slot-stroke="fill"/);
    });
});
