import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, type Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { captureKeyAreaClickMeta } from "../src/composite/captureKeyAreaClickMeta.js";
import { panelIdPrefix } from "../src/composite/importPanel.js";
import { gapPixels, layoutCompositePanels } from "../src/composite/layout.js";
import { renderComposite } from "../src/composite/renderComposite.js";
import type { APRenderComposite, APRenderCompositePanel } from "../src/schemas/composite.js";
import type { APRenderRep } from "../src/schemas/schema.js";
import { renderRep, unionLayoutBBox } from "../src/renderRep.js";
import schema from "../src/schemas/schema.json" with { type: "json" };
import AjvImport from "ajv";
import type { ValidateFunction } from "ajv";
import { coreRenderOptions } from "./helpers/renderTestDraw.js";

type AjvInstance = { compile(jsonSchema: object): ValidateFunction };
const ajvCtor = AjvImport as unknown as new () => AjvInstance;
const validateRep = new ajvCtor().compile(schema);

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    registerWindow(window, window.document);
    return SVG(window.document.documentElement) as Svg;
};

const isometricKeyRep = (): APRenderRep => ({
    renderer: "isometric",
    board: { style: "squares", width: 2, height: 2 },
    legend: {
        R: { piece: "cube", height: 30, colour: "#ff0000" },
    },
    pieces: [
        [[{ glyph: "R" }], []],
        [[], []],
    ],
    areas: [{
        type: "key",
        list: [{ piece: "R", name: "RedName", value: "RedValue" }],
    }],
});

const rowComposite = (panels: APRenderCompositePanel[]): APRenderComposite => ({
    kind: "composite",
    layout: { arrangement: "row", gap: 1 },
    panels,
});

describe("composite live panel compose", () => {
    it("uses native key bar handlers (not delegated hit testing)", () => {
        const drawMeas = makeDraw();
        const draw = makeDraw();
        const keyRender = isometricKeyRep();
        const doc = rowComposite([{ id: "legend", render: keyRender }]);

        renderRep(keyRender, { ...coreRenderOptions, target: drawMeas, rotate: 0 }, validateRep);
        const bbox = unionLayoutBBox(drawMeas);
        const keyMeta = captureKeyAreaClickMeta(drawMeas, keyRender);
        expect(keyMeta).to.not.equal(undefined);
        const placements = layoutCompositePanels(
            [{ panel: doc.panels[0]!, bbox, labelBand: 0 }],
            doc.layout,
            gapPixels(doc.layout),
        );
        const placement = placements[0]!;
        const clientX = placement.boardX - bbox.x + keyMeta!.x + keyMeta!.width / 2;
        const clientY = placement.boardTop - bbox.y + keyMeta!.y + keyMeta!.height / 2;

        let clicked: { panelId: string; row: number; col: number; piece: string } | undefined;

        renderComposite(doc, {
            ...coreRenderOptions,
            target: draw,
            boardClick(panelId, row, col, piece) {
                clicked = { panelId, row, col, piece };
            },
        });

        const keyUse = [...draw.find("use")].find((u) => {
            const href = u.attr("href") ?? u.attr("xlink:href");
            return typeof href === "string" && href.includes("_key");
        });
        expect(keyUse).to.not.equal(undefined);

        keyUse!.fire("click", { clientX, clientY });

        expect(clicked?.panelId).to.equal("legend");
        expect(clicked?.row).to.equal(-1);
        expect(clicked?.col).to.equal(-1);
        expect(clicked?.piece).to.equal("RedValue");
    });

    it("fires boardClick for stacking-expanding board cells in composite", () => {
        const keyRender: APRenderRep = {
            renderer: "stacking-expanding",
            board: { style: "squares", width: 2, height: 2 },
            legend: { A: { name: "piece", paint: { fill: 1 } } },
            pieces: [[["A"], []], [[], []]],
            areas: [{ type: "key", list: [{ piece: "A", name: "n", value: "v" }] }],
        };
        const doc = rowComposite([{ id: "key", render: keyRender }]);

        const draw = makeDraw();
        let clicked: { panelId: string; row: number; col: number; piece: string } | undefined;
        renderComposite(doc, {
            ...coreRenderOptions,
            target: draw,
            boardClick(panelId, row, col, piece) {
                clicked = { panelId, row, col, piece };
            },
        });

        const prefix = panelIdPrefix("key");
        const tiles = draw.find(`#${prefix}pieces #${prefix}tiles use`);
        expect(tiles.length).to.equal(4);
        const emptyTile = tiles[3]!;
        const box = emptyTile.rbox(draw);
        emptyTile.fire("click", { clientX: box.cx, clientY: box.cy });

        expect(clicked?.panelId).to.equal("key");
        expect(clicked?.row).to.equal(1);
        expect(clicked?.col).to.equal(1);
        expect(clicked?.piece).to.equal("");
    });
});
