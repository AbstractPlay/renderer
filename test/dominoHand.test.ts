/* eslint-disable @typescript-eslint/no-require-imports */
import Ajv from "ajv";
import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { dominoClickPayload, buildPiecesAreaRows } from "../src/common/dominoHand";
import { DefaultRenderer } from "../src/renderers/default";
import { IRendererOptionsIn } from "../src/renderers/_base";
import { APRenderRep } from "../src/schemas/schema";
import schema from "../src/schemas/schema.json";

const { createSVGWindow } = require("svgdom");

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    const document = window.document;
    registerWindow(window, document);
    return SVG(document.documentElement) as Svg;
};

const dominoHandData: APRenderRep = {
    board: {
        style: "squares",
        width: 4,
        height: 4,
    },
    legend: {
        DomL35: [
            { name: "piece-square-single", rotate: 90, colour: 1 },
            { name: "tile-04" },
        ],
        DomR35: [
            { name: "piece-square-single", rotate: -90, colour: 2 },
            { name: "tile-06" },
        ],
        DomL22: [
            { name: "piece-square-single", rotate: 90, colour: 3 },
            { name: "tile-03" },
        ],
        DomR22: [
            { name: "piece-square-single", rotate: -90, colour: 4 },
            { name: "tile-03" },
        ],
    },
    pieces: [
        [[], [], [], []],
        [[], [], [], []],
        [[], [], [], []],
        [[], [], [], []],
    ],
    areas: [
        {
            type: "pieces",
            label: "Your hand",
            pieces: [
                { domino: ["DomL35", "DomR35"], id: "t0" },
                { domino: ["DomL22", "DomR22"] },
            ],
        },
    ],
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
    sheets: ["core", "dominoes"],
    colours: ["#c44", "#48c", "#4a4", "#cc4"],
};

describe("domino hand area", () => {
    it("should validate domino tile refs in schema", () => {
        const ajv = new Ajv();
        expect(ajv.validate(schema, dominoHandData)).to.equal(true);
    });

    it("should render both ends of each domino tile in the pieces area", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(dominoHandData, draw, baseOptions);
        const piecesArea = draw.findOne("#_pieces0");
        expect(piecesArea).to.not.equal(null);
        if (piecesArea === null) {
            return;
        }
        const areaSvg = piecesArea.svg();
        expect(areaSvg).to.include('href="#DomL35"');
        expect(areaSvg).to.include('href="#DomR35"');
        expect(areaSvg).to.include('href="#DomL22"');
        expect(areaSvg).to.include('href="#DomR22"');
    });

    it("should wrap domino tiles by board cell width", () => {
        const fourTiles = [
            { domino: ["DomL35", "DomR35"] as [string, string] },
            { domino: ["DomL22", "DomR22"] as [string, string] },
            { domino: ["DomL35", "DomR35"] as [string, string] },
            { domino: ["DomL22", "DomR22"] as [string, string] },
        ];
        expect(buildPiecesAreaRows(fourTiles, 4)).to.deep.equal([[0, 1], [2, 3]]);
        expect(buildPiecesAreaRows(fourTiles, 2)).to.deep.equal([[0], [1], [2], [3]]);
    });

    it("should build legend-key click payloads for each domino end", () => {
        expect(dominoClickPayload("t0", "DomL35", "DomR35", "L")).to.equal("_domino_t0_DomL35_DomR35_L");
        expect(dominoClickPayload("t0", "DomL35", "DomR35", "R")).to.equal("_domino_t0_DomL35_DomR35_R");
        expect(dominoClickPayload(1, "DomL22", "DomR22", "L")).to.equal("_domino_1_DomL22_DomR22_L");
        expect(dominoClickPayload(1, "DomL22", "DomR22", "R")).to.equal("_domino_1_DomL22_DomR22_R");
    });

    it("should attach domino hit targets in the pieces area", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(dominoHandData, draw, {
            ...baseOptions,
            boardClick: () => undefined,
        });
        const piecesArea = draw.findOne("#_pieces0");
        expect(piecesArea).to.not.equal(null);
        if (piecesArea === null) {
            return;
        }
        const hitTargets = piecesArea.find(".aprender-domino-hit");
        expect(hitTargets.length).to.equal(4);
    });

    it("should render scaled domino legend entries in the hand area", () => {
        const scaledData: APRenderRep = {
            ...dominoHandData,
            legend: {
                DomL35: [
                    { name: "piece-square-single", rotate: 90, colour: 1, scale: 1.25 },
                    { name: "tile-04", scale: 1.25 },
                ],
                DomR35: [
                    { name: "piece-square-single", rotate: -90, colour: 2, scale: 1.25 },
                    { name: "tile-06", scale: 1.25 },
                ],
                DomL22: [
                    { name: "piece-square-single", rotate: 90, colour: 3, scale: 1.25 },
                    { name: "tile-03", scale: 1.25 },
                ],
                DomR22: [
                    { name: "piece-square-single", rotate: -90, colour: 4, scale: 1.25 },
                    { name: "tile-03", scale: 1.25 },
                ],
            },
        };
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        expect(() => renderer.render(scaledData, draw, baseOptions)).to.not.throw();
        const areaSvg = (draw.findOne("#_pieces0") as Svg).svg();
        expect(areaSvg).to.include('href="#DomL35"');
        expect((areaSvg.match(/<svg/g) ?? []).length).to.be.greaterThan(2);
    });
});
