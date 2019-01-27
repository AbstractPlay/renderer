import Ajv from "ajv";
import renderers from "./renderers";
import schema from "./schema.json";

const ajv = new Ajv();
const validate = ajv.compile(schema);

interface IRenderOptions {
    divid?: string;
    sheets?: string[];
    gamename?: string;
}

export default function render(json: object, opts = {} as IRenderOptions): void {
    // Validate the JSON
    if (! validate(json)) {
        throw Error("The json object you submitted does not validate against the established schema.");
    }

    // Pass the JSON to the appropriate renderer
}

export function renderglyph(glyphid: string, opts = {} as IRenderOptions): void {
    // This is for inserting just a single glyph in running HTML.
}
