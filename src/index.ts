// import SVG from "@svgdotjs/svg.js";
import Ajv from "ajv";
import SVG from "svg.js";
import { renderers } from "./renderers";
import { APRenderRep } from "./schema";
import schema from "./schema.json";

const ajv = new Ajv();
const validate = ajv.compile(schema);

interface IRenderOptions {
    divid: string;
    sheets?: string[];
    gamename?: string;
    target?: SVG.Doc;
}

function formatAJVErrors(errors: Ajv.ErrorObject[]): string {
    let retstr = "";
    for (const error of errors) {
        retstr += `\nKeyword: ${error.keyword}, dataPath: ${error.dataPath}, schemaPath: ${error.schemaPath}`;
    }
    return retstr;
}

// `json` is an `any` instead of an `APRenderRep` because of the enum/string mismatch
export function render(json: APRenderRep, opts = {} as IRenderOptions): void {
    // Validate the JSON
    if (! validate(json)) {
        throw new Error(`The json object you submitted does not validate against the established schema. The validator said the following:\n${formatAJVErrors(validate.errors as Ajv.ErrorObject[])}`);
    }

    // Initialize the SVG container
    let draw: SVG.Doc;
    if ( ("target" in opts) && (opts.target != null) ) {
        draw = opts.target;
    } else {
        draw = SVG(opts.divid);
    }

    // Pass the JSON and the SVG container to the appropriate renderer
    if ( (json.renderer === undefined) || (json.renderer === null) ) {
        json.renderer = "default";
    }

    const renderer = renderers.get(json.renderer as string);
    if ( (renderer === undefined) || (renderer === null) ) {
        throw new Error(`Could not find the renderer "${ json.renderer }".`);
    }
    renderer.render(json, draw, {});
}

export function renderglyph(glyphid: string, opts = {} as IRenderOptions): void {
    // This is for inserting just a single glyph in running HTML.
}
