import svg from "svg.js";
import { GridPoints } from "../GridGenerator";
import { rectOfSquares } from "../grids";
import { IRendererOptionsIn, IRendererOptionsOut, RendererBase } from "../RendererBase";
import { APRenderRep } from "../schema";

export class DefaultRenderer extends RendererBase {

    public render(json: APRenderRep, draw: svg.Doc, options: IRendererOptionsIn): void {
        json = this.jsonPrechecks(json);
        const opts = this.optionsPrecheck(options);

        // If patterns were requested, load them into the canvas
        if (opts.patterns) {
            this.loadPatterns(draw);
        }

        // BOARD
        // Delegate to style-specific renderer
        let gridPoints: GridPoints;
        if (! ("style" in json.board)) {
            throw new Error(`This 'board' schema cannot be handled by the '${ this.name }' renderer.`);
        }
        switch (json.board.style) {
            case "squares-checkered": {
                gridPoints = this.squaresCheckered(json, draw, opts);
                break;
            }
            default: {
                throw new Error(`The requested board style (${ json.board.style })is not yet supported by the default renderer.`);
                break;
            }
        }

        // PIECES
        // Load all the pieces in the legend
        if ( ("legend" in json) && (json.legend !== undefined) ) {
            const glyphSet = new Set();
            // tslint:disable-next-line: forin
            for (const key in json.legend) {
                const node = json.legend[key];
                if (typeof(node) === "string") {
                    glyphSet.add(node);
                } else {
                    glyphSet.add(node.name);
                }
            }
            for (const glyph of glyphSet) {
                this.loadGlyph(glyph, opts.sheetList, draw);
            }

            // Now look for coloured pieces and add those to the <defs> section for placement
            // tslint:disable-next-line: forin
            for (const key in json.legend) {
                const node = json.legend[key];
                if (typeof(node) !== "string") {
                    const use = svg.get(node.name);
                    const newuse = use.clone().id(key);
                    // draw.defs().use(use).id(key);
                    // const newuse = svg.get(key);
                    if (node.colour !== undefined) {
                        if  (opts.patterns) {
                            if (node.colour > opts.patternList.length) {
                                throw new Error("The list of patterns provided is not long enough to support the number of players in this game.");
                            }
                            const fill = svg.get(opts.patternList[node.colour - 1]);
                            if (newuse.is(svg.G)) {
                                (newuse as svg.G).select("[data-playerfill=true]").each(function(this: svg.Element) { this.fill(fill); });
                            } else {
                                newuse.fill(fill);
                            }
                        } else {
                            if (node.colour > opts.colours.length) {
                                throw new Error("The list of patterns provided is not long enough to support the number of players in this game.");
                            }
                            const fill = opts.colours[node.colour - 1];
                            if (newuse.is(svg.G)) {
                                (newuse as svg.G).select("[data-playerfill=true]").each(function(this: svg.Element) { this.fill(fill); });
                            } else {
                                newuse.fill(fill);
                            }
                        }
                    }
                }
            }
        }

        // Now place the pieces
        const group = draw.group().id("pieces");
        if (json.pieces !== null) {
            // Is it an array
            if (json.pieces instanceof Array) {
                throw new Error("The array format of the `pieces` property is not yet implemented.");
            // Does it contain commas
            } else if (json.pieces.indexOf(",") >= 0) {
                throw new Error("The comma format of the `pieces` property is not yet implemented.");
            } else {
                const pieces: string[][] = new Array();
                for (const row of json.pieces.split("\n")) {
                    let node: string[];
                    if (row === "_") {
                        node = new Array(json.board.width).fill("-");
                    } else {
                        node = row.split("");
                    }
                    pieces.push(node);
                }
                for (let row = 0; row < pieces.length; row++) {
                    for (let col = 0; col < pieces[row].length; col++) {
                        const key = pieces[row][col];
                        if (key !== "-") {
                            const point = gridPoints[row][col];
                            const piece = svg.get(key);
                            if ( (piece === null) || (piece === undefined) ) {
                                throw new Error(`Could not find the requested piece (${key}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
                            }
                            const use = group.use(piece);
                            use.center(point.x, point.y);
                            if (piece.is(svg.G)) {
                                const sheetCellSize = piece.attr("data-cellsize");
                                if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                                    throw new Error(`The glyph you requested (${key}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                                }
                                use.scale(this.cellsize / sheetCellSize);
                            } else {
                                use.size(this.cellsize);
                            }
                        }
                    }
                }
            }
        }
    }

    private squaresCheckered(json: APRenderRep, draw: svg.Doc, opts: IRendererOptionsOut): GridPoints {
        // Check required properites
        if ( (! ("width" in json.board)) || (! ("height" in json.board)) || (json.board.width === undefined) || (json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        const width: number = json.board.width;
        const height: number = json.board.height;
        const cellsize = this.cellsize;

        // Load glyphs for light and dark squares
        this.loadGlyph("tileLight", opts.sheetList, draw);
        this.loadGlyph("tileDark", opts.sheetList, draw);
        const tileLight = svg.get("tileLight").size(cellsize, cellsize);
        const tileDark = svg.get("tileDark").size(cellsize, cellsize);

        // Get a grid of points
        const grid = rectOfSquares({gridHeight: height, gridWidth: width, cellSize: cellsize});

        // Determine whether the first row starts with a light or dark square
        let startLight: number = 1;
        if (height % 2 === 0) {
            startLight = 0;
        }

        // Place them
        const board = draw.group().id("board");
        for (let row = 0; row < height; row++) {
            let lightCol: number = 1;
            if (row % 2 === startLight) {
                lightCol = 0;
            }
            for (let col = 0; col < width; col++) {
                let tile = tileDark;
                if (col % 2 === lightCol) {
                    tile = tileLight;
                }
                const {x, y} = grid[row][col];
                board.use(tile).center(x, y);
            }
        }

        // Draw grid lines
        const gridlines = draw.group().id("gridlines");
        // Horizontal, top of each row, then bottom line after loop
        for (let row = 0; row < height; row++) {
            const x1 = grid[row][0].x - (cellsize / 2);
            const y1 = grid[row][0].y - (cellsize / 2);
            const x2 = grid[row][width - 1].x + (cellsize / 2);
            const y2 = grid[row][width - 1].y - (cellsize / 2);
            gridlines.line(x1, y1, x2, y2).stroke({width: 1, color: "#000"});
        }
        let lastx1 = grid[height - 1][0].x - (cellsize / 2);
        let lasty1 = grid[height - 1][0].y + (cellsize / 2);
        let lastx2 = grid[height - 1][width - 1].x + (cellsize / 2);
        let lasty2 = grid[height - 1][width - 1].y + (cellsize / 2);
        gridlines.line(lastx1, lasty1, lastx2, lasty2).stroke({width: 1, color: "#000"});

        // Vertical, left of each column, then right line after loop
        for (let col = 0; col < width; col++) {
            const x1 = grid[0][col].x - (cellsize / 2);
            const y1 = grid[0][col].y - (cellsize / 2);
            const x2 = grid[height - 1][col].x - (cellsize / 2);
            const y2 = grid[height - 1][col].y + (cellsize / 2);
            gridlines.line(x1, y1, x2, y2).stroke({width: 1, color: "#000"});
        }
        lastx1 = grid[0][width - 1].x + (cellsize / 2);
        lasty1 = grid[0][width - 1].y - (cellsize / 2);
        lastx2 = grid[height - 1][width - 1].x + (cellsize / 2);
        lasty2 = grid[height - 1][width - 1].y + (cellsize / 2);
        gridlines.line(lastx1, lasty1, lastx2, lasty2).stroke({width: 1, color: "#000"});

        return grid;
    }
}
