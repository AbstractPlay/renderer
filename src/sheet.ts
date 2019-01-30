import { Nested } from "@svgdotjs/svg.js";

export interface ISheet {
    readonly name: string;
    readonly description: string;
    readonly glyphs: Map<string, (svg: Nested) => void>;
}
