import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { DefaultRenderer } from "../src/renderers/default.js";
import type { APRenderRep } from "../src/schemas/schema.js";
import { migrateRenderJson } from "../src/tools/migrateGlyphPaint.js";
import { normalizeSvgForGlyphCompare } from "./helpers/normalizeSvgForGlyphCompare.js";

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    registerWindow(window, window.document);
    return SVG(window.document.documentElement) as Svg;
};

function renderRep(rep: APRenderRep, sheets: string[]): string {
    const draw = makeDraw();
    const renderer = new DefaultRenderer();
    renderer.render(rep, draw, {
        contextGlobal: true,
        coloursGlobal: false,
        showAnnotations: false,
        sheets,
    });
    return draw.svg();
}

function cloneRep<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj)) as T;
}

describe("glyphPaint migration parity", () => {
    const fixtures: Array<{ label: string; rep: APRenderRep; sheets: string[] }> = [
        {
            label: "piece simple",
            sheets: ["core"],
            rep: {
                board: { style: "squares", width: 1, height: 1 },
                legend: { X: { name: "piece", colour: 1 } },
                pieces: "X",
            },
        },
        {
            label: "duotone chess",
            sheets: ["chess"],
            rep: {
                board: { style: "squares", width: 1, height: 1 },
                legend: {
                    X: { name: "chess-king-solid-traditional", colour: 1, colour2: 2 },
                },
                pieces: "X",
            },
        },
        {
            label: "dice pips",
            sheets: ["dice"],
            rep: {
                board: { style: "squares", width: 1, height: 1 },
                legend: { X: { name: "d6-5", colour: 1, colour2: 2 } },
                pieces: "X",
            },
        },
        {
            label: "composite text",
            sheets: ["core"],
            rep: {
                board: { style: "squares", width: 1, height: 1 },
                legend: {
                    X: [{ name: "piece", colour: 1 }, { text: "18" }],
                },
                pieces: "X",
            },
        },
    ];

    for (const { label, rep, sheets } of fixtures) {
        it(`${label}: migrated JSON matches legacy render`, () => {
            const before = cloneRep(rep);
            const after = cloneRep(rep);
            migrateRenderJson(after);
            const legacySvg = renderRep(before, sheets);
            const migratedSvg = renderRep(after, sheets);
            expect(normalizeSvgForGlyphCompare(migratedSvg, { lenientOpacity: true })).to.equal(
                normalizeSvgForGlyphCompare(legacySvg, { lenientOpacity: true }),
                label,
            );
        });
    }
});
