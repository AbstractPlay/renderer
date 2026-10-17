/**
 * A library for building images of game boards
 *
 * @remarks
 * Given a valid JSON file (see {@link APRenderRep}) and necessary options (see {@link IRenderOptions}), the library
 * will produce an SVG file.
 *
 * @packageDocumentation
 */

import { Svg } from "@svgdotjs/svg.js";
import AjvImport from "ajv";
import type { ValidateFunction } from "ajv";
import { sheets } from "./sheets/index.js";
export { sheets };
import { IRendererOptionsIn } from "./renderers/_base.js";
import { APRenderRep, Glyph, PositiveInteger, Colourstrings, Stashstrings, Colourfuncs } from "./schemas/schema.js";
import schema from "./schemas/schema.json" with { type: "json" };
import { v4 as uuidv4 } from "uuid";
import { addPrefix } from "./addPrefix.js";
import { renderRep } from "./renderRep.js";
import { renderComposite } from "./composite/renderComposite.js";
export type { IRenderOptions, IRenderCompositeOptions } from "./renderOptions.js";
export type {
    APRenderComposite,
    APRenderCompositeLayout,
    APRenderCompositePanel,
} from "./schemas/composite.js";
export { renderComposite };

type AjvInstance = {
    compile(jsonSchema: object): ValidateFunction;
};
const ajvCtor = AjvImport as unknown as new () => AjvInstance;
const ajv = new ajvCtor();
const validate = ajv.compile(schema);

export type {IRendererOptionsIn, APRenderRep, Glyph, PositiveInteger, Colourstrings, Stashstrings, Colourfuncs};

/** A single value from {@link APRenderRep.legend}. */
export type LegendEntry = NonNullable<APRenderRep["legend"]>[string];

/** Player index, hex/pattern/context token, or colour function — same as a glyph `colour` field. */
export type ColourResolvable = number | string | Colourfuncs;

export type InlineGlyphRequest =
    | { mode: "sheet"; name: string; colour: ColourResolvable }
    | { mode: "legend"; entry: LegendEntry };
export {
    applyBoardChrome,
    sanitizeRenderRep,
    validateRenderCustomization,
    getCompatibleStyles,
    isBoardChromeEligible,
    isBoardStyleCustomizationEligible,
    isBoardFieldChromeEligible,
    isBoardBasicBoard,
    isInvalidStylePair,
    getBoardStyleEntry,
} from "./boardChrome/index.js";
export type { BoardChromeInput, ValidateResult } from "./boardChrome/index.js";

import type { IRenderOptions } from "./renderOptions.js";

export { addPrefix };

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
    opts.staticAnimations = true;
    const canvas = render(json, opts);
    const svgString = addPrefix(canvas.svg(), opts);
    document.body.removeChild(node); // clean up
    return svgString;
}

const isIsoLegendEntry = (entry: LegendEntry): boolean => {
    return (
        typeof entry === "object" &&
        entry !== null &&
        !Array.isArray(entry) &&
        "piece" in entry
    );
};

const buildMiniLegendRep = (entry: LegendEntry): APRenderRep => {
    if (isIsoLegendEntry(entry)) {
        return {
            renderer: "isometric",
            board: null,
            legend: { A: entry },
            pieces: "A",
        };
    }
    return {
        board: null,
        legend: { A: entry },
        pieces: "A",
    };
};

const renderMiniLegend = (entry: LegendEntry, opts = {} as IRenderOptions): string => {
    const obj = buildMiniLegendRep(entry);
    if (opts.target != null) {
        const renderOpts = { ...opts, staticAnimations: true };
        const canvas = render(obj, renderOpts);
        return addPrefix(canvas.svg(), renderOpts);
    }
    return renderStatic(obj, opts);
};

/**
 * Renders one sheet glyph by name and colour (inline icon helper).
 * @beta
 */
export const renderSheetGlyph = (
    name: string,
    colour: ColourResolvable,
    opts = {} as IRenderOptions,
): string => {
    return renderMiniLegend({ name, colour }, opts);
};

/**
 * Renders any legend-map entry as a single inline icon (`legend.A` on a null board).
 * @beta
 */
export const renderLegendGlyph = (entry: LegendEntry, opts = {} as IRenderOptions): string => {
    return renderMiniLegend(entry, opts);
};

/**
 * Dispatches to {@link renderSheetGlyph} or {@link renderLegendGlyph} by mode.
 * @beta
 */
export const renderInlineGlyph = (
    request: InlineGlyphRequest,
    opts = {} as IRenderOptions,
): string => {
    if (request.mode === "sheet") {
        return renderSheetGlyph(request.name, request.colour, opts);
    }
    return renderLegendGlyph(request.entry, opts);
};

/**
 * @deprecated Use {@link renderSheetGlyph} or {@link renderInlineGlyph}.
 *
 * A helper function for producing code for a single glyph, intended to then be used inline.
 *
 * @param glyphid - The name of the glyph to render
 * @param colour - The fill colour, either a hex string or player number
 * @param opts - The list of renderer options
 * @returns A string containing a valid `<svg>` tag
 * @beta
 */
export const renderglyph = (
    glyphid: string,
    colour: ColourResolvable,
    opts = {} as IRenderOptions,
): string => {
    return renderSheetGlyph(glyphid, colour, opts);
};

/**
 * This is the primary function. Render an image based on the JSON and options
 *
 * @param json - The parsed JSON to render
 * @param opts - The list of renderer options
 * @returns A valid SVG.js Svg object
 * @beta
 */
export const render = (json: APRenderRep, opts = {} as IRenderOptions): Svg => {
    return renderRep(json, opts, validate);
};

export default {
    addPrefix,
    render,
    renderComposite,
    renderStatic,
    renderglyph,
    renderSheetGlyph,
    renderLegendGlyph,
    renderInlineGlyph,
    sheets
};
