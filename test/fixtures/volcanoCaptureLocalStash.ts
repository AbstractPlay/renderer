import type { APRenderRep } from "../../src/schemas/schema.js";

/** Volcano-style capture trays — dense bottom→top columns (target contract). */
export const volcanoCaptureLocalStashRep = (): APRenderRep => ({
    board: { style: "squares", width: 5, height: 5 },
    legend: {
        RD2: { name: "pyramid-up-medium-3D", colour: 1 },
        RD3: { name: "pyramid-up-large-3D", colour: 1 },
    },
    pieces: [
        [[], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], []],
    ],
    areas: [
        {
            type: "localStash",
            label: "Player 1: Captured Pieces",
            stash: [["RD3"]],
        },
        {
            type: "localStash",
            label: "Player 2: Captured Pieces",
            stash: [["RD2", "RD3"]],
        },
    ],
});
