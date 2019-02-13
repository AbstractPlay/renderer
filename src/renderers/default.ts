import svg from "svg.js";
import { rectOfSquares } from "../grids";
import { IRendererOptions, IRendererOptionsProcessed, RendererBase } from "../RendererBase";
import { APRenderRep } from "../schema";

export class DefaultRenderer extends RendererBase {

    public render(json: APRenderRep, draw: svg.Doc, options: IRendererOptions): void {
        json = this.jsonPrechecks(json);
        const opts = this.optionsPrecheck(options);

        // If patterns were requested, load them into the canvas
        if (opts.patterns) {
            this.loadPatterns(draw);
        }

        // BOARD
        // Delegate to style-specific renderer
        if (! ("style" in json.board)) {
            throw new Error(`This 'board' schema cannot be handled by the '${ this.name }' renderer.`);
        }
        switch (json.board.style) {
            case "squares-checkered": {
                this.squaresCheckered(json, draw, opts);
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
        }

        // Now look for coloured pieces and add those to the <defs> section for placement
    }

    private squaresCheckered(json: APRenderRep, draw: svg.Doc, opts: IRendererOptionsProcessed): void {
        // Check required properites
        if ( (! ("width" in json.board)) || (! ("height" in json.board)) || (json.board.width === undefined) || (json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        const width: number = json.board.width;
        const height: number = json.board.height;
        const cellsize = 50;

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
            const x1 = grid[row][0].x;
            const y1 = grid[row][0].y;
            const x2 = grid[row][width - 1].x + cellsize;
            const y2 = grid[row][width - 1].y;
            gridlines.line(x1, y1, x2, y2).stroke({width: 1, color: "#000"});
        }
        let lastx1 = grid[height - 1][0].x;
        let lasty1 = grid[height - 1][0].y + cellsize;
        let lastx2 = grid[height - 1][width - 1].x + cellsize;
        let lasty2 = grid[height - 1][width - 1].y + cellsize;
        gridlines.line(lastx1, lasty1, lastx2, lasty2).stroke({width: 1, color: "#000"});

        // Vertical, left of each column, then right line after loop
        for (let col = 0; col < width; col++) {
            const x1 = grid[0][col].x;
            const y1 = grid[0][col].y;
            const x2 = grid[height - 1][col].x;
            const y2 = grid[height - 1][col].y + cellsize;
            gridlines.line(x1, y1, x2, y2).stroke({width: 1, color: "#000"});
        }
        lastx1 = grid[0][width - 1].x + cellsize;
        lasty1 = grid[0][width - 1].y;
        lastx2 = grid[height - 1][width - 1].x + cellsize;
        lasty2 = grid[height - 1][width - 1].y + cellsize;
        gridlines.line(lastx1, lasty1, lastx2, lasty2).stroke({width: 1, color: "#000"});
    }
}
