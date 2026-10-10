import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { DefaultRenderer } from "../src/renderers/default";
import { IRendererOptionsIn } from "../src/renderers/_base";
import { APRenderRep } from "../src/schemas/schema";
import { createSVGWindow } from "svgdom";

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    const document = window.document;
    registerWindow(window, document);
    return SVG(document.documentElement) as Svg;
};

const baseOptions: IRendererOptionsIn = {
    contextGlobal: true,
    coloursGlobal: true,
    colourContext: {
        background: "#fff",
        fill: "#eee",
        strokes: "#000",
        annotations: "#000",
        borders: "#000",
        labels: "#000",
        board: "#ddd",
    },
    showAnnotations: false,
    sheets: ["core"],
    colours: ["#c44", "#48c"],
};

const veiledStashRep: APRenderRep = {
    board: {
        style: "squares",
        width: 3,
        height: 3,
    },
    legend: {
        A: { name: "piece", colour: 1 },
    },
    pieces: "A,A,A,A,A,A,A,A,A",
    areas: [
        {
            type: "pieces",
            label: "Stash",
            pieces: ["A", "A"],
            veiled: true,
        },
    ],
};

describe("pieces area veil", () => {
    it("draws a click-through veil when veiled is true", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(veiledStashRep, draw, baseOptions);
        const piecesArea = draw.findOne("#_pieces0");
        expect(piecesArea).to.not.equal(null);
        if (piecesArea === null) {
            return;
        }
        const veils = piecesArea.find(".aprender-pieces-veil");
        expect(veils.length).to.equal(1);
        expect(veils[0]!.attr("pointer-events")).to.equal("none");
    });

    it("omits veil when veiled is false or omitted", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(
            {
                ...veiledStashRep,
                areas: [{ type: "pieces", label: "Stash", pieces: ["A", "A"] }],
            },
            draw,
            baseOptions,
        );
        const piecesArea = draw.findOne("#_pieces0");
        expect(piecesArea).to.not.equal(null);
        if (piecesArea === null) {
            return;
        }
        expect(piecesArea.find(".aprender-pieces-veil").length).to.equal(0);
    });
});
