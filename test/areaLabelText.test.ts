import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import {
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

    it("places in-band titles without dy or middle baseline", () => {
        const root = makeDraw();
        const nested = root.nested();
        const { element, titleBand } = placeAreaTitleInBand(root, nested, "Hand", {
            fontSize: 12,
            fill: "#111",
        });
        expect(titleBand).to.be.greaterThan(0);
        expect(element.attr("dy")).to.equal(undefined);
        expect(element.attr("dominant-baseline")).to.equal("text-before-edge");
        expect(element.bbox().y).to.be.lessThan(titleBand / 2);
    });

    it("places corner titles with text-before-edge", () => {
        const root = makeDraw();
        const nested = root.nested();
        const { element } = placeAreaTitleAt(root, nested, "System A", {
            fontSize: 14,
            fill: "#fff",
            x: 5,
            y: 5,
        });
        expect(element.attr("dy")).to.equal(undefined);
        expect(element.attr("dominant-baseline")).to.equal("text-before-edge");
    });
});
