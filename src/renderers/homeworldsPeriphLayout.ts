import type { Svg } from "@svgdotjs/svg.js";
import type { HomeworldsSystemLayout } from "../schemas/schema.js";

export type PeriphLayoutAxis = "row" | "column";

export interface PeriphSystemLayout {
    name: string;
    boardIndex: number;
    layout: HomeworldsSystemLayout;
}

type Seat = "N" | "E" | "S" | "W";

type Edge = "top" | "right" | "bottom" | "left";

function effectiveSeat(seat: Seat, deg: number): Seat {
    const clockwise: Seat[] = ["N", "E", "S", "W"];
    deg = deg % 360;
    while (deg < 0) { deg += 360; }
    const moves = deg / 90;
    let idx = clockwise.indexOf(seat);
    idx = (idx + moves) % 4;
    return clockwise[idx];
}

function seatAdjoiningPeriphEdge(rotation: number, seat: Seat): Edge {
    const visual = effectiveSeat(seat, rotation);
    switch (visual) {
        case "N":
            return "top";
        case "E":
            return "right";
        case "S":
            return "bottom";
        case "W":
            return "left";
        default:
            return "top";
    }
}

export function layoutAxis(layout: HomeworldsSystemLayout | undefined): PeriphLayoutAxis | null {
    if (layout === undefined) {
        return null;
    }
    const hasRow = "row" in layout && layout.row !== undefined;
    const hasCol = "column" in layout && layout.column !== undefined;
    if (hasRow && !hasCol) {
        return "row";
    }
    if (hasCol && !hasRow) {
        return "column";
    }
    return null;
}

export function resolveExplicitPeriphLayoutAxis(
    systems: { layout?: HomeworldsSystemLayout }[],
): PeriphLayoutAxis | null {
    if (systems.length === 0) {
        return null;
    }
    const axes = systems.map((s) => layoutAxis(s.layout));
    if (axes.some((a) => a === null)) {
        return null;
    }
    const first = axes[0]!;
    if (!axes.every((a) => a === first)) {
        return null;
    }
    return first;
}

function layoutOrder(sys: PeriphSystemLayout): number {
    if ("order" in sys.layout && sys.layout.order !== undefined) {
        return sys.layout.order;
    }
    return sys.boardIndex;
}

function bandIndex(sys: PeriphSystemLayout, mode: PeriphLayoutAxis): number {
    if (mode === "row") {
        return (sys.layout as { row: number }).row;
    }
    return (sys.layout as { column: number }).column;
}

function systemSize(rootSvg: Svg, name: string): { w: number; h: number } {
    const system = rootSvg.findOne(`#_sysPeriph_${name}`) as Svg;
    if (system === null || system === undefined) {
        throw new Error(`Could not find the requested system (#_sysPeriph_${name}). This should never happen`);
    }
    return { w: system.width() as number, h: system.height() as number };
}

function stackAxisOrigin(
    nEdge: Edge,
    stackOffset: number,
    totalStack: number,
    bandStack: number,
): { x: number; y: number } {
    switch (nEdge) {
        case "top":
            return { x: 0, y: stackOffset };
        case "bottom":
            return { x: 0, y: totalStack - stackOffset - bandStack };
        case "left":
            return { x: stackOffset, y: 0 };
        case "right":
            return { x: totalStack - stackOffset - bandStack, y: 0 };
        default:
            return { x: 0, y: stackOffset };
    }
}

/**
 * Place peripheral systems using explicit row or column layout in seat frame.
 * Within-band order is screen LTR (row mode) or TTB (column mode).
 */
export function placeExplicitPeriphSystems(
    rootSvg: Svg,
    systems: PeriphSystemLayout[],
    mode: PeriphLayoutAxis,
    rotation: number,
    vbuffer: number,
    hbuffer: number,
): { width: number; height: number } {
    const groups = new Map<number, PeriphSystemLayout[]>();
    for (const sys of systems) {
        const idx = bandIndex(sys, mode);
        const list = groups.get(idx) ?? [];
        list.push(sys);
        groups.set(idx, list);
    }
    const bandIndices = [...groups.keys()].sort((a, b) => a - b);

    const nEdge = mode === "row"
        ? seatAdjoiningPeriphEdge(rotation, "N")
        : seatAdjoiningPeriphEdge(rotation, "W");

    const bandStackSpans = new Map<number, number>();
    const bandPrimarySpans = new Map<number, number>();

    for (const idx of bandIndices) {
        const list = groups.get(idx)!;
        list.sort((a, b) => layoutOrder(a) - layoutOrder(b));
        let stackSpan = 0;
        let primarySpan = 0;
        if (mode === "row") {
            for (const sys of list) {
                const { w, h } = systemSize(rootSvg, sys.name);
                stackSpan = Math.max(stackSpan, h);
                if (primarySpan > 0) {
                    primarySpan += hbuffer;
                }
                primarySpan += w;
            }
        } else {
            for (const sys of list) {
                const { w, h } = systemSize(rootSvg, sys.name);
                stackSpan = Math.max(stackSpan, w);
                if (primarySpan > 0) {
                    primarySpan += vbuffer;
                }
                primarySpan += h;
            }
        }
        bandStackSpans.set(idx, stackSpan);
        bandPrimarySpans.set(idx, primarySpan);
    }

    let totalStack = 0;
    for (let i = 0; i < bandIndices.length; i++) {
        if (i > 0) {
            totalStack += mode === "row" ? vbuffer : hbuffer;
        }
        totalStack += bandStackSpans.get(bandIndices[i]!)!;
    }

    let totalPrimary = 0;
    for (const idx of bandIndices) {
        totalPrimary = Math.max(totalPrimary, bandPrimarySpans.get(idx)!);
    }

    let stackOffset = 0;
    for (const idx of bandIndices) {
        const list = groups.get(idx)!;
        const bandStack = bandStackSpans.get(idx)!;
        const bandOrigin = stackAxisOrigin(nEdge, stackOffset, totalStack, bandStack);

        let alongPrimary = 0;
        for (const sys of list) {
            const { w, h } = systemSize(rootSvg, sys.name);
            const system = rootSvg.findOne(`#_sysPeriph_${sys.name}`) as Svg;

            let x: number;
            let y: number;
            if (mode === "row") {
                const centerDy = (bandStack - h) / 2;
                x = bandOrigin.x + alongPrimary;
                y = bandOrigin.y + centerDy;
                alongPrimary += w + hbuffer;
            } else {
                const centerDx = (bandStack - w) / 2;
                x = bandOrigin.x + centerDx;
                y = bandOrigin.y + alongPrimary;
                alongPrimary += h + vbuffer;
            }
            system.dmove(x, y);
        }

        stackOffset += bandStack + (mode === "row" ? vbuffer : hbuffer);
    }

    const blockW = mode === "row" ? totalPrimary : totalStack;
    const blockH = mode === "row" ? totalStack : totalPrimary;
    return { width: blockW, height: blockH };
}
