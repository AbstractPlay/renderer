import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import {
    AREA_TITLE_PAD_EM,
    areaTitleBand,
    measureAreaTitle,
    placeAreaTitleAt,
    placeAreaTitleInBand,
} from "../src/common/areaLabelText.js";

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    const document = window.document;
    registerWindow(window, document);
    return SVG(document.documentElement) as Svg;
};

describe("areaLabelText", () => {
    it("sizes the title band from probed ink plus symmetric pad", () => {
        const root = makeDraw();
        const measured = measureAreaTitle(root, "Tall label", 12, "#000");
        const band = areaTitleBand(measured.height, 12);
        const pad = 12 * 0.08;
        expect(band).to.be.closeTo(pad + measured.height + pad, 0.01);
    });

    it("places in-band titles by ink bbox without dominant-baseline", () => {
        const root = makeDraw();
        const nested = root.nested();
        const fontSize = 12;
        const { element, titleBand } = placeAreaTitleInBand(root, nested, "Hand", {
            fontSize,
            fill: "#111",
        });
        const pad = fontSize * AREA_TITLE_PAD_EM;
        expect(titleBand).to.be.greaterThan(0);
        expect(element.attr("dominant-baseline")).to.equal(undefined);
        expect(element.bbox().y).to.be.closeTo(pad, 0.5);
        expect(element.bbox().y2).to.be.at.most(titleBand + 0.5);
    });

    it("places corner titles with ink top at y + pad", () => {
        const root = makeDraw();
        const nested = root.nested();
        const fontSize = 14;
        const y = 5;
        const { element } = placeAreaTitleAt(root, nested, "System A", {
            fontSize,
            fill: "#fff",
            x: 5,
            y,
        });
        const pad = fontSize * AREA_TITLE_PAD_EM;
        expect(element.attr("dominant-baseline")).to.equal(undefined);
        expect(element.bbox().y).to.be.closeTo(y + pad, 0.5);
    });
});
