import renderers from "./renderers";
import schema from "./schema.json";
import sheets from "./sheets";

interface IRenderOptions {
    divid?: string;
    sheets?: string[];
    gamename?: string;
}

export default function render(json: object, opts = {} as IRenderOptions): void {
    // Validate the JSON
    // Pass the JSON to the appropriate renderer
}

export function renderglyph(glyphid: string, opts = {} as IRenderOptions): void {
    // This is for inserting just a single glyph in running HTML.
}
