import { expect } from "chai";
import "mocha";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import {
    buildLocalStashRows,
    LOCAL_STASH_STACK_LAYER_OFFSET,
    localStashColumnProfile,
    localStashSilhouetteTier,
    localStashStackSlotLayers,
    localStashStepsAboveBottom,
} from "../src/common/localStashArea.js";
import { DefaultRenderer } from "../src/renderers/default.js";
import { Stacking3DRenderer } from "../src/renderers/stacking3D.js";
import { StackingExpandingRenderer } from "../src/renderers/stackingExpanding.js";
import { IRendererOptionsIn } from "../src/renderers/_base.js";
import { APRenderRep } from "../src/schemas/schema.js";
import { stawvsLocalStashLayoutRep } from "./fixtures/stawvsLocalStashLayout.js";
import { agofmarsLocalStashLayoutRep } from "./fixtures/agofmarsLocalStashLayout.js";
import { volcanoCaptureLocalStashRep } from "./fixtures/volcanoCaptureLocalStash.js";
import { mvolcanoCaptureDenseLocalStashRep } from "./fixtures/mvolcanoCaptureDenseLocalStash.js";
import type { Element as SVGElement } from "@svgdotjs/svg.js";

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    const document = window.document;
    registerWindow(window, document);
    return SVG(document.documentElement) as Svg;
};

const renderOptions: IRendererOptionsIn = {
    contextGlobal: true,
    coloursGlobal: true,
    colourContext: {
        background: "#fff",
        strokes: "#000",
        borders: "#000",
        labels: "#000",
        annotations: "#f00",
        fill: "#eee",
        board: "#ddd",
    },
    showAnnotations: false,
};

const bottomCyByColumn = (uses: SVGElement[], slotCount: number): number[] => {
    const byCol = new Map<number, number>();
    for (const node of uses) {
        const cx = Math.round((node.cx() as number) ?? 0);
        const cy = (node.cy() as number) ?? 0;
        const prev = byCol.get(cx);
        if (prev === undefined || cy > prev) {
            byCol.set(cx, cy);
        }
    }
    expect(byCol.size).to.equal(slotCount);
    return [...byCol.values()];
};

const maxBottomSpread = (bottoms: number[]): number => {
    return Math.max(...bottoms) - Math.min(...bottoms);
};

/** Looney 3D pyramid base offset from use centre (fraction of stash cell). */
const PYRAMID_3D_BASE_DOWN_FRAC: Record<number, number> = { 1: 0, 2: 0.15, 3: 0.3 };

const estimatedSilhouetteBaseY = (
    cy: number,
    key: string,
    stashCell: number,
    legend: APRenderRep["legend"] | undefined,
): number => {
    const tier = localStashSilhouetteTier(legend, key);
    if (tier === undefined) {
        return cy;
    }
    return cy + PYRAMID_3D_BASE_DOWN_FRAC[tier]! * stashCell;
};

const assertSilhouetteBasesAligned = (
    uses: { key: string; cy: number }[],
    stashCell: number,
    legend: APRenderRep["legend"],
    tolerance = 1.5,
): void => {
    const bases = uses.map((u) => estimatedSilhouetteBaseY(u.cy, u.key, stashCell, legend));
    expect(Math.max(...bases) - Math.min(...bases)).to.be.lessThan(tolerance);
};

const stashUses = (area: SVGElement): { key: string; cy: number; cx: number }[] => {
    const out: { key: string; cy: number; cx: number }[] = [];
    for (const node of area.find("use")) {
        const href = (node.attr("href") ?? node.attr("xlink:href") ?? "") as string;
        out.push({
            key: href.replace(/^#/, ""),
            cy: (node.cy() as number) ?? 0,
            cx: Math.round((node.cx() as number) ?? 0),
        });
    }
    return out;
};

const assertStawvsStashLayout = (draw: Svg, cellsize: number): void => {
    const area0 = draw.findOne("#_localStash0");
    const area1 = draw.findOne("#_localStash1");
    expect(area0).to.not.equal(null);
    expect(area1).to.not.equal(null);
    if (area0 === null || area1 === null) {
        return;
    }
    expect(Number(area0.x())).to.equal(Number(area1.x()));

    const stackCol0 = area0.find("use").filter((node) => {
        const cx = Math.round((node.cx() as number) ?? 0);
        return cx === Math.round((area0.find("use")[0]?.cx() as number) ?? 0);
    });
    expect(stackCol0.length).to.equal(3);
    const cyByHref = new Map<string, number>();
    for (const node of stackCol0) {
        const href = (node.attr("href") ?? node.attr("xlink:href") ?? "") as string;
        const id = href.replace(/^#/, "");
        cyByHref.set(id, (node.cy() as number) ?? 0);
    }
    expect(cyByHref.get("OR3c")!).to.be.greaterThan(cyByHref.get("OR2c")!);
    expect(cyByHref.get("OR2c")!).to.be.greaterThan(cyByHref.get("OR1c")!);

    for (const area of [area0, area1]) {
        const bottoms = bottomCyByColumn(area.find("use"), 7);
        expect(maxBottomSpread(bottoms)).to.be.lessThan(2);

        const stashCell = cellsize * 0.75;
        const stackOffset = LOCAL_STASH_STACK_LAYER_OFFSET * stashCell;
        const maxLayers = 2;
        const textHeight = cellsize / 3;
        const rowBandHeight = stashCell + maxLayers * stackOffset;
        const expectedMaxHeight = textHeight + rowBandHeight + 4;
        expect(area.bbox().height).to.be.at.most(expectedMaxHeight);
    }
};

describe("localStash area", () => {
    it("localStashColumnProfile detects silhouette columns from legend glyph names", () => {
        const legend: APRenderRep["legend"] = {
            RD3: { name: "pyramid-up-large-3D", colour: 1 },
            OR3c: { name: "pyramid-flattened-large", colour: 1 },
        };
        expect(localStashColumnProfile(["RD3"], legend)).to.equal("silhouette3D");
        expect(localStashColumnProfile(["OR3c", "OR2c"], legend)).to.equal("solid");
    });

    it("localStashStepsAboveBottom uses bottom-first array indices", () => {
        const stack = ["OR3c", "OR2c", "OR1c"];
        expect(localStashStepsAboveBottom(stack, 0)).to.equal(0);
        expect(localStashStepsAboveBottom(stack, 1)).to.equal(1);
        expect(localStashStepsAboveBottom(stack, 2)).to.equal(2);
        expect(localStashStackSlotLayers(stack)).to.equal(2);
        expect(localStashStackSlotLayers(["RD3"])).to.equal(0);
    });

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

    it("bottom-aligns Stawvs capture columns on default renderer", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(stawvsLocalStashLayoutRep(), draw, renderOptions);
        assertStawvsStashLayout(draw, renderer.cellsize);
    });

    it("bottom-aligns mixed singles and partial stacks in a wrapped agofmars bag row", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(agofmarsLocalStashLayoutRep(), draw, renderOptions);
        const area = draw.findOne("#_localStash0");
        expect(area).to.not.equal(null);
        if (area === null) {
            return;
        }
        const cellsize = renderer.cellsize;
        const stashCell = cellsize * 0.75;
        const silhouetteApexSpan = 0.75 * stashCell;
        const rowBand = stashCell + silhouetteApexSpan;
        const textBand = cellsize / 3;
        const gap = cellsize * 0.2;
        const row1MinY = textBand + rowBand + gap - 2;
        const row1MaxY = textBand + 2 * rowBand + gap + 2;
        const row1Uses = area.find("use").filter((node) => {
            const cy = (node.cy() as number) ?? 0;
            return cy >= row1MinY && cy <= row1MaxY;
        });
        expect(row1Uses.length).to.be.at.least(7);
        const row1Keys: { key: string; cy: number }[] = [];
        for (const node of row1Uses) {
            const href = (node.attr("href") ?? node.attr("xlink:href") ?? "") as string;
            row1Keys.push({ key: href.replace(/^#/, ""), cy: (node.cy() as number) ?? 0 });
        }
        assertSilhouetteBasesAligned(row1Keys, stashCell, agofmarsLocalStashLayoutRep().legend);
    });

    it("uses compact height for dense Volcano capture stacks", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        renderer.render(volcanoCaptureLocalStashRep(), draw, renderOptions);
        const area0 = draw.findOne("#_localStash0");
        expect(area0).to.not.equal(null);
        if (area0 === null) {
            return;
        }
        const cellsize = renderer.cellsize;
        const stashCell = cellsize * 0.75;
        const textHeight = cellsize / 3;
        const rowBandHeight = stashCell + 0.75 * stashCell;
        const expectedMaxHeight = textHeight + rowBandHeight + 4;
        expect(area0.bbox().height).to.be.at.most(expectedMaxHeight);
    });

    it("bottom-aligns dense Volcano 3D capture columns in one row (stacking-3D)", () => {
        const rep = volcanoCaptureLocalStashRep();
        rep.renderer = "stacking-3D";
        rep.board = { style: "squares", width: 6, height: 6 };
        rep.pieces = [
            [[], [], [], [], [], []],
            [[], [], [], [], [], []],
            [[], [], [], [], [], []],
            [[], [], [], [], [], []],
            [[], [], [], [], [], []],
            [[], [], [], [], [], []],
        ];
        rep.areas = [
            {
                type: "localStash",
                label: "Player 1: Captured Pieces",
                stash: [
                    ["GN3", "GN2"],
                    ["RD3"],
                ],
            },
        ];
        rep.legend.GN2 = { name: "pyramid-up-medium-3D", colour: 3 };
        rep.legend.GN3 = { name: "pyramid-up-large-3D", colour: 3 };
        const draw = makeDraw();
        const renderer = new Stacking3DRenderer();
        renderer.render(rep, draw, renderOptions);
        const area = draw.findOne("#_localStash0");
        expect(area).to.not.equal(null);
        if (area === null) {
            return;
        }
        const stashCell = renderer.cellsize * 0.75;
        const uses = stashUses(area);
        const byCol = new Map<number, { key: string; cy: number }[]>();
        for (const u of uses) {
            const col = byCol.get(u.cx) ?? [];
            col.push({ key: u.key, cy: u.cy });
            byCol.set(u.cx, col);
        }
        expect(byCol.size).to.equal(2);
        for (const colUses of byCol.values()) {
            assertSilhouetteBasesAligned(colUses, stashCell, rep.legend!);
        }
        assertSilhouetteBasesAligned(uses, stashCell, rep.legend!);
    });

    it("base-aligns dense Mega-Volcano silhouette capture columns (Phase 2 fixture)", () => {
        const rep = mvolcanoCaptureDenseLocalStashRep();
        const draw = makeDraw();
        const renderer = new Stacking3DRenderer();
        renderer.render(rep, draw, renderOptions);
        const stashCell = renderer.cellsize * 0.75;

        const area0 = draw.findOne("#_localStash0");
        expect(area0).to.not.equal(null);
        if (area0 === null) {
            return;
        }
        const uses0 = stashUses(area0);
        expect(uses0.length).to.equal(4);
        const redCol = uses0.filter((u) => u.key.startsWith("RD"));
        const greenCol = uses0.filter((u) => u.key.startsWith("GN"));
        assertSilhouetteBasesAligned(redCol, stashCell, rep.legend!);
        assertSilhouetteBasesAligned(greenCol, stashCell, rep.legend!);
        expect(greenCol.find((u) => u.key === "GN3")!.cy).to.be.lessThan(
            greenCol.find((u) => u.key === "GN2")!.cy,
        );

        const area1 = draw.findOne("#_localStash1");
        expect(area1).to.not.equal(null);
        if (area1 === null) {
            return;
        }
        const uses1 = stashUses(area1);
        assertSilhouetteBasesAligned(uses1, stashCell, rep.legend!);
    });

    it("localStashSilhouetteTier resolves size from glyph name only", () => {
        const legend: APRenderRep["legend"] = {
            FOO3BAR: { name: "pyramid-up-small-3D", colour: 1 },
            CAP: { name: "pyramid-up-large-3D", colour: 2 },
            MID: { name: "pyramid-up-medium-3D", colour: 3 },
        };
        expect(localStashSilhouetteTier(legend, "FOO3BAR")).to.equal(1);
        expect(localStashSilhouetteTier(legend, "CAP")).to.equal(3);
        expect(localStashSilhouetteTier(legend, "MID")).to.equal(2);
    });

    it("bottom-aligns Stawvs capture columns on stacking-expanding renderer", () => {
        const rep = { ...stawvsLocalStashLayoutRep(), renderer: "stacking-expanding" as const };
        const draw = makeDraw();
        const renderer = new StackingExpandingRenderer();
        renderer.render(rep, draw, renderOptions);
        assertStawvsStashLayout(draw, renderer.cellsize);
    });
});
