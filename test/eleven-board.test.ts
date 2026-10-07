import { expect } from "chai";
import "mocha";
import Ajv from "ajv";
import { SVG, registerWindow, Svg, Element as SvgElement } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import {
    ELEVEN_BOARD_TOPOLOGY,
    ELEVEN_GRAPH,
    elevenMarkerTarget,
    elevenResolveCell,
} from "../src/common/eleven/index.js";
import {
    ELEVEN_DEFAULT_CONNECTION_BOW,
    ELEVEN_PIECE_DIAMETER_FACTOR,
} from "../src/boards/eleven/resolveOptions.js";
import {
    elevenConnectionsFingerprint,
    elevenConnectionPathBatch,
    elevenConnectionPathD,
    elevenConnectionPathInvadesForeignSpace,
    sortUndirectedEdges,
} from "../src/boards/eleven/connections.js";
import { eleven } from "../src/boards/eleven.js";
import { DefaultRenderer } from "../src/renderers/default.js";
import type { APRenderRep } from "../src/schemas/schema.js";
import schema from "../src/schemas/schema.json" with { type: "json" };

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    registerWindow(window, window.document);
    return SVG(window.document.documentElement) as Svg;
};

const emptyPieces65 = Array.from({ length: 65 }, () => "-").join("");

/** Flood markers use class names `aprender-marker-<uid>`. */
const markerFloodCircles = (root: SvgElement | undefined): SvgElement[] => {
    if (root === undefined) {
        return [];
    }
    return root.find("circle").filter((c) =>
        String(c.attr("class") ?? "").includes("aprender-marker"),
    );
};

describe("eleven board renderer", () => {
    it("validates board.eleven schema keys", () => {
        const ajv = new Ajv({ allErrors: true, strict: false });
        const validate = ajv.compile(schema);
        const ok: APRenderRep = {
            board: {
                style: "eleven",
                strokeWeight: 3,
                eleven: { shootDashed: false, pieceScale: 1.1 },
            },
            legend: {},
            pieces: emptyPieces65,
        };
        expect(validate(ok)).to.equal(true);
        const bad: APRenderRep = {
            board: {
                style: "eleven",
                eleven: { unknownKey: true } as APRenderRep["board"],
            },
            legend: {},
            pieces: emptyPieces65,
        };
        expect(validate(bad)).to.equal(false);
    });

    it("resolves cells by index and pitch id", () => {
        const byIndex = elevenResolveCell(ELEVEN_GRAPH, 0);
        expect(byIndex.row).to.equal(0);
        expect(byIndex.col).to.equal(0);
        expect(elevenResolveCell(ELEVEN_GRAPH, 15).col).to.equal(15);
        expect(byIndex.x).to.equal(ELEVEN_BOARD_TOPOLOGY.spaces[0].x);
        expect(byIndex.y).to.equal(ELEVEN_BOARD_TOPOLOGY.spaces[0].y);

        const center = elevenResolveCell(ELEVEN_GRAPH, "C");
        expect(center.pitchId).to.equal("C");
        const wgRow = ELEVEN_GRAPH.indexByPitchId.get("WG");
        expect(wgRow).to.be.a("number");
        expect(elevenMarkerTarget(ELEVEN_GRAPH, "WG")).to.deep.equal({ row: 0, col: wgRow! });
    });

    it("builds circle polys and oversized cellsize", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        const json: APRenderRep = {
            board: { style: "eleven", strokeWeight: 3 },
            legend: {},
            pieces: emptyPieces65,
        };
        renderer.render(json, draw, {
            contextGlobal: true,
            coloursGlobal: false,
            showAnnotations: false,
            sheets: ["core"],
        });
        const boardSvg = draw.findOne("#board")?.svg() ?? "";
        expect(boardSvg).to.include('stroke-dasharray="9 18"');
        const radii = ELEVEN_BOARD_TOPOLOGY.spaces.map((s) => s.r);
        const medianR = radii.sort((a, b) => a - b)[Math.floor(radii.length / 2)]!;
        expect(renderer.cellsize).to.be.greaterThan(medianR * 2 * 2);
    });

    it("returns grid aligned with elevenResolveCell", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.json = { board: { style: "eleven" }, legend: {}, pieces: emptyPieces65 };
        renderer.rootSvg = draw.group();
        const { grid, polys } = eleven(renderer);
        for (let i = 0; i < ELEVEN_BOARD_TOPOLOGY.spaces.length; i++) {
            const cell = elevenResolveCell(ELEVEN_GRAPH, i);
            expect(grid[0][i].x).to.equal(cell.x);
            expect(grid[0][i].y).to.equal(cell.y);
            expect(polys![0][i].type).to.equal("circle");
            expect((polys![0][i] as { r: number }).r).to.equal(ELEVEN_BOARD_TOPOLOGY.spaces[i].r);
        }
    });

    it("renders procedural connection paths (quadratic or chord, not Linien polylines)", () => {
        const d = elevenConnectionPathD(ELEVEN_BOARD_TOPOLOGY, ELEVEN_DEFAULT_CONNECTION_BOW, 0, 5, "move");
        expect(d).to.match(/^M [\d.]+ [\d.]+ (Q|L) /);
        expect(d.split(" L ").length).to.be.at.most(2);
    });

    it("keeps procedural connections out of unrelated Felder discs", () => {
        const clearance = 1.5;
        const moveDs = elevenConnectionPathBatch(
            ELEVEN_BOARD_TOPOLOGY,
            ELEVEN_DEFAULT_CONNECTION_BOW,
            ELEVEN_BOARD_TOPOLOGY.moveEdges,
            "move",
        );
        const shootDs = elevenConnectionPathBatch(
            ELEVEN_BOARD_TOPOLOGY,
            ELEVEN_DEFAULT_CONNECTION_BOW,
            ELEVEN_BOARD_TOPOLOGY.shootEdges,
            "shoot",
        );
        const assertNoInvasion = (ds: string[], edges: [number, number][]) => {
            expect(ds.length).to.equal(edges.length);
            for (let i = 0; i < edges.length; i++) {
                const [a, b] = edges[i];
                const lo = a < b ? a : b;
                const hi = a < b ? b : a;
                expect(
                    elevenConnectionPathInvadesForeignSpace(
                        ELEVEN_BOARD_TOPOLOGY,
                        lo,
                        hi,
                        ds[i],
                        clearance,
                    ),
                ).to.equal(false);
            }
        };
        assertNoInvasion(moveDs, sortUndirectedEdges(ELEVEN_BOARD_TOPOLOGY.moveEdges));
        assertNoInvasion(shootDs, sortUndirectedEdges(ELEVEN_BOARD_TOPOLOGY.shootEdges));
    });

    it("produces deterministic connection paths for committed topology", () => {
        const fp = elevenConnectionsFingerprint(ELEVEN_BOARD_TOPOLOGY);
        expect(fp.length).to.be.greaterThan(100);
        expect(fp).to.equal(elevenConnectionsFingerprint(ELEVEN_BOARD_TOPOLOGY));
        expect(fp.split("|").length).to.equal(
            ELEVEN_BOARD_TOPOLOGY.moveEdges.length + ELEVEN_BOARD_TOPOLOGY.shootEdges.length,
        );
    });

    it("draws flood markers above Felder fills on the markers layer", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        const json: APRenderRep = {
            board: {
                style: "eleven",
                markers: [
                    {
                        type: "flood",
                        points: [{ row: 0, col: 15 }],
                        colour: 1,
                    },
                ],
            },
            legend: {},
            pieces: emptyPieces65,
        };
        renderer.render(json, draw, {
            contextGlobal: true,
            coloursGlobal: false,
            showAnnotations: false,
            sheets: ["core"],
        });
        const markersLayer = draw.findOne("#gridlines-markers");
        expect(markersLayer).to.not.equal(undefined);
        const floodInMarkers = markerFloodCircles(markersLayer!);
        expect(floodInMarkers.length).to.be.greaterThan(0);
        const belowLayer = draw.findOne("#gridlines-below");
        expect(markerFloodCircles(belowLayer).length).to.equal(0);
    });

    it("sizes flood markers to Felder radius not piece cellsize", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        const json: APRenderRep = {
            board: {
                style: "eleven",
                markers: [
                    {
                        type: "flood",
                        points: [{ row: 0, col: 10 }],
                        colour: 1,
                    },
                ],
            },
            legend: {},
            pieces: emptyPieces65,
        };
        renderer.render(json, draw, {
            contextGlobal: true,
            coloursGlobal: false,
            showAnnotations: false,
            sheets: ["core"],
        });
        const space = ELEVEN_BOARD_TOPOLOGY.spaces[10]!;
        const r = space.r;
        let markerR: number | undefined;
        for (const c of draw.find("circle")) {
            if (!String(c.attr("class") ?? "").includes("aprender-marker")) {
                continue;
            }
            const cx = Number(c.attr("cx"));
            const cy = Number(c.attr("cy"));
            if (Math.hypot(cx - space.x, cy - space.y) > 1) {
                continue;
            }
            markerR = Number(c.attr("r"));
            break;
        }
        expect(markerR).to.be.a("number");
        expect(markerR!).to.be.lessThan(renderer.cellsize * 0.5);
        expect(markerR!).to.be.at.least(r * 0.9);
        expect(renderer.cellsize).to.be.greaterThan(r * 2 * ELEVEN_PIECE_DIAMETER_FACTOR * 0.9);
    });
});
