import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, type Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { captureSquareClickMeta } from "../src/composite/captureSquareClickMeta.js";
import { resolveCompositeBoardHit } from "../src/composite/compositeBoardHit.js";
import { panelIdPrefix } from "../src/composite/importPanel.js";
import { gapPixels, layoutCompositePanels } from "../src/composite/layout.js";
import { renderComposite } from "../src/composite/renderComposite.js";
import type { APRenderComposite, APRenderCompositePanel } from "../src/schemas/composite.js";
import type { APRenderRep } from "../src/schemas/schema.js";
import { render } from "../src/index.js";
import { unionLayoutBBox } from "../src/renderRep.js";
import { coreRenderOptions } from "./helpers/renderTestDraw.js";

const miniRep = (marker: string): APRenderRep => ({
    board: { style: "squares-checkered", width: 2, height: 2 },
    legend: {
        A: { name: "piece", paint: { fill: 1 } },
        B: { name: "piece", paint: { fill: 2 } },
    },
    pieces: `${marker}${marker}\n${marker}${marker}`,
});

const panel = (id: string, marker: string): APRenderCompositePanel => ({
    id,
    render: miniRep(marker),
});

const rowComposite = (panels: APRenderCompositePanel[]): APRenderComposite => ({
    kind: "composite",
    layout: { arrangement: "row", gap: 1 },
    panels,
});

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    registerWindow(window, window.document);
    return SVG(window.document.documentElement) as Svg;
};

describe("resolveCompositeBoardHit", () => {
    it("resolves panel id, cell, and piece from a tile under a composite panel", () => {
        const drawMeas = makeDraw();
        const draw = makeDraw();
        const doc = rowComposite([panel("p1", "A"), panel("p2", "B")]);
        const p1 = doc.panels[0]!;

        render(p1.render, {
            ...coreRenderOptions,
            target: drawMeas,
            rotate: 0,
        });
        const bbox = unionLayoutBBox(drawMeas);
        const clickMeta = captureSquareClickMeta(drawMeas, p1.render, 0);
        expect(clickMeta).to.not.equal(undefined);

        renderComposite(doc, { ...coreRenderOptions, target: draw });

        const tile = draw.findOne(`#${panelIdPrefix("p1")}tiles use`);
        expect(tile).to.not.equal(null);
        const box = tile!.rbox(draw);
        const clientX = box.x + box.width / 2;
        const clientY = box.y + box.height / 2;

        const placements = layoutCompositePanels(
            [
                { panel: p1, bbox, labelBand: 0 },
                { panel: doc.panels[1]!, bbox, labelBand: 0 },
            ],
            doc.layout,
            gapPixels(doc.layout),
        );
        const clickMetaByPanelId = new Map([["p1", clickMeta!]]);

        const hit = resolveCompositeBoardHit(
            draw,
            doc,
            placements,
            clickMetaByPanelId,
            tile!.node,
            clientX,
            clientY,
        );
        expect(hit?.panelId).to.equal("p1");
        expect(hit?.row).to.equal(0);
        expect(hit?.col).to.equal(0);
        expect(hit?.piece.length).to.be.greaterThan(0);
    });
});
