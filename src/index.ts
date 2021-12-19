// import SVG from "@svgdotjs/svg.js";
import { G as SVGG, NumberAlias, SVG, Svg } from "@svgdotjs/svg.js";
import Ajv, {DefinedError as AJVError} from "ajv";
import { renderers } from "./renderers";
import { IRendererOptionsIn } from "./renderers/_base";
import { APRenderRep } from "./schemas/schema";
import schema from "./schemas/schema.json";
import { v4 as uuidv4 } from 'uuid';

const ajv = new Ajv();
const validate = ajv.compile(schema);

/**
 * Defines the options the renderer accepts. It includes all the options the renderer class needs ({@link IRenderOptionsIn})
 * as well as a few that the layout front-end needs.
 *
 * @export
 * @interface IRenderOptions
 * @extends {IRendererOptionsIn}
 */
export interface IRenderOptions extends IRendererOptionsIn {
    /**
     * The {string} ID of the DOM element into which you want the SVG rendered. This is most typically a `<div>` tag.
     * This is the preferred way of outputting the SVG.
     *
     * @type {string}
     * @memberof IRenderOptions
     */
    divid?: string;
    /**
     * You can also pass the HTML element itself.
     *
     * @type {HTMLElement}
     * @memberof IRenderOptions
     */
    divelem?: HTMLElement;
    /**
     * In some special cases, you already have an SVG and want the renderer to do it's thing inside of it.
     * In that case, pass the {Svg} object.
     *
     * @type {Svg}
     * @memberof IRenderOptions
     */
    target?: Svg;
    /**
     * The width of the final SVG. This can be a string (representing something like a percentage).
     * See the SVG.js docs for details.
     *
     * @type {NumberAlias}
     * @memberof IRenderOptions
     */
    width?: NumberAlias;
    /**
     * The height of the final SVG. This can be a string (representing something like a percentage).
     * See the SVG.js docs for details.
     *
     * @type {NumberAlias}
     * @memberof IRenderOptions
     */
    height?: NumberAlias;
    /**
     * The {string} DOM ID you want the final output out be given.
     *
     * @type {string}
     * @memberof IRenderOptions
     */
    svgid?: string;
}

/**
 * The intent was to produce human-readable and actionable error messages. This has proven difficult thus far.
 * Something to work on in the future.
 *
 * @param {AJVError[]} errors
 * @returns {string}
 */
const formatAJVErrors = (errors: AJVError[]): string => {
    let retstr = "";
    for (const error of errors) {
        retstr += `\nKeyword: ${error.keyword}, instancePath: ${error.instancePath}, schemaPath: ${error.schemaPath}`;
    }
    return retstr;
}

/**
 * Creates a detached DOM element into which the image is rendered unseen.
 * It returns the resulting SVG code. Useful in things like React functional components.
 *
 * @export
 * @param {APRenderRep} json
 * @param {*} [opts={} as IRenderOptions]
 * @returns {string}
 */
export const renderStatic = (json: APRenderRep, opts = {} as IRenderOptions): string => {
    const node = document.createElement("div");
    const uid = uuidv4();
    node.setAttribute("id", uid);
    opts.divelem = node;
    const canvas = render(json, opts);
    return canvas.svg();
}

/**
 * A helper function for producing code for a single glyph, intended to then be used inline.
 *
 * @export
 * @param {string} glyphid
 * @param {(number | string)} colour
 * @param {*} [opts={} as IRenderOptions]
 * @returns {string}
 */
export const renderglyph = (glyphid: string, colour: number | string, opts = {} as IRenderOptions): string => {
    let obj: APRenderRep;
    if (typeof colour === "number") {
        obj = {
            board: null,
            legend: {
                A: {
                    name: glyphid,
                    player: colour,
                },
            },
            pieces: "A",
        };
    } else {
        obj = {
            board: null,
            legend: {
                A: {
                    name: glyphid,
                    colour,
                },
            },
            pieces: "A",
        };
    }
    const node = document.createElement("div");
    const uid = uuidv4();
    node.setAttribute("id", uid);
    opts.divelem = node;
    const canvas = render(obj, opts);
    const a = canvas.findOne("#A") as SVGG;
    canvas.viewbox(`0 0 ${a.width() as number} ${a.height() as number}`);
    return canvas.svg();
}

/**
 * This is the primary function. Render an image based on the JSON and options
 *
 * @export
 * @param {APRenderRep} json
 * @param {*} [opts={} as IRenderOptions]
 * @returns {Svg}
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
        // draw = SVG(opts.divelem) as Svg;
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

    const renderer = renderers.get(json.renderer as string);
    if ( (renderer === undefined) || (renderer === null) ) {
        throw new Error(`Could not find the renderer "${ json.renderer }".`);
    }
    renderer.render(json, draw, {sheets: opts.sheets, patterns: opts.patterns, patternList: opts.patternList, colourBlind: opts.colourBlind, colours: opts.colours, rotate: opts.rotate, showAnnotations: opts.showAnnotations, boardClick, boardHover, glyphmap: opts.glyphmap});
    if (draw.bbox().h !== 0) {
        draw.viewbox(draw.bbox());
    }
    return draw;
}
