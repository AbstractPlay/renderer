import type { Container } from "@svgdotjs/svg.js";

const XLINK_HREF = "http://www.w3.org/1999/xlink";

const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const collectIdElements = (root: globalThis.Element): { id: string; el: globalThis.Element }[] => {
    const out: { id: string; el: globalThis.Element }[] = [];
    const nodes = root.querySelectorAll("[id]");
    for (const el of nodes) {
        const id = el.getAttribute("id");
        if (id !== null && id.length > 0) {
            out.push({ id, el });
        }
    }
    return out;
};

/** Mirror {@link addPrefix} reference rewriting for a single attribute value. */
export const replaceIdRefsInValue = (value: string, oldId: string, newId: string): string => {
    if (value === `#${oldId}`) {
        return `#${newId}`;
    }
    const escaped = escapeRegex(oldId);
    const patterns = [
        new RegExp(`url\\(#${escaped}\\)`, "g"),
        new RegExp(`href="#${escaped}"`, "g"),
        new RegExp(`xlink:href="#${escaped}"`, "g"),
        new RegExp(`"#${escaped}"`, "g"),
        new RegExp(`#${escaped}(?=[\\s\\{\\.\\#\\>\\+\\~\\[\\,\\:])`, "g"),
        new RegExp(`#${escaped}$`, "g"),
    ];
    let out = value;
    for (const regex of patterns) {
        out = out.replace(regex, (match) => {
            if (match.startsWith("#")) {
                return `#${newId}`;
            }
            return match.replace(`#${oldId}`, `#${newId}`);
        });
    }
    return out;
};

const rewriteAttribute = (el: globalThis.Element, name: string, renames: { oldId: string; newId: string }[]): void => {
    const v = el.getAttribute(name);
    if (v === null || v.length === 0) {
        return;
    }
    let next = v;
    for (const { oldId, newId } of renames) {
        next = replaceIdRefsInValue(next, oldId, newId);
    }
    if (next !== v) {
        el.setAttribute(name, next);
    }
};

/** Prefix every `id` in a rendered panel subtree and fix internal references (preserves SVG.js event handlers). */
export const prefixPanelDraw = (root: Container, prefix: string): void => {
    if (prefix.length === 0) {
        return;
    }
    const rootNode = root.node as globalThis.Element;
    const idEntries = collectIdElements(rootNode);
    idEntries.sort((a, b) => b.id.length - a.id.length);

    const renames: { oldId: string; newId: string }[] = [];
    for (const { id, el } of idEntries) {
        if (id.startsWith(prefix)) {
            continue;
        }
        const newId = `${prefix}${id}`;
        el.setAttribute("id", newId);
        renames.push({ oldId: id, newId });
    }

    if (renames.length === 0) {
        return;
    }

    renames.sort((a, b) => b.oldId.length - a.oldId.length);

    const allNodes: globalThis.Element[] = [rootNode];
    for (const el of rootNode.querySelectorAll("*")) {
        allNodes.push(el);
    }
    const attrNames = ["href", "clip-path", "mask", "fill", "stroke", "style", "filter", "marker-start", "marker-end", "marker-mid"];
    for (const el of allNodes) {
        for (const name of attrNames) {
            rewriteAttribute(el, name, renames);
        }
        const xlinkHref = el.getAttributeNS(XLINK_HREF, "href");
        if (xlinkHref !== null && xlinkHref.length > 0) {
            let next = xlinkHref;
            for (const { oldId, newId } of renames) {
                next = replaceIdRefsInValue(next, oldId, newId);
            }
            if (next !== xlinkHref) {
                el.setAttributeNS(XLINK_HREF, "href", next);
            }
        }
    }
};
