import type { Element as SvgElement } from "@svgdotjs/svg.js";

/** svg.js `List#find` runs CSS selectors, not `Array#find` — use this for predicates. */
export const findAmong = <T extends SvgElement>(
    nodes: Iterable<T>,
    predicate: (el: T) => boolean,
): T | undefined => [...nodes].find(predicate);

/** Resolved target of an SVG `<use>` (do not use unprefixed `[href=…]` selectors with svgdom). */
export const useReference = (el: SvgElement): string | undefined =>
    (el.attr("href") ?? el.attr("xlink:href")) as string | undefined;

export const findUsesWithReferenceFragment = (
    root: SvgElement,
    fragment: string,
): SvgElement[] =>
    [...root.find("use")].filter((u) => (useReference(u) ?? "").includes(fragment));

export const findUseWithReference = (
    root: SvgElement,
    reference: string,
): SvgElement | undefined =>
    findAmong(root.find("use"), (u) => useReference(u) === reference);
