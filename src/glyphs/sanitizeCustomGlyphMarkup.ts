import { DOMParser as XmldomParser, XMLSerializer as XmldomSerializer } from "@xmldom/xmldom";

const MAX_MARKUP_LENGTH = 65536;
const MAX_ELEMENTS = 256;
const MAX_PATH_D_LENGTH = 16384;

const ALLOWED_TAGS = new Set([
    "g",
    "path",
    "circle",
    "ellipse",
    "rect",
    "line",
    "polyline",
    "polygon",
]);

const ALLOWED_ATTRS = new Set([
    "d",
    "cx",
    "cy",
    "r",
    "rx",
    "ry",
    "x",
    "y",
    "width",
    "height",
    "points",
    "fill",
    "stroke",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "fill-rule",
    "opacity",
    "fill-opacity",
    "stroke-opacity",
    "transform",
    "data-slot-fill",
    "data-slot-stroke",
    "data-slot",
    "data-context-fill",
    "data-context-stroke",
    "data-context-border",
    "data-context-border-fill",
]);

const FORBIDDEN_TAGS = new Set([
    "script",
    "foreignobject",
    "a",
    "image",
    "use",
    "iframe",
    "style",
    "animate",
    "animatetransform",
    "set",
    "handler",
    "feblend",
    "fecolormatrix",
    "fecomponenttransfer",
    "fecomposite",
    "feconvolvematrix",
    "fediffuselighting",
    "fedisplacementmap",
    "fedistantlight",
    "feflood",
    "fefunca",
    "fefuncb",
    "fefuncg",
    "fefuncr",
    "fegaussianblur",
    "feimage",
    "femerge",
    "femergenode",
    "femorphology",
    "feoffset",
    "fepointlight",
    "fespecularlighting",
    "fespotlight",
    "fetile",
    "feturbulence",
    "filter",
]);

function parseSvgDocument(markup: string): Document {
    if (globalThis.DOMParser !== undefined) {
        return new globalThis.DOMParser().parseFromString(markup, "image/svg+xml");
    }
    return new XmldomParser().parseFromString(markup, "image/svg+xml") as unknown as Document;
}

function elementChildren(el: Element): Element[] {
    const out: Element[] = [];
    for (let i = 0; i < el.childNodes.length; i++) {
        const node = el.childNodes.item(i);
        if (node !== null && node.nodeType === 1) {
            out.push(node as Element);
        }
    }
    return out;
}

function localName(tag: string): string {
    const idx = tag.indexOf(":");
    return (idx >= 0 ? tag.slice(idx + 1) : tag).toLowerCase();
}

function assertAllowedAttr(name: string, defId: string): void {
    const lower = name.toLowerCase();
    if (lower.startsWith("on")) {
        throw new Error(`Custom glyph "${defId}" markup uses forbidden event attribute "${name}".`);
    }
    if (lower === "href" || lower === "xlink:href") {
        throw new Error(`Custom glyph "${defId}" markup uses forbidden link attribute "${name}".`);
    }
    if (lower === "style") {
        throw new Error(`Custom glyph "${defId}" markup uses forbidden style attribute.`);
    }
    if (!ALLOWED_ATTRS.has(lower)) {
        throw new Error(`Custom glyph "${defId}" markup uses forbidden attribute "${name}".`);
    }
}

function walkElement(el: Element, defId: string, count: { n: number }): void {
    count.n += 1;
    if (count.n > MAX_ELEMENTS) {
        throw new Error(`Custom glyph "${defId}" markup exceeds the maximum element count (${MAX_ELEMENTS}).`);
    }
    const tag = localName(el.tagName);
    if (FORBIDDEN_TAGS.has(tag)) {
        throw new Error(`Custom glyph "${defId}" markup contains forbidden element <${tag}>.`);
    }
    if (!ALLOWED_TAGS.has(tag)) {
        throw new Error(`Custom glyph "${defId}" markup contains disallowed element <${tag}>.`);
    }
    if (tag === "path") {
        const d = el.getAttribute("d");
        if (d !== null && d.length > MAX_PATH_D_LENGTH) {
            throw new Error(`Custom glyph "${defId}" path data exceeds maximum length (${MAX_PATH_D_LENGTH}).`);
        }
    }
    const attrs = el.attributes;
    for (let i = 0; i < attrs.length; i++) {
        const attr = attrs.item(i);
        if (attr !== null) {
            assertAllowedAttr(attr.name, defId);
        }
    }
    for (const child of elementChildren(el)) {
        walkElement(child, defId, count);
    }
}

/**
 * Sanitize inner SVG fragment for custom glyph defs. Throws on disallowed content.
 */
export function sanitizeCustomGlyphMarkup(markup: string, defId: string): string {
    if (markup.length > MAX_MARKUP_LENGTH) {
        throw new Error(`Custom glyph "${defId}" markup exceeds maximum length (${MAX_MARKUP_LENGTH}).`);
    }
    const trimmed = markup.trim();
    if (trimmed.length === 0) {
        throw new Error(`Custom glyph "${defId}" markup is empty.`);
    }
    const wrapped = `<svg xmlns="http://www.w3.org/2000/svg">${trimmed}</svg>`;
    const doc = parseSvgDocument(wrapped);
    const root = doc.documentElement;
    if (root === null || localName(root.tagName) !== "svg") {
        throw new Error(`Custom glyph "${defId}" markup could not be parsed.`);
    }
    const count = { n: 0 };
    const rootChildren = elementChildren(root);
    for (const child of rootChildren) {
        walkElement(child, defId, count);
    }
    const parts: string[] = [];
    for (const child of rootChildren) {
        parts.push(serializeElement(child));
    }
    return parts.join("");
}

function serializeElement(el: Element): string {
    const outer = (el as { outerHTML?: string }).outerHTML;
    if (typeof outer === "string" && outer.length > 0) {
        return outer;
    }
    return new XmldomSerializer().serializeToString(el as unknown as import("@xmldom/xmldom").Element);
}
