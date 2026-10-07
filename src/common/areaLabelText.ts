import type { Container, Svg, Text } from "@svgdotjs/svg.js";

export interface TextInkFont {
    size: number;
    anchor: "start" | "middle" | "end";
    fill: string;
}

/**
 * Place label text so the probed ink box top edge sits at `inkTop`, without `dominant-baseline`
 * or `dy` on tspans. Uses `dy`/`dx` once from `bbox()` in the current document (browser or svgdom).
 */
export const placeTextInkTop = (
    parent: Container,
    text: string,
    x: number,
    inkTop: number,
    font: TextInkFont,
    className?: string,
): Text => {
    const el = parent.text(text);
    if (className !== undefined) {
        el.addClass(className);
    }
    el.font(font);
    el.amove(x, 0);
    let box = el.bbox();
    el.dy(inkTop - box.y);
    box = el.bbox();
    if (font.anchor === "middle") {
        el.dx(x - box.cx);
    } else if (font.anchor === "end") {
        el.dx(x - box.x2);
    } else {
        el.dx(x - box.x);
    }
    return el;
};

/** Padding above title ink and below ink before piece rows (fraction of font size). */
export const AREA_TITLE_PAD_EM = 0.08;

export interface MeasureAreaTitleResult {
    width: number;
    height: number;
}

export const measureAreaTitle = (
    probeRoot: Svg,
    text: string,
    fontSize: number,
    fill: string,
): MeasureAreaTitleResult => {
    const tmptxt = probeRoot.text(text).font({ size: fontSize, anchor: "start", fill });
    const box = tmptxt.bbox();
    tmptxt.remove();
    return { width: box.w, height: box.h };
};

/** Vertical space reserved for an area title: top pad + probed ink + gap before content. */
export const areaTitleBand = (probedInkHeight: number, fontSize: number): number => {
    const pad = fontSize * AREA_TITLE_PAD_EM;
    return pad + probedInkHeight + pad;
};

export interface PlaceAreaTitleInBandOptions {
    fontSize: number;
    fill: string;
    className?: string;
    x?: number;
}

export interface PlaceAreaTitleResult {
    element: Text;
    textWidth: number;
    titleBand: number;
}

/** Area title in a reserved top band sized from probed ink height. */
export const placeAreaTitleInBand = (
    probeRoot: Svg,
    parent: Container,
    text: string,
    options: PlaceAreaTitleInBandOptions,
): PlaceAreaTitleResult => {
    const {
        fontSize,
        fill,
        className = "aprender-area-label",
        x = 0,
    } = options;
    const measured = measureAreaTitle(probeRoot, text, fontSize, fill);
    const titleBand = areaTitleBand(measured.height, fontSize);
    const pad = fontSize * AREA_TITLE_PAD_EM;
    const el = placeTextInkTop(parent, text, x, pad, {
        size: fontSize,
        anchor: "start",
        fill,
    }, className);
    return { element: el, textWidth: measured.width, titleBand };
};

export interface PlaceAreaTitleAtOptions {
    fontSize: number;
    fill: string;
    x: number;
    y: number;
    className?: string;
}

/** Fixed-position area label (e.g. homeworlds system name) with ink top at `y + pad`. */
export const placeAreaTitleAt = (
    probeRoot: Svg,
    parent: Container,
    text: string,
    options: PlaceAreaTitleAtOptions,
): { element: Text; textWidth: number } => {
    const {
        fontSize,
        fill,
        x,
        y,
        className = "aprender-area-label",
    } = options;
    const measured = measureAreaTitle(probeRoot, text, fontSize, fill);
    const pad = fontSize * AREA_TITLE_PAD_EM;
    const el = placeTextInkTop(parent, text, x, y + pad, {
        size: fontSize,
        anchor: "start",
        fill,
    }, className);
    return { element: el, textWidth: measured.width };
};
