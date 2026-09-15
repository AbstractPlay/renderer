import type { APRenderRep } from "../../src/schemas/schema.js";

const emptyBoard8 = "--------\n".repeat(8).trimEnd();

/** Fixtures for svgdom regression visual checks (track-area tests). */
export const scoreTrackFixture: APRenderRep = {
    board: { style: "squares", width: 8, height: 8 },
    legend: {
        M: { name: "piece", colour: 1 },
        S: { name: "piece", colour: 2 },
    },
    pieces: emptyBoard8,
    areas: [
        {
            type: "track",
            position: "top",
            board: { style: "squares", width: 12, height: 1, strokeColour: "#ccc" },
            pieces: "MMSS----MMMM",
            annotations: [{ type: "dots", targets: [{ row: 0, col: 4 }] }],
        },
    ],
};

export const checkeredTopTrackFixture: APRenderRep = {
    board: { style: "squares-checkered", width: 8, height: 8 },
    legend: {
        A: { name: "piece", colour: 1 },
        B: { name: "piece", colour: 2 },
    },
    pieces: null,
    areas: [
        {
            type: "track",
            position: "top",
            board: { style: "squares", width: 12, height: 1 },
            pieces: "AABB----AAAA",
            annotations: [{ type: "dots", targets: [{ row: 0, col: 4 }] }],
        },
    ],
};

export const checkeredLeftTrackFixture: APRenderRep = {
    board: { style: "squares-checkered", width: 8, height: 8 },
    legend: {
        A: { name: "piece", colour: 1 },
        B: { name: "piece", colour: 2 },
    },
    pieces: null,
    areas: [
        {
            type: "track",
            position: "left",
            board: { style: "squares", width: 1, height: 12 },
            pieces: "AABB----AAAA",
            annotations: [{ type: "dots", targets: [{ row: 4, col: 0 }] }],
        },
    ],
};

export const dualBottomTracksFixture: APRenderRep = {
    board: { style: "squares", width: 4, height: 4 },
    legend: {
        M: { name: "piece", colour: 1 },
    },
    pieces: "----\n".repeat(4).trimEnd(),
    areas: [
        {
            type: "track",
            position: "bottom",
            board: { style: "squares", width: 6, height: 1 },
            pieces: "MMMM--",
        },
        {
            type: "track",
            position: "bottom",
            board: { style: "squares", width: 4, height: 1 },
            pieces: "MM--",
        },
    ],
};

export const fracturedFlatBottomTrackFixture: APRenderRep = {
    board: { style: "fractured-flat", strokeWeight: 0.5 },
    legend: {
        S: { name: "cube", colour: 1 },
        N6: { name: "piecepack-number-6" },
        N5: { name: "piecepack-number-5" },
        N4: { name: "piecepack-number-4" },
        N3: { name: "piecepack-number-3" },
        N2: { name: "piecepack-number-2" },
        N1: { name: "piecepack-number-1" },
    },
    pieces: "-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-\n-,-,-,-,-,-,-,-,-,-,-,-,-,-,-\n-,-,-,-,-\n-",
    areas: [
        {
            type: "track",
            position: "bottom",
            board: { style: "squares", width: 13, height: 1 },
            pieces: "N6,N5,N4,N3,N2,N1,S,N1,N2,N3,N4,N5,N6",
        },
    ],
};

export const isometricKeyRenderRep = (position: "left" | "right" = "right"): APRenderRep => ({
    renderer: "isometric",
    board: {
        style: "squares",
        width: 2,
        height: 2,
    },
    legend: {
        R: { piece: "cube", height: 30, colour: "#ff0000" },
        B: { piece: "cylinder", height: 30, colour: "#0000ff" },
        M: {
            piece: "cube",
            height: 30,
            faces: {
                top: "#ff0000",
                north: "#00ff00",
                east: "#0000ff",
                south: "#ffff00",
                west: "#ff00ff",
            },
        },
    },
    pieces: [
        [[{ glyph: "R" }], []],
        [[], []],
    ],
    areas: [{
        type: "key",
        position,
        list: [
            { piece: "R", name: "Red cube" },
            { piece: "B", name: "Blue cylinder" },
            { piece: "M", name: "Multi cube" },
        ],
    }],
});

/** tileSpacingLineMarkers.test.ts — garden-style row/col label markers */
export const tileSpacingGardenLabelMarkersFixture: APRenderRep = {
    options: ["hide-labels"],
    board: {
        style: "squares",
        width: 8,
        height: 8,
        tileWidth: 4,
        tileHeight: 4,
        tileSpacing: 1.25,
        markers: [
            { type: "label", label: "Placed", points: [{ col: 0, row: 4 }, { col: 4, row: 4 }], size: 15, nudge: { dx: 0, dy: 0.1 } },
            { type: "label", label: "Flipped", points: [{ col: 4, row: 4 }, { col: 8, row: 4 }], size: 15, nudge: { dx: 1.25, dy: 0.1 } },
            { type: "label", label: "Scored", points: [{ col: 0, row: 5 }, { col: 4, row: 5 }], size: 15, nudge: { dx: 0, dy: -0.1 } },
            { type: "label", label: "Current", points: [{ col: 4, row: 5 }, { col: 8, row: 5 }], size: 15, nudge: { dx: 1.25, dy: -0.1 } },
        ],
    },
    legend: { B: { name: "piece", colour: "#000", opacity: 0.5 }, W: { name: "piece", colour: "#fff" } },
    pieces: "WBWWWBWW\nBW--BW--\nWBBWWWBB\nWWBBWWWB\nWBWWWBWW\nBW--BW--\nWWBBWWBB\nWWWBWWWB\n",
};
