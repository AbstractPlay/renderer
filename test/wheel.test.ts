import { expect } from "chai";
import "mocha";
import { Element as SVGElement, SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import {
    annularSectorCentroidRadius,
    wheelGridBoth,
    wheelGridSpaces,
    wheelGridVertices,
    wheelPolys,
    resolveWheelArgs,
} from "../src/grids/wheel.js";
import { StackingOffsetRenderer } from "../src/renderers/stackingOffset";
import { IRendererOptionsIn } from "../src/renderers/_base";
import { APRenderRep } from "../src/schemas/schema";

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    const document = window.document;
    registerWindow(window, document);
    return SVG(document.documentElement) as Svg;
};

function polyArea(points: {x: number; y: number}[]): number {
    let sum = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        sum += points[i].x * points[j].y - points[j].x * points[i].y;
    }
    return Math.abs(sum) / 2;
}

const baseOptions: IRendererOptionsIn = {
    contextGlobal: true,
    coloursGlobal: false,
    showAnnotations: false,
    sheets: ["core"],
};

describe("wheel grid", () => {
    const args = {gridHeight: 4, gridWidth: 8, cellSize: 50};

    it("spaces grid has one row per ring", () => {
        const grid = wheelGridSpaces(args);
        expect(grid.length).to.equal(4);
        expect(grid[0].length).to.equal(8);
    });

    it("vertices grid has one row per ring radius", () => {
        const grid = wheelGridVertices(args);
        expect(grid.length).to.equal(5);
        expect(grid[0].length).to.equal(8);
    });

    it("both grid interlaces rows and includes centre when inner radius is 0", () => {
        const grid = wheelGridBoth(args);
        expect(grid.length).to.equal(9);
        expect(grid[8].length).to.equal(1);
        expect(grid[8][0].x).to.equal(0);
        expect(grid[8][0].y).to.equal(0);
    });

    it("both grid omits centre row when circular-inner is set", () => {
        const grid = wheelGridBoth({...args, innerRadius: 1});
        expect(grid.length).to.equal(8);
    });

    it("circular-inner makes inner and outer sector areas more equal", () => {
        const noHole = wheelPolys(args);
        const withHole = wheelPolys({...args, innerRadius: 2});
        const outerArea = polyArea(noHole[0][0].points);
        const innerNoHole = polyArea(noHole[3][0].points);
        const innerWithHole = polyArea(withHole[3][0].points);
        const ratioNoHole = innerNoHole / outerArea;
        const ratioWithHole = innerWithHole / outerArea;
        expect(ratioWithHole).to.be.greaterThan(ratioNoHole);
        expect(ratioWithHole).to.be.lessThan(1);
    });

    it("space grid uses annular sector centroids between inner and outer radii", () => {
        const annular = {gridHeight: 4, gridWidth: 24, cellSize: 50, innerRadius: 2};
        const grid = wheelGridSpaces(annular);
        const {dists} = resolveWheelArgs(annular);
        const rInner = dists[3];
        const rOuter = dists[4];
        const expectedR = annularSectorCentroidRadius(rInner, rOuter);
        for (let col = 0; col < 24; col++) {
            const pt = grid[0][col];
            const r = Math.hypot(pt.x, pt.y);
            expect(r).to.be.closeTo(expectedR, 0.01);
            expect(r).to.be.greaterThan(rInner);
            expect(r).to.be.lessThan(rOuter);
        }
    });
});

describe("wheel board render", () => {
    it("renders checkered spaces with alternating fill opacities", () => {
        const draw = makeDraw();
        const renderer = new StackingOffsetRenderer();
        const json: APRenderRep = {
            renderer: "stacking-offset",
            board: {
                style: "circular-wheel-spaces-checkered",
                width: 8,
                height: 4,
            },
            legend: {P: {name: "piece", colour: 1}},
            pieces: "-,-,-,-,-,-,-,-\n-,-,-,-,-,-,-,-\n-,-,-,-,-,-,-,-\n-,-,-,-,-,-,-,-",
        };
        renderer.render(json, draw, baseOptions);

        const fillLayer = draw.findOne("#gridlines-fill") as SVGElement;
        expect(fillLayer).to.not.equal(null);
        const fills = fillLayer.children();
        const opacities = fills.map((child) => {
            const fill = child.attr("fill");
            if (typeof fill === "object" && fill !== null && "opacity" in fill) {
                return Number(fill.opacity);
            }
            return Number(child.attr("fill-opacity"));
        });
        const unique = [...new Set(opacities)];
        expect(unique.length).to.be.greaterThan(1);
    });

    it("renders numeric column labels when swap-labels is set", () => {
        const draw = makeDraw();
        const renderer = new StackingOffsetRenderer();
        const json: APRenderRep = {
            renderer: "stacking-offset",
            options: ["swap-labels"],
            board: {
                style: "circular-wheel-spaces",
                width: 4,
                height: 2,
            },
            legend: {P: {name: "piece", colour: 1}},
            pieces: "-,-,-,-\n-,-,-,-",
        };
        renderer.render(json, draw, baseOptions);

        const labels = draw.findOne("#labels") as SVGElement;
        expect(labels).to.not.equal(null);
        const texts = labels.children().map((t) => t.text());
        expect(texts).to.deep.equal(["1", "2", "3", "4"]);
    });

    it("renders custom column labels", () => {
        const draw = makeDraw();
        const renderer = new StackingOffsetRenderer();
        const json: APRenderRep = {
            renderer: "stacking-offset",
            board: {
                style: "circular-wheel-spaces",
                width: 4,
                height: 2,
                columnLabels: ["N", "E", "S", "W"],
            },
            legend: {P: {name: "piece", colour: 1}},
            pieces: "-,-,-,-\n-,-,-,-",
        };
        renderer.render(json, draw, baseOptions);

        const labels = draw.findOne("#labels") as SVGElement;
        expect(labels).to.not.equal(null);
        const texts = labels.children().map((t) => t.text());
        expect(texts).to.deep.equal(["N", "E", "S", "W"]);
    });

    it("skips fill for blocked space cells", () => {
        const draw = makeDraw();
        const renderer = new StackingOffsetRenderer();
        const unblocked: APRenderRep = {
            renderer: "stacking-offset",
            board: {
                style: "circular-wheel-spaces",
                width: 4,
                height: 2,
            },
            legend: {P: {name: "piece", colour: 1}},
            pieces: "-,-,-,-\n-,-,-,-",
        };
        const blocked: APRenderRep = {
            ...unblocked,
            board: {
                style: "circular-wheel-spaces",
                width: 4,
                height: 2,
                blocked: [{row: 0, col: 1}],
            },
        };
        renderer.render(unblocked, draw, baseOptions);
        const fillCountAll = (draw.findOne("#gridlines-fill") as SVGElement).children().length;

        const draw2 = makeDraw();
        renderer.render(blocked, draw2, baseOptions);
        const fillCountBlocked = (draw2.findOne("#gridlines-fill") as SVGElement).children().length;
        expect(fillCountBlocked).to.equal(fillCountAll - 1);
    });

    it("draws backFill on spaces board", () => {
        const draw = makeDraw();
        const renderer = new StackingOffsetRenderer();
        const json: APRenderRep = {
            renderer: "stacking-offset",
            board: {
                style: "circular-wheel-spaces",
                width: 8,
                height: 4,
            },
            legend: {P: {name: "piece", colour: 1}},
            pieces: "-,-,-,-,-,-,-,-\n-,-,-,-,-,-,-,-\n-,-,-,-,-,-,-,-\n-,-,-,-,-,-,-,-",
        };
        renderer.render(json, draw, baseOptions);
        const fillLayer = draw.findOne("#gridlines-fill") as SVGElement;
        expect(fillLayer).to.not.equal(null);
        expect(fillLayer.children().length).to.equal(32);
    });
});

describe("wheel vertices grid", () => {
    it("has height + 1 rows for small boards", () => {
        const grid = wheelGridVertices({gridHeight: 2, gridWidth: 4, cellSize: 50});
        expect(grid.length).to.equal(3);
        expect(grid[0].length).to.equal(4);
    });
});
