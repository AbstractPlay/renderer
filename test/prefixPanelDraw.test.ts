import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, type Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { panelIdPrefix } from "../src/composite/importPanel.js";
import { prefixPanelDraw } from "../src/composite/prefixPanelDraw.js";
import { renderRep, unionLayoutBBox } from "../src/renderRep.js";
import type { APRenderRep } from "../src/schemas/schema.js";
import schema from "../src/schemas/schema.json" with { type: "json" };
import AjvImport from "ajv";
import type { ValidateFunction } from "ajv";
import { coreRenderOptions } from "./helpers/renderTestDraw.js";

type AjvInstance = { compile(jsonSchema: object): ValidateFunction };
const ajvCtor = AjvImport as unknown as new () => AjvInstance;
const validateRep = new ajvCtor().compile(schema);

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    registerWindow(window, window.document);
    return SVG(window.document.documentElement) as Svg;
};

const checkeredRep = (): APRenderRep => ({
    board: { style: "squares-checkered", width: 2, height: 2 },
    legend: {
        A: { name: "piece", paint: { fill: 1 } },
    },
    pieces: "AA\nAA",
});

describe("prefixPanelDraw", () => {
    it("rewrites tile and piece use hrefs after prefixing ids", () => {
        const draw = makeDraw();
        renderRep(checkeredRep(), { ...coreRenderOptions, target: draw, rotate: 0 }, validateRep);
        expect(unionLayoutBBox(draw).width).to.be.greaterThan(0);

        const prefix = panelIdPrefix("west");
        prefixPanelDraw(draw, prefix);

        const tileUses = [...draw.find("use")].filter((u) => {
            const href = u.attr("href") ?? u.attr("xlink:href");
            return typeof href === "string" && href.includes("tile");
        });
        expect(tileUses.length).to.be.greaterThan(0);
        for (const u of tileUses) {
            const href = String(u.attr("href") ?? u.attr("xlink:href"));
            expect(href).to.include(prefix);
            expect(href).to.not.match(/^#tile-/);
        }

        const pieceUse = draw.findOne(`#${prefix}pieces use`);
        expect(pieceUse).to.not.equal(null);
        const pieceHref = String(pieceUse!.attr("href") ?? pieceUse!.attr("xlink:href"));
        expect(pieceHref).to.equal(`#${prefix}A`);
    });
});
