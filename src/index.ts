/**
 * A library for building images of game boards
 *
 * @remarks
 * Given a valid JSON file (see {@link APRenderRep}) and necessary options (see {@link IRenderOptions}), the library
 * will produce an SVG file.
 *
 * @packageDocumentation
 */

import { NumberAlias, SVG, Svg } from "@svgdotjs/svg.js";
import Ajv, {DefinedError as AJVError} from "ajv";
import { renderers } from "./renderers";
import { IRendererOptionsIn } from "./renderers/_base";
import { APRenderRep, Glyph, PositiveInteger, Colourstrings, Stashstrings } from "./schemas/schema";
import schema from "./schemas/schema.json";
import { v4 as uuidv4 } from 'uuid';

const ajv = new Ajv();
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

        // For each ID, replace both the definition and references
        ids.forEach((id) => {
            const newId = `${prefix}${id}`;

            // Replace the id definition
            const idDefRegex = new RegExp(`id="${id}"`, "g");
            svg = svg.replace(idDefRegex, `id="${newId}"`);

            // Replace references: url(#id), href="#id", xlink:href="#id"
            const refPatterns = [
            new RegExp(`url\\(#${id}\\)`, "g"),
            new RegExp(`href="#${id}"`, "g"),
            new RegExp(`xlink:href="#${id}"`, "g"),
            new RegExp(`"#${id}"`, "g"), // handles cases like begin="0s;id.end"
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
const formatAJVErrors = (errors: AJVError[]): string => {
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
    const uid = uuidv4();
    node.setAttribute("id", uid);
    opts.divelem = node;
    const canvas = render(json, opts);
    const svgText = addPrefix(canvas.svg(), opts);
    document.removeChild(node);
    return svgText;
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
export const renderglyph = (glyphid: string, colour: number | string, opts = {} as IRenderOptions): string => {
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
    const svgText = addPrefix(canvas.svg(), opts);
    document.removeChild(node);
    return svgText;
}

/**
 * This is the primary function. Render an image based on the JSON and options
 *
 * @param json - The parsed JSON to render
 * @param opts - The list of renderer options
 * @returns A valid SVG.js Svg object
 * @beta
 */
export const render = (json: APRenderRep, opts = {} as IRenderOptions): Svg => {
    // Validate the JSON
    if (! validate(json)) {
        throw new Error(`The json object you submitted does not validate against the established schema. The validator said the following:\n${formatAJVErrors(validate.errors as AJVError[])}`);
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
    renderer.render(json, draw, {sheets: opts.sheets, patterns: opts.patterns, patternList: opts.patternList, colourBlind: opts.colourBlind, colours: opts.colours, colourContext: opts.colourContext, rotate: opts.rotate, showAnnotations: opts.showAnnotations, boardClick, boardHover, glyphmap: opts.glyphmap});
    if (draw.bbox().h !== 0
        && draw.viewbox().h === 0  // Only set it here if the renderer didn't set it
        ) {
        // Important: Mozilla browsers include stroke widths where other browsers do not.
        const box = draw.bbox();
        draw.viewbox(box.x - 2, box.y - 2, box.width + 4, box.height + 4);
    }
    return draw;
}
