import { expect } from "chai";
import crosshairsFixture from "../fixtures/crosshairs-numeric-nudge.json" with { type: "json" };
import type { APRenderRep } from "../../src/schemas/schema.js";
import { applyAffine, legendChildUseMatrices } from "./legendUseMatrices.js";
import type { makeDraw } from "./renderTestDraw.js";

export const crosshairsRep = crosshairsFixture as APRenderRep;

export const textNudgedLegendKeys = (): string[] => {
    if (crosshairsRep.legend === undefined) {
        return [];
    }
    const keys: string[] = [];
    for (const key of Object.keys(crosshairsRep.legend)) {
        const entry = crosshairsRep.legend[key];
        const glyphs = Array.isArray(entry) ? entry : [entry];
        if (
            glyphs.some(
                (g) =>
                    typeof g === "object"
                    && g !== null
                    && "nudge" in g
                    && "text" in g
                    && typeof (g as { text?: string }).text === "string"
                    && (g as { text: string }).text.length > 0,
            )
        ) {
            keys.push(key);
        }
    }
    return keys.sort();
};

const planeLayerIndex = (legendKey: string): number => {
    const entry = crosshairsRep.legend![legendKey];
    const glyphs = Array.isArray(entry) ? entry : [entry];
    let lastPlane = -1;
    glyphs.forEach((g, i) => {
        if (typeof g === "object" && g !== null && (g as { name?: string }).name === "plane") {
            lastPlane = i;
        }
    });
    expect(lastPlane).to.be.greaterThan(-1);
    return lastPlane;
};

export const textOffsetFromPlane = (
    draw: ReturnType<typeof makeDraw>,
    legendKey: string,
): { x: number; y: number } => {
    const matrices = legendChildUseMatrices(draw, legendKey);
    const planeIdx = planeLayerIndex(legendKey);
    expect(matrices.length).to.be.greaterThan(planeIdx);
    const plane = applyAffine(matrices[planeIdx], 0, 0);
    const textA = applyAffine(matrices[0], 0, 0);
    return { x: textA.x - plane.x, y: textA.y - plane.y };
};
