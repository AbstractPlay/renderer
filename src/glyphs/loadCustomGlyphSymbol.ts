import type { Svg, Symbol as SVGSymbol } from "@svgdotjs/svg.js";
import type { GlyphDefsEntry } from "../schemas/schema.js";
import { sanitizeCustomGlyphMarkup } from "./sanitizeCustomGlyphMarkup.js";

export function buildCustomGlyphSymbol(
    entry: GlyphDefsEntry,
    defId: string,
    canvas: Svg,
): SVGSymbol {
    const [minX, minY, w, h] = entry.viewBox;
    if (w <= 0 || h <= 0) {
        throw new Error(`Custom glyph "${defId}" has an invalid viewBox width or height.`);
    }
    const sanitized = sanitizeCustomGlyphMarkup(entry.markup, defId);
    const sym = canvas.defs().symbol();
    sym.viewbox(minX, minY, w, h);
    sym.svg(sanitized);
    sym.attr("data-cellsize", Math.max(w, h));
    return sym;
}
