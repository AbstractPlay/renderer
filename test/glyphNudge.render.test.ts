import { expect } from "chai";
import { SVG, registerWindow, type Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { render, type Glyph } from "../src/index.js";

describe("glyph nudge coordinate systems", () => {
    for (const rotation of [0, 30, 90, 180, 270, 330]) {
        for (const relativeTo of [undefined, "glyph", "piece"] as const) {
            it(`offsets upright text relative to ${relativeTo ?? "legacy glyph"} at ${rotation}°`, () => {
                const window = createSVGWindow();
                registerWindow(window, window.document);
                const draw = SVG(window.document.documentElement) as Svg;
                const glyph: Glyph = {
                    text: "3", scale: 0.4, rotate: 30, flipx: true,
                    nudge: { dx: 100, dy: -50, relativeTo },
                };
                render({
                    board: { style: "squares", width: 2, height: 2, rotate: 90 },
                    legend: { A: glyph },
                    pieces: "A-\n--",
                }, { target: draw, rotate: rotation });
                const layer = draw.findOne("#A")!.findOne("use")!;
                const matrix = layer.matrixify();
                const board = draw.findOne("#board")!.matrixify();
                const x = layer.x() + layer.width() / 2;
                const y = layer.y() + layer.height() / 2;
                const localX = matrix.a * x + matrix.c * y + matrix.e;
                const localY = matrix.b * x + matrix.d * y + matrix.f;
                const actualX = board.a * localX + board.c * localY;
                const actualY = board.b * localX + board.d * localY;
                // Legacy nudges follow the glyph transform (including its flip);
                // piece nudges follow only the board and retain the glyph's scale.
                const expectedLocalX = relativeTo === "piece" ? 40 : matrix.a * 100 - matrix.c * 50;
                const expectedLocalY = relativeTo === "piece" ? -20 : matrix.b * 100 - matrix.d * 50;
                expect(actualX).to.be.closeTo(board.a * expectedLocalX + board.c * expectedLocalY, 0.000001);
                expect(actualY).to.be.closeTo(board.b * expectedLocalX + board.d * expectedLocalY, 0.000001);
            });
        }
    }
});
