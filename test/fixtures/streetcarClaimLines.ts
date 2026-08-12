import { APRenderRep, MarkerFence } from "../../src/schemas/schema";

type FenceSide = MarkerFence["side"];

const fence = (
    row: number,
    col: number,
    side: FenceSide,
    colour: number,
    dashed?: [number, number],
): MarkerFence => ({
    type: "fence",
    cell: { row, col },
    side,
    colour,
    width: 0.5,
    ...(dashed !== undefined ? { dashed } : {}),
});

/** Claim-line fence markers from the reported Streetcar Suburb game state. */
export const streetcarFenceMarkers: MarkerFence[] = [
    fence(3, 4, "W", 1),
    fence(4, 3, "NE", 1),
    fence(4, 3, "NW", 1),
    fence(4, 2, "NE", 1),
    fence(3, 2, "W", 1),
    fence(3, 2, "NW", 1),
    fence(2, 3, "NE", 1),
    fence(1, 4, "W", 1),
    fence(1, 3, "W", 1),
    fence(2, 2, "NW", 1),
    fence(5, 5, "W", 1),
    fence(6, 4, "NW", 1),
    fence(7, 3, "NE", 1),
    fence(7, 3, "NW", 1),
    fence(6, 3, "NW", 1),
    fence(6, 3, "NE", 1),
    fence(1, 3, "NW", 1),
    fence(1, 3, "NE", 1),
    fence(2, 2, "W", 1, [1, 9]),
    fence(2, 1, "NE", 1, [1, 9]),
    fence(5, 4, "NW", 2),
    fence(5, 3, "NE", 2),
    fence(5, 2, "NE", 2),
    fence(4, 2, "W", 2),
    fence(3, 3, "NW", 2),
    fence(2, 3, "W", 2),
    fence(3, 4, "NE", 2),
    fence(3, 5, "W", 2),
    fence(2, 4, "NE", 2),
    fence(2, 5, "W", 2),
    fence(5, 3, "NW", 2),
    fence(5, 3, "W", 2),
    fence(7, 4, "NE", 2),
    fence(7, 5, "NW", 2),
    fence(6, 2, "NW", 2),
    fence(6, 2, "W", 2),
    fence(1, 4, "NE", 2),
    fence(1, 5, "W", 2),
];

export const STREETCAR_FENCE_COUNT = streetcarFenceMarkers.length;

const customBlack = { func: "custom" as const, default: "#000", palette: 3 };
const customWhite = { func: "custom" as const, default: "#fff", palette: 5 };
const backFillColour = { func: "custom" as const, default: "#cede86", palette: "_context_background" };

/** Full renderrep from the reported Streetcar Suburb regression game. */
export const streetcarClaimLinesRenderRep: APRenderRep = {
    options: ["clickable-edges"],
    renderer: "stacking-offset",
    board: {
        style: "hex-even-p",
        width: 8,
        height: 8,
        strokeWeight: 15,
        labelColour: "#000",
        strokeColour: "#fff",
        backFill: { colour: backFillColour },
        stackOffset: 0.39,
        blocked: [
            { row: 1, col: 0 },
            { row: 2, col: 0 },
            { row: 2, col: 7 },
            { row: 3, col: 0 },
            { row: 3, col: 1 },
            { row: 3, col: 7 },
            { row: 4, col: 0 },
            { row: 4, col: 6 },
            { row: 4, col: 7 },
            { row: 5, col: 0 },
            { row: 5, col: 7 },
            { row: 6, col: 7 },
        ],
        markers: [
            ...streetcarFenceMarkers,
            { type: "flood", opacity: 0.67, colour: 6, points: [{ row: 6, col: 5 }] },
            { type: "flood", opacity: 0.67, colour: 4, points: [{ row: 6, col: 4 }] },
        ],
    },
    legend: {
        A: [{ name: "piece-borderless", colour: 6 }, { name: "streetcar-house", scale: 0.75 }],
        B: [{ name: "piece-borderless", colour: 4 }, { name: "streetcar-house", scale: 0.75 }],
        C: [{ name: "piece-borderless", colour: customBlack }, { name: "streetcar-house", scale: 0.75 }],
        D: [{ name: "piece-borderless", colour: customWhite }, { name: "streetcar-house", scale: 0.75 }],
        E: { name: "piece-borderless", colour: 6 },
        F: { name: "piece-borderless", colour: 4 },
        G: { name: "piece-borderless", colour: customBlack },
        H: { name: "piece-borderless", colour: customWhite },
        K: { name: "cube-cat-plant", scale: 0.85, colour: 6 },
        L: { name: "cube-cat-plant", scale: 0.85, colour: 4 },
        M: { name: "cube-cat-plant", scale: 0.85, colour: customBlack },
        N: { name: "cube-cat-plant", scale: 0.85, colour: customWhite },
        O: { name: "cube-lamp-cat", scale: 0.85, colour: 6 },
        P: { name: "cube-lamp-cat", scale: 0.85, colour: 4 },
        Q: { name: "cube-lamp-cat", scale: 0.85, colour: customBlack },
        R: { name: "cube-lamp-cat", scale: 0.85, colour: customWhite },
        S: { name: "cube-plant-person", scale: 0.85, colour: 6 },
        T: { name: "cube-plant-person", scale: 0.85, colour: 4 },
        U: { name: "cube-plant-person", scale: 0.85, colour: customBlack },
        V: { name: "cube-plant-person", scale: 0.85, colour: customWhite },
        W: { name: "cube-person-lamp", scale: 0.85, colour: 6 },
        X: { name: "cube-person-lamp", scale: 0.85, colour: 4 },
        Y: { name: "cube-person-lamp", scale: 0.85, colour: customBlack },
        Z: { name: "cube-person-lamp", scale: 0.85, colour: customWhite },
    },
    pieces: "A,C,G,VN,H,NN,H,C\n-,E,F,-,H,G,-,A\n-,V,G,E,-,C,D,-\n-,-,P,E,SW,G,D,-\n-,XX,H,X,P,E,-,-\n-,F,F,G,X,H,C,-\n-,F,-,E,X,-,C,-\nD,G,V,E,WO,G,D,C",
    areas: [
        {
            type: "pieces",
            pieces: ["E", "E", "E", "E", "F", "F", "F", "F", "H"],
            label: "Lucas's housing limits",
            background: backFillColour,
            ownerMark: 1,
        },
        {
            type: "pieces",
            pieces: ["E", "F", "F", "F", "F", "F", "H", "H", "H"],
            label: "Adrian's housing limits",
            background: backFillColour,
            ownerMark: 2,
        },
    ],
};
