import type { Element, Svg } from "@svgdotjs/svg.js";
import type { APRenderRep, AreaKey } from "../schemas/schema.js";

export type KeyAreaClickMeta = {
    x: number;
    y: number;
    width: number;
    height: number;
    /** Payload passed to `boardClick(-1, -1, piece)` per row (name or value). */
    values: string[];
};

const keyAreaFromRender = (render: APRenderRep): AreaKey | undefined => {
    const areas = render.areas;
    if (!Array.isArray(areas)) {
        return undefined;
    }
    const keys = areas.filter((a): a is AreaKey => a.type === "key");
    if (keys.length !== 1) {
        return undefined;
    }
    const key = keys[0];
    if (key.clickable === false) {
        return undefined;
    }
    return key;
};

const findKeyUseElement = (draw: Svg): Element | null => {
    const uses = draw.find("use");
    for (const el of uses) {
        const href = el.attr("href") ?? el.attr("xlink:href");
        if (typeof href === "string" && href.includes("_key")) {
            return el;
        }
    }
    return null;
};

/** Measure the clickable key bar from a freshly rendered panel (no `boardClick` handlers required). */
export const captureKeyAreaClickMeta = (
    draw: Svg,
    render: APRenderRep,
): KeyAreaClickMeta | undefined => {
    const key = keyAreaFromRender(render);
    if (key === undefined) {
        return undefined;
    }
    const keyUse = findKeyUseElement(draw);
    if (keyUse === null) {
        return undefined;
    }
    const box = keyUse.rbox(draw);
    if (!Number.isFinite(box.width) || !Number.isFinite(box.height) || box.width <= 0 || box.height <= 0) {
        return undefined;
    }
    const values = key.list.map((entry) => {
        if (entry.value !== undefined) {
            return entry.value;
        }
        return entry.name;
    });
    if (values.length === 0) {
        return undefined;
    }
    return {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        values,
    };
};
