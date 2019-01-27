import svg from "@svgdotjs/svg.js";
import Ajv from "ajv";
import renderers from "./renderers";
import { APRenderRep } from "./schema";
import schema from "./schema.json";

const ajv = new Ajv();
const validate = ajv.compile(schema);

interface IRenderOptions {
    divid: string;
    sheets?: string[];
    gamename?: string;
}

export default function render(json: APRenderRep, opts = {} as IRenderOptions): void {
    // Validate the JSON
    if (! validate(json)) {
        throw Error("The json object you submitted does not validate against the established schema.");
    }

    // Initialize the SVG container
    const draw = svg(opts.divid);

    // Pass the JSON and the SVG container to the appropriate renderer
    // let renderer = json.renderer
}

export function renderglyph(glyphid: string, opts = {} as IRenderOptions): void {
    // This is for inserting just a single glyph in running HTML.
}
