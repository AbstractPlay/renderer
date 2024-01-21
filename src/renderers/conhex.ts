import { Svg } from "@svgdotjs/svg.js";
// import { GridPoints } from "../grids/_base";
import { APRenderRep } from "../schemas/schema";
import { IPolyCircle, IRendererOptionsIn, RendererBase } from "./_base";
import { usePieceAt } from "../common/plotting";
import { IPoint, rectOfRects } from "../grids";

export interface IPiecesArea {
    type: "pieces";
    pieces: [string, ...string[]];
    label: string;
}

/**
 * Generates the pattern of 0s and 1s that denote whether
 * a dot is present on a given row in the top half of the board.
 */
const genMask = (width: number, row: number): string => {
    const half = Math.floor((width - 2) / 2);
    let left = "0";
    for (let i = 0; i < half - 1; i++) {
        left += "1";
    }
    // rotate
    const nums = left.split("");
    for (let i = 0; i < row - 1; i++) {
        nums.unshift(nums.pop()!);
    }
    left = nums.join("");
    const right = [...left.split("")].reverse().join("");
    const mask = left + "1" + right;
    if (mask.length !== width - 2) {
        throw new Error("Mask is the wrong length.");
    }
    return mask;
}

/**
 * This is the default renderer used for most games.
 *
 */
export class ConhexRenderer extends RendererBase {

    public static readonly rendererName: string = "conhex";

    public getConhexPoints(boardsize: number, cellsize: number): (IPolyCircle|null)[][] {
        const r = cellsize * 0.2;
        const midrow = Math.floor(boardsize / 2);
        const grid = rectOfRects({gridHeight: boardsize, gridWidth: boardsize, cellSize: cellsize});

        const polys: (IPolyCircle|null)[][] = [];
        for (let y = 0; y < grid.length; y++) {
            const row: (IPolyCircle|null)[] = [];
            // first and last rows
            if (y === 0 || y === grid.length - 1) {
                row.push({
                    type: "circle",
                    cx: grid[y][0].x,
                    cy: grid[y][0].y,
                    r,
                });
                for (let x = 1; x < grid[y].length - 1; x++) {
                    row.push(null);
                }
                row.push({
                    type: "circle",
                    cx: grid[y][grid[y].length - 1].x,
                    cy: grid[y][grid[y].length - 1].y,
                    r,
                });
            }
            // midrow is the other special case
            else if (y === midrow) {
                row.push(null);
                for (let x = 1; x < grid[y].length - 1; x++) {
                    row.push({
                        type: "circle",
                        cx: grid[y][x].x,
                        cy: grid[y][x].y,
                        r,
                    });
                }
                row.push(null);
            }
            // interior rows
            else  {
                let effrow = y;
                if (y > midrow) {
                    effrow = midrow - (y - midrow);
                }
                row.push(null);
                const mask = genMask(boardsize, effrow);
                for (let x = 1; x < grid[y].length - 1; x++) {
                    if (mask[x - 1] === "1") {
                        row.push({
                            type: "circle",
                            cx: grid[y][x].x,
                            cy: grid[y][x].y,
                            r,
                        });
                    } else {
                        row.push(null);
                    }
                }
                row.push(null);
            }
            polys.push(row);
        }
        return polys;
    }

    public render(json: APRenderRep, draw: Svg, options: IRendererOptionsIn): void {
        this.jsonPrechecks(json);
        if (this.json === undefined) {
            throw new Error("JSON prechecks fatally failed.");
        }
        this.optionsPrecheck(options);
        this.rootSvg = draw;

        // BOARD
        // Delegate to style-specific renderer
        if (this.json.board === null) {
            return this.renderGlyph();
        }

        // Load all the pieces in the legend (have to do this first so the glyphs are available for marking the board)
        this.loadLegend();

        if (! ("style" in this.json.board)) {
            throw new Error(`This 'board' schema cannot be handled by the '${ ConhexRenderer.rendererName }' renderer.`);
        }
        if (this.json.board.style !== "conhex-dots") {
            throw new Error(`The requested board style (${ this.json.board.style }) is not supported by this renderer.`);
        }

        // moving these prechecks here because rendering this board
        // consists of multiple steps
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        const width = this.json.board.width;
        const height = this.json.board.height;
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

        const grid = rectOfRects({gridHeight: boardsize, gridWidth: boardsize, cellSize: cellsize});
        // Make an expanded grid for markers, to accommodate edge marking and shading
        // Add one row and one column and shift all points up and to the left by half a cell size
        let gridExpanded = rectOfRects({gridHeight: boardsize + 1, gridWidth: boardsize + 1, cellSize: cellsize});
        gridExpanded = gridExpanded.map((row) => row.map((cell) => ({x: cell.x - (cellsize / 2), y: cell.y - (cellsize / 2)} as IPoint)));

        const board = this.rootSvg.group().id("board");
        const gridlines = board.group().id("gridlines");
        this.markBoard({svgGroup: gridlines, preGridLines: true, grid, gridExpanded});

        // Add board labels
        if ( (! this.json.options) || (! this.json.options.includes("hide-labels") ) ) {
            const labels = board.group().id("labels");
            let customLabels: string[]|undefined;
            if ( ("columnLabels" in this.json.board) && (this.json.board.columnLabels !== undefined) ) {
                customLabels = this.json.board.columnLabels;
            }
            let columnLabels = this.getLabels(customLabels, boardsize);
            if ( (this.json.options !== undefined) && (this.json.options.includes("reverse-columns")) ) {
                columnLabels = columnLabels.reverse();
            }
            // if (this.options.rotate === 180) {
            //     columnLabels = columnLabels.reverse();
            // }
            // Columns (letters)
            for (let col = 0; col < boardsize; col++) {
                const pointTop = {x: grid[0][col].x, y: grid[0][col].y - cellsize};
                const pointBottom = {x: grid[boardsize - 1][col].x, y: grid[boardsize - 1][col].y + cellsize};
                labels.text(columnLabels[col]).fill(baseColour).opacity(baseOpacity).center(pointTop.x, pointTop.y);
                labels.text(columnLabels[col]).fill(baseColour).opacity(baseOpacity).center(pointBottom.x, pointBottom.y);
            }

            // Rows (numbers)
            const rowLabels = this.getRowLabels(this.json.board.rowLabels, boardsize);
            for (let row = 0; row < boardsize; row++) {
                const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
                const pointR = {x: grid[row][boardsize - 1].x + cellsize, y: grid[row][boardsize - 1].y};
                labels.text(rowLabels[row]).fill(baseColour).opacity(baseOpacity).center(pointL.x, pointL.y);
                labels.text(rowLabels[row]).fill(baseColour).opacity(baseOpacity).center(pointR.x, pointR.y);
            }
        }

        // place cells and give them a base, empty fill
        const cells = this.getConhexCells(boardsize, cellsize);
        for (let row = 0; row < cells.length; row++) {
            for (let col = 0; col < cells[row].length; col++) {
                const poly = cells[row][col];
                const p = board.polygon(poly.points.map(pt => `${pt.x},${pt.y}`).join(" ")).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity}).fill({color: "white", opacity: 0});
                if (this.options.boardClick !== undefined) {
                    p.click(() => this.options.boardClick!(row, col, "cell"))
                }
            }
        }

        // get dot colours
        let pieces: string[][][] = [];
        if (this.json.pieces !== null) {
            // Generate pieces array
            if (typeof this.json.pieces === "string") {
                // Does it contain commas
                if (this.json.pieces.indexOf(",") >= 0) {
                    for (const row of this.json.pieces.split("\n")) {
                        let node: string[][];
                        if (row === "_") {
                            node = new Array(boardsize).fill([]) as string[][];
                        } else {
                            let subs = row.split(",");
                            subs = subs.map((x) => { if (x === "") {return "-"; } else {return x; } });
                            node = subs.map((x) => [x]);
                        }
                        pieces.push(node);
                    }
                } else {
                    for (const row of this.json.pieces.split("\n")) {
                        let node: string[][];
                        if (row === "_") {
                            node = new Array(boardsize).fill([]) as string[][];
                        } else {
                            const subs = row.split("");
                            node = subs.map((x) => [x]);
                        }
                        pieces.push(node);
                    }
                }
            } else if ( (this.json.pieces instanceof Array) && (this.json.pieces[0] instanceof Array) && (this.json.pieces[0][0] instanceof Array) ) {
                pieces = this.json.pieces as string[][][];
            } else {
                throw new Error("Unrecognized `pieces` property.");
            }
        }

        // place dots and colour them according to pieces
        const dots = this.getConhexPoints(boardsize, cellsize);
        for (let row = 0; row < dots.length; row++) {
            for (let col = 0; col < dots[row].length; col++) {
                const poly = dots[row][col];
                if (poly === null) { continue; }
                if (poly !== null) {
                    let fill = "white";
                    if (row < pieces.length) {
                        if (col < pieces[row].length) {
                            const num = parseInt(pieces[row][col][0], 10);
                            if ( (num !== undefined) && (! isNaN(num)) ) {
                                fill = this.options.colours[num - 1];
                            }
                        }
                    }
                    const p = board.circle(poly.r * 2).center(poly.cx, poly.cy).fill({color: fill}).stroke({width: 2, color: "black"});
                    if (this.options.boardClick !== undefined) {
                        p.click(() => this.options.boardClick!(row, col, "dot"))
                    }
                }
            }
        }

        // markers
        this.markBoard({svgGroup: gridlines, preGridLines: false, grid, gridExpanded, polys: cells});


        // annotations
        if (this.options.showAnnotations) {
            this.annotateBoard(grid);
        }

        // `pieces` area, if present
        this.piecesArea(grid);

        // button bar
        this.placeButtonBar(grid);

        // key
        this.placeKey(grid);

        this.backFill();
    }

    /**
     * Helper function for producing a single glyph when `board` is set to `null`.
     *
     */
    private renderGlyph(): void {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in invalid state!");
        }
        // Load all the pieces in the legend
        this.loadLegend();
        if (this.json.pieces === null) {
            throw new Error("There must be a piece given in the `pieces` property.");
        }
        const key = this.json.pieces as string;
        const piece = this.rootSvg.findOne("#" + key) as Svg;
        if ( (piece === null) || (piece === undefined) ) {
            throw new Error(`Could not find the requested piece (${key}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
        }
        this.rootSvg.viewbox(0, 0, this.cellsize, this.cellsize);
        usePieceAt(this.rootSvg, piece, this.cellsize, this.cellsize / 2, this.cellsize / 2, 0.9);
    }
}

