/* eslint-disable @typescript-eslint/no-require-imports */
import { expect } from "chai";
import { SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { IsometricRenderer } from "../src/renderers/isometric";
import { isoShadeFace } from "../src/renderers/isometric/shading";
import { IRendererOptionsIn } from "../src/renderers/_base";
import { APRenderRep } from "../src/schemas/schema";

const { createSVGWindow } = require("svgdom");

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    const document = window.document;
    registerWindow(window, document);
    return SVG(document.documentElement) as Svg;
};

const baseOptions: IRendererOptionsIn = {
    contextGlobal: true,
    coloursGlobal: true,
    colourContext: {
        background: "#ccc",
        fill: "#eee",
        strokes: "#000",
        annotations: "#000",
        board: "#ccc",
    },
    showAnnotations: false,
};

const sideFaceColours = (draw: Svg, symbolId: string): { left: string; right: string; top: string } => {
    const left = (draw.findOne(`#isoRectSide100_${symbolId}_L`) as { fill: () => string } | null)?.fill();
    const right = (draw.findOne(`#isoRectSide100_${symbolId}_R`) as { fill: () => string } | null)?.fill();
    const topGroup = draw.findOne(`#isoRect100_${symbolId}`);
    const top = (topGroup?.findOne("rect") as { fill: () => string } | null)?.fill();
    return { left: left?.toLowerCase() ?? "", right: right?.toLowerCase() ?? "", top: top?.toLowerCase() ?? "" };
};

describe("cube face geometry at yaw 0", () => {
    const rep: APRenderRep = {
        renderer: "isometric",
        board: { style: "squares", width: 1, height: 1 },
        legend: {
            D: {
                piece: "cube",
                faces: {
                    top: "#ff0000",
                    north: "#00ff00",
                    east: "#0000ff",
                    south: "#ffff00",
                    west: "#ff00ff",
                },
            },
        },
        pieces: [[[ { glyph: "D", yaw: 0 } ]]],
    };

    it("should paint south and east on the two visible side faces at yaw 0", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        renderer.render(rep, draw, baseOptions);

        const faces = sideFaceColours(draw, "D__y0");
        expect(faces.top).to.equal(isoShadeFace("#ff0000", "top").toLowerCase());
        expect(faces.left).to.equal(isoShadeFace("#ffff00", "left").toLowerCase()); // south (front)
        expect(faces.right).to.equal(isoShadeFace("#0000ff", "right").toLowerCase()); // east (right)
    });

    it("should rotate visible side faces with board rotation", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        renderer.render(rep, draw, { ...baseOptions, rotate: 90 });

        const faces = sideFaceColours(draw, "D__y1");
        expect(faces.left).to.equal(isoShadeFace("#ff00ff", "left").toLowerCase()); // west
        expect(faces.right).to.equal(isoShadeFace("#ffff00", "right").toLowerCase()); // south
    });

    it("should render a proper cube when height is omitted", () => {
        const draw = makeDraw();
        const renderer = new IsometricRenderer();
        renderer.render(rep, draw, baseOptions);

        expect(draw.findOne("#isoRectSide100_D__y0_L")).to.not.equal(null);
        expect(draw.findOne("#isoRectSide0_D__y0_L")).to.equal(null);
    });
});
