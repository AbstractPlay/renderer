// import { Nested } from "@svgdotjs/svg.js";
import { Container as SVGContainer, Symbol as SVGSymbol } from "@svgdotjs/svg.js";

/**
 * All glyph sheets implement this interface.
 *
 */
export interface ISheet {
    /**
     * This is the unique name of the sheet.
     *
     */
    readonly name: string;
    /**
     * A brief description of what the sheet contains.
     *
     */
    readonly description: string;
    /**
     * A helpful constant only.
     *
     */
    readonly cellsize: number;
    /**
     * The glyphs themselves, each being a function that accepts an SVGContainer (like a Nested or the `defs` section of the main canvas)
     * and must return a Symbol.
     *
     */
    readonly glyphs: Map<string, ((svg: SVGContainer) => SVGSymbol) | ((svg: SVGContainer, color: string) => SVGSymbol)>;
}
