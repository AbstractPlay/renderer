import Ajv from "ajv";
import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, type Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { renderComposite } from "../src/composite/renderComposite.js";
import { layoutCompositePanels, gapPixels } from "../src/composite/layout.js";
import { validateComposite } from "../src/composite/validateComposite.js";
import type { APRenderComposite, APRenderCompositePanel } from "../src/schemas/composite.js";
import type { APRenderRep } from "../src/schemas/schema.js";
import schema from "../src/schemas/schema.json" with { type: "json" };
import playgroundSamples from "./fixtures/playground-samples.json" with { type: "json" };
import { coreRenderOptions } from "./helpers/renderTestDraw.js";

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    registerWindow(window, window.document);
    return SVG(window.document.documentElement) as Svg;
};

const miniRep = (marker: string): APRenderRep => ({
    board: { style: "squares-checkered", width: 2, height: 2 },
    legend: {
        A: { name: "piece", paint: { fill: 1 } },
        B: { name: "piece", paint: { fill: 2 } },
    },
    pieces: `${marker}${marker}\n${marker}${marker}`,
});

const panel = (id: string, marker: string, rotate?: 0 | 180): APRenderCompositePanel => ({
    id,
    ...(rotate !== undefined ? { rotate } : {}),
    render: miniRep(marker),
});

const rowComposite = (panels: APRenderCompositePanel[]): APRenderComposite => ({
    kind: "composite",
    layout: { arrangement: "row", gap: 1 },
    panels,
});

describe("APRenderComposite schema", () => {
    it("validates a minimal composite document", () => {
        const doc = rowComposite([panel("a", "A"), panel("b", "B")]);
        expect(validateComposite(doc)).to.equal(true);
    });

    it("requires layout.columns for grid arrangement", () => {
        const doc: APRenderComposite = {
            kind: "composite",
            layout: { arrangement: "grid" },
            panels: [panel("a", "A")],
        };
        expect(validateComposite(doc)).to.equal(false);
    });

    it("validates each panel render against the main render schema", () => {
        const ajv = new Ajv();
        const validateRep = ajv.validate(schema, miniRep("A"));
        expect(validateRep).to.equal(true);
    });
});

describe("composite layout", () => {
    it("places row panels left-to-right with gap", () => {
        const bboxA = { x: 0, y: 0, width: 100, height: 80 };
        const bboxB = { x: 0, y: 0, width: 60, height: 80 };
        const placements = layoutCompositePanels(
            [
                { panel: panel("a", "A"), bbox: bboxA, labelBand: 0 },
                { panel: panel("b", "B"), bbox: bboxB, labelBand: 0 },
            ],
            { arrangement: "row", gap: 1 },
            gapPixels({ arrangement: "row", gap: 1 }),
        );
        expect(placements[0]!.cellX).to.equal(0);
        expect(placements[1]!.cellX).to.be.greaterThan(placements[0]!.cellX);
    });

    it("uses shared row cell height in grid (same boardTop per row)", () => {
        const tall = { x: 0, y: 0, width: 50, height: 60 };
        const short = { x: 0, y: 0, width: 50, height: 58 };
        const placements = layoutCompositePanels(
            [
                { panel: panel("nw", "A"), bbox: tall, labelBand: 20 },
                { panel: panel("ne", "B"), bbox: short, labelBand: 18 },
                { panel: panel("sw", "A"), bbox: short, labelBand: 18 },
                { panel: panel("se", "B"), bbox: tall, labelBand: 20 },
            ],
            { arrangement: "grid", columns: 2, gap: 0 },
            0,
        );
        expect(placements.find((p) => p.panel.id === "nw")!.boardTop).to.equal(
            placements.find((p) => p.panel.id === "ne")!.boardTop,
        );
        expect(placements.find((p) => p.panel.id === "sw")!.boardTop).to.equal(
            placements.find((p) => p.panel.id === "se")!.boardTop,
        );
        expect(placements.find((p) => p.panel.id === "nw")!.cellHeight).to.equal(
            placements.find((p) => p.panel.id === "ne")!.cellHeight,
        );
    });

    it("fills grid in row-major order", () => {
        const cell = { x: 0, y: 0, width: 50, height: 50 };
        const placements = layoutCompositePanels(
            [
                { panel: panel("1", "A"), bbox: cell, labelBand: 0 },
                { panel: panel("2", "B"), bbox: cell, labelBand: 0 },
                { panel: panel("3", "A"), bbox: cell, labelBand: 0 },
                { panel: panel("4", "B"), bbox: cell, labelBand: 0 },
            ],
            { arrangement: "grid", columns: 2, gap: 0 },
            0,
        );
        expect(placements).to.have.length(4);
        expect(placements[1]!.cellX).to.be.greaterThan(placements[0]!.cellX);
        expect(placements[2]!.cellY).to.be.greaterThan(placements[0]!.cellY);
    });
});

describe("renderComposite", () => {
    it("renders panel groups with data-panel-id", () => {
        const draw = makeDraw();
        renderComposite(rowComposite([panel("west", "A"), panel("east", "B")]), {
            ...coreRenderOptions,
            target: draw,
        });
        expect(draw.findOne('[data-panel-id="west"]')).to.not.equal(null);
        expect(draw.findOne('[data-panel-id="east"]')).to.not.equal(null);
        expect(draw.viewbox().w).to.be.greaterThan(0);
    });

    it("viewBox includes full board extent (row/column labels not clipped)", () => {
        const draw = makeDraw();
        const rep: APRenderRep = {
            board: { style: "squares-checkered", width: 4, height: 4 },
            legend: {
                A: { name: "piece", paint: { fill: 1 } },
                B: { name: "piece", paint: { fill: 2 } },
            },
            pieces: "AAAA\nA--A\nA--A\nAAAA",
        };
        const doc: APRenderComposite = {
            kind: "composite",
            layout: { arrangement: "row", gap: 1 },
            panels: [
                { id: "left", label: "Board A", render: rep },
                { id: "right", label: "Board B", rotate: 180, render: { ...rep, pieces: "BBBB\nB--B\nB--B\nBBBB" } },
            ],
        };
        renderComposite(doc, { ...coreRenderOptions, target: draw });
        const vb = draw.viewbox();
        const group = draw.findOne("#ap-composite-panels");
        expect(group).to.not.equal(null);
        const content = group!.rbox(draw);
        expect(vb.x).to.be.at.most(content.x + 1);
        expect(vb.y).to.be.at.most(content.y + 1);
        expect(vb.x + vb.w).to.be.at.least(content.x2 - 1);
        expect(vb.y + vb.h).to.be.at.least(content.y2 - 1);
        const leftPanel = draw.findOne('[data-panel-id="left"]');
        expect(leftPanel).to.not.equal(null);
        const panelBox = leftPanel!.rbox(draw);
        expect(panelBox.width).to.be.greaterThan(150);
        expect(vb.w).to.be.lessThan(1200);
    });

    it("aligns grid columns to the same boardTop per row", () => {
        const draw = makeDraw();
        const doc = JSON.parse(playgroundSamples["composite-grid-2x2"].render) as APRenderComposite;
        renderComposite(doc, { ...coreRenderOptions, target: draw });
        const nw = draw.findOne('[data-panel-id="nw"]')!.rbox(draw);
        const ne = draw.findOne('[data-panel-id="ne"]')!.rbox(draw);
        expect(nw.y).to.be.closeTo(ne.y, 0.01);
        const sw = draw.findOne('[data-panel-id="sw"]')!.rbox(draw);
        const se = draw.findOne('[data-panel-id="se"]')!.rbox(draw);
        expect(sw.y).to.be.closeTo(se.y, 0.01);
    });

    it("keeps panel titles above board ink (not overlapping coordinates)", () => {
        const draw = makeDraw();
        const doc: APRenderComposite = {
            kind: "composite",
            layout: { arrangement: "row", gap: 1 },
            panels: [
                { id: "left", label: "Board A", render: miniRep("A") },
                { id: "right", label: "Board B", render: miniRep("B") },
            ],
        };
        renderComposite(doc, { ...coreRenderOptions, target: draw });
        const left = draw.findOne('[data-panel-id="left"]')!;
        const title = draw.findOne(".aprender-composite-panel-label")!;
        const panelTop = left.rbox(draw).y;
        const titleBottom = title.rbox(draw).y2;
        expect(titleBottom).to.be.at.most(panelTop + 0.5);
    });

    it("rejects composite-level opts.rotate", () => {
        const draw = makeDraw();
        expect(() => renderComposite(rowComposite([panel("a", "A")]), {
            ...coreRenderOptions,
            target: draw,
            rotate: 180,
        })).to.throw(/opts\.rotate/);
    });

    it("routes boardClick with panel id", () => {
        const draw = makeDraw();
        const clicks: string[] = [];
        renderComposite(rowComposite([panel("p1", "A"), panel("p2", "B")]), {
            ...coreRenderOptions,
            target: draw,
            boardClick: (panelId, row, col, piece) => {
                clicks.push(`${panelId}:${row},${col},${piece}`);
            },
        });
        expect(clicks).to.have.length(0);
    });

    it("accepts showAnnotations on composite options", () => {
        const annotated: APRenderRep = {
            board: { style: "squares", width: 1, height: 1 },
            legend: { A: { name: "piece", paint: { fill: 1 } } },
            pieces: "A",
            annotations: [{ type: "dots", colour: 1, targets: [{ row: 0, col: 0 }] }],
        };
        const doc: APRenderComposite = {
            kind: "composite",
            layout: { arrangement: "column" },
            panels: [{ id: "only", render: annotated }],
        };
        const draw = makeDraw();
        expect(() => renderComposite(doc, {
            ...coreRenderOptions,
            target: draw,
            showAnnotations: true,
        })).to.not.throw();
    });
});
