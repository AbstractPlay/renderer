// The following is here because json2ts isn't recognizing json.board.markers correctly
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Element as SVGElement, G as SVGG, Rect as SVGRect, StrokeData, Svg, Symbol as SVGSymbol, Use as SVGUse } from "@svgdotjs/svg.js";
import { Grid, defineHex, Orientation, HexOffset, rectangle } from "honeycomb-grid";
import { hexOfCir, hexOfHex, hexOfTri, rectOfRects, snubsquare } from "../grids";
import { GridPoints, IPoint } from "../grids/_base";
import { APRenderRep, Glyph } from "../schemas/schema";
import { sheets } from "../sheets";

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

/**
 * Internal interface
 */
interface INameValuePair {
    name: string;
    value: string;
}

/**
 * Internal interface used for button bars
 */
interface IButton {
    label: string;
    value?: string;
    attributes?: INameValuePair[];
}

/**
 * Internal interface used for button bars
 */
interface IButtonBar {
    [k: string]: unknown;
    type: "buttonBar";
    buttons: IButton[];
    position?: "left"|"right";
    height?: number;
    minWidth?: number;
    buffer?: number;
    colour?: string;
}

/**
 * Internal interface used for generating keys
 */
interface IKeyEntry {
    piece: string;
    name: string;
    value?: string;
}

/**
 * Internal interface used for generating keys
 */
interface IKey {
    [k: string]: unknown;
    type: "key";
    list: IKeyEntry[];
    height?: number;
    buffer?: number;
    position?: "left"|"right";
    clickable?: boolean;
}

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
    protected readonly cellsize = 50;
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
            sheets: ["core", "dice", "looney", "piecepack", "chess"],
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
            this.options.colours = ["#ddcc77", "#cc6677", "#aa4499", "#882255", "#332288", "#117733", "#44aa99", "#88ccee"];
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

        // Validate colour list if given
        if ( (opts.colours !== undefined) && (opts.colours.length > 0) ) {
            const re = new RegExp(/^\#[a-f0-9]{6}$/, "i");
            for (const c of opts.colours) {
                if (! re.test(c)) {
                    throw new Error(`One of the colours you requested is malformed: ${ c }`);
                }
            }
            this.options.colours = opts.colours;
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
            while (normalized < 0) {
                normalized += 360;
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
    protected loadGlyph(glyph: string, canvas?: Svg): SVGSymbol {
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
                    return func(canvas.defs());
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
    protected loadLegend() {
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
                        if (! Array.isArray(node)) {
                            glyphs = [node];
                        } else {
                            glyphs = node;
                        }
                        glyphs.forEach((e) => {
                            if (e.player !== undefined) {
                                if (! patterns.includes(e.player)) {
                                    patterns.push(e.player);
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
                } else {
                    glyphs = glyph;
                }

                // Create a new SVG.Nested to represent the composite piece and add it to <defs>
                const cellsize = 500;
                const nested = this.rootSvg.defs().nested().id(key).size(cellsize, cellsize);

                // Layer the glyphs, manipulating as you go
                for (const g of glyphs) {
                    let got: SVGSymbol;
                    if ( ("name" in g) && (g.name !== undefined) ) {
                        got = this.loadGlyph(g.name, nested);
                    } else if ( ("text" in g) && (g.text !== undefined) && (g.text.length > 0) ) {
                        const group = nested.symbol();
                        const fontsize = 17;
                        const text = group.text(g.text).font({
                            anchor: "start",
                            fill: "#000",
                            size: fontsize,
                        });
                        text.attr("data-playerfill", true);
                        const temptext = this.rootSvg.text(g.text).font({
                            anchor: "start",
                            fill: "#000",
                            size: fontsize,
                        });
                        const squaresize = Math.max(temptext.bbox().height, temptext.bbox().width);
                        group.viewbox(temptext.bbox());
                        group.attr("data-cellsize", squaresize);
                        temptext.remove();
                        got = group;
                    } else {
                        throw new Error(`Could not load one of the components of the glyph '${key}': ${JSON.stringify(g)}.`);
                    }

                    let sheetCellSize = got.viewbox().height;
                    if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                        sheetCellSize = got.attr("data-cellsize") as number;
                        if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                            throw new Error(`The glyph you requested (${key}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                        }
                    }

                    // const clone = got.clone();
                    const clone = got;

                    // Colourize (`player` first, then `colour` if defined)
                    if (g.player !== undefined) {
                        if  (this.options.patterns) {
                            if (g.player > this.options.patternList.length) {
                                throw new Error("The list of patterns provided is not long enough to support the number of players in this game.");
                            }
                            const useSize = sheetCellSize;
                            let fill = this.rootSvg.findOne("#" + this.options.patternList[g.player - 1] + "-" + useSize.toString()) as SVGElement;
                            if (fill === null) {
                                fill = this.rootSvg.findOne("#" + this.options.patternList[g.player - 1]) as SVGElement;
                                fill = fill.clone().id(this.options.patternList[g.player - 1] + "-" + useSize.toString()).scale(useSize / 150);
                                this.rootSvg.defs().add(fill);
                            }
                            clone.find("[data-playerfill=true]").each(function(this: SVGElement) { this.fill(fill); });
                        } else {
                            if (g.player > this.options.colours.length) {
                                throw new Error("The list of colours provided is not long enough to support the number of players in this game.");
                            }
                            const fill = this.options.colours[g.player - 1];
                            clone.find("[data-playerfill=true]").each(function(this: SVGElement) { this.fill(fill); });
                        }
                    } else if (g.colour !== undefined) {
                        clone.find("[data-playerfill=true]").each(function(this: SVGElement) { this.fill({color: g.colour}); });
                    }

                    // Apply requested opacity
                    if (g.opacity !== undefined) {
                        clone.fill({opacity: g.opacity});
                    }

                    nested.add(clone);
                    const use = nested.use(nested.findOne("#" + clone.id()) as SVGSymbol);

                    // Rotate if requested
                    if (g.rotate !== undefined) {
                        use.rotate(g.rotate, cellsize / 2, cellsize / 2);
                    }

                    // Scale it appropriately
                    let factor: number | undefined;
                    if (g.scale !== undefined) {
                        factor = g.scale;
                    }
                    if ( ("board" in this.json) && (this.json.board !== undefined) && (this.json.board !== null) && ("style" in this.json.board) && (this.json.board.style !== undefined) && (this.json.board.style === "hex-of-hex") ) {
                        if (factor === undefined) {
                            factor = 0.85;
                        } else {
                            factor *= 0.85;
                        }
                    }
                    if (factor !== undefined) {
                        use.scale(factor, cellsize / 2, cellsize / 2);
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
                nested.viewbox(0, 0, cellsize, cellsize);
            }
        }
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates square boards of square cells. Points are the centre of each square.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected squares(): GridPoints {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("width" in this.json.board)) || (! ("height" in this.json.board)) || (this.json.board.width === undefined) || (this.json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        const width: number = this.json.board.width as number;
        const height: number = this.json.board.height as number;
        const cellsize = this.cellsize;
        const style = this.json.board.style;

        let baseStroke = 1;
        let baseColour = "#000";
        let baseOpacity = 1;
        if ( ("strokeWeight" in this.json.board) && (this.json.board.strokeWeight !== undefined) ) {
            baseStroke = this.json.board.strokeWeight;
        }
        if ( ("strokeColour" in this.json.board) && (this.json.board.strokeColour !== undefined) ) {
            baseColour = this.json.board.strokeColour;
        }
        if ( ("strokeOpacity" in this.json.board) && (this.json.board.strokeOpacity !== undefined) ) {
            baseOpacity = this.json.board.strokeOpacity;
        }

        // Check for tiling
        let tilex = 0;
        let tiley = 0;
        let tileSpace = 0;
        if (this.json.board.tileWidth !== undefined) {
            tilex = this.json.board.tileWidth as number;
        }
        if (this.json.board.tileHeight !== undefined) {
            tiley = this.json.board.tileHeight as number;
        }
        if (this.json.board.tileSpacing !== undefined) {
            tileSpace = this.json.board.tileSpacing as number;
        }

        // Get a grid of points
        let grid = rectOfRects({gridHeight: height, gridWidth: width, cellSize: cellsize, tileHeight: tiley, tileWidth: tilex, tileSpacing: tileSpace});
        const board = this.rootSvg.group().id("board");

        // create buffer zone first if requested
        let bufferwidth = 0;
        let show: ("N"|"E"|"S"|"W")[] = ["N", "E", "S", "W"];
        // @ts-expect-error
        if ( ("buffer" in this.json.board) && (this.json.board.buffer !== undefined) && ("width" in this.json.board.buffer) && (this.json.board.buffer.width !== undefined) && (this.json.board.buffer.width > 0) ) {
            bufferwidth = cellsize * (this.json.board.buffer as IBuffer).width!;
            if ( ("show" in this.json.board.buffer) && (this.json.board.buffer.show !== undefined) && (Array.isArray(this.json.board.buffer.show)) && ((this.json.board.buffer.show as string[]).length > 0) ) {
                show = [...(this.json.board.buffer as IBuffer).show!];
            }
            // adjust `show` to account for rotation
            const oppDir: Map<("N"|"E"|"S"|"W"), ("N"|"E"|"S"|"W")> = new Map([["N", "S"], ["S", "N"], ["E", "W"], ["W", "E"]])
            if (this.options.rotate === 180) {
                const newshow: ("N"|"E"|"S"|"W")[] = [];
                for (const dir of show) {
                    newshow.push(oppDir.get(dir)!);
                }
                show = [...newshow];
            }
            let pattern: string | undefined;
            if ( ("pattern" in this.json.board.buffer) && (this.json.board.buffer.pattern !== undefined) && ((this.json.board.buffer.pattern as string[]).length > 0) ) {
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
                let key = "_buffer_N";
                if (this.options.rotate === 180) {
                    key = "_buffer_S";
                }
                buffN = board.rect(w, h).id(key)
                .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                .move(x, y);
            }
            // bottom
            x = grid[grid.length - 1][0].x - (cellsize / 2);
            y = grid[grid.length - 1][0].y + (cellsize / 2) + offset;
            let buffS: SVGRect | undefined;
            if (show.includes("S")) {
                let key = "_buffer_S";
                if (this.options.rotate === 180) {
                    key = "_buffer_N";
                }
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
                let key = "_buffer_W";
                if (this.options.rotate === 180) {
                    key = "_buffer_E";
                }
                buffW = board.rect(w, h).id(key)
                .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                .move(x, y);
            }
            // right
            x = grid[0][grid[0].length - 1].x + (cellsize / 2) + offset;
            y = grid[0][0].y - (cellsize / 2);
            let buffE: SVGRect | undefined;
            if (show.includes("E")) {
                let key = "_buffer_E";
                if (this.options.rotate === 180) {
                    key = "_buffer_W";
                }
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
        const labels = board.group().id("labels");
        let columnLabels = this.getLabels(width);
        if (this.options.rotate === 180) {
            columnLabels = columnLabels.reverse();
        }
        // Columns (letters)
        for (let col = 0; col < width; col++) {
            const pointTop = {x: grid[0][col].x, y: grid[0][col].y - cellsize - (show.includes("N") ? bufferwidth : 0)};
            const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + cellsize + (show.includes("S") ? bufferwidth : 0)};
            labels.text(columnLabels[col]).fill(baseColour).opacity(baseOpacity).center(pointTop.x, pointTop.y);
            labels.text(columnLabels[col]).fill(baseColour).opacity(baseOpacity).center(pointBottom.x, pointBottom.y);
        }

        // Rows (numbers)
        const rowLabels: string[] = [];
        if (this.options.rotate === 180) {
            for (let row = 0; row < height; row++) {
                rowLabels.push((row + 1).toString());
            }
        } else {
            for (let row = 0; row < height; row++) {
                rowLabels.push((height - row).toString());
            }
        }
        for (let row = 0; row < height; row++) {
            const pointL = {x: grid[row][0].x - cellsize - (show.includes("W") ? bufferwidth : 0), y: grid[row][0].y};
            const pointR = {x: grid[row][width - 1].x + cellsize + (show.includes("E") ? bufferwidth : 0), y: grid[row][width - 1].y};
            labels.text(rowLabels[row]).fill(baseColour).opacity(baseOpacity).center(pointL.x, pointL.y);
            labels.text(rowLabels[row]).fill(baseColour).opacity(baseOpacity).center(pointR.x, pointR.y);
        }

        // Now the tiles
        if (style === "squares-checkered") {
            // Load glyphs for light and dark squares
            const tileDark = this.rootSvg.defs().symbol().viewbox(0, 0, cellsize, cellsize);
            tileDark.rect(cellsize, cellsize)
                .move(0, 0)
                .fill(baseColour)
                .opacity(baseOpacity * 0.25)
                .stroke({width: 0});
            const tileLight = this.rootSvg.defs().symbol().viewbox(0, 0, cellsize, cellsize);
            tileLight.rect(cellsize, cellsize)
                .move(0, 0)
                .fill({color: "#ffffff", opacity: 0})
                .stroke({width: 0});

            const tiles = board.group().id("tiles");
            // Determine whether the first row starts with a light or dark square
            let startLight = 1;
            if (height % 2 === 0) {
                startLight = 0;
            }

            // Place them
            for (let row = 0; row < height; row++) {
                let lightCol = 1;
                if (row % 2 === startLight) {
                    lightCol = 0;
                }
                for (let col = 0; col < width; col++) {
                    const {x, y} = grid[row][col];
                    let used: SVGUse;
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
        } else if (tileSpace > 0) {
            const tileLight = this.rootSvg.defs().symbol().viewbox(0, 0, cellsize, cellsize);
            tileLight.rect(cellsize, cellsize)
                .fill({color: "#ffffff", opacity: 0})
                .stroke({width: 0});

            const tiles = board.group().id("tiles");
            for (let row = 0; row < height; row++) {
                for (let col = 0; col < width; col++) {
                    const {x, y} = grid[row][col];
                    const used = tiles.use(tileLight).size(cellsize, cellsize).center(x, y);
                    if (this.options.rotate === 180) {
                        used.click(() => this.options.boardClick!(height - row - 1, width - col - 1, ""));
                    } else {
                        used.click(() => this.options.boardClick!(row, col, ""));
                    }

                }
            }
        }

        // Draw grid lines
        const gridlines = board.group().id("gridlines");

        if (style === "squares-beveled") {
            baseOpacity *= 0.15;
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
                idxRight = idxLeft + tilex - 1;
            }
            for (let row = 0; row < height; row++) {
                let thisStroke = baseStroke;
                if ( (tiley > 0) && (tileSpace === 0) && (row > 0) && (row % tiley === 0) ) {
                    thisStroke = baseStroke * 3;
                }
                const x1 = grid[row][idxLeft].x - (cellsize / 2);
                const y1 = grid[row][idxLeft].y - (cellsize / 2);
                const x2 = grid[row][idxRight].x + (cellsize / 2);
                const y2 = grid[row][idxRight].y - (cellsize / 2);
                gridlines.line(x1, y1, x2, y2).stroke({width: thisStroke, color: baseColour, opacity: baseOpacity});

                if ( (row === height - 1) || ( (tiley > 0) && (tileSpace > 0) && ( (row > 0) || (tiley === 1) ) && (row % tiley === tiley - 1) ) ) {
                    const lastx1 = grid[row][idxLeft].x - (cellsize / 2);
                    const lasty1 = grid[row][idxLeft].y + (cellsize / 2);
                    const lastx2 = grid[row][idxRight].x + (cellsize / 2);
                    const lasty2 = grid[row][idxRight].y + (cellsize / 2);
                    gridlines.line(lastx1, lasty1, lastx2, lasty2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
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
                idxBottom = idxTop + tiley - 1;
            }
            for (let col = 0; col < width; col++) {
                let thisStroke = baseStroke;
                if ( (tilex > 0) && (tileSpace === 0) && (col > 0) && (col % tilex === 0) ) {
                    thisStroke = baseStroke * 3;
                }
                const x1 = grid[idxTop][col].x - (cellsize / 2);
                const y1 = grid[idxTop][col].y - (cellsize / 2);
                const x2 = grid[idxBottom][col].x - (cellsize / 2);
                const y2 = grid[idxBottom][col].y + (cellsize / 2);
                gridlines.line(x1, y1, x2, y2).stroke({width: thisStroke, color: baseColour, opacity: baseOpacity});

                if ( (col === width - 1) || ( (tilex > 0) && (tileSpace > 0) && ( (col > 0) || (tilex === 1) ) && (col % tilex === tilex - 1) ) ) {
                    const lastx1 = grid[idxTop][col].x + (cellsize / 2);
                    const lasty1 = grid[idxTop][col].y - (cellsize / 2);
                    const lastx2 = grid[idxBottom][col].x + (cellsize / 2);
                    const lasty2 = grid[idxBottom][col].y + (cellsize / 2);
                    gridlines.line(lastx1, lasty1, lastx2, lasty2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
                }
            }
        }

        if ( (this.options.boardClick !== undefined) && (tileSpace === 0) ) {
            const originX = grid[0][0].x;
            const originY = grid[0][0].y;
            const root = this.rootSvg;
            let genericCatcher = ((e: { clientX: number; clientY: number; }) => {
                const point = root.point(e.clientX, e.clientY);
                const x = Math.floor((point.x - (originX - (cellsize / 2))) / cellsize);
                const y = Math.floor((point.y - (originY - (cellsize / 2))) / cellsize);
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    this.options.boardClick!(y, x, "");
                }
            });
            if (this.options.rotate === 180) {
                genericCatcher = ((e: { clientX: number; clientY: number; }) => {
                    const point = root.point(e.clientX, e.clientY);
                    const x = width - Math.floor((point.x - (originX - (cellsize / 2))) / cellsize) - 1;
                    const y = height - Math.floor((point.y - (originY - (cellsize / 2))) / cellsize) - 1;
                    if (x >= 0 && x < width && y >= 0 && y < height) {
                        this.options.boardClick!(y, x, "");
                    }
                });
            }
            this.rootSvg.click(genericCatcher);
        }

        // Make an expanded grid for markers, to accommodate edge marking and shading
        // Add one row and one column and shift all points up and to the left by half a cell size
        let gridExpanded = rectOfRects({gridHeight: height + 1, gridWidth: width + 1, cellSize: cellsize});
        gridExpanded = gridExpanded.map((row) => row.map((cell) => ({x: cell.x - (cellsize / 2), y: cell.y - (cellsize / 2)} as IPoint)));
        if (this.options.rotate === 180) {
            gridExpanded = gridExpanded.map((r) => r.reverse()).reverse();
            grid = grid.map((r) => r.reverse()).reverse();
        }

        this.markBoard(gridlines, grid, gridExpanded);

        return grid;
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
        const width: number = this.json.board.width as number;
        const height: number = this.json.board.height as number;
        const cellsize = this.cellsize;
        const style = this.json.board.style;

        let baseStroke = 1;
        let baseColour = "#000";
        let baseOpacity = 1;
        if ( ("strokeWeight" in this.json.board) && (this.json.board.strokeWeight !== undefined) ) {
            baseStroke = this.json.board.strokeWeight;
        }
        if ( ("strokeColour" in this.json.board) && (this.json.board.strokeColour !== undefined) ) {
            baseColour = this.json.board.strokeColour;
        }
        if ( ("strokeOpacity" in this.json.board) && (this.json.board.strokeOpacity !== undefined) ) {
            baseOpacity = this.json.board.strokeOpacity;
        }

        // Check for tiling
        let tilex = 0;
        let tiley = 0;
        let tileSpace = 0;
        if (this.json.board.tileWidth !== undefined) {
            tilex = this.json.board.tileWidth as number;
        }
        if (this.json.board.tileHeight !== undefined) {
            tiley = this.json.board.tileHeight as number;
        }
        if (this.json.board.tileSpacing !== undefined) {
            tileSpace = this.json.board.tileSpacing as number;
        }

        // Get a grid of points
        let grid = rectOfRects({gridHeight: height, gridWidth: width, cellSize: cellsize, tileHeight: tiley, tileWidth: tilex, tileSpacing: tileSpace});
        const board = this.rootSvg.group().id("board");

        // create buffer zone first if requested
        let bufferwidth = 0;
        let show: ("N"|"E"|"S"|"W")[] = ["N", "E", "S", "W"];
        // @ts-expect-error
        if ( ("buffer" in this.json.board) && (this.json.board.buffer !== undefined) && ("width" in this.json.board.buffer) && (this.json.board.buffer.width !== undefined) && (this.json.board.buffer.width > 0) ) {
            bufferwidth = cellsize * (this.json.board.buffer as IBuffer).width!;
            if ( ("show" in this.json.board.buffer) && (this.json.board.buffer.show !== undefined) && (Array.isArray(this.json.board.buffer.show)) && ((this.json.board.buffer.show as string[]).length > 0) ) {
                show = [...(this.json.board.buffer as IBuffer).show!];
            }
            // adjust `show` to account for rotation
            const oppDir: Map<("N"|"E"|"S"|"W"), ("N"|"E"|"S"|"W")> = new Map([["N", "S"], ["S", "N"], ["E", "W"], ["W", "E"]])
            if (this.options.rotate === 180) {
                const newshow: ("N"|"E"|"S"|"W")[] = [];
                for (const dir of show) {
                    newshow.push(oppDir.get(dir)!);
                }
                show = [...newshow];
            }
            let pattern: string | undefined;
            if ( ("pattern" in this.json.board.buffer) && (this.json.board.buffer.pattern !== undefined) && ((this.json.board.buffer.pattern as string[]).length > 0) ) {
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
                let key = "_buffer_N";
                if (this.options.rotate === 180) {
                    key = "_buffer_S";
                }
                buffN = board.rect(w, h).id(key)
                .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                .move(x, y);
            }
            // bottom
            x = grid[grid.length - 1][0].x;
            y = grid[grid.length - 1][0].y + offset;
            let buffS: SVGRect | undefined;
            if (show.includes("S")) {
                let key = "_buffer_S";
                if (this.options.rotate === 180) {
                    key = "_buffer_N";
                }
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
                let key = "_buffer_W";
                if (this.options.rotate === 180) {
                    key = "_buffer_E";
                }
                buffW = board.rect(w, h).id(key)
                .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                .move(x, y);
            }
            // right
            x = grid[0][grid[0].length - 1].x + offset;
            y = grid[0][0].y;
            let buffE: SVGRect | undefined;
            if (show.includes("E")) {
                let key = "_buffer_E";
                if (this.options.rotate === 180) {
                    key = "_buffer_W";
                }
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
        const labels = board.group().id("labels");
        let columnLabels = this.getLabels(width);
        if (this.options.rotate === 180) {
            columnLabels = columnLabels.reverse();
        }
        // Columns (letters)
        for (let col = 0; col < width; col++) {
            const pointTop = {x: grid[0][col].x, y: grid[0][col].y - (cellsize) - (show.includes("N") ? bufferwidth : 0)};
            const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + (cellsize) + (show.includes("S") ? bufferwidth : 0)};
            labels.text(columnLabels[col]).fill(baseColour).opacity(baseOpacity).center(pointTop.x, pointTop.y);
            labels.text(columnLabels[col]).fill(baseColour).opacity(baseOpacity).center(pointBottom.x, pointBottom.y);
        }

        // Rows (numbers)
        const rowLabels: string[] = [];
        if (this.options.rotate === 180) {
            for (let row = 0; row < height; row++) {
                rowLabels.push((row + 1).toString());
            }
        } else {
            for (let row = 0; row < height; row++) {
                rowLabels.push((height - row).toString());
            }
        }
        for (let row = 0; row < height; row++) {
            const pointL = {x: grid[row][0].x - (cellsize) - (show.includes("W") ? bufferwidth : 0), y: grid[row][0].y};
            const pointR = {x: grid[row][width - 1].x + (cellsize) + (show.includes("E") ? bufferwidth : 0), y: grid[row][width - 1].y};
            labels.text(rowLabels[row]).fill(baseColour).opacity(baseOpacity).center(pointL.x, pointL.y);
            labels.text(rowLabels[row]).fill(baseColour).opacity(baseOpacity).center(pointR.x, pointR.y);
        }

        // Draw grid lines
        const gridlines = board.group().id("gridlines");

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
                let thisStroke = baseStroke;
                if ( (tiley > 0) && (tileSpace === 0) && (row > 0) && (row % tiley === 0) ) {
                    thisStroke = baseStroke * 3;
                }
                const x1 = grid[row][idxLeft].x;
                const y1 = grid[row][idxLeft].y;
                const x2 = grid[row][idxRight].x;
                const y2 = grid[row][idxRight].y;
                gridlines.line(x1, y1, x2, y2).stroke({width: thisStroke, color: baseColour, opacity: baseOpacity});

                if ( (row === height - 1) || ( (tiley > 0) && (tileSpace > 0) && (row > 0) && (row % tiley === tiley - 1) ) ) {
                    const lastx1 = grid[row][idxLeft].x;
                    const lasty1 = grid[row][idxLeft].y;
                    const lastx2 = grid[row][idxRight].x;
                    const lasty2 = grid[row][idxRight].y;
                    gridlines.line(lastx1, lasty1, lastx2, lasty2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
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
                let thisStroke = baseStroke;
                if ( (tilex > 0) && (tileSpace === 0) && (col > 0) && (col % tilex === 0) ) {
                    thisStroke = baseStroke * 3;
                }
                const x1 = grid[idxTop][col].x;
                const y1 = grid[idxTop][col].y;
                const x2 = grid[idxBottom][col].x;
                const y2 = grid[idxBottom][col].y;
                gridlines.line(x1, y1, x2, y2).stroke({width: thisStroke, color: baseColour, opacity: baseOpacity});

                if ( (col === width - 1) || ( (tilex > 0) && (tileSpace > 0) && (col > 0) && (col % tilex === tilex - 1) ) ) {
                    const lastx1 = grid[idxTop][col].x;
                    const lasty1 = grid[idxTop][col].y;
                    const lastx2 = grid[idxBottom][col].x;
                    const lasty2 = grid[idxBottom][col].y;
                    gridlines.line(lastx1, lasty1, lastx2, lasty2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
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
                                const next = grid[row - 1][col + 1];
                                gridlines.line(curr.x, curr.y, next.x, next.y).stroke({width: baseStroke / 2, color: baseColour, opacity: baseOpacity});
                            }
                            // if not first column, do previous
                            if (col > colFirst) {
                                const prev = grid[row - 1][col - 1];
                                gridlines.line(curr.x, curr.y, prev.x, prev.y).stroke({width: baseStroke / 2, color: baseColour, opacity: baseOpacity});
                            }
                        }
                    }
                }
            }
        }

        if (this.options.boardClick !== undefined) {
            if ( (this.json.renderer !== "stacking-offset") && (tileSpace === 0) ) {
                const originX = grid[0][0].x;
                const originY = grid[0][0].y;
                const maxX = grid[0][grid[0].length - 1].x;
                const maxY = grid[grid.length - 1][0].y;
                const root = this.rootSvg;
                let genericCatcher = ((e: { clientX: number; clientY: number; }) => {
                    const point = root.point(e.clientX, e.clientY);
                    const x = Math.floor((point.x - (originX - (cellsize / 2))) / cellsize);
                    const y = Math.floor((point.y - (originY - (cellsize / 2))) / cellsize);
                    if (x >= 0 && x < width && y >= 0 && y < height) {
                        // try to cull double click handlers with buffer zones by making the generic handler less sensitive at the edges
                        if ( (bufferwidth === 0) || ( (point.x >= originX) && (point.x <= maxX) && (point.y >= originY) && (point.y <= maxY) ) ) {
                            this.options.boardClick!(y, x, "");
                        }
                    }
                });
                if (this.options.rotate === 180) {
                    genericCatcher = ((e: { clientX: number; clientY: number; }) => {
                        const point = root.point(e.clientX, e.clientY);
                        const x = width - Math.floor((point.x - (originX - (cellsize / 2))) / cellsize) - 1;
                        const y = height - Math.floor((point.y - (originY - (cellsize / 2))) / cellsize) - 1;
                        if (x >= 0 && x < width && y >= 0 && y < height) {
                            // try to cull double click handlers with buffer zones by making the generic handler less sensitive at the edges
                            if ( (bufferwidth === 0) || ( (point.x >= originX) && (point.x <= maxX) && (point.y >= originY) && (point.y <= maxY) ) ) {
                                this.options.boardClick!(y, x, "");
                            }
                        }
                    });
                }
                this.rootSvg.click(genericCatcher);
            } else {
                const tile = this.rootSvg.defs().rect(this.cellsize, this.cellsize).fill("#fff").opacity(0).id("_clickCatcher");
                const tiles = this.rootSvg.group().id("tiles");
                for (let row = 0; row < grid.length; row++) {
                    for (let col = 0; col < grid[row].length; col++) {
                        const {x, y} = grid[row][col];
                        const t = tiles.use(tile).dmove(x - (cellsize / 2), y - (cellsize / 2));
                        if (this.options.rotate === 180) {
                            t.click(() => this.options.boardClick!(height - row - 1, width - col - 1, ""));
                        } else {
                            t.click(() => this.options.boardClick!(row, col, ""));
                        }
                    }
                }
            }
        }
        if (this.options.rotate === 180) {
            grid = grid.map((r) => r.reverse()).reverse();
        }

        // If `go` board, add traditional nodes
        if (style === "go") {
            const pts: number[][] = [
                [3, 3], [3, 9], [3, 15],
                [9, 3], [9, 9], [9, 15],
                [15, 3], [15, 9], [15, 15],
            ];
            pts.forEach((p) => {
                const pt = grid[p[0]][p[1]];
                gridlines.circle(baseStroke * 10)
                    .fill(baseColour)
                    .opacity(baseOpacity)
                    .stroke({width: 0})
                    .center(pt.x, pt.y);
            });
        }

        this.markBoard(gridlines, grid);

        return grid;
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates rectangular fields of hexes in various orientations.
     * It relies on a third-party library to do the heavy lifting.
     *
     * @returns A map of row/column locations to x,y coordinate
     */
    protected rectOfHex(): GridPoints {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("width" in this.json.board)) || (! ("height" in this.json.board)) || (this.json.board.width === undefined) || (this.json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        const width: number = this.json.board.width as number;
        const height: number = this.json.board.height as number;
        const cellsize = this.cellsize * 0.8;
        const style = this.json.board.style;

        let baseStroke = 1;
        let baseColour = "#000";
        let baseOpacity = 1;
        if ( ("strokeWeight" in this.json.board) && (this.json.board.strokeWeight !== undefined) ) {
            baseStroke = this.json.board.strokeWeight;
        }
        if ( ("strokeColour" in this.json.board) && (this.json.board.strokeColour !== undefined) ) {
            baseColour = this.json.board.strokeColour;
        }
        if ( ("strokeOpacity" in this.json.board) && (this.json.board.strokeOpacity !== undefined) ) {
            baseOpacity = this.json.board.strokeOpacity;
        }

        // Get a grid of points
        let orientation = Orientation.POINTY;
        if (style.endsWith("f")) {
            orientation = Orientation.FLAT;
        }
        let offset: HexOffset = -1;
        if (style.includes("-even")) {
            offset = 1;
        }
        if (this.options.rotate === 180) {
            offset = -1;
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const myHex = defineHex({
            offset,
            orientation,
            dimensions: cellsize,
        });
        const grid = new Grid(myHex, rectangle({width, height}));
        const corners = grid.getHex({col: 0, row: 0})!.corners;
        // eslint-disable-next-line no-console
        console.log(`Source corners: ${JSON.stringify(corners)}`);
        const hexSymbol = this.rootSvg.symbol()
            .polygon(corners.map(({ x, y }) => `${x},${y}`).join(" "))
            .fill("white").opacity(1)
            .stroke({ width: baseStroke, color: baseColour, opacity: baseOpacity });

        const board = this.rootSvg.group().id("board");
        const labels = this.rootSvg.group().id("labels");
        // const rect = grid.rectangle({width, height});
        const fontSize = this.cellsize / 5;
        for (const hex of grid) {
            const { x, y } = hex;
            const used = board.use(hexSymbol).translate(x, y);
            let label = this.coords2algebraicHex(hex.col, hex.row, height);
            if (this.options.rotate === 180) {
                label = this.coords2algebraicHex(width - hex.col - 1, height - hex.row - 1, height);
            }
            labels.text(label)
            .font({
                anchor: "middle",
                fill: baseStroke,
                size: fontSize,
            })
            // .center(cx, cy);
            .center(corners[5].x, corners[5].y)
            .translate(x, y + fontSize);
            if (this.options.boardClick !== undefined) {
                if (this.options.rotate === 180) {
                    used.click(() => this.options.boardClick!(height - hex.row - 1, width - hex.col - 1, ""));
                } else {
                    used.click(() => this.options.boardClick!(hex.row, hex.col, ""));
                }
            }
        }

        let gridPoints: GridPoints = [];
        // const {x: cx, y: cy} = grid.getHex({col: 0, row: 0})!.center;
        for (let y = 0; y < 9; y++) {
            const node: IPoint[] = [];
            for (let x = 0; x < 9; x++) {
                const hex = grid.getHex({col: x, row: y});
                if (hex === undefined) {
                    throw new Error();
                }
                // const pt = hex.toPoint();
                // node.push({x: hex.x + cx, y: hex.y + cy} as IPoint);
                node.push({x: hex.x, y: hex.y} as IPoint);
            }
            gridPoints.push(node);
        }

        if (this.options.rotate === 180) {
            gridPoints = gridPoints.map((r) => r.reverse()).reverse();
        }
        this.markBoard(board, gridPoints);

        return gridPoints;
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
        const width: number = this.json.board.width as number;
        const height: number = this.json.board.height as number;
        const cellsize = this.cellsize;

        let baseStroke = 1;
        let baseColour = "#000";
        let baseOpacity = 1;
        if ( ("strokeWeight" in this.json.board) && (this.json.board.strokeWeight !== undefined) ) {
            baseStroke = this.json.board.strokeWeight;
        }
        if ( ("strokeColour" in this.json.board) && (this.json.board.strokeColour !== undefined) ) {
            baseColour = this.json.board.strokeColour;
        }
        if ( ("strokeOpacity" in this.json.board) && (this.json.board.strokeOpacity !== undefined) ) {
            baseOpacity = this.json.board.strokeOpacity;
        }

        // Get a grid of points
        let grid = snubsquare({gridHeight: height, gridWidth: width, cellSize: cellsize});
        const board = this.rootSvg.group().id("board");

        // Add board labels
        const labels = board.group().id("labels");
        let columnLabels = this.getLabels(width);
        if (this.options.rotate === 180) {
            columnLabels = columnLabels.reverse();
        }
        // Columns (letters)
        for (let col = 0; col < width; col++) {
            const pointTop = {x: grid[0][col].x, y: grid[0][col].y - cellsize};
            const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + cellsize};
            labels.text(columnLabels[col]).fill(baseColour).opacity(baseOpacity).center(pointTop.x, pointTop.y);
            labels.text(columnLabels[col]).fill(baseColour).opacity(baseOpacity).center(pointBottom.x, pointBottom.y);
        }

        // Rows (numbers)
        const rowLabels: string[] = [];
        if (this.options.rotate === 180) {
            for (let row = 0; row < height; row++) {
                rowLabels.push((row + 1).toString());
            }
        } else {
            for (let row = 0; row < height; row++) {
                rowLabels.push((height - row).toString());
            }
        }
        for (let row = 0; row < height; row++) {
            const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
            const pointR = {x: grid[row][width - 1].x + cellsize, y: grid[row][width - 1].y};
            labels.text(rowLabels[row]).fill(baseColour).opacity(baseOpacity).center(pointL.x, pointL.y);
            labels.text(rowLabels[row]).fill(baseColour).opacity(baseOpacity).center(pointR.x, pointR.y);
        }

        // Draw grid lines
        const gridlines = board.group().id("gridlines");
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
                    gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
                }

                if (row > 0) {
                    // always connect to cell directly above
                    let prev = grid[row - 1][col];
                    let x1 = curr.x;
                    let y1 = curr.y;
                    let x2 = prev.x;
                    let y2 = prev.y;
                    gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
                    // even row, odd columns connect as well to previous-above cell
                    if ( ( (row % 2) === 0) && ( (col % 2) !== 0) ) {
                        prev = grid[row - 1][col - 1];
                        x1 = curr.x;
                        y1 = curr.y;
                        x2 = prev.x;
                        y2 = prev.y;
                        gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
                    // odd row, odd columns connect as well to previous-next cell
                    } else if ( ((row % 2) !== 0) && ((col % 2) !== 0) && (col < (width - 1)) ) {
                        prev = grid[row - 1][col + 1];
                        x1 = curr.x;
                        y1 = curr.y;
                        x2 = prev.x;
                        y2 = prev.y;
                        gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
                    }
                }
            }
        }

        if (this.options.boardClick !== undefined) {
            const root = this.rootSvg;
            const genericCatcher = ((e: { clientX: number; clientY: number; }) => {
                const point = root.point(e.clientX, e.clientY);
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

        if (this.options.rotate === 180) {
            grid = grid.map((r) => r.reverse()).reverse();
        }
        this.markBoard(gridlines, grid);

        return grid;
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
        const minWidth: number = this.json.board.minWidth as number;
        const maxWidth: number = this.json.board.maxWidth as number;
        const cellsize = this.cellsize;
        const height = ((maxWidth - minWidth) * 2) + 1;

        let baseStroke = 1;
        let baseColour = "#000";
        let baseOpacity = 1;
        if ( ("strokeWeight" in this.json.board) && (this.json.board.strokeWeight !== undefined) ) {
            baseStroke = this.json.board.strokeWeight;
        }
        if ( ("strokeColour" in this.json.board) && (this.json.board.strokeColour !== undefined) ) {
            baseColour = this.json.board.strokeColour;
        }
        if ( ("strokeOpacity" in this.json.board) && (this.json.board.strokeOpacity !== undefined) ) {
            baseOpacity = this.json.board.strokeOpacity;
        }

        // Get a grid of points
        let grid = hexOfTri({gridWidthMin: minWidth, gridWidthMax: maxWidth, cellSize: cellsize});
        const board = this.rootSvg.group().id("board");

        // Add board labels
        const labels = board.group().id("labels");

        // Rows (numbers)
        let columnLabels = this.getLabels(maxWidth);
        if (this.options.rotate === 180) {
            columnLabels = columnLabels.reverse();
        }

        for (let row = 0; row < height; row++) {
            let leftNum = "1";
            let rightNum = grid[row].length.toString();
            if (this.options.rotate === 180) {
                leftNum = rightNum;
                rightNum = "1";
            }
            const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
            const pointR = {x: grid[row][grid[row].length - 1].x + cellsize, y: grid[row][grid[row].length - 1].y};
            labels.text(columnLabels[height - row - 1] + leftNum).fill(baseColour).opacity(baseOpacity).center(pointL.x, pointL.y);
            labels.text(columnLabels[height - row - 1] + rightNum).fill(baseColour).opacity(baseOpacity).center(pointR.x, pointR.y);
        }

        // Draw grid lines
        const gridlines = board.group().id("gridlines");
        const midrow = maxWidth - minWidth;

        for (let row = 0; row < grid.length; row++) {
            const currRow = grid[row];
            for (let col = 0; col < grid[row].length; col++) {
                const curr = currRow[col];

                // always connect to cell to the left
                if (col > 0) {
                    const prev = currRow[col - 1];
                    const x1 = curr.x;
                    const y1 = curr.y;
                    const x2 = prev.x;
                    const y2 = prev.y;
                    gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
                }

                // connections are build upward, so only continue with rows after the first
                if (row > 0) {
                    // always connect to the cell directly above, if one exists
                    if (col <= grid[row - 1].length - 1) {
                        const prev = grid[row - 1][col];
                        const x1 = curr.x;
                        const y1 = curr.y;
                        const x2 = prev.x;
                        const y2 = prev.y;
                        gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
                    }
                    // up to and including the midline, connect to the above-previous cell if there is one
                    if ( (row <= midrow) && (col > 0) ) {
                        const prev = grid[row - 1][col - 1];
                        const x1 = curr.x;
                        const y1 = curr.y;
                        const x2 = prev.x;
                        const y2 = prev.y;
                        gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
                    }
                    // after the midline, connect to the above-next cell instead
                    if (row > midrow) {
                        const prev = grid[row - 1][col + 1];
                        const x1 = curr.x;
                        const y1 = curr.y;
                        const x2 = prev.x;
                        const y2 = prev.y;
                        gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
                    }
                }
            }
        }

        if (this.options.boardClick !== undefined) {
            const root = this.rootSvg;
            const genericCatcher = ((e: { clientX: number; clientY: number; }) => {
                const point = root.point(e.clientX, e.clientY);
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

        if (this.options.rotate === 180) {
            grid = grid.map((r) => r.reverse()).reverse();
        }
        this.markBoard(gridlines, grid);

        return grid;
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates a hexagonal field of circles.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected hexOfCir(): GridPoints {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("minWidth" in this.json.board)) || (! ("maxWidth" in this.json.board)) || (this.json.board.minWidth === undefined) || (this.json.board.maxWidth === undefined) ) {
            throw new Error("Both the `minWidth` and `maxWidth` properties are required for this board type.");
        }
        const minWidth: number = this.json.board.minWidth as number;
        const maxWidth: number = this.json.board.maxWidth as number;
        const cellsize = this.cellsize;
        const height = ((maxWidth - minWidth) * 2) + 1;

        let baseStroke = 1;
        let baseColour = "#000";
        let baseOpacity = 1;
        if ( ("strokeWeight" in this.json.board) && (this.json.board.strokeWeight !== undefined) ) {
            baseStroke = this.json.board.strokeWeight;
        }
        if ( ("strokeColour" in this.json.board) && (this.json.board.strokeColour !== undefined) ) {
            baseColour = this.json.board.strokeColour;
        }
        if ( ("strokeOpacity" in this.json.board) && (this.json.board.strokeOpacity !== undefined) ) {
            baseOpacity = this.json.board.strokeOpacity;
        }

        // Get a grid of points
        let grid = hexOfCir({gridWidthMin: minWidth, gridWidthMax: maxWidth, cellSize: cellsize});
        const board = this.rootSvg.group().id("board");

        // Add board labels
        const labels = board.group().id("labels");

        // Rows (numbers)
        let columnLabels = this.getLabels(maxWidth);
        if (this.options.rotate === 180) {
            columnLabels = columnLabels.reverse();
        }
        for (let row = 0; row < height; row++) {
            let leftNum = "1";
            let rightNum = grid[row].length.toString();
            if (this.options.rotate === 180) {
                leftNum = rightNum;
                rightNum = "1";
            }
            const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
            const pointR = {x: grid[row][grid[row].length - 1].x + cellsize, y: grid[row][grid[row].length - 1].y};
            labels.text(columnLabels[height - row - 1] + leftNum).fill(baseColour).opacity(baseOpacity).center(pointL.x, pointL.y);
            labels.text(columnLabels[height - row - 1] + rightNum).fill(baseColour).opacity(baseOpacity).center(pointR.x, pointR.y);
        }

        // Draw circles
        const gridlines = board.group().id("circles");
        const circle = this.rootSvg.defs().symbol().viewbox(0, 0, cellsize, cellsize);
        circle.circle(cellsize)
            .fill({color: "black", opacity: 0})
            .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke});
        for (let iRow = 0; iRow < grid.length; iRow++) {
            const row = grid[iRow];
            for (let iCol = 0; iCol < row.length; iCol++) {
                const p = row[iCol];
                const c = gridlines.use(circle).size(cellsize, cellsize).center(p.x, p.y);
                if (this.options.boardClick !== undefined) {
                    if (this.options.rotate === 180) {
                        c.click(() => this.options.boardClick!(grid.length - iRow - 1, row.length - iCol - 1, ""));
                    } else {
                        c.click(() => this.options.boardClick!(iRow, iCol, ""));
                    }
                }
            }
        }

        if (this.options.rotate === 180) {
            grid = grid.map((r) => r.reverse()).reverse();
        }
        this.markBoard(gridlines, grid);

        return grid;
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates a hexagonal field of hexes. Unlike {@link rectOfHex}, this does not require any third-party library.
     *
     * @returns A map of row/column locations to x,y coordinates
     */
    protected hexOfHex(): GridPoints {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("minWidth" in this.json.board)) || (! ("maxWidth" in this.json.board)) || (this.json.board.minWidth === undefined) || (this.json.board.maxWidth === undefined) ) {
            throw new Error("Both the `minWidth` and `maxWidth` properties are required for this board type.");
        }
        const minWidth: number = this.json.board.minWidth as number;
        const maxWidth: number = this.json.board.maxWidth as number;
        const cellsize = this.cellsize;
        const height = ((maxWidth - minWidth) * 2) + 1;

        let baseStroke = 1;
        let baseColour = "#000";
        let baseOpacity = 1;
        if ( ("strokeWeight" in this.json.board) && (this.json.board.strokeWeight !== undefined) ) {
            baseStroke = this.json.board.strokeWeight;
        }
        if ( ("strokeColour" in this.json.board) && (this.json.board.strokeColour !== undefined) ) {
            baseColour = this.json.board.strokeColour;
        }
        if ( ("strokeOpacity" in this.json.board) && (this.json.board.strokeOpacity !== undefined) ) {
            baseOpacity = this.json.board.strokeOpacity;
        }

        // Get a grid of points
        let grid = hexOfHex({gridWidthMin: minWidth, gridWidthMax: maxWidth, cellSize: cellsize});
        const board = this.rootSvg.group().id("board");

        // Add board labels
        const labels = board.group().id("labels");

        // Rows (numbers)
        let columnLabels = this.getLabels(maxWidth);
        if (this.options.rotate === 180) {
            columnLabels = columnLabels.reverse();
        }
        for (let row = 0; row < height; row++) {
            let leftNum = "1";
            let rightNum = grid[row].length.toString();
            if (this.options.rotate === 180) {
                leftNum = rightNum;
                rightNum = "1";
            }
            const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
            const pointR = {x: grid[row][grid[row].length - 1].x + cellsize, y: grid[row][grid[row].length - 1].y};
            labels.text(columnLabels[height - row - 1] + leftNum).fill(baseColour).opacity(baseOpacity).center(pointL.x, pointL.y);
            labels.text(columnLabels[height - row - 1] + rightNum).fill(baseColour).opacity(baseOpacity).center(pointR.x, pointR.y);
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
        const triWidth = 50 / 2;
        const half = triWidth / 2;
        const triHeight = (triWidth * Math.sqrt(3)) / 2;

        const gridlines = board.group().id("hexes");
        const hex = this.rootSvg.defs().symbol().viewbox(-3.3493649053890344, 0, 50, 50);
        hex.polygon(`${triHeight},0 ${triHeight * 2},${half} ${triHeight * 2},${half + triWidth} ${triHeight},${triWidth * 2} 0,${half + triWidth} 0,${half}`)
            .fill({color: "black", opacity: 0})
            .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke});
        for (let iRow = 0; iRow < grid.length; iRow++) {
            const row = grid[iRow];
            for (let iCol = 0; iCol < row.length; iCol++) {
                const p = row[iCol];
                const c = gridlines.use(hex).size(cellsize, cellsize).center(p.x, p.y);
                if (this.options.boardClick !== undefined) {
                    if (this.options.rotate === 180) {
                        c.click(() => this.options.boardClick!(grid.length - iRow - 1, row.length - iCol - 1, ""));
                    } else {
                        c.click(() => this.options.boardClick!(iRow, iCol, ""));
                    }
                }
            }
        }
        if (this.options.rotate === 180) {
            grid = grid.map((r) => r.reverse()).reverse();
        }
        this.markBoard(gridlines, grid);

        return grid;
    }

    /**
     * This is what applies annotations to a finished board.
     * Annotations are applied at the end, and so overlay pieces.
     *
     * @param grid - A map of row/column locations to x,y coordinates
     */
    protected annotateBoard(grid: GridPoints) {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        if ( ("annotations" in this.json) && (this.json.annotations !== undefined) ) {
            const notes = this.rootSvg.group().id("annotations");
            const rIncrement = this.cellsize / 2;
            let radius = rIncrement;
            let direction = 1;
            for (const note of this.json.annotations) {
                if ( (note.type !== undefined) && (note.type === "move") ) {
                    if ((note.targets as any[]).length < 2) {
                        throw new Error("Move annotations require at least two 'targets'.");
                    }

                    let colour = "#000";
                    if ( ("colour" in note) && (note.colour !== undefined) ) {
                        colour = note.colour as string;
                    } else if ( ("player" in note) && (note.player !== undefined) ) {
                        colour = this.options.colours[(note.player as number) - 1];
                    }
                    let style = "solid";
                    if ( ("style" in note) && (note.style !== undefined) ) {
                        style = note.style as string;
                    }
                    let arrow = true;
                    if ( ("arrow" in note) && (note.arrow !== undefined)) {
                        arrow = note.arrow as boolean;
                    }
                    let opacity = 1;
                    if ( ("opacity" in note) && (note.opacity !== undefined) ) {
                        opacity = note.opacity as number;
                    }

                    // const markerArrow = notes.marker(5, 5, (add) => add.path("M 0 0 L 10 5 L 0 10 z"));
                    const markerArrow = notes.marker(4, 4, (add) => add.path("M0,0 L4,2 0,4").fill(colour));
                    const markerCircle = notes.marker(2, 2, (add) => add.circle(2).fill(colour));
                    const points: string[] = [];
                    for (const node of (note.targets as ITarget[])) {
                        const pt = grid[node.row][node.col];
                        points.push(`${pt.x},${pt.y}`);
                    }
                    const stroke: StrokeData = {
                        color: colour,
                        opacity,
                        width: this.cellsize * 0.03,
                    };
                    if (style === "dashed") {
                        stroke.dasharray = "4";
                    }
                    const line = notes.polyline(points.join(" ")).stroke(stroke).fill("none");
                    line.marker("start", markerCircle);
                    if (arrow) {
                        line.marker("end", markerArrow);
                    } else {
                        line.marker("end", markerCircle);
                    }
                } else if ( (note.type !== undefined) && (note.type === "eject") ) {
                    if ((note.targets as any[]).length !== 2) {
                        throw new Error("Eject annotations require exactly two 'targets'.");
                    }

                    let colour = "#000";
                    if ( ("colour" in note) && (note.colour !== undefined) ) {
                        colour = note.colour as string;
                    } else if ( ("player" in note) && (note.player !== undefined) ) {
                        colour = this.options.colours[(note.player as number) - 1];
                    }
                    let style = "dashed";
                    if ( ("style" in note) && (note.style !== undefined) ) {
                        style = note.style as string;
                    }
                    let arrow = false;
                    if ( ("arrow" in note) && (note.arrow !== undefined)) {
                        arrow = note.arrow as boolean;
                    }
                    let opacity = 0.5;
                    if ( ("opacity" in note) && (note.opacity !== undefined) ) {
                        opacity = note.opacity as number;
                    }

                    // const markerArrow = notes.marker(5, 5, (add) => add.path("M 0 0 L 10 5 L 0 10 z"));
                    const markerArrow = notes.marker(4, 4, (add) => add.path("M0,0 L4,2 0,4").fill(colour));
                    const markerCircle = notes.marker(2, 2, (add) => add.circle(2).fill(colour));
                    const [from, to] = note.targets as ITarget[];
                    const ptFrom = grid[from.row][from.col];
                    const ptTo = grid[to.row][to.col];
                    const ptCtr = this.getArcCentre(ptFrom, ptTo, radius * direction);
                    const stroke: StrokeData = {
                        color: colour,
                        opacity,
                        width: this.cellsize * 0.03,
                    };
                    if (style === "dashed") {
                        stroke.dasharray = "4";
                    }
                    const line = notes.path(`M ${ptFrom.x} ${ptFrom.y} C ${ptCtr.x} ${ptCtr.y} ${ptCtr.x} ${ptCtr.y} ${ptTo.x} ${ptTo.y}`).stroke(stroke).fill("none");
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
                    let colour = "#000";
                    if ( ("colour" in note) && (note.colour !== undefined) ) {
                        colour = note.colour as string;
                    } else if ( ("player" in note) && (note.player !== undefined) ) {
                        colour = this.options.colours[(note.player as number) - 1];
                    }
                    for (const node of (note.targets as ITarget[])) {
                        const pt = grid[node.row][node.col];
                        notes.rect(this.cellsize, this.cellsize)
                            .fill("none")
                            .stroke({color: colour, width: this.cellsize * 0.05, dasharray: "4"})
                            .center(pt.x, pt.y);
                    }
                } else if ( (note.type !== undefined) && (note.type === "exit") ) {
                    let colour = "#000";
                    if ( ("colour" in note) && (note.colour !== undefined) ) {
                        colour = note.colour as string;
                    } else if ( ("player" in note) && (note.player !== undefined) ) {
                        colour = this.options.colours[(note.player as number) - 1];
                    }
                    for (const node of (note.targets as ITarget[])) {
                        const pt = grid[node.row][node.col];
                        notes.rect(this.cellsize, this.cellsize)
                            .fill("none")
                            .stroke({color: colour, width: this.cellsize * 0.05, dasharray: "4"})
                            .center(pt.x, pt.y);
                    }
                } else if ( (note.type !== undefined) && (note.type === "dots") ) {
                    let colour = "#000";
                    if ( ("colour" in note) && (note.colour !== undefined) ) {
                        colour = note.colour as string;
                    } else if ( ("player" in note) && (note.player !== undefined) ) {
                        colour = this.options.colours[(note.player as number) - 1];
                    }
                    let opacity = 1;
                    if ( ("opacity" in note) && (note.opacity !== undefined) ) {
                        opacity = note.opacity as number;
                    }
                    for (const node of (note.targets as ITarget[])) {
                        const pt = grid[node.row][node.col];
                        notes.circle(this.cellsize * 0.2)
                            .fill(colour)
                            .opacity(opacity)
                            .stroke({width: 0})
                            .center(pt.x, pt.y);
                    }
                } else {
                    throw new Error(`The requested annotation (${ note.type as string }) is not supported.`);
                }
            }
        }
    }

    /**
     * Markers are placed right after the board itself is generated, and so are obscured by placed pieces.
     *
     * @param svgGroup - The SVG `<group>` you want to add the markers too. This is just for the sake of organization.
     * @param grid - The map of row/column to x/y created by one of the grid point generators.
     * @param gridExpanded - Square maps need to be expanded a little for all the markers to work. If provided, this is what will be used.
     */
    protected markBoard(svgGroup: SVGG, grid: GridPoints, gridExpanded?: GridPoints): void {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        if ( ("board" in this.json) && (this.json.board !== undefined) && ("markers" in this.json.board!) && (this.json.board.markers !== undefined) && (Array.isArray(this.json.board.markers)) && (this.json.board.markers.length > 0) ) {
            let baseStroke = 1;
            let baseColour = "#000";
            let baseOpacity = 1;
            if ( ("strokeWeight" in this.json.board) && (this.json.board.strokeWeight !== undefined) ) {
                baseStroke = this.json.board.strokeWeight;
            }
            if ( ("strokeColour" in this.json.board) && (this.json.board.strokeColour !== undefined) ) {
                baseColour = this.json.board.strokeColour;
            }
            if ( ("strokeOpacity" in this.json.board) && (this.json.board.strokeOpacity !== undefined) ) {
                baseOpacity = this.json.board.strokeOpacity;
            }

            for (const marker of this.json.board.markers) {
                if (marker.type === "dots") {
                    const pts: [number, number][] = [];
                    for (const point of marker.points as ITarget[]) {
                        pts.push([point.row, point.col]);
                        pts.forEach((p) => {
                            const pt = grid[p[0]][p[1]];
                            svgGroup.circle(baseStroke * 10)
                                .fill(baseColour)
                                .opacity(baseOpacity)
                                .stroke({width: 0})
                                .center(pt.x, pt.y);
                        });
                    }
                } else if (marker.type === "shading") {
                    let colour = "#000";
                    if ( ("colour" in marker) && (marker.colour !== undefined) ) {
                        if (typeof marker.colour === "number") {
                            colour = this.options.colours[marker.colour - 1];
                        } else {
                            colour = marker.colour as string;
                        }
                    }
                    let opacity = 0.25;
                    if ( ("opacity" in marker) && (marker.opacity !== undefined) ) {
                        opacity = marker.opacity as number;
                    }
                    const points: [number, number][] = [];
                    if ( (this.json.board.style.startsWith("squares")) && (gridExpanded !== undefined) ) {
                        for (const point of marker.points as ITarget[]) {
                            points.push([gridExpanded[point.row][point.col].x, gridExpanded[point.row][point.col].y]);
                        }
                    } else {
                        for (const point of marker.points as ITarget[]) {
                            points.push([grid[point.row][point.col].x, grid[point.row][point.col].y]);
                        }
                    }
                    const ptstr = points.map((p) => p.join(",")).join(" ");
                    svgGroup.polygon(ptstr).fill(colour).opacity(opacity);
                } else if (marker.type === "edge") {
                    let colour = "#000";
                    if ( ("colour" in marker) && (marker.colour !== undefined) ) {
                        if (typeof marker.colour === "number") {
                            colour = this.options.colours[marker.colour - 1];
                        } else {
                            colour = marker.colour as string;
                        }
                    }
                    const opacity = baseOpacity + ((1 - baseOpacity) / 2);
                    const style = this.json.board.style;
                    if ( (style === "vertex") || (style === "vertex-cross") || (style === "go") ) {
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
                        svgGroup.line(xFrom, yFrom, xTo, yTo).stroke({width: baseStroke * 3, color: colour, opacity});
                    } else if ( (style.startsWith("squares")) && (gridExpanded !== undefined) ) {
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
                        svgGroup.line(xFrom, yFrom, xTo, yTo).stroke({width: baseStroke * 3, color: colour, opacity});
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
                        svgGroup.line(xFrom, yFrom, xTo, yTo).stroke({width: baseStroke * 3, color: colour, opacity});
                    }
                } else if (marker.type === "fence") {
                    let colour = "#000";
                    if ( ("colour" in marker) && (marker.colour !== undefined) ) {
                        if (typeof marker.colour === "number") {
                            colour = this.options.colours[marker.colour - 1];
                        } else {
                            colour = marker.colour as string;
                        }
                    }
                    const style = this.json.board.style;
                    if ( (style.startsWith("squares")) && (gridExpanded !== undefined) ) {
                        const row = marker.cell.row as number;
                        const col = marker.cell.col as number;
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
                        svgGroup.line(xFrom, yFrom, xTo, yTo).stroke({width: baseStroke * 6, color: colour});
                    }
                } else if (marker.type === "glyph") {
                    const key = marker.glyph as string;
                    const piece = svgGroup.root().findOne("#" + key) as Svg;
                    if ( (piece === null) || (piece === undefined) ) {
                        throw new Error(`Could not find the requested piece (${key}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
                    }
                    let sheetCellSize = piece.viewbox().h;
                    if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                        sheetCellSize = piece.attr("data-cellsize") as number;
                        if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                            throw new Error(`The glyph you requested (${key}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                        }
                    }
                    for (const pt of marker.points as ITarget[]) {
                        const point = grid[pt.row][pt.col];
                        const use = svgGroup.use(piece);
                        const newx = point.x - this.cellsize / 2;
                        const newy = point.y - this.cellsize / 2;
                        use.dmove(newx, newy);
                        use.scale(this.cellsize / sheetCellSize, newx, newy);
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
    private getArcCentre(from: IPoint, to: IPoint, delta: number): IPoint {
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
    protected getLabels(arg1: number, arg2?: number) : string[] {
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

    /**
     * An internal helper function for producing labels for hex fields.
     *
     * @param x - The column number
     * @param y - The row number
     * @param height - The total height of the field
     * @returns A string label for the hex
     */
    protected coords2algebraicHex(x: number, y: number, height: number): string {
        const [label] = this.getLabels(height - y - 1, 1);
        return label + (x + 1).toString();
    }

    /**
     * Generates the button bar and then places it appropriately.
     *
     * @param grid - The grid of points; used for positioning.
     * @param position - If given, overrides the JSON setting.
     */
    protected placeButtonBar(grid: GridPoints, position?: "left"|"right"): void {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Invalid object state.");
        }
        if ( ("areas" in this.json) && (this.json.areas !== undefined) && (Array.isArray(this.json.areas)) && (this.json.areas.length > 0) ) {
            const bars = this.json.areas.filter((b) => b.type === "buttonBar") as IButtonBar[];
            if (bars.length > 1) {
                throw new Error("Only one button bar may be defined.");
            }
            if (bars.length === 1) {
                const bar = bars[0];
                const barimg = this.buildButtonBar(bar);
                const y = grid[0][0].y - this.cellsize;
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
                    x = grid[0][0].x - (this.cellsize * 2) - barimg.viewbox().w;
                } else {
                    x = grid[0][grid.length - 1].x + (this.cellsize * 2);
                }
                const used = this.rootSvg.use(barimg).size(barimg.viewbox().w, barimg.viewbox().h).dmove(x, y);
                if (this.options.boardClick !== undefined) {
                    const top = used.y() as number;
                    const height = used.height() as number;
                    const numButtons = bar.buttons.length;
                    const btnHeight = height / numButtons;
                    used.click((e: { clientX: number; clientY: number; }) => {
                        const point = used.point(e.clientX, e.clientY);
                        const yRelative = point.y - top;
                        const row = Math.floor(yRelative / btnHeight);
                        if ( (row >= 0) && (row < numButtons) ) {
                            let value = bar.buttons[row].label;
                            if(bar.buttons[row].value !== undefined) {
                                value = bar.buttons[row].value!;
                            }
                            this.options.boardClick!(-1, -1, `_btn_${value}`);
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
    protected buildButtonBar(bar: IButtonBar): Svg {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Invalid object state.");
        }

        // initialize values
        let colour = "#000";
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
            const tmptxt = this.rootSvg.text(b.label).font({size: 17, fill: colour, anchor: "start"});
            if (b.attributes !== undefined) {
                for (const a of b.attributes) {
                    tmptxt.attr(a.name, a.value);
                }
            }
            maxWidth = Math.max(maxWidth, tmptxt.bbox().width);
            maxHeight = Math.max(maxHeight, tmptxt.bbox().height);
            const symtxt = nested.symbol();
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
        const symrect = nested.symbol();
        symrect.rect(width, height).fill({opacity: 0}).stroke({width: 1, color: colour});
        // Adding the viewbox triggers auto-filling, auto-centering behaviour that we don't want
        // symrect.viewbox(-1, -1, width + 2, height + 1);

        // Composite each into a group, all at 0,0
        const groups: Svg[] = [];
        for (let i = 0; i < labels.length; i++) {
            const b = bar.buttons[i];
            const symlabel = labels[i];
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
    protected placeKey(grid: GridPoints, position?: "left"|"right"): void {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Invalid object state.");
        }
        if ( ("areas" in this.json) && (this.json.areas !== undefined) && (Array.isArray(this.json.areas)) && (this.json.areas.length > 0) ) {
            const keys = this.json.areas.filter((b) => b.type === "key") as IKey[];
            if (keys.length > 1) {
                throw new Error("Only one key may be defined.");
            }
            if (keys.length === 1) {
                const key = keys[0];
                const keyimg = this.buildKey(key);
                const y = grid[0][0].y - this.cellsize;
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
                    x = grid[0][0].x - (this.cellsize * 2) - keyimg.viewbox().w;
                } else {
                    x = grid[0][grid.length - 1].x + (this.cellsize * 2);
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
    protected buildKey(key: IKey): Svg {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Invalid object state.");
        }

        // initialize values
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
            const tmptxt = this.rootSvg.text(k.name).font({size: 17, fill: "#000", anchor: "start"});
            maxWidth = Math.max(maxWidth, tmptxt.bbox().width);
            maxHeight = Math.max(maxHeight, tmptxt.bbox().height);
            const symtxt = nested.symbol();
            symtxt.text(k.name).font({size: 17, fill: "#000", anchor: "start"});
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
            g.use(piece).size(height, height);
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
}
