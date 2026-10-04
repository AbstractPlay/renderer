import type { Element as SVGElement, Symbol as SVGSymbol } from "@svgdotjs/svg.js";
import type { Colour2Slot } from "../../renderers/glyphPaint.js";
import type { SlotChannel, SlotMeta } from "./glyphDefinition.js";

function attrPresent(el: SVGElement, name: string): boolean {
    const v = el.attr(name);
    if (v === null || v === undefined || v === false) {
        return false;
    }
    if (v === true || v === "") {
        return true;
    }
    return String(v).toLowerCase() === "true";
}

function slotAttr(el: SVGElement, dataAttr: "data-slot-fill" | "data-slot-stroke" | "data-slot"): string | undefined {
    const v = el.attr(dataAttr);
    if (v === null || v === undefined || v === false) {
        return undefined;
    }
    const s = String(v).trim();
    return s.length > 0 ? s : undefined;
}

function addChannel(slots: Map<string, Set<SlotChannel>>, slot: string, channel: SlotChannel): void {
    let set = slots.get(slot);
    if (set === undefined) {
        set = new Set();
        slots.set(slot, set);
    }
    set.add(channel);
}

function mergeSlotMaps(
    inferred: Map<string, Set<SlotChannel>>,
    explicit: Record<string, SlotMeta> | undefined,
): Record<string, SlotMeta> {
    const out: Record<string, SlotMeta> = {};
    for (const [slot, channels] of inferred) {
        out[slot] = { channels: [...channels].sort() as SlotChannel[] };
    }
    if (explicit !== undefined) {
        for (const [slot, meta] of Object.entries(explicit)) {
            out[slot] = {
                description: meta.description ?? out[slot]?.description,
                channels: meta.channels.length > 0 ? meta.channels : (out[slot]?.channels ?? ["fill"]),
            };
        }
    }
    return out;
}

/**
 * Infer paint slots from built symbol markup (legacy attrs and data-slot-*).
 */
export function inferSlotsFromSymbol(
    symbol: SVGSymbol,
    colour2Slot: Colour2Slot,
): Record<string, SlotMeta> {
    const inferred = new Map<string, Set<SlotChannel>>();

    symbol.find("*").each(function (this: SVGElement) {
        const slotFill = slotAttr(this, "data-slot-fill");
        if (slotFill !== undefined) {
            addChannel(inferred, slotFill, "fill");
        }
        const slotStroke = slotAttr(this, "data-slot-stroke");
        if (slotStroke !== undefined) {
            addChannel(inferred, slotStroke, "stroke");
        }
        const slotBoth = slotAttr(this, "data-slot");
        if (slotBoth !== undefined) {
            addChannel(inferred, slotBoth, "fill");
            addChannel(inferred, slotBoth, "stroke");
        }

        if (attrPresent(this, "data-playerfill")) {
            addChannel(inferred, "fill", "fill");
        }
        if (attrPresent(this, "data-playerstroke")) {
            addChannel(inferred, "fill", "stroke");
        }
        if (attrPresent(this, "data-playerfill2")) {
            addChannel(inferred, colour2Slot, "fill");
        }
        if (attrPresent(this, "data-playerstroke2")) {
            addChannel(inferred, colour2Slot, "stroke");
        }
        if (attrPresent(this, "data-context-border")) {
            addChannel(inferred, "border", "stroke");
        }
        if (attrPresent(this, "data-context-border-fill")) {
            addChannel(inferred, "border", "fill");
        }
    });

    return mergeSlotMaps(inferred, undefined);
}

export function mergeExplicitSlots(
    inferred: Record<string, SlotMeta>,
    explicit: Record<string, SlotMeta> | undefined,
): Record<string, SlotMeta> {
    if (explicit === undefined) {
        return inferred;
    }
    const out = { ...inferred };
    for (const [slot, meta] of Object.entries(explicit)) {
        out[slot] = {
            description: meta.description ?? out[slot]?.description,
            channels: meta.channels,
        };
    }
    return out;
}
