import { expect } from "chai";
import { render, type Glyph } from "../src/index.js";
import { applyAffine } from "./helpers/legendUseMatrices.js";
import { coreRenderOptions, makeDraw } from "./helpers/renderTestDraw.js";

describe("glyph nudge coordinate systems", () => {
    for (const rotation of [0, 30, 90, 180, 270, 330]) {
        it(`honours relativeTo glyph at ${rotation}°`, () => {
            const draw = makeDraw();
            const glyph: Glyph = {
                text: "3",
                scale: 0.4,
                rotate: 30,
                flipx: true,
                nudge: { dx: 100, dy: -50, relativeTo: "glyph" },
            };
            render({
                board: { style: "squares", width: 2, height: 2, rotate: 90 },
                legend: { A: glyph },
                pieces: "A-\n--",
            }, { ...coreRenderOptions, target: draw, rotate: rotation });
            const layer = draw.findOne("#A")!.findOne("use")!;
            const matrix = layer.matrixify();
            const board = draw.findOne("#board")!.matrixify();
            const x = layer.x() + layer.width() / 2;
            const y = layer.y() + layer.height() / 2;
            const local = applyAffine(matrix, x, y);
            const actualX = board.a * local.x + board.c * local.y;
            const actualY = board.b * local.x + board.d * local.y;
            const expectedLocalX = matrix.a * 100 - matrix.c * 50;
            const expectedLocalY = matrix.b * 100 - matrix.d * 50;
            expect(actualX).to.be.closeTo(board.a * expectedLocalX + board.c * expectedLocalY, 0.000001);
            expect(actualY).to.be.closeTo(board.b * expectedLocalX + board.d * expectedLocalY, 0.000001);
        });
    }
});
