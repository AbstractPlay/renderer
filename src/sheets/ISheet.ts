// import { Nested } from "@svgdotjs/svg.js";
import { Container as SVGContainer, Symbol as SVGSymbol } from "@svgdotjs/svg.js";

/**
 * All glyph sheets implement this interface.
 *
 * @export
 * @interface ISheet
 */
export interface ISheet {
    /**
     * This is the unique name of the sheet.
     *
     * @type {string}
     * @memberof ISheet
     */
    readonly name: string;
    /**
     * A brief description of what the sheet contains.
     *
     * @type {string}
     * @memberof ISheet
     */
    readonly description: string;
    /**
     * A helpful constant only.
     *
     * @type {number}
     * @memberof ISheet
     */
    readonly cellsize: number;
    /**
     * The glyphs themselves, each being a function that accepts an {SVGContainer} (like a {Nested} or the `defs` section of the main canvas)
     * and must return a {Symbol}.
     *
     * @memberof ISheet
     */
    readonly glyphs: Map<string, (svg: SVGContainer) => SVGSymbol>;
}
