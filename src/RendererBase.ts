// import svg, { Nested } from "@svgdotjs/svg.js";
import svg from "svg.js";
// import { GridPoints } from "./GridGenerator";
// import { rectOfSquares } from "./grids";
import { APRenderRep } from "./schema";
import { sheets } from "./sheets";

export interface IRendererOptionsIn {
    sheetList?: string[];
    colours?: string[];
    patterns?: boolean;
    patternList?: string[];
    colourBlind?: boolean;
}

export interface IRendererOptionsOut {
    sheetList: string[];
    colours: string[];
    patterns: boolean;
    patternList: string[];
    colourBlind: boolean;
}

export abstract class RendererBase {
    public readonly name: string;
    public readonly coloursBasic = ["#e41a1c", "#377eb8", "#4daf4a", "#ffff33", "#984ea3", "#ff7f00", "#a65628", "#f781bf", "#999999"];
    public readonly coloursBlind = ["#a6611a", "#80cdc1", "#dfc27d", "#018571"];
    public readonly patternNames = ["microbial", "chevrons", "honeycomb", "triangles", "wavy", "slant", "dots", "starsWhite", "cross", "houndstooth"];
    protected readonly columnLabels = "abcdefghijklmnopqrstuvwxyz".split("");
    protected readonly cellsize = 50;

    constructor(name = "default") {
        this.name = name;
    }

    public abstract render(json: APRenderRep, draw: svg.Doc, opts: IRendererOptionsIn): void;

    protected jsonPrechecks(json: APRenderRep): APRenderRep {
        // Check for missing renderer
        if (json.renderer === undefined) {
            json.renderer = "default";
        }

        // Make sure the JSON is intended for you
        if (json.renderer !== this.name) {
            throw new Error(`Renderer mismatch. The JSON data you provided is intended for the "${json.renderer}" renderer, but the "${this.name}" renderer received it.`);
        }

        return json;
    }

    protected optionsPrecheck(opts: IRendererOptionsIn): IRendererOptionsOut {
        const newOpts: IRendererOptionsOut = {sheetList: ["core", "chess", "piecepack"], colourBlind: false, colours: this.coloursBasic, patterns: false, patternList: this.patternNames};

        // Check colour blindness
        if (opts.colourBlind !== undefined) {
            newOpts.colourBlind = opts.colourBlind;
            if (newOpts.colourBlind) {
                newOpts.colours = this.coloursBlind;
            }
        }

        // Validate sheet list
        if ( (opts.sheetList !== undefined) && (opts.sheetList.length > 0) ) {
            for (const name of opts.sheetList) {
                if (! sheets.has(name)) {
                    throw new Error(`A glyph sheet you requested could not be found: ${ name }`);
                }
            }
            newOpts.sheetList = opts.sheetList;
        }

        // Validate patterns settings
        newOpts.patterns = false;
        if (opts.patterns) {
            newOpts.patterns = true;
            // Validate pattern list if given
            if ( (opts.patternList !== undefined) && (opts.patternList.length > 0) ) {
                for (const name of opts.patternList) {
                    if (this.patternNames.indexOf(name) < 0) {
                        throw new Error(`A pattern you requested could not be found: ${ name }`);
                    }
                }
                newOpts.patternList = opts.patternList;
            } else {
                newOpts.patternList = this.patternNames;
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
            newOpts.colours = opts.colours;
        }

        return newOpts;
    }

    protected loadPattern(name: string, canvas: svg.Doc): void {
        // Keep in alphabetical order.
        // If you change any `id`s, you need to change them in the `patternsBW` property, too.

        switch (name) {
            case "chevrons":
                canvas.defs().svg("<pattern id='chevrons' patternUnits='userSpaceOnUse' width='30' height='15' viewbox='0 0 60 30'><svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='60' height='30'><defs><rect id='r' width='30' height='15' fill='#fff' stroke-width='2.5' stroke='#000'/><g id='p'><use xlink:href='#r'/><use y='15' xlink:href='#r'/><use y='30' xlink:href='#r'/><use y='45' xlink:href='#r'/></g></defs><use xlink:href='#p' transform='translate(0 -25) skewY(40)'/><use xlink:href='#p' transform='translate(30 0) skewY(-40)'/></svg></pattern>");
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

    protected loadGlyph(glyph: string, sheetList: string[], canvas: svg.Container) {
        let found: boolean = false;
        for (const s of sheetList) {
            const sheet = sheets.get(s);
            if (sheet !== undefined) {
                const func = sheet.glyphs.get(glyph);
                if (func !== undefined) {
                    found = true;
                    func(canvas.defs());
                }
            } else {
                throw new Error("Could not load the glyph sheet '" + s + "'");
            }
        }
        if (! found) {
            throw new Error("The glyph '" + glyph + "' could not be found in the requested sheets: " + sheetList.join(", "));
        }
    }
}
