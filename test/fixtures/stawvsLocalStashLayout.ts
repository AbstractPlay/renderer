import type { APRenderRep } from "../../src/schemas/schema.js";

/** Stawvs-style capture rows (7 mixed-height columns × 2 players). */
export const stawvsLocalStashLayoutRep = (): APRenderRep => ({
    board: { style: "squares", width: 8, height: 8 },
    legend: {
        PI1c: { name: "pyramid-flattened-small", colour: 8 },
        PI2c: { name: "pyramid-flattened-medium", colour: 8 },
        PI3c: { name: "pyramid-flattened-large", colour: 8 },
        BL1c: { name: "pyramid-flattened-small", colour: 9 },
        BL2c: { name: "pyramid-flattened-medium", colour: 9 },
        BL3c: { name: "pyramid-flattened-large", colour: 9 },
        GR1c: { name: "pyramid-flattened-small", colour: 10 },
        GR2c: { name: "pyramid-flattened-medium", colour: 10 },
        GR3c: { name: "pyramid-flattened-large", colour: 10 },
        OR1c: { name: "pyramid-flattened-small", colour: 11 },
        OR2c: { name: "pyramid-flattened-medium", colour: 11 },
        OR3c: { name: "pyramid-flattened-large", colour: 11 },
    },
    pieces: [
        [[], [], [], [], [], [], [], []],
        [[], [], [], [], [], [], [], []],
        [[], [], [], [], [], [], [], []],
        [[], [], [], [], [], [], [], []],
        [[], [], [], [], [], [], [], []],
        [[], [], [], [], [], [], [], []],
        [[], [], [], [], [], [], [], []],
        [[], [], [], [], [], [], [], []],
    ],
    areas: [
        {
            type: "localStash",
            label: "Bonaventure's pyramids",
            stash: [
                ["OR3c", "OR2c", "OR1c"],
                ["BL3c", "BL2c", "BL1c"],
                ["GR3c", "GR2c"],
                ["PI3c", "PI2c"],
                ["GR3c", "PI2c"],
                ["GR3c", "BL2c"],
                ["OR2c"],
            ],
        },
        {
            type: "localStash",
            label: "mcd's pyramids",
            stash: [
                ["PI3c", "PI2c", "PI1c"],
                ["PI3c", "PI2c", "PI1c"],
                ["OR3c", "GR2c", "PI1c"],
                ["BL3c", "BL2c", "GR1c"],
                ["OR3c"],
                ["PI3c"],
                ["OR1c"],
            ],
        },
    ],
});
