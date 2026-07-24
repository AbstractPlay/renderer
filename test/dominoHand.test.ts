/* eslint-disable @typescript-eslint/no-require-imports */
import Ajv from "ajv";
import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { dominoClickPayload, buildPiecesAreaRows, shouldRotateAreaPieces } from "../src/common/dominoHand";
import { DefaultRenderer } from "../src/renderers/default";
import { IRendererOptionsIn } from "../src/renderers/_base";
import { APRenderRep, AreaPieces } from "../src/schemas/schema";
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

const directionalAreaData: APRenderRep = {
    board: {
        style: "squares",
        width: 4,
        height: 4,
    },
    legend: {
        mMF: { text: "↑", colour: "_context_labels" },
        mFL: { text: "↖", colour: "_context_labels" },
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
            label: "Orders",
            pieces: ["mMF", "mFL"],
        },
    ],
};

const matrixFromTransform = (transform: string | undefined): number[] | null => {
    if (transform === undefined) {
        return null;
    }
    const m = transform.match(/matrix\(([^)]+)\)/);
    if (m === null) {
        return null;
    }
    const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
    if (parts.length < 4 || parts.some((n) => !Number.isFinite(n))) {
        return null;
    }
    return parts;
};

const matrixBFromTransform = (transform: string | undefined): number | null => {
    const parts = matrixFromTransform(transform);
    return parts === null ? null : parts[1];
};

const isNinetyDegreeRotation = (transform: string | undefined): boolean => {
    const parts = matrixFromTransform(transform);
    if (parts === null) {
        return false;
    }
    const [a, b, c, d] = parts;
    return Math.abs(a) < 0.01 && Math.abs(d) < 0.01 && Math.abs(b) > 0.01 && Math.abs(c) > 0.01;
};

const piecesAreaTileTransforms = (draw: Svg): number[] => {
    const piecesArea = draw.findOne("#_pieces0");
    if (piecesArea === null) {
        return [];
    }
    const transforms: number[] = [];
    piecesArea.find("svg").forEach((node) => {
        const b = matrixBFromTransform(node.attr("transform") as string | undefined);
        if (b !== null) {
            transforms.push(b);
        }
    });
    return transforms;
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

    it("should resolve rotateWithBoard defaults for domino and string-key areas", () => {
        expect(shouldRotateAreaPieces(dominoHandData.areas![0] as AreaPieces)).to.equal(false);
        expect(shouldRotateAreaPieces(directionalAreaData.areas![0] as AreaPieces)).to.equal(true);
        expect(shouldRotateAreaPieces({ ...dominoHandData.areas![0], rotateWithBoard: true } as AreaPieces)).to.equal(true);
        expect(shouldRotateAreaPieces({ ...directionalAreaData.areas![0], rotateWithBoard: false } as AreaPieces)).to.equal(false);
    });

    it("should validate rotateWithBoard in schema", () => {
        const ajv = new Ajv();
        expect(ajv.validate(schema, {
            ...dominoHandData,
            areas: [{ ...dominoHandData.areas![0], rotateWithBoard: false }],
        })).to.equal(true);
    });

    it("should not rotate domino tiles in the hand area when the board is rotated", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(dominoHandData, draw, { ...baseOptions, rotate: 90 });
        const tileRotations = piecesAreaTileTransforms(draw);
        expect(tileRotations.length).to.equal(0);
    });

    it("should rotate domino tiles when rotateWithBoard is explicitly true", () => {
        const dominoArea = dominoHandData.areas![0] as AreaPieces;
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render({
            ...dominoHandData,
            areas: [{ ...dominoArea, rotateWithBoard: true }],
        }, draw, { ...baseOptions, rotate: 90 });
        const tileRotations = piecesAreaTileTransforms(draw);
        expect(tileRotations.length).to.be.greaterThan(0);
        tileRotations.forEach((b) => {
            expect(b).to.be.closeTo(1, 0.01);
        });
    });

    it("should rotate string-key hand pieces when the board is rotated", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(directionalAreaData, draw, { ...baseOptions, rotate: 90 });
        const piecesArea = draw.findOne("#_pieces0");
        expect(piecesArea).to.not.equal(null);
        if (piecesArea === null) {
            return;
        }
        let rotatedUses = 0;
        piecesArea.find("use").forEach((node) => {
            if (isNinetyDegreeRotation(node.attr("transform") as string | undefined)) {
                rotatedUses += 1;
            }
        });
        expect(rotatedUses).to.be.greaterThan(0);
    });
});
