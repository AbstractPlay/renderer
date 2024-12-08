// The following is here because json2ts isn't recognizing json.board.markers correctly
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Element as SVGElement, G as SVGG, Rect as SVGRect, Circle as SVGCircle, Polygon as SVGPolygon, Path as SVGPath, StrokeData, Svg, Symbol as SVGSymbol, Use as SVGUse, FillData, Gradient as SVGGradient, TimeLike, Box as SVGBox } from "@svgdotjs/svg.js";
import { Grid, defineHex, Orientation, HexOffset, rectangle } from "honeycomb-grid";
import type { Hex } from "honeycomb-grid";
import { hexOfCir, hexOfHex, hexOfTri, hexSlanted, rectOfRects, snubsquare, cobweb, cairo, conicalHex, genConicalHexPolys, pyramidHex, genPyramidHexPolys } from "../grids";
import { GridPoints, IPoint, type Poly, IPolyPolygon, IPolyCircle, SnubStart, IPolyPath } from "../grids/_base";
import { APRenderRep, AreaButtonBar, AreaKey, AreaPieces, AreaReserves, AreaScrollBar, BoardBasic, ButtonBarButton, Glyph, Gradient, MarkerFence, MarkerFences, MarkerOutline, type Polymatrix } from "../schemas/schema";
import { sheets } from "../sheets";
import { ICobwebArgs, cobwebLabels, cobwebPolys } from "../grids/cobweb";
import { projectPoint, scale, rotate, usePieceAt, matrixRectRotN90, calcPyramidOffset, calcLazoOffset, centroid, projectPointEllipse, circle2poly, rotatePoint, ptDistance } from "../common/plotting";
import { calcStarPoints } from "../common/starPoints";
import { glyph2uid, x2uid } from "../common/glyph2uid";
import tinycolor from "tinycolor2";
import getConvexHull from "monotone-chain-convex-hull";
import { Graph, SquareOrthGraph, SquareGraph, SquareFanoronaGraph } from "../graphs";
import { IWheelArgs, wheel, wheelLabels, wheelPolys } from "../grids/wheel";
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
 * An internal interface used when rendering board buffers.
 *
 */
interface IBuffer {
    width?: number;
    pattern?: string;
    show?: ("N"|"E"|"S"|"W")[];
};

/**
 * Internal interface when placing markers and annotations
 *
 */
interface ITarget {
    row: number;
    col: number;
}

/** Helper functions for drawing edge click handlers */
const sortPoints = (a: [number,number], b: [number,number]) => {
    if (a[0] === b[0]) {
        if (a[1] === b[1]) {
            return 0;
        } else {
            return a[1] - b[1];
        }
    } else {
        return a[0] - b[0];
    }
};
const pts2id = (a: [number,number], b: [number,number]): string => {
    const x = a.map(n => Math.trunc(n * 1000) / 1000) as [number,number];
    const y = b.map(n => Math.trunc(n * 1000) / 1000) as [number,number];
    return [x,y].sort(sortPoints).map(p => p.join(",")).join(" ");
}
type CompassDirection = "N"|"NE"|"E"|"SE"|"S"|"SW"|"W"|"NW";
interface IEdge {
    dir: CompassDirection;
    corners: [0|1|2|3|4|5,0|1|2|3|4|5];
}
// const oppDir = new Map<CompassDirection,CompassDirection>([
//     ["N","S"],["NE","SW"],["E","W"],["SE","NW"],
//     ["S","N"],["SW","NE"],["W","E"],["NW","SE"],
// ]);
const edges2corners = new Map<Orientation, IEdge[]>([
    [Orientation.FLAT, [
        {dir: "N", corners: [5,0]},
        {dir: "NE", corners: [0,1]},
        {dir: "SE", corners: [1,2]},
        {dir: "S", corners: [2,3]},
        {dir: "SW", corners: [3,4]},
        {dir: "NW", corners: [4,5]},
    ]],
    [Orientation.POINTY, [
        {dir: "NE", corners: [5,0]},
        {dir: "E", corners: [0,1]},
        {dir: "SE", corners: [1,2]},
        {dir: "SW", corners: [2,3]},
        {dir: "W", corners: [3,4]},
        {dir: "NW", corners: [4,5]},
    ]],
]);

/**
 * An infinite generator for creating column labels from an initial string of characters.
 * With the English alphabet, you would get a-z, then aa-az-ba-zz, then aaa etc.
 *
 * @param labels - A string of characters to use as column labels
 * @returns The next label in the sequence.
 */
function* generateColumnLabel(labels: string): IterableIterator<string> {
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
    protected cellsize = 50;
    /**
     * The list of received, processed, and validated options. This is available to all class methods.
     *
     */
    protected options: IRendererOptionsOut
    protected json?: APRenderRep;
    protected rootSvg?: Svg;

    /**
     * Creates an instance of RendererBase. A name must be provided. Also sets the default options.
     * @param name - The unique name of the renderer
     */
    constructor() {
        this.options = {
            sheets: ["core", "dice", "looney", "piecepack", "chess", "streetcar", "nato"],
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
            this.options.colours = ["#ddcc77", "#cc6677", "#aa4499", "#882255", "#332288", "#117733", "#44aa99", "#88ccee", "#999999"];
        } else {
            this.options.colours = ["#e41a1c", "#377eb8", "#4daf4a", "#ffff33", "#984ea3", "#ff7f00", "#a65628", "#f781bf", "#999999"];
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
    protected loadPattern(name: string, canvas?: Svg): void {
        if (canvas === undefined) {
            if (this.rootSvg === undefined) {
                throw new Error("Object in an invalid state!");
            }
            canvas = this.rootSvg;
        }
        // Keep in alphabetical order.
        // If you change any `id`s, you need to change them in the constructor, too.

        switch (name) {
            case "chevrons":
                canvas.defs().svg("<pattern id='chevrons' patternUnits='userSpaceOnUse' width='30' height='15' viewbox='0 0 60 30'><svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='60' height='30'><defs><rect id='_r' width='30' height='15' fill='#fff' stroke-width='2.5' stroke='#000'/><g id='_p'><use xlink:href='#_r'/><use y='15' xlink:href='#_r'/><use y='30' xlink:href='#_r'/><use y='45' xlink:href='#_r'/></g></defs><use xlink:href='#_p' transform='translate(0 -25) skewY(40)'/><use xlink:href='#_p' transform='translate(30 0) skewY(-40)'/></svg></pattern>");
                break;
            case "cross":
                canvas.defs().svg("<pattern id='cross' patternUnits='userSpaceOnUse' width='8' height='8'><svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><rect width='8' height='8' fill='#fff'/><path d='M0 0L8 8ZM8 0L0 8Z' stroke-width='0.5' stroke='#000'/></svg></pattern>");
                break;
            case "dots":
                canvas.defs().svg("<pattern id='dots' patternUnits='userSpaceOnUse' width='10' height='10'><svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><rect width='10' height='10' fill='#fff' /><circle cx='2.5' cy='2.5' r='2.5' fill='#000'/></svg></pattern>");
                break;
            case "honeycomb":
                canvas.defs().svg("<pattern id='honeycomb' patternUnits='userSpaceOnUse' width='22.4' height='40' viewbox='0 0 56 100'><svg xmlns='http://www.w3.org/2000/svg' width='56' height='100'><rect width='56' height='100' fill='#fff'/><path d='M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100' fill='none' stroke='#000' stroke-width='2'/><path d='M28 0L28 34L0 50L0 84L28 100L56 84L56 50L28 34' fill='none' stroke='#000' stroke-width='2'/></svg></pattern>");
                break;
            case "houndstooth":
                canvas.defs().svg("<pattern id='houndstooth' patternUnits='userSpaceOnUse' width='24' height='24' viewbox='0 0 24 24'><svg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><title>houndstooth</title><g fill='#000' fill-opacity='1' fill-rule='evenodd'><path d='M0 18h6l6-6v6h6l-6 6H0M24 18v6h-6M24 0l-6 6h-6l6-6M12 0v6L0 18v-6l6-6H0V0'/></g></svg></pattern>");
                break;
            case "microbial":
                canvas.defs().svg("<pattern id='microbial' patternUnits='userSpaceOnUse' width='20' height=20><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><rect width='40' height='40' fill='#fff'/><circle r='9.2' stroke-width='1' stroke='#000' fill='none'/><circle cy='18.4' r='9.2' stroke-width='1px' stroke='#000' fill='none'/><circle cx='18.4' cy='18.4' r='9.2' stroke-width='1' stroke='#000' fill='none'/></svg></pattern>");
                break;
            case "slant":
                canvas.defs().svg("<pattern id='slant' patternUnits='userSpaceOnUse' width='10' height='10'><svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><rect width='10' height='10' fill='#fff'/><path d='M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2' stroke='#000' stroke-width='1'/></svg></pattern>");
                break;
            case "starsWhite":
                canvas.defs().svg("<pattern id='starsWhite' patternUnits='userSpaceOnUse' width='40' height='40' viewbox='0 0 80 80'><svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='#fff'/><circle cx='40' cy='40' r='40' fill='#000'/><path d='M0 40 A40 40 45 0 0 40 0 A40 40 315 0 0 80 40 A40 40 45 0 0 40 80 A40 40 270 0 0 0 40Z' fill='#fff'/></svg></pattern>");
                break;
            case "triangles":
                canvas.defs().svg("<pattern id='triangles' patternUnits='userSpaceOnUse' width='15' height='15'><svg xmlns='http://www.w3.org/2000/svg' width='15' height='15'><rect width='15' height='15' fill='#fff'/><path d='M0 15L7.5 0L15 15Z' fill='#000'/></svg></pattern>");
                break;
            case "wavy":
                canvas.defs().svg("<pattern id='wavy' patternUnits='userSpaceOnUse' width='15' height='20' viewbox='0 0 75 100'><svg xmlns='http://www.w3.org/2000/svg' width='75' height='100'><rect width='75' height='100' fill='#fff'/><circle cx='75' cy='50' r='28.3%' stroke-width='12' stroke='#000' fill='none'/><circle cx='0' r='28.3%' stroke-width='12' stroke='#000' fill='none'/><circle cy='100' r='28.3%' stroke-width='12' stroke='#000' fill='none'/></svg></pattern>");
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
                // eslint-disable-next-line guard-for-in
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
            // eslint-disable-next-line guard-for-in
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
                            // This ts-ignore is because of poor SVGjs typing
                            // @ts-ignore
                            got.find(`[data-playerfill${i > 0 ? i+1 : ""}=true]`).each(function(this: SVGElement) { this.fill(normColour); });
                            // This ts-ignore is because of poor SVGjs typing
                            // @ts-ignore
                            got.find(`[data-playerstroke${i > 0 ? i+1 : ""}=true]`).each(function(this: SVGElement) { this.stroke(normColour); isStroke = true; });
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
            // eslint-disable-next-line guard-for-in
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
            // eslint-disable-next-line guard-for-in
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

    public getConhexCells(boardsize: number, cellsize: number): IPolyPolygon[][] {
        const numLayers = Math.floor(boardsize / 2);
        let grid = rectOfRects({gridHeight: boardsize, gridWidth: boardsize, cellSize: cellsize});

        const polys: IPolyPolygon[][] = [];
        // for each layer (except the last one)
        for (let layer = 0; layer < numLayers - 1; layer++) {
            const tlx = layer;
            const tly = layer;
            const row: IPolyPolygon[] = [];
            // do the following four times, rotating after each time
            for (let i = 0; i < 4; i++) {
                for (let segment = 0; segment < numLayers - 1 - layer; segment++) {
                    // corner
                    if (segment === 0) {
                        // outer layer corners are unique
                        if (layer === 0) {
                            row.push({
                                type: "poly",
                                points: [
                                    grid[tly][tlx],
                                    grid[tly][tlx+2],
                                    grid[tly+1][tlx+2],
                                    grid[tly+2][tlx+1],
                                    grid[tly+2][tlx],
                                ]
                            });
                        }
                        // interior corner
                        else {
                            row.push({
                                type: "poly",
                                points: [
                                    grid[tly][tlx+1],
                                    grid[tly][tlx+2],
                                    grid[tly+1][tlx+2],
                                    grid[tly+2][tlx+1],
                                    grid[tly+2][tlx],
                                    grid[tly+1][tlx],
                                ]
                            });
                        }
                    }
                    // everything else
                    else {
                        const xoffset = tlx + (2 * segment);
                        row.push({
                            type: "poly",
                            points: [
                                grid[tly][xoffset],
                                grid[tly][xoffset+2],
                                grid[tly+1][xoffset+2],
                                grid[tly+1][xoffset],
                            ]
                        });
                    }
                }

                // rotate after each pass
                grid = matrixRectRotN90(grid) as GridPoints;
            }
            polys.push(row);
        }
        // now add the center diamond poly
        const ctr = Math.floor(boardsize / 2);
        polys.push([{
            type: "poly",
            points: [
                grid[ctr-1][ctr],
                grid[ctr][ctr+1],
                grid[ctr+1][ctr],
                grid[ctr][ctr-1],
            ],
        }]);

        // all done
        return polys;
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates square boards of square cells. Points are the centre of each square.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected squares(opts?: {noSvg: boolean}): [GridPoints, Poly[][]] {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("width" in this.json.board)) || (! ("height" in this.json.board)) || (this.json.board.width === undefined) || (this.json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        if ( (! ("style" in this.json.board)) || (this.json.board.style === undefined) ) {
            throw new Error("This function requires that a board style be defined.");
        }
        const width: number = this.json.board.width;
        const height: number = this.json.board.height;
        const cellsize = this.cellsize;
        const style = this.json.board.style;

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

        let clickEdges = false;
        if ( (this.json.options !== undefined) && (this.json.options.includes("clickable-edges")) ) {
            clickEdges = (this.options.boardClick !== undefined);
        }

        // Check for tiling
        let tilex = 0;
        let tiley = 0;
        let tileSpace = 0;
        if (this.json.board.tileWidth !== undefined) {
            tilex = this.json.board.tileWidth;
        }
        if (this.json.board.tileHeight !== undefined) {
            tiley = this.json.board.tileHeight;
        }
        if (this.json.board.tileSpacing !== undefined) {
            tileSpace = this.json.board.tileSpacing;
        }

        // Get a grid of points
        const grid = rectOfRects({gridHeight: height, gridWidth: width, cellSize: cellsize, tileHeight: tiley, tileWidth: tilex, tileSpacing: tileSpace});

        // create polys for flood fills and other potential uses
        const polys: IPolyPolygon[][] = [];
        for (let y = 0; y < height; y++) {
            const rowPolys: IPolyPolygon[] = [];
            for (let x = 0; x < width; x++) {
                const {x: cx, y: cy} = grid[y][x];
                const half = cellsize / 2;
                const node: IPoint[] = [
                    {x: cx - half, y: cy - half},
                    {x: cx + half, y: cy - half},
                    {x: cx + half, y: cy + half},
                    {x: cx - half, y: cy + half},
                ];
                rowPolys.push({
                    type: "poly",
                    points: node,
                });
            }
            polys.push(rowPolys);
        }
        if (opts !== undefined && opts.noSvg === true) {
            return [grid, polys];
        }

        const board = this.rootSvg.group().id("board");

        // Make an expanded grid for markers, to accommodate edge marking and shading
        // Add one row and one column and shift all points up and to the left by half a cell size
        let gridExpanded = rectOfRects({gridHeight: height + 1, gridWidth: width + 1, cellSize: cellsize});
        gridExpanded = gridExpanded.map((row) => row.map((cell) => ({x: cell.x - (cellsize / 2), y: cell.y - (cellsize / 2)} as IPoint)));

        // define "tiles" earlier so clickable gridlines are viable
        const tiles = board.group().id("tiles");
        const gridlines = board.group().id("gridlines");
        this.markBoard({svgGroup: gridlines, preGridLines: true, grid, gridExpanded, polys});

        // create buffer zone first if requested
        let bufferwidth = 0;
        let show: CompassDirection[] = ["N", "E", "S", "W"];
        if ( ("buffer" in this.json.board) && (this.json.board.buffer !== undefined) && ("width" in this.json.board.buffer) && (this.json.board.buffer.width !== undefined) && (this.json.board.buffer.width > 0) ) {
            bufferwidth = cellsize * (this.json.board.buffer as IBuffer).width!;
            if ( ("show" in this.json.board.buffer) && (this.json.board.buffer.show !== undefined) && (Array.isArray(this.json.board.buffer.show)) && ((this.json.board.buffer.show as string[]).length > 0) ) {
                show = [...(this.json.board.buffer as IBuffer).show!];
            }
            let pattern: string | undefined;
            if ( ("pattern" in this.json.board.buffer) && (this.json.board.buffer.pattern !== undefined) && (this.json.board.buffer.pattern.length > 0) ) {
                pattern = (this.json.board.buffer as IBuffer).pattern;
            }
            if (pattern !== undefined) {
                this.loadPattern(pattern);
            }
            let fill: SVGElement | undefined;
            if (pattern !== undefined) {
                fill = this.rootSvg.findOne(`#${pattern}`) as SVGElement;
                if (fill === undefined) {
                    throw new Error("Could not load the fill for the buffer zone.");
                }
            }
            const offset = cellsize * 0.1;
            // top
            let h = bufferwidth;
            let w = (grid[0][grid[0].length - 1].x + cellsize) - grid[0][0].x;
            let x = grid[0][0].x - (cellsize / 2);
            let y = grid[0][0].y - (cellsize / 2) - (h + offset);
            let buffN: SVGRect | undefined;
            if (show.includes("N")) {
                const key = "_buffer_N";
                buffN = board.rect(w, h).id(key)
                .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                .move(x, y);
            }
            // bottom
            x = grid[grid.length - 1][0].x - (cellsize / 2);
            y = grid[grid.length - 1][0].y + (cellsize / 2) + offset;
            let buffS: SVGRect | undefined;
            if (show.includes("S")) {
                const key = "_buffer_S";
                buffS = board.rect(w, h).id(key)
                .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                .move(x, y);
            }
            // left
            w = bufferwidth;
            h = (grid[grid.length - 1][0].y + cellsize) - grid[0][0].y;
            x = grid[0][0].x - (cellsize / 2) - (w + offset);
            y = grid[0][0].y - (cellsize / 2);
            let buffW: SVGRect | undefined;
            if (show.includes("W")) {
                const key = "_buffer_W";
                buffW = board.rect(w, h).id(key)
                .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                .move(x, y);
            }
            // right
            x = grid[0][grid[0].length - 1].x + (cellsize / 2) + offset;
            y = grid[0][0].y - (cellsize / 2);
            let buffE: SVGRect | undefined;
            if (show.includes("E")) {
                const key = "_buffer_E";
                buffE = board.rect(w, h).id(key)
                .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                .move(x, y);
            }

            // Fill and add click handlers to all four zones at once
            for (const buff of [buffN, buffS, buffW, buffE]) {
                if (buff === undefined) { continue; }
                if (fill !== undefined) {
                    buff.fill(fill);
                } else {
                    buff.fill({color: "white", opacity: 0})
                }
                if (this.options.boardClick !== undefined) {
                    buff.click(() => this.options.boardClick!(-1, -1, buff.id()));
                }
            }
            bufferwidth += offset;
        }

        // Add board labels
        let labelColour = this.options.colourContext.labels;
        if ( ("labelColour" in this.json.board) && (this.json.board.labelColour !== undefined) ) {
            labelColour = this.json.board.labelColour;
        }
        let labelOpacity = 1;
        if ( ("labelOpacity" in this.json.board) && (this.json.board.labelOpacity !== undefined) ) {
            labelOpacity = this.json.board.labelOpacity;
        }
        if ( (! this.json.options) || (! this.json.options.includes("hide-labels") ) ) {
            let hideHalf = false;
            if (this.json.options?.includes("hide-labels-half")) {
                hideHalf = true;
            }
            const labels = board.group().id("labels");
            let customLabels: string[]|undefined;
            if ( ("columnLabels" in this.json.board) && (this.json.board.columnLabels !== undefined) ) {
                customLabels = this.json.board.columnLabels;
            }
            let columnLabels = this.getLabels(customLabels, width);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-letters")) ) {
                columnLabels.reverse();
            }

            let rowLabels = this.getRowLabels(this.json.board.rowLabels, height);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-numbers")) ) {
                rowLabels.reverse();
            }

            if (this.json.options?.includes("swap-labels")) {
                const scratch = [...columnLabels];
                columnLabels = [...rowLabels];
                columnLabels.reverse();
                rowLabels = [...scratch];
                rowLabels.reverse();
            }
            // Columns (letters)
            for (let col = 0; col < width; col++) {
                const pointTop = {x: grid[0][col].x, y: grid[0][col].y - cellsize - (show.includes("N") ? bufferwidth : 0)};
                const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + cellsize + (show.includes("S") ? bufferwidth : 0)};
                if (! hideHalf) {
                    labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
                }
                labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
            }

            // Rows (numbers)
            for (let row = 0; row < height; row++) {
                const pointL = {x: grid[row][0].x - cellsize - (show.includes("W") ? bufferwidth : 0), y: grid[row][0].y};
                const pointR = {x: grid[row][width - 1].x + cellsize + (show.includes("E") ? bufferwidth : 0), y: grid[row][width - 1].y};
                labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
                if (! hideHalf) {
                    labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
                }
            }
        }

        // Now the tiles
        type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
        let blocked: Blocked|undefined;
        if ( (this.json.board.blocked !== undefined) && (this.json.board.blocked !== null)  && (Array.isArray(this.json.board.blocked)) && (this.json.board.blocked.length > 0) ){
            blocked = [...(this.json.board.blocked as Blocked)];
        }

        if (style === "squares-checkered") {
            // Load glyphs for light and dark squares
            const cBg = tinycolor(this.options.colourContext.background);
            const cFill = tinycolor(this.options.colourContext.fill);
            // If the background colour is lighter than the fill colour, then light tiles are fully transparent, and dark tiles are 75% transparent.
            let tileDark: SVGSymbol;
            let tileLight: SVGSymbol;
            if (cBg.getLuminance() > cFill.getLuminance()) {
                tileLight = this.rootSvg.defs().symbol().id("tile-light").viewbox(0, 0, cellsize, cellsize);
                tileLight.rect(cellsize, cellsize)
                    .move(0, 0)
                    .fill({color: this.options.colourContext.background})
                    .opacity(0)
                    .stroke({width: 0});
                tileDark = this.rootSvg.defs().symbol().id("tile-dark").viewbox(0, 0, cellsize, cellsize);
                tileDark.rect(cellsize, cellsize)
                    .move(0, 0)
                    .fill(this.options.colourContext.fill)
                    .opacity(baseOpacity * 0.25)
                    .stroke({width: 0});
            // If the background colour is darker than the fill colour (dark mode), then light tiles are 75% transparent and dark tiles are fully transparent.
            } else {
                tileLight = this.rootSvg.defs().symbol().id("tile-light").viewbox(0, 0, cellsize, cellsize);
                tileLight.rect(cellsize, cellsize)
                    .move(0, 0)
                    .fill({color: this.options.colourContext.fill})
                    .opacity(baseOpacity * 0.25)
                    .stroke({width: 0});
                tileDark = this.rootSvg.defs().symbol().id("tile-dark").viewbox(0, 0, cellsize, cellsize);
                tileDark.rect(cellsize, cellsize)
                    .move(0, 0)
                    .fill(this.options.colourContext.background)
                    .opacity(0)
                    .stroke({width: 0});
            }
            // const tileBlocked = this.rootSvg.defs().symbol().id("tile-blocked").viewbox(0, 0, cellsize, cellsize);
            // tileBlocked.rect(cellsize, cellsize)
            //     .move(0, 0)
            //     .fill({color: this.options.colourContext.fill, opacity: baseOpacity})
            //     .stroke({width: 0});

            // Determine whether the first row starts with a light or dark square
            let startLight = 1;
            if (height % 2 === 0) {
                startLight = 0;
            }
            if ( ("startLight" in this.json.board) ) {
                if (this.json.board.startLight) {
                    startLight = 0;
                } else {
                    startLight = 1;
                }
            }

            // Place them
            for (let row = 0; row < height; row++) {
                let lightCol = 1;
                if (row % 2 === startLight) {
                    lightCol = 0;
                }
                for (let col = 0; col < width; col++) {
                    let idx = -1;
                    if (blocked !== undefined) {
                        idx = blocked.findIndex(o => o.row === row && o.col === col)
                    }
                    const {x, y} = grid[row][col];
                    let used: SVGUse;
                    if (idx !== -1) {
                        // used = tiles.use(tileBlocked).size(cellsize, cellsize).center(x, y);
                    } else {
                        if (col % 2 !== lightCol) {
                            used = tiles.use(tileDark).size(cellsize, cellsize).center(x, y);
                        } else {
                            used = tiles.use(tileLight).size(cellsize, cellsize).center(x, y);
                        }
                        if (tileSpace > 0) {
                            used.click(() => this.options.boardClick!(row, col, ""));
                        }
                    }
                }
            }
        } else if (tileSpace > 0 || style === "pegboard" ) {
            const tileLight = this.rootSvg.defs().symbol().id("tile-light").viewbox(0, 0, cellsize, cellsize);
            tileLight.rect(cellsize, cellsize)
                .fill({color: this.options.colourContext.background, opacity: 0})
                .stroke({width: 0});
            if (style === "pegboard") {
                tileLight.circle(cellsize / 5)
                    .stroke({width: baseStroke, color: baseColour, opacity: baseOpacity})
                    .fill({color: baseColour, opacity: baseOpacity})
                    .center(cellsize / 2, cellsize / 2);
            }
            const tileBlocked = this.rootSvg.defs().symbol().id("tile-blocked").viewbox(0, 0, cellsize, cellsize);
            if (style === "pegboard") {
                tileBlocked.rect(cellsize, cellsize)
                    .fill({color: this.options.colourContext.background, opacity: 0})
                    .stroke({width: 0});
            } else {
                // tileBlocked.rect(cellsize, cellsize)
                //     .move(0, 0)
                //     .fill({color: baseColour, opacity: baseOpacity})
                //     .stroke({width: 0});
            }

            for (let row = 0; row < height; row++) {
                for (let col = 0; col < width; col++) {
                    let idx = -1;
                    if (blocked !== undefined) {
                        idx = blocked.findIndex(o => o.row === row && o.col === col)
                    }
                    const {x, y} = grid[row][col];
                    let used: SVGUse;
                    if (idx !== -1) {
                        used = tiles.use(tileBlocked).size(cellsize, cellsize).center(x, y);
                    } else {
                        used = tiles.use(tileLight).size(cellsize, cellsize).center(x, y);
                        used.click(() => this.options.boardClick!(row, col, ""));
                    }
                }
            }
        } else if (blocked !== undefined) {
            // const tileBlocked = this.rootSvg.defs().symbol().id("tile-blocked").viewbox(0, 0, cellsize, cellsize);
            // tileBlocked.rect(cellsize, cellsize)
            //     .move(0, 0)
            //     .fill({color: this.options.colourContext.fill, opacity: baseOpacity})
            //     .stroke({width: 0});
            // for (const coord of blocked) {
            //     const {x, y} = grid[coord.row][coord.col];
            //     tiles.use(tileBlocked).size(cellsize, cellsize).center(x, y);
            // }
        }

        // Draw grid lines
        if (style !== "pegboard") {
            if (style === "squares-beveled") {
                baseOpacity *= 0.15;
            }

            // for each unblocked grid node, create a line for each edge
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    let idx = -1;
                    if (blocked !== undefined) {
                        idx = blocked.findIndex(b => b.col === x && b.row === y);
                    }
                    if (idx === -1) {
                        const {x: cx, y: cy} = grid[y][x];
                        const half = cellsize / 2;
                        const pts: IPoint[] = [
                            {x: cx - half, y: cy - half},
                            {x: cx + half, y: cy - half},
                            {x: cx + half, y: cy + half},
                            {x: cx - half, y: cy + half},
                        ];
                        // have to close the poly
                        pts.push(pts[0]);
                        gridlines.polyline(pts.map(pt => [pt.x, pt.y]).flat())
                                 .fill("none")
                                 .stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                    }
                }
            }

            // check for non-spaced tiling and draw thicker lines
            if (tileSpace === 0 && (tilex > 0 || tiley > 0)) {
                if (tiley > 0) {
                    // horizontal
                    const xLeft = grid[0][0].x - (cellsize / 2);
                    const xRight = grid[0][grid[0].length - 1].x + (cellsize / 2);
                    for (let row = 0; row < height-1; row++) {
                        if ((row+1) % tiley === 0) {
                            const y = grid[row][0].y + (cellsize / 2);
                            gridlines.line(xLeft, y, xRight, y).stroke({width: baseStroke * 3, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                        }
                    }
                }
                if (tilex > 0) {
                    // vertical
                    const yTop = grid[0][0].y - (cellsize / 2);
                    const yBottom = grid[grid.length - 1][0].y + (cellsize / 2);
                    for (let col = 0; col < width-1; col++) {
                        if ((col+1) % tilex === 0) {
                            const x = grid[0][col].x + (cellsize / 2);
                            gridlines.line(x, yTop, x, yBottom).stroke({width: baseStroke * 3, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                        }
                    }
                }
            }
        }

        if ( (this.options.boardClick !== undefined) && (tileSpace === 0) && (style !== "pegboard") ) {
            const rotation = this.getRotation();
            const centre = this.getBoardCentre();
            const clickDeltaX: number = (this.json.board.clickDeltaX ?? 0);
            const clickDeltaY: number = (this.json.board.clickDeltaX ?? 0);
            const originX = grid[0][0].x;
            const originY = grid[0][0].y;
            const maxX = grid[0][grid[0].length - 1].x;
            const maxY = grid[grid.length - 1][0].y;
            const root = this.rootSvg;
            let genericCatcher = ((e: { clientX: number; clientY: number; }) => {
                const point = rotatePoint(root.point(e.clientX, e.clientY), rotation*-1, centre);
                const x = Math.floor((point.x - (originX - (cellsize / 2))) / cellsize);
                const y = Math.floor((point.y - (originY - (cellsize / 2))) / cellsize);
                if (x >= 0 - clickDeltaX && x < width + clickDeltaX && y >= 0 - clickDeltaY && y < height + clickDeltaY) {
                    // try to cull double click handlers with buffer zones by making the generic handler less sensitive at the edges
                    if ( (bufferwidth === 0) || ( (point.x >= originX) && (point.x <= maxX) && (point.y >= originY) && (point.y <= maxY) ) ) {
                        this.options.boardClick!(y, x, "");
                    }
                }
            });
            if (this.options.rotate === 180) {
                genericCatcher = ((e: { clientX: number; clientY: number; }) => {
                    const point = rotatePoint(root.point(e.clientX, e.clientY), rotation*-1, centre);
                    const x = width - Math.floor((point.x - (originX - (cellsize / 2))) / cellsize) - 1;
                    const y = height - Math.floor((point.y - (originY - (cellsize / 2))) / cellsize) - 1;
                    if (x >= 0 - clickDeltaX && x < width + clickDeltaX && y >= 0 - clickDeltaY && y < height + clickDeltaY) {
                        // try to cull double click handlers with buffer zones by making the generic handler less sensitive at the edges
                        if ( (bufferwidth === 0) || ( (point.x >= originX) && (point.x <= maxX) && (point.y >= originY) && (point.y <= maxY) ) ) {
                            this.options.boardClick!(y, x, "");
                        }
                    }
                });
            }
            this.rootSvg.click(genericCatcher);
        }

        // Add edge click handlers if requested
        // All cells have E and S edges. Only first row and column have N and W.
        if (clickEdges) {
            for (let row = 0; row < grid.length; row++) {
                for (let col = 0; col < grid[row].length; col++) {
                    const dirs: CompassDirection[] = ["E","S"];
                    if (row === 0) {
                        dirs.push("N");
                    }
                    if (col === 0) {
                        dirs.push("W");
                    }
                    for (const dir of dirs) {
                        // draw line
                        let x1: number; let y1: number;
                        let x2: number; let y2: number;
                        const halfcell = this.cellsize / 2;
                        switch (dir) {
                            case "N":
                                x1 = grid[row][col].x - halfcell;
                                y1 = grid[row][col].y - halfcell;
                                x2 = grid[row][col].x + halfcell;
                                y2 = y1;
                                break;
                            case "S":
                                x1 = grid[row][col].x - halfcell;
                                y1 = grid[row][col].y + halfcell;
                                x2 = grid[row][col].x + halfcell;
                                y2 = y1;
                                break;
                            case "E":
                                x1 = grid[row][col].x + halfcell;
                                y1 = grid[row][col].y - halfcell;
                                x2 = x1;
                                y2 = grid[row][col].y + halfcell;
                                break;
                            case "W":
                                x1 = grid[row][col].x - halfcell;
                                y1 = grid[row][col].y - halfcell;
                                x2 = x1;
                                y2 = grid[row][col].y + halfcell;
                                break;
                            default:
                                throw new Error(`Invalid direction passed: ${dir}`);
                        }
                        const edgeLine = board.line(x1, y1, x2, y2).stroke({ width: baseStroke * 5, color: baseColour, opacity: 0, linecap: "round" });
                        edgeLine.click((e: MouseEvent) => {
                            this.options.boardClick!(row, col, dir);
                            e.stopPropagation();
                        });
                    }
                }
            }
        }

        this.markBoard({svgGroup: gridlines, preGridLines: false, grid, gridExpanded, polys});

        return [grid, polys];
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates rectangular boards with squares-turned-into-octogons as the main,
     * cells, and diamonds at each vertex.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected squaresDiamonds(): [GridPoints, Poly[][]] {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("width" in this.json.board)) || (! ("height" in this.json.board)) || (this.json.board.width === undefined) || (this.json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        if ( (! ("style" in this.json.board)) || (this.json.board.style === undefined) ) {
            throw new Error("This function requires that a board style be defined.");
        }
        // height and width here refer to the number of square/octagon cells
        const width: number = this.json.board.width;
        const height: number = this.json.board.height;
        const cellsize = this.cellsize;

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
        let gridStart: "S"|"D" = "S";
        if ("sdStart" in this.json.board && this.json.board.sdStart !== undefined) {
            gridStart = this.json.board.sdStart;
        }

        // Get a grid of points
        const grid = rectOfRects({gridHeight: height, gridWidth: width, cellSize: cellsize});
        const board = this.rootSvg.group().id("board");

        // construct all diamonds and octagon polys and then pare them down
        const dr = cellsize * 0.25;
        let polys: IPolyPolygon[][] = [];
        for (let row = 0; row < height; row++) {
            const rowDiamonds: IPolyPolygon[] = [];
            const rowSquares: IPolyPolygon[] = [];
            const rowExtraDiamonds: IPolyPolygon[] = [];
            for (let col = 0; col < width; col++) {
                const {x: cx, y: cy} = grid[row][col];
                // top-left diamond
                const dcx = cx - (cellsize / 2);
                const dcy = cy - (cellsize / 2);
                rowDiamonds.push({
                    type: "poly",
                    points: [
                        {x: dcx, y: dcy - dr},
                        {x: dcx + dr, y: dcy},
                        {x: dcx, y: dcy + dr},
                        {x: dcx - dr, y: dcy},
                    ]
                });
                // if last col, top-right diamond
                if (col === width - 1) {
                    const dcx2 = cx + (cellsize / 2);
                    const dcy2 = cy - (cellsize / 2);
                    rowDiamonds.push({
                        type: "poly",
                        points: [
                            {x: dcx2, y: dcy2 - dr},
                            {x: dcx2 + dr, y: dcy2},
                            {x: dcx2, y: dcy2 + dr},
                            {x: dcx2 - dr, y: dcy2},
                        ]
                    });
                }
                // square
                rowSquares.push({
                    type: "poly",
                    points: [
                        {x: cx - (cellsize / 2) + dr, y: cy - (cellsize / 2)},
                        {x: cx + (cellsize / 2) - dr, y: cy - (cellsize / 2)},
                        {x: cx + (cellsize / 2), y: cy - (cellsize / 2) + dr},
                        {x: cx + (cellsize / 2), y: cy + (cellsize / 2) - dr},
                        {x: cx + (cellsize / 2) - dr, y: cy + (cellsize / 2)},
                        {x: cx - (cellsize / 2) + dr, y: cy + (cellsize / 2)},
                        {x: cx - (cellsize / 2), y: cy + (cellsize / 2) - dr},
                        {x: cx - (cellsize / 2), y: cy - (cellsize / 2) + dr},
                    ]
                });
                // if last row, bottom-left diamond
                if (row === height - 1) {
                    const dcxb = cx - (cellsize / 2);
                    const dcyb = cy + (cellsize / 2);
                    rowExtraDiamonds.push({
                        type: "poly",
                        points: [
                            {x: dcxb, y: dcyb - dr},
                            {x: dcxb + dr, y: dcyb},
                            {x: dcxb, y: dcyb + dr},
                            {x: dcxb - dr, y: dcyb},
                        ]
                    });
                    // if last row and col, bottom-right diamond
                    if (col === width - 1) {
                        const dcx2 = cx + (cellsize / 2);
                        const dcy2 = cy + (cellsize / 2);
                        rowExtraDiamonds.push({
                            type: "poly",
                            points: [
                                {x: dcx2, y: dcy2 - dr},
                                {x: dcx2 + dr, y: dcy2},
                                {x: dcx2, y: dcy2 + dr},
                                {x: dcx2 - dr, y: dcy2},
                            ]
                        });
                    }
                }
            }
            polys.push(rowDiamonds);
            polys.push(rowSquares);
            if (rowExtraDiamonds.length > 0) {
                polys.push(rowExtraDiamonds)
            }
        }
        if (gridStart === "S") {
            polys = polys.slice(1, -1).map(row => row.length > width ? row.slice(1, -1) : row);
        }
        const gridPoints: GridPoints = polys.map(row => row.map(poly => centroid(poly.points)!))

        // get list of just squares for placing pieces
        const pcGrid: GridPoints = [];
        for (let row = gridStart === "S" ? 0 : 1; row < gridPoints.length; row += 2) {
            pcGrid.push(gridPoints[row]);
        }

        // have to define tiles early for clickable markers to work
        // const tiles = board.group().id("tiles");
        const gridlines = board.group().id("gridlines");
        this.markBoard({svgGroup: gridlines, preGridLines: true, grid: gridPoints, polys});

        // Add board labels
        let labelColour = this.options.colourContext.labels;
        if ( ("labelColour" in this.json.board) && (this.json.board.labelColour !== undefined) ) {
            labelColour = this.json.board.labelColour;
        }
        let labelOpacity = 1;
        if ( ("labelOpacity" in this.json.board) && (this.json.board.labelOpacity !== undefined) ) {
            labelOpacity = this.json.board.labelOpacity;
        }
        if ( (! this.json.options) || (! this.json.options.includes("hide-labels") ) ) {
            let hideHalf = false;
            if (this.json.options?.includes("hide-labels-half")) {
                hideHalf = true;
            }
            const labels = board.group().id("labels");
            let customLabels: string[]|undefined;
            if ( ("columnLabels" in this.json.board) && (this.json.board.columnLabels !== undefined) ) {
                customLabels = this.json.board.columnLabels;
            }
            let columnLabels = this.getLabels(customLabels, width);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-letters")) ) {
                columnLabels.reverse();
            }

            let rowLabels = this.getRowLabels(this.json.board.rowLabels, height);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-numbers")) ) {
                rowLabels.reverse();
            }

            if (this.json.options?.includes("swap-labels")) {
                const scratch = [...columnLabels];
                columnLabels = [...rowLabels];
                columnLabels.reverse();
                rowLabels = [...scratch];
                rowLabels.reverse();
            }

            // Columns (letters)
            for (let col = 0; col < width; col++) {
                const pointTop = {x: grid[0][col].x, y: grid[0][col].y - (cellsize)};
                const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + (cellsize)};
                if (! hideHalf) {
                    labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
                }
                labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
            }

            // Rows (numbers)
            for (let row = 0; row < height; row++) {
                const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
                const pointR = {x: grid[row][width - 1].x + cellsize, y: grid[row][width - 1].y};
                labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
                if (! hideHalf) {
                    labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
                }
            }
        }

        // Draw grid lines
        type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
        let blocked: Blocked|undefined;
        if ( (this.json.board.blocked !== undefined) && (this.json.board.blocked !== null) && (Array.isArray(this.json.board.blocked)) && (this.json.board.blocked.length > 0) ){
            blocked = [...(this.json.board.blocked as Blocked)];
        }
        for (let row = 0; row < polys.length; row++) {
            for (let col = 0; col < polys[row].length; col++) {
                const isBlocked = blocked?.find(entry => entry.row === row && entry.col === col) !== undefined;
                if (isBlocked) { continue; }
                const poly = polys[row][col];
                const cell = gridlines.polygon(poly.points.map(({ x, y }) => `${x},${y}`).join(" "))
                                      .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                                      .fill({color: "white", opacity: 0});
                if (this.options.boardClick !== undefined) {
                    cell.click(() => this.options.boardClick!(row, col, ""));
                }
            }
        }

        this.markBoard({svgGroup: gridlines, preGridLines: false, grid: gridPoints, polys});

        return [gridPoints, polys];
    }


    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates square boards where the points are placed on the intersections of lines.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected vertex(): GridPoints {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("width" in this.json.board)) || (! ("height" in this.json.board)) || (this.json.board.width === undefined) || (this.json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        if ( (! ("style" in this.json.board)) || (this.json.board.style === undefined) ) {
            throw new Error("This function requires that a board style be defined.");
        }
        const width: number = this.json.board.width;
        const height: number = this.json.board.height;
        const cellsize = this.cellsize;
        const style = this.json.board.style;

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

        // Check for tiling
        let tilex = 0;
        let tiley = 0;
        let tileSpace = 0;
        if (this.json.board.tileWidth !== undefined) {
            tilex = this.json.board.tileWidth;
        }
        if (this.json.board.tileHeight !== undefined) {
            tiley = this.json.board.tileHeight;
        }
        if (this.json.board.tileSpacing !== undefined) {
            tileSpace = this.json.board.tileSpacing;
        }

        // Get a grid of points
        const grid = rectOfRects({gridHeight: height, gridWidth: width, cellSize: cellsize, tileHeight: tiley, tileWidth: tilex, tileSpacing: tileSpace});
        const board = this.rootSvg.group().id("board");

        // have to define tiles early for clickable markers to work
        const tiles = board.group().id("tiles");
        const gridlines = board.group().id("gridlines");
        this.markBoard({svgGroup: gridlines, preGridLines: true, grid});

        // create buffer zone first if requested
        let bufferwidth = 0;
        let show: CompassDirection[] = ["N", "E", "S", "W"];
        if ( ("buffer" in this.json.board) && (this.json.board.buffer !== undefined) && ("width" in this.json.board.buffer) && (this.json.board.buffer.width !== undefined) && (this.json.board.buffer.width > 0) ) {
            bufferwidth = cellsize * (this.json.board.buffer as IBuffer).width!;
            if ( ("show" in this.json.board.buffer) && (this.json.board.buffer.show !== undefined) && (Array.isArray(this.json.board.buffer.show)) && ((this.json.board.buffer.show as string[]).length > 0) ) {
                show = [...(this.json.board.buffer as IBuffer).show!];
            }
            let pattern: string | undefined;
            if ( ("pattern" in this.json.board.buffer) && (this.json.board.buffer.pattern !== undefined) && (this.json.board.buffer.pattern.length > 0) ) {
                pattern = (this.json.board.buffer as IBuffer).pattern;
            }
            if (pattern !== undefined) {
                this.loadPattern(pattern);
            }
            let fill: SVGElement | undefined;
            if (pattern !== undefined) {
                fill = this.rootSvg.findOne(`#${pattern}`) as SVGElement;
                if (fill === undefined) {
                    throw new Error("Could not load the fill for the buffer zone.");
                }
            }
            const offset = cellsize * 0.2;
            // top
            let h = bufferwidth;
            let w = (grid[0][grid[0].length - 1].x) - grid[0][0].x;
            let x = grid[0][0].x;
            let y = grid[0][0].y - (h + offset);
            let buffN: SVGRect | undefined;
            if (show.includes("N")) {
                const key = "_buffer_N";
                buffN = board.rect(w, h).id(key)
                .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                .move(x, y);
            }
            // bottom
            x = grid[grid.length - 1][0].x;
            y = grid[grid.length - 1][0].y + offset;
            let buffS: SVGRect | undefined;
            if (show.includes("S")) {
                const key = "_buffer_S";
                buffS = board.rect(w, h).id(key)
                .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                .move(x, y);
            }
            // left
            w = bufferwidth;
            h = (grid[grid.length - 1][0].y) - grid[0][0].y;
            x = grid[0][0].x- (w + offset);
            y = grid[0][0].y;
            let buffW: SVGRect | undefined;
            if (show.includes("W")) {
                const key = "_buffer_W";
                buffW = board.rect(w, h).id(key)
                .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                .move(x, y);
            }
            // right
            x = grid[0][grid[0].length - 1].x + offset;
            y = grid[0][0].y;
            let buffE: SVGRect | undefined;
            if (show.includes("E")) {
                const key = "_buffer_E";
                buffE = board.rect(w, h).id(key)
                .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                .move(x, y);
            }

            // Fill and add click handlers to all four zones at once
            for (const buff of [buffN, buffS, buffW, buffE]) {
                if (buff === undefined) { continue; }
                if (fill !== undefined) {
                    buff.fill(fill);
                } else {
                    buff.fill({color: "white", opacity: 0})
                }
                if (this.options.boardClick !== undefined) {
                    buff.click(() => this.options.boardClick!(-1, -1, buff.id()));
                }
            }
            bufferwidth += offset;
        }

        // Add board labels
        let labelColour = this.options.colourContext.labels;
        if ( ("labelColour" in this.json.board) && (this.json.board.labelColour !== undefined) ) {
            labelColour = this.json.board.labelColour;
        }
        let labelOpacity = 1;
        if ( ("labelOpacity" in this.json.board) && (this.json.board.labelOpacity !== undefined) ) {
            labelOpacity = this.json.board.labelOpacity;
        }
        if ( (! this.json.options) || (! this.json.options.includes("hide-labels") ) ) {
            let hideHalf = false;
            if (this.json.options?.includes("hide-labels-half")) {
                hideHalf = true;
            }
            const labels = board.group().id("labels");
            let customLabels: string[]|undefined;
            if ( ("columnLabels" in this.json.board) && (this.json.board.columnLabels !== undefined) ) {
                customLabels = this.json.board.columnLabels;
            }
            let columnLabels = this.getLabels(customLabels, width);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-letters")) ) {
                columnLabels.reverse();
            }

            let rowLabels = this.getRowLabels(this.json.board.rowLabels, height);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-numbers")) ) {
                rowLabels.reverse();
            }

            if (this.json.options?.includes("swap-labels")) {
                const scratch = [...columnLabels];
                columnLabels = [...rowLabels];
                columnLabels.reverse();
                rowLabels = [...scratch];
                rowLabels.reverse();
            }

            // Columns (letters)
            for (let col = 0; col < width; col++) {
                const pointTop = {x: grid[0][col].x, y: grid[0][col].y - (cellsize) - (show.includes("N") ? bufferwidth : 0)};
                const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + (cellsize) + (show.includes("S") ? bufferwidth : 0)};
                if (! hideHalf) {
                    labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
                }
                labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
            }

            // Rows (numbers)
            for (let row = 0; row < height; row++) {
                const pointL = {x: grid[row][0].x - (cellsize) - (show.includes("W") ? bufferwidth : 0), y: grid[row][0].y};
                const pointR = {x: grid[row][width - 1].x + (cellsize) + (show.includes("E") ? bufferwidth : 0), y: grid[row][width - 1].y};
                labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
                if (! hideHalf) {
                    labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
                }
            }
        }

        // Draw grid lines
        // use graphs to determine connections and then draw each connection
        let graph: Graph;
        if (style === "vertex-cross") {
            graph = new SquareGraph(width, height);
        } else if (style === "vertex-fanorona") {
            graph = new SquareFanoronaGraph(width, height);
        } else {
            graph = new SquareOrthGraph(width, height);
        }

        type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
        let blocked: Blocked|undefined;
        if ( (this.json.board.blocked !== undefined) && (this.json.board.blocked !== null) && (Array.isArray(this.json.board.blocked)) && (this.json.board.blocked.length > 0) ){
            blocked = [...(this.json.board.blocked as Blocked)];
        }
        if (blocked !== undefined) {
            for (const entry of blocked) {
                graph.dropNode([entry.col, entry.row]);
            }
        }

        // Horizontal, top of each row, then bottom line after loop
        let numcols = 1;
        if (tilex > 0) {
            numcols = Math.floor(width / tilex);
        }
        for (let tileCol = 0; tileCol < numcols; tileCol++) {
            let idxLeft = 0;
            if (tilex > 0) {
                idxLeft = tileCol * tilex;
            }
            let idxRight = width - 1;
            if (tilex > 0) {
                idxRight = idxLeft + tilex;
                if ( (tileSpace > 0) || (idxRight === width) ) {
                    idxRight--;
                }
            }
            for (let row = 0; row < height; row++) {
                if ( (this.json.options) && (this.json.options.includes("no-border")) ) {
                    if ( (row === 0) || (row === height - 1) ) {
                        continue;
                    }
                }
                let thisStroke = baseStroke;
                if (blocked === undefined) {
                    if ( (tiley > 0) && (tileSpace === 0) && (row > 0) && (row % tiley === 0) ) {
                        thisStroke = baseStroke * 3;
                    } else if (tiley === 0 && (row === 0 || row === height - 1)) {
                        thisStroke = baseStroke * 2;
                    }
                }
                for (let idxX = idxLeft; idxX < idxRight; idxX++) {
                    if (graph.sharesEdge([idxX, row], [idxX+1, row])) {
                        const x1 = grid[row][idxX].x;
                        const y1 = grid[row][idxX].y;
                        const x2 = grid[row][idxX+1].x;
                        const y2 = grid[row][idxX+1].y;
                        gridlines.line(x1, y1, x2, y2).stroke({width: thisStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"}).attr({ 'pointer-events': 'none' });
                    }
                }
            }
        }

        // Vertical, left of each column, then right line after loop
        let numrows = 1;
        if (tiley > 0) {
            numrows = Math.floor(height / tiley);
        }
        for (let tileRow = 0; tileRow < numrows; tileRow++) {
            let idxTop = 0;
            if (tiley > 0) {
                idxTop = tileRow * tiley;
            }
            let idxBottom = height - 1;
            if (tiley > 0) {
                idxBottom = idxTop + tiley;
                if ( (tileSpace > 0) || (idxBottom === height) ) {
                    idxBottom--;
                }
            }
            for (let col = 0; col < width; col++) {
                if ( (this.json.options) && (this.json.options.includes("no-border")) ) {
                    if ( (col === 0) || (col === width - 1) ) {
                        continue;
                    }
                }
                let thisStroke = baseStroke;
                if (blocked === undefined) {
                    if ( (tilex > 0) && (tileSpace === 0) && (col > 0) && (col % tilex === 0) ) {
                        thisStroke = baseStroke * 3;
                    } else if (tilex === 0 && (col === 0 || col === width - 1)) {
                        thisStroke = baseStroke * 2;
                    }
                }
                for (let idxY = idxTop; idxY < idxBottom; idxY++) {
                    if (graph.sharesEdge([col, idxY], [col, idxY+1])) {
                        const x1 = grid[idxY][col].x;
                        const y1 = grid[idxY][col].y;
                        const x2 = grid[idxY+1][col].x;
                        const y2 = grid[idxY+1][col].y;
                        gridlines.line(x1, y1, x2, y2).stroke({width: thisStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"}).attr({ 'pointer-events': 'none' });
                    }
                }
            }
        }

        // If `-cross` board, add crosses
        if (style === "vertex-cross") {
            for (let tileRow = 0; tileRow < numrows; tileRow++) {
                for (let tileCol = 0; tileCol < numcols; tileCol++) {
                    const tileHeight = Math.floor(height / numrows);
                    const tileWidth = Math.floor(width / numcols);
                    let rowFirst = tileRow * tileHeight;
                    if ( (rowFirst === 0) || (tileSpace > 0) ) {
                        rowFirst++;
                    }
                    const rowLast = (tileRow * tileHeight) + tileHeight - 1;
                    const colFirst = tileCol * tileWidth;
                    let colLast = (tileCol * tileWidth) + tileWidth - 1;
                    if ( (colLast < width - 1) && (tileSpace === 0) ) {
                        colLast++;
                    }
                    for (let row = rowFirst; row <= rowLast; row++) {
                        for (let col = colFirst; col <= colLast; col++) {
                            const curr = grid[row][col];
                            // if not last column, do next
                            if (col < colLast) {
                                if (graph.sharesEdge([col, row], [col+1, row-1])) {
                                    const next = grid[row - 1][col + 1];
                                    gridlines.line(curr.x, curr.y, next.x, next.y).stroke({width: baseStroke / 2, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"}).attr({ 'pointer-events': 'none' });
                                }
                            }
                            // if not first column, do previous
                            if (col > colFirst) {
                                if (graph.sharesEdge([col, row], [col-1, row-1])) {
                                    const prev = grid[row - 1][col - 1];
                                    gridlines.line(curr.x, curr.y, prev.x, prev.y).stroke({width: baseStroke / 2, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"}).attr({ 'pointer-events': 'none' });
                                }
                            }
                        }
                    }
                }
            }
        } else if (style === "vertex-fanorona") {
            for (let tileRow = 0; tileRow < numrows; tileRow++) {
                for (let tileCol = 0; tileCol < numcols; tileCol++) {
                    const tileHeight = Math.floor(height / numrows);
                    const tileWidth = Math.floor(width / numcols);
                    const rowFirst = tileRow * tileHeight;
                    const rowLast = (tileRow * tileHeight) + tileHeight - 1;
                    const colFirst = tileCol * tileWidth;
                    const colLast = (tileCol * tileWidth) + tileWidth - 1;
                    // only go to the second-to-last row
                    for (let row = rowFirst; row < rowLast; row++) {
                        // connect down-left and down-right depending on row and col
                        for (let col = colFirst; col <= colLast; col++) {
                            const curr = grid[row][col];
                            let connect = false;
                            if ( ( (row % 2 === 0) && (col % 2 === 0) ) || ( (row % 2 !== 0) && (col % 2 !== 0) ) ){
                                connect = true;
                            }
                            if (connect) {
                                // if not last column, do next
                                if (col < colLast) {
                                    if (graph.sharesEdge([col, row], [col+1, row+1])) {
                                        const next = grid[row + 1][col + 1];
                                        gridlines.line(curr.x, curr.y, next.x, next.y).stroke({width: baseStroke / 2, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"}).attr({ 'pointer-events': 'none' });
                                    }
                                }
                                // if not first column, do previous
                                if (col > colFirst) {
                                    if (graph.sharesEdge([col, row], [col-1, row+1])) {
                                        const prev = grid[row + 1][col - 1];
                                        gridlines.line(curr.x, curr.y, prev.x, prev.y).stroke({width: baseStroke / 2, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"}).attr({ 'pointer-events': 'none' });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if (this.options.boardClick !== undefined) {
            if ( (this.json.renderer !== "stacking-offset") && (tileSpace === 0) ) {
                const rotation = this.getRotation();
                const centre = this.getBoardCentre();
                const clickDeltaX: number = (this.json.board.clickDeltaX ?? 0);
                const clickDeltaY: number = (this.json.board.clickDeltaX ?? 0);
                const originX = grid[0][0].x;
                const originY = grid[0][0].y;
                const maxX = grid[0][grid[0].length - 1].x;
                const maxY = grid[grid.length - 1][0].y;
                const root = this.rootSvg;
                let genericCatcher = ((e: { clientX: number; clientY: number; }) => {
                    const point = rotatePoint(root.point(e.clientX, e.clientY), rotation*-1, centre);
                    const x = Math.floor((point.x - (originX - (cellsize / 2))) / cellsize);
                    const y = Math.floor((point.y - (originY - (cellsize / 2))) / cellsize);
                    if (x >= 0 - clickDeltaX && x < width + clickDeltaX && y >= 0 - clickDeltaY && y < height + clickDeltaY) {
                        // try to cull double click handlers with buffer zones by making the generic handler less sensitive at the edges
                        if ( (bufferwidth === 0) || ( (point.x >= originX) && (point.x <= maxX) && (point.y >= originY) && (point.y <= maxY) ) ) {
                            this.options.boardClick!(y, x, "");
                        }
                    }
                });
                if (this.options.rotate === 180) {
                    genericCatcher = ((e: { clientX: number; clientY: number; }) => {
                        const point = rotatePoint(root.point(e.clientX, e.clientY), rotation*-1, centre);
                        const x = width - Math.floor((point.x - (originX - (cellsize / 2))) / cellsize) - 1;
                        const y = height - Math.floor((point.y - (originY - (cellsize / 2))) / cellsize) - 1;
                        if (x >= 0 - clickDeltaX && x < width + clickDeltaX && y >= 0 - clickDeltaY && y < height + clickDeltaY) {
                            // try to cull double click handlers with buffer zones by making the generic handler less sensitive at the edges
                            if ( (bufferwidth === 0) || ( (point.x >= originX) && (point.x <= maxX) && (point.y >= originY) && (point.y <= maxY) ) ) {
                                this.options.boardClick!(y, x, "");
                            }
                        }
                    });
                }
                this.rootSvg.click(genericCatcher);
            } else {
                const tile = this.rootSvg.defs().rect(this.cellsize, this.cellsize).fill(this.options.colourContext.background).opacity(0).id("_clickCatcher");
                for (let row = 0; row < grid.length; row++) {
                    for (let col = 0; col < grid[row].length; col++) {
                        if (graph.hasNode([col, row])) {
                            const {x, y} = grid[row][col];
                            const t = tiles.use(tile).dmove(x - (cellsize / 2), y - (cellsize / 2));
                            t.click(() => this.options.boardClick!(row, col, ""));
                        }
                    }
                }
            }
        }

        // If square `vertex` board, not tiled, and no blocked cells, consider adding star points
        if (style === "vertex" && width === height && tileSpace === 0 && blocked === undefined && (this.json.options === undefined || !this.json.options.includes("hide-star-points"))) {
            const pts = calcStarPoints(width);
            pts.forEach((p) => {
                const pt = grid[p[0]][p[1]];
                gridlines.circle(baseStroke * 7.5)
                    .attr({ 'pointer-events': 'none' })
                    .fill(baseColour)
                    .opacity(baseOpacity)
                    .stroke({width: 0})
                    .center(pt.x, pt.y);
            });
            // add ghost points
            const total = Math.ceil(width / 6)**2;
            for (let i = 0; i < total - pts.length; i++) {
                gridlines.circle(baseStroke * 7.5)
                    .id(`aprender-ghost-star-${i+1}`)
                    .attr({ 'pointer-events': 'none' })
                    .fill(baseColour)
                    .opacity(0)
                    .stroke({width: 0})
                    .center(0,0);
            }
        }

        this.markBoard({svgGroup: gridlines, preGridLines: false, grid});

        return grid;
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates rectangular boards of square cells with double labels,
     * for 3d ball stacking. This skips things like buffers and tiling, and even polys.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected squaresStacked(): GridPoints {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("width" in this.json.board)) || (! ("height" in this.json.board)) || (this.json.board.width === undefined) || (this.json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        if ( (! ("style" in this.json.board)) || (this.json.board.style === undefined) ) {
            throw new Error("This function requires that a board style be defined.");
        }
        const width: number = this.json.board.width;
        const height: number = this.json.board.height;
        const cellsize = this.cellsize;

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

        // Get a grid of points
        const grid = rectOfRects({gridHeight: height, gridWidth: width, cellSize: cellsize, tileHeight: 0, tileWidth: 0, tileSpacing: 0});

        const board = this.rootSvg.group().id("board");

        // Make an expanded grid for markers, to accommodate edge marking and shading
        // Add one row and one column and shift all points up and to the left by half a cell size
        let gridExpanded = rectOfRects({gridHeight: height + 1, gridWidth: width + 1, cellSize: cellsize});
        gridExpanded = gridExpanded.map((row) => row.map((cell) => ({x: cell.x - (cellsize / 2), y: cell.y - (cellsize / 2)} as IPoint)));

        // define "tiles" earlier so clickable gridlines are viable
        const tiles = board.group().id("tiles");
        const gridlines = board.group().id("gridlines");
        this.markBoard({svgGroup: gridlines, preGridLines: true, grid, gridExpanded});

        // Add board labels
        let labelColour = this.options.colourContext.labels;
        if ( ("labelColour" in this.json.board) && (this.json.board.labelColour !== undefined) ) {
            labelColour = this.json.board.labelColour;
        }
        let labelOpacity = 1;
        if ( ("labelOpacity" in this.json.board) && (this.json.board.labelOpacity !== undefined) ) {
            labelOpacity = this.json.board.labelOpacity;
        }
        if ( (! this.json.options) || (! this.json.options.includes("hide-labels") ) ) {
            let hideHalf = false;
            if (this.json.options?.includes("hide-labels-half")) {
                hideHalf = true;
            }
            const labels = board.group().id("labels");
            let customLabels: string[]|undefined;
            if ( ("columnLabels" in this.json.board) && (this.json.board.columnLabels !== undefined) ) {
                customLabels = this.json.board.columnLabels;
            }
            let columnLabels = this.getLabels(customLabels, (width * 2) - 1);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-letters")) ) {
                columnLabels.reverse();
            }

            let rowLabels = this.getRowLabels(this.json.board.rowLabels, (height * 2) - 1);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-numbers")) ) {
                rowLabels.reverse();
            }

            if (this.json.options?.includes("swap-labels")) {
                const scratch = [...columnLabels];
                columnLabels = [...rowLabels];
                columnLabels.reverse();
                rowLabels = [...scratch];
                rowLabels.reverse();
            }
            const half = cellsize / 2;
            // Columns (letters)
            for (let col = 0; col < (width * 2) - 1; col++) {
                let pointTop: IPoint;
                let pointBottom: IPoint;
                const realcol = Math.floor(col / 2);
                let opacity = labelOpacity;
                if (col % 2 !== 0) {
                    opacity *= 0.5;
                }
                if (col % 2 === 0) {
                    pointTop = {x: grid[0][realcol].x, y: grid[0][realcol].y - cellsize};
                    pointBottom = {x: grid[height - 1][realcol].x, y: grid[height - 1][realcol].y + cellsize};
                } else {
                    pointTop = {x: grid[0][realcol].x+half, y: grid[0][realcol].y - cellsize};
                    pointBottom = {x: grid[height - 1][realcol].x+half, y: grid[height - 1][realcol].y + cellsize};
                }
                if (! hideHalf) {
                    labels.text(columnLabels[col]).fill(labelColour).opacity(opacity).center(pointTop.x, pointTop.y);
                }
                labels.text(columnLabels[col]).fill(labelColour).opacity(opacity).center(pointBottom.x, pointBottom.y);
            }

            // Rows (numbers)
            for (let row = 0; row < (height * 2) - 1; row++) {
                let pointL: IPoint;
                let pointR: IPoint;
                const realrow = Math.floor(row / 2);
                let opacity = labelOpacity;
                if (row % 2 !== 0) {
                    opacity *= 0.5;
                }
                if (row % 2 === 0) {
                    pointL = {x: grid[realrow][0].x - cellsize, y: grid[realrow][0].y};
                    pointR = {x: grid[realrow][width - 1].x + cellsize, y: grid[realrow][width - 1].y};
                } else {
                    pointL = {x: grid[realrow][0].x - cellsize, y: grid[realrow][0].y+half};
                    pointR = {x: grid[realrow][width - 1].x + cellsize, y: grid[realrow][width - 1].y+half};
                }
                labels.text(rowLabels[row]).fill(labelColour).opacity(opacity).center(pointL.x, pointL.y);
                if (! hideHalf) {
                    labels.text(rowLabels[row]).fill(labelColour).opacity(opacity).center(pointR.x, pointR.y);
                }
            }
        }

        // Load circle tile
        const tile = this.rootSvg.defs().symbol().id("tile-circle").viewbox(0, 0, cellsize, cellsize);
        tile.circle(cellsize*0.75)
            .center(cellsize/2, cellsize/2)
            .fill({color: this.options.colourContext.background, opacity: 0})
            .stroke({width: 1, opacity: baseOpacity * 0.15, color: baseColour});

        // Place them
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const {x, y} = grid[row][col];
                tiles.use(tile).size(cellsize, cellsize).center(x, y);
            }
        }

        // Draw grid lines
        // Horizontal, top of each row, then bottom line after loop
        const idxLeft = 0;
        const idxRight = width - 1;
        for (let row = 0; row < height; row++) {
            if ( (this.json.options) && (this.json.options.includes("no-border")) ) {
                if ( (row === 0) || (row === height - 1) ) {
                    continue;
                }
            }
            if (row === 0) {
                const thisStroke = baseStroke;
                const x1 = grid[row][idxLeft].x - (cellsize / 2);
                const y1 = grid[row][idxLeft].y - (cellsize / 2);
                const x2 = grid[row][idxRight].x + (cellsize / 2);
                const y2 = grid[row][idxRight].y - (cellsize / 2);
                gridlines.line(x1, y1, x2, y2).stroke({width: thisStroke, color: baseColour, opacity: baseOpacity * 0.15, linecap: "round", linejoin: "round"});
            }

            if (row === height - 1) {
                const lastx1 = grid[row][idxLeft].x - (cellsize / 2);
                const lasty1 = grid[row][idxLeft].y + (cellsize / 2);
                const lastx2 = grid[row][idxRight].x + (cellsize / 2);
                const lasty2 = grid[row][idxRight].y + (cellsize / 2);
                gridlines.line(lastx1, lasty1, lastx2, lasty2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity * 0.15, linecap: "round", linejoin: "round"});
            }
        }

        // Vertical, left of each column, then right line after loop
        const idxTop = 0;
        const idxBottom = height - 1;
        for (let col = 0; col < width; col++) {
            if ( (this.json.options) && (this.json.options.includes("no-border")) ) {
                if ( (col === 0) || (col === width - 1) ) {
                    continue;
                }
            }

            if (col === 0) {
                const thisStroke = baseStroke;
                const x1 = grid[idxTop][col].x - (cellsize / 2);
                const y1 = grid[idxTop][col].y - (cellsize / 2);
                const x2 = grid[idxBottom][col].x - (cellsize / 2);
                const y2 = grid[idxBottom][col].y + (cellsize / 2);
                gridlines.line(x1, y1, x2, y2).stroke({width: thisStroke, color: baseColour, opacity: baseOpacity * 0.15, linecap: "round", linejoin: "round"});
            }

            if (col === width - 1) {
                const lastx1 = grid[idxTop][col].x + (cellsize / 2);
                const lasty1 = grid[idxTop][col].y - (cellsize / 2);
                const lastx2 = grid[idxBottom][col].x + (cellsize / 2);
                const lasty2 = grid[idxBottom][col].y + (cellsize / 2);
                gridlines.line(lastx1, lasty1, lastx2, lasty2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity * 0.15, linecap: "round", linejoin: "round"});
            }
        }

        if (this.options.boardClick !== undefined) {
            const rotation = this.getRotation();
            const centre = this.getBoardCentre();
            const originX = grid[0][0].x;
            const originY = grid[0][0].y;
            const clickDeltaX = (this.json.board.clickDeltaX ?? 0);
            const clickDeltaY = (this.json.board.clickDeltaX ?? 0);
            const root = this.rootSvg;
            const realwidth = (width * 2) - 1;
            const realheight = (height * 2) - 1;
            const realsize = cellsize / 2;
            const genericCatcher = ((e: { clientX: number; clientY: number; }) => {
                const point = rotatePoint(root.point(e.clientX, e.clientY), rotation*-1, centre);
                const x = Math.floor((point.x - (originX - (realsize / 2))) / realsize);
                const y = Math.floor((point.y - (originY - (realsize / 2))) / realsize);
                if (x >= 0 - clickDeltaX && x < realwidth + clickDeltaX && y >= 0 - clickDeltaY && y < realheight + clickDeltaY) {
                    this.options.boardClick!(y, x, "");
                }
            });
            this.rootSvg.click(genericCatcher);
        }

        this.markBoard({svgGroup: gridlines, preGridLines: false, grid, gridExpanded});

        return grid;
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates rectangular fields of hexes in various orientations.
     * It relies on a third-party library to do the heavy lifting.
     *
     * @returns A map of row/column locations to x,y coordinate
     */
    protected rectOfHex(): [GridPoints, IPolyPolygon[][]] {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("width" in this.json.board)) || (! ("height" in this.json.board)) || (this.json.board.width === undefined) || (this.json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        if ( (! ("style" in this.json.board)) || (this.json.board.style === undefined) ) {
            throw new Error("This function requires that a board style be defined.");
        }
        const width: number = this.json.board.width;
        const height: number = this.json.board.height;
        const cellsize = this.cellsize * 0.8;
        const style = this.json.board.style;

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
        let clickEdges = false;
        if ( (this.json.options !== undefined) && (this.json.options.includes("clickable-edges")) ) {
            clickEdges = (this.options.boardClick !== undefined);
        }

        // Get a grid of points
        let orientation = Orientation.POINTY;
        if (style.endsWith("f")) {
            orientation = Orientation.FLAT;
        }
        const edges = edges2corners.get(orientation)!;
        let offset: HexOffset = -1;
        if (style.includes("-even")) {
            offset = 1;
        }

        // eslint-disable-next-line @typescript-eslint/naming-convention
        const myHex = defineHex({
            offset,
            orientation,
            dimensions: cellsize,
        });
        const grid = new Grid(myHex, rectangle({width, height}));
        const board = this.rootSvg.group().id("board");
        const gridPoints: GridPoints = [];
        // const {x: cx, y: cy} = grid.getHex({col: 0, row: 0})!.center;
        const polys: IPolyPolygon[][] = [];
        for (let y = 0; y < height; y++) {
            const rowPolys: IPolyPolygon[] = [];
            const node: IPoint[] = [];
            for (let x = 0; x < width; x++) {
                const hex = grid.getHex({col: x, row: y});
                if (hex === undefined) {
                    throw new Error();
                }
                // const pt = hex.toPoint();
                // node.push({x: hex.x + cx, y: hex.y + cy} as IPoint);
                node.push({x: hex.x, y: hex.y} as IPoint);
                rowPolys.push({
                    type: "poly",
                    points: hex.corners
                });
            }
            gridPoints.push(node);
            polys.push(rowPolys);
        }

        this.markBoard({svgGroup: board, preGridLines: true, grid: gridPoints, hexGrid: grid, hexWidth: width, hexHeight: height, polys});

        const corners = grid.getHex({col: 0, row: 0})!.corners;
        const vbx = Math.min(...corners.map(pt => pt.x));
        const vby = Math.min(...corners.map(pt => pt.y));
        const vbWidth = Math.max(...corners.map(pt => pt.x)) - vbx;
        const vbHeight = Math.max(...corners.map(pt => pt.y)) - vby;
        // const hexSymbol = this.rootSvg.defs().symbol().id("hex-symbol")
        //     .polygon(corners.map(({ x, y }) => `${x},${y}`).join(" "))
        //     .fill({color: "white", opacity: 0}).id("hex-symbol-poly");
        const hexSymbol = this.rootSvg.defs().symbol().id("hex-symbol").viewbox(vbx, vby, vbWidth, vbHeight);
        const symbolPoly = hexSymbol.polygon(corners.map(({ x, y }) => `${x},${y}`).join(" "))
                            .fill({color: "white", opacity: 0}).id("hex-symbol-poly");
        if (! clickEdges) {
            symbolPoly.stroke({ width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round" });
        }

        type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
        let blocked: Blocked|undefined;
        if ( (this.json.board.blocked !== undefined) && (this.json.board.blocked !== null) && (Array.isArray(this.json.board.blocked)) && (this.json.board.blocked.length > 0) ){
            blocked = [...(this.json.board.blocked as Blocked)];
        }

        const cells = board.group().id("cells");
        const labels = board.group().id("labels");
        let labelStyle: "internal"|"external" = "internal";
        if ("labelStyle" in this.json.board && this.json.board.labelStyle !== undefined && this.json.board.labelStyle !== null) {
            labelStyle = this.json.board.labelStyle;
        }
        const fontSize = this.cellsize / 5;
        const seenEdges = new Set<string>();
        let customLabels: string[]|undefined;
        if ( ("columnLabels" in this.json.board) && (this.json.board.columnLabels !== undefined) ) {
            customLabels = this.json.board.columnLabels;
        }
        let rowLabels = this.getLabels(customLabels, height);
        rowLabels.reverse();
        if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-letters")) ) {
            rowLabels.reverse();
        }

        let columnLabels = this.getRowLabels(this.json.board.rowLabels, width);
        columnLabels.reverse();
        if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-numbers")) ) {
            columnLabels.reverse();
        }

        if (this.json.options?.includes("swap-labels")) {
            const scratch = [...columnLabels];
            columnLabels = [...rowLabels];
            columnLabels.reverse();
            rowLabels = [...scratch];
            rowLabels.reverse();
        }

        let labelColour = this.options.colourContext.labels;
        if ( ("labelColour" in this.json.board) && (this.json.board.labelColour !== undefined) ) {
            labelColour = this.json.board.labelColour;
        }
        let labelOpacity = 1;
        if ( ("labelOpacity" in this.json.board) && (this.json.board.labelOpacity !== undefined) ) {
            labelOpacity = this.json.board.labelOpacity;
        }
        const rotation = this.getRotation();
        for (const hex of grid) {
            // don't draw "blocked" hexes
            if (blocked !== undefined) {
                const found = blocked.find(e => e.row === hex.row && e.col === hex.col);
                if (found !== undefined) {
                    continue;
                }
            }
            const { x, y } = hex;
            const used = cells.use(symbolPoly).size(cellsize, cellsize).translate(x, y);
            if ( ( (! this.json.options) || (! this.json.options.includes("hide-labels") ) ) && (labelStyle === "internal") ) {
                const components: string[] = [];
                components.push(columnLabels[hex.col]);
                components.push(rowLabels[hex.row]);
                if (/^\d+$/.test(components[0])) {
                    components.reverse();
                }
                const label = components.join("");

                let labelX = corners[5].x;
                let labelY = corners[5].y;
                const transX = x;
                let transY = y + fontSize;
                if (rotation > 90 && rotation < 270) {
                    labelX = corners[2].x;
                    labelY = corners[2].y;
                    transY = y - fontSize;
                }
                if (style.endsWith("f")) {
                    labelX = (corners[5].x + corners[0].x) / 2;
                    labelY = (corners[5].y + corners[0].y) / 2;
                    transY = y + (fontSize / 2);
                    if (rotation > 90 && rotation < 270) {
                        labelX = (corners[3].x + corners[2].x) / 2;
                        labelY = (corners[3].y + corners[2].y) / 2;
                        transY = y - (fontSize / 2);
                    }
                }
                labels.text(label)
                .font({
                    anchor: "middle",
                    fill: labelColour,
                    size: fontSize,
                    opacity: labelOpacity,
                })
                // .center(cx, cy);
                .center(labelX, labelY)
                .translate(transX, transY);
            }
            if (this.options.boardClick !== undefined) {
                used.click(() => this.options.boardClick!(hex.row, hex.col, ""));
            }
        }

        // external labels, if requested
        // Add board labels
        if (labelStyle === "external") {
            let hideHalf = false;
            if (this.json.options?.includes("hide-labels-half")) {
                hideHalf = true;
            }
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;
            polys.flat().forEach(hex => {
                hex.points.forEach(({x,y}) => {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                });
            });

            // Columns
            // if flat, columns are straight lines
            // if pointy, place at minimum of first and second row centre points
            for (let col = 0; col < width; col++) {
                const hex = polys[0][col];
                const {x: cx} = centroid(hex.points)!;
                let pointTop: IPoint;
                let pointBottom: IPoint;
                if (style.endsWith("-f")) {
                    pointTop = {x: cx, y: minY - (cellsize * 0.5)};
                    pointBottom = {x: cx, y: maxY + (cellsize * 0.5)};
                } else {
                    if (style.includes("-even")) {
                        pointTop = {x: cx - (cellsize * 1), y: minY - (cellsize * 0.5)};
                        pointBottom = {x: cx - (cellsize * 1), y: maxY + (cellsize * 0.5)};
                    } else {
                        pointTop = {x: cx, y: minY - (cellsize * 0.5)};
                        pointBottom = {x: cx, y: maxY + (cellsize * 0.5)};
                    }
                }
                if (! hideHalf) {
                    labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
                }
                labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
            }

            // Rows
            // if pointy, rows are straight lines
            // if flat, place at minimum of first and second row centre points
            for (let row = 0; row < height; row++) {
                const hex = polys[row][0];
                const {y: cy} = centroid(hex.points)!;
                let pointL: IPoint;
                let pointR: IPoint;
                if (style.endsWith("-p")) {
                    pointL = {x: minX - (cellsize * 0.5), y: cy};
                    pointR = {x: maxX + (cellsize * 0.5), y: cy};
                } else {
                    if (style.includes("-even")) {
                        pointL = {x: minX - (cellsize * 0.5), y: cy};
                        pointR = {x: maxX + (cellsize * 0.5), y: cy};
                    } else {
                        pointL = {x: minX - (cellsize * 0.5), y: cy};
                        pointR = {x: maxX + (cellsize * 0.5), y: cy};
                    }
                }
                labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
                if (! hideHalf) {
                    labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
                }
            }
        }

        if (clickEdges) {
            const gEdges = board.group().id("edges").insertBefore(labels);
            for (const hex of grid) {
                // add clickable edges
                // don't draw "blocked" hexes
                if (blocked !== undefined) {
                    const found = blocked.find(e => e.row === hex.row && e.col === hex.col);
                    if (found !== undefined) {
                        continue;
                    }
                }
                const { x, y } = hex;
                for (const edge of edges) {
                    const [idx1, idx2] = edge.corners;
                    const {x: x1, y: y1} = corners[idx1];
                    const {x: x2, y: y2} = corners[idx2];
                    const vid = pts2id([x1+x,y1+y],[x2+x,y2+y]);
                    if (seenEdges.has(vid)) {
                        continue;
                    }
                    seenEdges.add(vid);
                    const edgeLine = gEdges.line(x1, y1, x2, y2).stroke({ width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round" }).translate(x,y);
                    edgeLine.click(() => this.options.boardClick!(hex.row, hex.col, edge.dir));
                }
            }
        }

        this.markBoard({svgGroup: board, preGridLines: false, grid: gridPoints, hexGrid: grid, hexWidth: width, hexHeight: height, polys});

        return [gridPoints, polys];
    }

    /**
     * This is a specialized subset of the rectOfHex function, specifically:
     * `hex-even-p` configuration with external, swapped labels and reversed numbers
     * multiplied by three, in different colours. It was simpler than trying to generalize.
     * It relies on a third-party library to do the heavy lifting.
     *
     * @returns A map of row/column locations to x,y coordinate
     */
    protected stackingTriangles(): {points: GridPoints, polys: Poly[][]} {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("width" in this.json.board)) || (! ("height" in this.json.board)) || (this.json.board.width === undefined) || (this.json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        if ( (! ("style" in this.json.board)) || (this.json.board.style === undefined) ) {
            throw new Error("This function requires that a board style be defined.");
        }
        const width: number = this.json.board.width;
        const height: number = this.json.board.height;
        const cellsize = this.cellsize * 0.8;

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
        let clickEdges = false;
        if ( (this.json.options !== undefined) && (this.json.options.includes("clickable-edges")) ) {
            clickEdges = (this.options.boardClick !== undefined);
        }

        // Get a grid of points
        const orientation = Orientation.POINTY;
        const edges = edges2corners.get(orientation)!;
        const offset: HexOffset = 1;

        // eslint-disable-next-line @typescript-eslint/naming-convention
        const myHex = defineHex({
            offset,
            orientation,
            dimensions: cellsize,
        });
        const grid = new Grid(myHex, rectangle({width, height}));
        const board = this.rootSvg.group().id("board");
        const gridPoints: GridPoints = [];
        // const {x: cx, y: cy} = grid.getHex({col: 0, row: 0})!.center;
        const polys: Poly[][] = [];
        for (let y = 0; y < height; y++) {
            const rowPolys: Poly[] = [];
            const node: IPoint[] = [];
            for (let x = 0; x < width; x++) {
                const hex = grid.getHex({col: x, row: y});
                if (hex === undefined) {
                    throw new Error();
                }
                // const pt = hex.toPoint();
                // node.push({x: hex.x + cx, y: hex.y + cy} as IPoint);
                node.push({x: hex.x, y: hex.y} as IPoint);
                rowPolys.push({
                    type: "poly",
                    points: hex.corners
                });
            }
            gridPoints.push(node);
            polys.push(rowPolys);
        }

        this.markBoard({svgGroup: board, preGridLines: true, grid: gridPoints, hexGrid: grid, hexWidth: width, hexHeight: height, polys});

        const corners = grid.getHex({col: 0, row: 0})!.corners;
        const vbx = Math.min(...corners.map(pt => pt.x));
        const vby = Math.min(...corners.map(pt => pt.y));
        const vbWidth = Math.max(...corners.map(pt => pt.x)) - vbx;
        const vbHeight = Math.max(...corners.map(pt => pt.y)) - vby;
        // const hexSymbol = this.rootSvg.defs().symbol().id("hex-symbol")
        //     .polygon(corners.map(({ x, y }) => `${x},${y}`).join(" "))
        //     .fill({color: "white", opacity: 0}).id("hex-symbol-poly");
        const hexSymbol = this.rootSvg.defs().symbol().id("hex-symbol").viewbox(vbx, vby, vbWidth, vbHeight);
        const symbolPoly = hexSymbol.polygon(corners.map(({ x, y }) => `${x},${y}`).join(" "))
                            .fill({color: "white", opacity: 0}).id("hex-symbol-poly");
        if (! clickEdges) {
            symbolPoly.stroke({ width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round" });
        }

        type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
        let blocked: Blocked|undefined;
        if ( (this.json.board.blocked !== undefined) && (this.json.board.blocked !== null) && (Array.isArray(this.json.board.blocked)) && (this.json.board.blocked.length > 0) ){
            blocked = [...(this.json.board.blocked as Blocked)];
        }

        const labels = board.group().id("labels");
        const seenEdges = new Set<string>();
        let customLabels: string[]|undefined;
        if ( ("columnLabels" in this.json.board) && (this.json.board.columnLabels !== undefined) ) {
            customLabels = this.json.board.columnLabels;
        }
        const columnLabels = this.getLabels(customLabels, width * 2);

        const rowLabels = this.getRowLabels(this.json.board.rowLabels, height * 3);
        rowLabels.reverse();

        let labelColour = this.options.colourContext.labels;
        if ( ("labelColour" in this.json.board) && (this.json.board.labelColour !== undefined) ) {
            labelColour = this.json.board.labelColour;
        }
        let labelOpacity = 1;
        if ( ("labelOpacity" in this.json.board) && (this.json.board.labelOpacity !== undefined) ) {
            labelOpacity = this.json.board.labelOpacity;
        }
        for (const hex of grid) {
            // don't draw "blocked" hexes
            if (blocked !== undefined) {
                const found = blocked.find(e => e.row === hex.row && e.col === hex.col);
                if (found !== undefined) {
                    continue;
                }
            }
            const { x, y } = hex;
            const used = board.use(symbolPoly).size(cellsize, cellsize).translate(x, y);
            if (this.options.boardClick !== undefined) {
                used.click(() => this.options.boardClick!(hex.row, hex.col, ""));
            }
        }

        // Add board labels
        let hideHalf = false;
        if (this.json.options?.includes("hide-labels-half")) {
            hideHalf = true;
        }
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        (polys.flat() as IPolyPolygon[]).forEach(hex => {
            hex.points.forEach(({x,y}) => {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            });
        });

        // Columns
        for (let col = 0; col < width; col++) {
            let skipped: string[] = [];
            if ( ("skipLabels" in this.json.board) && (this.json.board.skipLabels !== undefined) ) {
                skipped = this.json.board.skipLabels as string[];
            }
            const hex = polys[0][col] as IPolyPolygon;
            const {x: cx} = centroid(hex.points)!;
            for (let inc = 0; inc < 2; inc++) {
                const label = columnLabels[(col * 2) + inc]
                let pointTop: IPoint;
                let pointBottom: IPoint;
                if (inc === 0) {
                    pointTop = {x: hex.points[4].x, y: minY - (cellsize * 0.5)};
                    pointBottom = {x: hex.points[4].x, y: maxY + (cellsize * 0.5)};
                } else {
                    pointTop = {x: cx, y: minY - (cellsize * 0.5)};
                    pointBottom = {x: cx, y: maxY + (cellsize * 0.5)};
                }
                if (! skipped.includes(label)) {
                    if (! hideHalf) {
                        labels.text(label).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
                    }
                    labels.text(label).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
                }
            }
        }

        // Rows
        // rows are straight lines
        for (let row = 0; row < height; row++) {
            const hex = polys[row][0] as IPolyPolygon;
            const {y: cy} = centroid(hex.points)!;
            let localOpacity = labelOpacity;
            for (let inc = 0; inc < 3; inc++) {
                let pointL: IPoint;
                let pointR: IPoint;
                switch (inc) {
                    case 0:
                        pointL = {x: minX - (cellsize * 0.5), y: cy};
                        pointR = {x: maxX + (cellsize * 0.5), y: cy};
                        break;
                    case 1:
                        pointL = {x: minX - (cellsize * 0.5), y: hex.points[1].y};
                        pointR = {x: maxX + (cellsize * 0.5), y: hex.points[1].y};
                        localOpacity *= 0.66;
                        break;
                    case 2:
                        pointL = {x: minX - (cellsize * 0.5), y: hex.points[2].y};
                        pointR = {x: maxX + (cellsize * 0.5), y: hex.points[2].y};
                        localOpacity *= 0.33;
                        break;
                    default:
                        throw new Error(`Invalid increment`);
                }
                const label = rowLabels[(row * 3) + inc];
                labels.text(label).fill(labelColour).opacity(localOpacity).center(pointL.x, pointL.y);
                if (! hideHalf) {
                    labels.text(label).fill(labelColour).opacity(localOpacity).center(pointR.x, pointR.y);
                }
            }
        }

        if (clickEdges) {
            for (const hex of grid) {
                // add clickable edges
                // don't draw "blocked" hexes
                if (blocked !== undefined) {
                    const found = blocked.find(e => e.row === hex.row && e.col === hex.col);
                    if (found !== undefined) {
                        continue;
                    }
                }
                const { x, y } = hex;
                for (const edge of edges) {
                    const [idx1, idx2] = edge.corners;
                    const {x: x1, y: y1} = corners[idx1];
                    const {x: x2, y: y2} = corners[idx2];
                    const vid = pts2id([x1+x,y1+y],[x2+x,y2+y]);
                    if (seenEdges.has(vid)) {
                        continue;
                    }
                    seenEdges.add(vid);
                    const edgeLine = board.line(x1, y1, x2, y2).stroke({ width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round" }).translate(x,y);
                    edgeLine.click(() => this.options.boardClick!(hex.row, hex.col, edge.dir));
                }
            }
        }

        this.markBoard({svgGroup: board, preGridLines: false, grid: gridPoints, hexGrid: grid, hexWidth: width, hexHeight: height, polys});

        return {points: gridPoints, polys};
    }


    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates snubsquare boards, which are a unique configuration where each cells is connected to five others.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected snubSquare(): GridPoints {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("width" in this.json.board)) || (! ("height" in this.json.board)) || (this.json.board.width === undefined) || (this.json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        const width: number = this.json.board.width;
        const height: number = this.json.board.height;
        const cellsize = this.cellsize;

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
        let snubStart: SnubStart = "S";
        if ("snubStart" in this.json.board && this.json.board.snubStart !== undefined) {
            snubStart = this.json.board.snubStart;
        }

        // Get a grid of points
        const grid = snubsquare({gridHeight: height, gridWidth: width, cellSize: cellsize, snubStart});
        const board = this.rootSvg.group().id("board");
        const gridlines = board.group().id("gridlines");

        this.markBoard({svgGroup: gridlines, preGridLines: true, grid});

        // Add board labels
        let labelColour = this.options.colourContext.labels;
        if ( ("labelColour" in this.json.board) && (this.json.board.labelColour !== undefined) ) {
            labelColour = this.json.board.labelColour;
        }
        let labelOpacity = 1;
        if ( ("labelOpacity" in this.json.board) && (this.json.board.labelOpacity !== undefined) ) {
            labelOpacity = this.json.board.labelOpacity;
        }
        if ( (! this.json.options) || (! this.json.options.includes("hide-labels") ) ) {
            const minx = Math.min(...grid.flat().map(pt => pt.x));
            const maxx = Math.max(...grid.flat().map(pt => pt.x));
            const miny = Math.min(...grid.flat().map(pt => pt.y));
            const maxy = Math.max(...grid.flat().map(pt => pt.y));

            let hideHalf = false;
            if (this.json.options?.includes("hide-labels-half")) {
                hideHalf = true;
            }
            const labels = board.group().id("labels");
            let columnLabels = this.getLabels(undefined, width);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-letters")) ) {
                columnLabels.reverse();
            }

            let rowLabels: string[] = [];
            for (let row = 0; row < height; row++) {
                rowLabels.push((height - row).toString());
            }
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-numbers")) ) {
                rowLabels.reverse();
            }

            if (this.json.options?.includes("swap-labels")) {
                const scratch = [...columnLabels];
                columnLabels = [...rowLabels];
                columnLabels.reverse();
                rowLabels = [...scratch];
                rowLabels.reverse();
            }

            const buffer = cellsize * 0.75;
            // Columns (letters)
            for (let col = 0; col < width; col++) {
                const pointTop = {x: grid[0][col].x, y: miny - buffer};
                const pointBottom = {x: grid[height - 1][col].x, y: maxy + buffer};
                if (! hideHalf) {
                    labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
                }
                labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
            }

            // Rows (numbers)
            for (let row = 0; row < height; row++) {
                const pointL = {x: minx - buffer, y: grid[row][0].y};
                const pointR = {x: maxx + buffer, y: grid[row][width - 1].y};
                labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
                if (! hideHalf) {
                    labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
                }
            }
        }

        // Draw grid lines
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const curr = grid[row][col];

                // always connect to previous cell
                if (col > 0) {
                    const prev = grid[row][col - 1];
                    const x1 = curr.x;
                    const y1 = curr.y;
                    const x2 = prev.x;
                    const y2 = prev.y;
                    gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                }

                if (row > 0) {
                    // always connect to cell directly above
                    let prev = grid[row - 1][col];
                    let x1 = curr.x;
                    let y1 = curr.y;
                    let x2 = prev.x;
                    let y2 = prev.y;
                    gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                    if (snubStart === "S") {
                        // even row, odd columns connect as well to previous-above cell
                        if ( ( (row % 2) === 0) && ( (col % 2) !== 0) ) {
                            prev = grid[row - 1][col - 1];
                            x1 = curr.x;
                            y1 = curr.y;
                            x2 = prev.x;
                            y2 = prev.y;
                            gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                        // odd row, odd columns connect as well to previous-next cell
                        } else if ( ((row % 2) !== 0) && ((col % 2) !== 0) && (col < (width - 1)) ) {
                            prev = grid[row - 1][col + 1];
                            x1 = curr.x;
                            y1 = curr.y;
                            x2 = prev.x;
                            y2 = prev.y;
                            gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                        }
                    } else {
                        // even row, even columns > 0 connect as well to previous-above cell
                        if ( ( (row % 2) === 0) && ( (col % 2) === 0) && col > 0 ) {
                            prev = grid[row - 1][col - 1];
                            x1 = curr.x;
                            y1 = curr.y;
                            x2 = prev.x;
                            y2 = prev.y;
                            gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                        // odd row, even columns connect as well to previous-next cell
                        } else if ( ((row % 2) !== 0) && ((col % 2) === 0) && (col < (width - 1)) ) {
                            prev = grid[row - 1][col + 1];
                            x1 = curr.x;
                            y1 = curr.y;
                            x2 = prev.x;
                            y2 = prev.y;
                            gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                        }
                    }
                }
            }
        }

        if (this.options.boardClick !== undefined) {
            const rotation = this.getRotation();
            const centre = this.getBoardCentre();
            const root = this.rootSvg;
            const genericCatcher = ((e: { clientX: number; clientY: number; }) => {
                const point = rotatePoint(root.point(e.clientX, e.clientY), rotation*-1, centre);
                let min = Number.MAX_VALUE;
                let row0 = 0;
                let col0 = 0;
                for (let row = 0; row < height; row++) {
                    const currRow = grid[row];
                    for (let col = 0; col < width; col++) {
                        const curr = currRow[col];
                        const dist2 = Math.pow(point.x - curr.x, 2.0) + Math.pow(point.y - curr.y, 2.0);
                        if (dist2 < min) {
                            min = dist2;
                            row0 = row;
                            col0 = col;
                        }
                    }
                }
                this.options.boardClick!(row0, col0, "");
            });
            this.rootSvg.click(genericCatcher);
        }

        this.markBoard({svgGroup: gridlines, preGridLines: false, grid});

        return grid;
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates snubsquare boards, which are a unique configuration where each cells is connected to five others.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected snubSquareCells(): [GridPoints, IPolyPolygon[][]] {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("width" in this.json.board)) || (! ("height" in this.json.board)) || (this.json.board.width === undefined) || (this.json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        const width: number = this.json.board.width;
        const height: number = this.json.board.height;
        const cellsize = this.cellsize;

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
        let snubStart: SnubStart = "S";
        if ("snubStart" in this.json.board && this.json.board.snubStart !== undefined) {
            snubStart = this.json.board.snubStart;
        }

        // Get a grid of points
        const gridOrig = snubsquare({gridHeight: height, gridWidth: width, cellSize: cellsize, snubStart});
        const minx = Math.min(...gridOrig.flat().map(pt => pt.x));
        const maxx = Math.max(...gridOrig.flat().map(pt => pt.x));
        // const miny = Math.min(...grid.flat().map(pt => pt.y));
        // const maxy = Math.max(...grid.flat().map(pt => pt.y));

        // create the polys
        const polys: IPolyPolygon[][] = [];
        for (let row = 0; row < height - 1; row++) {
            const node: IPolyPolygon[] = [];
            for (let col = 0; col < width - 1; col+=2) {
                if (snubStart === "S") {
                    if (row % 2 === 0) {
                        const sqpts = [
                            gridOrig[row][col],
                            gridOrig[row][col+1],
                            gridOrig[row+1][col+1],
                            gridOrig[row+1][col],
                        ];
                        node.push({type: "poly", points: sqpts});
                        if (gridOrig[row][col+1] !== undefined && gridOrig[row][col+2] !== undefined && gridOrig[row+1][col+1] !== undefined) {
                            const t1pts = [
                                gridOrig[row][col+1],
                                gridOrig[row][col+2],
                                gridOrig[row+1][col+1],
                            ];
                            node.push({type: "poly", points: t1pts});
                        }
                        if (gridOrig[row][col+2] !== undefined && gridOrig[row+1][col+2] !== undefined && gridOrig[row+1][col+1] !== undefined) {
                            const t2pts = [
                                gridOrig[row][col+2],
                                gridOrig[row+1][col+2],
                                gridOrig[row+1][col+1],
                            ];
                            node.push({type: "poly", points: t2pts});
                        }
                    } else {
                        const t1pts = [
                            gridOrig[row][col],
                            gridOrig[row+1][col+1],
                            gridOrig[row+1][col],
                        ];
                        node.push({type: "poly", points: t1pts});
                        if (gridOrig[row][col+1] !== undefined && gridOrig[row+1][col+1] !== undefined) {
                            const t2pts = [
                                gridOrig[row][col],
                                gridOrig[row][col+1],
                                gridOrig[row+1][col+1],
                            ];
                            node.push({type: "poly", points: t2pts});
                        }
                        if (gridOrig[row][col+1] !== undefined && gridOrig[row][col+2] !== undefined && gridOrig[row+1][col+1] !== undefined && gridOrig[row+1][col+2] !== undefined) {
                            const sqpts = [
                                gridOrig[row][col+1],
                                gridOrig[row][col+2],
                                gridOrig[row+1][col+2],
                                gridOrig[row+1][col+1],
                            ];
                            node.push({type: "poly", points: sqpts});
                        }
                    }
                }
                else {
                    if (row % 2 !== 0) {
                        const sqpts = [
                            gridOrig[row][col],
                            gridOrig[row][col+1],
                            gridOrig[row+1][col+1],
                            gridOrig[row+1][col],
                        ];
                        node.push({type: "poly", points: sqpts});
                        if (gridOrig[row][col+1] !== undefined && gridOrig[row+1][col+1] !== undefined && gridOrig[row+1][col+2] !== undefined) {
                            const t1pts = [
                                gridOrig[row][col+1],
                                gridOrig[row+1][col+1],
                                gridOrig[row+1][col+2],
                            ];
                            node.push({type: "poly", points: t1pts});
                        }
                        if (gridOrig[row][col+1] !== undefined && gridOrig[row][col+2] !== undefined && gridOrig[row+1][col+2] !== undefined) {
                            const t2pts = [
                                gridOrig[row][col+1],
                                gridOrig[row][col+2],
                                gridOrig[row+1][col+2],
                            ];
                            node.push({type: "poly", points: t2pts});
                        }
                    } else {
                        const t1pts = [
                            gridOrig[row][col],
                            gridOrig[row][col+1],
                            gridOrig[row+1][col],
                        ];
                        node.push({type: "poly", points: t1pts});
                        if (gridOrig[row][col+1] !== undefined && gridOrig[row+1][col] !== undefined && gridOrig[row+1][col+1] !== undefined) {
                            const t2pts = [
                                gridOrig[row][col+1],
                                gridOrig[row+1][col],
                                gridOrig[row+1][col+1],
                            ];
                            node.push({type: "poly", points: t2pts});
                        }
                        if (gridOrig[row][col+1] !== undefined && gridOrig[row][col+2] !== undefined && gridOrig[row+1][col+1] !== undefined && gridOrig[row+1][col+2] !== undefined) {
                            const sqpts = [
                                gridOrig[row][col+1],
                                gridOrig[row][col+2],
                                gridOrig[row+1][col+2],
                                gridOrig[row+1][col+1],
                            ];
                            node.push({type: "poly", points: sqpts});
                        }
                    }
                }
            }
            polys.push(node);
        }
        const grid = polys.map(row => row.map(poly => centroid(poly.points)!));

        // Start building the SVG
        const board = this.rootSvg.group().id("board");
        const gridlines = board.group().id("gridlines");

        this.markBoard({svgGroup: gridlines, preGridLines: true, grid, polys, gridExpanded: gridOrig});

        // Add board labels
        let labelColour = this.options.colourContext.labels;
        if ( ("labelColour" in this.json.board) && (this.json.board.labelColour !== undefined) ) {
            labelColour = this.json.board.labelColour;
        }
        let labelOpacity = 1;
        if ( ("labelOpacity" in this.json.board) && (this.json.board.labelOpacity !== undefined) ) {
            labelOpacity = this.json.board.labelOpacity;
        }
        if ( (! this.json.options) || (! this.json.options.includes("hide-labels") ) ) {
            const labels = board.group().id("labels");
            const columnLabels = this.getLabels(undefined, polys.length);
            if ( (this.json.options === undefined) || (!this.json.options.includes("reverse-numbers")) ) {
                columnLabels.reverse();
            }

            const buffer = cellsize * 0.25;
            // Rows (combined labels)
            for (let row = 0; row < grid.length; row++) {
                const pointL = {x: minx - buffer, y: grid[row][0].y};
                const pointR = {x: maxx + buffer, y: grid[row][grid[row].length - 1].y};
                labels.text(columnLabels[row] + "1").fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
                labels.text(columnLabels[row] + polys[row].length.toString()).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
            }
        }

        // Draw grid lines
        type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
        let blocked: Blocked|undefined;
        this.json.board = this.json.board as BoardBasic;
        if ( (this.json.board.blocked !== undefined) && (this.json.board.blocked !== null)  && (Array.isArray(this.json.board.blocked)) && (this.json.board.blocked.length > 0) ){
            blocked = [...(this.json.board.blocked as Blocked)];
        }
        for (let row = 0; row < polys.length; row++) {
            for (let col = 0; col < polys[row].length; col++) {
                const isBlocked = blocked?.find(e => e.row === row && e.col === col) !== undefined;
                if (!isBlocked) {
                    const poly = polys[row][col];
                    const instance = gridlines.polygon([...poly.points, poly.points[0]].map(pt => `${pt.x},${pt.y}`).join(" ")).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"}).fill({color: "white", opacity: 0});
                    if (this.options.boardClick !== undefined) {
                        instance.click(() => this.options.boardClick!(row, col, ""))
                    }
                }
            }
        }

        this.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys, gridExpanded: gridOrig});

        return [grid, polys];
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates snubsquare boards with a space at the midpoints of squares.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected onyx(): GridPoints {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("width" in this.json.board)) || (! ("height" in this.json.board)) || (this.json.board.width === undefined) || (this.json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        const width: number = this.json.board.width;
        const height: number = this.json.board.height;
        const cellsize = this.cellsize;

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
        let snubStart: SnubStart = "T";
        if ("snubStart" in this.json.board && this.json.board.snubStart !== undefined) {
            snubStart = this.json.board.snubStart;
        }

        // Get a grid of points
        const gridOrig = snubsquare({gridHeight: height, gridWidth: width, cellSize: cellsize, snubStart});
        // insert midpoint spaces and rows between rows
        const midpts: GridPoints = [];
        for (let row = 0; row < gridOrig.length - 1; row++) {
            const midptNode: IPoint[] = [];
            for (let col = 0; col < gridOrig[row].length; col+=2) {
                const corners: IPoint[] = [];
                if ( (snubStart === "T" && row % 2 === 0) || (snubStart === "S" && row % 2 !== 0) ) {
                    if (col > gridOrig[row].length - 3) { break; }
                    corners.push(
                        gridOrig[row][col+1],
                        gridOrig[row][col+2],
                        gridOrig[row+1][col+1],
                        gridOrig[row+1][col+2]
                    )
                } else {
                    if (col > gridOrig[row].length - 2) { break; }
                    corners.push(
                        gridOrig[row][col],
                        gridOrig[row][col+1],
                        gridOrig[row+1][col],
                        gridOrig[row+1][col+1]
                    )
                }
                midptNode.push(centroid(corners)!);
            }
            midpts.push(midptNode);
        }
        const grid: GridPoints = gridOrig.reduce((prev, curr, idx) => idx === gridOrig.length - 1 ? [...prev, curr] : [...prev, curr, midpts[idx]], [] as GridPoints);

        // start generating the SVG
        const board = this.rootSvg.group().id("board");
        const gridlines = board.group().id("gridlines");

        this.markBoard({svgGroup: gridlines, preGridLines: true, grid});

        // Add board labels
        let labelColour = this.options.colourContext.labels;
        if ( ("labelColour" in this.json.board) && (this.json.board.labelColour !== undefined) ) {
            labelColour = this.json.board.labelColour;
        }
        let labelOpacity = 1;
        if ( ("labelOpacity" in this.json.board) && (this.json.board.labelOpacity !== undefined) ) {
            labelOpacity = this.json.board.labelOpacity;
        }
        if ( (! this.json.options) || (! this.json.options.includes("hide-labels") ) ) {
            const minx = Math.min(...gridOrig.flat().map(pt => pt.x));
            const maxx = Math.max(...gridOrig.flat().map(pt => pt.x));
            const miny = Math.min(...gridOrig.flat().map(pt => pt.y));
            const maxy = Math.max(...gridOrig.flat().map(pt => pt.y));

            let hideHalf = false;
            if (this.json.options?.includes("hide-labels-half")) {
                hideHalf = true;
            }
            const labels = board.group().id("labels");
            let columnLabels = this.getLabels(undefined, width);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-letters")) ) {
                columnLabels.reverse();
            }

            let rowLabels: string[] = [];
            for (let row = 0; row < height; row++) {
                rowLabels.push((height - row).toString());
            }
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-numbers")) ) {
                rowLabels.reverse();
            }

            if (this.json.options?.includes("swap-labels")) {
                const scratch = [...columnLabels];
                columnLabels = [...rowLabels];
                columnLabels.reverse();
                rowLabels = [...scratch];
                rowLabels.reverse();
            }

            const buffer = cellsize * 0.75;
            // Columns (letters)
            for (let col = 0; col < width; col++) {
                const pointTop = {x: gridOrig[0][col].x, y: miny - buffer};
                const pointBottom = {x: gridOrig[height - 1][col].x, y: maxy + buffer};
                if (! hideHalf) {
                    labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
                }
                labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
            }

            // Rows (numbers)
            for (let row = 0; row < height; row++) {
                const pointL = {x: minx - buffer, y: gridOrig[row][0].y};
                const pointR = {x: maxx + buffer, y: gridOrig[row][width - 1].y};
                labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
                if (! hideHalf) {
                    labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
                }
            }
        }

        // Draw basic grid lines first
        for (let row = 0; row < gridOrig.length; row++) {
            for (let col = 0; col < gridOrig[row].length; col++) {
                const curr = gridOrig[row][col];

                // always connect to previous cell
                if (col > 0) {
                    const prev = gridOrig[row][col - 1];
                    const x1 = curr.x;
                    const y1 = curr.y;
                    const x2 = prev.x;
                    const y2 = prev.y;
                    gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                }

                if (row > 0) {
                    // always connect to cell directly above
                    let prev = gridOrig[row - 1][col];
                    let x1 = curr.x;
                    let y1 = curr.y;
                    let x2 = prev.x;
                    let y2 = prev.y;
                    gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                    if (snubStart === "S") {
                        // even row, odd columns connect as well to previous-above cell
                        if ( ( (row % 2) === 0) && ( (col % 2) !== 0) ) {
                            prev = gridOrig[row - 1][col - 1];
                            x1 = curr.x;
                            y1 = curr.y;
                            x2 = prev.x;
                            y2 = prev.y;
                            gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                        // odd row, odd columns connect as well to previous-next cell
                        } else if ( ((row % 2) !== 0) && ((col % 2) !== 0) && (col < (width - 1)) ) {
                            prev = gridOrig[row - 1][col + 1];
                            x1 = curr.x;
                            y1 = curr.y;
                            x2 = prev.x;
                            y2 = prev.y;
                            gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                        }
                    } else {
                        // even row, even columns > 0 connect as well to previous-above cell
                        if ( ( (row % 2) === 0) && ( (col % 2) === 0) && col > 0 ) {
                            prev = gridOrig[row - 1][col - 1];
                            x1 = curr.x;
                            y1 = curr.y;
                            x2 = prev.x;
                            y2 = prev.y;
                            gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                        // odd row, even columns connect as well to previous-next cell
                        } else if ( ((row % 2) !== 0) && ((col % 2) === 0) && (col < (width - 1)) ) {
                            prev = gridOrig[row - 1][col + 1];
                            x1 = curr.x;
                            y1 = curr.y;
                            x2 = prev.x;
                            y2 = prev.y;
                            gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                        }
                    }
                }
            }
        }
        // now add midpoint connections
        for (let row = 0; row < gridOrig.length - 1; row++) {
            for (let col = 0; col < gridOrig[row].length; col+=2) {
                const corners: IPoint[] = [];
                if ( (snubStart === "T" && row % 2 === 0) || (snubStart === "S" && row % 2 !== 0) ) {
                    if (col > gridOrig[row].length - 3) { break; }
                    corners.push(
                        gridOrig[row][col+1],
                        gridOrig[row][col+2],
                        gridOrig[row+1][col+1],
                        gridOrig[row+1][col+2]
                    )
                } else {
                    if (col > gridOrig[row].length - 2) { break; }
                    corners.push(
                        gridOrig[row][col],
                        gridOrig[row][col+1],
                        gridOrig[row+1][col],
                        gridOrig[row+1][col+1]
                    )
                }
                const {x: x1, y: y1} = corners[0];
                const {x: x2, y: y2} = corners[3];
                const {x: x3, y: y3} = corners[1];
                const {x: x4, y: y4} = corners[2];
                gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                gridlines.line(x3, y3, x4, y4).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
            }
        }

        if (this.options.boardClick !== undefined) {
            const rotation = this.getRotation();
            const centre = this.getBoardCentre();
            const root = this.rootSvg;
            const genericCatcher = ((e: { clientX: number; clientY: number; }) => {
                const point = rotatePoint(root.point(e.clientX, e.clientY), rotation*-1, centre);
                let min = Number.MAX_VALUE;
                let row0 = 0;
                let col0 = 0;
                for (let row = 0; row < grid.length; row++) {
                    const currRow = grid[row];
                    for (let col = 0; col < grid[row].length; col++) {
                        const curr = currRow[col];
                        const dist2 = Math.pow(point.x - curr.x, 2.0) + Math.pow(point.y - curr.y, 2.0);
                        if (dist2 < min) {
                            min = dist2;
                            row0 = row;
                            col0 = col;
                        }
                    }
                }
                this.options.boardClick!(row0, col0, "");
            });
            this.rootSvg.click(genericCatcher);
        }

        this.markBoard({svgGroup: gridlines, preGridLines: false, grid});

        return grid;
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates a circular wheel & spoke board.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected wheel(): [GridPoints, Poly[][]] {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("width" in this.json.board)) || (! ("height" in this.json.board)) || (this.json.board.width === undefined) || (this.json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        const width: number = this.json.board.width;
        const height: number = this.json.board.height;
        const cellsize = this.cellsize;

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
        const strokeAttrs: StrokeData = {color: baseColour, width: baseStroke, opacity: baseOpacity, linecap: "round", linejoin: "round"};

        let start = 0;
        if ( ("circular-start" in this.json.board) && (this.json.board["circular-start"] !== undefined) ) {
            start = this.json.board["circular-start"];
        }

        // Get a grid of points
        const args: IWheelArgs = {gridHeight: height, gridWidth: width, cellSize: cellsize, start};
        const grid = wheel(args);
        // interlace empty rows so that poly coordinates line up
        const polys: (IPolyPolygon | IPolyPath)[][] = wheelPolys(args).reduce((prev, curr) => [...prev, curr, []], [[]] as (IPolyPolygon | IPolyPath)[][])
        const board = this.rootSvg.group().id("board");
        const gridlines = board.group().id("gridlines");

        this.markBoard({svgGroup: gridlines, preGridLines: true, grid, polys});

        // Add board labels
        let labelColour = this.options.colourContext.labels;
        if ( ("labelColour" in this.json.board) && (this.json.board.labelColour !== undefined) ) {
            labelColour = this.json.board.labelColour;
        }
        let labelOpacity = 1;
        if ( ("labelOpacity" in this.json.board) && (this.json.board.labelOpacity !== undefined) ) {
            labelOpacity = this.json.board.labelOpacity;
        }
        if ( (! this.json.options) || (! this.json.options.includes("hide-labels") ) ) {
            const labelPts = wheelLabels(args);
            const labels = board.group().id("labels");
            const columnLabels = this.getLabels(undefined, width);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-letters")) ) {
                columnLabels.reverse();
            }

            // Columns (letters)
            for (let col = 0; col < width; col++) {
                const pt = labelPts[col];
                labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pt.x, pt.y);
            }
        }

        // Draw grid lines
        for (const cell of polys.flat()) {
            switch (cell.type) {
                case "poly":
                    gridlines.polygon(cell.points.map(pt => `${pt.x},${pt.y}`).join(" ")).fill({color: "white", opacity: 0}).stroke(strokeAttrs);
                    break;
                case "path":
                    gridlines.path(cell.path).fill({color: "white", opacity: 0}).stroke(strokeAttrs);
                    break;
            }
        }

        if (this.options.boardClick !== undefined) {
            const rotation = this.getRotation();
            const centre = this.getBoardCentre();
            const root = this.rootSvg;
            const genericCatcher = ((e: { clientX: number; clientY: number; }) => {
                const clicked = rotatePoint(root.point(e.clientX, e.clientY), rotation*-1, centre);
                // simply find the point that's closest to the click
                const closest = {
                    dist: Infinity,
                    row: null as (null|number),
                    col: null as (null|number),
                };
                for (let row = 0; row < grid.length; row++) {
                    for (let col = 0; col < grid[row].length; col++) {
                        const pt = grid[row][col];
                        const dist = ptDistance(pt.x, pt.y, clicked.x, clicked.y);
                        if (dist < closest.dist) {
                            closest.dist = dist;
                            closest.row = row;
                            closest.col = col;
                        }
                    }
                }
                if (closest.dist !== Infinity && closest.row !== null && closest.col !== null) {
                    this.options.boardClick!(closest.row, closest.col, "");
                }
            });
            this.rootSvg.click(genericCatcher);
        }

        this.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

        return [grid, polys];
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates a circular cobweb board.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected cobweb(): [GridPoints, Poly[][]] {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("width" in this.json.board)) || (! ("height" in this.json.board)) || (this.json.board.width === undefined) || (this.json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        const width: number = this.json.board.width;
        const height: number = this.json.board.height;
        const cellsize = this.cellsize;
        if (width % 2 !== 0) {
            throw new Error("The number of sections in a cobweb board must be even.");
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
        const strokeAttrs: StrokeData = {color: baseColour, width: baseStroke, opacity: baseOpacity, linecap: "round", linejoin: "round"};

        let start = 0;
        if ( ("circular-start" in this.json.board) && (this.json.board["circular-start"] !== undefined) ) {
            start = this.json.board["circular-start"];
        }

        // Get a grid of points
        const args: ICobwebArgs = {gridHeight: height, gridWidth: width, cellSize: cellsize, start};
        const grid = cobweb(args);
        const polys = cobwebPolys(args);
        const board = this.rootSvg.group().id("board");
        const gridlines = board.group().id("gridlines");

        this.markBoard({svgGroup: gridlines, preGridLines: true, grid, polys});

        // Add board labels
        let labelColour = this.options.colourContext.labels;
        if ( ("labelColour" in this.json.board) && (this.json.board.labelColour !== undefined) ) {
            labelColour = this.json.board.labelColour;
        }
        let labelOpacity = 1;
        if ( ("labelOpacity" in this.json.board) && (this.json.board.labelOpacity !== undefined) ) {
            labelOpacity = this.json.board.labelOpacity;
        }
        if ( (! this.json.options) || (! this.json.options.includes("hide-labels") ) ) {
            const labelPts = cobwebLabels(args);
            const labels = board.group().id("labels");
            const columnLabels = this.getLabels(undefined, width);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-letters")) ) {
                columnLabels.reverse();
            }

            // Columns (letters)
            for (let col = 0; col < width; col++) {
                const pt = labelPts[col];
                labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pt.x, pt.y);
            }
        }

        // Draw grid lines
        for (let y = 0; y < polys.length; y++) {
            const slice = polys[y];
            for (let x = 0; x < slice.length; x++) {
                const cell = slice[x];
                let ele: SVGElement;
                switch (cell.type) {
                    case "circle":
                        ele = gridlines.circle(cell.r * 2).fill({color: "white", opacity: 0}).stroke(strokeAttrs).center(cell.cx, cell.cy);
                        break;
                    case "poly":
                        ele = gridlines.polygon(cell.points.map(pt => `${pt.x},${pt.y}`).join(" ")).fill({color: "white", opacity: 0}).stroke(strokeAttrs);
                        break;
                    case "path":
                        ele = gridlines.path(cell.path).fill({color: "white", opacity: 0}).stroke(strokeAttrs);
                        break;
                }
                if (this.options.boardClick !== undefined) {
                    ele.click(() => this.options.boardClick!(y, x, ""));
                }
            }
        }

        this.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

        return [grid, polys];
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates a hexagonal-shaped field of triangles where the pieces are placed on line intersections.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected hexOfTri(): GridPoints {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("minWidth" in this.json.board)) || (! ("maxWidth" in this.json.board)) || (this.json.board.minWidth === undefined) || (this.json.board.maxWidth === undefined) ) {
            throw new Error("Both the `minWidth` and `maxWidth` properties are required for this board type.");
        }
        const minWidth: number = this.json.board.minWidth;
        const maxWidth: number = this.json.board.maxWidth;
        const cellsize = this.cellsize;
        let height = ((maxWidth - minWidth) * 2) + 1;
        let half: "top"|"bottom"|undefined;
        let alternating = false;
        if ( ("half" in this.json.board) && (this.json.board.half !== undefined) && (this.json.board.half !== null) ) {
            half = this.json.board.half;
            height = maxWidth - minWidth + 1;
        } else if ( ("alternatingSymmetry" in this.json.board) && (this.json.board.alternatingSymmetry) ) {
            alternating = true;
            const numTop = maxWidth - minWidth + 1
            const numBottom = maxWidth - numTop;
            height = numTop + numBottom;
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

        // Get a grid of points
        const grid = hexOfTri({gridWidthMin: minWidth, gridWidthMax: maxWidth, cellSize: cellsize, half, alternating});
        const board = this.rootSvg.group().id("board");
        const gridlines = board.group().id("gridlines");

        this.markBoard({svgGroup: gridlines, preGridLines: true, grid});

        // Add board labels
        let labelColour = this.options.colourContext.labels;
        if ( ("labelColour" in this.json.board) && (this.json.board.labelColour !== undefined) ) {
            labelColour = this.json.board.labelColour;
        }
        let labelOpacity = 1;
        if ( ("labelOpacity" in this.json.board) && (this.json.board.labelOpacity !== undefined) ) {
            labelOpacity = this.json.board.labelOpacity;
        }
        if ( (! this.json.options) || (! this.json.options.includes("hide-labels") ) ) {
            const labels = board.group().id("labels");

            // Rows (numbers)
            let customLabels: string[]|undefined;
            if ( ("columnLabels" in this.json.board) && (this.json.board.columnLabels !== undefined) ) {
                customLabels = this.json.board.columnLabels;
            }
            const columnLabels = this.getLabels(customLabels, height);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-letters")) ) {
                columnLabels.reverse();
            }

            for (let row = 0; row < grid.length; row++) {
                let leftNum = "1";
                let rightNum = grid[row].length.toString();
                if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-numbers")) ) {
                    const scratch = leftNum;
                    leftNum = rightNum;
                    rightNum = scratch;
                }

                const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
                const pointR = {x: grid[row][grid[row].length - 1].x + cellsize, y: grid[row][grid[row].length - 1].y};
                labels.text(columnLabels[height - row - 1] + leftNum).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
                labels.text(columnLabels[height - row - 1] + rightNum).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
            }
        }

        // load blocked nodes
        type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
        let blocked: Blocked|undefined;
        if ( (this.json.board.blocked !== undefined) && (this.json.board.blocked !== null)  && (Array.isArray(this.json.board.blocked)) && (this.json.board.blocked.length > 0) ){
            blocked = [...(this.json.board.blocked as Blocked)];
        }

        // Draw grid lines
        let midrow = maxWidth - minWidth;
        if (half === "bottom") {
            midrow = 0;
        }

        for (let row = 0; row < grid.length; row++) {
            const currRow = grid[row];
            for (let col = 0; col < grid[row].length; col++) {
                const curr = currRow[col];
                const isBlocked = blocked?.find(b => b.row === row && b.col === col);
                if (isBlocked !== undefined) {
                    continue;
                }
                // always connect to cell to the left
                if (col > 0) {
                    // skip if blocked
                    const found = blocked?.find(b => b.row === row && b.col === col - 1);
                    if (found === undefined) {
                        const prev = currRow[col - 1];
                        const x1 = curr.x;
                        const y1 = curr.y;
                        const x2 = prev.x;
                        const y2 = prev.y;
                        gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                    }
                }

                // connections are built upward, so only continue with rows after the first
                if (row > 0) {
                    // always connect to the cell directly above, if one exists
                    if (col <= grid[row - 1].length - 1) {
                        const found = blocked?.find(b => b.row === row-1 && b.col === col);
                        if (found === undefined) {
                            const prev = grid[row - 1][col];
                            const x1 = curr.x;
                            const y1 = curr.y;
                            const x2 = prev.x;
                            const y2 = prev.y;
                            gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                        }
                    }
                    // up to and including the midline, connect to the above-previous cell if there is one
                    if ( (row <= midrow) && (col > 0) ) {
                        const found = blocked?.find(b => b.row === row-1 && b.col === col-1);
                        if (found === undefined) {
                            const prev = grid[row - 1][col - 1];
                            const x1 = curr.x;
                            const y1 = curr.y;
                            const x2 = prev.x;
                            const y2 = prev.y;
                            gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                        }
                    }
                    // after the midline, connect to the above-next cell instead
                    if (row > midrow) {
                        const found = blocked?.find(b => b.row === row-1 && b.col === col+1);
                        if (found === undefined) {
                            const prev = grid[row - 1][col + 1];
                            const x1 = curr.x;
                            const y1 = curr.y;
                            const x2 = prev.x;
                            const y2 = prev.y;
                            gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                        }
                    }
                }
            }
        }

        if (this.options.boardClick !== undefined) {
            // moving to click catchers across the board to make arbitrary rotation easier
            const tiles = board.group().id("tiles");
            const tile = this.rootSvg.defs().rect(this.cellsize, this.cellsize).fill(this.options.colourContext.background).opacity(0).id("_clickCatcher");
            for (let row = 0; row < grid.length; row++) {
                for (let col = 0; col < grid[row].length; col++) {
                    const found = blocked?.find(b => b.row === row && b.col === col);
                    if (found !== undefined) {
                        continue;
                    }
                    const {x, y} = grid[row][col];
                    const t = tiles.use(tile).dmove(x - (cellsize / 2), y - (cellsize / 2));
                    t.click(() => this.options.boardClick!(row, col, ""));
                }
            }
        }

        this.markBoard({svgGroup: gridlines, preGridLines: false, grid});

        return grid;
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates a hexagonal field of circles.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected hexOfCir(opts?: {noSvg: boolean}): [GridPoints, IPolyCircle[][]] {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("minWidth" in this.json.board)) || (! ("maxWidth" in this.json.board)) || (this.json.board.minWidth === undefined) || (this.json.board.maxWidth === undefined) ) {
            throw new Error("Both the `minWidth` and `maxWidth` properties are required for this board type.");
        }
        const minWidth: number = this.json.board.minWidth;
        const maxWidth: number = this.json.board.maxWidth;
        const cellsize = this.cellsize;
        let height = ((maxWidth - minWidth) * 2) + 1;
        let half: "top"|"bottom"|undefined;
        let alternating = false;
        if ( ("half" in this.json.board) && (this.json.board.half !== undefined) && (this.json.board.half !== null) ) {
            half = this.json.board.half;
            height = maxWidth - minWidth + 1;
        } else if ( ("alternatingSymmetry" in this.json.board) && (this.json.board.alternatingSymmetry) ) {
            alternating = true;
            const numTop = maxWidth - minWidth + 1
            const numBottom = maxWidth - numTop;
            height = numTop + numBottom;
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

        // Get a grid of points
        const grid = hexOfCir({gridWidthMin: minWidth, gridWidthMax: maxWidth, cellSize: cellsize, half, alternating});
        const board = this.rootSvg.group().id("board");
        const gridlines = board.group().id("circles");

        // build polys
        const polys: IPolyCircle[][] = [];
        for (const row of grid) {
            const polyRow: IPolyCircle[] = [];
            for (const p of row) {
                polyRow.push({type: "circle", r: cellsize/2, cx: p.x, cy: p.y});
            }
            polys.push(polyRow);
        }

        if (opts !== undefined && opts.noSvg === true) {
            return [grid, polys];
        }

        this.markBoard({svgGroup: gridlines, preGridLines: true, grid, polys});

        // Add board labels
        let labelColour = this.options.colourContext.labels;
        if ( ("labelColour" in this.json.board) && (this.json.board.labelColour !== undefined) ) {
            labelColour = this.json.board.labelColour;
        }
        let labelOpacity = 1;
        if ( ("labelOpacity" in this.json.board) && (this.json.board.labelOpacity !== undefined) ) {
            labelOpacity = this.json.board.labelOpacity;
        }
        if ( (! this.json.options) || (! this.json.options.includes("hide-labels") ) ) {
            const labels = board.group().id("labels");

            // Rows (numbers)
            let customLabels: string[]|undefined;
            if ( ("columnLabels" in this.json.board) && (this.json.board.columnLabels !== undefined) ) {
                customLabels = this.json.board.columnLabels;
            }
            const columnLabels = this.getLabels(customLabels, height);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-letters")) ) {
                columnLabels.reverse();
            }

            for (let row = 0; row < height; row++) {
                let leftNum = "1";
                let rightNum = grid[row].length.toString();
                if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-numbers")) ) {
                    const scratch = leftNum;
                    leftNum = rightNum;
                    rightNum = scratch;
                }

                const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
                const pointR = {x: grid[row][grid[row].length - 1].x + cellsize, y: grid[row][grid[row].length - 1].y};
                labels.text(columnLabels[height - row - 1] + leftNum).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
                labels.text(columnLabels[height - row - 1] + rightNum).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
            }
        }

        // Draw circles
        const circle = this.rootSvg.defs().symbol().id("circle-symbol").viewbox(0, 0, cellsize, cellsize);
        circle.circle(cellsize)
            .fill({color: "black", opacity: 0})
            .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke});
        for (let iRow = 0; iRow < grid.length; iRow++) {
            const row = grid[iRow];
            for (let iCol = 0; iCol < row.length; iCol++) {
                const p = row[iCol];
                const c = gridlines.use(circle).size(cellsize, cellsize).center(p.x, p.y);
                if (this.options.boardClick !== undefined) {
                    c.click(() => this.options.boardClick!(iRow, iCol, ""));
                }
            }
        }

        this.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

        return [grid, polys];
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates a hexagonal field of hexes. Unlike {@link rectOfHex}, this does not require any third-party library.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected hexOfHex(opts?: {noSvg: boolean}): [GridPoints, IPolyPolygon[][]] {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("minWidth" in this.json.board)) || (! ("maxWidth" in this.json.board)) || (this.json.board.minWidth === undefined) || (this.json.board.maxWidth === undefined) ) {
            throw new Error("Both the `minWidth` and `maxWidth` properties are required for this board type.");
        }
        const minWidth: number = this.json.board.minWidth;
        const maxWidth: number = this.json.board.maxWidth;
        const cellsize = this.cellsize;
        let height = ((maxWidth - minWidth) * 2) + 1;
        let half: "top"|"bottom"|undefined;
        let alternating = false;
        if ( ("half" in this.json.board) && (this.json.board.half !== undefined) && (this.json.board.half !== null) ) {
            half = this.json.board.half;
            height = maxWidth - minWidth + 1;
        } else if ( ("alternatingSymmetry" in this.json.board) && (this.json.board.alternatingSymmetry) ) {
            alternating = true;
            const numTop = maxWidth - minWidth + 1
            const numBottom = maxWidth - numTop;
            height = numTop + numBottom;
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

        // Get a grid of points
        const grid = hexOfHex({gridWidthMin: minWidth, gridWidthMax: maxWidth, cellSize: cellsize, half, alternating});

        // Build polygons first
        // const myHex = defineHex({orientation: Orientation.POINTY, dimensions: 25})
        // const hexObj = new myHex();
        const triWidth = 50 / 2;
        const halfhex = triWidth / 2;
        const triHeight = (triWidth * Math.sqrt(3)) / 2;

        const pts: IPoint[] = [{x:triHeight,y:0}, {x:triHeight * 2,y:halfhex}, {x:triHeight * 2,y:halfhex + triWidth}, {x:triHeight,y:triWidth * 2}, {x:0,y:halfhex + triWidth}, {x:0,y:halfhex}];
        // const pts = hexObj.corners.map(({x,y}) => { return {x: x+21.650635, y: y+25}; });
        const polys: IPolyPolygon[][] = [];
        for (const row of grid) {
            const rowPolys: IPolyPolygon[] = [];
            for (const p of row) {
                const dx = p.x - triHeight; const dy = p.y - 25;
                rowPolys.push({
                    type: "poly",
                    points: pts.map(pt => { return {x: pt.x + dx, y: pt.y + dy}}),
                });
            }
            polys.push(rowPolys);
        }

        if (opts !== undefined && opts.noSvg === true) {
            return [grid, polys];
        }

        const board = this.rootSvg.group().id("board");
        const gridlines = board.group().id("hexes");
        this.markBoard({svgGroup: gridlines, preGridLines: true, grid, polys});

        // Add board labels
        let labelColour = this.options.colourContext.labels;
        if ( ("labelColour" in this.json.board) && (this.json.board.labelColour !== undefined) ) {
            labelColour = this.json.board.labelColour;
        }
        let labelOpacity = 1;
        if ( ("labelOpacity" in this.json.board) && (this.json.board.labelOpacity !== undefined) ) {
            labelOpacity = this.json.board.labelOpacity;
        }
        if ( (! this.json.options) || (! this.json.options.includes("hide-labels") ) ) {
            const labels = board.group().id("labels");

            // Rows (numbers)
            let customLabels: string[]|undefined;
            if ( ("columnLabels" in this.json.board) && (this.json.board.columnLabels !== undefined) ) {
                customLabels = this.json.board.columnLabels;
            }
            const columnLabels = this.getLabels(customLabels, height);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-letters")) ) {
                columnLabels.reverse();
            }

            for (let row = 0; row < height; row++) {
                let leftNum = "1";
                let rightNum = grid[row].length.toString();
                if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-numbers")) ) {
                    const scratch = leftNum;
                    leftNum = rightNum;
                    rightNum = scratch;
                }

                const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
                const pointR = {x: grid[row][grid[row].length - 1].x + cellsize, y: grid[row][grid[row].length - 1].y};
                labels.text(columnLabels[height - row - 1] + leftNum).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
                labels.text(columnLabels[height - row - 1] + rightNum).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
            }
        }

        /*
        Flat-topped hexes:
            half, 0
            (half+width), 0
            (width*2), height
            (half+width), (height*2)
            half, (height*2)
            0, height
        Pointy-topped hexes:
            height, 0
            (height*2), half
            (height*2), (half+width)
            height, (width*2)
            0, (half+width)
            0 half
        */

        // Draw the actual hexes
        type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
        let blocked: Blocked|undefined;
        if ( (this.json.board.blocked !== undefined) && (this.json.board.blocked !== null)  && (Array.isArray(this.json.board.blocked)) && (this.json.board.blocked.length > 0) ){
            blocked = [...(this.json.board.blocked as Blocked)];
        }

        const hex = this.rootSvg.defs().symbol().id("hex-symbol").viewbox(-3.3493649053890344, 0, 50, 50);
        hex.polygon(pts.map(pt => `${pt.x},${pt.y}`).join(" "))
           .fill({color: "white", opacity: 0}).id("hex-symbol-poly")
           .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke, linecap: "round", linejoin: "round"});
        for (let iRow = 0; iRow < grid.length; iRow++) {
            const row = grid[iRow];
            for (let iCol = 0; iCol < row.length; iCol++) {
                const p = row[iCol];
                if ( (blocked !== undefined) && (blocked.find(({col: x, row: y}) => x === iCol && y === iRow) !== undefined) ) {
                    continue;
                }
                const c = gridlines.use(hex).size(cellsize, cellsize).center(p.x, p.y); // .move(p.x - (cellsize / 2), p.y - (cellsize / 2)); // .center(p.x, p.y);
                if (this.options.boardClick !== undefined) {
                    c.click(() => this.options.boardClick!(iRow, iCol, ""));
                }
            }
        }

        this.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

        return [grid, polys];
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates a rectangular field of hexes slanted to the left. Unlike {@link rectOfHex}, this does not require any third-party library.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected hexSlanted(): [GridPoints, IPolyPolygon[][]] {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("width" in this.json.board)) || (! ("height" in this.json.board)) || (this.json.board.width === undefined) || (this.json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        const boardTyped = this.json.board as BoardBasic;
        const gridWidth: number = boardTyped.width as number;
        const gridHeight: number = boardTyped.height as number;
        const cellsize = this.cellsize;

        let baseStroke = 1;
        let baseColour = this.options.colourContext.strokes;
        let baseOpacity = 1;
        if ( ("strokeWeight" in boardTyped) && (boardTyped.strokeWeight !== undefined) ) {
            baseStroke = boardTyped.strokeWeight;
        }
        if ( ("strokeColour" in boardTyped) && (boardTyped.strokeColour !== undefined) ) {
            baseColour = this.resolveColour(boardTyped.strokeColour) as string;
        }
        if ( ("strokeOpacity" in boardTyped) && (boardTyped.strokeOpacity !== undefined) ) {
            baseOpacity = boardTyped.strokeOpacity;
        }

        // Get a grid of points
        const grid = hexSlanted({gridWidth, gridHeight, cellSize: cellsize});
        const board = this.rootSvg.group().id("board");
        const gridlines = board.group().id("hexes");

        // build polys
        const triWidth = 50 / 2;
        const halfhex = triWidth / 2;
        const triHeight = (triWidth * Math.sqrt(3)) / 2;

        const hex = this.rootSvg.defs().symbol().id("hex-symbol").viewbox(-3.3493649053890344, 0, 50, 50);
        const pts: IPoint[] = [{x:triHeight,y:0}, {x:triHeight * 2,y:halfhex}, {x:triHeight * 2,y:halfhex + triWidth}, {x:triHeight,y:triWidth * 2}, {x:0,y:halfhex + triWidth}, {x:0,y:halfhex}];

        const polys: IPolyPolygon[][] = [];
        for (const row of grid) {
            const rowPolys: IPolyPolygon[] = [];
            for (const p of row) {
                const dx = p.x - triHeight; const dy = p.y - 25;
                rowPolys.push({
                    type: "poly",
                    points: pts.map(pt => { return {x: pt.x + dx, y: pt.y + dy}}),
                });
            }
            polys.push(rowPolys);
        }

        this.markBoard({svgGroup: gridlines, preGridLines: true, grid, polys});

        // Add board labels
        let labelColour = this.options.colourContext.labels;
        if ( ("labelColour" in boardTyped) && (boardTyped.labelColour !== undefined) ) {
            labelColour = boardTyped.labelColour;
        }
        let labelOpacity = 1;
        if ( ("labelOpacity" in boardTyped) && (boardTyped.labelOpacity !== undefined) ) {
            labelOpacity = boardTyped.labelOpacity;
        }
        if ( (! this.json.options) || (! this.json.options.includes("hide-labels") ) ) {
            const labels = board.group().id("labels");
            let customLabels: string[]|undefined;
            if ( ("columnLabels" in boardTyped) && (boardTyped.columnLabels !== undefined) ) {
                customLabels = boardTyped.columnLabels;
            }
            let columnLabels = this.getLabels(customLabels, gridWidth);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-numbers")) ) {
                columnLabels.reverse();
            }

            customLabels = undefined
            if ( ("rowLabels" in boardTyped) && (boardTyped.rowLabels !== undefined) ) {
                customLabels = boardTyped.rowLabels;
            }
            let rowLabels = this.getRowLabels(customLabels, gridHeight);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-letters")) ) {
                rowLabels.reverse();
            }

            if (this.json.options?.includes("swap-labels")) {
                const scratch = [...columnLabels];
                columnLabels = [...rowLabels];
                columnLabels.reverse();
                rowLabels = [...scratch];
                rowLabels.reverse();
            }

            // Columns (letters)
            for (let col = 0; col < gridWidth; col++) {
                const pointTop = {x: grid[0][col].x, y: grid[0][col].y - cellsize};
                const pointBottom = {x: grid[gridHeight - 1][col].x, y: grid[gridHeight - 1][col].y + cellsize};
                labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
                labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
            }

            // Rows (numbers)
            for (let row = 0; row < gridHeight; row++) {
                const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
                const pointR = {x: grid[row][gridWidth - 1].x + cellsize, y: grid[row][gridWidth - 1].y};
                labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
                labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
            }
        }

        /*
        Flat-topped hexes:
            half, 0
            (half+width), 0
            (width*2), height
            (half+width), (height*2)
            half, (height*2)
            0, height
        Pointy-topped hexes:
            height, 0
            (height*2), half
            (height*2), (half+width)
            height, (width*2)
            0, (half+width)
            0 half
        */

        // Draw hexes
        let hexFill: string|undefined;
        if ( ("hexFill" in boardTyped) && (boardTyped.hexFill !== undefined) && (boardTyped.hexFill !== null) && (typeof boardTyped.hexFill === "string") && (boardTyped.hexFill.length > 0) ){
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            hexFill = boardTyped.hexFill;
        }
        const symbolPoly = hex.polygon(pts.map(pt => `${pt.x},${pt.y}`).join(" "))
                            .fill({color: "white", opacity: 0}).id("hex-symbol-poly")
                            .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke, linecap: "round", linejoin: "round"});
        if (hexFill !== undefined) {
            symbolPoly.fill({color: hexFill, opacity: 1});
        }

        type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
        let blocked: Blocked|undefined;
        if ( (boardTyped.blocked !== undefined) && (boardTyped.blocked !== null) && (Array.isArray(boardTyped.blocked)) && (boardTyped.blocked.length > 0) ){
            blocked = [...(boardTyped.blocked as Blocked)];
        }

        for (let iRow = 0; iRow < grid.length; iRow++) {
            const row = grid[iRow];
            for (let iCol = 0; iCol < row.length; iCol++) {
                const p = row[iCol];

                // don't draw "blocked" hexes
                if (blocked !== undefined) {
                    const found = blocked.find(e => e.row === iRow && e.col === iCol);
                    if (found !== undefined) {
                        continue;
                    }
                }
                const c = gridlines.use(hex).size(cellsize, cellsize).center(p.x, p.y); // .move(p.x - (cellsize / 2), p.y - (cellsize / 2)); // .center(p.x, p.y);
                if (this.options.boardClick !== undefined) {
                    c.click(() => this.options.boardClick!(iRow, iCol, ""));
                }
            }
        }

        this.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

        return [grid, polys];
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generates a conical projection of a slanted hex board.
     * Only one of `width` or `height` is required. If only width is given, then height is assumed
     * to be width + 1 (you lose one column of cells in the projection).
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected conicalHex(): [GridPoints, IPolyPolygon[][]] {
        if ( (this.json === undefined) || (this.rootSvg === undefined) || (this.json.board === null) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        let gridWidth: number|undefined;
        let gridHeight: number|undefined;
        if ( ("width" in this.json.board) && (this.json.board.width !== undefined)) {
            gridWidth = this.json.board.width;
        }
        if ( ("height" in this.json.board) && (this.json.board.height !== undefined)) {
            gridHeight = this.json.board.height;
        }
        if (gridHeight === undefined && gridWidth !== undefined) {
            gridHeight = gridWidth + 1;
            gridWidth++;
        }
        if (gridHeight === undefined) {
            throw new Error(`One of 'width' or 'height' is required.`);
        }

        const cellsize = this.cellsize;

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

        // Get a grid of points
        let narrow = false;
        if ( ("style" in this.json.board) && (this.json.board.style !== undefined) && (this.json.board.style === "conical-hex-narrow") ) {
            narrow = true;
        }
        const grid = conicalHex({gridHeight, conicalNarrow: narrow});
        const polys = genConicalHexPolys({height: gridHeight, narrow, scale: cellsize})
        const board = this.rootSvg.group().id("board");
        const gridlines = board.group().id("hexes");

        this.markBoard({svgGroup: gridlines, preGridLines: true, grid, polys});

        // No board labels

        // Draw hexes
        for (let iRow = 0; iRow < grid.length; iRow++) {
            const row = polys[iRow];
            for (let iCol = 0; iCol < row.length; iCol++) {
                const p = row[iCol];
                const c = gridlines.polygon(p.points.map(ip => [ip.x, ip.y]).flat()).fill({opacity: 0}).stroke({color: baseColour, width: baseStroke, opacity: baseOpacity});
                if (this.options.boardClick !== undefined) {
                    c.click(() => this.options.boardClick!(iRow, iCol, ""));
                }
            }
        }

        this.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

        return [grid, polys];
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generates a pyramidal projection of the bottom half of a hexhex board.
     * Only `minWidth` is required, which defines the length of each side of the hex.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected pyramidHex(): [GridPoints, IPolyPolygon[][]] {
        if ( (this.json === undefined) || (this.rootSvg === undefined) || (this.json.board === null) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        let gridWidth: number|undefined;
        if ( ("minWidth" in this.json.board) && (this.json.board.minWidth !== undefined)) {
            gridWidth = this.json.board.minWidth;
        }
        if (gridWidth === undefined) {
            throw new Error(`The property 'minWidth' is required.`);
        }

        const cellsize = this.cellsize;

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

        // Get a grid of points
        const grid = pyramidHex({gridWidthMin: gridWidth});
        const polys = genPyramidHexPolys({size: gridWidth, scale: cellsize})
        const board = this.rootSvg.group().id("board");
        const gridlines = board.group().id("hexes");

        this.markBoard({svgGroup: gridlines, preGridLines: true, grid, polys});

        // No board labels

        // Draw hexes
        for (let iRow = 0; iRow < grid.length; iRow++) {
            const row = polys[iRow];
            for (let iCol = 0; iCol < row.length; iCol++) {
                const p = row[iCol];
                const c = gridlines.polygon(p.points.map(ip => [ip.x, ip.y]).flat()).fill({opacity: 0}).stroke({color: baseColour, width: baseStroke, opacity: baseOpacity});
                if (this.options.boardClick !== undefined) {
                    c.click(() => this.options.boardClick!(iRow, iCol, ""));
                }
            }
        }

        this.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

        return [grid, polys];
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates grids for sowing boards. Points are the centre of each square.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected sowing(): GridPoints {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("width" in this.json.board)) || (! ("height" in this.json.board)) || (this.json.board.width === undefined) || (this.json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        if ( (! ("style" in this.json.board)) || (this.json.board.style === undefined) ) {
            throw new Error("This function requires that a board style be defined.");
        }
        const width: number = this.json.board.width;
        const height: number = this.json.board.height;
        const cellsize = this.cellsize;
        let endpits = true;
        if ( ("showEndPits" in this.json.board) && (this.json.board.showEndPits === false) )  {
            endpits = false;
        }
        let squarePits: {row: number; col: number}[] = [];
        if ( ("squarePits" in this.json.board) && (this.json.board.squarePits !== undefined) && (Array.isArray(this.json.board.squarePits)) )  {
            squarePits = this.json.board.squarePits as [{row: number; col: number}, ...{row: number; col: number}[]];
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

        // Get a grid of points
        const grid = rectOfRects({gridHeight: height, gridWidth: width, cellSize: cellsize});
        const board = this.rootSvg.group().id("board");

        // Make an expanded grid for markers, to accommodate edge marking and shading
        // Add one row and one column and shift all points up and to the left by half a cell size
        let gridExpanded = rectOfRects({gridHeight: height + 1, gridWidth: width + 1, cellSize: cellsize});
        gridExpanded = gridExpanded.map((row) => row.map((cell) => ({x: cell.x - (cellsize / 2), y: cell.y - (cellsize / 2)} as IPoint)));

        // add endpits to the grid if present (after it's expanded)
        if (endpits) {
            const {x: lx, y: ly} = grid[0][0];
            const {x: rx, y: ry} = grid[0][width - 1];
            const lst: IPoint[] = [];
            // left
            lst.push({x: lx - cellsize, y: ly + (cellsize / 2)});
            // right
            lst.push({x: rx + cellsize, y: ry + (cellsize / 2)});
            grid.push(lst);
        }

        const gridlines = board.group().id("gridlines");
        this.markBoard({svgGroup: gridlines, preGridLines: true, grid, gridExpanded});

        const shrinkage = 0.75;
        // Add board labels
        let labelColour = this.options.colourContext.labels;
        if ( ("labelColour" in this.json.board) && (this.json.board.labelColour !== undefined) ) {
            labelColour = this.json.board.labelColour;
        }
        let labelOpacity = 1;
        if ( ("labelOpacity" in this.json.board) && (this.json.board.labelOpacity !== undefined) ) {
            labelOpacity = this.json.board.labelOpacity;
        }
        if ( (! this.json.options) || (! this.json.options.includes("hide-labels") ) ) {
            const labels = board.group().id("labels");
            let customLabels: string[]|undefined;
            if ( ("columnLabels" in this.json.board) && (this.json.board.columnLabels !== undefined) ) {
                customLabels = this.json.board.columnLabels;
            }
            const columnLabels = this.getLabels(customLabels, width);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-letters")) ) {
                columnLabels.reverse();
            }

            // Columns (letters)
            for (let col = 0; col < width; col++) {
                const pointTop = {x: grid[0][col].x, y: grid[0][col].y - cellsize};
                const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + cellsize};
                labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
                labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
            }

            // Rows (numbers)
            const rowLabels = this.getRowLabels(this.json.board.rowLabels, height);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-numbers")) ) {
                rowLabels.reverse();
            }

            for (let row = 0; row < height; row++) {
                const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
                const pointR = {x: grid[row][width - 1].x + cellsize, y: grid[row][width - 1].y};
                if (endpits) {
                    pointL.x -= cellsize * shrinkage;
                    pointR.x += cellsize * shrinkage;
                }
                labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
                labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
            }
        }

        // Now the tiles
        type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
        let blocked: Blocked|undefined;
        if ( (this.json.board.blocked !== undefined) && (this.json.board.blocked !== null)  && (Array.isArray(this.json.board.blocked)) && (this.json.board.blocked.length > 0) ){
            blocked = [...(this.json.board.blocked as Blocked)];
        }

        // // need to create reversed points now for the square pits to be placed correctly
        // let reversed: GridPoints = [...grid.map(l => [...l])];
        // if (this.options.rotate === 180) {
        //     // The grid however, if there are end pits, we need to hold the
        //     // last row aside and reinsert it after reversing.
        //     let holding: IPoint[]|undefined;
        //     if (endpits) {
        //         holding = grid.splice(-1, 1)[0];
        //     }
        //     reversed = reversed.map((r) => r.reverse()).reverse();
        //     if (holding !== undefined) {
        //         reversed.push(holding.reverse());
        //     }
        // }

        const tilePit = this.rootSvg.defs().symbol().id("pit-symbol").viewbox(0, 0, cellsize, cellsize);
        tilePit.circle(cellsize * shrinkage)
            .center(cellsize / 2, cellsize / 2)
            .fill({color: this.options.colourContext.background, opacity: 0})
            .stroke({width: baseStroke, color: baseColour, opacity: baseOpacity})
            .attr("data-outlined", true)
        const tileSquare = this.rootSvg.defs().symbol().id("square-pit-symbol").viewbox(0, 0, cellsize, cellsize);
        tileSquare.rect(cellsize * shrinkage, cellsize * shrinkage)
            .center(cellsize / 2, cellsize / 2)
            .fill({color: this.options.colourContext.background, opacity: 0})
            .stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"})
            .attr("data-outlined", true)
        const tileEnd = this.rootSvg.defs().symbol().id("end-pit-symbol").viewbox(0, 0, cellsize, cellsize * height);
        tileEnd.rect(cellsize * shrinkage, cellsize * height * 0.95)
            .radius(10)
            .center(cellsize / 2, (cellsize * height) / 2)
            .fill({color: this.options.colourContext.background, opacity: 0})
            .stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"})
            .attr("data-outlined", true)

        // check for cells with `outline` marker
        let outlines: MarkerOutline[] = [];
        if ( ("markers" in this.json.board) && (this.json.board.markers !== undefined) ) {
            outlines = (this.json.board.markers as {type: string; [k:string]: any}[]).filter(m => m.type === "outline") as MarkerOutline[];
        }

        const tiles = board.group().id("tiles");
        // Place them
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const outlined = outlines.find(o => o.points.find(p => p.col === col && p.row === row) !== undefined);

                // skip blocked cells
                if ( (blocked !== undefined) && (blocked.find(o => o.row === row && o.col === col) !== undefined) ) {
                    continue;
                }
                let tile = tilePit;
                let isSquare = false;
                if (squarePits.find(o => o.row === row && o.col === col) !== undefined) {
                    tile = tileSquare;
                    isSquare = true;
                }
                if (outlined !== undefined) {
                    const outWidth = baseStroke;
                    let outColor = baseColour;
                    let outOpacity = baseOpacity;
                    if (outlined.colour !== undefined) {
                        if (/^\d+$/.test(`${outlined.colour}`)) {
                            outColor = this.options.colours[(outlined.colour as number) - 1];
                        } else {
                            outColor = outlined.colour as string;
                        }
                    }
                    if (outlined.opacity !== undefined) {
                        outOpacity = outlined.opacity;
                    }
                    tile = tile.clone().id(`tile-${isSquare ? "square-" : ""}outlined-${outColor}`);
                    tile.find("[data-outlined=true]").each(function(this: SVGElement) { this.stroke({width: outWidth, color: outColor, opacity: outOpacity}); });
                    this.rootSvg.defs().add(tile);
                }

                const pxrow = row;
                const pxcol = col;
                const {x, y} = grid[pxrow][pxcol];
                const used = tiles.use(tile).size(cellsize, cellsize).center(x, y);
                if (this.options.boardClick !== undefined) {
                    used.click(() => this.options.boardClick!(row, col, ""));
                }
            }
        }
        // place end pits if appropriate
        if (endpits) {
            // lefthand
            let {x, y} = grid[0][0];
            let tileToUse = tileEnd;
            const leftCol = 0;
            let outlined = outlines.find(o => o.points.find(p => p.col === leftCol && p.row === height) !== undefined);
            if (outlined !== undefined) {
                const outWidth = baseStroke;
                let outColor = baseColour;
                let outOpacity = baseOpacity;
                if (outlined.colour !== undefined) {
                    if (/^\d+$/.test(`${outlined.colour}`)) {
                        outColor = this.options.colours[(outlined.colour as number) - 1];
                    } else {
                        outColor = outlined.colour as string;
                    }
                }
                if (outlined.opacity !== undefined) {
                    outOpacity = outlined.opacity;
                }
                tileToUse = tileEnd.clone().id(`tile-end-outlined-${outColor}`);
                tileToUse.find("[data-outlined=true]").each(function(this: SVGElement) { this.stroke({width: outWidth, color: outColor, opacity: outOpacity}); });
                this.rootSvg.defs().add(tileToUse);
            }
            const left = tiles.use(tileToUse).size(cellsize, cellsize * height).move(x - (cellsize * 1.5), y - (cellsize / 2));
            if (this.options.boardClick !== undefined) {
                const name = "_east";
                left.click(() => this.options.boardClick!(-1, -1, name));
            }

            // righthand
            ({x, y} = grid[0][width - 1]);
            tileToUse = tileEnd;
            const rightCol = 1;
            outlined = outlines.find(o => o.points.find(p => p.col === rightCol && p.row === height) !== undefined);
            if (outlined !== undefined) {
                const outWidth = baseStroke;
                let outColor = baseColour;
                let outOpacity = baseOpacity;
                if (outlined.colour !== undefined) {
                    if (/^\d+$/.test(`${outlined.colour}`)) {
                        outColor = this.options.colours[(outlined.colour as number) - 1];
                    } else {
                        outColor = outlined.colour as string;
                    }
                }
                if (outlined.opacity !== undefined) {
                    outOpacity = outlined.opacity;
                }
                tileToUse = tileEnd.clone().id(`tile-end-outlined-${outColor}`);
                tileToUse.find("[data-outlined=true]").each(function(this: SVGElement) { this.stroke({width: outWidth, color: outColor, opacity: outOpacity}); });
                this.rootSvg.defs().add(tileToUse);
            }
            const right = tiles.use(tileToUse).size(cellsize, cellsize * height).move(x + (cellsize / 2), y - (cellsize / 2));
            if (this.options.boardClick !== undefined) {
                const name = "_west";
                right.click(() => this.options.boardClick!(-1, -1, name));
            }
        }

        // Draw exterior grid lines
        // Draw square around entire board
        gridlines.rect(width * cellsize, height * cellsize)
            .move(0 - (cellsize / 2), 0 - (cellsize / 2))
            .fill({color: this.options.colourContext.background, opacity: 0})
            .stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
        // if even number of rows, draw line between the halves
        if (height % 2 === 0) {
            const x1 = 0 - (cellsize / 2);
            const y1 = x1 + ((height * cellsize) / 2);
            const x2 = x1 + (width * cellsize);
            const y2 = y1;
            gridlines.line(x1, y1, x2, y2)
                .stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
        }

        this.markBoard({svgGroup: gridlines, preGridLines: false, grid, gridExpanded});

        return grid;
    }

    /**
     * This draws the `conhex-cells` board and then returns a map of row/column coordinates
     * to x/y coordinates of the centroid of each polygon.
     * Rows represent layers, starting from the outside in, with each column starting at the
     * top-left corner.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected conhex(): [GridPoints, IPolyPolygon[][]] {
        if ( (this.json === undefined) || (this.json.board === null) || ( (! ("width" in this.json.board)) && (! ("height" in this.json.board)) ) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        let width = this.json.board.width;
        let height = this.json.board.height;
        if (width === undefined && height === undefined) {
            throw new Error("You must provide at least one of `width` or `height`");
        }
        if (width !== undefined && height !== undefined && width !== height) {
            throw new Error("ConHex boards must be square.");
        }
        const boardsize = (width !== undefined ? width : height) as number;
        if (boardsize % 2 === 0) {
            throw new Error("ConHex board size must be odd.");
        }
        if (boardsize < 5) {
            throw new Error("The minimum ConHex board size is 5.");
        }
        if (width === undefined) {
            width = height;
        } else if (height === undefined) {
            height = width;
        }

        const cellsize = this.cellsize;

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

        // Get cell polys
        const conhexCells = this.getConhexCells(boardsize, cellsize);
        const poly2point = (poly: IPolyPolygon): IPoint => {
            const sumx = poly.points.map(pt => pt.x).reduce((prev, curr) => prev + curr, 0);
            const sumy = poly.points.map(pt => pt.y).reduce((prev, curr) => prev + curr, 0);
            return {
                x: sumx / poly.points.length,
                y: sumy / poly.points.length,
            };
        }
        const grid: GridPoints = [];
        for (const row of conhexCells) {
            const pts: IPoint[] = [];
            for (const poly of row) {
                pts.push(poly2point(poly));
            }
            grid.push(pts);
        }
        const board = this.rootSvg.group().id("board");

        // Make an expanded grid for markers, to accommodate edge marking and shading
        // Add one row and one column and shift all points up and to the left by half a cell size
        let gridExpanded = rectOfRects({gridHeight: boardsize + 1, gridWidth: boardsize + 1, cellSize: cellsize});
        gridExpanded = gridExpanded.map((row) => row.map((cell) => ({x: cell.x - (cellsize / 2), y: cell.y - (cellsize / 2)} as IPoint)));

        const gridlines = board.group().id("gridlines");
        const cells = this.getConhexCells(boardsize, cellsize);

        this.markBoard({svgGroup: gridlines, preGridLines: true, grid, gridExpanded, polys: cells});

        // no board labels

        // Now the tiles
        type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
        let blocked: Blocked|undefined;
        if ( ("blocked" in this.json.board) && (this.json.board.blocked !== undefined) && (this.json.board.blocked !== null)  && (Array.isArray(this.json.board.blocked)) && (this.json.board.blocked.length > 0) ){
            blocked = [...(this.json.board.blocked as Blocked)];
        }

        // place cells and give them a base, empty fill
        for (let row = 0; row < cells.length; row++) {
            for (let col = 0; col < cells[row].length; col++) {
                if (blocked !== undefined && blocked.find(obj => obj.col === col && obj.row === row) !== undefined) {
                    continue;
                }
                const poly = cells[row][col];
                const p = board.polygon(poly.points.map(pt => `${pt.x},${pt.y}`).join(" ")).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"}).fill({color: "white", opacity: 0});
                if (this.options.boardClick !== undefined) {
                    p.click(() => this.options.boardClick!(row, col, "cell"))
                }
            }
        }

        this.markBoard({svgGroup: gridlines, preGridLines: false, grid, gridExpanded, polys: cells});

        return [grid, cells];
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates a collinear Cairo tiling of pentagons.
     * Each pair of cells is indexed with the left or top cell coming before the right or bottom cell.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected cairoCollinear(): [GridPoints, IPolyPolygon[][]] {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("width" in this.json.board)) || (! ("height" in this.json.board)) || (this.json.board.width === undefined) || (this.json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        const boardTyped = this.json.board as BoardBasic;
        // Width and Height are in number of two-cell pairs
        const width: number = boardTyped.width as number;
        const height: number = boardTyped.height as number;
        const cellsize = this.cellsize;
        type PentagonOrientation = "H"|"V";
        let startOrientation: PentagonOrientation = "H";
        if ( ("cairoStart" in boardTyped) && (boardTyped.cairoStart !== undefined) ) {
            startOrientation = boardTyped.cairoStart as PentagonOrientation;
        }

        let baseStroke = 1;
        let baseColour = this.options.colourContext.strokes;
        let baseOpacity = 1;
        if ( ("strokeWeight" in boardTyped) && (boardTyped.strokeWeight !== undefined) ) {
            baseStroke = boardTyped.strokeWeight;
        }
        if ( ("strokeColour" in boardTyped) && (boardTyped.strokeColour !== undefined) ) {
            baseColour = this.resolveColour(boardTyped.strokeColour) as string;
        }
        if ( ("strokeOpacity" in boardTyped) && (boardTyped.strokeOpacity !== undefined) ) {
            baseOpacity = boardTyped.strokeOpacity;
        }

        // Get a grid of points
        const grid = cairo({gridWidth: width, gridHeight: height, cellSize: cellsize, cairoStart: startOrientation});
        const board = this.rootSvg.group().id("board");
        const gridlines = board.group().id("pentagons");

        /*
          Pentagon points (N-facing):
            0, -half
            widest, -quarter
            half, half
            -half, half
            -widest, -quarter
        */

        // build polys
        const half = cellsize / 2;
        const quarter = cellsize / 4;
        const widest = half + quarter;

        type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
        let blocked: Blocked|undefined;
        if ( ("blocked" in boardTyped) && (boardTyped.blocked !== undefined) && (boardTyped.blocked !== null)  && (Array.isArray(boardTyped.blocked)) && (boardTyped.blocked.length > 0) ){
            blocked = [...(boardTyped.blocked as Blocked)];
        }

        let hexFill: string|undefined;
        if ( ("hexFill" in boardTyped) && (boardTyped.hexFill !== undefined) && (boardTyped.hexFill !== null) && (typeof boardTyped.hexFill === "string") && (boardTyped.hexFill.length > 0) ){
            hexFill = boardTyped.hexFill;
        }
        const pentN = this.rootSvg.defs().symbol().id("pentagon-symbol-N").viewbox(0 - widest - 1, 0 - half - 1, (cellsize * 1.5) + 2, cellsize + 2);
        const ptsN: IPoint[] = [{x: 0, y: 0 - half}, {x: widest, y: 0 - quarter}, {x: half, y: half}, {x: 0 - half, y: half}, {x: 0 - widest, y: 0 - quarter}];
        const symbolPolyN = pentN.polygon(ptsN.map(pt => `${pt.x},${pt.y}`).join(" "))
                           .fill({color: "white", opacity: 0}).id("pentagon-symbol-poly-N")
                           .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke, linecap: "round", linejoin: "round"});
        if (hexFill !== undefined) {
            symbolPolyN.fill({color: hexFill, opacity: 1});
        }
        const pentS = this.rootSvg.defs().symbol().id("pentagon-symbol-S").viewbox(0 - widest - 1, 0 - half - 1, (cellsize * 1.5) + 2, cellsize + 2);
        const ptsS: IPoint[] = [{x: 0, y: half}, {x: 0 - widest, y: quarter}, {x: 0 - half, y: 0 - half}, {x: half, y: 0 - half}, {x: widest, y: quarter}];
        const symbolPolyS = pentS.polygon(ptsS.map(pt => `${pt.x},${pt.y}`).join(" "))
                           .fill({color: "white", opacity: 0}).id("pentagon-symbol-poly-S")
                           .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke, linecap: "round", linejoin: "round"});
        if (hexFill !== undefined) {
            symbolPolyS.fill({color: hexFill, opacity: 1});
        }
        const pentE = this.rootSvg.defs().symbol().id("pentagon-symbol-E").viewbox(0 - half - 1, 0 - widest - 1, cellsize + 2, (cellsize * 1.5) + 2);
        const ptsE: IPoint[] = [{x: half, y: 0}, {x: quarter, y: widest}, {x: 0 - half, y: half}, {x: 0 - half, y: 0 - half}, {x: quarter, y: 0 - widest}];
        const symbolPolyE = pentE.polygon(ptsE.map(pt => `${pt.x},${pt.y}`).join(" "))
                           .fill({color: "white", opacity: 0}).id("pentagon-symbol-poly-E")
                           .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke, linecap: "round", linejoin: "round"});
        if (hexFill !== undefined) {
            symbolPolyE.fill({color: hexFill, opacity: 1});
        }
        const pentW = this.rootSvg.defs().symbol().id("pentagon-symbol-W").viewbox(0 - half - 1, 0 - widest - 1, cellsize + 2, (cellsize * 1.5) + 2);
        const ptsW: IPoint[] = [{x: 0 - half, y: 0}, {x: 0 - quarter, y: 0 - widest}, {x: half, y: 0 - half}, {x: half, y: half}, {x: 0 - quarter, y: widest}];
        const symbolPolyW = pentW.polygon(ptsW.map(pt => `${pt.x},${pt.y}`).join(" "))
                           .fill({color: "white", opacity: 0}).id("pentagon-symbol-poly-W")
                           .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke, linecap: "round", linejoin: "round"});
        if (hexFill !== undefined) {
            symbolPolyW.fill({color: hexFill, opacity: 1});
        }

        const polys: IPolyPolygon[][] = [];
        let orientation = startOrientation;
        for (let iRow = 0; iRow < height; iRow++) {
            const row = grid[iRow];
            if (iRow % 2 === 0) {
                orientation = startOrientation;
            } else if (startOrientation === "H") {
                orientation = "V";
            } else {
                orientation = "H";
            }
            const rowPolys: IPolyPolygon[] = [];
            for (let iCol = 0; iCol < width; iCol++) {
                const pairs: {pt: IPoint, w: number, h: number, col: number, sym: SVGSymbol, verts: IPoint[]}[] = [];
                if (orientation === "H") {
                    pairs.push({
                        pt: row[iCol * 2],
                        col: iCol * 2,
                        w: cellsize + 2,
                        h: (cellsize * 1.5) + 2,
                        sym: pentW,
                        verts: ptsW,
                    });
                    pairs.push({
                        pt: row[(iCol * 2) + 1],
                        col: (iCol * 2) + 1,
                        w: cellsize + 2,
                        h: (cellsize * 1.5) + 2,
                        sym: pentE,
                        verts: ptsE,
                    });
                } else {
                    pairs.push({
                        pt: row[iCol * 2],
                        col: iCol * 2,
                        w: (cellsize * 1.5) + 2,
                        h: cellsize + 2,
                        sym: pentN,
                        verts: ptsN,
                    });
                    pairs.push({
                        pt: row[(iCol * 2) + 1],
                        col: (iCol * 2) + 1,
                        w: (cellsize * 1.5) + 2,
                        h: cellsize + 2,
                        sym: pentS,
                        verts: ptsS,
                    });
                }
                for (const {pt, verts} of pairs) {
                    rowPolys.push({
                        type: "poly",
                        points: verts.map(vpt => { return {x: vpt.x + pt.x, y: vpt.y + pt.y}}),
                    });
                }
                if (orientation === "H") {
                    orientation = "V";
                } else {
                    orientation = "H";
                }
            }
            polys.push(rowPolys);
        }

        this.markBoard({svgGroup: gridlines, preGridLines: true, grid, polys});

        // now actually draw pentagons
         orientation = startOrientation;
        for (let iRow = 0; iRow < height; iRow++) {
            const row = grid[iRow];
            if (iRow % 2 === 0) {
                orientation = startOrientation;
            } else if (startOrientation === "H") {
                orientation = "V";
            } else {
                orientation = "H";
            }
            for (let iCol = 0; iCol < width; iCol++) {
                const pairs: {pt: IPoint, w: number, h: number, col: number, sym: SVGSymbol, verts: IPoint[]}[] = [];
                if (orientation === "H") {
                    pairs.push({
                        pt: row[iCol * 2],
                        col: iCol * 2,
                        w: cellsize + 2,
                        h: (cellsize * 1.5) + 2,
                        sym: pentW,
                        verts: ptsW,
                    });
                    pairs.push({
                        pt: row[(iCol * 2) + 1],
                        col: (iCol * 2) + 1,
                        w: cellsize + 2,
                        h: (cellsize * 1.5) + 2,
                        sym: pentE,
                        verts: ptsE,
                    });
                } else {
                    pairs.push({
                        pt: row[iCol * 2],
                        col: iCol * 2,
                        w: (cellsize * 1.5) + 2,
                        h: cellsize + 2,
                        sym: pentN,
                        verts: ptsN,
                    });
                    pairs.push({
                        pt: row[(iCol * 2) + 1],
                        col: (iCol * 2) + 1,
                        w: (cellsize * 1.5) + 2,
                        h: cellsize + 2,
                        sym: pentS,
                        verts: ptsS,
                    });
                }
                for (const {pt, col, w, h, sym} of pairs) {
                    if (blocked !== undefined && blocked.find(p => p.col === col && p.row === iRow) !== undefined) {
                        continue;
                    }
                    const c = gridlines.use(sym).size(w, h).center(pt.x, pt.y);
                    if (this.options.boardClick !== undefined) {
                        c.click(() => this.options.boardClick!(iRow, col, ""));
                    }
                }
                if (orientation === "H") {
                    orientation = "V";
                } else {
                    orientation = "H";
                }
            }
        }

        // Add board labels
        let labelColour = this.options.colourContext.labels;
        if ( ("labelColour" in boardTyped) && (boardTyped.labelColour !== undefined) ) {
            labelColour = boardTyped.labelColour;
        }
        let labelOpacity = 1;
        if ( ("labelOpacity" in boardTyped) && (boardTyped.labelOpacity !== undefined) ) {
            labelOpacity = boardTyped.labelOpacity;
        }
        if ( (! this.json.options) || (! this.json.options.includes("hide-labels") ) ) {
            let hideHalf = false;
            if (this.json.options?.includes("hide-labels-half")) {
                hideHalf = true;
            }
            const labels = board.group().id("labels");
            let customLabels: string[]|undefined;
            if ( ("columnLabels" in boardTyped) && (boardTyped.columnLabels !== undefined) ) {
                customLabels = boardTyped.columnLabels;
            }
            let columnLabels = this.getLabels(customLabels, width);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-letters")) ) {
                columnLabels.reverse();
            }

            let rowLabels = this.getRowLabels(boardTyped.rowLabels, height);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-numbers")) ) {
                rowLabels.reverse();
            }

            if (this.json.options?.includes("swap-labels")) {
                const scratch = [...columnLabels];
                columnLabels = [...rowLabels];
                columnLabels.reverse();
                rowLabels = [...scratch];
                rowLabels.reverse();
            }
            const realwidth = width * 2;
            // Columns (letters)
            for (let col = 0; col < realwidth; col += 2) {
                const pointTop = {x: (grid[0][col].x + grid[0][col+1].x) / 2, y: ((grid[0][col].y + grid[0][col+1].y) / 2) - (cellsize * 1.25)};
                const pointBottom = {x: (grid[height - 1][col].x + grid[height - 1][col+1].x) / 2, y: ((grid[height - 1][col].y + grid[height - 1][col+1].y) / 2) + (cellsize * 1.25)};
                if (! hideHalf) {
                    labels.text(columnLabels[col / 2]).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
                }
                labels.text(columnLabels[col / 2]).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
            }

            // Rows (numbers)
            for (let row = 0; row < height; row++) {
                const pointL = {x: ((grid[row][0].x + grid[row][1].x) / 2) - (cellsize * 1.25), y: (grid[row][0].y + grid[row][1].y) / 2};
                const pointR = {x: ((grid[row][realwidth - 1].x + grid[row][realwidth - 2].x) / 2) + (cellsize * 1.25), y: (grid[row][realwidth - 1].y + grid[row][realwidth - 2].y) / 2};
                labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
                if (! hideHalf) {
                    labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
                }
            }
        }

        this.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

        return [grid, polys];
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates the Cairo tiling of pentagons that is dual to the snubsquare board.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected cairoCatalan(): [GridPoints, IPolyPolygon[][]] {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("width" in this.json.board)) || (! ("height" in this.json.board)) || (this.json.board.width === undefined) || (this.json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        const width: number = this.json.board.width;
        const height: number = this.json.board.height;
        if (width < 2 || height < 2) {
            throw new Error(`The 'cairo-catalan' board must be at least two cells wide and two cells high.`);
        }
        const cellsize = this.cellsize;

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

        // Get a grid of snubsquare points that is 2 larger than requested
        const ssGrid = snubsquare({gridWidth: width + 2, gridHeight: height + 2, cellSize: cellsize});

        // build the list of polys
        // there are four different shapes
        const polys: IPolyPolygon[][] = [];
        for (let ssRow = 0; ssRow < height; ssRow++) {
            const polyRow: IPolyPolygon[] = [];
            for (let ssCol = 0; ssCol < width; ssCol++) {
                const pts: IPoint[] = [];
                if (ssRow % 2 === 0) {
                    if (ssCol % 2 === 0) {
                        pts.push(centroid([ssGrid[ssRow][ssCol], ssGrid[ssRow][ssCol + 1], ssGrid[ssRow + 1][ssCol], ssGrid[ssRow + 1][ssCol + 1]])!);
                        pts.push(centroid([ssGrid[ssRow][ssCol + 1], ssGrid[ssRow][ssCol + 2], ssGrid[ssRow + 1][ssCol + 1]])!);
                        pts.push(centroid([ssGrid[ssRow][ssCol + 2], ssGrid[ssRow + 1][ssCol + 2], ssGrid[ssRow + 1][ssCol + 1]])!);
                        pts.push(centroid([ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 1][ssCol + 2], ssGrid[ssRow + 2][ssCol + 2], ssGrid[ssRow + 2][ssCol + 1]])!);
                        pts.push(centroid([ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 2][ssCol + 1], ssGrid[ssRow + 1][ssCol]])!);
                    } else {
                        pts.push(centroid([ssGrid[ssRow][ssCol + 1], ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 1][ssCol]])!);
                        pts.push(centroid([ssGrid[ssRow][ssCol + 1], ssGrid[ssRow][ssCol + 2], ssGrid[ssRow + 1][ssCol + 2], ssGrid[ssRow + 1][ssCol + 1]])!);
                        pts.push(centroid([ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 1][ssCol + 2], ssGrid[ssRow + 2][ssCol + 2]])!);
                        pts.push(centroid([ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 2][ssCol + 2], ssGrid[ssRow + 2][ssCol + 1]])!);
                        pts.push(centroid([ssGrid[ssRow + 1][ssCol], ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 2][ssCol + 1], ssGrid[ssRow + 2][ssCol]])!);
                    }
                } else {
                    if (ssCol % 2 === 0) {
                        pts.push(centroid([ssGrid[ssRow][ssCol], ssGrid[ssRow][ssCol + 1], ssGrid[ssRow + 1][ssCol + 1]])!);
                        pts.push(centroid([ssGrid[ssRow][ssCol + 1], ssGrid[ssRow][ssCol + 2], ssGrid[ssRow + 1][ssCol + 2], ssGrid[ssRow + 1][ssCol + 1]])!);
                        pts.push(centroid([ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 1][ssCol + 2], ssGrid[ssRow + 2][ssCol + 1]])!);
                        pts.push(centroid([ssGrid[ssRow + 1][ssCol], ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 2][ssCol + 1], ssGrid[ssRow + 2][ssCol]])!);
                        pts.push(centroid([ssGrid[ssRow][ssCol], ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 1][ssCol]])!);
                    } else {
                        pts.push(centroid([ssGrid[ssRow][ssCol], ssGrid[ssRow][ssCol + 1], ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 1][ssCol]])!);
                        pts.push(centroid([ssGrid[ssRow][ssCol + 1], ssGrid[ssRow + 1][ssCol + 2], ssGrid[ssRow + 1][ssCol + 1]])!);
                        pts.push(centroid([ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 1][ssCol + 2], ssGrid[ssRow + 2][ssCol + 2], ssGrid[ssRow + 2][ssCol + 1]])!);
                        pts.push(centroid([ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 2][ssCol + 1], ssGrid[ssRow + 2][ssCol]])!);
                        pts.push(centroid([ssGrid[ssRow + 1][ssCol], ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 2][ssCol]])!);
                    }
                }
                polyRow.push({
                    type: "poly",
                    points: pts,
                });
            }
            polys.push(polyRow);
        }

        // build the final grid of points from the centroids of the polys
        const grid: GridPoints = [];
        for (const row of polys) {
            const rowNode: IPoint[] = [];
            for (const poly of row) {
                rowNode.push(centroid(poly.points)!)
            }
            grid.push(rowNode);
        }

        // now render the board
        const board = this.rootSvg.group().id("board");
        const gridlines = board.group().id("pentagons");

        this.markBoard({svgGroup: gridlines, preGridLines: true, grid, polys});

        // Add board labels
        let labelColour = this.options.colourContext.labels;
        if ( ("labelColour" in this.json.board) && (this.json.board.labelColour !== undefined) ) {
            labelColour = this.json.board.labelColour;
        }
        let labelOpacity = 1;
        if ( ("labelOpacity" in this.json.board) && (this.json.board.labelOpacity !== undefined) ) {
            labelOpacity = this.json.board.labelOpacity;
        }
        if ( (! this.json.options) || (! this.json.options.includes("hide-labels") ) ) {
            let hideHalf = false;
            if (this.json.options?.includes("hide-labels-half")) {
                hideHalf = true;
            }
            const labels = board.group().id("labels");
            let columnLabels = this.getLabels(undefined, width);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-letters")) ) {
                columnLabels.reverse();
            }

            let rowLabels: string[] = [];
            for (let row = 0; row < height; row++) {
                rowLabels.push((height - row).toString());
            }
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-numbers")) ) {
                rowLabels.reverse();
            }

            if (this.json.options?.includes("swap-labels")) {
                const scratch = [...columnLabels];
                columnLabels = [...rowLabels];
                columnLabels.reverse();
                rowLabels = [...scratch];
                rowLabels.reverse();
            }

            // Columns (letters)
            for (let col = 0; col < width; col++) {
                const pointTop = {x: grid[0][col].x, y: grid[0][col].y - cellsize};
                const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + cellsize};
                if (! hideHalf) {
                    labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
                }
                labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
            }

            // Rows (numbers)
            for (let row = 0; row < height; row++) {
                const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
                const pointR = {x: grid[row][width - 1].x + cellsize, y: grid[row][width - 1].y};
                labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
                if (! hideHalf) {
                    labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
                }
            }
        }

        type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
        let blocked: Blocked|undefined;
        if ( ("blocked" in this.json.board) && (this.json.board.blocked !== undefined) && (this.json.board.blocked !== null)  && (Array.isArray(this.json.board.blocked)) && (this.json.board.blocked.length > 0) ){
            blocked = [...(this.json.board.blocked as Blocked)];
        }

        let hexFill: string|undefined;
        if ( ("hexFill" in this.json.board) && (this.json.board.hexFill !== undefined) && (this.json.board.hexFill !== null) && (typeof this.json.board.hexFill === "string") && (this.json.board.hexFill.length > 0) ){
            hexFill = this.json.board.hexFill;
        }

        for (let iRow = 0; iRow < height; iRow++) {
            for (let iCol = 0; iCol < width; iCol++) {
                if (blocked !== undefined) {
                    if (blocked.find(p => p.row === iRow && p.col === iCol) !== undefined) {
                        continue;
                    }
                }
                const c = gridlines.polygon(polys[iRow][iCol].points.map(pt => `${pt.x},${pt.y}`).join(" "))
                                   .fill({color: "white", opacity: 0}).id("pentagon-symbol-poly-OO")
                                   .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke, linecap: "round", linejoin: "round"});;
                if (hexFill !== undefined) {
                    c.fill({color: hexFill, opacity: 1});
                }
                if (this.options.boardClick !== undefined) {
                    c.click(() => this.options.boardClick!(iRow, iCol, ""));
                }
            }
        }

        this.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

        return [grid, polys];
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates the very specific board for SQUARES, by Deer Valley Games Company.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected dvgc(): [GridPoints, IPolyPolygon[][]] {
        if ( this.json === undefined || this.json === null || this.rootSvg === undefined ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if (this.json.board === undefined || this.json.board === null) {
            throw new Error("Object in an invalid state!");
        }
        this.json.board = this.json.board as BoardBasic;
        // const cellsize = this.cellsize;

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

        // build the list of polys
        // just do it manually; it's a fixed size
        const polys: IPolyPolygon[][] = [
            [
                {
                    type: "poly",
                    points: [
                        {x: 0, y: 0},
                        {x: 150, y: 0},
                        {x: 150, y: 50},
                        {x: 0, y: 50},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 150, y: 0},
                        {x: 300, y: 0},
                        {x: 300, y: 50},
                        {x: 150, y: 50},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 300, y: 0},
                        {x: 450, y: 0},
                        {x: 450, y: 50},
                        {x: 300, y: 50},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 400, y: 50},
                        {x: 450, y: 50},
                        {x: 450, y: 150},
                        {x: 400, y: 150},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 400, y: 150},
                        {x: 450, y: 150},
                        {x: 450, y: 250},
                        {x: 400, y: 250},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 300, y: 250},
                        {x: 450, y: 250},
                        {x: 450, y: 300},
                        {x: 300, y: 300},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 150, y: 250},
                        {x: 300, y: 250},
                        {x: 300, y: 300},
                        {x: 150, y: 300},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 0, y: 250},
                        {x: 150, y: 250},
                        {x: 150, y: 300},
                        {x: 0, y: 300},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 0, y: 150},
                        {x: 50, y: 150},
                        {x: 50, y: 250},
                        {x: 0, y: 250},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 0, y: 50},
                        {x: 50, y: 50},
                        {x: 50, y: 150},
                        {x: 0, y: 150},
                    ]
                },
            ],
            [
                {
                    type: "poly",
                    points: [
                        {x: 50, y: 50},
                        {x: 125, y: 50},
                        {x: 125, y: 100},
                        {x: 50, y: 100},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 125, y: 50},
                        {x: 225, y: 50},
                        {x: 225, y: 100},
                        {x: 125, y: 100},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 225, y: 50},
                        {x: 325, y: 50},
                        {x: 325, y: 100},
                        {x: 225, y: 100},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 325, y: 50},
                        {x: 400, y: 50},
                        {x: 400, y: 100},
                        {x: 325, y: 100},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 350, y: 100},
                        {x: 400, y: 100},
                        {x: 400, y: 200},
                        {x: 350, y: 200},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 325, y: 200},
                        {x: 400, y: 200},
                        {x: 400, y: 250},
                        {x: 325, y: 250},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 225, y: 200},
                        {x: 325, y: 200},
                        {x: 325, y: 250},
                        {x: 225, y: 250},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 125, y: 200},
                        {x: 225, y: 200},
                        {x: 225, y: 250},
                        {x: 125, y: 250},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 50, y: 200},
                        {x: 125, y: 200},
                        {x: 125, y: 250},
                        {x: 50, y: 250},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 50, y: 100},
                        {x: 100, y: 100},
                        {x: 100, y: 200},
                        {x: 50, y: 200},
                    ]
                },
            ],
            [
                {
                    type: "poly",
                    points: [
                        {x: 100, y: 100},
                        {x: 150, y: 100},
                        {x: 150, y: 150},
                        {x: 100, y: 150},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 150, y: 100},
                        {x: 200, y: 100},
                        {x: 200, y: 150},
                        {x: 150, y: 150},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 200, y: 100},
                        {x: 250, y: 100},
                        {x: 250, y: 150},
                        {x: 200, y: 150},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 250, y: 100},
                        {x: 300, y: 100},
                        {x: 300, y: 150},
                        {x: 250, y: 150},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 300, y: 100},
                        {x: 350, y: 100},
                        {x: 350, y: 150},
                        {x: 300, y: 150},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 300, y: 150},
                        {x: 350, y: 150},
                        {x: 350, y: 200},
                        {x: 300, y: 200},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 250, y: 150},
                        {x: 300, y: 150},
                        {x: 300, y: 200},
                        {x: 250, y: 200},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 200, y: 150},
                        {x: 250, y: 150},
                        {x: 250, y: 200},
                        {x: 200, y: 200},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 150, y: 150},
                        {x: 200, y: 150},
                        {x: 200, y: 200},
                        {x: 150, y: 200},
                    ]
                },
                {
                    type: "poly",
                    points: [
                        {x: 100, y: 150},
                        {x: 150, y: 150},
                        {x: 150, y: 200},
                        {x: 100, y: 200},
                    ]
                },
            ],
        ];

        // build the final grid of points from the centroids of the polys
        const grid: GridPoints = [];
        for (const row of polys) {
            const rowNode: IPoint[] = [];
            for (const poly of row) {
                rowNode.push(centroid(poly.points)!)
            }
            grid.push(rowNode);
        }

        // now render the board
        const board = this.rootSvg.group().id("board");
        const gridlines = board.group().id("cells");

        this.markBoard({svgGroup: gridlines, preGridLines: true, grid, polys});

        for (let iRow = 0; iRow < polys.length; iRow++) {
            for (let iCol = 0; iCol < polys[iRow].length; iCol++) {
                const c = gridlines.polygon(polys[iRow][iCol].points.map(pt => `${pt.x},${pt.y}`).join(" "))
                                   .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke, linecap: "round", linejoin: "round"});

                // fill cells appropriately
                // If the background colour is lighter than the fill colour, then light tiles are fully transparent, and dark tiles are 75% transparent.
                // If the background colour is darker than the fill colour (dark mode), then light tiles are 75% transparent and dark tiles are fully transparent.
                // darker cells
                const cBg = tinycolor(this.options.colourContext.background);
                const cFill = tinycolor(this.options.colourContext.fill);

                if ( (iRow === 0 && [0,2,6].includes(iCol)) || (iRow === 1 && [1,3,6,8].includes(iCol)) || (iRow === 2 && [0,2,4,6,8].includes(iCol)) ) {
                    if (this.json.board.style === "dvgc-checkered") {
                        if (cBg.getLuminance() > cFill.getLuminance()) {
                            c.fill({color: this.options.colourContext.fill, opacity: baseOpacity * 0.25});
                        } else {
                            c.fill({color: this.options.colourContext.background, opacity: 0})
                        }
                    } else {
                        c.fill({color: this.options.colourContext.background, opacity: 0})
                    }
                }
                // forest
                else if ( (iRow === 0 && [3,4,8,9].includes(iCol)) || (iRow === 1 && [4,9].includes(iCol)) ) {
                    c.fill({color: "#228b22", opacity: baseOpacity * 0.25});
                }
                // light cells
                else {
                    if (this.json.board.style === "dvgc-checkered") {
                        if (cBg.getLuminance() > cFill.getLuminance()) {
                            c.fill({color: this.options.colourContext.background, opacity: 0})
                        } else {
                            c.fill({color: this.options.colourContext.fill, opacity: baseOpacity * 0.25});
                        }
                    } else {
                        c.fill({color: this.options.colourContext.background, opacity: 0})
                    }
                }

                if (this.options.boardClick !== undefined) {
                    c.click(() => this.options.boardClick!(iRow, iCol, ""));
                }
            }
        }

        this.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

        return [grid, polys];
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates a moon squad board, which is a standard hexhex5 with the centre cell
     * split into three pentagonal cells, and edges hand adjusted to look more thematic.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected moon(): [GridPoints, IPolyPolygon[][]] {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // check required properties
        if (this.json.board === undefined || this.json.board === null) {
            throw new Error("The `board` property must exist.");
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
        const strokeAttrs: StrokeData = {color: baseColour, width: baseStroke, opacity: baseOpacity, linecap: "round", linejoin: "round"};

        // Get a grid of points
        const polys = JSON.parse(`[[{"type":"poly","points":[{"x":15.624301,"y":124.81673},{"x":38.410186,"y":121.46676},{"x":42.646494,"y":109.06019},{"x":31.450909,"y":98.376744}]},{"type":"poly","points":[{"x":31.450909,"y":98.376744},{"x":47.766827,"y":82.937336},{"x":57.458776,"y":95.080747},{"x":50.990505,"y":106.17199},{"x":42.646494,"y":109.06019}]},{"type":"poly","points":[{"x":47.766827,"y":82.937336},{"x":68.60188,"y":71.024069},{"x":79.629004,"y":84.518488},{"x":69.151504,"y":94.995988},{"x":57.458776,"y":95.080748}]},{"type":"poly","points":[{"x":68.60188,"y":71.024069},{"x":89.383332,"y":64.931345},{"x":99.555121,"y":81.544125},{"x":89.850176,"y":86.662653},{"x":79.629004,"y":84.518488}]},{"type":"poly","points":[{"x":89.383332,"y":64.931345},{"x":124.13154,"y":65.094429},{"x":116.71011,"y":81.724488},{"x":99.555121,"y":81.544125}]}],[{"type":"poly","points":[{"x":8.7685196,"y":151.52979},{"x":15.624301,"y":124.81673},{"x":38.410186,"y":121.46676},{"x":34.01337,"y":134.34341},{"x":23.992564,"y":149.96538}]},{"type":"poly","points":[{"x":34.01337,"y":134.34341},{"x":47.227209,"y":134.35831},{"x":61.51165,"y":123.08672},{"x":50.990505,"y":106.17199},{"x":42.646494,"y":109.06019},{"x":38.410186,"y":121.46676}]},{"type":"poly","points":[{"x":61.51165,"y":123.08672},{"x":68.011642,"y":117.84773},{"x":76.214932,"y":106.19769},{"x":69.151504,"y":94.995988},{"x":57.458776,"y":95.080748},{"x":50.990505,"y":106.17199}]},{"type":"poly","points":[{"x":76.214932,"y":106.19769},{"x":88.690952,"y":106.19769},{"x":103.6471,"y":101.68964},{"x":89.850176,"y":86.662653},{"x":79.629004,"y":84.518488},{"x":69.151504,"y":94.995988}]},{"type":"poly","points":[{"x":89.850176,"y":86.662653},{"x":99.555121,"y":81.544125},{"x":116.71011,"y":81.724486},{"x":124.20161,"y":88.172768},{"x":119.3198,"y":101.4959},{"x":103.6471,"y":101.68964}]},{"type":"poly","points":[{"x":124.20161,"y":88.172768},{"x":139.23869,"y":89.40334},{"x":143.8256,"y":70.946858},{"x":124.13154,"y":65.094429},{"x":116.71011,"y":81.724486}]}],[{"type":"poly","points":[{"x":8.7685194,"y":151.52979},{"x":9.2129252,"y":172.847},{"x":27.4486,"y":171.54207},{"x":29.802129,"y":159.95649},{"x":23.992564,"y":149.96538}]},{"type":"poly","points":[{"x":29.802129,"y":159.95649},{"x":23.992564,"y":149.96538},{"x":34.01337,"y":134.34341},{"x":47.227209,"y":134.35831},{"x":48.398898,"y":148.6684},{"x":49.203429,"y":160.65339}]},{"type":"poly","points":[{"x":48.398898,"y":148.66837},{"x":65.335797,"y":148.10422},{"x":71.417835,"y":133.82601},{"x":67.962372,"y":117.9177},{"x":61.51165,"y":123.08672},{"x":47.227209,"y":134.35828}]},{"type":"poly","points":[{"x":71.417835,"y":133.82601},{"x":98.802803,"y":121.77645},{"x":88.690952,"y":106.19769},{"x":76.214932,"y":106.19769},{"x":68.011642,"y":117.84773}]},{"type":"poly","points":[{"x":98.802803,"y":121.77645},{"x":116.28968,"y":119.1526},{"x":125.65464,"y":111.48573},{"x":119.3198,"y":101.4959},{"x":103.6471,"y":101.68964},{"x":88.690952,"y":106.19769}]},{"type":"poly","points":[{"x":125.65464,"y":111.48573},{"x":135.07353,"y":111.48572},{"x":145.07337,"y":95.694488},{"x":139.23869,"y":89.40334},{"x":124.20161,"y":88.172768},{"x":119.3198,"y":101.4959}]},{"type":"poly","points":[{"x":145.07337,"y":95.694486},{"x":154.14033,"y":97.241208},{"x":166.4342,"y":84.274863},{"x":143.8256,"y":70.946858},{"x":139.23869,"y":89.40334}]}],[{"type":"poly","points":[{"x":9.2129252,"y":172.847},{"x":14.367271,"y":194.07334},{"x":33.23726,"y":195.28925},{"x":36.905932,"y":183.85354},{"x":27.4486,"y":171.54207}]},{"type":"poly","points":[{"x":36.905932,"y":183.85354},{"x":52.245318,"y":182.8242},{"x":55.971093,"y":172.3753},{"x":49.203429,"y":160.65339},{"x":29.802129,"y":159.95649},{"x":27.4486,"y":171.54207}]},{"type":"poly","points":[{"x":55.971093,"y":172.3753},{"x":70.805724,"y":175.08405},{"x":71.836303,"y":163.96981},{"x":65.335797,"y":148.10422},{"x":48.398898,"y":148.66837},{"x":49.203429,"y":160.65339}]},{"type":"poly","points":[{"x":71.836303,"y":163.96981},{"x":65.335797,"y":148.10422},{"x":71.417835,"y":133.82601},{"x":83.735533,"y":128.51935},{"x":90.917508,"y":139.28814},{"x":81.779731,"y":158.67573}]},{"type":"poly","points":[{"x":83.735533,"y":128.51935},{"x":98.802803,"y":121.77645},{"x":116.28968,"y":119.1526},{"x":118.36561,"y":129.35739},{"x":120.19405,"y":140.17122},{"x":100.99617,"y":139.7009},{"x":90.917513,"y":139.28814}]},{"type":"poly","points":[{"x":116.28968,"y":119.1526},{"x":125.65464,"y":111.48573},{"x":135.07353,"y":111.48572},{"x":144.07807,"y":120.48948},{"x":135.65794,"y":132.76887},{"x":118.36561,"y":129.35734}]},{"type":"poly","points":[{"x":135.07354,"y":111.48572},{"x":145.07337,"y":95.694488},{"x":154.14033,"y":97.241208},{"x":158.55142,"y":111.48571},{"x":157.62563,"y":126.68267},{"x":144.07807,"y":120.48948}]},{"type":"poly","points":[{"x":154.14033,"y":97.241208},{"x":166.4342,"y":84.274863},{"x":182.40432,"y":99.889338},{"x":168.1971,"y":119.10281},{"x":158.55142,"y":111.48571}]}],[{"type":"poly","points":[{"x":14.367271,"y":194.07334},{"x":30.959033,"y":223.31375},{"x":42.014957,"y":206.65103},{"x":33.23726,"y":195.28925}]},{"type":"poly","points":[{"x":42.014957,"y":206.65103},{"x":50.567028,"y":212.45495},{"x":53.359568,"y":197.19243},{"x":52.245318,"y":182.8242},{"x":36.905932,"y":183.85354},{"x":33.23726,"y":195.28925}]},{"type":"poly","points":[{"x":53.359568,"y":197.19243},{"x":71.201528,"y":198.75519},{"x":80.327504,"y":183.00699},{"x":70.805724,"y":175.08405},{"x":55.971093,"y":172.3753},{"x":52.245318,"y":182.8242}]},{"type":"poly","points":[{"x":80.327504,"y":183.00699},{"x":90.146279,"y":190.96598},{"x":95.006206,"y":183.3517},{"x":91.684413,"y":162.90338},{"x":81.779731,"y":158.67573},{"x":71.836303,"y":163.96981},{"x":70.805724,"y":175.08405}]},{"type":"poly","points":[{"x":81.779731,"y":158.67573},{"x":90.917513,"y":139.28814},{"x":100.99617,"y":139.7009},{"x":106.45952,"y":163.17073},{"x":91.684413,"y":162.90338}]},{"type":"poly","points":[{"x":106.45952,"y":163.17073},{"x":116.91059,"y":169.86103},{"x":126.5421,"y":163.64958},{"x":120.19405,"y":140.17122},{"x":100.99617,"y":139.7009}]},{"type":"poly","points":[{"x":112.02039,"y":184.2411},{"x":116.91059,"y":169.86103},{"x":106.45952,"y":163.17073},{"x":91.684413,"y":162.90338},{"x":95.006206,"y":183.3517}]},{"type":"poly","points":[{"x":126.5421,"y":163.64958},{"x":137.40474,"y":157.96932},{"x":141.55949,"y":145.00448},{"x":135.65794,"y":132.76892},{"x":118.36561,"y":129.35739},{"x":120.19405,"y":140.17122}]},{"type":"poly","points":[{"x":141.55949,"y":145.00443},{"x":155.90868,"y":154.86679},{"x":156.82262,"y":139.86435},{"x":157.62563,"y":126.68267},{"x":144.07807,"y":120.48948},{"x":135.65794,"y":132.76887}]},{"type":"poly","points":[{"x":156.82262,"y":139.86435},{"x":182.22693,"y":142.05239},{"x":182.28103,"y":130.22475},{"x":168.1971,"y":119.10281},{"x":158.55142,"y":111.48571},{"x":157.62563,"y":126.68267}]},{"type":"poly","points":[{"x":182.28103,"y":130.22475},{"x":196.8353,"y":124.43716},{"x":182.40432,"y":99.889338},{"x":168.1971,"y":119.10281}]}],[{"type":"poly","points":[{"x":30.959033,"y":223.31375},{"x":48.895005,"y":240.17645},{"x":57.195362,"y":219.62351},{"x":50.567028,"y":212.45495},{"x":42.014957,"y":206.65103}]},{"type":"poly","points":[{"x":57.195362,"y":219.62351},{"x":68.164452,"y":225.99367},{"x":77.83732,"y":210.24872},{"x":71.201528,"y":198.75519},{"x":53.359568,"y":197.19243},{"x":50.567028,"y":212.45495}]},{"type":"poly","points":[{"x":77.83732,"y":210.24872},{"x":91.810212,"y":212.44948},{"x":95.606829,"y":202.58094},{"x":90.146279,"y":190.96598},{"x":80.327504,"y":183.00699},{"x":71.201528,"y":198.75519}]},{"type":"poly","points":[{"x":95.606829,"y":202.58094},{"x":116.54187,"y":201.96992},{"x":121.73088,"y":185.02558},{"x":112.02039,"y":184.2411},{"x":95.006206,"y":183.3517},{"x":90.146279,"y":190.96598}]},{"type":"poly","points":[{"x":121.73088,"y":185.02558},{"x":136.77313,"y":185.12791},{"x":142.67828,"y":174.7804},{"x":137.40474,"y":157.96937},{"x":126.5421,"y":163.64958},{"x":116.91059,"y":169.86103},{"x":112.02039,"y":184.2411}]},{"type":"poly","points":[{"x":142.67828,"y":174.7804},{"x":154.30619,"y":174.765},{"x":163.1434,"y":161.05318},{"x":155.90868,"y":154.86679},{"x":141.55949,"y":145.00448},{"x":137.40474,"y":157.96932}]},{"type":"poly","points":[{"x":163.1434,"y":161.05318},{"x":183.26085,"y":161.42594},{"x":185.26785,"y":151.95361},{"x":182.22693,"y":142.05239},{"x":156.82262,"y":139.86435},{"x":155.90868,"y":154.86679}]},{"type":"poly","points":[{"x":185.26785,"y":151.95362},{"x":203.27286,"y":149.30238},{"x":196.8353,"y":124.43716},{"x":182.28103,"y":130.22475},{"x":182.22693,"y":142.05239}]}],[{"type":"poly","points":[{"x":48.895005,"y":240.17645},{"x":68.99126,"y":251.4197},{"x":76.136504,"y":234.69599},{"x":68.16445,"y":225.99367},{"x":57.195362,"y":219.62351}]},{"type":"poly","points":[{"x":76.136504,"y":234.69599},{"x":88.176393,"y":234.94714},{"x":97.736296,"y":218.8804},{"x":91.810212,"y":212.44948},{"x":77.83732,"y":210.24872},{"x":68.16445,"y":225.99367}]},{"type":"poly","points":[{"x":97.736296,"y":218.8804},{"x":112.86626,"y":222.41373},{"x":118.40613,"y":211.14806},{"x":116.54187,"y":201.96992},{"x":95.606829,"y":202.58094},{"x":91.810212,"y":212.44948}]},{"type":"poly","points":[{"x":118.40613,"y":211.14806},{"x":132.42426,"y":210.65625},{"x":136.4352,"y":199.65854},{"x":136.77313,"y":185.12791},{"x":121.73088,"y":185.02558},{"x":116.54187,"y":201.96992}]},{"type":"poly","points":[{"x":136.4352,"y":199.65854},{"x":153.02162,"y":198.69524},{"x":161.37279,"y":182.85356},{"x":154.30619,"y":174.765},{"x":142.67828,"y":174.7804},{"x":136.77313,"y":185.12791}]},{"type":"poly","points":[{"x":161.37279,"y":182.85356},{"x":180.41237,"y":182.81886},{"x":182.08531,"y":172.18434},{"x":183.26085,"y":161.42594},{"x":163.1434,"y":161.05318},{"x":154.30619,"y":174.765}]},{"type":"poly","points":[{"x":182.08531,"y":172.18434},{"x":203.37925,"y":172.10694},{"x":203.27286,"y":149.30238},{"x":185.26785,"y":151.95362},{"x":183.26085,"y":161.42594}]}],[{"type":"poly","points":[{"x":68.99126,"y":251.4197},{"x":89.209191,"y":257.3197},{"x":98.488504,"y":241.68099},{"x":88.176393,"y":234.94714},{"x":76.136504,"y":234.69599}]},{"type":"poly","points":[{"x":98.488504,"y":241.68099},{"x":112.45851,"y":238.88699},{"x":122.63023,"y":236.01709},{"x":112.86626,"y":222.41373},{"x":97.736296,"y":218.8804},{"x":88.176393,"y":234.94714}]},{"type":"poly","points":[{"x":122.63023,"y":236.01709},{"x":139.15285,"y":234.28408},{"x":139.03806,"y":224.69224},{"x":132.42426,"y":210.65625},{"x":118.40613,"y":211.14806},{"x":112.86626,"y":222.41373}]},{"type":"poly","points":[{"x":139.03806,"y":224.69224},{"x":154.45941,"y":223.5963},{"x":160.90291,"y":210.59984},{"x":153.02162,"y":198.69524},{"x":136.4352,"y":199.65854},{"x":132.42426,"y":210.65625}]},{"type":"poly","points":[{"x":160.90291,"y":210.59984},{"x":170.22808,"y":209.64089},{"x":178.71338,"y":193.61896},{"x":180.41237,"y":182.81886},{"x":161.37279,"y":182.85356},{"x":153.02162,"y":198.69524}]},{"type":"poly","points":[{"x":178.71338,"y":193.61896},{"x":197.54027,"y":194.88807},{"x":203.37925,"y":172.10694},{"x":182.08531,"y":172.18434},{"x":180.41237,"y":182.81886}]}],[{"type":"poly","points":[{"x":89.209191,"y":257.3197},{"x":119.69001,"y":257.90455},{"x":112.45851,"y":238.88699},{"x":98.488504,"y":241.68099}]},{"type":"poly","points":[{"x":119.69001,"y":257.90455},{"x":140.81373,"y":252.52783},{"x":139.15285,"y":234.28408},{"x":122.63023,"y":236.01709},{"x":112.45851,"y":238.88699}]},{"type":"poly","points":[{"x":140.81373,"y":252.52783},{"x":164.30391,"y":239.21633},{"x":154.45941,"y":223.5963},{"x":139.03806,"y":224.69224},{"x":139.15285,"y":234.28408}]},{"type":"poly","points":[{"x":164.30391,"y":239.21633},{"x":179.87146,"y":224.42787},{"x":170.22808,"y":209.64089},{"x":160.90291,"y":210.59984},{"x":154.45941,"y":223.5963}]},{"type":"poly","points":[{"x":179.87146,"y":224.42787},{"x":197.54027,"y":194.88807},{"x":178.71338,"y":193.61896},{"x":170.22808,"y":209.64089}]}]]`) as IPolyPolygon[][];
        const grid: GridPoints = polys.map(row => row.map(cell => centroid(cell.points)!));
        const board = this.rootSvg.group().id("board");
        const gridlines = board.group().id("gridlines");

        this.markBoard({svgGroup: gridlines, preGridLines: true, grid, polys});

        // Add board labels
        // This board is unlabelled

        // Draw grid lines
        for (let y = 0; y < polys.length; y++) {
            const row = polys[y];
            for (let x = 0; x < row.length; x++) {
                const cell = row[x];
                const ele = gridlines.polygon(cell.points.map(pt => `${pt.x},${pt.y}`).join(" ")).fill({color: "white", opacity: 0}).stroke(strokeAttrs);
                if (this.options.boardClick !== undefined) {
                    ele.click(() => this.options.boardClick!(y, x, ""));
                }
            }
        }

        this.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

        return [grid, polys];
    }

    /**
     * This is what applies annotations to a finished board.
     * Annotations are applied at the end, and so overlay pieces.
     *
     * @param grid - A map of row/column locations to x,y coordinates
     */
    protected annotateBoard(grid: GridPoints, polys?: (Poly|null)[][]) {
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
            for (const note of this.json.annotations) {
                if ( (! ("type" in note)) || (note.type === undefined) ) {
                    throw new Error("Invalid annotation format found.");
                }
                const cloned = {...note};
                if ("targets" in cloned) {
                    // This exception is fine because cloned is only used
                    // to create a UUID.
                    // @ts-expect-error
                    delete cloned.targets;
                }
                if ( (note.type !== undefined) && (note.type === "move") ) {
                    if ((note.targets as any[]).length < 2) {
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
                    if ((note.targets as any[]).length < 2) {
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
                    if ((note.targets as any[]).length !== 2) {
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
                    let dasharray = (4 * Math.ceil(strokeWeight / (this.cellsize * 0.05))).toString();
                    if (note.dashed !== undefined && note.dashed !== null) {
                        dasharray = (note.dashed ).join(" ");
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
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round"})
                                    .center(poly.cx, poly.cy)
                                    .attr({ 'pointer-events': 'none' });
                                notes.circle(poly.r * 2)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round"})
                                    .center(poly.cx, poly.cy)
                                    .attr({ 'pointer-events': 'none' });
                            } else if (poly.type === "path") {
                                notes.path(poly.path)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round"})
                                    .attr({ 'pointer-events': 'none' });
                                notes.path(poly.path)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round"})
                                    .attr({ 'pointer-events': 'none' });
                            } else {
                                notes.polygon(poly.points.map(({x,y}) => [x,y].join(",")).join(" "))
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round"})
                                    .attr({ 'pointer-events': 'none' });
                                notes.polygon(poly.points.map(({x,y}) => [x,y].join(",")).join(" "))
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round"})
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
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round"})
                                    .center(pt.x, pt.y)
                                    .attr({ 'pointer-events': 'none' });
                                notes.rect(this.cellsize, this.cellsize)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round"})
                                    .center(pt.x, pt.y)
                                    .attr({ 'pointer-events': 'none' });
                            } else if (shape === "circle") {
                                notes.circle(this.cellsize * 1.1, this.cellsize * 1.1)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round"})
                                    .center(pt.x, pt.y)
                                    .attr({ 'pointer-events': 'none' });
                                notes.circle(this.cellsize * 1.1, this.cellsize * 1.1)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round"})
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
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round"})
                                    .center(pt.x, pt.y)
                                    .attr({ 'pointer-events': 'none' });
                                notes.polygon(periph)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round"})
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
                    let dasharray = (4 * Math.ceil(strokeWeight / (this.cellsize * 0.05))).toString();
                    if (note.dashed !== undefined && note.dashed !== null) {
                        dasharray = (note.dashed ).join(" ");
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
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round"})
                                    .center(poly.cx, poly.cy)
                                    .attr({ 'pointer-events': 'none' });
                                notes.circle(poly.r * 2)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round"})
                                    .center(poly.cx, poly.cy)
                                    .attr({ 'pointer-events': 'none' });
                            } else if (poly.type === "path") {
                                notes.path(poly.path)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round"})
                                    .attr({ 'pointer-events': 'none' });
                                notes.path(poly.path)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round"})
                                    .attr({ 'pointer-events': 'none' });
                            } else {
                                notes.polygon(poly.points.map(({x,y}) => [x,y].join(",")).join(" "))
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round"})
                                    .attr({ 'pointer-events': 'none' });
                                notes.polygon(poly.points.map(({x,y}) => [x,y].join(",")).join(" "))
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round"})
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
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round"})
                                    .center(pt.x, pt.y)
                                    .attr({ 'pointer-events': 'none' });
                                notes.rect(this.cellsize, this.cellsize)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round"})
                                    .center(pt.x, pt.y)
                                    .attr({ 'pointer-events': 'none' });
                            } else if (shape === "circle") {
                                notes.circle(this.cellsize * 1.1, this.cellsize * 1.1)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round"})
                                    .center(pt.x, pt.y)
                                    .attr({ 'pointer-events': 'none' });
                                notes.circle(this.cellsize * 1.1, this.cellsize * 1.1)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round"})
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
                                    .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round"})
                                    .center(pt.x, pt.y)
                                    .attr({ 'pointer-events': 'none' });
                                notes.polygon(periph)
                                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                    .fill("none")
                                    .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round"})
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
                    for (const node of (note.targets as ITarget[])) {
                        const pt = this.getStackedPoint(grid, node.col, node.row);
                        if (pt === undefined) {
                            throw new Error(`Annotation - Dots: Could not find coordinates for row ${node.row}, column ${node.col}.`);
                        }
                        notes.circle(this.cellsize * diameter)
                            .addClass(`aprender-annotation-${x2uid(cloned)}`)
                            .fill(colour)
                            .opacity(opacity)
                            .stroke({width: 0})
                            .center(pt.x, pt.y)
                            .attr({ 'pointer-events': 'none' });
                    }
                } else if ( (note.type !== undefined) && (note.type === "glyph")) {
                    if ( (! ("targets" in note)) || ((note.targets as any[]).length < 1) ) {
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
    protected markBoard(opts: IMarkBoardOptions): void {
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
                const cloned = {...marker as {[k:string]: any}};
                if ("points" in cloned) {
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
                        pts.forEach((p) => {
                            const pt = grid[p[0]][p[1]];
                            // these exceptions are due to poor SVGjs typing
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                            svgGroup.circle(this.cellsize * diameter)
                                // @ts-ignore
                                .fill(colour)
                                .opacity(opacity)
                                .stroke({width: 0})
                                .center(pt.x, pt.y)
                                .attr({ 'pointer-events': 'none' })
                                .addClass(`aprender-marker-${x2uid(cloned)}`);
                        });
                    }
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
                    // these exceptions are due to poor SVGjs typing
                    // @ts-ignore
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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
                        colour = this.resolveColour(marker.colour );
                    }
                    let opacity = 0.25;
                    if ( ("opacity" in marker) && (marker.opacity !== undefined) ) {
                        opacity = marker.opacity;
                    }
                    let fill: FillData|SVGGradient;
                    if (isGradient) {
                        fill = colour as SVGGradient;
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
                                // @ts-ignore
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
                                floodEle = svgGroup.circle(cell.r * 2).addClass(`aprender-marker-${x2uid(cloned)}`).stroke({color: "none", width: baseStroke}).fill(fill).center(cell.cx, cell.cy).attr({ 'pointer-events': 'none' });
                                break;
                            case "poly":
                                // @ts-ignore
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
                                floodEle = svgGroup.polygon(cell.points.map(pt => `${pt.x},${pt.y}`).join(" ")).addClass(`aprender-marker-${x2uid(cloned)}`).stroke({color: "none", width: baseStroke, linecap: "round", linejoin: "round"}).fill(fill).attr({ 'pointer-events': 'none' });
                                break;
                            case "path":
                                // @ts-ignore
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
                                floodEle = svgGroup.path(cell.path).addClass(`aprender-marker-${x2uid(cloned)}`).stroke({color: "none", width: baseStroke, linecap: "round", linejoin: "round"}).fill(fill).attr({ 'pointer-events': 'none' });
                                break;
                        }
                        if (marker.pulse !== undefined && floodEle !== undefined) {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
                        // https://math.stackexchange.com/questions/3058210/how-to-shorten-a-line-but-maintain-its-angle
                        const t0 = marker.shorten;
                        const t1 = 1 - (marker.shorten);
                        const newx1 = x1 + (t0 * (x2 - x1));
                        const newy1 = y1 + (t0 * (y2 - y1));
                        const newx2 = x1 + (t1 * (x2 - x1));
                        const newy2 = y1 + (t1 * (y2 - y1));
                        x1 = newx1; y1 = newy1;
                        x2 = newx2; y2 = newy2;
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
                    if (! this.json.board.style.startsWith("circular") && ! this.json.board.style.startsWith("conical-hex") ) {
                        throw new Error("The `halo` marker only works with `circular-*` and `conical-hex*` boards.");
                    }
                    // eslint-disable-next-line @typescript-eslint/no-shadow, no-shadow
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
                            if (typeof marker.fill === "number") {
                                fill = this.options.colours[marker.fill - 1];
                            } else {
                                fill = marker.fill;
                            }
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
                        const phi = 360 / (marker.segments as any[]).length;
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
                            add.tspan(marker.label ).attr('style', font);
                        })
                        .addClass(`aprender-marker-${x2uid(cloned)}`)
                        .font({ fill: colour, anchor: "middle"})
                        .attr("alignment-baseline", "hanging")
                        .attr("dominant-baseline", "hanging");
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
                        delete newclone.cell;
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
    protected getLabels(override: string[]|undefined, arg1: number, arg2?: number) : string[] {
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

    protected getRowLabels(override: unknown, height: number) : string[] {
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
            colour= bar.colour;
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
                fill = {color: b.fill, opacity: 1};
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
            labelColour = this.json.board.labelColour;
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
            usePieceAt({svg: g, piece, cellsize: height, x: height / 2, y: height / 2, scalingFactor: 1});
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
     * For placing a generic `pieces` area at the bottom of the board.
     *
     * @param gridPoints -
     */
    protected piecesArea(box: SVGBox, opts?: {padding?: number}) {
        if (this.rootSvg === undefined) {
            throw new Error("Can't place a `pieces` area until the root SVG is initialized!");
        }
        let padding = this.cellsize / 2;
        if (opts !== undefined && opts.padding !== undefined) {
            padding = opts.padding;
        }
        if ( (this.json !== undefined) && (this.json.areas !== undefined) && (Array.isArray(this.json.areas)) && (this.json.areas.length > 0) ) {
            const areas = this.json.areas.filter((x) => x.type === "pieces") as AreaPieces[];
            const boardBottom = box.y2; // + this.cellsize;
            // Width in number of cells, taking the maximum board width
            const boardWidth = Math.floor(box.width / this.cellsize);
            let placeY = boardBottom + padding;
            for (let iArea = 0; iArea < areas.length; iArea++) {
                const area = areas[iArea];
                const numPieces = area.pieces.length;
                let desiredWidth = boardWidth;
                if (area.width !== undefined) {
                    desiredWidth = area.width;
                }
                const numRows = Math.ceil(numPieces / desiredWidth);
                const textHeight = this.cellsize / 3; // 10; // the allowance for the label
                const cellsize = this.cellsize * 0.75;
                const areaWidth = cellsize * desiredWidth;
                const areaHeight = (textHeight * 2) + (cellsize * numRows);
                let markWidth = 0;
                let markColour: string|undefined;
                if ( ("ownerMark" in area) && (area.ownerMark !== undefined) ) {
                    markWidth = 15;
                    if (typeof area.ownerMark === "number") {
                        markColour = this.options.colours[area.ownerMark - 1];
                    } else {
                        markColour = area.ownerMark;
                    }
                }
                const nested = this.rootSvg.nested().id(`_pieces${iArea}`).size(areaWidth+2, areaHeight+2).viewbox(-1 - markWidth - 5, -1, areaWidth+2+markWidth+10, areaHeight+2);
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
                    const newx = col * cellsize + cellsize / 2;
                    const newy = (textHeight * 2) + (row * cellsize) + cellsize / 2;
                    const use = usePieceAt({svg: nested, piece, cellsize, x: newx, y: newy, scalingFactor: 1});
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
                    labelColour = this.json.board.labelColour;
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
                    .attr("alignment-baseline", "hanging")
                    .attr("dominant-baseline", "hanging")
                    .move(0, 0);

                // Now place the whole group below the board
                // const placed = this.rootSvg.use(nested);
                nested.move(box.x, placeY);
                placeY += nested.bbox().height + (this.cellsize * 0.5);
            }
        }
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
                    if (typeof area.ownerMark === "number") {
                        markColour = this.options.colours[area.ownerMark - 1];
                    } else {
                        markColour = area.ownerMark;
                    }
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
                const allPts: [number,number][] = polys!.flat().map(p => {
                    let pts: [number,number][];
                    if (p.type === "circle") {
                        pts = circle2poly(p.cx, p.cy, p.r);
                    } else {
                        pts = [...p.points.map(pt => [pt.x, pt.y] as [number,number])];
                    }
                    return pts;
                }).flat();
                const hull = getConvexHull(allPts);
                const poly = this.rootSvg.polygon(hull.map(pt => pt.join(",")).join(" ")).id("aprender-backfill").fill({color: bgcolour, opacity: bgopacity});
                // `board` backfill can't just be pushed to the back but must be inside the `board` group
                board.add(poly, 0);
            }
            return true;
        }

        // if board is null, don't try again
        return true;
    }

    protected getRotation(): number {
        if (!this.json || !this.json.board) {
            throw new Error("Cannot rotate unless SVG is initialized and a board is present.");
        }
        let rotation = 0;
        if (this.options.rotate !== undefined) {
            rotation += this.options.rotate;
        }
        if (("rotate" in this.json.board) && this.json.board.rotate !== undefined) {
            rotation += this.json.board.rotate;
        }
        rotation = rotation % 360;
        while (rotation < 0) { rotation += 360; }
        return rotation;
    }

    protected getBoardCentre(): IPoint {
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
                let colour = val;
                if (typeof colour === "number") {
                    colour = this.options.colours[colour - 1];
                }
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
    protected resolveColour(val: number|string|Gradient, def?: string): string|SVGGradient {
        if (this.rootSvg === undefined || this.rootSvg === null) {
            throw new Error(`Cannot resolve colour values until the root SVG is initialized.`);
        }

        let colour: string|SVGGradient|undefined = def;
        if (typeof val === "object") {
            const x1 = val.x1 !== undefined ? val.x1 : 0;
            const y1 = val.y1 !== undefined ? val.y1 : 0;
            const x2 = val.x2 !== undefined ? val.x2 : 1;
            const y2 = val.y2 !== undefined ? val.y2 : 0;
            colour = this.rootSvg.defs().gradient("linear", add => {
                for (const stop of val.stops) {
                    add.stop({offset: stop.offset, color: this.resolveColour(stop.colour, "#000") as string, opacity: stop.opacity !== undefined ? stop.opacity : 1});
                }
            });
            colour.from(x1,y1).to(x2,y2);
        } else if (typeof val === "number") {
            colour = this.options.colours[val - 1];
        } else {
            colour = val;
            if (/^_context_/.test(colour)) {
                const [,,prop] = colour.split("_");
                if (prop in this.options.colourContext && this.options.colourContext[prop as "background"|"strokes"|"labels"|"annotations"|"fill"] !== undefined) {
                    colour = this.options.colourContext[prop as "background"|"strokes"|"labels"|"annotations"|"fill"];
                }
            }
        }
        return colour;
    }
}
