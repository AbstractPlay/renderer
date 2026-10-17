import tinycolor from "tinycolor2";
import type { ColourResolvable } from "../schemas/schema.js";
import { paletteDefault } from "../renderers/_base.js";

type AnnotationColourOpts = {
    colourContext?: { annotations?: string };
    colours?: (string | null)[] | null;
};

export const resolveAnnotationColour = (
    colour: ColourResolvable | undefined,
    opts: AnnotationColourOpts,
): string => {
    const fallback = opts.colourContext?.annotations ?? "#000";
    if (colour === undefined || colour === null) {
        return fallback;
    }
    if (typeof colour === "number") {
        const palette = (opts.colours !== undefined && opts.colours !== null && opts.colours.length > 0)
            ? opts.colours
            : [...paletteDefault];
        const entry = palette[colour];
        if (entry === undefined || entry === null) {
            return fallback;
        }
        if (typeof entry === "string") {
            const c = tinycolor(entry);
            return c.isValid() ? c.toHexString() : fallback;
        }
        return fallback;
    }
    if (typeof colour === "string") {
        const c = tinycolor(colour);
        return c.isValid() ? c.toHexString() : fallback;
    }
    return fallback;
};
