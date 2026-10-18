import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, type Element, type Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { logicalCellCenter } from "../src/composite/cellCenter.js";
import { captureSquareClickMeta } from "../src/composite/captureSquareClickMeta.js";
import { renderComposite } from "../src/composite/renderComposite.js";
import { validateComposite } from "../src/composite/validateComposite.js";
import { validateCompositeAnnotationTargets } from "../src/composite/validateCompositeAnnotations.js";
import type { APRenderComposite } from "../src/schemas/composite.js";
import crossPanelSample from "./fixtures/composite-cross-panel-arrow.json" with { type: "json" };
import { renderRep } from "../src/renderRep.js";
import schema from "../src/schemas/schema.json" with { type: "json" };
import AjvImport from "ajv";
import type { ValidateFunction } from "ajv";
import { coreRenderOptions } from "./helpers/renderTestDraw.js";

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    registerWindow(window, window.document);
    return SVG(window.document.documentElement) as Svg;
};

type AjvInstance = { compile(jsonSchema: object): ValidateFunction };
const ajvCtor = AjvImport as unknown as new () => AjvInstance;
const validateRep = new ajvCtor().compile(schema);

describe("composite cross-panel annotations", () => {
    it("validates sample with top-level annotations", () => {
        expect(validateComposite(crossPanelSample as APRenderComposite)).to.equal(true);
        expect(() => validateCompositeAnnotationTargets(crossPanelSample as APRenderComposite)).to.not.throw();
    });

    it("rejects unknown panel id in annotation targets", () => {
        const doc = structuredClone(crossPanelSample) as APRenderComposite;
        doc.annotations![0]!.targets[0]!.panel = "missing";
        expect(() => validateCompositeAnnotationTargets(doc)).to.throw(/unknown panel/);
    });

    it("rejects out-of-bounds row/col in annotation targets", () => {
        const doc = structuredClone(crossPanelSample) as APRenderComposite;
        doc.annotations![0]!.targets[0]!.row = 99;
        expect(() => validateCompositeAnnotationTargets(doc)).to.throw(/out of bounds/);
    });

    it("logicalCellCenter matches opposite corner tile for 2x2 at rotate 180", () => {
        const draw = makeDraw();
        const rep = {
            board: { style: "squares-checkered", width: 2, height: 2 },
            legend: { A: { name: "piece", paint: { fill: 1 } } },
            pieces: "AA\nAA",
        };
        renderRep(rep, { ...coreRenderOptions, target: draw, rotate: 180 }, validateRep);
        const meta = captureSquareClickMeta(draw, rep, 180, 0);
        expect(meta).to.not.equal(undefined);
        const centre = logicalCellCenter(meta!, 1, 1);
        const tiles = draw.find("#tiles use") as Element[];
        expect(tiles.length).to.be.greaterThan(1);
        const lastTile = tiles[tiles.length - 1] as Element;
        const box = lastTile.bbox();
        expect(centre!.x).to.be.closeTo(box.cx, 0.5);
        expect(centre!.y).to.be.closeTo(box.cy, 0.5);
    });

    it("logicalCellCenter matches first tile for 2x2 at rotate 0", () => {
        const draw = makeDraw();
        const rep = {
            board: { style: "squares-checkered", width: 2, height: 2 },
            legend: { A: { name: "piece", paint: { fill: 1 } } },
            pieces: "AA\nAA",
        };
        renderRep(rep, { ...coreRenderOptions, target: draw }, validateRep);
        const meta = captureSquareClickMeta(draw, rep, 0, 0);
        expect(meta).to.not.equal(undefined);
        const centre = logicalCellCenter(meta!, 0, 0);
        const tile = draw.findOne("#tiles use") as Element;
        const box = tile.bbox();
        expect(centre!.x).to.be.closeTo(box.cx, 0.01);
        expect(centre!.y).to.be.closeTo(box.cy, 0.01);
    });

    it("cross-panel move endpoints align with cells when panels use board.rotate", () => {
        const doc = {
            kind: "composite",
            layout: { arrangement: "row", gap: 1 },
            panels: [
                {
                    id: "left",
                    label: "From",
                    render: {
                        board: { rotate: 90, style: "squares-checkered", width: 4, height: 4 },
                        legend: { A: { name: "piece", paint: { fill: 1 } } },
                        pieces: "----\n----\n--A-\n----",
                    },
                },
                {
                    id: "right",
                    label: "To",
                    render: {
                        board: { rotate: 180, style: "squares-checkered", width: 4, height: 4 },
                        legend: { B: { name: "piece", paint: { fill: 2 } } },
                        pieces: "----\n-B--\n----\n----",
                    },
                },
            ],
            annotations: [
                {
                    type: "move",
                    colour: 1,
                    targets: [
                        { panel: "left", row: 2, col: 2 },
                        { panel: "right", row: 1, col: 1 },
                    ],
                },
            ],
        } as APRenderComposite;
        const draw = makeDraw();
        renderComposite(doc, { ...coreRenderOptions, target: draw, showAnnotations: true });
        const poly = draw.findOne("#ap-composite-annotations polyline") as Element;
        expect(poly).to.not.equal(null);
        const [start, end] = String(poly.attr("points")).trim().split(/\s+/);
        const parsePt = (s: string) => {
            const [x, y] = s.split(",").map(Number);
            return { x, y };
        };
        const p0 = parsePt(start);
        const p1 = parsePt(end);
        expect(Number.isFinite(p0.x)).to.equal(true);
        expect(Number.isFinite(p0.y)).to.equal(true);
        expect(Number.isFinite(p1.x)).to.equal(true);
        expect(Number.isFinite(p1.y)).to.equal(true);
        expect(Math.hypot(p1.x - p0.x, p1.y - p0.y)).to.be.greaterThan(10);
    });

    it("draws cross-panel move annotation when showAnnotations is true", () => {
        const draw = makeDraw();
        renderComposite(crossPanelSample as APRenderComposite, {
            ...coreRenderOptions,
            target: draw,
            showAnnotations: true,
        });
        const layer = draw.findOne("#ap-composite-annotations");
        expect(layer).to.not.equal(null);
        const polylines = layer!.find("polyline");
        expect(polylines.length).to.be.greaterThan(0);
    });

    it("omits cross-panel annotation layer when showAnnotations is false", () => {
        const draw = makeDraw();
        renderComposite(crossPanelSample as APRenderComposite, {
            ...coreRenderOptions,
            target: draw,
            showAnnotations: false,
        });
        expect(draw.findOne("#ap-composite-annotations")).to.equal(null);
    });
});
