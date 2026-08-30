/**
 * A library for building images of game boards
 *
 * @remarks
 * Given a valid JSON file (see {@link APRenderRep}) and necessary options (see {@link IRenderOptions}), the library
 * will produce an SVG file.
 *
 * @packageDocumentation
 */

import { Element as SVGElement, G as SVGG, NumberAlias, SVG, Svg } from "@svgdotjs/svg.js";
import AjvImport from "ajv";
import type { ErrorObject, ValidateFunction } from "ajv";
import { renderers } from "./renderers/index.js";
import { sheets } from "./sheets/index.js";
export { sheets };
import { IRendererOptionsIn } from "./renderers/_base.js";
import { APRenderRep, Glyph, PositiveInteger, Colourstrings, Stashstrings, Colourfuncs } from "./schemas/schema.js";
import schema from "./schemas/schema.json" with { type: "json" };
import { v4 as uuidv4 } from "uuid";

type AjvInstance = {
    compile(jsonSchema: object): ValidateFunction;
};
const ajvCtor = AjvImport as unknown as new () => AjvInstance;
const ajv = new ajvCtor();
const validate = ajv.compile(schema);

export type {IRendererOptionsIn, APRenderRep, Glyph, PositiveInteger, Colourstrings, Stashstrings};

/**
 * Defines the options the renderer accepts. It includes all the options the renderer class needs ({@link IRendererOptionsIn})
 * as well as a few that the layout front-end needs.
 * @beta
 */
export interface IRenderOptions extends IRendererOptionsIn {
    /**
     * The string ID of the DOM element into which you want the SVG rendered. This is most typically a `<div>` tag.
     * This is the preferred way of outputting the SVG.
     *
     */
    divid?: string;
    /**
     * You can also pass the HTML element itself.
     *
     */
    divelem?: HTMLElement;
    /**
     * In some special cases, you already have an SVG and want the renderer to do its thing inside of it.
     * In that case, pass the Svg object.
     *
     */
    target?: Svg;
    /**
     * The width of the final SVG. This can be a string (representing something like a percentage).
     * See the SVG.js docs for details.
     *
     */
    width?: NumberAlias;
    /**
     * The height of the final SVG. This can be a string (representing something like a percentage).
     * See the SVG.js docs for details.
     *
     */
    height?: NumberAlias;
    /**
     * The string DOM ID you want the final output out be given.
     *
     */
    svgid?: string;
    /**
     * A string that will be prepended to all ids to prevent collisions.
     * Gets added to the final rendered SVG via search/replace.
     * Only works with static rendering.
     */
    prefix?: string;
}

export const addPrefix = (svg: string, opts = {} as IRenderOptions): string => {
    const escapeRegex = (str: string): string => {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    if (opts.prefix !== undefined) {
        const prefix = opts.prefix;
        // Regex to find all id="something"
        const idRegex = /id="([^"]+)"/g;

        // Collect all IDs
        const ids: string[] = [];
        let match: RegExpExecArray | null;
        while ((match = idRegex.exec(svg)) !== null) {
            ids.push(match[1]);
        }

        ids.sort((a, b) => b.length - a.length);

        // For each ID, replace both the definition and references
        ids.forEach((id) => {
            const newId = `${prefix}${id}`;
            const escapedId = escapeRegex(id);

            // Replace the id definition
            const idDefRegex = new RegExp(`id="${escapedId}"`, "g");
            svg = svg.replace(idDefRegex, `id="${newId}"`);

            // Replace references: url(#id), href="#id", xlink:href="#id"
            const refPatterns = [
            new RegExp(`url\\(#${escapedId}\\)`, "g"),
            new RegExp(`href="#${escapedId}"`, "g"),
            new RegExp(`xlink:href="#${escapedId}"`, "g"),
            new RegExp(`"#${escapedId}"`, "g"), // handles cases like begin="0s;id.end"
            ];

            refPatterns.forEach((regex) => {
                svg = svg.replace(regex, (match) => match.replace(`#${id}`, `#${newId}`));
            });
        });
    }
    return svg;
}

/**
 * The intent was to produce human-readable and actionable error messages. This has proven difficult thus far.
 * Something to work on in the future.
 *
 * @param errors - List of validation errors
 * @returns A formatted string representing the errors
 */
const formatAJVErrors = (errors: ErrorObject[]): string => {
    const msgs: string[] = [];
    for (const e of errors) {
        msgs.push(`The element "${e.instancePath}" "${e.message}".`)
    }
    return msgs.join("\n");
}

/**
 * Creates a detached DOM element into which the image is rendered unseen.
 * It returns the resulting SVG code. Useful in things like React functional components.
 *
 * @param json - The parsed JSON to render
 * @param opts - The list of renderer options
 * @returns A string containing a valid `<svg>` tag
 * @beta
 */
export const renderStatic = (json: APRenderRep, opts = {} as IRenderOptions): string => {
    const node = document.createElement("div");
    document.body.appendChild(node); // temporarily attach
    const uid = uuidv4();
    node.setAttribute("id", uid);
    opts.divelem = node;
    const canvas = render(json, opts);
    const svgString = addPrefix(canvas.svg(), opts);
    document.body.removeChild(node); // clean up
    return svgString;
}

/**
 * A helper function for producing code for a single glyph, intended to then be used inline.
 *
 * @param glyphid - The name of the glyph to render
 * @param colour - The fill colour, either a hex string or player number
 * @param opts - The list of renderer options
 * @returns A string containing a valid `<svg>` tag
 * @beta
 */
export const renderglyph = (glyphid: string, colour: number | string | Colourfuncs, opts = {} as IRenderOptions): string => {
    const obj: APRenderRep = {
        board: null,
        legend: {
            A: {
                name: glyphid,
                colour,
            },
        },
        pieces: "A",
    };
    const node = document.createElement("div");
    const uid = uuidv4();
    node.setAttribute("id", uid);
    opts.divelem = node;
    const canvas = render(obj, opts);
    return addPrefix(canvas.svg(), opts);
}

/**
 * This is the primary function. Render an image based on the JSON and options
 *
 * @param json - The parsed JSON to render
 * @param opts - The list of renderer options
 * @returns A valid SVG.js Svg object
 * @beta
 */
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
const unionLayoutBBox = (draw: Svg): { x: number; y: number; width: number; height: number } => {
    const rootBox = draw.bbox();
    let union: LayoutBox = { x: rootBox.x, y: rootBox.y, x2: rootBox.x2, y2: rootBox.y2 };

    const tableau = draw.findOne("#board-tableau") as SVGG | null;
    if (tableau !== null) {
        union = unionLayoutExtents(union, tableau.rbox(draw));
    }

    const trackUses = draw.find('[href*="_track_"]') as unknown as SVGElement[];
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

export const render = (json: APRenderRep, opts = {} as IRenderOptions): Svg => {
    // Validate the JSON
    if (! validate(json)) {
        throw new Error(`The json object you submitted does not validate against the established schema. The validator said the following:\n${formatAJVErrors(validate.errors ?? [])}`);
    }

    // Initialize the SVG container
    let draw: Svg;
    if ( ("target" in opts) && (opts.target != null) ) {
        draw = opts.target;
    } else if ( ("divelem" in opts) && (opts.divelem != null) ) {
        let height: NumberAlias = "100%";
        let width: NumberAlias = "100%";
        if ( ("height" in opts) && (opts.height !== null) && (opts.height !== undefined) ) {
            height = opts.height;
        }
        if ( ("width" in opts) && (opts.width !== null) && (opts.width !== undefined) ) {
            width = opts.width;
        }
        let svgid = "_apstatic";
        if ( ("svgid" in opts) && (opts.svgid !== undefined) && (opts.svgid.length > 0) ) {
            svgid = opts.svgid;
        }
        draw = SVG().addTo(opts.divelem).size(width, height).id(svgid);
    } else {
        let height: NumberAlias = "100%";
        let width: NumberAlias = "100%";
        if ( ("height" in opts) && (opts.height !== null) && (opts.height !== undefined) ) {
            height = opts.height;
        }
        if ( ("width" in opts) && (opts.width !== null) && (opts.width !== undefined) ) {
            width = opts.width;
        }
        let svgid = "_aprender";
        if ( ("svgid" in opts) && (opts.svgid !== undefined) && (opts.svgid.length > 0) ) {
            svgid = opts.svgid;
        }
        if (opts.divid === undefined) {
            throw new Error("No target for the rendered SVG was given.");
        }
        draw = SVG().addTo("#" + opts.divid).size(width, height).id(svgid);
    }

    let boardClick: (row: number, col: number, piece: string) => void = () => undefined;
    if (("boardClick" in opts) && (opts.boardClick != null) ) {
        boardClick = opts.boardClick;
    }

    let boardHover: (row: number, col: number, piece: string) => void = () => undefined;
    if (("boardHover" in opts) && (opts.boardHover != null) ) {
        boardHover = opts.boardHover;
    }

    // Pass the JSON and the SVG container to the appropriate renderer
    if ( (json.renderer === undefined) || (json.renderer === null) ) {
        json.renderer = "default";
    }

    const renderer = renderers(json.renderer as string);
    if ( (renderer === undefined) || (renderer === null) ) {
        throw new Error(`Could not find the renderer "${ json.renderer }".`);
    }
    renderer.render(json, draw, {sheets: opts.sheets, patterns: opts.patterns, patternList: opts.patternList, colourBlind: opts.colourBlind, colours: opts.colours, coloursGlobal: opts.coloursGlobal, colourContext: opts.colourContext, contextGlobal: opts.contextGlobal, rotate: opts.rotate, showAnnotations: opts.showAnnotations, boardClick, boardHover, glyphmap: opts.glyphmap,});
    if (draw.bbox().h !== 0
        && draw.viewbox().h === 0  // Only set it here if the renderer didn't set it
        ) {
        // Important: Mozilla browsers include stroke widths where other browsers do not.
        const box = unionLayoutBBox(draw);
        const pad = MOZILLA_VIEWBOX_PAD;
        draw.viewbox(box.x - pad, box.y - pad, box.width + (pad * 2), box.height + (pad * 2));
    }
    return draw;
}

export default {
    addPrefix,
    render,
    renderStatic,
    renderglyph,
    sheets
};
