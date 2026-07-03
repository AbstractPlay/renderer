import { G as SVGG } from "@svgdotjs/svg.js";
import { Poly } from "../../grids/_base";

const FOOTPRINT_STROKE_RATIO = 0.02;
const FOOTPRINT_HALO_MULTIPLIER = 2.5;
const FOOTPRINT_COLOUR_OPACITY = 0.35;
const FOOTPRINT_HALO_OPACITY = 0.6;

/** Faint isometric cell outline anchoring an occupied column to its grid square. */
export const isoCellFootprint = (
    group: SVGG,
    poly: Poly,
    strokeColour: string,
    bgColour: string,
    cellsize: number,
): void => {
    if (poly.type !== "poly") {
        return;
    }
    const points = poly.points.map(({ x, y }) => `${x},${y}`).join(" ");
    const strokeWeight = cellsize * FOOTPRINT_STROKE_RATIO;
    const stroke = {
        linecap: "round" as const,
        linejoin: "round" as const,
    };

    group.polygon(points)
        .fill("none")
        .stroke({
            color: bgColour,
            width: strokeWeight * FOOTPRINT_HALO_MULTIPLIER,
            opacity: FOOTPRINT_HALO_OPACITY,
            ...stroke,
        })
        .attr("pointer-events", "none");

    group.polygon(points)
        .fill("none")
        .stroke({
            color: strokeColour,
            width: strokeWeight,
            opacity: FOOTPRINT_COLOUR_OPACITY,
            ...stroke,
        })
        .attr("pointer-events", "none");
};
