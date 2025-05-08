import fnv from "fnv-plus";
import stringify from "json-stringify-deterministic";
import { Glyph } from "../schemas/schema";

export const glyph2uid = (g: Glyph, rootKey?: string, index?: number): string => {
    const parts: string[] = ["aprender", "glyph"];

    fnv.seed("aprender");
    const copy = JSON.parse(JSON.stringify(g)) as {[k: string]: unknown};
    // if this is a text glyph, incorporate the rootKey and index into the UID
    if (copy.text !== undefined && rootKey !== undefined && index !== undefined) {
        copy.rootKey = rootKey;
        copy.index = index;
    }
    const hash = fnv.hash(stringify(copy));
    parts.push(hash.hex());

    return parts.join("-");
}

export const x2uid = (x: unknown): string => {
    fnv.seed("aprender");
    const hash = fnv.hash(stringify(x));
    return hash.hex();
}

export default glyph2uid;
