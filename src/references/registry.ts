import { circleOfLifeRingSvg, scribeChartLeftSvg, scribeChartRightSvg, scribeChartSvg } from "./assets/content.js";
import type { ReferenceAsset } from "./types.js";

function scribeStyleSlots(glyphCount: number): ReferenceAsset["styleSlots"] {
    return {
        background: { role: "fill" },
        grid: { role: "stroke" },
        labels: { role: "fill" },
        text: { role: "fill" },
        glyphs: { role: "fill" },
        dots: { role: "fill" },
        ...Object.fromEntries(
            Array.from({ length: glyphCount }, (_, i) => [`glyph-${i}`, { role: "fill" as const }]),
        ),
    };
}

function parseViewBox(svg: string): { x: number; y: number; w: number; h: number } {
    const match = svg.match(/viewBox=["']([^"']+)["']/i);
    if (match === null) {
        throw new Error("Reference SVG is missing a viewBox attribute.");
    }
    const parts = match[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
        throw new Error(`Invalid viewBox on reference SVG: ${match[1]}`);
    }
    return { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
}

const registry = new Map<string, ReferenceAsset>();

function register(asset: Omit<ReferenceAsset, "viewBox"> & { viewBox?: ReferenceAsset["viewBox"] }): void {
    const viewBox = asset.viewBox ?? parseViewBox(asset.svg);
    registry.set(asset.id, { ...asset, viewBox });
}

register({
    id: "scribe-chart",
    svg: scribeChartSvg,
    anchor: { layout: "sidebar", attach: "right" },
    styleSlots: scribeStyleSlots(19),
});

register({
    id: "scribe-chart-left",
    svg: scribeChartLeftSvg,
    anchor: { layout: "sidebar", attach: "right" },
    styleSlots: scribeStyleSlots(10),
});

register({
    id: "scribe-chart-right",
    svg: scribeChartRightSvg,
    anchor: { layout: "sidebar", attach: "left" },
    styleSlots: {
        ...scribeStyleSlots(19),
    },
});

register({
    id: "circle-of-life-ring",
    svg: circleOfLifeRingSvg,
    anchor: { layout: "annulus", innerRadius: 398, center: [540, 540] },
    styleSlots: {
        background: { role: "fill" },
        ring: { role: "fill" },
        arrows: { role: "stroke" },
        species: { role: "fill" },
        hexes: { role: "fill" },
        ...Object.fromEntries(
            Array.from({ length: 12 }, (_, i) => [`species-${i}`, { role: "fill" as const }]),
        ),
    },
});

export function getReferenceAsset(id: string): ReferenceAsset | undefined {
    return registry.get(id);
}

export function listReferenceAssets(): string[] {
    return [...registry.keys()];
}
