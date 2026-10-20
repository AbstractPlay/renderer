import type { APRenderRep } from "../../src/schemas/schema.js";

/** Minimal homeworlds legend for layout tests (stars + one ship direction per colour). */
export const homeworldsLayoutLegend: APRenderRep["legend"] = {
    R1: { name: "pyramid-up-small-upscaled", paint: { fill: 1 } },
    B1: { name: "pyramid-up-small-upscaled", paint: { fill: 2 } },
    B2: { name: "pyramid-up-medium-upscaled", paint: { fill: 2 } },
    G1: { name: "pyramid-up-small-upscaled", paint: { fill: 3 } },
    G2: { name: "pyramid-up-medium-upscaled", paint: { fill: 3 } },
    Y1: { name: "pyramid-up-small-upscaled", paint: { fill: 4 } },
    pY1S: { name: "pyramid-flat-small", paint: { fill: 4 } },
    pR1S: { name: "pyramid-flat-small", paint: { fill: 1 } },
    pB1S: { name: "pyramid-flat-small", paint: { fill: 2 } },
    pG1S: { name: "pyramid-flat-small", paint: { fill: 3 } },
    pB2S: { name: "pyramid-flat-medium", paint: { fill: 2 } },
};

export const homeworldsLayoutStash: APRenderRep["areas"] = [
    {
        type: "globalStash",
        R: "111",
        G: "11",
        B: "112",
        Y: "1",
    },
];

export function homeworldsRowLayoutFixture(): APRenderRep {
    return {
        renderer: "homeworlds",
        options: ["hw-no-buttons"],
        board: [
            { name: "Home", stars: ["Y1"], seat: "N" },
            { name: "Alpha", stars: ["B1"], layout: { row: 0, order: 0 } },
            { name: "Beta", stars: ["G2"], layout: { row: 0, order: 1 } },
            { name: "Far", stars: ["R1"], layout: { row: 1, order: 0 } },
        ],
        pieces: [[], [], [], []],
        areas: homeworldsLayoutStash,
        legend: homeworldsLayoutLegend,
    };
}

export function homeworldsPartialLayoutFixture(): APRenderRep {
    const base = homeworldsRowLayoutFixture();
    return {
        ...base,
        board: [
            { name: "Home", stars: ["Y1"], seat: "N" },
            { name: "Alpha", stars: ["B1"], layout: { row: 0 } },
            { name: "Beta", stars: ["G2"] },
            { name: "Far", stars: ["B2"] },
        ],
        pieces: [[], [], [], []],
    };
}

export function homeworldsStarColumnFixture(): APRenderRep {
    return {
        renderer: "homeworlds",
        options: ["hw-no-buttons"],
        board: [
            { name: "Home", stars: ["Y1"], seat: "N" },
            { name: "Small", stars: ["B1"] },
            { name: "Large", stars: ["G3"] },
        ],
        pieces: [["pY1S"], ["pB1S"], ["pG1S"]],
        areas: homeworldsLayoutStash,
        legend: {
            ...homeworldsLayoutLegend,
            G3: { name: "pyramid-up-large-upscaled", paint: { fill: 3 } },
            pG3S: { name: "pyramid-flat-large", paint: { fill: 3 } },
        },
    };
}
