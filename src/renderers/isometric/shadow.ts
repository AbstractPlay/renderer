import { G as SVGG } from "@svgdotjs/svg.js";
import { IsoSymbolPlacement } from "./symbolPlacement";

export const ISO_CONTACT_BLUR_FILTER_ID = "_isoContactBlur";

/** Piece-footprint ellipse, elongated toward the depth axis (down-right). */
export const SHADOW_RX_RATIO = 0.35;
export const SHADOW_RY_RATIO = 0.11;
export const SHADOW_DEPTH_ELONGATION = 1.35;
export const SHADOW_OFFSET_X_RATIO = 0.08;
export const SHADOW_OFFSET_Y_RATIO = 0.1;
export const SHADOW_OPACITY = 0.38;

/** Ensure the shared blur filter exists in defs. */
export const ensureIsoContactBlurFilter = (defsNode: SVGDefsElement): void => {
    if (defsNode.querySelector(`#${ISO_CONTACT_BLUR_FILTER_ID}`) !== null) {
        return;
    }
    const doc = defsNode.ownerDocument;
    const ns = "http://www.w3.org/2000/svg";
    const filter = doc.createElementNS(ns, "filter");
    filter.setAttribute("id", ISO_CONTACT_BLUR_FILTER_ID);
    filter.setAttribute("x", "-50%");
    filter.setAttribute("y", "-50%");
    filter.setAttribute("width", "200%");
    filter.setAttribute("height", "200%");
    const blur = doc.createElementNS(ns, "feGaussianBlur");
    blur.setAttribute("stdDeviation", "2");
    filter.appendChild(blur);
    defsNode.appendChild(filter);
};

/** Draw a soft ground-contact shadow at the piece footprint, offset down-right. */
export const isoContactShadow = (
    group: SVGG,
    placement: IsoSymbolPlacement,
    dyBottomRatio: number,
): void => {
    const contactY = placement.newy + placement.newHeight * dyBottomRatio;
    const contactX = placement.newx + placement.newWidth / 2;
    const footprint = placement.newWidth;
    const offsetX = footprint * SHADOW_OFFSET_X_RATIO;
    const offsetY = footprint * SHADOW_OFFSET_Y_RATIO;
    const rx = footprint * SHADOW_RX_RATIO * SHADOW_DEPTH_ELONGATION;
    const ry = footprint * SHADOW_RY_RATIO;

    group.ellipse(rx * 2, ry * 2)
        .center(contactX + offsetX, contactY + offsetY)
        .fill({ color: "#000", opacity: SHADOW_OPACITY })
        .stroke("none")
        .attr("filter", `url(#${ISO_CONTACT_BLUR_FILTER_ID})`)
        .attr("pointer-events", "none");
};
