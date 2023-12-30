import fnv from "fnv-plus";
import stringify from "json-stringify-deterministic";
import { Glyph } from "../schemas/schema";

export const glyph2uid = (g: Glyph): string => {
    const parts: string[] = ["aprender", "glyph"];

    fnv.seed("aprender");
    const hash = fnv.hash(stringify(g));
    parts.push(hash.hex());

    return parts.join("-");
}

export const x2uid = (x: any): string => {
    fnv.seed("aprender");
    const hash = fnv.hash(stringify(x));
    return hash.hex();
}

export default glyph2uid;
