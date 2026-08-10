/* eslint-disable @typescript-eslint/no-require-imports */
import Ajv from "ajv";
import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg, G as SVGG, Element as SVGElement } from "@svgdotjs/svg.js";
import { DefaultRenderer } from "../src/renderers/default";
import { IRendererOptionsIn } from "../src/renderers/_base";
import { APRenderRep } from "../src/schemas/schema";
import { computePlayfieldMetrics } from "../src/references/helpers";

const schema = require("../src/schemas/schema.json");
const { createSVGWindow } = require("svgdom");

const CELL_SIZE = 50;

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    const document = window.document;
    registerWindow(window, document);
    return SVG(document.documentElement) as Svg;
};

const baseOptions: IRendererOptionsIn = {
    contextGlobal: true,
    coloursGlobal: false,
    showAnnotations: true,
    sheets: ["core"],
};

const emptyBoard8 = "--------\n--------\n--------\n--------\n--------\n--------\n--------\n--------";

const scoreTrackFixture: APRenderRep = {
    board: { style: "squares", width: 8, height: 8 },
    legend: {
        M: { name: "piece", colour: 1 },
        S: { name: "piece", colour: 2 },
    },
    pieces: emptyBoard8,
    areas: [
        {
            type: "track",
            position: "top",
            board: { style: "squares", width: 12, height: 1, strokeColour: "#ccc" },
            pieces: "MMSS----MMMM",
            annotations: [{ type: "dots", targets: [{ row: 0, col: 4 }] }],
        },
    ],
};

const checkeredTopTrackFixture: APRenderRep = {
    board: { style: "squares-checkered", width: 8, height: 8 },
    legend: {
        A: { name: "piece", colour: 1 },
        B: { name: "piece", colour: 2 },
    },
    pieces: null,
    areas: [
        {
            type: "track",
            position: "top",
            board: { style: "squares", width: 12, height: 1 },
            pieces: "AABB----AAAA",
            annotations: [{ type: "dots", targets: [{ row: 0, col: 4 }] }],
        },
    ],
};

const checkeredLeftTrackFixture: APRenderRep = {
    board: { style: "squares-checkered", width: 8, height: 8 },
    legend: {
        A: { name: "piece", colour: 1 },
        B: { name: "piece", colour: 2 },
    },
    pieces: null,
    areas: [
        {
            type: "track",
            position: "left",
            board: { style: "squares", width: 1, height: 12 },
            pieces: "AABB----AAAA",
            annotations: [{ type: "dots", targets: [{ row: 4, col: 0 }] }],
        },
    ],
};

const dualBottomTracksFixture: APRenderRep = {
    board: { style: "squares", width: 4, height: 4 },
    legend: {
        M: { name: "piece", colour: 1 },
    },
    pieces: "----\n----\n----\n----",
    areas: [
        {
            type: "track",
            position: "bottom",
            board: { style: "squares", width: 6, height: 1 },
            pieces: "MMMM--",
        },
        {
            type: "track",
            position: "bottom",
            board: { style: "squares", width: 4, height: 1 },
            pieces: "MM--",
        },
    ],
};

const findTrackUse = (draw: Svg): SVGElement => {
    const uses = draw.find('[href*="_track_"]') as unknown as SVGElement[];
    expect(uses.length).to.be.greaterThan(0);
    return uses[0];
};

const render = (json: APRenderRep, opts?: Partial<IRendererOptionsIn>): Svg => {
    const draw = makeDraw();
    const renderer = new DefaultRenderer();
    renderer.render(json, draw, { ...baseOptions, ...opts });
    return draw;
};

describe("track area", () => {
    const ajv = new Ajv({ strict: false });
    const validate = ajv.compile(schema);

    it("validates track area in schema", () => {
        expect(validate(scoreTrackFixture)).to.equal(true);
    });

    it("places track outside the main #board group", () => {
        const draw = render(scoreTrackFixture);
        const board = draw.findOne("#board") as SVGG | null;
        expect(board).to.not.equal(null);
        const trackDef = draw.findOne("#_track_0") as Svg | null;
        expect(trackDef).to.not.equal(null);
        expect(board!.findOne("#_track_0")).to.equal(null);
        const tableau = draw.findOne("#board-tableau") as SVGG | null;
        expect(tableau).to.not.equal(null);
        expect(tableau!.findOne('[href="#_track_0"], [href*="_track_0"]')).to.not.equal(null);
    });

    it("places pieces on the track grid", () => {
        const draw = render(scoreTrackFixture);
        const trackBoard = draw.findOne("#_track_0 #board") as SVGG | null;
        expect(trackBoard).to.not.equal(null);
        const trackPieces = trackBoard!.findOne("#pieces") as SVGG | null;
        expect(trackPieces).to.not.equal(null);
        expect(trackPieces!.children().length).to.be.greaterThan(0);
    });

    it("renders scoped annotations with pointer-events disabled", () => {
        const draw = render(scoreTrackFixture);
        const trackBoard = draw.findOne("#_track_0 #board") as SVGG | null;
        const annotations = trackBoard!.findOne("#annotations") as SVGG | null;
        expect(annotations).to.not.equal(null);
        const annotationEls = annotations!.find("*");
        let hasPointerEventsNone = false;
        annotationEls.each((el: SVGElement) => {
            const pe = el.attr("pointer-events");
            if (pe === "none" || (Array.isArray(pe) && pe.includes("none"))) {
                hasPointerEventsNone = true;
            }
        });
        expect(hasPointerEventsNone).to.equal(true);
    });

    it("stacks bottom tracks in declaration order", () => {
        const draw = render(dualBottomTracksFixture);
        const uses = draw.find('[href*="_track_"]') as unknown as SVGElement[];
        expect(uses.length).to.equal(2);
        const y0 = Number(uses[0].attr("y") ?? 0);
        const y1 = Number(uses[1].attr("y") ?? 0);
        expect(y1).to.be.greaterThan(y0);
    });

    it("preserves circular-moon cellsize so pieces are not oversized", () => {
        const moonFixture: APRenderRep = {
            board: { style: "circular-moon", strokeWeight: 0.5 },
            legend: { A: { name: "piece", colour: 1 } },
            pieces: "AAAAA",
        };
        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        renderer.render(moonFixture, draw, baseOptions);
        expect(renderer.cellsize).to.equal(15);
        const uses = draw.find("#board #pieces use") as unknown as SVGElement[];
        expect(uses.length).to.be.greaterThan(0);
        const scale = uses[0].transform().a;
        expect(scale).to.be.closeTo((15 / 500) * 0.85, 0.001);
    });

    it("scales top track to main board width and anchors above playfield", () => {
        const draw = render(checkeredTopTrackFixture);
        const playfield = computePlayfieldMetrics(draw, CELL_SIZE);
        const trackUse = findTrackUse(draw);
        const displayW = trackUse.width() as number;
        const displayH = trackUse.height() as number;
        const x = trackUse.x() as number;
        const y = trackUse.y() as number;
        expect(displayW).to.be.closeTo(8 * CELL_SIZE, 0.5);
        expect(x).to.be.closeTo(playfield.x, 0.5);
        expect(y + displayH).to.be.lessThan(playfield.y);
        const rootBox = draw.bbox();
        expect(rootBox.x2).to.be.at.least(x + displayW);
    });

    it("centers track when display width differs from playfield width", () => {
        const json: APRenderRep = {
            ...checkeredTopTrackFixture,
            areas: [
                {
                    type: "track",
                    position: "top",
                    width: 6,
                    board: { style: "squares", width: 12, height: 1 },
                    pieces: "AABB----AAAA",
                },
            ],
        };
        const draw = render(json);
        const playfield = computePlayfieldMetrics(draw, CELL_SIZE);
        const trackUse = findTrackUse(draw);
        const displayW = trackUse.width() as number;
        const x = trackUse.x() as number;
        expect(displayW).to.be.closeTo(6 * CELL_SIZE, 0.5);
        expect(x).to.be.closeTo(playfield.x + (playfield.width - displayW) / 2, 0.5);
    });

    it("scales left track to main board height and anchors beside playfield", () => {
        const draw = render(checkeredLeftTrackFixture);
        const playfield = computePlayfieldMetrics(draw, CELL_SIZE);
        const trackDef = draw.findOne("#_track_0") as Svg | null;
        expect(trackDef).to.not.equal(null);
        const naturalW = trackDef!.viewbox().w;
        const naturalH = trackDef!.viewbox().h;
        const trackUse = findTrackUse(draw);
        const displayW = trackUse.width() as number;
        const displayH = trackUse.height() as number;
        const x = trackUse.x() as number;
        const y = trackUse.y() as number;
        const targetHeight = 8 * CELL_SIZE;
        expect(displayH).to.be.closeTo(targetHeight, 0.5);
        expect(displayW).to.be.closeTo(naturalW * (targetHeight / naturalH), 0.5);
        expect(y).to.be.closeTo(playfield.y, 0.5);
        expect(x + displayW).to.be.lessThan(playfield.x);
    });

    it("centers left track vertically when display height differs from playfield height", () => {
        const json: APRenderRep = {
            ...checkeredLeftTrackFixture,
            areas: [
                {
                    type: "track",
                    position: "left",
                    width: 6,
                    board: { style: "squares", width: 1, height: 12 },
                    pieces: "AABB----AAAA",
                },
            ],
        };
        const draw = render(json);
        const playfield = computePlayfieldMetrics(draw, CELL_SIZE);
        const trackUse = findTrackUse(draw);
        const displayH = trackUse.height() as number;
        const y = trackUse.y() as number;
        expect(displayH).to.be.closeTo(6 * CELL_SIZE, 0.5);
        expect(y).to.be.closeTo(playfield.y + (playfield.height - displayH) / 2, 0.5);
    });
});
