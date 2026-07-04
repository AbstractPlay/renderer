/* eslint-disable @typescript-eslint/no-require-imports */
import { expect } from "chai";
import { Matrix } from "transformation-matrix-js";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { deg2rad } from "../src/common/plotting";
import { compareCellSortKeys, compareDrawTaskSortKeys, computeCellSortKey, ISO_SORT_EPSILON } from "../src/renderers/isometric/cellSort";
import { genCube, cubeFacePaintOrder } from "../src/renderers/isometric/cubes";
import { generateCylinders } from "../src/renderers/isometric/cylinders";
import { cylinderSilhouette } from "../src/renderers/isometric/cylinderSilhouette";
import { depthBucketIndex, depthToNormalized, isoDepthModulate } from "../src/renderers/isometric/shading";
import { piecesRowWidth, parseIsoPiecesString } from "../src/renderers/isometric/piecesGrid";
import {
    boardDepthWeight,
    buildIsoProjectionMatrix,
    cabinetPieceVisibility,
    ISO_PROJECTION_PRESETS,
    ISO_STANDARD_ELEVATION_DEG,
    isoLabelTransform,
    mapBoardToScreen,
    projectedCellDepth,
    projectOblique,
    resolveGroundBasis,
    resolveIsoProjection,
} from "../src/renderers/isometric/projection";
import { permuteCubeFaces, permuteCubeFacesForProjection } from "../src/renderers/isometric/cubeOrientation";
import { rectOfRects } from "../src/grids";

const { createSVGWindow } = require("svgdom");

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    const document = window.document;
    registerWindow(window, document);
    return SVG(document.documentElement) as Svg;
};

const buildSymmetricGroundMatrixForTest = (elevationDeg: number): Matrix => {
    const ε = deg2rad(elevationDeg);
    const ε0 = deg2rad(ISO_STANDARD_ELEVATION_DEG);
    const axisAngleDeg = 30 * Math.tan(ε0) / Math.tan(ε);
    const tScale = new Matrix().scaleY(Math.cos(deg2rad(axisAngleDeg)));
    const tShear = new Matrix().shearX(Math.tan(deg2rad(-axisAngleDeg)));
    const tRotate = new Matrix().rotate(deg2rad(axisAngleDeg));
    return tRotate.multiply(tShear.multiply(tScale));
};

const matrixNear = (a: Matrix, b: Matrix, epsilon = 1e-6): boolean => {
    const aa = a.toArray();
    const bb = b.toArray();
    return aa.every((v, i) => Math.abs(v - bb[i]) < epsilon);
};

const genCubeLegacy = (topSize: number, sideHeight: number): ReturnType<typeof genCube> => {
    const tFinal = buildIsoProjectionMatrix(ISO_PROJECTION_PRESETS.iso);
    const tAnchorBottom = tFinal.applyToPoint(topSize, topSize);
    const lScale = new Matrix().scaleX(Math.cos(deg2rad(30)));
    const lShear = new Matrix().shearY(Math.tan(deg2rad(30)));
    const lPreMove = lShear.multiply(lScale);
    const lAnchor = lPreMove.applyToPoint(topSize, 0);
    const lTranslate = new Matrix().translate(tAnchorBottom.x - lAnchor.x, tAnchorBottom.y - lAnchor.y);
    const lFinal = lTranslate.multiply(lPreMove);
    const rScale = new Matrix().scaleX(Math.cos(deg2rad(30)));
    const rShear = new Matrix().shearY(Math.tan(deg2rad(-30)));
    const rPreMove = rShear.multiply(rScale);
    const rAnchor = rPreMove.applyToPoint(0, 0);
    const rTranslate = new Matrix().translate(tAnchorBottom.x - rAnchor.x, tAnchorBottom.y - rAnchor.y);
    const rFinal = rTranslate.multiply(rPreMove);

    const ptsTop: [number, number][] = [[0, 0], [topSize, 0], [topSize, topSize], [0, topSize]];
    const ptsSide: [number, number][] = [[0, 0], [topSize, 0], [0, sideHeight], [topSize, sideHeight]];
    const ptsTransformed: { x: number; y: number }[] = [];
    for (const pt of ptsTop) {
        ptsTransformed.push(tFinal.applyToPoint(...pt));
    }
    for (const pt of ptsSide) {
        ptsTransformed.push(lFinal.applyToPoint(...pt));
        ptsTransformed.push(rFinal.applyToPoint(...pt));
    }
    const xMin = Math.min(...ptsTransformed.map((pt) => pt.x));
    const xMax = Math.max(...ptsTransformed.map((pt) => pt.x));
    const yMin = Math.min(...ptsTransformed.map((pt) => pt.y));
    const yMax = Math.max(...ptsTransformed.map((pt) => pt.y));
    const width = xMax - xMin;
    const height = yMax - yMin;

    const cx = xMin + (width / 2);
    const cy = yMin + (height / 2);
    const { x: cxTop, y: cyTop } = tFinal.applyToPoint(topSize / 2, topSize / 2);
    const dy = Math.abs(tAnchorBottom.y - cyTop);
    const cxBot = cxTop;
    const cyBot = cyTop + sideHeight;

    return {
        top: tFinal,
        left: lFinal,
        right: rFinal,
        west: lFinal,
        sideFaces: ["left", "right"],
        xMin,
        yMin,
        width,
        height,
        cx,
        cy,
        cxTop,
        cyTop,
        cxBot,
        cyBot,
        dy,
    };
};

describe("isometric projection helpers", () => {
    it("should map board-local coordinates through user rotation and isometric projection", () => {
        const tFinal = buildIsoProjectionMatrix();
        const tUserRotate = new Matrix().rotate(Math.PI / 2);
        const p = mapBoardToScreen(50, 0, tUserRotate, tFinal);
        expect(p.x).to.be.a("number");
        expect(p.y).to.be.a("number");
    });

    it("should produce a non-identity label affine for off-origin anchors", () => {
        const tFinal = buildIsoProjectionMatrix();
        const affine = isoLabelTransform(50, 25, new Matrix(), tFinal);
        expect(affine.a).to.not.equal(0);
        expect(affine.d).to.not.equal(0);
        expect(affine.e).to.be.a("number");
        expect(affine.f).to.be.a("number");
    });

    it("should resolve named projection presets", () => {
        expect(resolveIsoProjection("iso").elevationDeg).to.be.closeTo(ISO_STANDARD_ELEVATION_DEG, 1e-6);
        expect(resolveIsoProjection("shallow").elevationDeg).to.equal(48);
        expect(resolveIsoProjection("very-shallow").elevationDeg).to.equal(58);
        expect(resolveIsoProjection("compressed").elevationDeg).to.equal(46);
        expect(resolveIsoProjection("cabinet").xAxis?.angleDeg).to.equal(0);
        expect(resolveIsoProjection("cabinet").yAxis?.scale).to.equal(0.5);
        expect(resolveIsoProjection("dimetric").elevationDeg).to.equal(38);
        expect(resolveIsoProjection("trimetric").elevationDeg).to.equal(40);
    });

    it("should keep symmetric ground projection matrix-equivalent to legacy shear form", () => {
        const params = ISO_PROJECTION_PRESETS.iso;
        const legacy = buildSymmetricGroundMatrixForTest(params.elevationDeg);
        const derived = buildIsoProjectionMatrix(params);
        const pts: [number, number][] = [[0, 0], [50, 0], [0, 50], [50, 50], [25, 25]];
        for (const [x, y] of pts) {
            const a = legacy.applyToPoint(x, y);
            const b = derived.applyToPoint(x, y);
            expect(a.x).to.be.closeTo(b.x, 1e-9);
            expect(a.y).to.be.closeTo(b.y, 1e-9);
        }
    });

    it("should use iso-aligned asymmetric ground basis for compressed and dimetric presets", () => {
        const iso = resolveGroundBasis(ISO_PROJECTION_PRESETS.iso);
        const isoCompressedElev = resolveGroundBasis({ elevationDeg: ISO_PROJECTION_PRESETS.compressed.elevationDeg });
        const compressed = resolveGroundBasis(ISO_PROJECTION_PRESETS.compressed);
        const dimetric = resolveGroundBasis(ISO_PROJECTION_PRESETS.dimetric);
        const isoAngle = (v: { x: number; y: number }) => Math.atan2(v.y, v.x);
        expect(isoAngle(compressed.vx)).to.be.closeTo(isoAngle(isoCompressedElev.vx), 1e-6);
        expect(isoAngle(compressed.vy)).to.be.closeTo(isoAngle(isoCompressedElev.vy), 1e-6);
        expect(Math.hypot(compressed.vy.x, compressed.vy.y)).to.be.lessThan(Math.hypot(isoCompressedElev.vy.x, isoCompressedElev.vy.y));
        expect(Math.hypot(dimetric.vx.x, dimetric.vx.y)).to.be.lessThan(Math.hypot(iso.vx.x, iso.vx.y));
        const compressedDepth = boardDepthWeight(ISO_PROJECTION_PRESETS.compressed);
        expect(compressedDepth.wx).to.be.closeTo(isoCompressedElev.vx.y, 1e-6);
        expect(compressedDepth.wy).to.be.closeTo(compressed.vy.y, 1e-6);
    });

    it("should use horizontal east and 45-degree south for true cabinet preset", () => {
        const cabinet = resolveGroundBasis(ISO_PROJECTION_PRESETS.cabinet);
        expect(cabinet.vx.x).to.be.closeTo(1, 1e-6);
        expect(cabinet.vx.y).to.be.closeTo(0, 1e-6);
        expect(cabinet.vy.x).to.be.closeTo(Math.cos(Math.PI / 4) * 0.5, 1e-6);
        expect(cabinet.vy.y).to.be.closeTo(Math.sin(Math.PI / 4) * 0.5, 1e-6);
        const cabinetDepth = boardDepthWeight(ISO_PROJECTION_PRESETS.cabinet);
        expect(cabinetDepth.wx).to.equal(0);
        expect(cabinetDepth.wy).to.be.closeTo(cabinet.vy.y, 1e-6);
    });

    it("should rank west columns in front of east at equal south for cabinet depth", () => {
        const params = ISO_PROJECTION_PRESETS.cabinet;
        const tFinal = buildIsoProjectionMatrix(params);
        const west = tFinal.applyToPoint(0, 100);
        const east = tFinal.applyToPoint(100, 100);
        expect(projectedCellDepth(west, params)).to.be.greaterThan(projectedCellDepth(east, params));
    });

    it("should foreshorten ground axes unequally for trimetric preset", () => {
        const iso = resolveGroundBasis({ elevationDeg: ISO_PROJECTION_PRESETS.trimetric.elevationDeg });
        const trimetric = resolveGroundBasis(ISO_PROJECTION_PRESETS.trimetric);
        const isoAngle = (v: { x: number; y: number }) => Math.atan2(v.y, v.x);
        expect(isoAngle(trimetric.vx)).to.be.closeTo(isoAngle(iso.vx), 1e-6);
        expect(isoAngle(trimetric.vy)).to.be.closeTo(isoAngle(iso.vy), 1e-6);
        const xRatio = Math.hypot(trimetric.vx.x, trimetric.vx.y) / Math.hypot(iso.vx.x, iso.vx.y);
        const yRatio = Math.hypot(trimetric.vy.x, trimetric.vy.y) / Math.hypot(iso.vy.x, iso.vy.y);
        expect(xRatio).to.be.closeTo(0.88, 1e-6);
        expect(yRatio).to.be.closeTo(0.65, 1e-6);
        expect(xRatio).to.be.greaterThan(yRatio);
    });

    it("should find iso cylinder silhouette near 45 and 225 degrees", () => {
        const { rightDeg, leftDeg } = cylinderSilhouette(50, 20, ISO_PROJECTION_PRESETS.iso);
        expect(rightDeg).to.be.closeTo(45, 2);
        expect(leftDeg).to.be.closeTo(225, 2);
    });

    it("should keep ground projection on z=0 identical to buildIsoProjectionMatrix", () => {
        const params = ISO_PROJECTION_PRESETS.shallow;
        const m = buildIsoProjectionMatrix(params);
        const p = projectOblique(40, 25, 0, params);
        const q = m.applyToPoint(40, 25);
        expect(p.x).to.be.closeTo(q.x, 1e-9);
        expect(p.y).to.be.closeTo(q.y, 1e-9);
    });

    it("should derive cube face affines matching legacy hand-tuned iso geometry", () => {
        const topSize = 100;
        const sideHeight = 100;
        const legacy = genCubeLegacy(topSize, sideHeight);
        const derived = genCube(topSize, sideHeight, ISO_PROJECTION_PRESETS.iso);
        expect(matrixNear(derived.top, legacy.top)).to.equal(true);
        expect(matrixNear(derived.left, legacy.left)).to.equal(true);
        expect(matrixNear(derived.right, legacy.right)).to.equal(true);
        expect(derived.width).to.be.closeTo(legacy.width, 1e-6);
        expect(derived.height).to.be.closeTo(legacy.height, 1e-6);
        expect(derived.cxTop).to.be.closeTo(legacy.cxTop, 1e-6);
        expect(derived.cyTop).to.be.closeTo(legacy.cyTop, 1e-6);
    });

    it("should anchor cylinder contact at the projected bottom-face center", () => {
        const draw = makeDraw();

        const dyBottomFor = (idSymbol: string, projection: typeof ISO_PROJECTION_PRESETS.iso): number => {
            generateCylinders({
                rootSvg: draw,
                heights: [20],
                stroke: { width: 1, color: "#000" },
                fill: { color: "#f00" },
                projection,
                idSymbol,
            });
            const symbol = draw.findOne(`#${idSymbol}`) as { attr: (n: string) => string };
            return parseFloat(symbol.attr("data-dy-bottom"));
        };

        const dyBottomIso = dyBottomFor("testCylIso", ISO_PROJECTION_PRESETS.iso);
        const dyBottomShallow = dyBottomFor("testCylVeryShallow", ISO_PROJECTION_PRESETS["very-shallow"]);
        expect(dyBottomShallow).to.be.lessThan(dyBottomIso);
        expect(dyBottomShallow).to.be.greaterThan(0.5);
        expect(dyBottomShallow).to.be.lessThan(0.95);
    });

    it("should produce shorter stacks and wider tops for shallower presets", () => {
        const iso = genCube(100, 100, ISO_PROJECTION_PRESETS.iso);
        const shallow = genCube(100, 100, ISO_PROJECTION_PRESETS.shallow);
        expect(shallow.height).to.be.lessThan(iso.height);
        expect(shallow.cyBot - shallow.cyTop).to.be.lessThan(iso.cyBot - iso.cyTop);
        expect(shallow.dy).to.be.greaterThan(iso.dy);
    });

    it("should paint cabinet cube faces back-to-front by projected screen depth", () => {
        const cube = genCube(100, 30, ISO_PROJECTION_PRESETS.cabinet);
        const order = cubeFacePaintOrder(cube, 30, 100, ISO_PROJECTION_PRESETS.cabinet);
        expect(order[0]).to.equal("top");
        expect(order).to.include("left");
        expect(order).to.include("west");
    });

    it("should expose cabinet SW piece visibility from projection preset", () => {
        const vis = cabinetPieceVisibility(ISO_PROJECTION_PRESETS.cabinet);
        expect(vis?.sideSlots).to.deep.equal(["left", "west"]);
        expect(cabinetPieceVisibility(ISO_PROJECTION_PRESETS.iso)).to.equal(undefined);
    });

    it("should map cabinet multi-face colours to south and west at yaw 0", () => {
        const faces = { top: 1, north: 2, south: 3, east: 4, west: 5 };
        expect(permuteCubeFaces(faces, 0)).to.deep.equal({ top: 1, left: 3, right: 4 });
        expect(permuteCubeFacesForProjection(faces, 0, ISO_PROJECTION_PRESETS.cabinet)).to.deep.equal({
            top: 1,
            left: 3,
            right: 5,
        });
    });

    it("should project cabinet cube tops as the full cell parallelogram", () => {
        const cube = genCube(100, 100, ISO_PROJECTION_PRESETS.cabinet);
        expect(cube.sideFaces).to.deep.equal(["left", "west"]);
        const nw = projectOblique(0, 0, 0, ISO_PROJECTION_PRESETS.cabinet);
        const ne = projectOblique(100, 0, 0, ISO_PROJECTION_PRESETS.cabinet);
        const sw = projectOblique(0, 100, 0, ISO_PROJECTION_PRESETS.cabinet);
        const nwMapped = cube.top.applyToPoint(0, 0);
        const neMapped = cube.top.applyToPoint(100, 0);
        const swMapped = cube.top.applyToPoint(0, 100);
        expect(nwMapped.x).to.be.closeTo(nw.x, 1e-6);
        expect(nwMapped.y).to.be.closeTo(nw.y, 1e-6);
        expect(neMapped.x).to.be.closeTo(ne.x, 1e-6);
        expect(swMapped.x).to.be.closeTo(sw.x, 1e-6);
        expect(cube.xMin).to.be.closeTo(nw.x, 1e-6);
    });

    it("should paint pit cells before same-row rim cells with cabinet projection", () => {
        const grid = rectOfRects({ gridHeight: 4, gridWidth: 4, cellSize: 50 });
        const params = ISO_PROJECTION_PRESETS.cabinet;
        const tFinal = buildIsoProjectionMatrix(params);
        const heightmap = [[50, 50, 50, 50], [50, 25, 25, 50], [50, 25, 25, 50], [50, 50, 50, 50]];
        const key = (row: number, col: number) => {
            const p = tFinal.applyToPoint(grid[row][col].x, grid[row][col].y);
            return computeCellSortKey({
                entry: { row, col, x: p.x, y: p.y },
                cellsize: 50,
                boardLocalGrid: grid,
                tUserRotate: new Matrix(),
                heightmap,
                pieces: undefined,
                legend: undefined,
                basePcScale: 1,
                boardRotation: 0,
                rootSvg: { findOne: () => null } as never,
                projection: params,
            });
        };
        expect(compareCellSortKeys(key(2, 1), key(2, 0))).to.be.lessThan(0);
    });
});

describe("isometric pieces grid helpers", () => {
    it("should derive row width from the board grid when width is absent", () => {
        const grid = rectOfRects({ gridHeight: 5, gridWidth: 3, cellSize: 50 });
        expect(piecesRowWidth(0, grid, undefined)).to.equal(3);
        expect(piecesRowWidth(2, grid, undefined)).to.equal(3);
    });

    it("should expand underscore rows using per-row grid widths", () => {
        const grid = rectOfRects({ gridHeight: 3, gridWidth: 4, cellSize: 50 });
        const pieces = parseIsoPiecesString("A,,,\n_\n,,,", grid, undefined);
        expect(pieces.length).to.equal(3);
        expect(pieces[0].length).to.equal(4);
        expect(pieces[1].length).to.equal(4);
        expect(pieces[1].every((cell) => cell.length === 0)).to.equal(true);
    });
});

describe("isometric cell sort helpers", () => {
    it("should prefer exact depth ordering over rounded screen ties", () => {
        const a = { depth: 100, topY: 50.0001, rotatedX: 0, layer: 3, row: 2, col: 0 };
        const b = { depth: 100.5, topY: 50, rotatedX: 50, layer: 3, row: 1, col: 1 };
        expect(compareCellSortKeys(a, b)).to.be.lessThan(0);
    });

    it("should treat near-equal depths as ties within epsilon", () => {
        const a = { depth: 100, topY: 50, rotatedX: 0, layer: 3, row: 0, col: 0 };
        const b = { depth: 100 + ISO_SORT_EPSILON / 2, topY: 60, rotatedX: 0, layer: 3, row: 1, col: 0 };
        expect(compareCellSortKeys(a, b)).to.equal(-10);
    });

    it("should paint all surfaces before pieces at the same projected depth", () => {
        const westPiece = { depth: 100, topY: 50, rotatedX: 0, layer: 3, row: 3, col: 0 };
        const eastSurface = { depth: 100, topY: 50, rotatedX: 50, layer: 0, row: 3, col: 1 };
        expect(compareDrawTaskSortKeys(eastSurface, westPiece)).to.be.lessThan(0);
    });

    it("should paint a cell surface before its own piece at equal ground depth", () => {
        const surface = { depth: 100, topY: 50, rotatedX: 25, layer: 0, row: 2, col: 1 };
        const piece = { depth: 100, topY: 65, rotatedX: 25, layer: 3, row: 2, col: 1 };
        expect(compareDrawTaskSortKeys(surface, piece)).to.be.lessThan(0);
    });

    it("should rank deeper stacks earlier at the same ground depth", () => {
        const grid = rectOfRects({ gridHeight: 3, gridWidth: 3, cellSize: 50 });
        const boardLocalGrid = grid.map((row) => row.map((pt) => ({ x: pt.x, y: pt.y })));
        const tFinal = buildIsoProjectionMatrix();
        const entry = (row: number, col: number) => {
            const p = tFinal.applyToPoint(grid[row][col].x, grid[row][col].y);
            return { row, col, x: p.x, y: p.y };
        };
        const shallow = computeCellSortKey({
            entry: entry(0, 2),
            cellsize: 50,
            boardLocalGrid,
            tUserRotate: new Matrix(),
            heightmap: undefined,
            pieces: [[[], [], [{ glyph: "X" }]], [], []],
            legend: undefined,
            basePcScale: 1,
            boardRotation: 0,
            rootSvg: { findOne: () => null } as never,
        });
        const deep = computeCellSortKey({
            entry: entry(0, 2),
            cellsize: 50,
            boardLocalGrid,
            tUserRotate: new Matrix(),
            heightmap: undefined,
            pieces: [[[], [], [{ glyph: "X" }, { glyph: "X" }, { glyph: "X" }, { glyph: "X" }]], [], []],
            legend: undefined,
            basePcScale: 1,
            boardRotation: 0,
            rootSvg: { findOne: () => null } as never,
        });
        expect(deep.depth).to.be.lessThan(shallow.depth);
    });
});

describe("isometric depth shading helpers", () => {
    it("should normalize depth across the board range", () => {
        expect(depthToNormalized(5, 5, 15)).to.equal(0);
        expect(depthToNormalized(15, 5, 15)).to.equal(1);
        expect(depthToNormalized(10, 5, 15)).to.equal(0.5);
    });

    it("should bucket normalized depth for symbol caching", () => {
        expect(depthBucketIndex(0)).to.equal(0);
        expect(depthBucketIndex(0.99)).to.equal(7);
    });

    it("should darken back cells and brighten front cells", () => {
        const colour = "#808080";
        const back = isoDepthModulate(colour, 0);
        const front = isoDepthModulate(colour, 1);
        expect(back).to.not.equal(front);
    });
});
