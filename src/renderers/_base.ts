import { Element as SVGElement, G as SVGG, StrokeData, SVG, Svg } from "@svgdotjs/svg.js";
import { defineGrid, extendHex } from "honeycomb-grid";
import { applyToPoint, compose, scale } from "transformation-matrix";
import { hexOfCir, hexOfHex, hexOfTri, rectOfRects, snubsquare } from "../grids";
import { GridPoints, IPoint } from "../grids/_base";
import { APRenderRep, Glyph } from "../schema";
import { sheets } from "../sheets";

export interface IRendererOptionsIn {
    sheetList?: string[];
    colours?: string[];
    patterns?: boolean;
    patternList?: string[];
    colourBlind?: boolean;
    rotate?: number;
    showAnnotations?: boolean;
    boardClick?: (row: number, col: number, piece: string) => void;
    boardHover?: (row: number, col: number, piece: string) => void;
}

export interface IRendererOptionsOut {
    sheetList: string[];
    colours: string[];
    patterns: boolean;
    patternList: string[];
    colourBlind: boolean;
    rotate: number;
    showAnnotations: boolean;
    boardClick?: (row: number, col: number, piece: string) => void;
    boardHover?: (row: number, col: number, piece: string) => void;
}

function coords2algebraicHex(x: number, y: number, height: number): string {
    const columnLabels = "abcdefghijklmnopqrstuvwxyz".split("");
    return columnLabels[height - y - 1] + (x + 1).toString();
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

    public abstract render(json: APRenderRep, draw: Svg, opts: IRendererOptionsIn): void;

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
        const newOpts: IRendererOptionsOut = {sheetList: ["core", "dice", "looney", "piecepack", "chess"], colourBlind: false, colours: this.coloursBasic, patterns: false, patternList: this.patternNames, showAnnotations: true, rotate: 0};

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

        // Check for annotation screening
        if (opts.showAnnotations !== undefined) {
            newOpts.showAnnotations = opts.showAnnotations;
        }

        // Validate rotation
        if ( (opts.rotate !== undefined) && (opts.rotate !== 0) ) {
            let normalized = opts.rotate;
            while (normalized < 0) {
                normalized += 360;
            }
            newOpts.rotate = normalized;
        }

        if (opts.boardClick !== undefined) {
            newOpts.boardClick = opts.boardClick;
        }
        if (opts.boardHover !== undefined) {
            newOpts.boardHover = opts.boardHover;
        }

        return newOpts;
    }

    protected loadPattern(name: string, canvas: Svg): void {
        // Keep in alphabetical order.
        // If you change any `id`s, you need to change them in the `patternsBW` property, too.

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

    protected loadGlyph(glyph: string, sheetList: string[], canvas: Svg) {
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

    protected loadLegend(json: APRenderRep, draw: Svg, opts: IRendererOptionsOut) {
        if ( ("legend" in json) && (json.legend !== undefined) ) {
            const glyphSet: Set<string> = new Set();
            // tslint:disable-next-line: forin
            for (const key in json.legend) {
                const node = json.legend[key];
                if (typeof(node) === "string") {
                    glyphSet.add(node);
                } else if (Array.isArray(node)) {
                    node.forEach((e) => {
                        glyphSet.add(e.name);
                    });
                } else {
                    glyphSet.add(node.name);
                }
            }
            for (const glyph of glyphSet) {
                this.loadGlyph(glyph, opts.sheetList, draw);
            }

            // Load any requested patterns
            if (opts.patterns) {
                const patterns: Array<number> = new Array();
                // tslint:disable-next-line: forin
                for (const key in json.legend) {
                    const node = json.legend[key];
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
                    if (n > opts.patternList.length) {
                        throw new Error("The system does not support the number of patterns you have requested.");
                    }
                    this.loadPattern(opts.patternList[n - 1], draw);
                });
            }

            // Now look for composite and coloured pieces and add those to the <defs> section for placement
            // tslint:disable-next-line: forin
            for (const key in json.legend) {
                const node = json.legend[key];
                if (typeof(node) !== "string") {
                    let glyphs: Array<Glyph>;
                    if (! Array.isArray(node)) {
                        glyphs = [node];
                    } else {
                        glyphs = node;
                    }

                    // Create a new SVG.Nested to represent the composite piece and add it to <defs>
                    const cellsize = 500;
                    const nested = draw.defs().nested().id(key).size(cellsize, cellsize).attr("data-cellsize", cellsize);

                    // Layer the glyphs, manipulating as you go
                    glyphs.forEach((glyph) => {
                        // Get the glyph from <defs>
                        const got = draw.findOne("#" + glyph.name) as SVGG;
                        if ( (got === undefined) || (got === null) ) {
                            throw new Error(`Could not load the requested glyph: ${glyph.name}.`);
                        }
                        const use = got.clone();
                        if ( (use === undefined) || (use === null) ) {
                            throw new Error("The glyph sheet is malformed. This should never happen. Please let the administrator know.");
                        }

                        const sheetCellSize = use.attr("data-cellsize");
                        if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                            throw new Error(`The glyph you requested (${key}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                        }

                        // Scale it appropriately
                        // if (use.is(SVGG)) {
                        //     const sheetCellSize = use.attr("data-cellsize");
                        //     if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                        //         throw new Error(`The glyph you requested (${key}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                        //     }
                        //     use.scale(cellsize / sheetCellSize);
                        // } else {
                        //     use.size(cellsize);
                        // }
                        // use.scale(cellsize / sheetCellSize);

                        // `use` places the object at 0,0. When you scale by the center, 0,0 moves. This transformation corects that.
                        // It also incorporates any requested custom scaling into one transform
                        let factor = (cellsize / sheetCellSize);
                        if (glyph.scale !== undefined) {
                            factor *= glyph.scale;
                        }
                        if ( ("board" in json) && (json.board !== undefined) && (json.board !== null) && ("style" in json.board) && (json.board.style !== undefined) && (json.board.style === "hex-of-hex") ) {
                            factor *= 0.85;
                        }
                        const matrix = compose(scale(factor, factor, sheetCellSize / 2, sheetCellSize / 2));
                        const newpt = applyToPoint(matrix, {x: 0, y: 0});
                        let scaledx = 0 - newpt.x;
                        let scaledy = 0 - newpt.y;
                        if (sheetCellSize * factor < cellsize) {
                           scaledx += (cellsize - (sheetCellSize * factor)) / 2;
                           scaledy += (cellsize - (sheetCellSize * factor)) / 2;
                        }
                        use.dmove(scaledx, scaledy);
                        use.scale(factor);
                        // use.size(cellsize);

                        // Shift if requested
                        if (glyph.nudge !== undefined) {
                            let dx = 0;
                            let dy = 0;
                            if (glyph.nudge.dx !== undefined) {
                                dx = glyph.nudge.dx;
                            }
                            if (glyph.nudge.dy !== undefined) {
                                dy = glyph.nudge.dy;
                            }
                            use.dmove(dx, dy);
                        }

                        // Colourize (`player` first, then `colour` if defined)
                        if (glyph.player !== undefined) {
                            if  (opts.patterns) {
                                if (glyph.player > opts.patternList.length) {
                                    throw new Error("The list of patterns provided is not long enough to support the number of players in this game.");
                                }
                                const useSize = use.attr("data-cellsize");
                                let fill = draw.findOne("#" + opts.patternList[glyph.player - 1] + "-" + useSize) as SVGElement;
                                if (fill === null) {
                                    fill = draw.findOne("#" + opts.patternList[glyph.player - 1]) as SVGElement;
                                    fill = fill.clone().id(opts.patternList[glyph.player - 1] + "-" + useSize).scale(useSize / 150);
                                    draw.defs().add(fill);
                                }
                                // if (use.is(SVGG)) {
                                //     (use as SVGG).find("[data-playerfill=true]").each(function(this: Svg) { this.fill(fill); });
                                // } else {
                                //     use.fill(fill);
                                // }
                                use.find("[data-playerfill=true]").each(function(this: Svg) { this.fill(fill); });
                            } else {
                                if (glyph.player > opts.colours.length) {
                                    throw new Error("The list of colours provided is not long enough to support the number of players in this game.");
                                }
                                const fill = opts.colours[glyph.player - 1];
                                // if (use.is(SVGG)) {
                                //     (use as SVGG).find("[data-playerfill=true]").each(function(this: Svg) { this.fill(fill); });
                                // } else {
                                //     use.fill(fill);
                                // }
                                use.find("[data-playerfill=true]").each(function(this: Svg) { this.fill(fill); });
                            }
                        } else if (glyph.colour !== undefined) {
                            // if (use.is(SVGG)) {
                            //     (use as SVGG).find("[data-playerfill=true]").each(function(this: Svg) { this.fill({color: glyph.colour}); });
                            // } else {
                            //     use.fill(glyph.colour);
                            // }
                            use.find("[data-playerfill=true]").each(function(this: Svg) { this.fill({color: glyph.colour}); });
                        }

                        // Apply requested opacity
                        if (glyph.opacity !== undefined) {
                            use.fill({opacity: glyph.opacity});
                        }

                        // Rotate if requested
                        if (glyph.rotate !== undefined) {
                            use.rotate(glyph.rotate);
                        }

                        // Add to the nested figure
                        nested.add(use);
                    });
                }
            }
        }
    }

    protected squares(json: APRenderRep, draw: Svg, opts: IRendererOptionsOut): GridPoints {
        // Check required properites
        if ( (json.board === null) || (! ("width" in json.board)) || (! ("height" in json.board)) || (json.board.width === undefined) || (json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        const width: number = json.board.width as number;
        const height: number = json.board.height as number;
        const cellsize = this.cellsize;
        const style = json.board.style;

        let baseStroke: number = 1;
        let baseColour: string = "#000";
        let baseOpacity: number = 1;
        if ( ("strokeWeight" in json.board) && (json.board.strokeWeight !== undefined) ) {
            baseStroke = json.board.strokeWeight;
        }
        if ( ("strokeColour" in json.board) && (json.board.strokeColour !== undefined) ) {
            baseColour = json.board.strokeColour;
        }
        if ( ("strokeOpacity" in json.board) && (json.board.strokeOpacity !== undefined) ) {
            baseOpacity = json.board.strokeOpacity;
        }

        // Get a grid of points
        const grid = rectOfRects({gridHeight: height, gridWidth: width, cellSize: cellsize});
        const board = draw.group().id("board");

        // Add board labels
        const labels = board.group().id("labels");
        // Columns (letters)
        for (let col = 0; col < width; col++) {
            const pointTop = {x: grid[0][col].x, y: grid[0][col].y - cellsize};
            const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + cellsize};
            labels.text(this.columnLabels[col]).fill(baseColour).opacity(baseOpacity).center(pointTop.x, pointTop.y);
            labels.text(this.columnLabels[col]).fill(baseColour).opacity(baseOpacity).center(pointBottom.x, pointBottom.y);
        }

        // Rows (numbers)
        for (let row = 0; row < height; row++) {
            const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
            const pointR = {x: grid[row][width - 1].x + cellsize, y: grid[row][width - 1].y};
            labels.text(`${height - row}`).fill(baseColour).opacity(baseOpacity).center(pointL.x, pointL.y);
            labels.text(`${height - row}`).fill(baseColour).opacity(baseOpacity).center(pointR.x, pointR.y);
        }

        // Now the tiles
        if (style === "squares-checkered") {
            // Load glyphs for light and dark squares
            const tileDark = draw.defs().rect(cellsize, cellsize)
                .fill(baseColour)
                .opacity(baseOpacity * 0.25)
                .stroke({width: 0})
                .id("tileDark");
            const tileLight = draw.defs().rect(cellsize, cellsize)
                .fill("#ffffff")
                .stroke({width: 0})
                .id("tileLight");

            const tiles = board.group().id("tiles");
            // Determine whether the first row starts with a light or dark square
            let startLight: number = 1;
            if (height % 2 === 0) {
                startLight = 0;
            }

            // Place them
            for (let row = 0; row < height; row++) {
                let lightCol: number = 1;
                if (row % 2 === startLight) {
                    lightCol = 0;
                }
                for (let col = 0; col < width; col++) {
                    const {x, y} = grid[row][col];
                    if (col % 2 !== lightCol) {
                        tiles.use(tileDark).center(x, y);
                    } else {
                        tiles.use(tileLight).center(x, y);
                    }
                }
            }
        }
        if (opts.boardClick !== undefined) {
            draw.click((e: { clientX: number; clientY: number; }) => {
                const point = draw.point(e.clientX, e.clientY);
                const x = Math.floor((point.x - (grid[0][0].x - (cellsize / 2))) / cellsize);
                const y = Math.floor((point.y - (grid[0][0].y - (cellsize / 2))) / cellsize);
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    opts.boardClick!(y, x, "");
                }
            });
        }

        // Draw grid lines
        const gridlines = board.group().id("gridlines");

        // Check for tiling
        let tilex: number = 0;
        let tiley: number = 0;
        if (json.board.tileWidth !== undefined) {
            tilex = json.board.tileWidth as number;
        }
        if (json.board.tileHeight !== undefined) {
            tiley = json.board.tileHeight as number;
        }

        if (style === "squares-beveled") {
            baseOpacity *= 0.15;
        }
        // Horizontal, top of each row, then bottom line after loop
        for (let row = 0; row < height; row++) {
            let thisStroke = baseStroke;
            if ( (tiley > 0) && (row > 0) && (row % tiley === 0) ) {
                thisStroke = baseStroke * 3;
            }
            const x1 = grid[row][0].x - (cellsize / 2);
            const y1 = grid[row][0].y - (cellsize / 2);
            const x2 = grid[row][width - 1].x + (cellsize / 2);
            const y2 = grid[row][width - 1].y - (cellsize / 2);
            gridlines.line(x1, y1, x2, y2).stroke({width: thisStroke, color: baseColour, opacity: baseOpacity});
        }
        let lastx1 = grid[height - 1][0].x - (cellsize / 2);
        let lasty1 = grid[height - 1][0].y + (cellsize / 2);
        let lastx2 = grid[height - 1][width - 1].x + (cellsize / 2);
        let lasty2 = grid[height - 1][width - 1].y + (cellsize / 2);
        gridlines.line(lastx1, lasty1, lastx2, lasty2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});

        // Vertical, left of each column, then right line after loop
        for (let col = 0; col < width; col++) {
            let thisStroke = baseStroke;
            if ( (tilex > 0) && (col > 0) && (col % tilex === 0) ) {
                thisStroke = baseStroke * 3;
            }
            const x1 = grid[0][col].x - (cellsize / 2);
            const y1 = grid[0][col].y - (cellsize / 2);
            const x2 = grid[height - 1][col].x - (cellsize / 2);
            const y2 = grid[height - 1][col].y + (cellsize / 2);
            gridlines.line(x1, y1, x2, y2).stroke({width: thisStroke, color: baseColour, opacity: baseOpacity});
        }
        lastx1 = grid[0][width - 1].x + (cellsize / 2);
        lasty1 = grid[0][width - 1].y - (cellsize / 2);
        lastx2 = grid[height - 1][width - 1].x + (cellsize / 2);
        lasty2 = grid[height - 1][width - 1].y + (cellsize / 2);
        gridlines.line(lastx1, lasty1, lastx2, lasty2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});

        // Make an expanded grid for markers, to accommodate edge marking and shading
        // Add one row and one column and shift all points up and to the left by half a cell size
        let gridExpanded = rectOfRects({gridHeight: height + 1, gridWidth: width + 1, cellSize: cellsize});
        gridExpanded = gridExpanded.map((row) => row.map((cell) => ({x: cell.x - (cellsize / 2), y: cell.y - (cellsize / 2)} as IPoint)));

        this.markBoard(json, gridlines, grid, opts, gridExpanded);

        return grid;
    }

    protected rectOfHex(json: APRenderRep, draw: Svg, opts: IRendererOptionsOut): GridPoints {
        // Check required properites
        if ( (json.board === null) || (! ("width" in json.board)) || (! ("height" in json.board)) || (json.board.width === undefined) || (json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        const width: number = json.board.width as number;
        const height: number = json.board.height as number;
        const cellsize = this.cellsize * 0.8;
        const style = json.board.style;

        let baseStroke: number = 1;
        let baseColour: string = "#000";
        let baseOpacity: number = 1;
        if ( ("strokeWeight" in json.board) && (json.board.strokeWeight !== undefined) ) {
            baseStroke = json.board.strokeWeight;
        }
        if ( ("strokeColour" in json.board) && (json.board.strokeColour !== undefined) ) {
            baseColour = json.board.strokeColour;
        }
        if ( ("strokeOpacity" in json.board) && (json.board.strokeOpacity !== undefined) ) {
            baseOpacity = json.board.strokeOpacity;
        }

        // Get a grid of points
        let orientation = "pointy";
        if (style.endsWith("f")) {
            orientation = "flat";
        }
        let offset = -1;
        if (style.includes("-even")) {
            offset = 1;
        }
        const Hex = extendHex({
            offset,
            orientation,
            size: cellsize,
        });
        const grid = defineGrid(Hex);
        const corners = Hex().corners();
        const hexSymbol = draw.symbol()
            .polygon(corners.map(({ x, y }) => `${x},${y}`).join(" "))
            .fill("white").opacity(1)
            .stroke({ width: baseStroke, color: baseColour, opacity: baseOpacity });

        const board = draw.group().id("board");
        const labels = draw.group().id("labels");
        const rect = grid.rectangle({width, height});
        const fontSize = this.cellsize / 5;
        for (const hex of rect) {
            const { x, y } = hex.toPoint();
            const used = board.use(hexSymbol).translate(x, y);
            labels.text(coords2algebraicHex(hex.x, hex.y, height))
            .font({
                anchor: "middle",
                fill: baseStroke,
                size: fontSize,
            })
            // .center(cx, cy);
            .center(corners[5].x, corners[5].y)
            .translate(x, y + fontSize);
            if (opts.boardClick !== undefined) {
                used.click(() => opts.boardClick!(hex.y, hex.x, ""));
            }
        }

        const gridPoints: GridPoints = [];
        const {x: cx, y: cy} = Hex().center();
        for (let y = 0; y < 9; y++) {
            const node: IPoint[] = [];
            for (let x = 0; x < 9; x++) {
                const hex = rect.get({x, y});
                if (hex === undefined) {
                    throw new Error();
                }
                const pt = hex.toPoint();
                node.push({x: pt.x + cx, y: pt.y + cy} as IPoint);
            }
            gridPoints.push(node);
        }

        this.markBoard(json, board, gridPoints, opts);

        return gridPoints;
    }

    protected vertex(json: APRenderRep, draw: Svg, opts: IRendererOptionsOut): GridPoints {
        // Check required properites
        if ( (json.board === null) || (! ("width" in json.board)) || (! ("height" in json.board)) || (json.board.width === undefined) || (json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        const width: number = json.board.width as number;
        const height: number = json.board.height as number;
        const cellsize = this.cellsize;
        const style = json.board.style;

        let baseStroke: number = 1;
        let baseColour: string = "#000";
        let baseOpacity: number = 1;
        if ( ("strokeWeight" in json.board) && (json.board.strokeWeight !== undefined) ) {
            baseStroke = json.board.strokeWeight;
        }
        if ( ("strokeColour" in json.board) && (json.board.strokeColour !== undefined) ) {
            baseColour = json.board.strokeColour;
        }
        if ( ("strokeOpacity" in json.board) && (json.board.strokeOpacity !== undefined) ) {
            baseOpacity = json.board.strokeOpacity;
        }

        // Get a grid of points
        const grid = rectOfRects({gridHeight: height, gridWidth: width, cellSize: cellsize});
        const board = draw.group().id("board");

        // Add board labels
        const labels = board.group().id("labels");
        // Columns (letters)
        for (let col = 0; col < width; col++) {
            const pointTop = {x: grid[0][col].x, y: grid[0][col].y - cellsize};
            const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + cellsize};
            labels.text(this.columnLabels[col]).fill(baseColour).opacity(baseOpacity).center(pointTop.x, pointTop.y);
            labels.text(this.columnLabels[col]).fill(baseColour).opacity(baseOpacity).center(pointBottom.x, pointBottom.y);
        }

        // Rows (numbers)
        for (let row = 0; row < height; row++) {
            const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
            const pointR = {x: grid[row][width - 1].x + cellsize, y: grid[row][width - 1].y};
            labels.text(`${height - row}`).fill(baseColour).opacity(baseOpacity).center(pointL.x, pointL.y);
            labels.text(`${height - row}`).fill(baseColour).opacity(baseOpacity).center(pointR.x, pointR.y);
        }

        // Draw grid lines
        const gridlines = board.group().id("gridlines");

        // Check for tiling
        let tilex: number = 0;
        let tiley: number = 0;
        if (json.board.tileWidth !== undefined) {
            tilex = json.board.tileWidth as number;
        }
        if (json.board.tileHeight !== undefined) {
            tiley = json.board.tileHeight as number;
        }

        // Horizontal, top of each row, then bottom line after loop
        for (let row = 0; row < height; row++) {
            let thisStroke = baseStroke;
            if ( (tiley > 0) && (row > 0) && (row % tiley === 0) ) {
                thisStroke = baseStroke * 3;
            }
            const x1 = grid[row][0].x;
            const y1 = grid[row][0].y;
            const x2 = grid[row][width - 1].x;
            const y2 = grid[row][width - 1].y;
            gridlines.line(x1, y1, x2, y2).stroke({width: thisStroke, color: baseColour, opacity: baseOpacity});
        }
        let lastx1 = grid[height - 1][0].x;
        let lasty1 = grid[height - 1][0].y;
        let lastx2 = grid[height - 1][width - 1].x;
        let lasty2 = grid[height - 1][width - 1].y;
        gridlines.line(lastx1, lasty1, lastx2, lasty2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});

        // Vertical, left of each column, then right line after loop
        for (let col = 0; col < width; col++) {
            let thisStroke = baseStroke;
            if ( (tilex > 0) && (col > 0) && (col % tilex === 0) ) {
                thisStroke = baseStroke * 3;
            }
            const x1 = grid[0][col].x;
            const y1 = grid[0][col].y;
            const x2 = grid[height - 1][col].x;
            const y2 = grid[height - 1][col].y;
            gridlines.line(x1, y1, x2, y2).stroke({width: thisStroke, color: baseColour, opacity: baseOpacity});
        }
        lastx1 = grid[0][width - 1].x;
        lasty1 = grid[0][width - 1].y;
        lastx2 = grid[height - 1][width - 1].x;
        lasty2 = grid[height - 1][width - 1].y;
        gridlines.line(lastx1, lasty1, lastx2, lasty2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});

        // If `-cross` board, add crosses
        if (style === "vertex-cross") {
            for (let row = 1; row < height; row++) {
                for (let col = 0; col < width; col++) {
                    const curr = grid[row][col];
                    // if not last column, do next
                    if (col < width - 1) {
                        const next = grid[row - 1][col + 1];
                        gridlines.line(curr.x, curr.y, next.x, next.y).stroke({width: baseStroke / 2, color: baseColour, opacity: baseOpacity});
                    }
                    // if not first column, do previous
                    if (col > 0) {
                        const prev = grid[row - 1][col - 1];
                        gridlines.line(curr.x, curr.y, prev.x, prev.y).stroke({width: baseStroke / 2, color: baseColour, opacity: baseOpacity});
                    }
                }
            }
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

        this.markBoard(json, gridlines, grid, opts);

        if (opts.boardClick !== undefined) {
            if (json.renderer !== "stacking-offset") {
                draw.click((e: { clientX: number; clientY: number; }) => {
                    const point = draw.point(e.clientX, e.clientY);
                    const x = Math.floor((point.x - (grid[0][0].x - (cellsize / 2))) / cellsize);
                    const y = Math.floor((point.y - (grid[0][0].y - (cellsize / 2))) / cellsize);
                    if (x >= 0 && x < width && y >= 0 && y < height) {
                        opts.boardClick!(y, x, "");
                    }
                });
            } else {
                const tile = draw.defs().rect(this.cellsize * 0.85, this.cellsize * 0.85).fill("#fff").opacity(0).id("_clickCatcher");
                const tiles = draw.group().id("tiles");
                for (let row = 0; row < grid.length; row++) {
                    for (let col = 0; col < grid[row].length; col++) {
                        const {x, y} = grid[row][col];
                        const t = tiles.use(tile).center(x, y);
                        if (opts.boardClick !== undefined) {
                            t.click(() => opts.boardClick!(row, col, ""));
                        }
                    }
                }
            }
        }

        return grid;
    }

    protected snubSquare(json: APRenderRep, draw: Svg, opts: IRendererOptionsOut): GridPoints {
        // Check required properites
        if ( (json.board === null) || (! ("width" in json.board)) || (! ("height" in json.board)) || (json.board.width === undefined) || (json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        const width: number = json.board.width as number;
        const height: number = json.board.height as number;
        const cellsize = this.cellsize;

        let baseStroke: number = 1;
        let baseColour: string = "#000";
        let baseOpacity: number = 1;
        if ( ("strokeWeight" in json.board) && (json.board.strokeWeight !== undefined) ) {
            baseStroke = json.board.strokeWeight;
        }
        if ( ("strokeColour" in json.board) && (json.board.strokeColour !== undefined) ) {
            baseColour = json.board.strokeColour;
        }
        if ( ("strokeOpacity" in json.board) && (json.board.strokeOpacity !== undefined) ) {
            baseOpacity = json.board.strokeOpacity;
        }

        // Get a grid of points
        const grid = snubsquare({gridHeight: height, gridWidth: width, cellSize: cellsize});
        const board = draw.group().id("board");

        // Add board labels
        const labels = board.group().id("labels");
        // Columns (letters)
        for (let col = 0; col < width; col++) {
            const pointTop = {x: grid[0][col].x, y: grid[0][col].y - cellsize};
            const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + cellsize};
            labels.text(this.columnLabels[col]).fill(baseColour).opacity(baseOpacity).center(pointTop.x, pointTop.y);
            labels.text(this.columnLabels[col]).fill(baseColour).opacity(baseOpacity).center(pointBottom.x, pointBottom.y);
        }

        // Rows (numbers)
        for (let row = 0; row < height; row++) {
            const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
            const pointR = {x: grid[row][width - 1].x + cellsize, y: grid[row][width - 1].y};
            labels.text(`${height - row}`).fill(baseColour).opacity(baseOpacity).center(pointL.x, pointL.y);
            labels.text(`${height - row}`).fill(baseColour).opacity(baseOpacity).center(pointR.x, pointR.y);
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

        // If click handler is present, add transparent "click catcher" tiles over the points
        if (opts.boardClick !== undefined) {
            const tile = draw.defs().rect(this.cellsize * 0.85, this.cellsize * 0.85).fill("#fff").opacity(0).id("_clickCatcher");
            const tiles = draw.group().id("tiles");
            for (let row = 0; row < grid.length; row++) {
                for (let col = 0; col < grid[row].length; col++) {
                    const {x, y} = grid[row][col];
                    const t = tiles.use(tile).center(x, y);
                    if (opts.boardClick !== undefined) {
                        t.click(() => opts.boardClick!(row, col, ""));
                    }
                }
            }
        }

        this.markBoard(json, gridlines, grid, opts);

        return grid;
    }

    protected hexOfTri(json: APRenderRep, draw: Svg, opts: IRendererOptionsOut): GridPoints {
        // Check required properites
        if ( (json.board === null) || (! ("minWidth" in json.board)) || (! ("maxWidth" in json.board)) || (json.board.minWidth === undefined) || (json.board.maxWidth === undefined) ) {
            throw new Error("Both the `minWidth` and `maxWidth` properties are required for this board type.");
        }
        const minWidth: number = json.board.minWidth as number;
        const maxWidth: number = json.board.maxWidth as number;
        const cellsize = this.cellsize;
        const height = ((maxWidth - minWidth) * 2) + 1;

        let baseStroke: number = 1;
        let baseColour: string = "#000";
        let baseOpacity: number = 1;
        if ( ("strokeWeight" in json.board) && (json.board.strokeWeight !== undefined) ) {
            baseStroke = json.board.strokeWeight;
        }
        if ( ("strokeColour" in json.board) && (json.board.strokeColour !== undefined) ) {
            baseColour = json.board.strokeColour;
        }
        if ( ("strokeOpacity" in json.board) && (json.board.strokeOpacity !== undefined) ) {
            baseOpacity = json.board.strokeOpacity;
        }

        // Get a grid of points
        const grid = hexOfTri({gridWidthMin: minWidth, gridWidthMax: maxWidth, cellSize: cellsize});
        const board = draw.group().id("board");

        // Add board labels
        const labels = board.group().id("labels");

        // Rows (numbers)
        for (let row = 0; row < height; row++) {
            const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
            const pointR = {x: grid[row][grid[row].length - 1].x + cellsize, y: grid[row][grid[row].length - 1].y};
            labels.text(this.columnLabels[height - row - 1] + "1").fill(baseColour).opacity(baseOpacity).center(pointL.x, pointL.y);
            labels.text(this.columnLabels[height - row - 1] + `${grid[row].length}`).fill(baseColour).opacity(baseOpacity).center(pointR.x, pointR.y);
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

        this.markBoard(json, gridlines, grid, opts);

        // If click handler is present, add transparent "click catcher" tiles over the points
        if (opts.boardClick !== undefined) {
            const tile = draw.defs().rect(this.cellsize * 0.85, this.cellsize * 0.85).fill("#fff").opacity(0).id("_clickCatcher");
            const tiles = draw.group().id("tiles");
            for (let row = 0; row < grid.length; row++) {
                for (let col = 0; col < grid[row].length; col++) {
                    const {x, y} = grid[row][col];
                    const t = tiles.use(tile).center(x, y);
                    if (opts.boardClick !== undefined) {
                        t.click(() => opts.boardClick!(row, col, ""));
                    }
                }
            }
        }

        return grid;
    }

    protected hexOfCir(json: APRenderRep, draw: Svg, opts: IRendererOptionsOut): GridPoints {
        // Check required properites
        if ( (json.board === null) || (! ("minWidth" in json.board)) || (! ("maxWidth" in json.board)) || (json.board.minWidth === undefined) || (json.board.maxWidth === undefined) ) {
            throw new Error("Both the `minWidth` and `maxWidth` properties are required for this board type.");
        }
        const minWidth: number = json.board.minWidth as number;
        const maxWidth: number = json.board.maxWidth as number;
        const cellsize = this.cellsize;
        const height = ((maxWidth - minWidth) * 2) + 1;

        let baseStroke: number = 1;
        let baseColour: string = "#000";
        let baseOpacity: number = 1;
        if ( ("strokeWeight" in json.board) && (json.board.strokeWeight !== undefined) ) {
            baseStroke = json.board.strokeWeight;
        }
        if ( ("strokeColour" in json.board) && (json.board.strokeColour !== undefined) ) {
            baseColour = json.board.strokeColour;
        }
        if ( ("strokeOpacity" in json.board) && (json.board.strokeOpacity !== undefined) ) {
            baseOpacity = json.board.strokeOpacity;
        }

        // Get a grid of points
        const grid = hexOfCir({gridWidthMin: minWidth, gridWidthMax: maxWidth, cellSize: cellsize});
        const board = draw.group().id("board");

        // Add board labels
        const labels = board.group().id("labels");

        // Rows (numbers)
        for (let row = 0; row < height; row++) {
            const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
            const pointR = {x: grid[row][grid[row].length - 1].x + cellsize, y: grid[row][grid[row].length - 1].y};
            labels.text(this.columnLabels[height - row - 1] + "1").fill(baseColour).opacity(baseOpacity).center(pointL.x, pointL.y);
            labels.text(this.columnLabels[height - row - 1] + `${grid[row].length}`).fill(baseColour).opacity(baseOpacity).center(pointR.x, pointR.y);
        }

        // Draw circles
        const gridlines = board.group().id("circles");
        const circle = draw.defs().circle(cellsize)
            .id("_circle")
            .fill({color: "black", opacity: 0})
            .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke});
        for (let iRow = 0; iRow < grid.length; iRow++) {
            const row = grid[iRow];
            for (let iCol = 0; iCol < row.length; iCol++) {
                const p = row[iCol];
                const c = gridlines.use(circle).center(p.x, p.y);
                if (opts.boardClick !== undefined) {
                    c.click(() => opts.boardClick!(iRow, iCol, ""));
                }
            }
        }

        this.markBoard(json, gridlines, grid, opts);

        return grid;
    }

    protected hexOfHex(json: APRenderRep, draw: Svg, opts: IRendererOptionsOut): GridPoints {
        // Check required properites
        if ( (json.board === null) || (! ("minWidth" in json.board)) || (! ("maxWidth" in json.board)) || (json.board.minWidth === undefined) || (json.board.maxWidth === undefined) ) {
            throw new Error("Both the `minWidth` and `maxWidth` properties are required for this board type.");
        }
        const minWidth: number = json.board.minWidth as number;
        const maxWidth: number = json.board.maxWidth as number;
        const cellsize = this.cellsize;
        const height = ((maxWidth - minWidth) * 2) + 1;

        let baseStroke: number = 1;
        let baseColour: string = "#000";
        let baseOpacity: number = 1;
        if ( ("strokeWeight" in json.board) && (json.board.strokeWeight !== undefined) ) {
            baseStroke = json.board.strokeWeight;
        }
        if ( ("strokeColour" in json.board) && (json.board.strokeColour !== undefined) ) {
            baseColour = json.board.strokeColour;
        }
        if ( ("strokeOpacity" in json.board) && (json.board.strokeOpacity !== undefined) ) {
            baseOpacity = json.board.strokeOpacity;
        }

        // Get a grid of points
        const grid = hexOfHex({gridWidthMin: minWidth, gridWidthMax: maxWidth, cellSize: cellsize});
        const board = draw.group().id("board");

        // Add board labels
        const labels = board.group().id("labels");

        // Rows (numbers)
        for (let row = 0; row < height; row++) {
            const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
            const pointR = {x: grid[row][grid[row].length - 1].x + cellsize, y: grid[row][grid[row].length - 1].y};
            labels.text(this.columnLabels[height - row - 1] + "1").fill(baseColour).opacity(baseOpacity).center(pointL.x, pointL.y);
            labels.text(this.columnLabels[height - row - 1] + `${grid[row].length}`).fill(baseColour).opacity(baseOpacity).center(pointR.x, pointR.y);
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
        const triWidth = cellsize / 2;
        const half = triWidth / 2;
        const triHeight = (triWidth * Math.sqrt(3)) / 2;

        const gridlines = board.group().id("hexes");
        const hex = draw.defs().polygon(`${triHeight},0 ${triHeight * 2},${half} ${triHeight * 2},${half + triWidth} ${triHeight},${triWidth * 2} 0,${half + triWidth} 0,${half}`)
            .id("_hex")
            .fill({color: "black", opacity: 0})
            .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke});
        for (let iRow = 0; iRow < grid.length; iRow++) {
            const row = grid[iRow];
            for (let iCol = 0; iCol < row.length; iCol++) {
                const p = row[iCol];
                const c = gridlines.use(hex).center(p.x, p.y);
                if (opts.boardClick !== undefined) {
                    c.click(() => opts.boardClick!(iRow, iCol, ""));
                }
            }
        }

        this.markBoard(json, gridlines, grid, opts);

        return grid;
    }

    protected rotateBoard(draw: Svg, degrees: number = 180, boardID: string = "board", labelID: string = "labels") {
        const board = SVG("#" + boardID);
        board.rotate(degrees);
        const g = SVG("#" + labelID);
        const children = g.children();
        children.each((x) => {
            x.rotate(Math.abs(360 - degrees));
        });
    }

    protected annotateBoard(json: APRenderRep, draw: Svg, grid: GridPoints, opts: IRendererOptionsOut) {
        if ( ("annotations" in json) && (json.annotations !== undefined) ) {
            const notes = draw.group().id("annotations");
            const rIncrement = this.cellsize / 2;
            let radius = rIncrement;
            let direction = 1;
            for (const note of json.annotations) {
                if ( (note.type !== undefined) && (note.type === "move") ) {
                    if ((note.targets as any[]).length < 2) {
                        throw new Error("Move annotations require at least two 'targets'.");
                    }

                    let colour = "#000";
                    if ( ("colour" in note) && (note.colour !== undefined) ) {
                        colour = note.colour as string;
                    } else if ( ("player" in note) && (note.player !== undefined) ) {
                        colour = opts.colours[(note.player as number) - 1];
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
                    for (const node of (note.targets as any[])) {
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
                        colour = opts.colours[(note.player as number) - 1];
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
                    const [from, to] = note.targets as any[];
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
                    if (direction > 0) {
                        radius += rIncrement;
                    }
                } else if ( (note.type !== undefined) && (note.type === "enter") ) {
                    let colour = "#000";
                    if ( ("colour" in note) && (note.colour !== undefined) ) {
                        colour = note.colour as string;
                    } else if ( ("player" in note) && (note.player !== undefined) ) {
                        colour = opts.colours[(note.player as number) - 1];
                    }
                    for (const node of (note.targets as any[])) {
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
                        colour = opts.colours[(note.player as number) - 1];
                    }
                    for (const node of (note.targets as any[])) {
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
                        colour = opts.colours[(note.player as number) - 1];
                    }
                    let opacity = 1;
                    if ( ("opacity" in note) && (note.opacity !== undefined) ) {
                        opacity = note.opacity as number;
                    }
                    for (const node of (note.targets as any[])) {
                        const pt = grid[node.row][node.col];
                        notes.circle(this.cellsize * 0.2)
                            .fill(colour)
                            .opacity(opacity)
                            .stroke({width: 0})
                            .center(pt.x, pt.y);
                    }
                } else {
                    throw new Error(`The requested annotation (${ note.type }) is not supported.`);
                }
            }
        }
    }

    protected markBoard(json: APRenderRep, svgGroup: SVGG, grid: GridPoints, opts: IRendererOptionsOut, gridExpanded?: GridPoints): void {
        if ( ("board" in json) && (json.board !== undefined) && ("markers" in json.board!) && (json.board.markers !== undefined) && (Array.isArray(json.board.markers)) && (json.board.markers.length > 0) ) {
            let baseStroke: number = 1;
            let baseColour: string = "#000";
            let baseOpacity: number = 1;
            if ( ("strokeWeight" in json.board) && (json.board.strokeWeight !== undefined) ) {
                baseStroke = json.board.strokeWeight;
            }
            if ( ("strokeColour" in json.board) && (json.board.strokeColour !== undefined) ) {
                baseColour = json.board.strokeColour;
            }
            if ( ("strokeOpacity" in json.board) && (json.board.strokeOpacity !== undefined) ) {
                baseOpacity = json.board.strokeOpacity;
            }

            for (const marker of json.board.markers) {
                if (marker.type === "dots") {
                    const pts: [number, number][] = [];
                    for (const point of marker.points) {
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
                            colour = opts.colours[marker.colour - 1];
                        } else {
                            colour = marker.colour;
                        }
                    }
                    let opacity = 0.25;
                    if ( ("opacity" in marker) && (marker.opacity !== undefined) ) {
                        opacity = marker.opacity;
                    }
                    const points: [number, number][] = [];
                    if ( (json.board.style.startsWith("squares")) && (gridExpanded !== undefined) ) {
                        for (const point of marker.points) {
                            points.push([gridExpanded[point.row][point.col].x, gridExpanded[point.row][point.col].y]);
                        }
                    } else {
                        for (const point of marker.points) {
                            points.push([grid[point.row][point.col].x, grid[point.row][point.col].y]);
                        }
                    }
                    const ptstr = points.map((p) => p.join(",")).join(" ");
                    svgGroup.polygon(ptstr).fill(colour).opacity(opacity);
                } else if (marker.type === "edge") {
                    let colour = "#000";
                    if ( ("colour" in marker) && (marker.colour !== undefined) ) {
                        if (typeof marker.colour === "number") {
                            colour = opts.colours[marker.colour - 1];
                        } else {
                            colour = marker.colour;
                        }
                    }
                    const opacity = baseOpacity + ((1 - baseOpacity) / 2);
                    const style = json.board.style;
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
                            colour = opts.colours[marker.colour - 1];
                        } else {
                            colour = marker.colour;
                        }
                    }
                    const style = json.board.style;
                    if ( (style.startsWith("squares")) && (gridExpanded !== undefined) ) {
                        const row: number = marker.cell.row;
                        const col: number = marker.cell.col;
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
                }
            }
        }
    }

    protected buildKey(json: APRenderRep, draw: Svg, orientation?: "H"|"V", textPos?: "I"|"O"): SVGG | undefined {
        if ( (! ("key" in json)) || (json.key === undefined) ) {
            return;
        }
        let placement = "right";
        if ( ("key" in json) && (json.key !== undefined) && ("placement" in json.key) && (json.key.placement !== undefined) ) {
            placement = json.key.placement;
        }
        if (orientation === undefined) {
            orientation = "V";
            if ( ("placement" in json.key) && (json.key.placement !== undefined) && ( (json.key.placement === "top") || (json.key.placement === "bottom") ) ) {
                orientation = "H";
            }
        }
        if (textPos === undefined) {
            textPos = "O";
            if ( ("textPosition" in json.key) && (json.key.textPosition !== undefined) && (json.key.textPosition === "inside") ) {
                textPos = "I";
            }
        }
        const unitSize = this.cellsize / 4;
        const maxlen = Math.max(...json.key.list.map((e) => e.name.length));

        // Load all the pieces
        const pieces: Map<string, [SVGElement, number, string]> = new Map();
        for (const p of json.key.list) {
            const piece = SVG("#" + p.piece);
            if ( (piece === null) || (piece === undefined) ) {
                throw new Error(`Could not find the requested piece (${p.piece}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
            }
            const sheetCellSize = piece.attr("data-cellsize");
            if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                throw new Error(`The glyph you requested (${p.piece}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
            }
            pieces.set(p.piece, [piece, sheetCellSize, p.name]);
        }

        if (orientation === "V") {
            const height = unitSize;
            const width = ((maxlen / 2) + 1) * unitSize;
            const entries: SVGG[] = [];
            for (const [key, [glyph, glyphSize, label]] of pieces.entries()) {
                const entry = draw.defs().group().id(`_key_entry_${key}`).size(width, height);
                const usedGlyph = entry.use(glyph);
                // `use` places the object at 0,0. When you scale by the center, 0,0 moves. This transformation corects that.
                const factor = (unitSize / glyphSize);
                const matrix = compose(scale(factor, factor, glyphSize / 2, glyphSize / 2));
                const newpt = applyToPoint(matrix, {x: 0, y: 0});
                usedGlyph.dmove(newpt.x * -1, newpt.y * -1);
                usedGlyph.scale(factor);
                const text = entry.text(label).font("size", height).move(0, 0);
                if (textPos === "O") {
                    if (placement === "right") {
                        text.dx(unitSize);
                    } else {
                        text.dx(text.bbox().width * -1);
                    }
                } else {
                    if (placement === "right") {
                        text.dx((text.bbox().width + unitSize) * -1);
                    } else {
                        text.dx(unitSize);
                    }
                }
                entries.push(entry);
            }
            const fullHeight = (height * entries.length) + ((height / 2) * (entries.length - 1));
            const g = draw.defs().group().id("_key").size(width, fullHeight);
            for (let i = 0; i < entries.length; i++) {
                g.use(entries[i]).dmove(0, (height * 1.5) * i);
            }
            return g;
        } else {
            const height = unitSize * 2;
            const width = (maxlen / 2) * unitSize;
            const entries: SVGG[] = [];
            for (const [key, [glyph, glyphSize, label]] of pieces.entries()) {
                const entry = draw.defs().group().id(`_key_entry_${key}`).size(width, height);
                const usedGlyph = entry.use(glyph);
                // `use` places the object at 0,0. When you scale by the center, 0,0 moves. This transformation corects that.
                const factor = (unitSize / glyphSize);
                const matrix = compose(scale(factor, factor, glyphSize / 2, glyphSize / 2));
                const newpt = applyToPoint(matrix, {x: 0, y: 0});
                usedGlyph.dmove(newpt.x * -1, newpt.y * -1);
                usedGlyph.scale(factor);
                const text = entry.text(label).font("size", height / 2).move(0, 0);
                if (textPos === "O") {
                    // usedGlyph.dmove((text.bbox().width / 2) - (unitSize / 2), unitSize);
                    if (placement === "top") {
                        text.dmove(0, unitSize * -1);
                    } else {
                        text.dmove(0, unitSize);
                    }
                } else {
                    // usedGlyph.dmove((text.bbox().width / 2) - (unitSize / 2), 0);
                    if (placement === "top") {
                        text.dmove(0, unitSize);
                    } else {
                        text.dmove(0, unitSize * -1);
                    }
                }
                entries.push(entry);
            }
            const fullWidth = (width * entries.length) + ((width / 2) * (entries.length - 1));
            const g = draw.defs().group().id("_key").size(fullWidth, height);
            for (let i = 0; i < entries.length; i++) {
                g.use(entries[i]).dmove(((height * 1.5) * i), 0);
            }
            return g;
        }
    }

    // NOT GENERAL. Assumes we are only drawing in increments of 45 degrees
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
}
