import { Element as SVGElement, G as SVGG, Rect as SVGRect, Circle as SVGCircle, Polygon as SVGPolygon, Path as SVGPath, StrokeData, Svg, Symbol as SVGSymbol, FillData, Gradient as SVGGradient, TimeLike, Box as SVGBox } from "@svgdotjs/svg.js";
import { Grid } from "honeycomb-grid";
import type { Hex } from "honeycomb-grid";
import { GridPoints, IPoint, type Poly, IPolyPolygon } from "../grids/_base";
import { AnnotationBasic, AnnotationSowing, APRenderRep, AreaButtonBar, AreaCompassRose, AreaKey, AreaPieces, AreaReserves, AreaScrollBar, BoardBasic, ButtonBarButton, Colourfuncs, FunctionBestContrast, Glyph, Gradient, MarkerFence, MarkerFences, type Polymatrix } from "../schemas/schema";
import { sheets } from "../sheets";
import { projectPoint, scale, rotate, usePieceAt, calcPyramidOffset, calcLazoOffset, projectPointEllipse, rotatePoint, calcBearing, smallestDegreeDiff, shortenLine } from "../common/plotting";
import { glyph2uid, x2uid } from "../common/glyph2uid";
import tinycolor from "tinycolor2";
import { convexHullPolys, unionPolys } from "../common/polys";
import { hex2rgb, rgb2hex, afterOpacity, lighten } from "../common/colours";
import { CompassDirection, edges2corners } from "../boards";
// import { customAlphabet } from 'nanoid'
// const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 10);

/**
 * This interface provides the renderer with preferences for specific element colouring.
 * The intention is to make things like hosting SVGs in "dark mode" easier to accomplish.
 */
export interface IColourContext {
    background: string;
    strokes: string;
    borders: string;
    labels: string;
    annotations: string;
    fill: string;
}
// "background"|"strokes"|"labels"|"annotations"|"fill"

/**
 * Defines the options recognized by the rendering engine.
 * @beta
 */
export interface IRendererOptionsIn {
    /**
     * A list of glyph sheets to include.
     * Defaults to the full list, starting with `core`.
     *
     */
    sheets?: string[];
    /**
     * Let's you set desired default colours so the image more immediately fits
     * into a specific context, like dark mode.
     * The type is a generic string-to-string object, but the precheck function
     * turns it into an IColourContext object.
     */
    colourContext?: {[k: string]: string};
    /**
     * A list of hexadecimal colour strings to be used as player colours. Be sure to provide enough for the number of players defined.
     * Defaults to a set of nine colours, defined in the constructor.
     *
     */
    colours?: string[];
    /**
     * Signals whether you want black and white patterns used instead of colours.
     *
     */
    patterns?: boolean;
    /**
     * List of pattern IDs to use as player colours.
     * Defaults to the full set of ten, defined in the constructor.
     *
     */
    patternList?: string[];
    /**
     * Signals whether you want to use the built-in set of four colour-blind-friendly colours.
     *
     */
    colourBlind?: boolean;
    /**
     * Indicates the number of degrees by which you want the entire render rotated.
     * Defaults to 0. The default renderer only supports rotation by 180 degrees. Other renderers may ignore it entirely.
     *
     */
    rotate?: number;
    /**
     * Signals whether you want move annotations shown.
     *
     */
    showAnnotations?: boolean;
    /**
     * A string of unique characters that will be used to create column labels. Defaults to the lowercase English alphabet.
     */
    columnLabels?: string;
    /**
     * A list of tuples indicating "requested glyph" and "replacement glyph."
     * This is a way of a user swapping out one glyph for another at render time.
     *
     */
    glyphmap?: [string,string][];
    /**
     * A callback attached to boards and pieces that is called whenever the user clicks on them.
     *
     * @param row - The row number that was clicked on
     * @param col - The column number that was clicked on
     * @param piece - A string representation of the piece that was clicked on, if any
     */
    boardClick?: (row: number, col: number, piece: string) => void;
    /**
     * A callback attached to the entire drawing that is called as the user moves their mouse over it.
     *
     * @param row - The row number that was clicked on
     * @param col - The column number that was clicked on
     * @param piece - A string representation of the piece that was clicked on, if any
     */
    boardHover?: (row: number, col: number, piece: string) => void;
}

/**
 * Defines the options used by the renderer after all prechecks and validation.
 *
 */
export interface IRendererOptionsOut {
    sheets: string[];
    colourContext: IColourContext;
    colours: string[];
    patterns: boolean;
    patternList: string[];
    colourBlind: boolean;
    rotate: number;
    columnLabels: string;
    showAnnotations: boolean;
    glyphmap: [string,string][];
    boardClick?: (row: number, col: number, piece: string) => void;
    boardHover?: (row: number, col: number, piece: string) => void;
}

export interface IMarkBoardOptions {
    svgGroup: SVGG;
    preGridLines: boolean;
    grid: GridPoints;
    gridExpanded?: GridPoints;
    hexGrid?: Grid<Hex>;
    hexWidth?: number;
    hexHeight?: number;
    polys?: Poly[][];
    cairoStart?: "H"|"V";
}

interface ISegment {
    colour: string|number;
    opacity?: number;
    style?: "solid"|"dashed";
}

/**
 * Internal interface when placing markers and annotations
 *
 */
interface ITarget {
    row: number;
    col: number;
}

/**
 * An infinite generator for creating column labels from an initial string of characters.
 * With the English alphabet, you would get a-z, then aa-az-ba-zz, then aaa etc.
 *
 * @param labels - A string of characters to use as column labels
 * @returns The next label in the sequence.
 */
export function* generateColumnLabel(labels: string): IterableIterator<string> {
    let n = 0
    let len = 1;
    const chars = labels.split("");
    while (true) {
        let label = "";
        let mask = n.toString(chars.length);
        while (mask.length < len) {
            mask = "0" + mask;
        }
        for (const char of mask) {
            const val = parseInt(char, chars.length);
            label += chars[val];
        }
        yield label;
        n++;
        const threshold = Math.pow(chars.length, len);
        if (n === threshold) {
            n = 0;
            len++;
        }
    }
}

/**
 * The abstract base class from which all renderers inherit. Contains all the code shared by most renderers.
 *
 */
export abstract class RendererBase {
    /**
     * Every renderer must have a unique name, referenced by the `renderer` property of the schema.
     *
     */
    public static readonly rendererName: string;
    /**
     * The default cell size. It's simply a convenient constant. It has no bearing at all on the final output.
     *
     */
    public cellsize = 50;
    /**
     * The list of received, processed, and validated options. This is available to all class methods.
     *
     */
    public options: IRendererOptionsOut
    public json?: APRenderRep;
    public rootSvg?: Svg;

    /**
     * Creates an instance of RendererBase. A name must be provided. Also sets the default options.
     * @param name - The unique name of the renderer
     */
    constructor() {
        this.options = {
            sheets: ["core", "dice", "looney", "piecepack", "chess", "streetcar", "nato", "decktet", "arimaa"],
            colourContext: {
                background: "#fff",
                fill: "#000",
                strokes: "#000",
                borders: "#000",
                annotations: "#000",
                labels: "#000",
            },
            colourBlind: false,
            colours: [],
            patterns: false,
            patternList: ["microbial", "chevrons", "honeycomb", "triangles", "wavy", "slant", "dots", "starsWhite", "cross", "houndstooth"],
            showAnnotations: true,
            columnLabels: "abcdefghijklmnopqrstuvwxyz",
            rotate: 0,
            glyphmap: []
        };
    }

    /**
     * This is the entry function for creating the rendered image.
     *
     * @param json - The parsed JSON to render
     * @param draw - The canvas upon which to render the image
     * @param opts - The renderer options
     */
    public abstract render(json: APRenderRep, draw: Svg, opts: IRendererOptionsIn): void;

    /**
     * Run on all JSON received before it is processed.
     *
     * @param json - The parsed JSON to render
     * @returns A fully validated {@link APRenderRep} object
     */
    protected jsonPrechecks(json: APRenderRep): void {
        // Check for missing renderer
        if (json.renderer === undefined) {
            json.renderer = "default";
        }

        // Make sure the JSON is intended for you
        if (json.renderer !== (this.constructor as typeof RendererBase).rendererName) {
            throw new Error(`Renderer mismatch. The JSON data you provided is intended for the "${json.renderer}" renderer, but the "${(this.constructor as typeof RendererBase).rendererName}" renderer received it.`);
        }

        this.json = json;
    }

    /**
     * Processes received options ({@link IRendererOptionsIn}) and translates them into valid {@link IRendererOptionsOut} options.
     *
     * @param opts - Renderer options passed by the user
     */
    protected optionsPrecheck(opts: IRendererOptionsIn): void {
        // Check colour blindness
        if (opts.colourBlind !== undefined) {
            this.options.colourBlind = opts.colourBlind;
        } else {
            this.options.colourBlind = false;
        }
        if (this.options.colourBlind) {
            this.options.colours = ["#9f0162", "#8400cd", "#a40122", "#009f81", "#008df9", "#e20134", "#ff5aaf", "#00c2f9", "#ff6e3a", "#00fccf", "#ffb2fd", "#ffc33b"];
        } else {
            this.options.colours = ["#e31a1c", "#1f78b4", "#33a02c", "#ffff99", "#6a3d9a", "#ff7f00", "#b15928", "#fb9a99", "#a6cee3", "#b2df8a", "#fdbf6f", "#cab2d6"];
        }

        // Validate sheet list
        if ( (opts.sheets !== undefined) && (opts.sheets.length > 0) ) {
            for (const name of opts.sheets) {
                if (! sheets.has(name)) {
                    throw new Error(`A glyph sheet you requested could not be found: ${ name }`);
                }
            }
            this.options.sheets = opts.sheets;
        }

        // Validate patterns settings
        this.options.patterns = false;
        if (opts.patterns) {
            this.options.patterns = true;
            // Validate pattern list if given
            if ( (opts.patternList !== undefined) && (opts.patternList.length > 0) ) {
                // for (const name of opts.patternList) {
                //     if (this.patternNames.indexOf(name) < 0) {
                //         throw new Error(`A pattern you requested could not be found: ${ name }`);
                //     }
                // }
                this.options.patternList = opts.patternList;
            }
        }

        // Validate colour context
        if (opts.colourContext !== undefined && opts.colourContext !== null) {
            for (const label of ["strokes", "labels", "annotations", "fill", "background", "borders"] as const) {
                if ( (label in opts.colourContext) && (opts.colourContext[label] !== undefined) ) {
                    const color = tinycolor(opts.colourContext[label]);
                    if (! color.isValid()) {
                        throw new Error(`The context colour for '${label}' is malformed: ${ opts.colourContext[label] }`);
                    }
                    this.options.colourContext[label] = color.toHexString();
                }
            }
        }

        // Validate colour list if given
        if ( (opts.colours !== undefined) && (opts.colours.length > 0) ) {
            const normalized: string[] = [];
            for (const c of opts.colours) {
                const color = tinycolor(c);
                if (! color.isValid()) {
                    throw new Error(`One of the colours you requested is malformed: ${ c }`);
                }
                normalized.push(color.toHexString());
            }
            this.options.colours = [...normalized];
        }

        // Check for annotation screening
        if (opts.showAnnotations !== undefined) {
            this.options.showAnnotations = opts.showAnnotations;
        }

        // Check for different column labels
        if (opts.columnLabels !== undefined) {
            this.options.columnLabels = opts.columnLabels;
        }

        // Validate rotation
        if ( (opts.rotate !== undefined) && (opts.rotate !== 0) ) {
            let normalized = opts.rotate;
            if (typeof normalized === "string") {
                normalized = parseInt(normalized, 10);
            }
            while (normalized < 0) {
                normalized += 360;
            }
            while (normalized > 0) {
                normalized -= 360;
            }
            this.options.rotate = normalized;
        } else {
            this.options.rotate = 0;
        }

        // move any glyphmap option over
        if (opts.glyphmap !== undefined) {
            this.options.glyphmap = opts.glyphmap;
        }

        if (opts.boardClick !== undefined) {
            this.options.boardClick = opts.boardClick;
        }
        if (opts.boardHover !== undefined) {
            this.options.boardHover = opts.boardHover;
        }
    }

    /**
     * Loads any requested patterns into the final SVG.
     *
     * @param name - The unique name of the pattern
     * @param canvas - The container into which to add the pattern
     */
    public loadPattern(name: string, opts: {canvas?: Svg, fg?: string, bg?: string} = {}): void {
        let canvas: Svg|undefined = this.rootSvg;
        if (opts.canvas !== undefined) {
            canvas = opts.canvas;
        }
        if (canvas === undefined) {
            throw new Error("Object in an invalid state.");
        }

        let fg = this.options.colourContext.strokes;
        if (opts.fg !== undefined) {
            fg = opts.fg;
        }
        let bg = this.options.colourContext.background;
        if (opts.bg !== undefined) {
            bg = opts.bg;
        }

        // Keep in alphabetical order.
        // If you change any `id`s, you need to change them in the constructor, too.
        switch (name) {
            case "chevrons":
                canvas.defs().svg(`<pattern id="chevrons" patternUnits="userSpaceOnUse" width="30" height="15" viewbox="0 0 60 30"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="60" height="30"><defs><rect id="_r" width="30" height="15" fill="${bg}" stroke-width="2.5" stroke="${fg}"/><g id="_p"><use xlink:href="#_r"/><use y="15" xlink:href="#_r"/><use y="30" xlink:href="#_r"/><use y="45" xlink:href="#_r"/></g></defs><use xlink:href="#_p" transform="translate(0 -25) skewY(40)"/><use xlink:href="#_p" transform="translate(30 0) skewY(-40)"/></svg></pattern>`);
                break;
            case "cross":
                canvas.defs().svg(`<pattern id="cross" patternUnits="userSpaceOnUse" width="8" height="8"><svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="${bg}"/><path d="M0 0L8 8ZM8 0L0 8Z" stroke-width="0.5" stroke="${fg}"/></svg></pattern>`);
                break;
            case "dots":
                canvas.defs().svg(`<pattern id="dots" patternUnits="userSpaceOnUse" width="10" height="10"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="${bg}" /><circle cx="2.5" cy="2.5" r="2.5" fill="${fg}"/></svg></pattern>`);
                break;
            case "honeycomb":
                canvas.defs().svg(`<pattern id="honeycomb" patternUnits="userSpaceOnUse" width="22.4" height="40" viewbox="0 0 56 100"><svg xmlns="http://www.w3.org/2000/svg" width="56" height="100"><rect width="56" height="100" fill="${bg}"/><path d="M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100" fill="none" stroke="${fg}" stroke-width="2"/><path d="M28 0L28 34L0 50L0 84L28 100L56 84L56 50L28 34" fill="none" stroke="${fg}" stroke-width="2"/></svg></pattern>`);
                break;
            case "houndstooth":
                canvas.defs().svg(`<pattern id="houndstooth" patternUnits="userSpaceOnUse" width="24" height="24" viewbox="0 0 24 24"><svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>houndstooth</title><g fill="${fg}" fill-opacity="1" fill-rule="evenodd"><path d="M0 18h6l6-6v6h6l-6 6H0M24 18v6h-6M24 0l-6 6h-6l6-6M12 0v6L0 18v-6l6-6H0V0"/></g></svg></pattern>`);
                break;
            case "microbial":
                canvas.defs().svg(`<pattern id="microbial" patternUnits="userSpaceOnUse" width="20" height=20><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="40" height="40" fill="${bg}"/><circle r="9.2" stroke-width="1" stroke="${fg}" fill="none"/><circle cy="18.4" r="9.2" stroke-width="1px" stroke="${fg}" fill="none"/><circle cx="18.4" cy="18.4" r="9.2" stroke-width="1" stroke="${fg}" fill="none"/></svg></pattern>`);
                break;
            case "slant":
                canvas.defs().svg(`<pattern id="slant" patternUnits="userSpaceOnUse" width="10" height="10"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="${bg}"/><path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke="${fg}" stroke-width="1"/></svg></pattern>`);
                break;
            case "starsWhite":
                canvas.defs().svg(`<pattern id="starsWhite" patternUnits="userSpaceOnUse" width="40" height="40" viewbox="0 0 80 80"><svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="${bg}"/><circle cx="40" cy="40" r="40" fill="${fg}"/><path d="M0 40 A40 40 45 0 0 40 0 A40 40 315 0 0 80 40 A40 40 45 0 0 40 80 A40 40 270 0 0 0 40Z" fill="${bg}"/></svg></pattern>`);
                break;
            case "triangles":
                canvas.defs().svg(`<pattern id="triangles" patternUnits="userSpaceOnUse" width="15" height="15"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15"><rect width="15" height="15" fill="${bg}"/><path d="M0 15L7.5 0L15 15Z" fill="${fg}"/></svg></pattern>`);
                break;
            case "wavy":
                canvas.defs().svg(`<pattern id="wavy" patternUnits="userSpaceOnUse" width="15" height="20" viewbox="0 0 75 100"><svg xmlns="http://www.w3.org/2000/svg" width="75" height="100"><rect width="75" height="100" fill="${bg}"/><circle cx="75" cy="50" r="28.3%" stroke-width="12" stroke="${fg}" fill="none"/><circle cx="0" r="28.3%" stroke-width="12" stroke="${fg}" fill="none"/><circle cy="100" r="28.3%" stroke-width="12" stroke="${fg}" fill="none"/></svg></pattern>`);
                break;
            default:
                throw new Error(`The pattern name you requested (${name}) is not known.`);
        }
    }

    /**
     * Goes through the list of sheets until it finds a matching glyph and adds it to the given Svg.
     * This is where glyph replacement happens (via `this.options.glyphmap`).
     *
     * @param glyph - The name of the glyph to load
     * @param canvas - The canvas into which to load the glyph
     * @returns The {@link SVGSymbol} that was loaded
     */
    protected loadGlyph(glyph: string, player: (number | undefined), canvas?: Svg): SVGSymbol {
        if (canvas === undefined) {
            if (this.rootSvg === undefined) {
                throw new Error("Object in an invalid state!");
            }
            canvas = this.rootSvg;
        }
        // check for substituted glyphs
        if (this.options.glyphmap.length > 0) {
            const idx = this.options.glyphmap.findIndex(t => t[0] === glyph);
            if (idx >= 0) {
                glyph = this.options.glyphmap[idx][1];
            }
        }
        for (const s of this.options.sheets) {
            const sheet = sheets.get(s);
            if (sheet !== undefined) {
                const func = sheet.glyphs.get(glyph);
                if (func !== undefined) {
                    if (func.length === 1) {
                        return (func as (svg: Svg) => SVGSymbol)(canvas.defs() as Svg);
                    } else {
                        return (func as (svg: Svg, color: string) => SVGSymbol)(canvas.defs() as Svg, player ? this.options.colours[player - 1] : "");
                    }
                }
            } else {
                throw new Error("Could not load the glyph sheet '" + s + "'");
            }
        }
        throw new Error("The glyph '" + glyph + "' could not be found in the requested sheets: " + this.options.sheets.join(", "));
    }

    /**
     * This function loads all the glyphs from the `legend` into the given Svg.
     * It deals with text glyphs and composite glyphs, including filling with colours, rotating, and scaling.
     *
     */
    protected loadLegend(args: {preserve: boolean} = {preserve: true}) {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }
        if ( ("legend" in this.json) && (this.json.legend !== undefined) ) {
            // Load any requested patterns
            if (this.options.patterns) {
                const patterns: Array<number> = new Array<number>();

                for (const key in this.json.legend) {
                    const node = this.json.legend[key];
                    if (typeof(node) !== "string") {
                        let glyphs: Array<Glyph>;
                        // if it's just a glyph, wrap it in an array
                        if (! Array.isArray(node)) {
                            glyphs = [node];
                        }
                        // if it's a multi-dimensional array, then it's a polymatrix and can't be dealt with here
                        else if (Array.isArray(node[0])) {
                            continue;
                        }
                        // otherwise, we know it's an array of glyphs
                        else {
                            glyphs = node as [Glyph, ...Glyph[]];
                        }
                        glyphs.forEach((e) => {
                            if (e.colour !== undefined && typeof e.colour === "number") {
                                if (! patterns.includes(e.colour)) {
                                    patterns.push(e.colour);
                                }
                            }
                        });
                    }
                }
                patterns.forEach((n) => {
                    if (n > this.options.patternList.length) {
                        throw new Error("The system does not support the number of patterns you have requested.");
                    }
                    this.loadPattern(this.options.patternList[n - 1]);
                });
            }

            // Now look for composite and coloured pieces and add those to the <defs> section for placement

            for (const key in this.json.legend) {
                const glyph = this.json.legend[key];
                let glyphs: Array<Glyph>;
                if (typeof glyph === "string") {
                    glyphs = [{name: glyph}];
                } else if (! Array.isArray(glyph)) {
                    glyphs = [glyph];
                } else if (Array.isArray(glyph[0])) {
                    // polymatrices aren't built here
                    continue;
                } else {
                    glyphs = glyph as [Glyph, ...Glyph[]];
                }

                // Create a new SVG.Nested to represent the composite piece and add it to <defs>
                const cellsize = 500;
                const nested = this.rootSvg.defs().nested().id(key);
                if (! args.preserve) {
                    nested.attr("preserveAspectRatio", "none");
                }
                let size = 0;
                // Layer the glyphs, manipulating as you go
                for (const [idx, g] of glyphs.entries()) {
                    let got: SVGSymbol;
                    if ( ("name" in g) && (g.name !== undefined) ) {
                        let player: number|undefined;
                        if (g.colour !== undefined && typeof g.colour === "number") {
                            player = g.colour;
                        }
                        got = this.loadGlyph(g.name, player, nested);
                        // // if this is the first glyph, migrate any important attributes to
                        // // the root glyph
                        // if (idx === 0) {
                        //     const blacklist = ["data-playerfill"]
                        //     const attributes = Object.keys(got.attr() as object).filter(s => s.startsWith("data-") && !s.startsWith("data-context") && !blacklist.includes(s));
                        //     for (const a of attributes) {
                        //         nested.attr(a, got.attr(a));
                        //     }
                        // }
                    } else if ( ("text" in g) && (g.text !== undefined) && (g.text.length > 0) ) {
                        const group = nested.symbol();
                        const fontsize = 17;
                        const text = group.text(g.text).font({
                            anchor: "start",
                            fill: this.options.colourContext.strokes,
                            size: fontsize,
                        });
                        text.attr("data-playerfill", true);
                        const temptext = this.rootSvg.text(g.text).font({
                            anchor: "start",
                            fill: this.options.colourContext.strokes,
                            size: fontsize,
                        });
                        const squaresize = Math.max(temptext.bbox().height, temptext.bbox().width);
                        // group.viewbox(temptext.bbox().x, temptext.bbox().y - 0.9, temptext.bbox().width, temptext.bbox().height);
                        group.viewbox(temptext.bbox().x, temptext.bbox().y, temptext.bbox().width, temptext.bbox().height);
                        group.attr("data-cellsize", squaresize);
                        temptext.remove();
                        got = group;
                    } else {
                        throw new Error(`Could not load one of the components of the glyph '${key}': ${JSON.stringify(g)}.`);
                    }

                    // tag glyph symbol for styling
                    got.id(glyph2uid(g, key, idx));

                    // look for context strokes and fills
                    const contextStroke = this.options.colourContext.strokes;
                    const contextFill = this.options.colourContext.fill;
                    const contextBorder = this.options.colourContext.borders;
                    const contextBackground = this.options.colourContext.background;
                    got.find("[data-context-fill=true]").each(function(this: SVGElement) { this.fill(contextFill); });
                    got.find("[data-context-background=true]").each(function(this: SVGElement) { this.fill(contextBackground); });
                    got.find("[data-context-stroke=true]").each(function(this: SVGElement) { this.stroke(contextStroke); });
                    got.find("[data-context-border=true]").each(function(this: SVGElement) { this.stroke(contextBorder); });
                    got.find("[data-context-border-fill=true]").each(function(this: SVGElement) { this.fill(contextBorder); });

                    let sheetCellSize = got.viewbox().height;
                    if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                        sheetCellSize = got.attr("data-cellsize") as number;
                        if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                            throw new Error(`The glyph you requested (${key}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                        }
                    }

                    // const clone = got.clone();
                    // const clone = got;

                    // Colourize (`player` first, then `colour` if defined)
                    // adapted for two colours
                    const colourVals = [g.colour, g.colour2];
                    const haveStrokes: boolean[] = [];
                    for (let i = 0; i < colourVals.length; i++) {
                        const colourVal = colourVals[i];
                        let isStroke = false;
                        if (colourVal !== undefined && typeof colourVal === "number") {
                            const player = colourVal;
                            if  (this.options.patterns) {
                                if (player > this.options.patternList.length) {
                                    throw new Error("The list of patterns provided is not long enough to support the number of players in this game.");
                                }
                                const useSize = sheetCellSize;
                                let fill = this.rootSvg.findOne("#" + this.options.patternList[player - 1] + "-" + useSize.toString()) as SVGElement;
                                if (fill === null) {
                                    fill = this.rootSvg.findOne("#" + this.options.patternList[player - 1]) as SVGElement;
                                    fill = fill.clone().id(this.options.patternList[player - 1] + "-" + useSize.toString()).scale(useSize / 150);
                                    this.rootSvg.defs().add(fill);
                                }
                                got.find(`[data-playerfill${i > 0 ? i+1 : ""}=true]`).each(function(this: SVGElement) { this.fill(fill); });
                            } else {
                                if (player > this.options.colours.length) {
                                    throw new Error("The list of colours provided is not long enough to support the number of players in this game.");
                                }
                                const fill = this.options.colours[player - 1];
                                got.find(`[data-playerfill${i > 0 ? i+1 : ""}=true]`).each(function(this: SVGElement) { this.fill(fill); });
                                got.find(`[data-playerstroke${i > 0 ? i+1 : ""}=true]`).each(function(this: SVGElement) { this.stroke(fill); isStroke = true; });
                            }
                        } else if (colourVal !== undefined) {
                            const normColour = this.resolveColour(colourVal as string|number|Gradient, "#000");
                            // @ts-expect-error (poor SVGjs typing)
                            got.find(`[data-playerfill${i > 0 ? i+1 : ""}=true]`).each(function(this: SVGElement) { this.fill(normColour); });
                            // @ts-expect-error (poor SVGjs typing)
                            got.find(`[data-playerstroke${i > 0 ? i+1 : ""}=true]`).each(function(this: SVGElement) { this.stroke(normColour); isStroke = true; });
                        }
                        // if colour is fully undefined, try to deduce the highest contrast colour
                        else {
                            // Only applies to text glyphs for now
                            if ("text" in g && g.text !== undefined) {
                                // find the first coloured glyph before the text element
                                // and contrast against it
                                let darkest = contextBackground;
                                for (let i = idx-1; i >= 0; i--) {
                                    const prev = glyphs[i];
                                    if ("colour" in prev && prev.colour !== undefined) {
                                        const curr = this.resolveColour(prev.colour) as string;
                                        darkest = curr;
                                        break;
                                    }
                                }
                                // now use the bestContrast function to choose a colour
                                const func: FunctionBestContrast = {
                                    func: "bestContrast",
                                    bg: darkest,
                                    // fg: [contextBackground, contextFill, contextStroke],
                                    fg: ["#000", "#fff"],
                                };
                                const normColour = this.resolveColour(func, "#000");
                                // @ts-expect-error (poor SVGjs typing)
                                got.find(`[data-playerfill${i > 0 ? i+1 : ""}=true]`).each(function(this: SVGElement) { this.fill(normColour); });
                                // @ts-expect-error (poor SVGjs typing)
                                got.find(`[data-playerstroke${i > 0 ? i+1 : ""}=true]`).each(function(this: SVGElement) { this.stroke(normColour); isStroke = true; });
                            }
                        }
                        haveStrokes.push(isStroke);
                    }

                    // Apply requested opacity
                    if (g.opacity !== undefined) {
                        got.fill({opacity: g.opacity});
                        if (haveStrokes.reduce((prev, curr) => prev || curr, false)) {
                            got.stroke({opacity: g.opacity});
                        }
                    }

                    // nested.add(clone);
                    const use = nested.use(got).height(cellsize).width(cellsize).x(-cellsize / 2).y(-cellsize / 2);
                    // const use = nested.use(got).height(cellsize).width(cellsize).x(0).y(0);

                    // Rotate if requested
                    // `null` rotation means no rotation whatsoever, including offsetting
                    let rotation = 0;
                    if (g.rotate !== null) {
                        if (g.rotate !== undefined) {
                            rotation += g.rotate;
                        }
                        // Re-jigger rotation for `vertical` glyphs
                        let vertical = false;
                        if ( ("text" in g) && (g.text !== undefined) && (g.text.length > 0) ) {
                            if (g.orientation === undefined || g.orientation !== "fluid") {
                                vertical = true;
                            }
                        } else {
                            if (g.orientation !== undefined && g.orientation === "vertical") {
                                vertical = true;
                            }
                        }
                        if (vertical) {
                            if (this.json.board && ("rotate" in this.json.board) && this.json.board.rotate !== undefined) {
                                rotation -= this.json.board.rotate;
                            }
                            if (this.options.rotate !== undefined) {
                                rotation -= this.options.rotate;
                            }
                        }
                        rotate(use, rotation, 0, 0);
                    }

                    // Scale it appropriately
                    let factor = 1;
                    if (g.scale !== undefined) {
                        factor = g.scale;
                    }
                    if ( ("board" in this.json) && (this.json.board !== undefined) && (this.json.board !== null) && ("style" in this.json.board) && (this.json.board.style !== undefined) ) {
                        const style = this.json.board.style;
                        // pieces in hexes need to be shrunk a little by default
                        if ( (style === "hex-of-hex") || (style === "hex-slanted") ) {
                            factor *= 0.85;
                        }
                        // and *-tri-f pieces need to be shrunk a lot
                        else if (style.endsWith("-tri-f")) {
                            factor *= 0.5;
                        }
                        // but pieces on vertex boards need to be grown a little so they touch
                        else if (style.startsWith("vertex")) {
                            factor *= 1.16;
                        }
                    }
                    if (factor !== 1) {
                        scale(use, factor, 0, 0);
                    }
                    if (factor * cellsize > size) {
                        size = factor * cellsize;
                    }

                    // flip if requested
                    if (g.flipx !== undefined && g.flipx) {
                        use.flip("x");
                    }
                    if (g.flipy !== undefined && g.flipy) {
                        use.flip("y");
                    }

                    // Shift if requested
                    if (g.nudge !== undefined) {
                        let dx = 0;
                        let dy = 0;
                        if (g.nudge.dx !== undefined) {
                            dx = g.nudge.dx;
                        }
                        if (g.nudge.dy !== undefined) {
                            dy = g.nudge.dy;
                        }
                        use.dmove(dx, dy);
                    }
                }
                // Increase size so that rotations won't get cropped
                size *= Math.sqrt(2);
                nested.viewbox(-size / 2, -size / 2, size, size).size(size, size);
            }

            // now look for and build polymatrices
            // we want them to be proportional, so load them *all* to determine max height and width
            let maxWidth = 0; let maxHeight = 0;

            for (const key in this.json.legend) {
                if (Array.isArray(this.json.legend[key]) && Array.isArray((this.json.legend[key] as unknown[])[0])) {
                    const matrix = this.json.legend[key] as Polymatrix;
                    const height = matrix.length;
                    let width = 0;
                    if (height > 0) {
                        width = matrix[0].length;
                    }
                    const realwidth = (width * this.cellsize);
                    const realheight = (height * this.cellsize);
                    maxWidth = Math.max(maxWidth, realwidth);
                    maxHeight = Math.max(maxHeight, realheight);
                }
            }
            // now build them properly, adjusting the viewbox so they're proportional and centred

            for (const key in this.json.legend) {
                if (Array.isArray(this.json.legend[key]) && Array.isArray((this.json.legend[key] as unknown[])[0])) {
                    const matrix = this.json.legend[key] as Polymatrix;
                    const height = matrix.length;
                    let width = 0;
                    if (height > 0) {
                        width = matrix[0].length;
                    }
                    const realwidth = (width * this.cellsize);
                    const realheight = (height * this.cellsize);
                    const deltax = (maxWidth - realwidth) / 2 * -1;
                    const deltay = (maxHeight - realheight) / 2 * -1;

                    // create nested SVG of the piece, with border
                    const nested = this.rootSvg.defs().nested().id(key).viewbox(deltax, deltay, maxWidth, maxHeight);
                    this.buildPoly(nested, matrix, {divided: true});
                }
            }
        }
    }

    /**
     * This is what applies annotations to a finished board.
     * Annotations are applied at the end, and so overlay pieces.
     *
     * @param grid - A map of row/column locations to x,y coordinates
     */
    public annotateBoard(grid: GridPoints, polys?: (Poly|null)[][]) {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }
        type Shape = "square"|"circle"|"hexf"|"hexp";

        if ( ("annotations" in this.json) && (this.json.annotations !== undefined) ) {
            const board = this.rootSvg.findOne("#board") as SVGG|null;
            let notes: SVGG;
            if (board !== null) {
                notes = board.group().id("annotations");
            } else {
                notes = this.rootSvg.group().id("annotations");
            }
            const rIncrement = this.cellsize / 2;
            let radius = rIncrement;
            let direction = 1;
            for (const note of this.json.annotations as (AnnotationBasic|AnnotationSowing)[]) {
                if ( (! ("type" in note)) || (note.type === undefined) ) {
                    throw new Error("Invalid annotation format found.");
                }
                const cloned = {...note};
                if ("targets" in cloned) {
                    // @ts-expect-error (only used to generate UUID)
                    delete cloned.targets;
                }
                if ( (note.type !== undefined) && (note.type === "move") ) {
                    if (note.targets.length < 2) {
                        throw new Error("Move annotations require at least two 'targets'.");
                    }

                    let colour = this.options.colourContext.annotations;
                    if ( ("colour" in note) && (note.colour !== undefined) && (note.colour !== null) ) {
                        colour = this.resolveColour(note.colour ) as string;
                    }
                    let style: "solid"|"dashed" = "solid";
                    let dasharray: string|undefined;
                    if ( ("style" in note) && (note.style !== undefined) ) {
                        style = note.style;
                    }
                    if ( ("dashed" in note) && (Array.isArray(note.dashed)) ) {
                        style = "dashed";
                        dasharray = note.dashed.map(n => n.toString()).join(" ");
                    }
                    let arrow = true;
                    if ( ("arrow" in note) && (note.arrow !== undefined)) {
                        arrow = note.arrow;
                    }
                    let anchors = true;
                    if ( ("anchors" in note) && (note.anchors !== undefined) ) {
                        anchors = note.anchors;
                    }
                    let opacity = 1;
                    if ( ("opacity" in note) && (note.opacity !== undefined) ) {
                        opacity = note.opacity;
                    }
                    let strokeWidth = 0.03;
                    if ( ("strokeWidth" in note) && (note.strokeWidth !== undefined) ) {
                        strokeWidth = note.strokeWidth;
                    }
                    const unit = strokeWidth / 0.03;
                    const s = this.cellsize * strokeWidth / 2;
                    // const markerArrow = notes.marker(5, 5, (add) => add.path("M 0 0 L 10 5 L 0 10 z"));
                    const markerArrow = notes.marker(4 * unit + 3 * s, 4 * unit + 2 * s, (add) => add.path(`M${s},${s} L${s + 4 * unit},${s + 2 * unit} ${s},${s + 4 * unit} Z`).fill(colour)).attr({ 'pointer-events': 'none' }).addClass(`aprender-annotation-${x2uid(cloned)}`);
                    const markerCircle = notes.marker(2 * unit + 2 * s, 2 * unit + 2 * s, (add) => add.circle(2 * unit).center(unit + s, unit + s).fill(colour)).attr({ 'pointer-events': 'none' }).addClass(`aprender-annotation-${x2uid(cloned)}`);
                    const points: string[] = [];
                    for (const node of (note.targets as ITarget[])) {
                        const pt = this.getStackedPoint(grid, node.col, node.row);
                        if (pt === undefined) {
                            throw new Error(`Annotation - Move: Could not find coordinates for row ${node.row}, column ${node.col}.`);
                        }
                        points.push(`${pt.x},${pt.y}`);
                    }
                    const stroke: StrokeData = {
                        color: colour,
                        opacity,
                        width: this.cellsize * strokeWidth,
                        linecap: "round", linejoin: "round"
                    };
                    if (style === "dashed") {
                        if (dasharray !== undefined) {
                            stroke.dasharray = dasharray;
                        } else {
                            stroke.dasharray = (4 * Math.ceil(strokeWidth / 0.03)).toString();
                        }
                    }
                    const line = notes.polyline(points.join(" ")).addClass(`aprender-annotation-${x2uid(cloned)}`).stroke(stroke).fill("none").attr({ 'pointer-events': 'none' });
                    if (anchors) {
                        line.marker("start", markerCircle);
                    }
                    if (arrow) {
                        line.marker("end", markerArrow);
                    } else if (anchors) {
                        line.marker("end", markerCircle);
                    }
                } else if ( (note.type !== undefined) && (note.type === "line") ) {
                    if (note.targets.length < 2) {
                        throw new Error("Line annotations require at least two 'targets'.");
                    }

                    let colour = this.options.colourContext.annotations;
                    if ( ("colour" in note) && (note.colour !== undefined) && (note.colour !== null) ) {
                        colour = this.resolveColour(note.colour ) as string;
                    }
                    let style: "solid"|"dashed" = "solid";
                    let dasharray: string|undefined;
                    if ( ("style" in note) && (note.style !== undefined) ) {
                        style = note.style;
                    }
                    if ( ("dashed" in note) && (Array.isArray(note.dashed)) ) {
                        style = "dashed";
                        dasharray = note.dashed.map(n => n.toString()).join(" ");
                    }
                    let opacity = 1;
                    if ( ("opacity" in note) && (note.opacity !== undefined) ) {
                        opacity = note.opacity;
                    }
                    let strokeWidth = 0.03;
                    if ( ("strokeWidth" in note) && (note.strokeWidth !== undefined) ) {
                        strokeWidth = note.strokeWidth;
                    }
                    const points: string[] = [];
                    for (const node of (note.targets as ITarget[])) {
                        const pt = this.getStackedPoint(grid, node.col, node.row);
                        if (pt === undefined) {
                            throw new Error(`Annotation - Line: Could not find coordinates for row ${node.row}, column ${node.col}.`);
                        }
                        points.push(`${pt.x},${pt.y}`);
                    }
                    const stroke: StrokeData = {
                        color: colour,
                        opacity,
                        width: this.cellsize * strokeWidth,
                        linecap: "round", linejoin: "round"
                    };
                    if (style === "dashed") {
                        if (dasharray !== undefined) {
                            stroke.dasharray = dasharray;
                        } else {
                            stroke.dasharray = (4 * Math.ceil(strokeWidth / 0.03)).toString();
                        }
                    }
                    notes.polyline(points.join(" ")).addClass(`aprender-annotation-${x2uid(cloned)}`).stroke(stroke).fill("none").attr({ 'pointer-events': 'none' });
                } else if ( (note.type !== undefined) && (note.type === "eject") ) {
                    if (note.targets.length !== 2) {
                        throw new Error("Eject annotations require exactly two 'targets'.");
                    }

                    let colour = this.options.colourContext.annotations;
                    if ( ("colour" in note) && (note.colour !== undefined) ) {
                        colour = this.resolveColour(note.colour , "#000") as string;
                    }
                    let style = "dashed";
                    if ( ("style" in note) && (note.style !== undefined) ) {
                        style = note.style as string;
                    }
                    let arrow = false;
                    if ( ("arrow" in note) && (note.arrow !== undefined)) {
                        arrow = note.arrow;
                    }
                    let opacity = 0.5;
                    if ( ("opacity" in note) && (note.opacity !== undefined) ) {
                        opacity = note.opacity;
                    }

                    // const markerArrow = notes.marker(5, 5, (add) => add.path("M 0 0 L 10 5 L 0 10 z"));
                    const markerArrow = notes.marker(4, 4, (add) => add.path("M0,0 L4,2 0,4").fill(colour)).attr({ 'pointer-events': 'none' }).addClass(`aprender-annotation-${x2uid(cloned)}`);
                    const markerCircle = notes.marker(2, 2, (add) => add.circle(2).fill(colour)).attr({ 'pointer-events': 'none' }).addClass(`aprender-annotation-${x2uid(cloned)}`);
                    const [from, to] = note.targets as ITarget[];
                    const ptFrom = this.getStackedPoint(grid, from.col, from.row);
                    if (ptFrom === undefined) {
                        throw new Error(`Annotation - Ejenct: Could not find coordinates for row ${from.row}, column ${from.col}.`);
                    }
                    const ptTo = this.getStackedPoint(grid, to.col, to.row);
                    if (ptTo === undefined) {
                        throw new Error(`Annotation - Eject: Could not find coordinates for row ${to.row}, column ${to.col}.`);
                    }
                    const ptCtr = this.getArcCentre(ptFrom, ptTo, radius * direction);
                    const stroke: StrokeData = {
                        color: colour,
                        opacity,
                        width: this.cellsize * 0.03,
                        linecap: "round", linejoin: "round"
                    };
                    if (style === "dashed") {
                        stroke.dasharray = "4";
                        if (note.dashed !== undefined && note.dashed !== null) {
                            stroke.dasharray = (note.dashed ).join(" ");
                        }
                    }
                    const line = notes.path(`M ${ptFrom.x} ${ptFrom.y} C ${ptCtr.x} ${ptCtr.y} ${ptCtr.x} ${ptCtr.y} ${ptTo.x} ${ptTo.y}`).addClass(`aprender-annotation-${x2uid(cloned)}`).stroke(stroke).fill("none").attr({ 'pointer-events': 'none' });
                    line.marker("start", markerCircle);
                    if (arrow) {
                        line.marker("end", markerArrow);
                    } else {
                        line.marker("end", markerCircle);
                    }
                    direction *= -1;
                    let fixed = false;
                    if ( ("static" in note) && (note.static !== undefined) && (typeof note.static === "boolean") ) {
                        fixed = note.static;
                    }
                    if (! fixed) {
                        if (direction > 0) {
                            radius += rIncrement;
                        }
                    }
                } else if ( (note.type !== undefined) && (note.type === "enter") ) {
                    let colour = this.options.colourContext.annotations;
                    if ( ("colour" in note) && (note.colour !== undefined) ) {
                        colour = this.resolveColour(note.colour ) as string;
                    }
                    let strokeWeight = this.cellsize* 0.05;
                    if (this.json.board !== null && this.json.board !== undefined && "strokeWeight" in this.json.board && this.json.board.strokeWeight !== undefined) {
                        strokeWeight = this.json.board.strokeWeight;
                    }
                    let dasharray: string|undefined;
                    if (note.style !== "solid") {
                        dasharray = (4 * Math.ceil(strokeWeight / (this.cellsize * 0.05))).toString();
                    }
                    if (note.dashed !== undefined && note.dashed !== null) {
                        dasharray = (note.dashed ).join(" ");
                    }
                    let bgopacity = 1;
                    if ( ("occlude" in note) && note.occlude === false) {
                        bgopacity = 0;
                    }
                    let opacity = 1;
                    if ( ("opacity" in note) && note.opacity !== undefined) {
                        opacity = note.opacity;
                    }
                    for (const node of (note.targets as ITarget[])) {
                        // outline the polygon if provided
                        if (polys !== undefined && polys[node.row][node.col] !== undefined) {
                            const poly = polys[node.row][node.col];
                            if (poly === null) { continue; }
                            if (poly.type === "circle") {
                                notes.circle(poly.r * 2)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round", opacity: bgopacity})
                                    .center(poly.cx, poly.cy)
                                    .attr({ 'pointer-events': 'none' });
                                notes.circle(poly.r * 2)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round", opacity})
                                    .center(poly.cx, poly.cy)
                                    .attr({ 'pointer-events': 'none' });
                            } else if (poly.type === "path") {
                                notes.path(poly.path)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round", opacity: bgopacity})
                                    .attr({ 'pointer-events': 'none' });
                                notes.path(poly.path)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round", opacity})
                                    .attr({ 'pointer-events': 'none' });
                            } else {
                                notes.polygon(poly.points.map(({x,y}) => [x,y].join(",")).join(" "))
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round", opacity: bgopacity})
                                    .attr({ 'pointer-events': 'none' });
                                notes.polygon(poly.points.map(({x,y}) => [x,y].join(",")).join(" "))
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round", opacity})
                                    .attr({ 'pointer-events': 'none' });
                            }
                        }
                        // otherwise, just draw the shape
                        else {
                            let shape: Shape = "square";
                            if ( ("shape" in note) && (note.shape !== undefined) ) {
                                shape = note.shape as Shape;
                            }
                            // const pt = grid[node.row][node.col];
                            const pt = this.getStackedPoint(grid, node.col, node.row);
                            if (pt === undefined) {
                                throw new Error(`Annotation - Enter: Could not find coordinates for row ${node.row}, column ${node.col}.`);
                            }
                            if (shape === "square") {
                                notes.rect(this.cellsize, this.cellsize)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round", opacity: bgopacity})
                                    .center(pt.x, pt.y)
                                    .attr({ 'pointer-events': 'none' });
                                notes.rect(this.cellsize, this.cellsize)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round", opacity})
                                    .center(pt.x, pt.y)
                                    .attr({ 'pointer-events': 'none' });
                            } else if (shape === "circle") {
                                notes.circle(this.cellsize * 1.1, this.cellsize * 1.1)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round", opacity: bgopacity})
                                    .center(pt.x, pt.y)
                                    .attr({ 'pointer-events': 'none' });
                                notes.circle(this.cellsize * 1.1, this.cellsize * 1.1)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round", opacity})
                                    .center(pt.x, pt.y)
                                    .attr({ 'pointer-events': 'none' });
                            } else if (shape.startsWith("hex")) {
                                let start = 0;
                                if (shape === "hexf") {
                                    start = -30;
                                }
                                const periph: [number,number][] = [];
                                for (let i = 0; i < 6; i++) {
                                    periph.push(projectPoint(pt.x, pt.y, this.cellsize * 1.25 * 0.5, start + (i*60)));
                                }
                                notes.polygon(periph)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round", opacity: bgopacity})
                                    .center(pt.x, pt.y)
                                    .attr({ 'pointer-events': 'none' });
                                notes.polygon(periph)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round", opacity})
                                    .center(pt.x, pt.y)
                                    .attr({ 'pointer-events': 'none' });
                            }
                        }
                    }
                } else if ( (note.type !== undefined) && (note.type === "exit") ) {
                    let colour = this.options.colourContext.annotations;
                    if ( ("colour" in note) && (note.colour !== undefined) ) {
                        colour = this.resolveColour(note.colour ) as string;
                    }
                    let strokeWeight = this.cellsize* 0.05;
                    if (this.json.board !== null && this.json.board !== undefined && "strokeWeight" in this.json.board && this.json.board.strokeWeight !== undefined) {
                        strokeWeight = this.json.board.strokeWeight;
                    }
                    let dasharray: string|undefined;
                    if (note.style !== "solid") {
                        dasharray = (4 * Math.ceil(strokeWeight / (this.cellsize * 0.05))).toString();
                    }
                    if (note.dashed !== undefined && note.dashed !== null) {
                        dasharray = (note.dashed ).join(" ");
                    }
                    let bgopacity = 1;
                    if ( ("occlude" in note) && note.occlude === false) {
                        bgopacity = 0;
                    }
                    let opacity = 1;
                    if ( ("opacity" in note) && note.opacity !== undefined) {
                        opacity = note.opacity;
                    }
                    for (const node of (note.targets as ITarget[])) {
                        // outline the polygon if provided
                        if (polys !== undefined) {
                            const poly = polys[node.row][node.col];
                            if (poly === null) { continue; }
                            if (poly.type === "circle") {
                                notes.circle(poly.r * 2)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round", opacity: bgopacity})
                                    .center(poly.cx, poly.cy)
                                    .attr({ 'pointer-events': 'none' });
                                notes.circle(poly.r * 2)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round", opacity})
                                    .center(poly.cx, poly.cy)
                                    .attr({ 'pointer-events': 'none' });
                            } else if (poly.type === "path") {
                                notes.path(poly.path)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round", opacity: bgopacity})
                                    .attr({ 'pointer-events': 'none' });
                                notes.path(poly.path)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round", opacity})
                                    .attr({ 'pointer-events': 'none' });
                            } else {
                                notes.polygon(poly.points.map(({x,y}) => [x,y].join(",")).join(" "))
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round", opacity: bgopacity})
                                    .attr({ 'pointer-events': 'none' });
                                notes.polygon(poly.points.map(({x,y}) => [x,y].join(",")).join(" "))
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round", opacity})
                                    .attr({ 'pointer-events': 'none' });
                            }
                        }
                        // otherwise, just draw the square
                        else {
                            let shape: Shape = "square";
                            if ( ("shape" in note) && (note.shape !== undefined) ) {
                                shape = note.shape as Shape;
                            }
                            // const pt = grid[node.row][node.col];
                            const pt = this.getStackedPoint(grid, node.col, node.row);
                            if (pt === undefined) {
                                throw new Error(`Annotation - Exit: Could not find coordinates for row ${node.row}, column ${node.col}.`);
                            }
                            if (shape === "square") {
                                notes.rect(this.cellsize, this.cellsize)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round", opacity: bgopacity})
                                    .center(pt.x, pt.y)
                                    .attr({ 'pointer-events': 'none' });
                                notes.rect(this.cellsize, this.cellsize)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round", opacity})
                                    .center(pt.x, pt.y)
                                    .attr({ 'pointer-events': 'none' });
                            } else if (shape === "circle") {
                                notes.circle(this.cellsize * 1.1, this.cellsize * 1.1)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round", opacity: bgopacity})
                                    .center(pt.x, pt.y)
                                    .attr({ 'pointer-events': 'none' });
                                notes.circle(this.cellsize * 1.1, this.cellsize * 1.1)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round", opacity})
                                    .center(pt.x, pt.y)
                                    .attr({ 'pointer-events': 'none' });
                            } else if (shape.startsWith("hex")) {
                                let start = 0;
                                if (shape === "hexf") {
                                    start = -30;
                                }
                                const periph: [number,number][] = [];
                                for (let i = 0; i < 6; i++) {
                                    periph.push(projectPoint(pt.x, pt.y, this.cellsize * 1.25 * 0.5, start + (i*60)));
                                }
                                notes.polygon(periph)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round", opacity: bgopacity})
                                    .center(pt.x, pt.y)
                                    .attr({ 'pointer-events': 'none' });
                                notes.polygon(periph)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round", opacity})
                                    .center(pt.x, pt.y)
                                    .attr({ 'pointer-events': 'none' });
                            }
                        }
                    }
                } else if ( (note.type !== undefined) && (note.type === "outline") ) {
                    let colour = this.options.colourContext.annotations;
                    if ( ("colour" in note) && (note.colour !== undefined) ) {
                        colour = this.resolveColour(note.colour ) as string;
                    }
                    let dasharray = "4";
                    if (note.dashed !== undefined && note.dashed !== null) {
                        dasharray = (note.dashed ).join(" ");
                    }
                    const pts: IPoint[] = [];
                    for (const node of (note.targets as ITarget[])) {
                        const pt = this.getStackedPoint(grid, node.col, node.row);
                        if (pt === undefined) {
                            throw new Error(`Annotation - Outline: Could not find coordinates for row ${node.row}, column ${node.col}.`);
                        }
                        pts.push(pt);
                    }
                    if (pts.length < 3) {
                        throw new Error("The 'outline' annotation requires at least three points");
                    }
                    notes.polygon(pts.map(pt => `${pt.x},${pt.y}`).join(" "))
                         .addClass(`aprender-annotation-${x2uid(cloned)}`)
                         .fill("none")
                         .stroke({color: colour, width: this.cellsize * 0.05, dasharray, linecap: "round", linejoin: "round"})
                         .attr({ 'pointer-events': 'none' });
                } else if ( (note.type !== undefined) && (note.type === "dots") ) {
                    let colour = this.options.colourContext.annotations;
                    if ( ("colour" in note) && (note.colour !== undefined) ) {
                        colour = this.resolveColour(note.colour ) as string;
                    }
                    let opacity = 1;
                    if ( ("opacity" in note) && (note.opacity !== undefined) ) {
                        opacity = note.opacity;
                    }
                    let diameter = 0.2;
                    if ( ("size" in note) && (note.size !== undefined) ) {
                        diameter = note.size;
                    }
                    // Get shape type (default to filled circle for backwards compatibility)
                    let dotShape: string = "circle";
                    if ( ("dotShape" in note) && (note.dotShape !== undefined) ) {
                        dotShape = note.dotShape;
                    }
                    let rotation = 0;
                    if ( ("rotation" in note) && (note.rotation !== undefined) ) {
                        rotation = note.rotation;
                    }

                    for (const node of (note.targets as ITarget[])) {
                        const pt = this.getStackedPoint(grid, node.col, node.row);
                        if (pt === undefined) {
                            throw new Error(`Annotation - Dots: Could not find coordinates for row ${node.row}, column ${node.col}.`);
                        }

                        if (dotShape === "circle") {
                            // Default filled circle
                            notes.circle(this.cellsize * diameter)
                                .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                .fill(colour)
                                .opacity(opacity)
                                .stroke({width: 0})
                                .center(pt.x, pt.y)
                                .attr({ 'pointer-events': 'none' });
                        } else if (dotShape === "ring") {
                            // Unfilled circle (ring) for dive indication
                            const strokeWidth = this.cellsize * diameter * 0.3;
                            notes.circle(this.cellsize * diameter * 0.8)
                                .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                .fill("none")
                                .opacity(opacity)
                                .stroke({color: colour, width: strokeWidth})
                                .center(pt.x, pt.y)
                                .attr({ 'pointer-events': 'none' });
                        } else if (dotShape === "ring-large") {
                            // Larger unfilled circle for power dive indication
                            const largeDiameter = diameter * 1.1;
                            const strokeWidth = this.cellsize * largeDiameter * 0.3;
                            notes.circle(this.cellsize * largeDiameter)
                                .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                .fill("none")
                                .opacity(opacity)
                                .stroke({color: colour, width: strokeWidth})
                                .center(pt.x, pt.y)
                                .attr({ 'pointer-events': 'none' });
                        } else if (dotShape === "chevron") {
                            // Chevron shape pointing up at 0°, rotated by rotation degrees
                            const size = this.cellsize * diameter;
                            const halfSize = size / 2;
                            // Draw a "V" shape pointing up (chevron)
                            const chevronPath = `M ${-halfSize * 0.7} ${halfSize * 0.3} L 0 ${-halfSize * 0.5} L ${halfSize * 0.7} ${halfSize * 0.3}`;
                            notes.path(chevronPath)
                                .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                .fill("none")
                                .opacity(opacity)
                                .stroke({color: colour, width: this.cellsize * 0.04, linecap: "round", linejoin: "round"})
                                .center(pt.x, pt.y)
                                .transform({rotate: rotation, originX: pt.x, originY: pt.y})
                                .attr({ 'pointer-events': 'none' });
                        } else if (dotShape === "explosion") {
                            // Simple starburst/explosion shape
                            const size = this.cellsize * diameter * 1.2;
                            const outerRadius = size / 2;
                            const innerRadius = outerRadius * 0.4;
                            const numPoints = 8;
                            let pathData = "";
                            for (let i = 0; i < numPoints * 2; i++) {
                                const angle = (i * Math.PI) / numPoints - Math.PI / 2;
                                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                                const x = Math.cos(angle) * radius;
                                const y = Math.sin(angle) * radius;
                                pathData += (i === 0 ? "M " : " L ") + x + " " + y;
                            }
                            pathData += " Z";
                            notes.path(pathData)
                                .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                .fill(colour)
                                .opacity(opacity)
                                .stroke({width: 0})
                                .center(pt.x, pt.y)
                                .transform({rotate: rotation, originX: pt.x, originY: pt.y})
                                .attr({ 'pointer-events': 'none' });
                        }
                    }
                } else if ( (note.type !== undefined) && (note.type === "glyph")) {
                    if ( (! ("targets" in note)) || (note.targets.length < 1) ) {
                        throw new Error(`At least one target must be given for glyph annotations.`);
                    }
                    const key = note.glyph as string;
                    const piece = notes.root().findOne("#" + key) as Svg;
                    if ( (piece === null) || (piece === undefined) ) {
                        throw new Error(`Could not find the requested piece (${key}). The glyph *must* exist in the \`legend\`.`);
                    }
                    for (const pt of (note.targets as ITarget[])) {
                        const point = this.getStackedPoint(grid, pt.col, pt.row);
                        if (point === undefined) {
                            throw new Error(`Annotation - Enter: Could not find coordinates for row ${pt.row}, column ${pt.col}.`);
                        }
                        const use = usePieceAt({svg: notes, piece, cellsize: this.cellsize, x: point.x, y: point.y, scalingFactor: 1});
                        use.attr({ 'pointer-events': 'none' });
                        // if (this.options.rotate && this.json.options && this.json.options.includes('rotate-pieces')) {
                        //     rotate(use, this.options.rotate, point.x, point.y);
                        // }
                    }
                } else if ( (note.type !== undefined) && (note.type === "deltas") ) {
                    type Delta = {
                        row: number;
                        col: number;
                        delta: number;
                    };
                    // generate numerical glyphs for each unique delta
                    const rotation = this.getRotation();
                    const deltas = new Set<number>((note.deltas as Delta[]).map(d => d.delta));
                    for (const delta of deltas) {
                        if (delta === 0) {
                            continue;
                        }
                        const strDelta = `${delta > 0 ? "+" : ""}${delta}`;
                        const cellsize = 500;
                        const nested = this.rootSvg.defs().nested().id(`_delta_${delta < 0 ? `n${Math.abs(delta)}` : delta}`).attr({ 'pointer-events': 'none' });
                        nested.rect(cellsize, cellsize).fill({color: this.options.colourContext.background, opacity: 1}).move(-cellsize / 2, -cellsize / 2);
                        const nestedGroup = nested.symbol();
                        const fontsize = 17;
                        const text = nestedGroup.text(strDelta).font({
                            anchor: "start",
                            fill: this.options.colourContext.strokes,
                            size: fontsize,
                            opacity: 0.5,
                        });
                        text.attr("data-playerfill", true);
                        text.attr("font-weight", "bold");
                        const temptext = this.rootSvg.text(strDelta).font({
                            anchor: "start",
                            fill: this.options.colourContext.strokes,
                            size: fontsize,
                            opacity: 0.5,
                        });
                        const squaresize = Math.max(temptext.bbox().height, temptext.bbox().width);
                        nestedGroup.viewbox(temptext.bbox().x, temptext.bbox().y, temptext.bbox().width, temptext.bbox().height);
                        nestedGroup.attr("data-cellsize", squaresize);
                        temptext.remove();
                        const got = nestedGroup;

                        let sheetCellSize = got.viewbox().height;
                        if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                            sheetCellSize = got.attr("data-cellsize") as number;
                            if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                                throw new Error(`The glyph you requested (${delta}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                            }
                        }

                        const use = nested.use(got).height(cellsize).width(cellsize).x(-cellsize / 2).y(-cellsize / 2);
                        use.rotate(rotation * -1, 0, 0);

                        // Scale it appropriately
                        scale(use, 0.5, 0, 0);
                        const size = 0.75 * cellsize;
                        nested.viewbox(-size / 2, -size / 2, size, size).size(size, size);
                    }

                    // Place each delta
                    for (const delta of note.deltas as Delta[]) {
                        if (delta.delta !== 0) {
                            const key = `_delta_${delta.delta < 0 ? `n${Math.abs(delta.delta)}` : delta.delta}`;
                            const point = grid[delta.row][delta.col];
                            const piece = this.rootSvg.findOne(`#${key}`) as Svg;
                            if ( (piece === null) || (piece === undefined) ) {
                                throw new Error(`Could not find the requested delta (${key}).`);
                            }
                            const factor = 0.33; // 0.85;
                            let cornerX: number; let cornerY: number;
                            if (rotation === 180) {
                                cornerX = point.x - (this.cellsize / 2) + (this.cellsize / 5);
                                cornerY = point.y + (this.cellsize / 2) - (this.cellsize / 5);
                            } else {
                                cornerX = point.x + (this.cellsize / 2) - (this.cellsize / 5);
                                cornerY = point.y - (this.cellsize / 2) + (this.cellsize / 5);
                            }
                            usePieceAt({svg: notes, piece, cellsize: this.cellsize, x: cornerX, y: cornerY, scalingFactor: factor});
                        }
                    }
                } else {
                    throw new Error(`The requested annotation (${ note.type as string }) is not supported.`);
                }
            }
        }
    }

    private interpolateFromGrid(grid: GridPoints, point: ITarget) : [number, number] {
        const [x, y] = [point.col, point.row];
        const col = Math.floor(x);
        const row = Math.floor(y);
        let gridx = grid[row][col].x;
        if (!Number.isInteger(x))
            gridx += (x - col) * (grid[row][col + 1].x - grid[row][col].x);
        let gridy = grid[row][col].y;
        if (!Number.isInteger(y))
            gridy += (y - row) * (grid[row + 1][col].y - grid[row][col].y);
        return [gridx, gridy];
    }

    /**
     * Markers are placed right after the board itself is generated, and so are obscured by placed pieces.
     *
     * @param svgGroup - The SVG `<group>` you want to add the markers too. This is just for the sake of organization.
     * @param grid - The map of row/column to x/y created by one of the grid point generators.
     * @param gridExpanded - Square maps need to be expanded a little for all the markers to work. If provided, this is what will be used.
     */
    // protected markBoard(svgGroup: SVGG, preGridLines: boolean, grid: GridPoints, gridExpanded?: GridPoints, hexGrid?: Grid<Hex>, hexWidth?: number, hexHeight?: number): void {
    public markBoard(opts: IMarkBoardOptions): void {
        const svgGroup = opts.svgGroup;
        const preGridLines = opts.preGridLines;
        const grid = opts.grid;
        let gridExpanded: GridPoints|undefined;
        if (opts.gridExpanded !== undefined) {
            gridExpanded = opts.gridExpanded;
        }
        let hexGrid: Grid<Hex>|undefined;
        if (opts.hexGrid !== undefined) {
            hexGrid = opts.hexGrid;
        }
        let hexWidth: number|undefined;
        if (opts.hexWidth !== undefined) {
            hexWidth = opts.hexWidth
        }
        let hexHeight: number|undefined;
        if (opts.hexHeight !== undefined) {
            hexHeight = opts.hexHeight
        }
        let polys: Poly[][]|undefined;
        if (opts.polys !== undefined) {
            polys = opts.polys;
        }

        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        if ( ("board" in this.json) && (this.json.board !== undefined) && ("markers" in this.json.board!) && (this.json.board.markers !== undefined) && (Array.isArray(this.json.board.markers)) && (this.json.board.markers.length > 0) ) {
            if ( (! ("style" in this.json.board)) || (this.json.board.style === undefined) ) {
                throw new Error("This `markBoard` function only works with renderers that include a `style` property.");
            }

            let baseStroke = 1;
            let baseColour = this.options.colourContext.strokes;
            let baseOpacity = 1;
            if ( ("strokeWeight" in this.json.board) && (this.json.board.strokeWeight !== undefined) ) {
                baseStroke = this.json.board.strokeWeight;
            }
            if ( ("strokeColour" in this.json.board) && (this.json.board.strokeColour !== undefined) ) {
                baseColour = this.resolveColour(this.json.board.strokeColour) as string;
            }
            if ( ("strokeOpacity" in this.json.board) && (this.json.board.strokeOpacity !== undefined) ) {
                baseOpacity = this.json.board.strokeOpacity;
            }

            const allMarkers = this.json.board.markers.filter(m => m.type !== "fences");
            const fences = this.json.board.markers.filter(m => m.type === "fences") as MarkerFences[];
            if (fences.length > 0) {
                for (const decl of fences) {
                    for (const side of decl.sides) {
                        allMarkers.push({type: "fence", ...side} as MarkerFence);
                    }
                }
            }

            for (const marker of allMarkers) {
                let belowGrid: boolean|undefined;
                if ((marker.type === "flood") && marker.belowGrid === undefined) {
                    marker.belowGrid = true;
                }
                if ("belowGrid" in marker) {
                    belowGrid = marker.belowGrid;
                }
                if (! ((preGridLines && belowGrid === true) || (!preGridLines && (belowGrid === undefined || belowGrid === false)) || (preGridLines && marker.type === "halo") )) {
                    continue;
                }
                const cloned = {...marker};
                if ("points" in cloned) {
                    // @ts-expect-error (only used to generate UUID)
                    delete cloned.points;
                }
                if (marker.type === "dots") {
                    let colour: string|SVGGradient = baseColour;
                    if ( ("colour" in marker) && (marker.colour !== undefined) ) {
                        colour = this.resolveColour(marker.colour as string|number|Gradient);
                    }
                    let opacity = baseOpacity;
                    if ( ("opacity" in marker) && (marker.opacity !== undefined) ) {
                        opacity = marker.opacity;
                    }
                    let diameter = 0.2;
                    if ( ("size" in marker) && (marker.size !== undefined) ) {
                        diameter = marker.size;
                    }
                    const pts: [number, number][] = [];
                    for (const point of marker.points as ITarget[]) {
                        pts.push([point.row, point.col]);
                    }
                    pts.forEach((p) => {
                        const pt = grid[p[0]][p[1]];
                        // these exceptions are due to poor SVGjs typing

                        svgGroup.circle(this.cellsize * diameter)
                            // @ts-expect-error (poor SVGjs typing)
                            .fill(colour)
                            .opacity(opacity)
                            .stroke({width: 0})
                            .center(pt.x, pt.y)
                            .attr({ 'pointer-events': 'none' })
                            .addClass(`aprender-marker-${x2uid(cloned)}`);
                    });
                } else if (marker.type === "shading") {
                    let colour: string|SVGGradient = this.options.colourContext.fill;
                    if ( ("colour" in marker) && (marker.colour !== undefined) ) {
                        colour = this.resolveColour(marker.colour as string|number|Gradient);
                    }
                    let opacity = 0.25;
                    if ( ("opacity" in marker) && (marker.opacity !== undefined) ) {
                        opacity = marker.opacity;
                    }
                    const points: [number, number][] = [];
                    if ( ( (this.json.board.style.startsWith("squares")) || (this.json.board.style.startsWith("sowing")) || this.json.board.style === "pegboard") && (gridExpanded !== undefined) ) {
                        for (const point of marker.points as ITarget[]) {
                            points.push([gridExpanded[point.row][point.col].x, gridExpanded[point.row][point.col].y]);
                        }
                    } else {
                        for (const point of marker.points as ITarget[]) {
                            points.push([grid[point.row][point.col].x, grid[point.row][point.col].y]);
                        }
                    }
                    const ptstr = points.map((p) => p.join(",")).join(" ");
                    // @ts-expect-error (poor SVGjs typing)
                    svgGroup.polygon(ptstr).addClass(`aprender-marker-${x2uid(cloned)}`).fill(colour).opacity(opacity).attr({ 'pointer-events': 'none' });
                } else if (marker.type === "flood") {
                    if (polys === undefined) {
                        throw new Error("The `flood` marker can only be used if polygons are passed to the marking code.");
                    }
                    let isGradient = false;
                    let colour: string|SVGGradient = this.options.colourContext.fill;
                    if ( ("colour" in marker) && (marker.colour !== undefined) ) {
                        if (typeof marker.colour === "object") {
                            isGradient = true;
                        }
                        colour = this.resolveColour(marker.colour);
                    }
                    let opacity = 0.25;
                    if ( ("opacity" in marker) && (marker.opacity !== undefined) ) {
                        opacity = marker.opacity;
                    }
                    let pattern: string | undefined;
                    if ( ("pattern" in marker) && (marker.pattern !== undefined) && (marker.pattern.length > 0) ) {
                        pattern = marker.pattern;
                    }
                    if (pattern !== undefined) {
                        this.loadPattern(pattern, {bg: "none", fg: typeof colour === "string" ? colour : undefined});
                    }
                    let fill: FillData|SVGGradient|SVGElement;
                    if (isGradient) {
                        fill = colour as SVGGradient;
                    } else if (pattern !== undefined) {
                        if (pattern !== undefined) {
                            fill = this.rootSvg.findOne(`#${pattern}`) as SVGElement;
                            if (fill === undefined) {
                                throw new Error("Could not load the requested pattern.");
                            }
                        }
                    } else {
                        fill = {color: colour as string, opacity};
                    }
                    for (const point of marker.points as ITarget[]) {
                        let floodEle: SVGCircle|SVGPolygon|SVGPath|undefined;
                        const cell = polys[point.row][point.col];
                        if (cell === undefined || cell === null) {
                            throw new Error(`There is no polygon at row ${point.row}, col ${point.col}. (In "wheel" boards, polygons are only present on odd-numbered rows.)`);
                        }
                        // the following eslint and ts exceptions are due to poor SVGjs typing
                        switch (cell.type) {
                            case "circle":
                                // @ts-expect-error (poor SVGjs typing)
                                floodEle = svgGroup.circle(cell.r * 2).addClass(`aprender-marker-${x2uid(cloned)}`).stroke({color: "none", width: baseStroke}).fill(fill).center(cell.cx, cell.cy).attr({ 'pointer-events': 'none' });
                                break;
                            case "poly":
                                // @ts-expect-error (poor SVGjs typing)
                                floodEle = svgGroup.polygon(cell.points.map(pt => `${pt.x},${pt.y}`).join(" ")).addClass(`aprender-marker-${x2uid(cloned)}`).stroke({color: "none", width: baseStroke, linecap: "round", linejoin: "round"}).fill(fill).attr({ 'pointer-events': 'none' });
                                break;
                            case "path":
                                // @ts-expect-error (poor SVGjs typing)
                                floodEle = svgGroup.path(cell.path).addClass(`aprender-marker-${x2uid(cloned)}`).stroke({color: "none", width: baseStroke, linecap: "round", linejoin: "round"}).fill(fill).attr({ 'pointer-events': 'none' });
                                break;
                        }
                        if (marker.pulse !== undefined && floodEle !== undefined) {

                            floodEle.animate({duration: marker.pulse, delay: 0, when: "now", swing: true} as TimeLike).during((t: number) => floodEle!.fill({opacity: t})).loop(undefined, true);
                        }
                    }
                } else if (marker.type === "line") {
                    let colour = baseColour;
                    if ( ("colour" in marker) && (marker.colour !== undefined) ) {
                        colour = this.resolveColour(marker.colour ) as string;
                    }
                    let opacity = baseOpacity;
                    if ( ("opacity" in marker) && (marker.opacity !== undefined) ) {
                        opacity = marker.opacity;
                    }
                    let width = baseStroke;
                    if ( ("width" in marker) && (marker.width !== undefined) ) {
                        width = marker.width;
                    }
                    const stroke: StrokeData = {
                        color: colour,
                        opacity,
                        width,
                        linecap: "round", linejoin: "round"
                    };
                    if ( ("style" in marker) && (marker.style !== undefined) && (marker.style === "dashed") ) {
                        if ( ("dasharray" in marker) && (marker.dasharray !== undefined) && (Array.isArray(marker.dasharray)) ) {
                            stroke.dasharray = marker.dasharray.join(" ");
                        } else {
                            stroke.dasharray = "4";
                        }
                    }
                    let centered = false;
                    if ( "centered" in marker && marker.centered !== undefined && marker.centered) {
                        centered = true;
                    }
                    let clickable = false;
                    if ( "clickable" in marker && marker.clickable !== undefined && marker.clickable && this.options.boardClick !== undefined) {
                        clickable = true;
                    }

                    let x1: number; let x2: number; let y1: number; let y2: number;
                    const point1 = (marker.points as ITarget[])[0];
                    const point2 = (marker.points as ITarget[])[1];
                    if ( (this.json.board.style.startsWith("squares") || this.json.board.style === "pegboard") && (gridExpanded !== undefined) && (! centered) ) {
                        [x1, y1] = [gridExpanded[point1.row][point1.col].x, gridExpanded[point1.row][point1.col].y];
                        [x2, y2] = [gridExpanded[point2.row][point2.col].x, gridExpanded[point2.row][point2.col].y];
                    } else {
                        [x1, y1] = [grid[point1.row][point1.col].x, grid[point1.row][point1.col].y];
                        [x2, y2] = [grid[point2.row][point2.col].x, grid[point2.row][point2.col].y];
                    }

                    if ("shorten" in marker && marker.shorten !== undefined && marker.shorten > 0) {
                        [x1, y1, x2, y2] = shortenLine(x1, y1, x2, y2, marker.shorten);
                    }

                    const line = svgGroup.line(x1, y1, x2, y2).stroke(stroke).addClass(`aprender-marker-${x2uid(cloned)}`);
                    if (clickable) {
                        const id = `${point1.col},${point1.row}|${point2.col},${point2.row}`;
                        line.click((e: MouseEvent) => {
                            this.options.boardClick!(-1, -1, id);
                            e.stopPropagation();
                        });
                    } else {
                        line.attr({ 'pointer-events': 'none' });
                    }
                } else if (marker.type === "halo") {
                    /**
                     * There are two types of halos:
                     *   - One drawn with line segments around a circular board
                     *   - One drawn around `hex-of-*` boards where a board backfill is necessary
                     *     because it draws a solid circle occluded by the board
                     */
                    if (! this.json.board.style.startsWith("circular") && ! this.json.board.style.startsWith("conical-hex") && !this.json.board.style.startsWith("hex-of") ) {
                        throw new Error("The `halo` marker only works with `circular-*`, `conical-hex*`, and `hex-of*` boards.");
                    }

                    // full circle one
                    if (this.json.board.style.startsWith("hex-of")) {
                        if (!preGridLines) {

                            let polys: Poly[][]|undefined;
                            if (opts.polys !== undefined) {
                                polys = opts.polys;
                            }
                            if (polys === undefined) {
                                throw new Error("The `halo` marker requires that the polygons be passed.");
                            }
                            const union = unionPolys(polys.flat()).map(([x,y]) => {return {x,y}}) as IPoint[];
                            const minx = Math.min(...union.map(pt => pt.x));
                            const maxx = Math.max(...union.map(pt => pt.x));
                            const hullWidth = maxx - minx;
                            let cx = minx + (hullWidth / 2);
                            const miny = Math.min(...union.map(pt => pt.y));
                            const maxy = Math.max(...union.map(pt => pt.y));
                            const hullHeight = maxy - miny;
                            let cy = miny + (hullHeight / 2);
                            const diameter = Math.max(hullHeight, hullWidth) + (this.cellsize / 2);
                            const r = diameter / 2;

                            // check for centre nudging
                            if ("nudge" in marker && marker.nudge !== undefined) {
                                cx += marker.nudge.dx;
                                cy += marker.nudge.dy;
                            }

                            let degStart = 0;
                            if ( ("circular-start" in this.json.board) && (this.json.board["circular-start"] !== undefined) ) {
                                degStart = this.json.board["circular-start"];
                            }
                            if ( ("offset" in marker) && (marker.offset !== undefined) ) {
                                degStart += marker.offset;
                            }
                            const phi = 360 / marker.segments.length;
                            for (let i = 0; i < marker.segments.length; i++) {
                                const segment: ISegment = marker.segments[i] as ISegment;
                                let colour = baseColour;
                                if ( ("colour" in segment) && (segment.colour !== undefined) ) {
                                    colour = this.resolveColour(segment.colour) as string;
                                }
                                let opacity = baseOpacity;
                                if ( ("opacity" in segment) && (segment.opacity !== undefined) ) {
                                    opacity = segment.opacity;
                                }
                                const fill: FillData = {
                                    color: colour,
                                    opacity,
                                };
                                // if there's only one segment, draw a full circle/ellipse
                                let haloPoly: SVGCircle|SVGPath;
                                if (phi === 360) {
                                    haloPoly = this.rootSvg.circle(r * 2).addClass(`aprender-marker-${x2uid(cloned)}-segment${i+1}`).fill(fill).stroke("none");
                                }
                                // otherwise, draw an arc
                                else {
                                    const [xleft, yleft] = projectPoint(cx, cy, r, degStart + (phi * i));
                                    const [xright, yright] = projectPoint(cx, cy, r, degStart + (phi * (i+1)));
                                    haloPoly = this.rootSvg.path(`M${xleft},${yleft} A ${r} ${r} 0 0 1 ${xright},${yright} L${cx},${cy} L${xleft},${yleft}`).addClass(`aprender-marker-${x2uid(cloned)}-segment${i+1}`).fill(fill).stroke("none");
                                }
                                haloPoly.back();
                            }
                        }
                    }
                    // the line segment one
                    else {

                        let polys: Poly[][]|undefined;
                        if (opts.polys !== undefined) {
                            polys = opts.polys;
                        }
                        if (polys === undefined) {
                            throw new Error("The `halo` marker requires that the polygons be passed.");
                        }
                        let rx = 0;
                        let ry = 0;
                        let cx = 0;
                        let cy = 0;
                        if (this.json.board.style.startsWith("circular") && !this.json.board.style.endsWith("moon")) {
                            for (const poly of polys.flat()) {
                                if (poly.type !== "circle") {
                                    for (const pt of poly.points) {
                                        rx = rx === undefined ? Math.max(pt.x, pt.y) : Math.max(rx, pt.x, pt.y);
                                        ry = rx;
                                    }
                                }
                            }
                        } else {
                            const allCoords: IPoint[] = (polys.flat() as IPolyPolygon[]).map(p => p.points).flat();
                            const minx = Math.min(...allCoords.map(pt => pt.x));
                            const maxx = Math.max(...allCoords.map(pt => pt.x));
                            let miny = Math.min(...allCoords.map(pt => pt.y));
                            if (this.json.board.style.endsWith("narrow")) {
                                miny -= 15;
                            }
                            const maxy = Math.max(...allCoords.map(pt => pt.y));
                            const width = maxx - minx;
                            const height = maxy - miny;
                            rx = (width / 2)
                            if (!this.json.board.style.endsWith("moon")) {
                                rx *= 1.05;
                            } else {
                                rx *= 1.02;
                            }
                            const dx = Math.abs(rx - (width / 2));
                            cx = minx + rx - dx;
                            ry = (height / 2);
                            if (!this.json.board.style.endsWith("moon")) {
                                ry *= 1.05;
                            } else {
                                ry *= 1.02;
                            }
                            const dy = Math.abs(ry - (height / 2));
                            cy = miny + ry - dy;

                            if (this.json.board.style.endsWith("moon")) {
                                const max = Math.max(rx, ry);
                                rx = max;
                                ry = max;
                                // cy++;
                            }
                        }
                        if (preGridLines) {
                            let fill: string|undefined;
                            if ( ("fill" in marker) && (marker.fill !== undefined) ) {
                                fill = this.resolveColour(marker.fill) as string;
                            }
                            if (fill !== undefined) {
                                if (this.json.board.style.startsWith("circular")) {
                                    svgGroup.circle(rx * 2).fill(fill).center(cx,cy);
                                } else {
                                    svgGroup.ellipse(rx * 2, ry * 2).fill(fill).center(cx,cy);
                                }
                            }
                        } else {
                            let width = baseStroke;
                            if ( ("width" in marker) && (marker.width !== undefined) ) {
                                width = marker.width;
                            }
                            rx += width / 2;
                            ry += width / 2;
                            let degStart = 0;
                            if ( ("circular-start" in this.json.board) && (this.json.board["circular-start"] !== undefined) ) {
                                degStart = this.json.board["circular-start"];
                            }
                            if ( ("offset" in marker) && (marker.offset !== undefined) ) {
                                degStart += marker.offset;
                            }
                            const phi = 360 / marker.segments.length;
                            for (let i = 0; i < marker.segments.length; i++) {
                                const segment: ISegment = marker.segments[i] as ISegment;
                                let colour = baseColour;
                                if ( ("colour" in segment) && (segment.colour !== undefined) ) {
                                    colour = this.resolveColour(segment.colour) as string;
                                }
                                let opacity = baseOpacity;
                                if ( ("opacity" in segment) && (segment.opacity !== undefined) ) {
                                    opacity = segment.opacity;
                                }
                                const stroke: StrokeData = {
                                    color: colour,
                                    opacity,
                                    width,
                                    linecap: "round", linejoin: "round"
                                };
                                if ( ("style" in segment) && (segment.style !== undefined) && (segment.style === "dashed") ) {
                                    stroke.dasharray = "4";
                                }
                                // if there's only one segment, draw a full circle/ellipse
                                if (phi === 360) {
                                    if (this.json.board.style.startsWith("circular")) {
                                        svgGroup.circle(rx * 2).addClass(`aprender-marker-${x2uid(cloned)}-segment${i+1}`).fill("none").stroke(stroke);
                                    } else {
                                        svgGroup.ellipse(rx * 2, ry * 2).addClass(`aprender-marker-${x2uid(cloned)}-segment${i+1}`).fill("none").stroke(stroke);
                                    }
                                }
                                // otherwise, draw an arc
                                else {
                                    let xleft: number;
                                    let yleft: number;
                                    let xright: number;
                                    let yright: number;
                                    if (this.json.board.style.startsWith("circular")) {
                                        [xleft, yleft] = projectPoint(cx, cy, rx, degStart + (phi * i));
                                        [xright, yright] = projectPoint(cx, cy, rx, degStart + (phi * (i+1)));
                                    } else {
                                        [xleft, yleft] = projectPointEllipse(cx, cy, rx, ry, degStart + (phi * i));
                                        [xright, yright] = projectPointEllipse(cx, cy, rx, ry, degStart + (phi * (i+1)));
                                    }
                                    svgGroup.path(`M${xleft},${yleft} A ${rx} ${ry} 0 0 1 ${xright},${yright}`).addClass(`aprender-marker-${x2uid(cloned)}-segment${i+1}`).fill("none").stroke(stroke);
                                }
                            }
                        }
                    }
                } else if (marker.type === "label") {
                    let colour = baseColour;
                    if ( ("colour" in marker) && (marker.colour !== undefined) ) {
                        colour = this.resolveColour(marker.colour ) as string;
                    }

                    let x1: number; let x2: number; let y1: number; let y2: number;
                    if ( (this.json.board.style.startsWith("squares") || this.json.board.style === "pegboard") && (gridExpanded !== undefined) ) {
                        const point1 = (marker.points as ITarget[])[0];
                        [x1, y1] = this.interpolateFromGrid(gridExpanded, point1);
                        const point2 = (marker.points as ITarget[])[1];
                        [x2, y2] = this.interpolateFromGrid(gridExpanded, point2);
                    } else {
                        const point1 = (marker.points as ITarget[])[0];
                        [x1, y1] = this.interpolateFromGrid(grid, point1);
                        const point2 = (marker.points as ITarget[])[1];
                        [x2, y2] = this.interpolateFromGrid(grid, point2);
                    }

                    // check for nudging
                    if ( ("nudge" in marker) && (marker.nudge !== undefined) && (marker.nudge !== null) ) {
                        const {dx, dy} = marker.nudge as {dx: number; dy: number};
                        x1 += (dx * this.cellsize); x2 += (dx * this.cellsize);
                        y1 += (dy * this.cellsize); y2 += (dy * this.cellsize);
                    }
                    let font = 'font-size: 17px;';
                    if ( ("size" in marker) && (marker.size !== undefined) ) {
                        font = `font-size: ${marker.size }px;`;
                    }
                    font += marker.font ?? '';
                    const text = svgGroup.text((add) => {
                            add.tspan(marker.label ).attr('style', font).attr("dy", "0.55em");
                        })
                        .addClass(`aprender-marker-${x2uid(cloned)}`)
                        .font({ fill: colour, anchor: "middle"})
                        .attr("dominant-baseline", "middle");
                    text.path(`M${x1},${y1} L${x2},${y2}`)
                        .attr("startOffset", "50%");
                } else if (marker.type === "edge") {
                    let colour = this.options.colourContext.strokes;
                    if ( ("colour" in marker) && (marker.colour !== undefined) ) {
                        colour = this.resolveColour(marker.colour ) as string;
                    }
                    let opacity = baseOpacity + ((1 - baseOpacity) / 2);
                    if ( ("opacity" in marker) && (marker.opacity !== undefined) ) {
                        opacity = marker.opacity;
                    }
                    const style = this.json.board.style;
                    if ( style.startsWith("vertex")|| style.startsWith("conhex") ) {
                        let xFrom = 0; let yFrom = 0;
                        let xTo = 0; let yTo = 0;
                        switch (marker.edge) {
                            case "N":
                                xFrom = grid[0][0].x;
                                yFrom = grid[0][0].y;
                                xTo = grid[0][grid[0].length - 1].x;
                                yTo = grid[0][grid[0].length - 1].y;
                                break;
                            case "E":
                                xFrom = grid[0][grid[0].length - 1].x;
                                yFrom = grid[0][grid[0].length - 1].y;
                                xTo = grid[grid.length - 1][grid[0].length - 1].x;
                                yTo = grid[grid.length - 1][grid[0].length - 1].y;
                                break;
                            case "S":
                                xFrom = grid[grid.length - 1][0].x;
                                yFrom = grid[grid.length - 1][0].y;
                                xTo = grid[grid.length - 1][grid[0].length - 1].x;
                                yTo = grid[grid.length - 1][grid[0].length - 1].y;
                                break;
                            case "W":
                                xFrom = grid[0][0].x;
                                yFrom = grid[0][0].y;
                                xTo = grid[grid.length - 1][0].x;
                                yTo = grid[grid.length - 1][0].y;
                                break;
                        }
                        svgGroup.line(xFrom, yFrom, xTo, yTo).addClass(`aprender-marker-${x2uid(cloned)}`).stroke({width: baseStroke * 3, color: colour, opacity, linecap: "round", linejoin: "round"});
                    } else if ( ( (style.startsWith("squares")) || (style === "sowing") || style === "pegboard" ) && (gridExpanded !== undefined) ) {
                        let xFrom = 0; let yFrom = 0;
                        let xTo = 0; let yTo = 0;
                        switch (marker.edge) {
                            case "N":
                                xFrom = gridExpanded[0][0].x;
                                yFrom = gridExpanded[0][0].y;
                                xTo = gridExpanded[0][gridExpanded[0].length - 1].x;
                                yTo = gridExpanded[0][gridExpanded[0].length - 1].y;
                                break;
                            case "E":
                                xFrom = gridExpanded[0][gridExpanded[0].length - 1].x;
                                yFrom = gridExpanded[0][gridExpanded[0].length - 1].y;
                                xTo = gridExpanded[gridExpanded.length - 1][gridExpanded[0].length - 1].x;
                                yTo = gridExpanded[gridExpanded.length - 1][gridExpanded[0].length - 1].y;
                                break;
                            case "S":
                                xFrom = gridExpanded[gridExpanded.length - 1][0].x;
                                yFrom = gridExpanded[gridExpanded.length - 1][0].y;
                                xTo = gridExpanded[gridExpanded.length - 1][gridExpanded[0].length - 1].x;
                                yTo = gridExpanded[gridExpanded.length - 1][gridExpanded[0].length - 1].y;
                                break;
                            case "W":
                                xFrom = gridExpanded[0][0].x;
                                yFrom = gridExpanded[0][0].y;
                                xTo = gridExpanded[gridExpanded.length - 1][0].x;
                                yTo = gridExpanded[gridExpanded.length - 1][0].y;
                                break;
                        }
                        svgGroup.line(xFrom, yFrom, xTo, yTo).addClass(`aprender-marker-${x2uid(cloned)}`).stroke({width: baseStroke * 3, color: colour, opacity, linecap: "round", linejoin: "round"});
                    } else if (style === "squares-diamonds") {
                        const xMin = Math.min(...grid.flat().flat().map(pt => pt.x));
                        const yMin = Math.min(...grid.flat().flat().map(pt => pt.y));
                        const xMax = Math.max(...grid.flat().flat().map(pt => pt.x));
                        const yMax = Math.max(...grid.flat().flat().map(pt => pt.y));
                        let xFrom = 0; let yFrom = 0;
                        let xTo = 0; let yTo = 0;
                        let buffer = (this.cellsize / 2) + (baseStroke * 3);
                        if ("sdStart" in this.json.board && this.json.board.sdStart === "D") {
                            buffer = this.cellsize * 0.25;
                        }
                        switch (marker.edge) {
                            case "N":
                                xFrom = xMin - buffer;
                                yFrom = yMin - buffer;
                                xTo = xMax + buffer;
                                yTo = yFrom;
                                break;
                            case "E":
                                xFrom = xMax + buffer;
                                yFrom = yMin - buffer;
                                xTo = xFrom;
                                yTo = yMax + buffer;
                                break;
                            case "S":
                                xFrom = xMin - buffer;
                                yFrom = yMax + buffer;
                                xTo = xMax + buffer;
                                yTo = yFrom;
                                break;
                            case "W":
                                xFrom = xMin - buffer;
                                yFrom = yMin - buffer;
                                xTo = xFrom;
                                yTo = yMax + buffer;
                                break;
                        }
                        svgGroup.line(xFrom, yFrom, xTo, yTo).addClass(`aprender-marker-${x2uid(cloned)}`).stroke({width: baseStroke * 3, color: colour, opacity, linecap: "round", linejoin: "round"});
                    } else if (style === "hex-of-tri") {
                        const midrow = Math.floor(grid.length / 2);
                        let xFrom = 0; let yFrom = 0;
                        let xTo = 0; let yTo = 0;
                        switch (marker.edge) {
                            case "N":
                                xFrom = grid[0][0].x;
                                yFrom = grid[0][0].y;
                                xTo = grid[0][grid[0].length - 1].x;
                                yTo = grid[0][grid[0].length - 1].y;
                                break;
                            case "NE":
                                xFrom = grid[0][grid[0].length - 1].x;
                                yFrom = grid[0][grid[0].length - 1].y;
                                xTo = grid[midrow][grid[midrow].length - 1].x;
                                yTo = grid[midrow][grid[midrow].length - 1].y;
                                break;
                            case "SE":
                                xFrom = grid[midrow][grid[midrow].length - 1].x;
                                yFrom = grid[midrow][grid[midrow].length - 1].y;
                                xTo = grid[grid.length - 1][grid[grid.length - 1].length - 1].x;
                                yTo = grid[grid.length - 1][grid[grid.length - 1].length - 1].y;
                                break;
                            case "S":
                                xFrom = grid[grid.length - 1][0].x;
                                yFrom = grid[grid.length - 1][0].y;
                                xTo = grid[grid.length - 1][grid[grid.length - 1].length - 1].x;
                                yTo = grid[grid.length - 1][grid[grid.length - 1].length - 1].y;
                                break;
                            case "SW":
                                xFrom = grid[grid.length - 1][0].x;
                                yFrom = grid[grid.length - 1][0].y;
                                xTo = grid[midrow][0].x;
                                yTo = grid[midrow][0].y;
                                break;
                            case "NW":
                                xFrom = grid[midrow][0].x;
                                yFrom = grid[midrow][0].y;
                                xTo = grid[0][0].x;
                                yTo = grid[0][0].y;
                                break;
                        }
                        svgGroup.line(xFrom, yFrom, xTo, yTo).addClass(`aprender-marker-${x2uid(cloned)}`).stroke({width: baseStroke * 3, color: colour, opacity, linecap: "round", linejoin: "round"});
                    } else if ( (style === "hex-of-hex") && (polys !== undefined) ) {
                        /*
                         * Polys is populated.
                         * Point 0 is the top point (pointy topped).
                         * Corners need to share edges.
                         * N: 5-0, 0-1
                         * NE: 0-1, 1-2
                         * SE: 1-2, 2-3
                         * S: 2-3, 3-4
                         * SW: 3-4, 4-5
                         * NW: 4-5, 5-0
                         */
                        const midrow = Math.floor(grid.length / 2);
                        let hexes: Poly[];
                        let idxs: [[number,number],[number,number]];
                        switch (marker.edge) {
                            case "N":
                                hexes = polys[0];
                                idxs = [[5,0],[0,1]];
                                break;
                            case "NE":
                                hexes = [];
                                for (let row = 0; row <= midrow; row++) {
                                    hexes.push(polys[row][polys[row].length - 1]);
                                }
                                idxs = [[0,1],[1,2]];
                                break;
                            case "SE":
                                hexes = [];
                                for (let row = midrow; row < grid.length; row++) {
                                    hexes.push(polys[row][polys[row].length - 1]);
                                }
                                idxs = [[1,2],[2,3]];
                                break;
                            case "S":
                                hexes = [...polys[polys.length - 1]];
                                hexes.reverse();
                                idxs = [[2,3],[3,4]];
                                break;
                            case "SW":
                                hexes = [];
                                for (let row = midrow; row < grid.length; row++) {
                                    hexes.push(polys[row][0]);
                                }
                                hexes.reverse();
                                idxs = [[3,4],[4,5]];
                                break;
                            case "NW":
                                hexes = [];
                                for (let row = 0; row <= midrow; row++) {
                                    hexes.push(polys[row][0]);
                                }
                                hexes.reverse();
                                idxs = [[4,5],[5,0]];
                                break;
                            default:
                                throw new Error(`(hex-of-hex edge markings) Invalid edge direction given: ${marker.edge as string}`);
                        }
                        const lines: [number,number,number,number][] = [];
                        for (let i = 0; i < hexes.length; i++) {
                            const hex = hexes[i] as IPolyPolygon;
                            const pt1 = hex.points[idxs[0][0]];
                            const pt2 = hex.points[idxs[0][1]];
                            const pt3 = hex.points[idxs[1][1]];
                            // first corner
                            if (i === 0) {
                                const midx = (pt1.x + pt2.x) / 2;
                                const midy = (pt1.y + pt2.y) / 2;
                                lines.push([midx, midy, pt2.x, pt2.y]);
                                lines.push([pt2.x, pt2.y, pt3.x, pt3.y]);
                            }
                            // last corner
                            else if (i === hexes.length - 1) {
                                const midx = (pt2.x + pt3.x) / 2;
                                const midy = (pt2.y + pt3.y) / 2;
                                lines.push([pt1.x, pt1.y, pt2.x, pt2.y]);
                                lines.push([pt2.x, pt2.y, midx, midy]);
                            }
                            // everything in between
                            else {
                                lines.push([pt1.x, pt1.y, pt2.x, pt2.y]);
                                lines.push([pt2.x, pt2.y, pt3.x, pt3.y]);
                            }
                        }
                        for (const line of lines) {
                            svgGroup.line(...line).addClass(`aprender-marker-${x2uid(cloned)}`).stroke({width: baseStroke * 3, color: colour, opacity, linecap: "round", linejoin: "round"});
                        }
                    } else if ( (style === "hex-slanted") && (polys !== undefined) ) {
                        /*
                         * Polys is populated.
                         * Point 0 is the top point (pointy topped).
                         * Corners need to share edges.
                         * N: 5-0, 0-1
                         * E: 0-1, 1-2
                         * S: 2-3, 3-4
                         * W: 3-4, 4-5
                         */
                        let hexes: Poly[];
                        let idxs: [[number,number],[number,number]];
                        switch (marker.edge) {
                            case "N":
                                hexes = polys[0];
                                idxs = [[5,0],[0,1]];
                                break;
                            case "E":
                                hexes = polys.map(p => p[p.length - 1]);
                                idxs = [[0,1],[1,2]];
                                break;
                            case "S":
                                hexes = [...polys[polys.length - 1]];
                                hexes.reverse();
                                idxs = [[2,3],[3,4]];
                                break;
                            case "W":
                                hexes = polys.map(p => p[0]);
                                hexes.reverse();
                                idxs = [[3,4],[4,5]];
                                break;
                            default:
                                throw new Error(`(hex-slanted edge markings) Invalid edge direction given: ${marker.edge as string}`);
                        }
                        const lines: [number,number,number,number][] = [];
                        for (let i = 0; i < hexes.length; i++) {
                            const hex = hexes[i] as IPolyPolygon;
                            const pt1 = hex.points[idxs[0][0]];
                            const pt2 = hex.points[idxs[0][1]];
                            const pt3 = hex.points[idxs[1][1]];
                            // top right N
                            if ( (marker.edge === "N") && (i === hexes.length - 1) ) {
                                const midx = (pt2.x + pt3.x) / 2;
                                const midy = (pt2.y + pt3.y) / 2;
                                lines.push([pt1.x, pt1.y, pt2.x, pt2.y]);
                                lines.push([pt2.x, pt2.y, midx, midy]);
                            }
                            // top right E
                            else if ( (marker.edge === "E") && (i === 0) ) {
                                const midx = (pt1.x + pt2.x) / 2;
                                const midy = (pt1.y + pt2.y) / 2;
                                lines.push([midx, midy, pt2.x, pt2.y]);
                                lines.push([pt2.x, pt2.y, pt3.x, pt3.y]);
                            }
                            // bottom left S
                            else if ( (marker.edge === "S") && (i === hexes.length - 1) ) {
                                const midx = (pt2.x + pt3.x) / 2;
                                const midy = (pt2.y + pt3.y) / 2;
                                lines.push([pt1.x, pt1.y, pt2.x, pt2.y]);
                                lines.push([pt2.x, pt2.y, midx, midy]);
                            }
                            // bottom left W
                            else if ( (marker.edge === "W") && (i === 0) ) {
                                const midx = (pt1.x + pt2.x) / 2;
                                const midy = (pt1.y + pt2.y) / 2;
                                lines.push([midx, midy, pt2.x, pt2.y]);
                                lines.push([pt2.x, pt2.y, pt3.x, pt3.y]);
                            }
                            // everything else
                            else {
                                lines.push([pt1.x, pt1.y, pt2.x, pt2.y]);
                                lines.push([pt2.x, pt2.y, pt3.x, pt3.y]);
                            }
                        }
                        for (const line of lines) {
                            svgGroup.line(...line).addClass(`aprender-marker-${x2uid(cloned)}`).stroke({width: baseStroke * 3, color: colour, opacity, linecap: "round", linejoin: "round"});
                        }
                    } else if (style === "cairo-catalan" && polys !== undefined) {
                        const lines: [number,number,number,number][] = [];
                        if (marker.edge === "N") {
                            for (let i = 0; i < polys[0].length; i++) {
                                const poly = polys[0][i] as IPolyPolygon;
                                if (i % 2 === 0) {
                                    const pt1 = poly.points[0];
                                    const pt2 = poly.points[1];
                                    const pt3 = poly.points[2];
                                    lines.push([pt1.x, pt1.y, pt2.x, pt2.y]);
                                    lines.push([pt2.x, pt2.y, pt3.x, pt3.y]);
                                } else {
                                    const pt1 = poly.points[0];
                                    const pt2 = poly.points[1];
                                    lines.push([pt1.x, pt1.y, pt2.x, pt2.y]);
                                }
                            }
                        } else if (marker.edge === "S") {
                            for (let i = 0; i < polys[polys.length - 1].length; i++) {
                                const poly = polys[polys.length - 1][i] as IPolyPolygon;
                                if (polys.length % 2 === 0) {
                                    if (i % 2 === 0) {
                                        const pt1 = poly.points[2];
                                        const pt2 = poly.points[3];
                                        lines.push([pt1.x, pt1.y, pt2.x, pt2.y]);
                                    } else {
                                        const pt1 = poly.points[2];
                                        const pt2 = poly.points[3];
                                        const pt3 = poly.points[4];
                                        lines.push([pt1.x, pt1.y, pt2.x, pt2.y]);
                                        lines.push([pt2.x, pt2.y, pt3.x, pt3.y]);
                                    }
                                } else {
                                    if (i % 2 === 0) {
                                        const pt1 = poly.points[3];
                                        const pt2 = poly.points[4];
                                        lines.push([pt1.x, pt1.y, pt2.x, pt2.y]);
                                    } else {
                                        const pt1 = poly.points[2];
                                        const pt2 = poly.points[3];
                                        const pt3 = poly.points[4];
                                        lines.push([pt1.x, pt1.y, pt2.x, pt2.y]);
                                        lines.push([pt2.x, pt2.y, pt3.x, pt3.y]);
                                    }
                                }
                            }
                        } else if (marker.edge === "W") {
                            for (let i = 0; i < polys.length; i++) {
                                const poly = polys[i][0] as IPolyPolygon;
                                if (i % 2 === 0) {
                                    const pt1 = poly.points[4];
                                    const pt2 = poly.points[0];
                                    lines.push([pt1.x, pt1.y, pt2.x, pt2.y]);
                                } else {
                                    const pt1 = poly.points[0];
                                    const pt2 = poly.points[4];
                                    const pt3 = poly.points[3];
                                    lines.push([pt1.x, pt1.y, pt2.x, pt2.y]);
                                    lines.push([pt2.x, pt2.y, pt3.x, pt3.y]);
                                }
                            }
                        } else {
                            for (let i = 0; i < polys.length; i++) {
                                const rowWidth = polys[i].length;
                                const poly = polys[i][rowWidth - 1] as IPolyPolygon;
                                if (rowWidth % 2 === 0) {
                                    if (i % 2 === 0) {
                                        const pt1 = poly.points[1];
                                        const pt2 = poly.points[2];
                                        const pt3 = poly.points[3];
                                        lines.push([pt1.x, pt1.y, pt2.x, pt2.y]);
                                        lines.push([pt2.x, pt2.y, pt3.x, pt3.y]);
                                    } else {
                                        const pt1 = poly.points[1];
                                        const pt2 = poly.points[2];
                                        lines.push([pt1.x, pt1.y, pt2.x, pt2.y]);
                                    }
                                } else {
                                    if (i % 2 === 0) {
                                        const pt1 = poly.points[1];
                                        const pt2 = poly.points[2];
                                        const pt3 = poly.points[3];
                                        if (i !== 0) {
                                            lines.push([pt1.x, pt1.y, pt2.x, pt2.y]);
                                        }
                                        lines.push([pt2.x, pt2.y, pt3.x, pt3.y]);
                                    } else {
                                        const pt1 = poly.points[1];
                                        const pt2 = poly.points[2];
                                        lines.push([pt1.x, pt1.y, pt2.x, pt2.y]);
                                    }
                                }
                            }
                        }
                        for (const line of lines) {
                            svgGroup.line(...line).addClass(`aprender-marker-${x2uid(cloned)}`).stroke({width: baseStroke * 3, color: colour, opacity, linecap: "round", linejoin: "round"});
                        }
                    } else if (style === "cairo-collinear" && polys !== undefined) {
                        const lines: [number,number,number,number][] = [];
                        let startOrientation: "H"|"V" = "H";
                        if (opts.cairoStart !== undefined) {
                            startOrientation = opts.cairoStart;
                        }
                        const orientations: ("H"|"V")[] = [startOrientation];
                        if (startOrientation === "H") {
                            orientations.push("V");
                        } else {
                            orientations.push("H");
                        }

                        if (marker.edge === "N") {
                            const row = polys[0] as IPolyPolygon[];
                            for (let i = 0; i < row.length / 2; i++) {
                                const poly1 = row[i * 2];
                                const poly2 = row[(i * 2) + 1];
                                const orientation = orientations[i % 2];
                                if (orientation === "H") {
                                    lines.push([poly1.points[1].x, poly1.points[1].y, poly1.points[2].x, poly1.points[2].y]);
                                    lines.push([poly2.points[3].x, poly2.points[3].y, poly2.points[4].x, poly2.points[4].y])
                                } else {
                                    lines.push([poly1.points[4].x, poly1.points[4].y, poly1.points[0].x, poly1.points[0].y]);
                                    lines.push([poly1.points[0].x, poly1.points[0].y, poly1.points[1].x, poly1.points[1].y]);
                                }
                            }
                        } else if (marker.edge === "S") {
                            if (polys.length % 2 === 0) {
                                orientations.reverse();
                            }
                            const row = polys[polys.length - 1] as IPolyPolygon[];
                            for (let i = 0; i < row.length / 2; i++) {
                                const poly1 = row[i * 2];
                                const poly2 = row[(i * 2) + 1];
                                const orientation = orientations[i % 2];
                                if (orientation === "H") {
                                    lines.push([poly1.points[3].x, poly1.points[3].y, poly1.points[4].x, poly1.points[4].y]);
                                    lines.push([poly2.points[1].x, poly2.points[1].y, poly2.points[2].x, poly2.points[2].y])
                                } else {
                                    lines.push([poly2.points[4].x, poly2.points[4].y, poly2.points[0].x, poly2.points[0].y]);
                                    lines.push([poly2.points[0].x, poly2.points[0].y, poly2.points[1].x, poly2.points[1].y]);
                                }
                            }
                        } else if (marker.edge === "W") {
                            for (let i = 0; i < polys.length; i++) {
                                const poly1 = polys[i][0] as IPolyPolygon;
                                const poly2 = polys[i][1] as IPolyPolygon;
                                const orientation = orientations[i % 2];
                                if (orientation === "H") {
                                    lines.push([poly1.points[1].x, poly1.points[1].y, poly1.points[0].x, poly1.points[0].y]);
                                    lines.push([poly1.points[0].x, poly1.points[0].y, poly1.points[4].x, poly1.points[4].y]);
                                } else {
                                    lines.push([poly1.points[3].x, poly1.points[3].y, poly1.points[4].x, poly1.points[4].y]);
                                    lines.push([poly2.points[1].x, poly2.points[1].y, poly2.points[2].x, poly2.points[2].y])
                                }
                            }
                        } else {
                            if (Math.floor(polys[0].length / 2) % 2 === 0) {
                                orientations.reverse();
                            }
                            for (let i = 0; i < polys.length; i++) {
                                const poly1 = polys[i][polys[i].length - 1] as IPolyPolygon;
                                const poly2 = polys[i][polys[i].length - 2] as IPolyPolygon;
                                const orientation = orientations[i % 2];
                                if (orientation === "H") {
                                    lines.push([poly1.points[1].x, poly1.points[1].y, poly1.points[0].x, poly1.points[0].y]);
                                    lines.push([poly1.points[0].x, poly1.points[0].y, poly1.points[4].x, poly1.points[4].y]);
                                } else {
                                    lines.push([poly1.points[3].x, poly1.points[3].y, poly1.points[4].x, poly1.points[4].y]);
                                    lines.push([poly2.points[1].x, poly2.points[1].y, poly2.points[2].x, poly2.points[2].y]);
                                }
                            }
                        }

                        for (const line of lines) {
                            svgGroup.line(...line).addClass(`aprender-marker-${x2uid(cloned)}`).stroke({width: baseStroke * 3, color: colour, opacity, linecap: "round", linejoin: "round"});
                        }
                    } else if (style === "dvgc") {
                        let xFrom = 0; let yFrom = 0;
                        let xTo = 0; let yTo = 0;
                        switch (marker.edge) {
                            case "N":
                                xFrom = 0;
                                yFrom = 0;
                                xTo = 450;
                                yTo = 0;
                                break;
                            case "S":
                                xFrom = 0;
                                yFrom = 300;
                                xTo = 450;
                                yTo = 300;
                                break;
                            default:
                                throw new Error(`The dvgc board can only mark N and S edges.`);
                        }
                        svgGroup.line(xFrom, yFrom, xTo, yTo).addClass(`aprender-marker-${x2uid(cloned)}`).stroke({width: baseStroke * 3, color: colour, opacity, linecap: "round", linejoin: "round"});
                    } else if (style === "snubsquare" || style === "onyx") {
                        let realgrid = grid;
                        if (style === "onyx") {
                            realgrid = grid.reduce((prev, curr, idx) => idx % 2 === 0 ? [...prev, curr] : [...prev], [] as GridPoints);
                        }
                        const pts: IPoint[] = [];
                        switch (marker.edge) {
                            case "N":
                                pts.push(...realgrid[0]);
                                break;
                            case "S":
                                pts.push(...realgrid[realgrid.length - 1]);
                                break;
                            case "W":
                                pts.push(...realgrid.map(row => row[0]));
                                break;
                            case "E":
                                pts.push(...realgrid.map(row => row[row.length - 1]))
                        }
                        svgGroup.polyline(pts.map(pt => `${pt.x},${pt.y}`).join(" ")).addClass(`aprender-marker-${x2uid(cloned)}`).stroke({width: baseStroke * 3, color: colour, opacity, linecap: "round", linejoin: "round"}).fill("none");
                    } else if (style === "snubsquare-cells" && opts.gridExpanded !== undefined) {
                        const realgrid = opts.gridExpanded;
                        const pts: IPoint[] = [];
                        switch (marker.edge) {
                            case "N":
                                pts.push(...realgrid[0]);
                                break;
                            case "S":
                                pts.push(...realgrid[realgrid.length - 1]);
                                break;
                            case "W":
                                pts.push(...realgrid.map(row => row[0]));
                                break;
                            case "E":
                                pts.push(...realgrid.map(row => row[row.length - 1]))
                        }
                        svgGroup.polyline(pts.map(pt => `${pt.x},${pt.y}`).join(" ")).addClass(`aprender-marker-${x2uid(cloned)}`).stroke({width: baseStroke * 3, color: colour, opacity, linecap: "round", linejoin: "round"}).fill("none");
                    }
                } else if (marker.type === "fence") {
                    let colour = this.options.colourContext.strokes;
                    if ( ("colour" in marker) && (marker.colour !== undefined) ) {
                        colour = this.resolveColour(marker.colour ) as string;
                    }
                    let multiplier = 6;
                    if ( ("width" in marker) && (marker.width !== undefined) ) {
                        multiplier = marker.width;
                    }
                    const stroke: StrokeData = {
                        color: colour,
                        width: baseStroke * multiplier,
                        linecap: "round",
                        linejoin: "round",
                    };
                    if ( ("dashed" in marker) && (marker.dashed !== undefined) && (Array.isArray(marker.dashed)) && (marker.dashed.length > 0) ) {
                        stroke.dasharray = (marker.dashed ).join(" ");
                    }
                    const style = this.json.board.style;
                    if ( (style.startsWith("squares") || style === "pegboard") && (gridExpanded !== undefined) ) {
                        const row = marker.cell.row;
                        const col = marker.cell.col;
                        let xFrom = 0; let yFrom = 0;
                        let xTo = 0; let yTo = 0;
                        const cell = gridExpanded[row][col];
                        const east = gridExpanded[row][col + 1];
                        const southeast = gridExpanded[row + 1][col + 1];
                        const south = gridExpanded[row + 1][col];
                        switch (marker.side) {
                            case "N":
                                xFrom = cell.x;
                                yFrom = cell.y;
                                xTo = east.x;
                                yTo = east.y;
                                break;
                            case "E":
                                xFrom = east.x;
                                yFrom = east.y;
                                xTo = southeast.x;
                                yTo = southeast.y;
                                break;
                            case "S":
                                xFrom = south.x;
                                yFrom = south.y;
                                xTo = southeast.x;
                                yTo = southeast.y;
                                break;
                            case "W":
                                xFrom = cell.x;
                                yFrom = cell.y;
                                xTo = south.x;
                                yTo = south.y;
                                break;
                        }
                        const newclone = {...cloned};
                        // @ts-expect-error (only used to generate UUID)
                        delete newclone.cell;
                        // @ts-expect-error (only used to gnerate UUID)
                        delete newclone.side;
                        svgGroup.line(xFrom, yFrom, xTo, yTo).addClass(`aprender-marker-${x2uid(newclone)}`).stroke(stroke);
                    } else if ( (hexGrid !== undefined) && (hexWidth !== undefined) && (hexHeight !== undefined) && ( (style.startsWith("hex-odd")) || (style.startsWith("hex-even")) ) ) {
                        const row = marker.cell.row;
                        const col = marker.cell.col;
                        const hex = hexGrid.getHex({col, row});
                        if (hex !== undefined) {
                            const side = marker.side as CompassDirection;
                            const edges = edges2corners.get(hex.orientation)!;
                            const edge = edges.find(e => e.dir === side);
                            if (edge !== undefined) {
                                const [idx1, idx2] = edge.corners;
                                const {x: xFrom, y: yFrom} = hex.corners[idx1];
                                const {x: xTo, y: yTo} = hex.corners[idx2];
                                svgGroup.line(xFrom, yFrom, xTo, yTo).addClass(`aprender-marker-${x2uid(cloned)}`).stroke(stroke);
                            }
                        }
                    }
                } else if (marker.type === "glyph") {
                    const key = marker.glyph;
                    const piece = svgGroup.root().findOne("#" + key) as Svg;
                    if ( (piece === null) || (piece === undefined) ) {
                        throw new Error(`Could not find the requested piece (${key}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
                    }
                    for (const pt of marker.points as ITarget[]) {
                        const point = grid[pt.row][pt.col];
                        const use = usePieceAt({svg: svgGroup, piece, cellsize: this.cellsize, x: point.x, y: point.y, scalingFactor: 1});
                        use.attr({ 'pointer-events': 'none' });
                        // if (this.options.rotate && this.json.options && this.json.options.includes('rotate-pieces')) {
                        //     rotate(use, this.options.rotate, point.x, point.y);
                        // }
                    }
                }
            }
        }
    }

    /**
     * An internal helper function for generating `eject` annotations.
     * This is not generalized. It only assumes we are rotating in increments of 45 degrees.
     *
     * @param from - Starting point
     * @param to - Ending point
     * @param delta - The depth of the arc
     * @returns The midpoint of the arc
     */
    public getArcCentre(from: IPoint, to: IPoint, delta: number): IPoint {
        const m: IPoint = {x: (from.x + to.x) / 2, y: (from.y + to.y) / 2};
        let dir = "";
        if (to.y < from.y) {
            dir = "N";
        } else if (to.y > from.y) {
            dir = "S";
        }
        if (to.x < from.x) {
            dir += "W";
        } else if (to.x > from.x) {
            dir += "E";
        }
        switch (dir) {
            case "N":
            case "S":
            case "NE":
            case "SW":
                return {x: m.x + delta, y: m.y};
            case "E":
            case "W":
            case "NW":
            case "SE":
                return {x: m.x, y: m.y + delta};
            default:
                throw new Error(`Unrecognized direction ${dir}`);
        }
    }

    /**
     * Gets a list of column labels.
     *
     * @param arg1 - If alone, this is the number of labels you want starting from 0. Otherwise it's the starting point for the list.
     * @param arg2 - If provided, this is the number of labels you want, starting from nth label from the first argument.
     * @returns A list of labels
     */
    public getLabels(override: string[]|undefined, arg1: number, arg2?: number) : string[] {
        if (override !== undefined) {
            return [...override];
        }
        let start = 0;
        let count = 0;
        if (arg2 === undefined) {
            count = arg1;
        } else {
            start = arg1;
            count = arg2;
        }
        const it = generateColumnLabel(this.options.columnLabels);
        const labels: string[] = [];
        // prime the iterator to get to the start value
        for (let i = 0; i < start; i++) {
            it.next();
        }
        for (let i = 0; i < count; i++) {
            labels.push(it.next().value as string);
        }
        return labels;
    }

    public getRowLabels(override: unknown, height: number) : string[] {
        if (override !== undefined) {
            return ([...(override as string[])]).reverse();
        }
        const rowLabels: string[] = [];
        for (let row = 0; row < height; row++) {
            rowLabels.push((height - row).toString());
        }
        return rowLabels;
    }

    /**
     * An internal helper function for producing labels for hex fields.
     *
     * @param x - The column number
     * @param y - The row number
     * @param height - The total height of the field
     * @returns A string label for the hex
     */
    protected coords2algebraicHex(columnLabels: string[]|undefined, x: number, y: number, height: number): string {
        const [label] = this.getLabels(columnLabels, height - y - 1, 1);
        return label + (x + 1).toString();
    }

    /**
     * Generates the button bar and then places it appropriately.
     *
     * @param grid - The grid of points; used for positioning.
     * @param position - If given, overrides the JSON setting.
     */
    protected placeButtonBar(box: SVGBox, position?: "left"|"right", opts?: {padding?: number}): void {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Invalid object state.");
        }
        let padding = this.cellsize;
        if (opts !== undefined && opts.padding !== undefined) {
            padding = opts.padding;
        }
        if ( ("areas" in this.json) && (this.json.areas !== undefined) && (Array.isArray(this.json.areas)) && (this.json.areas.length > 0) ) {
            const bars = this.json.areas.filter((b) => b.type === "buttonBar") as AreaButtonBar[];
            if (bars.length > 1) {
                throw new Error("Only one button bar may be defined.");
            }
            if (bars.length === 1) {
                const bar = bars[0];
                const barimg = this.buildButtonBar(bar);
                const y = box.y; // - this.cellsize;
                // Position defaults to "right"
                // If a position is passed by the renderer, it overrides everything
                // Otherwise, the JSON prevails
                let pos = "right";
                if (position !== undefined) {
                    pos = position;
                } else if (bar.position !== undefined) {
                    pos = bar.position;
                }
                let x = 0;
                if (pos === "left") {
                    x = box.x - barimg.viewbox().w - padding;
                } else {
                    x = box.x2 + padding;
                }
                const used = this.rootSvg.use(barimg).size(barimg.viewbox().w, barimg.viewbox().h).move(x, y);
                if (this.options.boardClick !== undefined) {
                    const top = used.y() as number;
                    const height = used.height() as number;
                    const numButtons = bar.buttons.length;
                    const btnHeight = height / numButtons;
                    used.click((e: MouseEvent) => {
                        const point = used.point(e.clientX, e.clientY);
                        const yRelative = point.y - top;
                        const row = Math.floor(yRelative / btnHeight);
                        if ( (row >= 0) && (row < numButtons) ) {
                            let value = bar.buttons[row].label;
                            if(bar.buttons[row].value !== undefined) {
                                value = bar.buttons[row].value!;
                            }
                            this.options.boardClick!(-1, -1, `_btn_${value}`);
                            e.stopPropagation();
                        }
                    });
                }
            }
        }
    }

    /**
     * Builds the button bar from JSON.
     *
     * @param bar - The parsed JSON representing the button bar
     * @returns The nested SVG, which is embedded in the root `defs()`
     */
    protected buildButtonBar(bar: AreaButtonBar): Svg {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Invalid object state.");
        }

        // initialize values
        let colour = this.options.colourContext.strokes;
        if (bar.colour !== undefined) {
            colour= this.resolveColour(bar.colour) as string;
        }
        let minWidth = 0;
        if (bar.minWidth !== undefined) {
            minWidth = bar.minWidth;
        }
        let height = this.cellsize;
        if (bar.height !== undefined) {
            height = this.cellsize * bar.height;
        }
        let buffer = 0;
        if (bar.buffer !== undefined) {
            buffer = height * bar.buffer;
        }
        const nested = this.rootSvg.defs().nested().id("_btnBar");

        // build symbols of each label
        const labels: SVGSymbol[] = [];
        let maxWidth = minWidth;
        let maxHeight = 0;
        for (const b of bar.buttons) {
            const cloned = {attributes: b.attributes, fill: b.fill};
            const tmptxt = this.rootSvg.text(b.label).font({size: 17, fill: colour, anchor: "start"});
            if (b.attributes !== undefined) {
                for (const a of b.attributes) {
                    tmptxt.attr(a.name, a.value);
                }
            }
            maxWidth = Math.max(maxWidth, tmptxt.bbox().width);
            maxHeight = Math.max(maxHeight, tmptxt.bbox().height);
            const symtxt = nested.symbol().addClass(`aprender-button-${x2uid(cloned)}`);
            const realtxt = symtxt.text(b.label).font({size: 17, fill: colour, anchor: "start"});
            if (b.attributes !== undefined) {
                for (const a of b.attributes) {
                    realtxt.attr(a.name, a.value);
                }
            }
            symtxt.viewbox(tmptxt.bbox());
            tmptxt.remove();
            labels.push(symtxt);
        }
        if (bar.buttons.length !== labels.length) {
            throw new Error("Something terrible happened.");
        }

        // build the symbol for the rectangle
        const width = maxWidth * 1.5;
        const rects: SVGSymbol[] = [];
        for (const b of bar.buttons) {
            const cloned = {attributes: b.attributes, fill: b.fill};
            const symrect = nested.symbol().addClass(`aprender-button-${x2uid(cloned)}`);
            let fill: FillData = {color: this.options.colourContext.background, opacity: 0};
            if ( ("fill" in b) && (b.fill !== undefined) ) {
                fill = {color: this.resolveColour(b.fill) as string, opacity: 1};
            }
            symrect.rect(width, height).fill(fill).stroke({width: 1, color: colour, linecap: "round", linejoin: "round"});
            // Adding the viewbox triggers auto-filling, auto-centering behaviour that we don't want
            // symrect.viewbox(-1, -1, width + 2, height + 1);
            rects.push(symrect);
        }

        // Composite each into a group, all at 0,0
        const groups: Svg[] = [];
        for (let i = 0; i < labels.length; i++) {
            const b: ButtonBarButton = bar.buttons[i];
            const symlabel = labels[i];
            const symrect = rects[i];
            let value = b.label.replace(/\s/g, "");
            if (b.value !== undefined) {
                value = b.value;
            }
            const id = `_btn_${value}`;
            const g = nested.nested().id(id);
            g.use(symrect).size(width, height).move(0, 0);
            g.use(symlabel).size(maxWidth, maxHeight).center(width / 2, height / 2);
            groups.push(g);
        }

        // move each successive one down
        let dy = 0;
        for (const g of groups) {
            g.dy(dy);
            dy += height + buffer;
        }

        // set the viewbox and return
        nested.viewbox(-1, -1, width + 2, (height * bar.buttons.length) + (buffer * (bar.buttons.length - 1)) + 2);
        return nested;
    }

    /**
     * Generates the key and then places it appropriately.
     *
     * @param grid - The grid of points; used for positioning.
     * @param position - If given, overrides the JSON setting.
     */
    protected placeKey(box: SVGBox, position?: "left"|"right", opts?: {padding?: number}): void {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Invalid object state.");
        }
        let padding = this.cellsize;
        if (opts !== undefined && opts.padding !== undefined) {
            padding = opts.padding;
        }
        if ( ("areas" in this.json) && (this.json.areas !== undefined) && (Array.isArray(this.json.areas)) && (this.json.areas.length > 0) ) {
            const keys = this.json.areas.filter((b) => b.type === "key") as AreaKey[];
            if (keys.length > 1) {
                throw new Error("Only one key may be defined.");
            }
            if (keys.length === 1) {
                const key = keys[0];
                const keyimg = this.buildKey(key);
                const y = box.y; // - this.cellsize;
                // Position defaults to "right"
                // If a position is passed by the renderer, it overrides everything
                // Otherwise, the JSON prevails
                let pos = "right";
                if (position !== undefined) {
                    pos = position;
                } else if (key.position !== undefined) {
                    pos = key.position;
                }
                let x = 0;
                if (pos === "left") {
                    x = box.x - keyimg.viewbox().w - padding;
                } else {
                    x = box.x2 + padding;
                }
                const used = this.rootSvg.use(keyimg).size(keyimg.viewbox().w, keyimg.viewbox().h).dmove(x, y);
                let clickable = true;
                if (key.clickable !== undefined) {
                    clickable = key.clickable
                }
                if ( (this.options.boardClick !== undefined) && (clickable) ) {
                    const top = used.y() as number;
                    const height = used.height() as number;
                    const numEntries = key.list.length;
                    const btnHeight = height / numEntries;
                    used.click((e: { clientX: number; clientY: number; }) => {
                        const point = used.point(e.clientX, e.clientY);
                        const yRelative = point.y - top;
                        const row = Math.floor(yRelative / btnHeight);
                        if ( (row >= 0) && (row < numEntries) ) {
                            let value = key.list[row].name;
                            if (key.list[row].value !== undefined) {
                                value = key.list[row].value!;
                            }
                            this.options.boardClick!(-1, -1, value);
                        }
                    });
                }

            }
        }
    }

    /**
     * Builds the key from JSON.
     *
     * @param key - The parsed JSON representing the button bar
     * @returns The nested SVG, which is embedded in the root `defs()`
     */
    protected buildKey(key: AreaKey): Svg {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Invalid object state.");
        }

        // initialize values
        let labelColour = this.options.colourContext.labels;
        if ( (this.json.board !== null) && ("labelColour" in this.json.board) && (this.json.board.labelColour !== undefined) ) {
            labelColour = this.resolveColour(this.json.board.labelColour) as string;
        }
        let height = this.cellsize * 0.333;
        if (key.height !== undefined) {
            height = this.cellsize * key.height;
        }
        let buffer = height * 0.1;
        if (key.buffer !== undefined) {
            buffer = height * key.buffer;
        }
        const nested = this.rootSvg.defs().nested().id("_key");

        // build symbols of each label
        const rotation = this.getRotation();
        const labels: SVGSymbol[] = [];
        let maxWidth = 0;
        let maxHeight = 0;
        for (const k of key.list) {
            const tmptxt = this.rootSvg.text(k.name).font({size: 17, fill: labelColour, anchor: "start"});
            maxWidth = Math.max(maxWidth, tmptxt.bbox().width);
            maxHeight = Math.max(maxHeight, tmptxt.bbox().height);
            const symtxt = nested.symbol();
            symtxt.text(k.name).font({size: 17, fill: labelColour, anchor: "start"});
            symtxt.viewbox(tmptxt.bbox());
            tmptxt.remove();
            labels.push(symtxt);
        }
        if (key.list.length !== labels.length) {
            throw new Error("Something terrible happened.");
        }

        // Composite each into a group, all at 0,0, adding click handlers as we go
        const groups: Svg[] = [];
        let maxScaledWidth = 0;
        for (let i = 0; i < labels.length; i++) {
            const k = key.list[i];
            const symlabel = labels[i];
            const piece = this.rootSvg.findOne(`#${k.piece}`) as Svg;
            if ( (piece === undefined) || (piece === null) ) {
                throw new Error(`Could not find the requested piece (${k.piece}). Each piece *must* exist in the \`legend\`.`);

            }
            let id = `_key_${k.name}`;
            if (k.value !== undefined) {
                id = `_key_${k.value}`;
            }
            const g = nested.nested().id(id);
            const used = usePieceAt({svg: g, piece, cellsize: height, x: height / 2, y: height / 2, scalingFactor: 1});
            if (rotation !== 0) {
                rotate(used, rotation, height / 2, height / 2);
            }
            // Have to manually calculate the width so Firefox will render it properly.
            const factor = height / symlabel.viewbox().h;
            const usedLabel = g.use(symlabel).size(symlabel.viewbox().w * factor, height).dx(height * 1.1);
            maxScaledWidth = Math.max(maxScaledWidth, usedLabel.width() as number)
            groups.push(g);
        }

        // move each successive one down
        let dy = 0;
        for (const g of groups) {
            g.dy(dy);
            dy += height + buffer;
        }

        // set the viewbox and return
        nested.viewbox(0, 0, (height * 1.1) + maxScaledWidth, (height * key.list.length) + (buffer * (key.list.length - 1)));
        return nested;
    }

    /**
     * Generates the scroll bar and then places it appropriately.
     *
     * @param grid - The grid of points; used for positioning.
     * @param position - If given, overrides the JSON setting.
     */
    protected placeScroll(box: SVGBox, position?: "left"|"right"): void {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Invalid object state.");
        }
        if ( ("areas" in this.json) && (this.json.areas !== undefined) && (Array.isArray(this.json.areas)) && (this.json.areas.length > 0) ) {
            const scrolls = this.json.areas.filter((b) => b.type === "scrollBar") as AreaScrollBar[];
            if (scrolls.length > 1) {
                throw new Error("Only one scroll bar may be defined.");
            }
            if (scrolls.length === 1) {
                const scroll = scrolls[0];
                const scrollImg = this.buildScroll(scroll);
                const y = box.y; // - this.cellsize;
                // Position defaults to "right"
                // If a position is passed by the renderer, it overrides everything
                // Otherwise, the JSON prevails
                let pos = "right";
                if (position !== undefined) {
                    pos = position;
                } else if (scroll.position !== undefined) {
                    pos = scroll.position;
                }
                let x = 0;
                if (pos === "left") {
                    x = box.x - scrollImg.viewbox().w - this.cellsize;
                } else {
                    x = box.x2 + this.cellsize;
                }
                let min = 0;
                if (scroll.min !== undefined) {
                    min = scroll.min;
                }
                let current = scroll.max;
                if (scroll.current !== undefined) {
                    current = scroll.current;
                }
                const used = this.rootSvg.use(scrollImg).size(scrollImg.viewbox().w, scrollImg.viewbox().h).dmove(x, y);
                if (this.options.boardClick !== undefined) {
                    const top = used.y() as number;
                    const height = used.height() as number;
                    const numSegs = scroll.max - min;
                    const numEntries = 4 + numSegs;
                    const segHeight = height / numEntries;
                    used.click((e: { clientX: number; clientY: number; }) => {
                        const point = used.point(e.clientX, e.clientY);
                        const yRelative = point.y - top;
                        const row = Math.floor(yRelative / segHeight);
                        if ( (row >= 0) && (row < numEntries) ) {
                            let value = "";
                            if (row === 0) {
                                // upAll
                                value = `scroll_newval_${scroll.max}`;
                            } else if (row === 1) {
                                // upOne
                                value = `scroll_newval_${current < scroll.max ? current + 1 : scroll.max}`;
                            } else if (row === numEntries - 1) {
                                // downAll
                                value = `scroll_newval_${min}`;
                            } else if (row === numEntries - 2) {
                                // downOne
                                value = `scroll_newval_${current > min ? current - 1 : min}`;
                            } else {
                                // segment
                                const offset = row - 2;
                                value = `scroll_newval_${scroll.max - offset}`;
                            }
                            this.options.boardClick!(-1, -1, value);
                        }
                    });
                }
            }
        }
    }

    /**
     * Builds the scroll bar from JSON.
     *
     * @param json - The parsed JSON representing the button bar
     * @returns The nested SVG, which is embedded in the root `defs()`
     */
    protected buildScroll(json: AreaScrollBar): Svg {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Invalid object state.");
        }

        // initialize values
        let height = this.cellsize * 0.75;
        if (json.height !== undefined) {
            height = this.cellsize * json.height;
        }
        let width = this.cellsize * 0.25;
        if (json.width !== undefined) {
            width = this.cellsize * json.width;
        }
        let lineWidth = width * 1.5;
        if (json.lineWidth !== undefined) {
            lineWidth = width * (1 + json.lineWidth);
        }
        let min = 0;
        if (json.min !== undefined) {
            min = json.min;
        }
        let current = json.max;
        if (json.current !== undefined) {
            current = json.current;
        }
        let lblUpOne = "\u00A0+\u00A0";
        let lblUpAll = "++";
        let lblDownOne = "\u00A0\u2212\u00A0";
        let lblDownAll = "\u2212\u2212";
        // let lblBar = "Hide/show layers";
        if (json.labels !== undefined) {
            // if (json.labels.bar !== undefined) {
            //     lblBar = json.labels.bar;
            // }
            if (json.labels.upOne !== undefined) {
                lblUpOne = json.labels.upOne;
            }
            if (json.labels.upAll !== undefined) {
                lblUpAll = json.labels.upAll;
            }
            if (json.labels.downOne !== undefined) {
                lblDownOne = json.labels.downOne;
            }
            if (json.labels.downAll !== undefined) {
                lblDownAll = json.labels.downAll;
            }
        }
        let clrBack: string|undefined;
        let clrFill = this.options.colourContext.fill;
        let clrStrokes = this.options.colourContext.strokes;
        if (json.colours !== undefined) {
            if (json.colours.background !== undefined) {
                clrBack = json.colours.background;
            }
            if (json.colours.fill !== undefined) {
                clrFill = json.colours.fill;
            }
            if (json.colours.strokes !== undefined) {
                clrStrokes = json.colours.strokes;
            }
        }
        const nested = this.rootSvg.defs().nested().id("_scroll");

        // build symbols of each label
        const labels: SVGSymbol[] = [];
        let maxWidth = 0;
        let maxHeight = 0;
        for (const lbl of [lblUpOne, lblUpAll, lblDownOne, lblDownAll]) {
            const tmptxt = this.rootSvg.text(lbl).font({size: 17, fill: this.options.colourContext.strokes, anchor: "start"});
            maxWidth = Math.max(maxWidth, tmptxt.bbox().width);
            maxHeight = Math.max(maxHeight, tmptxt.bbox().height);
            const symtxt = nested.symbol();
            symtxt.text(lbl).font({size: 17, fill: this.options.colourContext.strokes, anchor: "start"});
            symtxt.viewbox(tmptxt.bbox());
            tmptxt.remove();
            labels.push(symtxt);
        }
        const xOffset = (lineWidth - width) / 2;
        const segBlank = nested.symbol();
        segBlank.line(0,0,lineWidth,0).stroke({width: 1, color: clrStrokes});
        segBlank.line(0,height,lineWidth,height).stroke({width: 1, color: clrStrokes});
        if (clrBack !== undefined) {
            segBlank.rect(width, height).move(xOffset, 0).stroke({width: 1, color: clrStrokes}).fill({color: clrBack});
        } else {
            segBlank.rect(width, height).move(xOffset, 0).stroke({width: 1, color: clrStrokes}).fill({color: this.options.colourContext.background, opacity: 0});
        }
        segBlank.viewbox(0,0,lineWidth, height);
        const segFull = nested.symbol();
        segFull.line(0,0,lineWidth,0).stroke({width: 1, color: clrStrokes});
        segFull.line(0,height,lineWidth,height).stroke({width: 1, color: clrStrokes});
        segFull.rect(width, height).move(xOffset, 0).stroke({width: 1, color: clrStrokes}).fill({color: clrFill});
        segFull.viewbox(0,0,lineWidth, height);

        // Composite each into a group, all at 0,0
        // Click handlers don't work here
        const groups: Svg[] = [];
        let maxScaledWidth = -Infinity;
        // up buttons first
        for (const lbl of [labels[1], labels[0]]) {
            const g = nested.nested();
            const used = g.use(lbl).size(lineWidth, height);
            maxScaledWidth = Math.max(maxScaledWidth, used.width() as number)
            groups.push(g);
        }
        // segments
        for (let i = json.max; i > min; i--) {
            let sym: SVGSymbol;
            if (i > current) {
                sym = segBlank;
            } else {
                sym = segFull;
            }
            const g = nested.nested();
            const used = g.use(sym).size(lineWidth, height);
            maxScaledWidth = Math.max(maxScaledWidth, used.width() as number)
            groups.push(g);
        }
        // down buttons last
        for (const lbl of [labels[2], labels[3]]) {
            const g = nested.nested();
            const used = g.use(lbl).size(lineWidth, height);
            maxScaledWidth = Math.max(maxScaledWidth, used.width() as number)
            groups.push(g);
        }

        // move each successive one down
        let dy = 0;
        for (const g of groups) {
            g.dy(dy);
            dy += height;
        }

        // add background rect to capture all clicks
        nested.rect(maxScaledWidth, (height * (4 + (json.max - min))))
              .stroke({color: "none", width: 0})
              .fill({color: this.options.colourContext.background, opacity: 0});

        // set the viewbox and return
        nested.viewbox(0, 0, maxScaledWidth, (height * (4 + (json.max - min))));
        return nested;
    }

    /**
     * Generates the compass rose and then places it appropriately.
     *
     * @param grid - The grid of points; used for positioning.
     * @param position - If given, overrides the JSON setting.
     */
    protected placeCompass(box: SVGBox, position?: "left"|"right"): void {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Invalid object state.");
        }
        if ( ("areas" in this.json) && (this.json.areas !== undefined) && (Array.isArray(this.json.areas)) && (this.json.areas.length > 0) ) {
            const compasses = this.json.areas.filter((b) => b.type === "compassRose") as AreaCompassRose[];
            if (compasses.length > 1) {
                throw new Error("Only one compass rose may be defined.");
            }
            if (compasses.length === 1) {
                const compass = compasses[0];
                const compassImg = this.buildCompass(compass);
                const width = compassImg.viewbox().w;
                const height = compassImg.viewbox().h;
                const y = box.y; // - this.cellsize;
                // Position defaults to "right"
                // If a position is passed by the renderer, it overrides everything
                // Otherwise, the JSON prevails
                let pos = "right";
                if (position !== undefined) {
                    pos = position;
                } else if (compass.position !== undefined) {
                    pos = compass.position;
                }
                let x = 0;
                if (pos === "left") {
                    x = box.x - width - (this.cellsize / 2);
                } else {
                    x = box.x2 + (this.cellsize / 2);
                }
                const rotation = this.getRotation();
                const used = this.rootSvg.use(compassImg)
                    .size(width, height)
                    .dmove(x, y)
                    .rotate(rotation, x + compassImg.viewbox().w / 2, y + compassImg.viewbox().h / 2);
                if (this.options.boardClick !== undefined) {
                    const centre = {x: x + width / 2, y: y + height / 2};
                    const root = this.rootSvg;
                    const genericCatcher = ((e: { clientX: number; clientY: number; }) => {
                        const point = rotatePoint(root.point(e.clientX, e.clientY), rotation*-1, centre);
                        const bearing = calcBearing(centre.x, centre.y, point.x, point.y);
                        const delta = smallestDegreeDiff(bearing, 0);
                        if (delta >= -22.5 && delta <= 22.5) {
                            this.options.boardClick!(-1, -1, "N");
                        }
                        else if (delta >= 22.5 && delta <= 67.5) {
                            this.options.boardClick!(-1, -1, "NE");
                        }
                        else if (delta >= 67.5 && delta <= 112.5) {
                            this.options.boardClick!(-1, -1, "E");
                        }
                        else if (delta >= 112.5 && delta <= 157.5) {
                            this.options.boardClick!(-1, -1, "SE");
                        }
                        else if (delta >= -67.5 && delta <= -22.5) {
                            this.options.boardClick!(-1, -1, "NW");
                        }
                        else if (delta >= -112.5 && delta <= -67.5) {
                            this.options.boardClick!(-1, -1, "W");
                        }
                        else if (delta >= -157.5 && delta <= -112.5) {
                            this.options.boardClick!(-1, -1, "SW");
                        }
                        else  {
                            this.options.boardClick!(-1, -1, "S");
                        }
                    });
                    used.click(genericCatcher);
                }
            }
        }
    }

    /**
     * Builds the compass rose from JSON.
     *
     * @param json - The parsed JSON representing the button bar
     * @returns The nested SVG, which is embedded in the root `defs()`
     */
    protected buildCompass(json: AreaCompassRose): Svg {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Invalid object state.");
        }

        const roseSymbol = this.rootSvg.defs().symbol().id("_compassSymbol");
        roseSymbol.path("M49.956 10c-.591-.003-.916.4-1.007.872l-2.443 8.242a30.937 30.937 0 0 0-15.897 6.6c-2.538-1.378-5.075-2.763-7.615-4.133c-.47-.253-.882-.234-1.262.149c-.381.383-.273.947-.058 1.353l4.069 7.495a30.931 30.931 0 0 0-6.634 15.932c-2.774.823-5.552 1.639-8.323 2.467c-.51.153-.787.458-.786.998c.002.54.476.863.916.998l8.189 2.426a30.936 30.936 0 0 0 6.599 15.98c-1.385 2.552-2.778 5.104-4.156 7.658c-.253.47-.234.88.15 1.261c.382.38.946.274 1.352.06l7.537-4.091a30.933 30.933 0 0 0 15.922 6.622c.822 2.775 1.64 5.554 2.468 8.325c.153.51.458.787.998.786c.54-.002.863-.476.998-.916l2.426-8.189a30.89 30.89 0 0 0 16.006-6.632l7.568 4.11c.549.28.92.329 1.34-.087c.421-.416.366-.932.097-1.33l-4.12-7.593a30.962 30.962 0 0 0 6.591-15.958l8.233-2.44c.586-.19.883-.417.886-1.009c.003-.591-.4-.916-.872-1.007l-8.27-2.451a30.967 30.967 0 0 0-6.607-15.91l4.09-7.531c.279-.55.328-.92-.088-1.341a.957.957 0 0 0-.671-.305a1.15 1.15 0 0 0-.659.21l-7.546 4.097a30.883 30.883 0 0 0-15.978-6.62l-2.434-8.212c-.19-.586-.417-.883-1.009-.886zm-.001 4.176v31.04a4.783 4.783 0 0 0-2.306.619l-4.979-6.308l5.214-18.143l.7-2.441zM54.14 21.6a28.54 28.54 0 0 1 12.96 5.355l-9.797 5.318zm-8.377.025l-3.144 10.607c-3.241-1.762-6.484-3.517-9.726-5.278a28.553 28.553 0 0 1 12.87-5.329zM24.65 24.65l15.602 15.57l-.008.023c-1.987.589-3.972 1.18-5.96 1.768l-5.988-10.793l-1.223-2.205zm50.648.018l-3.343 3.344l-1.673 1.672L59.73 40.237l-.075-.022l-1.754-5.916l10.865-6.015l1.308-.722l.89-.494zm-2.278 8.188a28.554 28.554 0 0 1 5.355 12.907l-10.648-3.156zm-46.039.008l5.29 9.744c-3.554 1.05-7.104 2.108-10.657 3.16a28.538 28.538 0 0 1 5.367-12.904zm33.392 9.779l18.242 5.24l2.413.694l4.795 1.378h-31.04a4.783 4.783 0 0 0-.631-2.328zm-15.156 7.312l-.002.045c0 .798.2 1.583.581 2.284L39.5 57.241l-6.241-1.788l-11.88-3.4v-.002l-2.438-.698l-4.813-1.378zm33.184 4.184a28.538 28.538 0 0 1-5.348 12.95l-5.313-9.79zm-56.79.003l10.647 3.155c-1.775 3.265-3.542 6.532-5.316 9.797a28.549 28.549 0 0 1-5.331-12.952zm30.697.047l4.96 6.211l-1.803 6.296L52.05 78.62l-.698 2.439l-1.378 4.813l-.02-31.09c.842.002 1.716-.218 2.354-.593zm13.403 3.71l6.01 10.86l1.218 2.199l2.421 4.374l-3.374-3.375l-1.673-1.672l-10.607-10.607zm-25.475 1.832c.592 2 1.187 3.996 1.778 5.996l-10.786 5.984l-2.207 1.224l-4.405 2.445zm17.074 7.966l9.82 5.333a28.552 28.552 0 0 1-12.989 5.358zm-14.7.042c1.05 3.55 2.106 7.097 3.157 10.646a28.54 28.54 0 0 1-12.894-5.36z").fill(this.resolveColour("_context_strokes") as string);
        roseSymbol.path("M46 8V0h1.981l4.127 5.342V0H54v8h-2.043l-4.065-5.217V8z").fill(this.resolveColour("_context_strokes") as string);
        roseSymbol.viewbox(5, 0, 90, 90);

        // initialize values
        let width = this.cellsize * 2;
        if (json.width !== undefined) {
            width = this.cellsize * json.width;
        }
        const nested = this.rootSvg.defs().nested().id("_compass");
        nested.use(roseSymbol).width(width).height(width);

        // add background rect to capture all clicks
        // Click handlers don't work here
        nested.rect(width, width)
              .stroke({color: "none", width: 0})
              .fill({color: this.options.colourContext.background, opacity: 0});

        // set the viewbox and return
        nested.viewbox(0, 0, width, width);
        return nested;
    }

    /**
     * For placing a generic `pieces` area at the bottom of the board.
     *
     * @param gridPoints -
     */
    protected piecesArea(box: SVGBox, opts?: {padding?: number, canvas?: Svg}): {newY: number|undefined; width: number|undefined} {
        if (this.rootSvg === undefined) {
            throw new Error("Can't place a `pieces` area until the root SVG is initialized!");
        }
        let padding = this.cellsize / 2;
        if (opts !== undefined && opts.padding !== undefined) {
            padding = opts.padding;
        }
        let placeY: number|undefined;
        let finalWidth: number|undefined;
        if ( (this.json !== undefined) && (this.json.areas !== undefined) && (Array.isArray(this.json.areas)) && (this.json.areas.length > 0) ) {
            const areas = this.json.areas.filter((x) => x.type === "pieces") as AreaPieces[];
            const boardBottom = box.y2; // + this.cellsize;
            // Width in number of cells, taking the maximum board width
            const boardWidth = Math.floor(box.width / this.cellsize);
            placeY = boardBottom + padding;
            const rotation = this.getRotation();
            for (let iArea = 0; iArea < areas.length; iArea++) {
                const area = areas[iArea];
                let hpad = 0;
                if (area.spacing !== undefined) {
                    hpad = this.cellsize * area.spacing;
                }
                const numPieces = area.pieces.length;
                let desiredWidth = boardWidth;
                if (area.width !== undefined) {
                    desiredWidth = area.width;
                }
                const numRows = Math.ceil(numPieces / desiredWidth);
                const textHeight = this.cellsize / 3; // 10; // the allowance for the label
                const cellsize = this.cellsize * 0.75;
                const areaWidth = (cellsize * desiredWidth) + (hpad * (desiredWidth-1));
                const areaHeight = (textHeight * 2) + (cellsize * numRows) + (hpad * (numRows-1));
                let markWidth = 0;
                let markColour: string|undefined;
                if ( ("ownerMark" in area) && (area.ownerMark !== undefined) ) {
                    markWidth = 15;
                    if (typeof area.ownerMark === "number") {
                        markColour = this.options.colours[area.ownerMark - 1];
                    } else {
                        markColour = this.resolveColour(area.ownerMark) as string;
                    }
                }
                let root = this.rootSvg;
                if (opts !== undefined && opts.canvas !== undefined) {
                    root = opts.canvas;
                }
                const nested = root.nested().id(`_pieces${iArea}`).size(areaWidth+2, areaHeight+2).viewbox(-1 - markWidth - 5, -1, areaWidth+2+markWidth+10, areaHeight+2);
                const fullWidth = areaWidth + 2 + markWidth + 10;
                if (finalWidth === undefined) {
                    finalWidth = fullWidth;
                } else {
                    finalWidth = Math.max(finalWidth, fullWidth);
                }
                if ("background" in area) {
                    nested.rect(areaWidth,areaHeight).fill(area.background as string);
                }
                for (let iPiece = 0; iPiece < area.pieces.length; iPiece++) {
                    const p = area.pieces[iPiece];
                    const row = Math.floor(iPiece / desiredWidth);
                    const col = iPiece % desiredWidth;
                    const piece = this.rootSvg.findOne("#" + p) as Svg;
                    if ( (piece === null) || (piece === undefined) ) {
                        throw new Error(`Could not find the requested piece (${p}). Each piece in the stack *must* exist in the \`legend\`.`);
                    }
                    const newx = (col * (cellsize + hpad)) + (cellsize / 2);
                    const newy = (textHeight * 2) + (row * (cellsize+hpad)) + (cellsize / 2);
                    const use = usePieceAt({svg: nested, piece, cellsize, x: newx, y: newy, scalingFactor: 1});
                    if (rotation !== 0) {
                        rotate(use, rotation, newx, newy);
                    }
                    if (this.options.boardClick !== undefined) {
                        use.click((e: Event) => {this.options.boardClick!(-1, -1, p); e.stopPropagation();});
                    }
                }

                // add marker line if indicated
                if ( (markWidth > 0) && (markColour !== undefined) ) {
                    nested.rect(markWidth, nested.bbox().height).fill(markColour).stroke({width: 1, color: "black", linecap: "round", linejoin: "round"}).dmove((markWidth * -1) - 5, 0);
                    // nested.line(markWidth * -1, 0, markWidth * -1, nested.bbox().height).stroke({width: markWidth, color: markColour});
                }

                // Add area label
                let labelColour = this.options.colourContext.labels;
                if ( (this.json.board !== null) && ("labelColour" in this.json.board) && (this.json.board.labelColour !== undefined) ) {
                    labelColour = this.resolveColour(this.json.board.labelColour) as string;
                }
                const tmptxt = this.rootSvg.text(area.label).font({size: textHeight, anchor: "start", fill: labelColour});
                const txtWidth = tmptxt.bbox().w;
                tmptxt.remove();
                // set the actual width of the nested svg
                const {x: vbx, y:vby, w: vbw, h: vbh} = nested.viewbox();
                const realWidth = Math.max(vbw, txtWidth);
                nested.width(realWidth);
                nested.viewbox(vbx, vby, realWidth, vbh);
                const txt = nested.text(area.label).addClass(`aprender-area-label`);
                txt.font({size: textHeight, anchor: "start", fill: labelColour})
                    .attr("dy", "0.55em")
                    .attr("dominant-baseline", "middle")
                    .move(0, 0);

                // Now place the whole group below the board
                // const placed = this.rootSvg.use(nested);
                nested.move(box.x, placeY);
                placeY += nested.bbox().height + (this.cellsize * 0.5);
            }
        }
        return {newY: placeY, width: finalWidth};
    }

    /**
     * The reserves area is currently only used for the DVGC board.
     * This creates a label-less `pieces` area with the board itself.
     * It is designed for two-player games, 180 degree rotation only.
     * The area itself is clickable, as are the contained pieces.
     */
    protected reservesArea(opts: {bottomN: number, topS: number, xLeft: number, xRight: number}) {
        if (this.rootSvg === undefined) {
            throw new Error("Can't place a `reserves` area until the root SVG is initialized!");
        }
        const board = this.rootSvg.findOne("#board") as SVGG|null;
        if (board === null) {
            throw new Error("Can't place a `reserves` area unless a `board` group already exists.");
        }
        if ( (this.json !== undefined) && (this.json.areas !== undefined) && (Array.isArray(this.json.areas)) && (this.json.areas.length > 0) ) {
            const areas = this.json.areas.filter((x) => x.type === "reserves") as AreaReserves[];
            // Width in number of cells, taking the maximum board width
            const boardWidth = Math.floor(Math.abs(opts.xLeft - opts.xRight) / this.cellsize);
            for (let iArea = 0; iArea < areas.length; iArea++) {
                const area = areas[iArea];
                const numPieces = area.pieces.length;
                const numRows = Math.max(Math.ceil(numPieces / boardWidth), 1);
                const areaWidth = this.cellsize * boardWidth;
                const areaHeight = this.cellsize * numRows;
                let markWidth = 0;
                let markColour: string|undefined;
                if ( ("ownerMark" in area) && (area.ownerMark !== undefined) ) {
                    markWidth = 15;
                    markColour = this.resolveColour(area.ownerMark) as string;
                }
                const nested = board.nested().id(`_reserves${iArea}`).size(areaWidth+2, areaHeight+2).viewbox(-1 - markWidth - 5, -1, areaWidth+2+markWidth+10, areaHeight+2);
                let rect: SVGRect;
                if ("background" in area) {
                    rect = nested.rect(areaWidth,areaHeight).fill({ color: this.resolveColour(area.background) as string, opacity: 0.25 });
                } else {
                    rect = nested.rect(areaWidth,areaHeight).fill({opacity: 0});
                }
                if (this.options.boardClick !== undefined) {
                    rect.click((e: Event) => {this.options.boardClick!(-1, -1, `_reserves_${area.side}`); e.stopPropagation();});
                }
                for (let iPiece = 0; iPiece < area.pieces.length; iPiece++) {
                    const p = area.pieces[iPiece];
                    const row = Math.floor(iPiece / boardWidth);
                    const col = iPiece % boardWidth;
                    const piece = this.rootSvg.findOne("#" + p) as Svg;
                    if ( (piece === null) || (piece === undefined) ) {
                        throw new Error(`Could not find the requested piece (${p}). Each piece in the stack *must* exist in the \`legend\`.`);
                    }
                    const newx = (col * this.cellsize) + (this.cellsize / 2);
                    const newy = (row * this.cellsize) + (this.cellsize / 2);
                    const use = usePieceAt({svg: nested, piece, cellsize: this.cellsize * 0.75, x: newx, y: newy, scalingFactor: 1});
                    if (this.options.boardClick !== undefined) {
                        use.click((e: Event) => {this.options.boardClick!(-1, -1, p); e.stopPropagation();});
                    }
                }

                // add marker line if indicated
                if ( (markWidth > 0) && (markColour !== undefined) ) {
                    nested.rect(markWidth, nested.bbox().height).fill(markColour).stroke({width: 1, color: "black", linecap: "round", linejoin: "round"}).dmove((markWidth * -1) - 5, 0);
                    // nested.line(markWidth * -1, 0, markWidth * -1, nested.bbox().height).stroke({width: markWidth, color: markColour});
                }

                // Now place the whole group where it belongs
                if (area.side === "N") {
                    nested.move(opts.xLeft, opts.bottomN - areaHeight);
                } else {
                    nested.move(opts.xLeft, opts.topS);
                }
            }
        }
    }

    protected backFill(polys?: Poly[][], preRotation = false): boolean {
        type BackFill = {
            type?: "full"|"board";
            colour: string;
            opacity?: number;
        };

        if (this.rootSvg === undefined) {
            throw new Error("Can't add a back fill unless the root SVG is initialized!");
        }
        if ( (this.json === undefined) || (this.json.board === undefined) ) {
            throw new Error("Can't add a back fill unless the JSON is initialized!");
        }
        if (this.json.board !== null) {
            let backFillObj: BackFill|undefined;
            if ( ("backFill" in this.json.board) && (this.json.board.backFill !== undefined) && (this.json.board.backFill !== null) ) {
                backFillObj = this.json.board.backFill as BackFill;
            }

            // if there is no backFill object, then don't try again
            if (backFillObj === undefined) {
                return true;
            }

            const bgcolour = this.resolveColour(backFillObj.colour) as string;
            let bgopacity = 1;
            if ( backFillObj.opacity !== undefined ) {
                bgopacity = backFillObj.opacity;
            }
            let bgtype: "full"|"board" = "full";
            if (backFillObj.type !== undefined) {
                bgtype = backFillObj.type;
            }

            if (bgtype === "board" && polys === undefined) {
                throw new Error(`We can only do a "board" backfill if the board was built with polygons.`);
            }

            // if we're pre-rotation but we want to do a full fill, then try again later
            if (preRotation && bgtype === "full") {
                return false;
            }

            if (bgtype === "full") {
                const bbox = this.rootSvg.bbox();
                this.rootSvg.rect(bbox.width + 20, bbox.height + 20).id("aprender-backfill").move(bbox.x - 10, bbox.y - 10).fill({color: bgcolour, opacity: bgopacity}).back();
            } else {
                const board = this.rootSvg.findOne("#board") as SVGG|null;
                if (board === null) {
                    throw new Error(`Can't do a board fill if there's no board.`);
                }
                // if hexagonal board, we need to use turf
                let ptsStr: string;
                if ((this.json.board as BoardBasic).style.startsWith("hex")) {
                    ptsStr = unionPolys(polys!.flat()).map(pt => pt.join(",")).join(" ");
                }
                // otherwise, use convex hull
                else {
                    ptsStr = convexHullPolys(polys!.flat()).map(pt => pt.join(",")).join(" ");
                }
                const poly = this.rootSvg.polygon(ptsStr).id("aprender-backfill").fill({color: bgcolour, opacity: bgopacity});
                // `board` backfill can't just be pushed to the back but must be inside the `board` group
                board.add(poly, 0);
            }
            return true;
        }

        // if board is null, don't try again
        return true;
    }

    public getRotation(): number {
        if (!this.json) {
            throw new Error("Cannot rotate unless SVG is initialized and a board is present.");
        }
        let rotation = 0;
        if (this.options.rotate !== undefined) {
            rotation += this.options.rotate;
        }
        if (this.json.board !== undefined && this.json.board !== null &&("rotate" in this.json.board) && this.json.board.rotate !== undefined) {
            rotation += this.json.board.rotate;
        }
        rotation = rotation % 360;
        while (rotation < 0) { rotation += 360; }
        return rotation;
    }

    public getBoardCentre(): IPoint {
        if (this.rootSvg === undefined) {
            throw new Error("Cannot calculate the board centre unless SVG is initialized and a board is present.");
        }
        const board = this.rootSvg.findOne("#board") as SVGG|null;
        if (board === null) {
            throw new Error("Could not find the core board group to calculate the centre.");
        }
        const bbox = board.bbox();
        return {x: bbox.cx, y: bbox.cy}
    }

    protected rotateBoard(opts?: {ignoreRotation?: boolean, ignoreLabels?: boolean}): SVGBox {
        let ignoreRotation = false;
        if (opts !== undefined && opts.ignoreRotation !== undefined) {
            ignoreRotation = opts.ignoreRotation;
        }
        let ignoreLabels = false;
        if (opts !== undefined && opts.ignoreLabels !== undefined) {
            ignoreLabels = opts.ignoreLabels;
        }
        if (this.rootSvg === undefined) {
            throw new Error("Cannot rotate unless SVG is initialized and a board is present.");
        }

        const board = this.rootSvg.findOne("#board") as SVGG|null;
        if (board === null) {
            throw new Error("Could not find the core board group to rotate.");
        }
        let rotation = this.getRotation();
        if (ignoreRotation) {
            rotation = 0;
        }
        const startingBox = board.bbox();
        if (rotation === 0) {
            return startingBox;
        } else {
            rotate(board, rotation, startingBox.cx, startingBox.cy);
            // reorient all labels
            if (!ignoreLabels) {
                const labels = this.rootSvg.findOne("#labels") as SVGG|null;
                if (labels !== null) {
                    labels.find("text").each((e: SVGElement) => {
                        // const box = e.bbox();
                        const box = e.rbox(board);
                        rotate(e, rotation * -1, box.cx, box.cy);
                    });
                }
            }

            // reorientation of `vertical` glyphs has to happen in `loadLegend()`
            // because you can't otherwise access the bboxes of symbols

            // must be rbox relative to the root instead of bbox to pass the
            // correct coordinates to the different `areas`
            return board.rbox(this.rootSvg);
        }
    }

    // These functions let the base class build polyominoes
    protected buildPoly(svg: Svg, matrix: Polymatrix, {divided = false, tlmark = false} = {}): void {
        if (this.json === undefined || this.json.board === null) {
            throw new Error("Invalid JSON");
        }
        let baseColour = this.options.colourContext.strokes;
        if ( ("strokeColour" in this.json.board) && (this.json.board.strokeColour !== undefined) ) {
            baseColour = this.resolveColour(this.json.board.strokeColour) as string;
        }

        const height = matrix.length;
        let width = 0;
        if (height > 0) {
            width = matrix[0].length;
        }
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                const val = matrix[y][x];
                if (val === null || val === 0) {
                    continue;
                }
                const colour = this.resolveColour(val) as string;
                let borderColour = colour;
                if (divided) {
                    borderColour = baseColour;
                }
                // create rect
                svg.rect(this.cellsize, this.cellsize).stroke({color: borderColour, width: 1, linecap: "round", linejoin: "round"}).fill({color: colour}).move(x * this.cellsize, y * this.cellsize);

                // add borders as necessary
                // top
                if (y === 0 || matrix[y-1][x] === null || matrix[y-1][x] === 0) {
                    this.drawBorder(svg, x * this.cellsize, y * this.cellsize, (x+1) * this.cellsize, y * this.cellsize);
                }
                // bottom
                if (y === height - 1 || matrix[y+1][x] === null || matrix[y+1][x] === 0) {
                    this.drawBorder(svg, x * this.cellsize, (y+1) * this.cellsize, (x+1) * this.cellsize, (y+1) * this.cellsize);
                }
                // left
                if (x === 0 || matrix[y][x-1] === null || matrix[y][x-1] === 0) {
                    this.drawBorder(svg, x * this.cellsize, y * this.cellsize, x * this.cellsize, (y+1) * this.cellsize);
                }
                // right
                if (x === width - 1 || matrix[y][x+1] === null || matrix[y][x+1] === 0) {
                    this.drawBorder(svg, (x+1) * this.cellsize, y * this.cellsize, (x+1) * this.cellsize, (y+1) * this.cellsize);
                }
            }
        }

        // mark top-left cell if requested
        if (tlmark) {
            svg.circle(this.cellsize / 5).center(this.cellsize / 2, this.cellsize / 2).stroke({width: 1, color: this.options.colourContext.strokes}).fill(this.options.colourContext.strokes);
        }
    }

    protected drawBorder(svg: Svg, x1: number, y1: number, x2: number, y2: number): void {
        if ( (this.json === undefined) || (this.json.board === null) ) {
            throw new Error("No valid json found.");
        }
        let baseStroke = 1;
        let baseColour = this.options.colourContext.strokes;
        let baseOpacity = 1;
        if ( ("strokeWeight" in this.json.board) && (this.json.board.strokeWeight !== undefined) ) {
            baseStroke = this.json.board.strokeWeight;
        }
        if ( ("strokeColour" in this.json.board) && (this.json.board.strokeColour !== undefined) ) {
            baseColour = this.resolveColour(this.json.board.strokeColour) as string;
        }
        if ( ("strokeOpacity" in this.json.board) && (this.json.board.strokeOpacity !== undefined) ) {
            baseOpacity = this.json.board.strokeOpacity;
        }
        svg.line(x1, y1, x2, y2)
           .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity, linecap: "round", linejoin: "round"});
    }

    protected getStackedPoint (pts: GridPoints, col: number, row: number): IPoint|undefined {
        if ( (! ("json" in this)) || (this.json === undefined) || (this.json === null) || (! ("board" in this.json)) || (this.json.board === undefined) || (this.json.board === null) || (! ("style" in this.json.board)) || (this.json.board.style === undefined)) {
            throw new Error(`Cannot calculate the stacked point if the base object is not properly populated.`);
        }
        if (this.json.board.style !== "squares-stacked") {
            return pts[row][col];
        }
        if ((! ("width" in this.json.board)) || (this.json.board.width === undefined) || (! ("height" in this.json.board)) || (this.json.board.height === undefined)) {
            throw new Error(`Cannot calculate the stacked point if the base object is not properly populated.`);
        }
        const result = calcPyramidOffset(this.json.board.width, this.json.board.height, col, row);
        if (result === undefined) {
            return undefined;
        }
        let point = pts[result.gridrow][result.gridcol];
        if (result.offset) {
            point = {x: point.x + (this.cellsize / 2), y: point.y + (this.cellsize / 2)}
        }
        return point;
    }

    protected getTriStackedPoint (pts: GridPoints, col: number, row: number, polys: Poly[][]): IPoint|undefined {
        if ( (! ("json" in this)) || (this.json === undefined) || (this.json === null) || (! ("board" in this.json)) || (this.json.board === undefined) || (this.json.board === null) || (! ("style" in this.json.board)) || (this.json.board.style === undefined)) {
            throw new Error(`Cannot calculate the stacked point if the base object is not properly populated.`);
        }
        if (this.json.board.style !== "triangles-stacked") {
            return pts[row][col];
        }
        if ((! ("width" in this.json.board)) || (this.json.board.width === undefined) || (! ("height" in this.json.board)) || (this.json.board.height === undefined)) {
            throw new Error(`Cannot calculate the stacked point if the base object is not properly populated.`);
        }
        const result = calcLazoOffset(this.json.board.width, this.json.board.height, col, row);
        if (result === undefined) {
            return undefined;
        }
        const anchor = polys[result.gridrow][result.gridcol] as IPolyPolygon;
        switch (result.layer % 3) {
            case 0:
                return pts[result.gridrow][result.gridcol];
            case 1:
                return anchor.points[2];
            case 2:
                return anchor.points[1];
            default:
                return undefined;
        }
    }

    /**
     * This function takes a string, number, or gradient defintion and returns
     * either the corresponding hex colour or an SVGGradient.
     * Gradients cannot be recursive.
     * @param val - the value in the JSON
     * @param def - the default value
     * @returns
     */
    public resolveColour(val: number|string|Gradient|Colourfuncs, def?: string): string|SVGGradient {
        if (this.rootSvg === undefined || this.rootSvg === null) {
            throw new Error(`Cannot resolve colour values until the root SVG is initialized.`);
        }

        let colour: string|SVGGradient|undefined = def;
        if (typeof val === "object") {
            // check for gradient first
            if ("stops" in val) {
                const x1 = val.x1 !== undefined ? val.x1  : 0;
                const y1 = val.y1 !== undefined ? val.y1  : 0;
                const x2 = val.x2 !== undefined ? val.x2  : 1;
                const y2 = val.y2 !== undefined ? val.y2  : 0;
                colour = this.rootSvg.defs().gradient("linear", add => {
                    for (const stop of (val as Gradient).stops) {
                        add.stop({offset: stop.offset, color: this.resolveColour(stop.colour, "#000") as string, opacity: stop.opacity !== undefined ? stop.opacity : 1});
                    }
                });
                colour.from(x1,y1).to(x2,y2);
            }
            // Now check for functions
            else if ("func" in val) {
                // flatten
                if (val.func === "flatten") {
                    const fg = hex2rgb(this.resolveColour(val.fg) as string);
                    const bg = hex2rgb(this.resolveColour(val.bg) as string);
                    colour = rgb2hex(afterOpacity(fg, val.opacity , bg));
                }
                // lighten
                else if (val.func === "lighten") {
                    const base = hex2rgb(this.resolveColour(val.colour) as string);
                    colour = rgb2hex(lighten(base, val.ds, val.dl));
                }
                // bestContrast
                else if (val.func === "bestContrast") {
                    const bg = this.resolveColour(val.bg) as string;
                    const fg = val.fg.map(c => this.resolveColour(c) as string);
                    return tinycolor.mostReadable(bg, fg).toHexString();
                }
            }
        } else if (typeof val === "number") {
            colour = this.options.colours[val - 1];
        } else {
            colour = val ;
            if (/^_context_/.test(colour)) {
                const [,,prop] = colour.split("_");
                if (prop in this.options.colourContext && this.options.colourContext[prop as "background"|"strokes"|"labels"|"annotations"|"fill"] !== undefined) {
                    colour = this.options.colourContext[prop as "background"|"strokes"|"labels"|"annotations"|"fill"];
                }
            }
        }
        if (colour === undefined) {
            throw new Error(`Unable to resolve colour:\n${JSON.stringify(val)}\nDefault: ${def}`);
        } else {
            return colour;
        }
    }
}
