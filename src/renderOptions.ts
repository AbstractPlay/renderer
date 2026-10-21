import type { NumberAlias, Svg } from "@svgdotjs/svg.js";
import type { IRendererOptionsIn } from "./renderers/_base.js";

/**
 * Defines the options the renderer accepts. It includes all the options the renderer class needs ({@link IRendererOptionsIn})
 * as well as a few that the layout front-end needs.
 * @beta
 */
export interface IRenderOptions extends IRendererOptionsIn {
    /**
     * The string ID of the DOM element into which you want the SVG rendered. This is most typically a `<div>` tag.
     * This is the preferred way of outputting the SVG.
     */
    divid?: string;
    /**
     * You can also pass the HTML element itself.
     */
    divelem?: HTMLElement;
    /**
     * In some special cases, you already have an SVG and want the renderer to do its thing inside of it.
     * In that case, pass the Svg object.
     */
    target?: Svg;
    /**
     * The width of the final SVG. This can be a string (representing something like a percentage).
     * See the SVG.js docs for details.
     */
    width?: NumberAlias;
    /**
     * The height of the final SVG. This can be a string (representing something like a percentage).
     * See the SVG.js docs for details.
     */
    height?: NumberAlias;
    /**
     * The string DOM ID you want the final output out be given.
     */
    svgid?: string;
    /**
     * A string that will be prepended to all ids to prevent collisions.
     * Gets added to the final rendered SVG via search/replace.
     * Only works with static rendering.
     */
    prefix?: string;
    /**
     * When true, emit CSS/SVG-native animations that survive serialization.
     * Set by {@link renderStatic} and inline glyph helpers; not for live {@link render}.
     */
    staticAnimations?: boolean;
}

/**
 * Options for {@link renderComposite}. Composite-level `rotate` is not supported; set `panels[].rotate` in JSON instead.
 * @beta
 */
export interface IRenderCompositeOptions extends Omit<IRenderOptions, "rotate" | "boardClick" | "boardHover"> {
    boardClick?: (panelId: string, row: number, col: number, piece: string) => void;
    boardHover?: (panelId: string, row: number, col: number, piece: string) => void;
}
