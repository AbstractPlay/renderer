import { expect } from "chai";
import { SVG, registerWindow } from "@svgdotjs/svg.js";
import {
    computeMaxCenteredSquareSide,
    cubeFaceDecorUvScale,
    glyphKeepsUpright,
    hexTopOverlayPrepMatrix,
    ISO_FACE_DECOR_MARGIN,
    isoFaceGlyphDrawSize,
    multiplyIsoAffine,
    projectedTopCenterMatrix,
    resolveFaceInset,
    resolveGlyphRotationDegrees,
} from "../src/renderers/isometric/faceGlyphFit";
import { genCube } from "../src/renderers/isometric/cubes";
import { genCylinder } from "../src/renderers/isometric/cylinders";
import { genHex } from "../src/renderers/isometric/hexes";
import { ISO_PROJECTION_PRESETS } from "../src/renderers/isometric/projection";
import { Orientation } from "honeycomb-grid";
import { Matrix } from "transformation-matrix-js";

/* eslint-disable @typescript-eslint/no-require-imports */
const { createSVGWindow } = require("svgdom");

describe("iso face glyph fit", () => {
    it("should default face inset to 1 when scale is omitted", () => {
        expect(resolveFaceInset({ piece: "cube", colour: 1 })).to.equal(1);
    });

    it("should use decor margin when scale is 1", () => {
        expect(resolveFaceInset({ piece: "cube", colour: 1, scale: 1 })).to.equal(ISO_FACE_DECOR_MARGIN);
    });

    it("should center projected-top overlays on the cylinder origin", () => {
        const prep = projectedTopCenterMatrix(100);
        const pt = prep.applyToPoint(50, 50);
        expect(pt.x).to.be.closeTo(0, 1e-9);
        expect(pt.y).to.be.closeTo(0, 1e-9);
    });

    it("should map projected-top UV center to cylinder top in piece space", () => {
        const cylinder = genCylinder(100, 35, ISO_PROJECTION_PRESETS.iso);
        const prep = projectedTopCenterMatrix(100);
        const combined = multiplyIsoAffine(cylinder.transform, prep);
        const pt = combined.applyToPoint(50, 50);
        expect(pt.x).to.be.closeTo(cylinder.cxTop, 1e-9);
        expect(pt.y).to.be.closeTo(cylinder.cyTop, 1e-9);
        expect((cylinder.transform as Matrix & { e: number; f: number }).e).to.be.closeTo(0, 1e-9);
        expect((cylinder.transform as Matrix & { e: number; f: number }).f).to.be.closeTo(0, 1e-9);
    });

    it("should center hex overlays on the honeycomb centroid", () => {
        const hex = genHex(100, 0, Orientation.FLAT, ISO_PROJECTION_PRESETS.iso);
        const prep = hexTopOverlayPrepMatrix(hex, 100);
        const center = prep.applyToPoint(50, 50);
        const corners = hex.corners;
        const cx = corners.reduce((s, c) => s + c.x, 0) / corners.length;
        const cy = corners.reduce((s, c) => s + c.y, 0) / corners.length;
        expect(center.x).to.be.closeTo(cx, 1e-9);
        expect(center.y).to.be.closeTo(cy, 1e-9);
    });

    it("should apply a cube uv inscribe factor below 1 on skewed side faces", () => {
        const cube = genCube(100, 100, ISO_PROJECTION_PRESETS.iso);
        const topScale = cubeFaceDecorUvScale(cube.top, 100, 100);
        const sideScale = cubeFaceDecorUvScale(cube.left, 100, 100);
        expect(topScale).to.be.lessThanOrEqual(1);
        expect(sideScale).to.be.lessThanOrEqual(1);
        expect(sideScale).to.be.lessThan(topScale);
    });

    it("should shrink sheet glyph draw size when max square side is below basis", () => {
        const window = createSVGWindow();
        registerWindow(window, window.document);
        const draw = SVG(window.document.documentElement) as import("@svgdotjs/svg.js").Svg;
        const sym = draw.symbol().viewbox(0, 0, 687, 400);
        const basis = 100;
        const inset = resolveFaceInset({ piece: "cube", colour: 1 });
        const budget = basis * inset;
        const fitted = isoFaceGlyphDrawSize(sym as unknown as import("@svgdotjs/svg.js").Svg, basis, inset, 1, 50);
        expect(fitted).to.be.lessThan(budget);
        expect(fitted).to.be.greaterThan(0);
    });

    it("should limit max centered square on skewed cube sides below square tops", () => {
        const cube = genCube(100, 35, ISO_PROJECTION_PRESETS.iso);
        const topMax = computeMaxCenteredSquareSide(
            { localW: 100, localH: 100, mapping: "cubeUv" },
            cube.top,
        );
        const sideMax = computeMaxCenteredSquareSide(
            { localW: 100, localH: 35, mapping: "cubeUv" },
            cube.left,
        );
        expect(sideMax).to.be.lessThan(topMax);
        expect(sideMax).to.be.lessThan(35);
    });

    it("should shrink projected cylinder top max square below full face", () => {
        const cyl = genCylinder(100, 0, ISO_PROJECTION_PRESETS.iso);
        const combined = cyl.transform.multiply(projectedTopCenterMatrix(100));
        const maxSide = computeMaxCenteredSquareSide(
            { localW: 100, localH: 100, mapping: "projectedTop" },
            combined,
            { kind: "ellipse", cx: cyl.cxTop, cy: cyl.cyTop, rx: cyl.rx, ry: cyl.ry },
        );
        expect(maxSide).to.be.lessThan(100);
        expect(maxSide).to.be.greaterThan(40);
    });

    it("should counter-rotate upright glyphs on legend but not bake board rotation on iso tops", () => {
        expect(glyphKeepsUpright({ text: "3", colour: 1 })).to.equal(true);
        expect(glyphKeepsUpright({ text: "3", colour: 1, orientation: "fluid" })).to.equal(false);
        const isoTop = { counterRotateWithBoard: true, rotateFluidWithBoard: true };
        expect(resolveGlyphRotationDegrees({ text: "3", colour: 1 }, 90, isoTop)).to.equal(0);
        expect(resolveGlyphRotationDegrees({ name: "piecepack-number-1", colour: 1, orientation: "vertical" }, 90, isoTop)).to.equal(0);
        expect(resolveGlyphRotationDegrees({ text: "3", colour: 1 }, 90, { counterRotateWithBoard: true })).to.equal(-90);
        expect(resolveGlyphRotationDegrees({ text: "3", colour: 1 }, 90, { counterRotateWithBoard: false })).to.equal(0);
        expect(resolveGlyphRotationDegrees({ text: "3", colour: 1, rotate: null }, 90)).to.equal(null);
        expect(resolveGlyphRotationDegrees({ name: "piecepack-number-1", colour: 1 }, 90)).to.equal(0);
        expect(resolveGlyphRotationDegrees({ name: "piecepack-number-1", colour: 1, orientation: "vertical" }, 90, { counterRotateWithBoard: true })).to.equal(-90);
        expect(resolveGlyphRotationDegrees({ name: "piecepack-number-1", colour: 1 }, 90, isoTop)).to.equal(90);
    });
});
