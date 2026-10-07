import Ajv from "ajv";
import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { areaTitleBand, measureAreaTitle } from "../src/common/areaLabelText.js";
import { dominoClickPayload, buildPiecesAreaRows, piecesAreaCaptionCenterYFromSlotTop, piecesAreaCaptionTextYFromSlotTop, piecesAreaLegendKey, piecesAreaPieceCenterYFromSlotTop, shouldRotateAreaPieces } from "../src/common/dominoHand";
import { DefaultRenderer } from "../src/renderers/default";
import { IRendererOptionsIn } from "../src/renderers/_base";
import { APRenderRep, AreaPieces } from "../src/schemas/schema";
import schema from "../src/schemas/schema.json" with { type: "json" };
import { createSVGWindow } from "svgdom";


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

const labeledPiecesAreaData: APRenderRep = {
    board: {
        style: "squares",
        width: 3,
        height: 3,
    },
    legend: {
        A: { name: "piece", colour: 1 },
        B: { name: "piece", colour: 2 },
    },
    pieces: [
        [[], [], []],
        [[], [], []],
        [[], [], []],
    ],
    areas: [
        {
            type: "pieces",
            label: "Hand",
            pieces: [
                { piece: "A", text: "1", textPosition: "below" },
                { piece: "B", text: "2", textPosition: "above" },
            ],
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

    it("should validate labeled piece entries and domino captions in schema", () => {
        const ajv = new Ajv();
        expect(ajv.validate(schema, labeledPiecesAreaData)).to.equal(true);
        expect(ajv.validate(schema, {
            ...dominoHandData,
            areas: [{
                ...dominoHandData.areas![0],
                pieces: [{ domino: ["DomL35", "DomR35"], text: "D", textPosition: "above" }],
            }],
        })).to.equal(true);
    });

    it("should resolve legend keys for labeled piece entries", () => {
        expect(piecesAreaLegendKey("A")).to.equal("A");
        expect(piecesAreaLegendKey({ piece: "mMF", text: "1" })).to.equal("mMF");
    });

    it("should place above captions higher than the piece centre in layout helpers", () => {
        const boardCellsize = 40;
        const ordinaryCellsize = boardCellsize * 0.75;
        const slotTop = 20;
        const entry = { piece: "B", text: "2", textPosition: "above" as const };
        const pieceY = piecesAreaPieceCenterYFromSlotTop(slotTop, entry, ordinaryCellsize, boardCellsize);
        const captionY = piecesAreaCaptionCenterYFromSlotTop(slotTop, entry, ordinaryCellsize, boardCellsize)!;
        expect(captionY).to.be.lessThan(pieceY);
    });

    it("should anchor below captions under the piece body with a gap", () => {
        const boardCellsize = 40;
        const ordinaryCellsize = boardCellsize * 0.75;
        const slotTop = 30;
        const entry = { piece: "A", text: "1", textPosition: "below" as const };
        const anchorY = piecesAreaCaptionTextYFromSlotTop(slotTop, entry, ordinaryCellsize, boardCellsize)!;
        const pieceCenter = piecesAreaPieceCenterYFromSlotTop(slotTop, entry, ordinaryCellsize, boardCellsize);
        expect(anchorY).to.be.greaterThan(pieceCenter);
    });

    it("should render entry captions above or below hand pieces", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(labeledPiecesAreaData, draw, baseOptions);
        const boardCellsize = renderer.cellsize;
        const ordinaryCellsize = boardCellsize * 0.75;
        const textHeight = boardCellsize / 3;
        const titleBand = areaTitleBand(
            measureAreaTitle(draw, "Hand", textHeight, baseOptions.colourContext!.labels as string).height,
            textHeight,
        );
        const piecesArea = draw.findOne("#_pieces0");
        expect(piecesArea).to.not.equal(null);
        if (piecesArea === null) {
            return;
        }
        const labels = piecesArea.find(".aprender-pieces-entry-label");
        expect(labels.length).to.equal(2);
        const uses = piecesArea.find("use");
        expect(uses.length).to.equal(2);
        const handUses: Svg[] = [];
        uses.forEach((node) => {
            handUses.push(node as Svg);
        });
        handUses.sort((a, b) => a.x() - b.x());
        const useA = handUses[0]!;
        const useB = handUses[1]!;
        let labelBelowCy: number | undefined;
        let labelAboveCy: number | undefined;
        let labelBelowX: number | undefined;
        let labelAboveX: number | undefined;
        let labelBelow: Svg | undefined;
        labels.forEach((node) => {
            const t = node.text();
            if (t === "1") {
                labelBelow = node as Svg;
                labelBelowCy = node.bbox().cy;
                labelBelowX = Number(node.attr("x"));
            } else if (t === "2") {
                labelAboveCy = node.bbox().cy;
                labelAboveX = Number(node.attr("x"));
            }
        });
        expect(labelBelowCy).to.not.equal(undefined);
        expect(labelAboveCy).to.not.equal(undefined);
        expect(labelBelowX).to.not.equal(undefined);
        expect(labelAboveX).to.not.equal(undefined);
        expect(labelBelowCy!).to.be.greaterThan(useA.bbox().cy);
        expect(labelAboveCy!).to.be.lessThan(useB.bbox().cy);
        expect(labelBelow).to.not.equal(undefined);
        expect(labelBelow!.attr("dominant-baseline")).to.equal(undefined);
        const belowEntry = { piece: "A", text: "1", textPosition: "below" as const };
        const expectedBelowInkTop = piecesAreaCaptionTextYFromSlotTop(
            titleBand,
            belowEntry,
            ordinaryCellsize,
            boardCellsize,
        )!;
        expect(labelBelow!.bbox().y).to.be.closeTo(expectedBelowInkTop, 1);
        const areaTitle = piecesArea.findOne(".aprender-area-label");
        expect(areaTitle).to.not.equal(null);
        if (areaTitle !== null) {
            expect(areaTitle.attr("dominant-baseline")).to.equal(undefined);
            expect(areaTitle.bbox().y2).to.be.at.most(titleBand + 0.5);
        }
        // Same slot spacing as hand uses; caption x is pieceCenterX (amove), use x is pieceCenterX - halfSize.
        expect(labelAboveX! - labelBelowX!).to.be.closeTo(useB.x() - useA.x(), 0.5);
        expect(labelBelowX! - useA.x()).to.be.closeTo(labelAboveX! - useB.x(), 0.5);
    });
});
