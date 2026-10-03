import type { APRenderRep } from "../../src/schemas/schema.js";

/**
 * Mega-Volcano capture — dense bottom→top columns (hand-edited JSON for Phase 2 gate).
 */
export const mvolcanoCaptureDenseLocalStashRep = (): APRenderRep => ({
    renderer: "stacking-3D",
    board: { style: "squares", width: 6, height: 6 },
    legend: {
        RD1: { name: "pyramid-up-small-3D", colour: 1 },
        RD3: { name: "pyramid-up-large-3D", colour: 1 },
        BU1: { name: "pyramid-up-small-3D", colour: 2 },
        GN2: { name: "pyramid-up-medium-3D", colour: 3 },
        GN3: { name: "pyramid-up-large-3D", colour: 3 },
    },
    pieces: [
        [[], [], [], [], [], []],
        [[], [], [], [], [], []],
        [[], [], [], [], [], []],
        [[], [], [], [], [], []],
        [[], [], [], [], [], []],
        [[], [], [], [], [], []],
    ],
    areas: [
        {
            type: "localStash",
            label: "Player 1: Captured Pieces",
            stash: [
                ["GN2", "GN3"],
                ["RD1", "RD3"],
            ],
        },
        {
            type: "localStash",
            label: "Player 2: Captured Pieces",
            stash: [
                ["GN3"],
                ["BU1"],
            ],
        },
    ],
});
