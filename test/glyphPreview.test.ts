import { expect } from "chai";
import "mocha";
import { registerWindow, SVG, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { CoreSheet } from "../src/sheets/contact/core.js";
import {
    buildGlyphSymbolForContactSheet,
    CONTACT_SHEET_ORB_PREVIEW_GREY,
    usesContactSheetProceduralPreview,
} from "../src/renderers/glyphPreview.js";
import { invokeGlyphBuild } from "../src/sheets/registry/defineGlyph.js";

describe("glyphPreview (contact sheet)", () => {
    it("only orbs use procedural contact preview", () => {
        expect(usesContactSheetProceduralPreview("orb")).to.equal(true);
        expect(usesContactSheetProceduralPreview("orb1")).to.equal(true);
        expect(usesContactSheetProceduralPreview("piece")).to.equal(false);
        expect(usesContactSheetProceduralPreview("orca")).to.equal(false);
    });

    it("orb1 preview applies grey procedural shading, piece stays build-only", () => {
        const window = createSVGWindow();
        registerWindow(window, window.document);
        const tile = SVG(window.document.documentElement) as Svg;

        const orbBuild = CoreSheet.glyphs.get("orb1")!;
        const orbSym = buildGlyphSymbolForContactSheet("orb1", orbBuild, tile);
        expect(orbSym.svg()).to.match(/radialGradient/);

        const pieceBuild = CoreSheet.glyphs.get("piece")!;
        const pieceSym = buildGlyphSymbolForContactSheet("piece", pieceBuild, tile);
        expect(pieceSym.svg()).to.not.match(/radialGradient/);
    });

    it("orb builders are one-arg", () => {
        for (const name of ["orb", "orb1", "orb2", "orb3", "orca"] as const) {
            const build = CoreSheet.glyphs.get(name)!;
            expect(build.length, name).to.equal(1);
        }
    });

    it("preview grey constant is #ccc", () => {
        expect(CONTACT_SHEET_ORB_PREVIEW_GREY).to.equal("#ccc");
    });

    it("invokeGlyphBuild uses one-arg for orbs without sample colour in output", () => {
        const window = createSVGWindow();
        registerWindow(window, window.document);
        const canvas = SVG(window.document.documentElement) as Svg;
        const build = CoreSheet.glyphs.get("orb")!;
        const sym = invokeGlyphBuild(build, canvas.defs() as Svg);
        expect(sym.svg()).to.not.match(/radialGradient/);
    });
});
