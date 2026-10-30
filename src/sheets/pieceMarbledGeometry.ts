import type { Container as SVGContainer, Symbol as SVGSymbol } from "@svgdotjs/svg.js";

/** Marble flecks: cx, cy, r, true = light speckle. Opacities match the manual glyphDefs checker. */
const MARBLED_SPECKLES: readonly (readonly [number, number, number, boolean])[] = [
    [51.4, 28.6, 11.5, false], [61.8, 31.7, 7.3, true], [48.5, 33.6, 5.9, true], [33.6, 50.0, 8.2, true],
    [31.9, 61.6, 8.1, false], [27.5, 34.2, 9.6, true], [55.9, 37.5, 6.3, true], [35.2, 35.9, 9.5, false],
    [32.9, 54.3, 5.1, false], [62.4, 72.3, 9.4, false], [51.4, 69.4, 7.7, false], [27.6, 28.3, 8.3, true],
    [43.1, 20.4, 8.6, true], [26.4, 43.1, 7.2, true], [57.2, 42.1, 10.7, true], [65.7, 34.9, 10.4, true],
    [53.4, 75.6, 6.6, true], [33.4, 39.7, 10.3, false], [76.6, 51.6, 8.2, false], [23.8, 62.8, 7.4, false],
    [39.5, 55.9, 5.2, false], [26.4, 39.4, 6.8, true], [72.2, 44.9, 5.7, true], [63.8, 50.8, 6.8, false],
    [58.6, 70.6, 9.4, true], [44.7, 72.9, 11.4, true], [49.7, 41.0, 6.5, true], [53.9, 42.6, 11.8, false],
    [45.5, 59.9, 9.6, false], [51.3, 50.1, 11.5, true], [63.8, 50.2, 9.9, true], [33.4, 37.2, 6.8, true],
    [48.8, 76.2, 10.7, false], [34.9, 39.4, 5.0, false], [38.6, 71.4, 11.6, false], [66.3, 49.1, 7.1, true],
    [42.6, 47.8, 8.3, true], [31.7, 59.4, 5.1, false], [35.7, 20.5, 7.3, true], [19.5, 39.1, 6.6, true],
];

const MARBLED_VEINS: readonly {
    d: string;
    stroke: string;
    strokeOpacity: number;
    strokeWidth: number;
}[] = [
    {
        d: "M 12.67 53.91 A 37.8 37.8 0 0 1 83.68 30.84",
        stroke: "#ffffff",
        strokeOpacity: 0.3,
        strokeWidth: 6,
    },
    {
        d: "M 87.33 42.09 A 37.8 37.8 0 0 1 16.32 65.16",
        stroke: "#000000",
        strokeOpacity: 0.22,
        strokeWidth: 6,
    },
    {
        d: "M 12.03 38.25 A 39.2 39.2 0 0 1 74.99 17.80",
        stroke: "#ffffff",
        strokeOpacity: 0.55,
        strokeWidth: 1.3,
    },
];

export function buildPieceMarbledSymbol(canvas: SVGContainer): SVGSymbol {
    const group = canvas.symbol();
    group.ellipse(92, 88).center(50, 57).fill("#000").opacity(0.1);
    group.ellipse(86, 84).center(50, 55).fill("#000").opacity(0.2);
    group.circle(82)
        .center(50, 53)
        .attr("data-marbled-side", "1")
        .fill("#888");
    group.circle(82)
        .center(50, 48)
        .attr("data-slot-fill", "fill")
        .fill("#ccc");

    for (const [cx, cy, r, light] of MARBLED_SPECKLES) {
        group.circle(r * 2)
            .center(cx, cy)
            .fill(light ? "#fff" : "#000")
            .opacity(light ? 0.06 : 0.045);
    }

    for (const vein of MARBLED_VEINS) {
        group.path(vein.d)
            .fill("none")
            .stroke({
                color: vein.stroke,
                width: vein.strokeWidth,
                opacity: vein.strokeOpacity,
                linecap: "round",
            });
    }

    group.circle(69)
        .center(50, 48)
        .fill("none")
        .stroke({ color: "#000", width: 2, opacity: 0.07 });

    group.viewbox(0, 0, 100, 100);
    group.attr("data-cellsize", 100);
    return group;
}
