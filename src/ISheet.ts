// import { Nested } from "@svgdotjs/svg.js";
import { Container as SVGContainer, G as SVGG } from "@svgdotjs/svg.js";

export interface ISheet {
    readonly name: string;
    readonly description: string;
    readonly cellsize: number;
    readonly glyphs: Map<string, (svg: SVGContainer) => SVGG>;
}
