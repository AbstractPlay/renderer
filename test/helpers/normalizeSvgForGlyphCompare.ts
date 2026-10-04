import tinycolor from "tinycolor2";

export type GlyphCompareColourContext = {
    strokes: string;
    borders: string;
    fill: string;
    background: string;
    board?: string;
};

const PAINT_TAG =
    "(path|line|polyline|polygon|circle|rect|ellipse|text|g|use)";

function tagHasAttr(attrs: string, name: string): boolean {
    return new RegExp(`\\s${name}=`, "i").test(attrs);
}

/**
 * Legacy CDN SVGs may keep data-context-* markers while newer output inlines resolved paint.
 * Inject missing fill/stroke from the thumbnail colour context so comparisons match visible ink.
 */
function resolveContextPaintMarkers(svg: string, ctx: GlyphCompareColourContext): string {
    let out = svg;
    const inject = (
        dataAttr: string,
        paintAttr: "fill" | "stroke",
        colour: string | undefined,
    ): void => {
        if (colour === undefined) {
            return;
        }
        const re = new RegExp(
            `<${PAINT_TAG}\\b([^>]*\\b${dataAttr}="true"[^>]*)>`,
            "gi",
        );
        out = out.replace(re, (full, tag: string, attrs: string) => {
            if (tagHasAttr(attrs, paintAttr)) {
                return full;
            }
            const escaped = colour.replace(/"/g, "&quot;");
            const selfClosing = attrs.endsWith("/");
            const coreAttrs = selfClosing ? attrs.slice(0, -1) : attrs;
            if (selfClosing) {
                return `<${tag}${coreAttrs} ${paintAttr}="${escaped}"/>`;
            }
            return `<${tag}${coreAttrs} ${paintAttr}="${escaped}">`;
        });
    };

    inject("data-context-stroke", "stroke", ctx.strokes);
    inject("data-context-border", "stroke", ctx.borders);
    inject("data-context-fill", "fill", ctx.fill);
    inject("data-context-background", "fill", ctx.background);
    inject("data-context-border-fill", "fill", ctx.borders);
    inject("data-context-board", "fill", ctx.board);

    return out;
}

function canonicalizePaintColours(svg: string): string {
    return svg.replace(/\s(fill|stroke)="([^"]+)"/gi, (match, attr: string, val: string) => {
        if (val.startsWith("url(") || val === "none" || val === "currentColor") {
            return match;
        }
        const c = tinycolor(val);
        if (!c.isValid()) {
            return match;
        }
        return ` ${attr}="${c.toHexString()}"`;
    });
}

function stripNonVisualDataAttrs(svg: string): string {
    let out = svg;
    out = out.replace(/\sdata-context-[a-z0-9-]+(?:="[^"]*"|=\s*true)/gi, "");
    out = out.replace(
        /\sdata-(?:playerfill2?|playerstroke2?|slot-fill|slot-stroke|slot|orb-specular)(?:="[^"]*"|=\s*true)/gi,
        "",
    );
    return out;
}

function sortOpeningTagAttributes(svg: string): string {
    return svg.replace(/<([a-zA-Z][\w:-]*)\b([^>]*)(\/?)>/g, (full, tag: string, attrs: string, slash: string) => {
        const trimmed = attrs.trim();
        if (trimmed.length === 0) {
            return full;
        }
        const pairs = [...trimmed.matchAll(/([\w:-]+="[^"]*")/g)].map((m) => m[1]!).sort();
        const body = pairs.join(" ");
        if (slash.length > 0) {
            return `<${tag} ${body}/>`;
        }
        return `<${tag} ${body}>`;
    });
}

/**
 * Strips volatile ids; optionally lenient on opacity-related attributes.
 */
export function normalizeSvgForGlyphCompare(
    svg: string,
    opts: {
        lenientOpacity?: boolean;
        lenientGradientIds?: boolean;
        colourContext?: GlyphCompareColourContext;
    } = {},
): string {
    let out = svg;
    if (opts.colourContext) {
        out = resolveContextPaintMarkers(out, opts.colourContext);
    }
    out = out.replace(/\bid="aprender-glyph-[^"]+"/g, 'id="glyph"');
    out = out.replace(/xlink:href="#aprender-glyph-[^"]+"/g, 'xlink:href="#glyph"');
    out = out.replace(/href="#aprender-glyph-[^"]+"/g, 'href="#glyph"');
    out = out.replace(/\bid="glyph[^"]*"/g, 'id="glyph"');
    out = out.replace(/href="#glyph[^"]*"/g, 'href="#glyph"');
    out = out.replace(/xlink:href="#glyph[^"]*"/g, 'xlink:href="#glyph"');
    if (opts.lenientOpacity) {
        out = out.replace(/\sopacity="[^"]*"/g, "");
        out = out.replace(/\sfill-opacity="[^"]*"/g, "");
        out = out.replace(/\sstroke-opacity="[^"]*"/g, "");
    }
    if (opts.lenientGradientIds) {
        out = out.replace(/\bid="radialGradient[^"]*"/g, 'id="grad"');
        out = out.replace(/\bid="radialGradient2[^"]*"/g, 'id="grad2"');
        out = out.replace(/\bid="radialGradient3[^"]*"/g, 'id="grad3"');
        out = out.replace(/url\(#radialGradient[^)]*\)/g, "url(#grad)");
        out = out.replace(/url\(#radialGradient2[^)]*\)/g, "url(#grad2)");
        out = out.replace(/url\(#radialGradient3[^)]*\)/g, "url(#grad3)");
    }
    out = stripNonVisualDataAttrs(out);
    out = canonicalizePaintColours(out);
    out = sortOpeningTagAttributes(out);
    return out.replace(/\s+/g, " ").trim();
}
