import Ajv from "ajv";
import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg, G as SVGG, Element as SVGElement } from "@svgdotjs/svg.js";
import { DefaultRenderer } from "../src/renderers/default";
import { IRendererOptionsIn } from "../src/renderers/_base";
import { APRenderRep } from "../src/schemas/schema";
import { getReferenceAsset, listReferenceAssets } from "../src/references/registry";
import { playfieldHullFromPolys, computePlayfieldMetrics, computeAnnulusPlacement, computeSidebarPlacement, referenceStyleSelectors, resolveSourceForSide } from "../src/references/helpers";
import { hexOfHex } from "../src/boards/hexOfHex";
import { createSVGWindow } from "svgdom";

import schema from "../src/schemas/schema.json" with { type: "json" };

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
    sheets: ["core"],
};

const scribeFixture: APRenderRep = {
    board: {
        style: "squares",
        width: 9,
        height: 9,
        tileWidth: 3,
        tileHeight: 3,
        reference: {
            layout: "sidebar",
            source: "scribe-chart",
            position: "left",
            rotateWithBoard: false,
            gap: 0.5,
            styles: {
                "glyph-0": 1,
                background: "_context_background",
            },
        },
    },
    legend: {
        P: { name: "piece", colour: 1 },
        O: { name: "piece", colour: 2 },
    },
    pieces: "---------\n---------\n---------\n---------\n---------\n---------\n---------\n---------\n---------",
};

const colFixture: APRenderRep = {
    board: {
        style: "hex-of-hex",
        minWidth: 5,
        maxWidth: 7,
        reference: {
            layout: "annulus",
            source: "circle-of-life-ring",
            rotateWithBoard: true,
            gap: 0.5,
            styles: {
                "species-0": 1,
                "species-1": 2,
                arrows: "_context_strokes",
            },
        },
    },
    legend: {
        A: { name: "piece", colour: 1 },
        B: { name: "piece", colour: 2 },
    },
    pieces: "---\n----\n-----\n------\n-----\n----\n---",
};

const dualScribeFixture: APRenderRep = {
    board: {
        style: "squares",
        width: 9,
        height: 9,
        tileWidth: 3,
        tileHeight: 3,
        reference: {
            layout: "sidebar",
            sides: ["left", "right"],
            source: ["scribe-chart-left", "scribe-chart-right"],
            rotateWithBoard: false,
            gap: 0.5,
        },
    },
    legend: {
        P: { name: "piece", colour: 1 },
        O: { name: "piece", colour: 2 },
    },
    pieces: "---------\n---------\n---------\n---------\n---------\n---------\n---------\n---------\n---------",
};

const topRefFixture: APRenderRep = {
    board: {
        style: "squares",
        width: 4,
        height: 4,
        reference: {
            layout: "sidebar",
            sides: ["top"],
            source: "custom-ref",
            rotateWithBoard: true,
            gap: 0.5,
        },
    },
    legend: {
        "custom-ref": { name: "piece", colour: 1, scale: 0.4 },
        X: { name: "piece", colour: 1 },
    },
    pieces: "X---\n----\n----\n----",
};

const bottomRefFixture: APRenderRep = {
    board: {
        style: "squares",
        width: 4,
        height: 4,
        reference: {
            layout: "sidebar",
            sides: ["bottom"],
            source: "scribe-chart-left",
            rotateWithBoard: false,
            gap: 0.5,
        },
    },
    areas: [{
        type: "pieces",
        label: "Stash",
        pieces: ["A"],
        width: 4,
    }],
    legend: { A: { name: "piece", colour: 1 } },
    pieces: "----\n----\n----\n----",
};

const legendOverrideFixture: APRenderRep = {
    board: {
        style: "squares",
        width: 4,
        height: 4,
        reference: {
            layout: "sidebar",
            source: "custom-ref",
            position: "right",
            rotateWithBoard: true,
        },
    },
    legend: {
        "custom-ref": [
            { name: "piece", colour: 1, scale: 0.5 },
            { name: "piece", colour: 2, scale: 0.35 },
        ],
        X: { name: "piece", colour: 1 },
    },
    pieces: "X---\n----\n----\n----",
};

describe("board reference adornments", () => {
    it("validates board.reference in schema", () => {
        const ajv = new Ajv();
        expect(ajv.validate(schema, scribeFixture)).to.equal(true);
        expect(ajv.validate(schema, colFixture)).to.equal(true);
        expect(ajv.validate(schema, dualScribeFixture)).to.equal(true);
    });

    it("registers built-in reference assets", () => {
        expect(listReferenceAssets()).to.include.members([
            "scribe-chart",
            "scribe-chart-left",
            "scribe-chart-right",
            "circle-of-life-ring",
        ]);
        expect(getReferenceAsset("scribe-chart")?.anchor.layout).to.equal("sidebar");
        expect(getReferenceAsset("circle-of-life-ring")?.anchor.layout).to.equal("annulus");
    });

    it("renders registry references via defs symbol and use", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        renderer.render(scribeFixture, draw, baseOptions);
        expect(draw.findOne("#_board-ref-scribe-chart")).to.not.equal(null);
        const useEl = draw.findOne("#board-reference use") as SVGElement | null;
        expect(useEl).to.not.equal(null);
        const href = useEl!.attr("href") ?? useEl!.attr("xlink:href");
        expect(href).to.equal("#_board-ref-scribe-chart");
    });

    it("renders sidebar reference with detached tableau", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        renderer.render(scribeFixture, draw, baseOptions);
        expect(draw.findOne("#board-reference")).to.not.equal(null);
        expect(draw.findOne("#board-tableau")).to.not.equal(null);
        const ref = draw.findOne("#board-reference")!;
        expect(ref.parent()?.id()).to.equal("board-tableau");
    });

    it("renders annulus reference inside the board group", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        renderer.render(colFixture, draw, baseOptions);
        const ref = draw.findOne("#board-reference");
        expect(ref).to.not.equal(null);
        expect(ref?.parent()?.id()).to.equal("board");
    });

    it("applies bulk style slots with per-index overrides", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        const fixture = {
            ...colFixture,
            board: {
                ...colFixture.board,
                reference: {
                    layout: "annulus" as const,
                    source: "circle-of-life-ring",
                    rotateWithBoard: true,
                    styles: {
                        species: 3,
                        "species-0": 1,
                    },
                },
            },
        } as APRenderRep;
        renderer.render(fixture, draw, baseOptions);
        const bulk = draw.findOne('[data-ref-fill="species-1"]') as SVGElement | null;
        const override = draw.findOne('[data-ref-fill="species-0"]') as SVGElement | null;
        expect(bulk?.attr("fill")).to.equal("#33a02c");
        expect(override?.attr("fill")).to.equal("#e31a1c");
    });

    it("places scribe sidebar clear of row labels", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        renderer.render(scribeFixture, draw, baseOptions);
        const useEl = draw.findOne("#board-reference use") as SVGElement | null;
        expect(useEl).to.not.equal(null);
        const refRight = (useEl!.x() as number) + (useEl!.width() as number);
        const rowLabel = draw.findOne("#labels text") as SVGElement | null;
        expect(rowLabel).to.not.equal(null);
        const labelRight = (rowLabel!.x() as number) + 20;
        expect(refRight).to.be.lessThan(labelRight);
    });

    it("uses a tight scribe chart viewBox", () => {
        const asset = getReferenceAsset("scribe-chart")!;
        expect(asset.viewBox.w).to.be.lessThan(80);
    });

    it("referenceStyleSelectors supports bulk ids", () => {
        expect(referenceStyleSelectors("species").fill).to.include("species-");
        expect(referenceStyleSelectors("glyphs").fill).to.include("glyph-");
        expect(referenceStyleSelectors("text").fill).to.include("labels");
    });

    it("applies style slots to reference artwork", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        renderer.render(colFixture, draw, baseOptions);
        const styled = draw.findOne('[data-ref-fill="species-0"]');
        expect(styled).to.not.equal(null);
    });

    it("computeAnnulusPlacement centres artwork on the playfield", () => {
        const asset = getReferenceAsset("circle-of-life-ring")!;
        const metrics = {
            x: -3,
            y: -25,
            width: 346,
            height: 300,
            cx: 173.20508075688772,
            cy: 124.5,
            hullRadius: 185.5,
        };
        const placement = computeAnnulusPlacement(
            {
                viewBox: asset.viewBox,
                anchor: asset.anchor as { layout: "annulus"; innerRadius: number; center: [number, number] },
                fromLegend: false,
            },
            metrics,
            { layout: "annulus", source: "circle-of-life-ring", gap: 0.5 },
            50,
        );
        const anchor = asset.anchor as { center: [number, number] };
        const scale = placement.width / asset.viewBox.w;
        const refCx = placement.x + anchor.center[0] * scale;
        expect(refCx).to.be.closeTo(metrics.cx, 0.01);
    });

    it("computes annulus metrics from hex polygons", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        const fixture: APRenderRep = {
            board: { style: "hex-of-hex", minWidth: 5, maxWidth: 9 },
            legend: { A: { name: "piece", colour: 1 }, B: { name: "piece", colour: 2 } },
            pieces: "-----\n------\n---A---\n----B--\n------\n---A---\n------\n-----",
        };
        renderer.render(fixture, draw, baseOptions);
        const { polys } = hexOfHex(renderer, { noSvg: true });
        const hull = playfieldHullFromPolys(polys!, 50)!;
        const metrics = computePlayfieldMetrics(draw, 50, polys);
        expect(metrics.cx).to.be.closeTo(hull.cx, 0.01);
        expect(metrics.cy).to.be.closeTo(hull.cy, 0.01);
        expect(metrics.hullRadius).to.be.closeTo(hull.hullRadius, 0.01);
    });

    it("sizes annulus reference to the hex playfield hull", () => {
        const fixture: APRenderRep = {
            ...colFixture,
            board: {
                style: "hex-of-hex",
                minWidth: 5,
                maxWidth: 9,
                reference: {
                    layout: "annulus",
                    source: "circle-of-life-ring",
                    rotateWithBoard: true,
                    gap: 0.5,
                },
            },
        };
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        renderer.render(fixture, draw, baseOptions);
        const ref = draw.findOne("#board-reference") as SVGG;
        const useEl = ref.findOne("use") as SVGElement | null;
        expect(useEl).to.not.equal(null);
        const placement = {
            x: useEl!.x() as number,
            y: useEl!.y() as number,
            width: useEl!.width() as number,
            height: useEl!.height() as number,
        };
        const asset = getReferenceAsset("circle-of-life-ring")!;
        const anchor = asset.anchor as { center: [number, number] };
        const scale = placement.width / asset.viewBox.w;
        const refCx = placement.x + anchor.center[0] * scale;
        const refCy = placement.y + anchor.center[1] * scale;

        const { polys } = hexOfHex(renderer, { noSvg: true });
        const hull = playfieldHullFromPolys(polys!, 50)!;
        expect(refCx).to.be.closeTo(hull.cx, 1);
        expect(refCy).to.be.closeTo(hull.cy, 1);

        const gap = 0.5 * 50;
        const expectedScale = (hull.hullRadius + gap) / 398;
        expect(scale).to.be.closeTo(expectedScale, 0.02);
    });

    it("supports legend override for reference source", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        renderer.render(legendOverrideFixture, draw, baseOptions);
        expect(draw.findOne("#board-reference")).to.not.equal(null);
    });

    it("renders dual sidebar references with separate uses", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        renderer.render(dualScribeFixture, draw, baseOptions);
        const uses = draw.find("#board-reference use");
        expect(uses.length).to.equal(2);
        const board = draw.findOne("#board") as SVGG;
        const gridlines = board.findOne("#gridlines") as SVGG;
        const gridBox = gridlines.rbox(board);
        const leftUse = uses[0] as SVGElement;
        const rightUse = uses[1] as SVGElement;
        const leftRight = (leftUse.x() as number) + (leftUse.width() as number);
        const rightLeft = rightUse.x() as number;
        expect(leftRight).to.be.lessThan(gridBox.x);
        expect(rightLeft).to.be.greaterThan(gridBox.x2);
    });

    it("places top sidebar references above the playfield", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        renderer.render(topRefFixture, draw, baseOptions);
        const useEl = draw.findOne("#board-reference use") as SVGElement | null;
        expect(useEl).to.not.equal(null);
        const board = draw.findOne("#board") as SVGG;
        const gridlines = board.findOne("#gridlines") as SVGG;
        const gridBox = gridlines.rbox(board);
        const refBottom = (useEl!.y() as number) + (useEl!.height() as number);
        expect(refBottom).to.be.lessThan(gridBox.y);
        const refWidth = useEl!.width() as number;
        expect(refWidth).to.be.closeTo(gridBox.width, gridBox.width * 0.15);
    });

    it("places bottom sidebar references above areas", () => {
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        renderer.render(bottomRefFixture, draw, baseOptions);
        const useEl = draw.findOne("#board-reference use") as SVGElement | null;
        expect(useEl).to.not.equal(null);
        const refBottom = useEl!.rbox(draw).y2;
        const area = draw.findOne("#_pieces0") as SVGElement | null;
        expect(area).to.not.equal(null);
        expect(refBottom).to.be.lessThan(area!.rbox(draw).y);
    });

    it("throws when source array length mismatches sides", () => {
        expect(() => resolveSourceForSide({
            layout: "sidebar",
            sides: ["left", "right"],
            source: ["only-one"],
        }, "right")).to.throw(/source has 1 entries/);
    });

    it("split scribe assets are shorter than the full chart", () => {
        const full = getReferenceAsset("scribe-chart")!;
        const left = getReferenceAsset("scribe-chart-left")!;
        const right = getReferenceAsset("scribe-chart-right")!;
        expect(left.viewBox.h).to.be.lessThan(full.viewBox.h);
        expect(right.viewBox.h).to.be.lessThan(full.viewBox.h);
        expect(left.viewBox.h + right.viewBox.h).to.be.greaterThan(full.viewBox.h * 0.9);
    });

    it("computeSidebarPlacement supports top and bottom sides", () => {
        const asset = getReferenceAsset("scribe-chart-left")!;
        const metrics = { x: 10, y: 20, width: 200, height: 150 };
        const ref = { layout: "sidebar" as const, source: "scribe-chart-left" };
        const top = computeSidebarPlacement(
            { viewBox: asset.viewBox, anchor: asset.anchor, fromLegend: false },
            metrics,
            ref,
            50,
            "top",
        );
        const bottom = computeSidebarPlacement(
            { viewBox: asset.viewBox, anchor: asset.anchor, fromLegend: false },
            { ...metrics, y2: metrics.y + metrics.height },
            ref,
            50,
            "bottom",
        );
        expect(top.y + top.height).to.be.lessThan(metrics.y);
        expect(bottom.y).to.be.greaterThan(metrics.y + metrics.height);
    });
});
