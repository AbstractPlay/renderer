/* eslint-disable @typescript-eslint/no-require-imports */
import { expect } from "chai";
import "mocha";
import { Element as SVGElement, SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { StackingOffsetRenderer } from "../src/renderers/stackingOffset";
import { IRendererOptionsIn } from "../src/renderers/_base";
import {
    STREETCAR_FENCE_COUNT,
    streetcarClaimLinesRenderRep,
} from "./fixtures/streetcarClaimLines";

const { createSVGWindow } = require("svgdom");

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    const document = window.document;
    registerWindow(window, document);
    return SVG(document.documentElement) as Svg;
};

const pointerEvents = (el: SVGElement): string | undefined => {
    const attr = el.attr("pointer-events");
    if (typeof attr === "string") {
        return attr;
    }
    if (Array.isArray(attr)) {
        return attr[0];
    }
    return undefined;
};

const strokeWidth = (el: SVGElement): number => {
    const stroke = el.attr("stroke-width");
    if (typeof stroke === "number") {
        return stroke;
    }
    if (typeof stroke === "string") {
        return Number(stroke);
    }
    return 0;
};

const layerChildIds = (root: SVGElement): string[] =>
    root.children().map((child) => child.id());

describe("Streetcar Suburb claim-line regression", () => {
    it("should layer fence markers above grid strokes and keep edges clickable through fences", () => {
        const draw = makeDraw();
        const renderer = new StackingOffsetRenderer();
        const clicks: Array<{ row: number; col: number; piece: string }> = [];
        const options: IRendererOptionsIn = {
            contextGlobal: true,
            coloursGlobal: false,
            showAnnotations: false,
            sheets: ["core", "streetcar"],
            colourContext: {
                background: "#cede86",
                fill: "#ffffff",
                strokes: "#333333",
                labels: "#000000",
            },
            boardClick: (row, col, piece) => {
                clicks.push({ row, col, piece });
            },
        };

        renderer.render(streetcarClaimLinesRenderRep, draw, options);

        const cells = draw.findOne("#cells") as SVGElement;
        expect(cells).to.not.equal(null);

        const childIds = layerChildIds(cells);
        const strokesIdx = childIds.indexOf("cells-strokes");
        const markersIdx = childIds.indexOf("cells-markers");
        expect(strokesIdx).to.be.greaterThan(-1);
        expect(markersIdx).to.be.greaterThan(-1);
        expect(markersIdx).to.be.greaterThan(strokesIdx);

        const markerLines = (draw.findOne("#cells-markers") as SVGElement).find("line") as SVGElement[];
        expect(markerLines.length).to.equal(STREETCAR_FENCE_COUNT);

        const visibleFence = markerLines.find((line) => strokeWidth(line) > 0);
        expect(visibleFence).to.not.equal(undefined);

        for (const line of markerLines) {
            expect(pointerEvents(line)).to.equal("none");
        }

        const strokeLines = (draw.findOne("#cells-strokes") as SVGElement).find("line") as SVGElement[];
        expect(strokeLines.length).to.be.greaterThan(0);

        for (const line of strokeLines) {
            expect(pointerEvents(line)).to.not.equal("none");
        }

        // Invoke click on a clickable edge line; fences must not block the handler.
        const edgeLine = strokeLines[0];
        expect(edgeLine).to.not.equal(undefined);
        const window = createSVGWindow();
        const event = window.document.createEvent?.("Event");
        if (event !== undefined && typeof event.initEvent === "function") {
            event.initEvent("click", true, true);
            edgeLine!.node.dispatchEvent(event);
            expect(clicks.length).to.equal(1);
            expect(clicks[0]!.piece).to.match(/^(N|NE|E|SE|S|SW|W|NW)$/);
        }
    });
});
