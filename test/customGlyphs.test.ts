import { expect } from "chai";
import Ajv from "ajv";
import { SVG, registerWindow } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { DefaultRenderer } from "../src/renderers/default.js";
import schema from "../src/schemas/schema.json" with { type: "json" };
import type { APRenderRep } from "../src/schemas/schema.js";
import { sanitizeCustomGlyphMarkup } from "../src/glyphs/sanitizeCustomGlyphMarkup.js";

const window = createSVGWindow();
const document = window.document;
registerWindow(window, document);

const goDiscMarkup =
    "<circle cx=\"50\" cy=\"50\" r=\"50\" data-slot-fill=\"fill\" data-slot-stroke=\"border\" " +
    "fill=\"#ffffff\" stroke=\"#000000\" stroke-width=\"5\"/>";

const ringMarkup =
    "<circle cx=\"50\" cy=\"50\" r=\"50\" fill=\"none\" data-slot-stroke=\"fill\" " +
    "stroke=\"#000000\" stroke-width=\"15\"/>";

const customDiscFixture: APRenderRep = {
    board: { style: "squares-checkered", width: 4, height: 4 },
    glyphDefs: {
        "go-disc": {
            viewBox: [-2.5, -2.5, 105, 105],
            markup: goDiscMarkup,
        },
    },
    legend: {
        B: { def: "go-disc", paint: { fill: 1 } },
        W: { def: "go-disc", paint: { fill: 2 } },
    },
    pieces: "BWBW\nWBWB\nBWBW\nWBWB",
};

const baseOptions = {
    sheets: ["core"],
    colours: ["#e31a1c", "#1f78b4", "#33a02c", "#ff7f00"],
    coloursGlobal: false,
    colourContext: {
        background: "#fff",
        fill: "#ddd",
        strokes: "#222",
        borders: "#444",
    },
    contextGlobal: false,
    rotate: 0,
    showAnnotations: true,
    glyphmap: [] as [string, string, number][],
    patterns: [] as string[],
    patternList: [] as string[],
    colourBlind: false,
};

function makeDraw(): SVG {
    return new SVG();
}

describe("custom glyph defs", () => {
    it("validates glyphDefs and custom legend layers in schema", () => {
        const ajv = new Ajv();
        expect(ajv.validate(schema, customDiscFixture)).to.equal(true);
    });

    it("sanitizeCustomGlyphMarkup accepts primitive shapes with slot attrs", () => {
        const out = sanitizeCustomGlyphMarkup(goDiscMarkup, "go-disc");
        expect(out).to.include("data-slot-fill=\"fill\"");
    });

    it("sanitizeCustomGlyphMarkup rejects script and foreignObject", () => {
        expect(() => sanitizeCustomGlyphMarkup("<script/>", "x")).to.throw(/forbidden/i);
        expect(() => sanitizeCustomGlyphMarkup("<foreignObject/>", "x")).to.throw(/forbidden/i);
    });

    it("renders two legend keys sharing one glyphDefs entry with player paint", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        renderer.render(customDiscFixture, draw, baseOptions);
        const bSlot = draw.findOne("#B") as { find: (sel: string) => { length: number } } | null;
        expect(bSlot).to.not.equal(null);
        const fills = draw.find("[data-slot-fill=\"fill\"]");
        expect(fills.length).to.be.greaterThan(0);
    });

    it("renders ring token custom def with stroke slot paint", () => {
        const fixture: APRenderRep = {
            board: { style: "squares", width: 2, height: 2 },
            glyphDefs: {
                ring: {
                    viewBox: [-7.5, -7.5, 115, 115],
                    markup: ringMarkup,
                },
            },
            legend: {
                A: { def: "ring", paint: { fill: 1 } },
                B: { def: "ring", paint: { fill: 2 } },
            },
            pieces: "AB\nBA",
        };
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        renderer.render(fixture, draw, baseOptions);
        expect(draw.findOne("#A")).to.not.equal(null);
    });
});
