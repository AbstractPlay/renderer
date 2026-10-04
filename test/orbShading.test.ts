import { expect } from "chai";
import "mocha";
import { registerWindow, SVG, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import {
    applyProceduralShadedPaint,
    orbDetailHighlightColour,
    orbGradientStopColours,
} from "../src/renderers/orbShading.js";
import { CONTACT_SHEET_ORB_PREVIEW_GREY } from "../src/renderers/glyphPreview.js";

describe("orbShading", () => {
    it("derives highlight and shadow stops from base hex", () => {
        const { highlight, shadow } = orbGradientStopColours("#336699");
        expect(highlight).to.match(/^#[0-9a-f]{6}$/i);
        expect(shadow).to.match(/^#[0-9a-f]{6}$/i);
        expect(highlight.toLowerCase()).to.not.equal(shadow.toLowerCase());
    });

    it("derives detail highlight from base hex", () => {
        const detail = orbDetailHighlightColour("#336699");
        expect(detail).to.match(/^#[0-9a-f]{6}$/i);
    });

    it("applies main fill gradient to orb geometry", () => {
        const window = createSVGWindow();
        registerWindow(window, window.document);
        const canvas = SVG(window.document.documentElement) as Svg;
        const sym = canvas.symbol();
        sym.circle(100).attr("data-slot-fill", "fill").fill("none").center(50, 50);
        applyProceduralShadedPaint(sym, "orb", "#ccc");
        const svg = sym.svg();
        expect(svg).to.match(/radialGradient/);
        expect(svg).to.match(/url\(#radialGradient-/);
    });

    it("contact preview grey uses same base as CONTACT_SHEET_ORB_PREVIEW_GREY", () => {
        const window = createSVGWindow();
        registerWindow(window, window.document);
        const canvas = SVG(window.document.documentElement) as Svg;
        const sym = canvas.symbol();
        sym.circle(100).attr("data-slot-fill", "fill").fill("none").center(50, 50);
        applyProceduralShadedPaint(sym, "orb1", CONTACT_SHEET_ORB_PREVIEW_GREY);
        expect(sym.svg()).to.match(/radialGradient/);
        const { highlight } = orbGradientStopColours(CONTACT_SHEET_ORB_PREVIEW_GREY);
        expect(highlight.length).to.equal(7);
    });
});
