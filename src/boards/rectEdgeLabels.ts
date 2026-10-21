import type { RendererBase } from "../renderers/_base.js";
import type { APRenderRep } from "../schemas/schema.js";

export type RectLabelSide = "north" | "east" | "south" | "west";

export interface RectEdgeLabelsOverride {
    north?: string[];
    south?: string[];
    east?: string[];
    west?: string[];
}

export function hiddenRectLabelSides(options?: APRenderRep["options"]): Set<RectLabelSide> {
    const hidden = new Set<RectLabelSide>();
    if (options === undefined) {
        return hidden;
    }
    if (options.includes("hide-labels-half")) {
        hidden.add("north");
        hidden.add("east");
    }
    if (options.includes("hide-labels-north")) {
        hidden.add("north");
    }
    if (options.includes("hide-labels-south")) {
        hidden.add("south");
    }
    if (options.includes("hide-labels-west")) {
        hidden.add("west");
    }
    if (options.includes("hide-labels-east")) {
        hidden.add("east");
    }
    return hidden;
}

export function shouldDrawRectLabelSide(hidden: Set<RectLabelSide>, side: RectLabelSide): boolean {
    return !hidden.has(side);
}

export interface ResolveRectEdgeLabelsInput {
    width: number;
    height: number;
    columnLabels?: string[];
    rowLabels?: unknown;
    edgeLabels?: RectEdgeLabelsOverride;
    options?: APRenderRep["options"];
}

function assertEdgeLength(labels: string[], expected: number, name: string): void {
    if (labels.length !== expected) {
        throw new Error(
            `Board edge labels for ${name} must have length ${expected}, got ${labels.length}.`,
        );
    }
}

/**
 * Resolves per-edge label strings for double-sided square/vertex boards.
 * Shared column/row sequences honour reverse-* and swap-labels; edgeLabels overrides are literal.
 */
export function resolveRectEdgeLabelStrings(
    ctx: RendererBase,
    input: ResolveRectEdgeLabelsInput,
): Record<RectLabelSide, string[]> {
    const { width, height, columnLabels: customColumn, rowLabels: customRow, edgeLabels, options } = input;

    let columnLabels = ctx.getLabels(customColumn, width);
    if (options?.includes("reverse-letters")) {
        columnLabels.reverse();
    }

    let rowLabels = ctx.getRowLabels(customRow, height);
    if (options?.includes("reverse-numbers")) {
        rowLabels.reverse();
    }

    if (options?.includes("swap-labels")) {
        const scratch = [...columnLabels];
        columnLabels = [...rowLabels];
        columnLabels.reverse();
        rowLabels = [...scratch];
        rowLabels.reverse();
    }

    if (edgeLabels?.north !== undefined) {
        assertEdgeLength(edgeLabels.north, width, "north");
    }
    if (edgeLabels?.south !== undefined) {
        assertEdgeLength(edgeLabels.south, width, "south");
    }
    if (edgeLabels?.west !== undefined) {
        assertEdgeLength(edgeLabels.west, height, "west");
    }
    if (edgeLabels?.east !== undefined) {
        assertEdgeLength(edgeLabels.east, height, "east");
    }

    const north = edgeLabels?.north ?? [...columnLabels];
    const south = edgeLabels?.south ?? [...columnLabels];
    const west = edgeLabels?.west ?? [...rowLabels];
    const east = edgeLabels?.east ?? [...rowLabels];

    return { north, south, west, east };
}
