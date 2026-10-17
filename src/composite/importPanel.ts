import type { Container } from "@svgdotjs/svg.js";
import { addPrefix } from "../addPrefix.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";

const innerSvgMarkup = (svgString: string): string => {
    const match = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
    return match ? match[1]! : svgString;
};

export const panelIdPrefix = (panelId: string): string => {
    const safe = panelId.replace(/[^a-zA-Z0-9_-]/g, "_");
    return `_p_${safe}_`;
};

/** Prefix panel ids and append markup as direct children of `parent` (no nested viewport). */
export const importPrefixedPanelSvg = (parent: Container, panelSvgString: string, panelId: string): void => {
    const prefixed = addPrefix(panelSvgString, { prefix: panelIdPrefix(panelId) });
    const inner = innerSvgMarkup(prefixed);
    const wrapped = `<g xmlns="${SVG_NS}" xmlns:xlink="${XLINK_NS}">${inner}</g>`;
    parent.svg(wrapped);
};
