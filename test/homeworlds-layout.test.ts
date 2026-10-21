import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { HomeworldsRenderer } from "../src/renderers/homeworlds.js";
import { IRendererOptionsIn } from "../src/renderers/_base.js";
import {
    layoutAxis,
    resolveExplicitPeriphLayoutAxis,
} from "../src/renderers/homeworldsPeriphLayout.js";
import {
    homeworldsPartialLayoutFixture,
    homeworldsRowLayoutFixture,
} from "./fixtures/homeworldsLayout.js";

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    const document = window.document;
    registerWindow(window, document);
    return SVG(document.documentElement) as Svg;
};

const baseOptions: IRendererOptionsIn = {
    contextGlobal: true,
    coloursGlobal: false,
    showAnnotations: false,
    sheets: ["core", "looney"],
};

function periphX(draw: Svg, name: string): number {
    const system = draw.findOne(`#_sysPeriph_${name}`) as Svg;
    expect(system, name).to.not.equal(null);
    return system.x() as number;
}

function periphY(draw: Svg, name: string): number {
    const system = draw.findOne(`#_sysPeriph_${name}`) as Svg;
    expect(system, name).to.not.equal(null);
    return system.y() as number;
}

describe("homeworlds peripheral layout", () => {
    describe("resolveExplicitPeriphLayoutAxis", () => {
        it("accepts all-row layout", () => {
            const axis = resolveExplicitPeriphLayoutAxis([
                { layout: { row: 0 } },
                { layout: { row: 1, order: 0 } },
            ]);
            expect(axis).to.equal("row");
        });

        it("rejects mixed row and column", () => {
            const axis = resolveExplicitPeriphLayoutAxis([
                { layout: { row: 0 } },
                { layout: { column: 0 } },
            ]);
            expect(axis).to.equal(null);
        });

        it("rejects partial layout", () => {
            const axis = resolveExplicitPeriphLayoutAxis([
                { layout: { row: 0 } },
                {},
            ]);
            expect(axis).to.equal(null);
        });

        it("layoutAxis is XOR", () => {
            expect(layoutAxis({ row: 1 })).to.equal("row");
            expect(layoutAxis({ column: 0 })).to.equal("column");
            expect(layoutAxis({ row: 0, column: 0 } as { row: number; column: number })).to.equal(null);
        });
    });

    describe("explicit row layout", () => {
        it("orders systems left-to-right within a row", () => {
            const draw = makeDraw();
            const renderer = new HomeworldsRenderer();
            renderer.render(homeworldsRowLayoutFixture(), draw, { ...baseOptions, rotate: 0 });
            expect(periphX(draw, "Alpha")).to.be.lessThan(periphX(draw, "Beta"));
        });

        it("places row 0 nearer North than row 1 at rotate 0", () => {
            const draw = makeDraw();
            const renderer = new HomeworldsRenderer();
            renderer.render(homeworldsRowLayoutFixture(), draw, { ...baseOptions, rotate: 0 });
            expect(periphY(draw, "Alpha")).to.be.lessThan(periphY(draw, "Far"));
        });

        it("moves row 0 to the South-adjacent band at rotate 180", () => {
            const draw0 = makeDraw();
            const draw180 = makeDraw();
            const renderer = new HomeworldsRenderer();
            renderer.render(homeworldsRowLayoutFixture(), draw0, { ...baseOptions, rotate: 0 });
            renderer.render(homeworldsRowLayoutFixture(), draw180, { ...baseOptions, rotate: 180 });
            expect(periphY(draw180, "Alpha")).to.be.greaterThan(periphY(draw0, "Alpha"));
            expect(periphY(draw180, "Far")).to.be.lessThan(periphY(draw180, "Alpha"));
        });

        it("keeps within-row order left-to-right at rotate 180", () => {
            const draw = makeDraw();
            const renderer = new HomeworldsRenderer();
            renderer.render(homeworldsRowLayoutFixture(), draw, { ...baseOptions, rotate: 180 });
            expect(periphX(draw, "Alpha")).to.be.lessThan(periphX(draw, "Beta"));
        });
    });

    describe("layout fallback", () => {
        it("uses star-size columns when layout is incomplete", () => {
            const draw = makeDraw();
            const renderer = new HomeworldsRenderer();
            renderer.render(homeworldsPartialLayoutFixture(), draw, baseOptions);
            expect(periphX(draw, "Alpha")).to.be.lessThan(periphX(draw, "Beta"));
        });
    });
});
