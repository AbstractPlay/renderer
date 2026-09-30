import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { buildLocalStashRows } from "../src/common/localStashArea.js";
import { DefaultRenderer } from "../src/renderers/default.js";
import { IRendererOptionsIn } from "../src/renderers/_base.js";
import { APRenderRep } from "../src/schemas/schema.js";

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    const document = window.document;
    registerWindow(window, document);
    return SVG(document.documentElement) as Svg;
};

const renderOptions: IRendererOptionsIn = {
    colours: ["#c00", "#00c"],
    colourContext: {
        background: "#fff",
        strokes: "#000",
        borders: "#000",
        labels: "#000",
        annotations: "#f00",
        fill: "#eee",
    },
    showAnnotations: false,
};

describe("localStash area", () => {
    it("buildLocalStashRows wraps at board cell width", () => {
        expect(buildLocalStashRows(10, 4)).to.deep.equal([
            [0, 1, 2, 3],
            [4, 5, 6, 7],
            [8, 9],
        ]);
    });

    it("default renderer places wrapped localStash below the board", () => {
        const stacks: string[][] = [];
        for (let i = 0; i < 10; i++) {
            stacks.push([`P${i}`]);
        }
        const legend: APRenderRep["legend"] = {};
        for (let i = 0; i < 10; i++) {
            legend[`P${i}`] = { name: "piece", colour: 1 };
        }
        const data: APRenderRep = {
            board: { style: "squares", width: 4, height: 4 },
            legend,
            pieces: [
                [[], [], [], []],
                [[], [], [], []],
                [[], [], [], []],
                [[], [], [], []],
            ],
            areas: [
                {
                    type: "localStash",
                    label: "Pool",
                    stash: stacks,
                },
            ],
        };
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(data, draw, renderOptions);
        const area = draw.findOne("#_localStash0");
        expect(area).to.not.equal(null);
        if (area === null) {
            return;
        }
        const uses = area.find("use");
        expect(uses.length).to.equal(10);
        const ys = uses.map((node) => Math.round((node.cy() as number) ?? 0));
        expect(new Set(ys).size).to.be.at.least(2);
    });
});
