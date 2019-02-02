// import { Nested } from "@svgdotjs/svg.js";
import svg from "svg.js";

export interface ISheet {
    readonly name: string;
    readonly description: string;
    readonly glyphs: Map<string, (svg: svg.Nested) => void>;
}
