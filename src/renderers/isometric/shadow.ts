import { G as SVGG } from "@svgdotjs/svg.js";
import { IsoSymbolPlacement } from "./symbolPlacement";

export const ISO_CONTACT_BLUR_FILTER_ID = "_isoContactBlur";

const SHADOW_RX_RATIO = 0.38;
const SHADOW_RY_RATIO = 0.14;
const SHADOW_OFFSET_X_RATIO = 0.02;
const SHADOW_OFFSET_Y_RATIO = 0.03;
const SHADOW_OPACITY = 0.25;

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

/** Draw a soft contact shadow at the piece ground-contact point, offset down-right. */
export const isoContactShadow = (
    group: SVGG,
    placement: IsoSymbolPlacement,
    dyBottomRatio: number,
    cellsize: number,
): void => {
    const contactY = placement.newy + placement.newHeight * dyBottomRatio;
    const contactX = placement.newx + placement.newWidth / 2;
    const offsetX = cellsize * SHADOW_OFFSET_X_RATIO;
    const offsetY = cellsize * SHADOW_OFFSET_Y_RATIO;
    const rx = placement.newWidth * SHADOW_RX_RATIO;
    const ry = placement.newWidth * SHADOW_RY_RATIO;

    group.ellipse(rx * 2, ry * 2)
        .center(contactX + offsetX, contactY + offsetY)
        .fill({ color: "#000", opacity: SHADOW_OPACITY })
        .stroke("none")
        .attr("filter", `url(#${ISO_CONTACT_BLUR_FILTER_ID})`)
        .attr("pointer-events", "none");
};
