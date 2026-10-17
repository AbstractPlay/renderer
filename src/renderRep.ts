import { G as SVGG, NumberAlias, SVG, Svg } from "@svgdotjs/svg.js";
import type { ErrorObject, ValidateFunction } from "ajv";
import { renderers } from "./renderers/index.js";
import type { APRenderRep } from "./schemas/schema.js";
import { findUsesWithReferenceFragment } from "./utils/svgUseQuery.js";
import type { IRenderOptions } from "./renderOptions.js";

const MOZILLA_VIEWBOX_PAD = 2;

type LayoutBox = { x: number; y: number; x2: number; y2: number };

const unionLayoutExtents = (a: LayoutBox, b: { x: number; y: number; x2?: number; y2?: number; width?: number; height?: number }): LayoutBox => {
    const bx2 = b.x2 ?? (b.x + (b.width ?? 0));
    const by2 = b.y2 ?? (b.y + (b.height ?? 0));
    return {
        x: Math.min(a.x, b.x),
        y: Math.min(a.y, b.y),
        x2: Math.max(a.x2, bx2),
        y2: Math.max(a.y2, by2),
    };
};

/** Union root bbox with #board-tableau and track <use> instances for auto viewBox. */
export const unionLayoutBBox = (draw: Svg): { x: number; y: number; width: number; height: number } => {
    const rootBox = draw.bbox();
    let union: LayoutBox = { x: rootBox.x, y: rootBox.y, x2: rootBox.x2, y2: rootBox.y2 };

    const tableau = draw.findOne("#board-tableau") as SVGG | null;
    if (tableau !== null) {
        union = unionLayoutExtents(union, tableau.rbox(draw));
    }

    const trackUses = findUsesWithReferenceFragment(draw, "_track_");
    for (const use of trackUses) {
        const x = Number(use.x());
        const y = Number(use.y());
        const w = Number(use.width());
        const h = Number(use.height());
        if (w > 0 && h > 0) {
            union = unionLayoutExtents(union, { x, y, width: w, height: h });
        }
    }

    return { x: union.x, y: union.y, width: union.x2 - union.x, height: union.y2 - union.y };
};

export const formatAJVErrors = (errors: ErrorObject[]): string => {
    const msgs: string[] = [];
    for (const e of errors) {
        msgs.push(`The element "${e.instancePath}" "${e.message}".`);
    }
    return msgs.join("\n");
};

export const renderRep = (
    json: APRenderRep,
    opts: IRenderOptions,
    validate: ValidateFunction,
): Svg => {
    if (!validate(json)) {
        throw new Error(`The json object you submitted does not validate against the established schema. The validator said the following:\n${formatAJVErrors(validate.errors ?? [])}`);
    }

    let draw: Svg;
    if (("target" in opts) && (opts.target != null)) {
        draw = opts.target;
    } else if (("divelem" in opts) && (opts.divelem != null)) {
        let height: NumberAlias = "100%";
        let width: NumberAlias = "100%";
        if (("height" in opts) && (opts.height !== null) && (opts.height !== undefined)) {
            height = opts.height;
        }
        if (("width" in opts) && (opts.width !== null) && (opts.width !== undefined)) {
            width = opts.width;
        }
        let svgid = "_apstatic";
        if (("svgid" in opts) && (opts.svgid !== undefined) && (opts.svgid.length > 0)) {
            svgid = opts.svgid;
        }
        draw = SVG().addTo(opts.divelem).size(width, height).id(svgid);
    } else {
        let height: NumberAlias = "100%";
        let width: NumberAlias = "100%";
        if (("height" in opts) && (opts.height !== null) && (opts.height !== undefined)) {
            height = opts.height;
        }
        if (("width" in opts) && (opts.width !== null) && (opts.width !== undefined)) {
            width = opts.width;
        }
        let svgid = "_aprender";
        if (("svgid" in opts) && (opts.svgid !== undefined) && (opts.svgid.length > 0)) {
            svgid = opts.svgid;
        }
        if (opts.divid === undefined) {
            throw new Error("No target for the rendered SVG was given.");
        }
        draw = SVG().addTo("#" + opts.divid).size(width, height).id(svgid);
    }

    let boardClick: (row: number, col: number, piece: string) => void = () => undefined;
    if (("boardClick" in opts) && (opts.boardClick != null)) {
        boardClick = opts.boardClick;
    }

    let boardHover: (row: number, col: number, piece: string) => void = () => undefined;
    if (("boardHover" in opts) && (opts.boardHover != null)) {
        boardHover = opts.boardHover;
    }

    const rep = { ...json };
    if ((rep.renderer === undefined) || (rep.renderer === null)) {
        rep.renderer = "default";
    }

    const renderer = renderers(rep.renderer as string);
    if ((renderer === undefined) || (renderer === null)) {
        throw new Error(`Could not find the renderer "${rep.renderer}".`);
    }
    renderer.render(rep, draw, {
        sheets: opts.sheets,
        patterns: opts.patterns,
        patternList: opts.patternList,
        colourBlind: opts.colourBlind,
        colours: opts.colours,
        coloursGlobal: opts.coloursGlobal,
        colourContext: opts.colourContext,
        contextGlobal: opts.contextGlobal,
        rotate: opts.rotate,
        showAnnotations: opts.showAnnotations,
        boardClick,
        boardHover,
        glyphmap: opts.glyphmap,
        staticAnimations: opts.staticAnimations ?? false,
        sanitizeMode: opts.sanitizeMode,
    });
    if (draw.bbox().h !== 0
        && draw.viewbox().h === 0
    ) {
        const box = unionLayoutBBox(draw);
        const pad = MOZILLA_VIEWBOX_PAD;
        draw.viewbox(box.x - pad, box.y - pad, box.width + (pad * 2), box.height + (pad * 2));
    }
    return draw;
};
