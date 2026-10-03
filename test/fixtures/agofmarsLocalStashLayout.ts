import type { APRenderRep } from "../../src/schemas/schema.js";

/** Wrapped bag row mixing full stacks and singles (dense bottom→top columns). */
export const agofmarsLocalStashLayoutRep = (): APRenderRep => ({
    board: { style: "squares", width: 7, height: 8 },
    legend: {
        BK1d: { name: "pyramid-up-small-3D", colour: "#000" },
        BK2d: { name: "pyramid-up-medium-3D", colour: "#000" },
        BK3d: { name: "pyramid-up-large-3D", colour: "#000" },
        YE1d: { name: "pyramid-up-small-3D", colour: 4 },
        YE2d: { name: "pyramid-up-medium-3D", colour: 4 },
        YE3d: { name: "pyramid-up-large-3D", colour: 4 },
        GN3d: { name: "pyramid-up-large-3D", colour: 3 },
        BU3d: { name: "pyramid-up-large-3D", colour: 2 },
        RD3d: { name: "pyramid-up-large-3D", colour: 1 },
    },
    pieces: [
        [[], [], [], [], [], [], []],
        [[], [], [], [], [], [], []],
        [[], [], [], [], [], [], []],
        [[], [], [], [], [], [], []],
        [[], [], [], [], [], [], []],
        [[], [], [], [], [], [], []],
        [[], [], [], [], [], [], []],
        [[], [], [], [], [], [], []],
    ],
    areas: [
        {
            type: "localStash",
            label: "Pyramids in bag",
            spacing: 0.2,
            stash: [
                ["BK1d", "BK2d", "BK3d"],
                ["YE1d", "YE2d", "YE3d"],
                ["YE1d", "YE2d", "YE3d"],
                ["YE1d", "YE2d", "YE3d"],
                ["YE1d", "YE2d", "YE3d"],
                ["YE1d", "YE2d", "YE3d"],
                ["YE1d", "YE2d", "YE3d"],
                ["YE3d"],
                ["GN3d"],
                ["BU3d"],
                ["RD3d"],
                ["BK1d"],
                ["BK1d"],
                ["BK1d"],
                ["BK1d"],
            ],
        },
    ],
});
