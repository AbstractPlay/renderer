// import SVG from "@svgdotjs/svg.js";
import { extend as SVGExtend, G as SVGG, NumberAlias, SVG, Svg, Use as SVGUse } from "@svgdotjs/svg.js";
import Ajv, {DefinedError as AJVError} from "ajv";
import { renderers } from "./renderers";
import { APRenderRep } from "./schema";
import schema from "./schema.json";

const ajv = new Ajv();
const validate = ajv.compile(schema);

export interface IRenderOptions {
    divid: string;
    divelem?: HTMLElement;
    boardClick?: (row: number, col: number, piece: string) => void;
    sheets?: string[];
    target?: Svg;
    patterns?: boolean;
    patternList?: string[];
    colourBlind?: boolean;
    colourList?: string[];
    showAnnotations?: boolean;
    rotate?: number;
    width?: NumberAlias;
    height?: NumberAlias;
    svgid?: string;
}

interface IMyObject {
    bbox(): any;
}

function formatAJVErrors(errors: AJVError[]): string {
    let retstr = "";
    for (const error of errors) {
        retstr += `\nKeyword: ${error.keyword}, instancePath: ${error.instancePath}, schemaPath: ${error.schemaPath}`;
    }
    return retstr;
}

/*
    Creates a detached DOM element in which to render the image unseen.
    You can then just export the SVG.
    Intended for use in React functional components.
*/
export function renderStatic(json: APRenderRep, opts = {} as IRenderOptions): string {
    const node = document.createElement("div");
    const {v4: uuidv4} = require("uuid");
    const uid = uuidv4();
    node.setAttribute("id", uid);
    opts.divelem = node;
    const canvas = render(json, opts);
    return canvas.svg();
}

export function renderglyph(glyphid: string, colour: number | string, opts = {} as IRenderOptions): string {
    // This is for inserting just a single glyph into running HTML.
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
                    // tslint:disable-next-line: object-literal-sort-keys
                    colour,
                },
            },
            pieces: "A",
        };
    }
    const node = document.createElement("div");
    const {v4: uuidv4} = require("uuid");
    const uid = uuidv4();
    node.setAttribute("id", uid);
    opts.divelem = node;
    const canvas = render(obj, opts);
    const a = canvas.findOne("#A") as SVGG;
    canvas.viewbox(`0 0 ${a.width()} ${a.height()}`);
    return canvas.svg();
}

// `json` is an `any` instead of an `APRenderRep` because of the enum/string mismatch
export function render(json: APRenderRep, opts = {} as IRenderOptions): Svg {
    // Validate the JSON
    if (! validate(json)) {
        throw new Error(`The json object you submitted does not validate against the established schema. The validator said the following:\n${formatAJVErrors(validate.errors as AJVError[])}`);
    }

    // Kludge to fix fact that `Use` type doesn't have `width` and `height` properties
    SVGExtend(SVGUse, {
        // tslint:disable-next-line: object-literal-shorthand
        width: function() {
            return (this as IMyObject).bbox().width;
        },
        height() {
            return (this as IMyObject).bbox().height;
        },
    });

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
        draw = SVG().addTo("#" + opts.divid).size(width, height).id(svgid);
    }

    let boardClick: (row: number, col: number, piece: string) => void = (row, col, piece) => undefined;
    if (("boardClick" in opts) && (opts.boardClick != null) ) {
        boardClick = opts.boardClick;
    }

    // Pass the JSON and the SVG container to the appropriate renderer
    if ( (json.renderer === undefined) || (json.renderer === null) ) {
        json.renderer = "default";
    }

    const renderer = renderers.get(json.renderer as string);
    if ( (renderer === undefined) || (renderer === null) ) {
        throw new Error(`Could not find the renderer "${ json.renderer }".`);
    }
    renderer.render(json, draw, {sheetList: opts.sheets, patterns: opts.patterns, patternList: opts.patternList, colourBlind: opts.colourBlind, colours: opts.colourList, rotate: opts.rotate, showAnnotations: opts.showAnnotations, boardClick});
    if (draw.bbox().h !== 0) {
        draw.viewbox(draw.bbox());
    }
    // else {
    //    draw.viewbox("0 0 500 500"); // fix me!
    // }
    return draw;
}
