import { SVG, Svg } from "@svgdotjs/svg.js";
import { rectOfRects } from "../grids";
import { IPoint } from "../grids/_base";
import { APRenderRep } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase } from "./_base";

/**
 * This is the Entropy-specific renderer that handles the side-by-side rendering and optional occlusion.
 *
 * @export
 * @class EntropyRenderer
 * @extends {RendererBase}
 */
export class EntropyRenderer extends RendererBase {

    constructor() {
        super("entropy");
    }

    public render(json: APRenderRep, draw: Svg, options: IRendererOptionsIn): void {
        this.jsonPrechecks(json);
        if (this.json === undefined) {
            throw new Error("JSON prechecks fatally failed.");
        }
        this.optionsPrecheck(options);
        this.rootSvg = draw;

        // BOARD
        if ( (this.json.board === null) || (! ("style" in this.json.board)) || (this.json.board.style !== "entropy") ) {
            throw new Error(`This 'board' schema cannot be handled by the '${ this.name }' renderer.`);
        }

        let label1 = "Player 1: Order";
        let label2 = "Player 2: Order";
        let occlude1 = false;
        let occlude2 = false;
        if ( ("boardOne" in this.json.board) && (this.json.board.boardOne !== undefined) ) {
            if ( ("label" in this.json.board.boardOne) && (this.json.board.boardOne.label !== undefined) ) {
                label1 = this.json.board.boardOne.label;
            }
            if ( ("occluded" in this.json.board.boardOne) && (this.json.board.boardOne.occluded !== undefined) ) {
                occlude1 = this.json.board.boardOne.occluded;
            }
        }
        if ( ("boardTwo" in this.json.board) && (this.json.board.boardTwo !== undefined) ) {
            if ( ("label" in this.json.board.boardTwo) && (this.json.board.boardTwo.label !== undefined) ) {
                label2 = this.json.board.boardTwo.label;
            }
            if ( ("occluded" in this.json.board.boardTwo) && (this.json.board.boardTwo.occluded !== undefined) ) {
                occlude2 = this.json.board.boardTwo.occluded;
            }
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

        const width = 7;
        const height = 7;
        const boardOffset = cellsize * 8;
        // Get a grid of points
        const grid1 = rectOfRects({gridHeight: height, gridWidth: width, cellSize: cellsize});
        let startx = boardOffset;
        let starty = 0;
        if ( (this.json.board.orientation !== undefined) && (this.json.board.orientation === "vertical") ) {
            startx = 0;
            starty = boardOffset;
        }
        const grid2 = rectOfRects({gridHeight: height, gridWidth: width, cellSize: cellsize, startx, starty});

        for (const grid of [grid1, grid2]) {
            let boardid = "neverEver";
            let boardlabel = "neverEver";
            if (grid === grid1) {
                boardid = "boardOne";
                boardlabel = label1;
            } else if (grid === grid2) {
                boardid = "boardTwo";
                boardlabel = label2;
            }
            let titlePoint: IPoint = {x: 0, y: 0};
            if (this.json.board.orientation === "vertical") {
                titlePoint = {x: grid[0][0].x - (cellsize * 1.5), y: grid[3][0].y};
            } else {
                titlePoint = {x: grid[0][3].x, y: grid[0][0].y - (cellsize * 1.5)};
            }

            const board = this.rootSvg.group().id(boardid);

            // Add board labels
            const labels = board.group().id("labels");
            // Columns (letters)
            for (let col = 0; col < width; col++) {
                const pointTop = {x: grid[0][col].x, y: grid[0][col].y - cellsize};
                const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + cellsize};
                labels.text(this.columnLabels[col]).fill(baseColour).opacity(baseOpacity).center(pointBottom.x, pointBottom.y);
                // Skip top labels for board two if vertical
                if ( (grid !== grid2) || (this.json.board.orientation !== "vertical") ) {
                    labels.text(this.columnLabels[col]).fill(baseColour).opacity(baseOpacity).center(pointTop.x, pointTop.y);
                }
            }

            // Rows (numbers)
            for (let row = 0; row < height; row++) {
                const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
                const pointR = {x: grid[row][width - 1].x + cellsize, y: grid[row][width - 1].y};
                labels.text(`${height - row}`).fill(baseColour).opacity(baseOpacity).center(pointR.x, pointR.y);
                // Skip left-hand labels for board two if horizontal
                if ( (grid !== grid2) || (this.json.board.orientation !== "horizontal") ) {
                    labels.text(`${height - row}`).fill(baseColour).opacity(baseOpacity).center(pointL.x, pointL.y);
                }
            }

            // Titles
            const title = labels.text(boardlabel).fill(baseColour).opacity(baseOpacity).font({weight: "bold"}).center(titlePoint.x, titlePoint.y);
            if (this.json.board.orientation === "vertical") {
                title.rotate(-90, titlePoint.x, titlePoint.y);
            }

            // Draw grid lines
            const gridlines = this.rootSvg.group().id("gridlines");
            // Horizontal, top of each row, then bottom line after loop
            for (let row = 0; row < height; row++) {
                const x1 = grid[row][0].x - (cellsize / 2);
                const y1 = grid[row][0].y - (cellsize / 2);
                const x2 = grid[row][width - 1].x + (cellsize / 2);
                const y2 = grid[row][width - 1].y - (cellsize / 2);
                gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
            }
            let lastx1 = grid[height - 1][0].x - (cellsize / 2);
            let lasty1 = grid[height - 1][0].y + (cellsize / 2);
            let lastx2 = grid[height - 1][width - 1].x + (cellsize / 2);
            let lasty2 = grid[height - 1][width - 1].y + (cellsize / 2);
            gridlines.line(lastx1, lasty1, lastx2, lasty2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});

            // Vertical, left of each column, then right line after loop
            for (let col = 0; col < width; col++) {
                const x1 = grid[0][col].x - (cellsize / 2);
                const y1 = grid[0][col].y - (cellsize / 2);
                const x2 = grid[height - 1][col].x - (cellsize / 2);
                const y2 = grid[height - 1][col].y + (cellsize / 2);
                gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
            }
            lastx1 = grid[0][width - 1].x + (cellsize / 2);
            lasty1 = grid[0][width - 1].y - (cellsize / 2);
            lastx2 = grid[height - 1][width - 1].x + (cellsize / 2);
            lasty2 = grid[height - 1][width - 1].y + (cellsize / 2);
            gridlines.line(lastx1, lasty1, lastx2, lasty2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
        }

        // PIECES
        // Load all the pieces in the legend
        this.loadLegend();

        // Now place the pieces
        const group = this.rootSvg.group().id("pieces");
        if (this.json.pieces !== null) {
            // Generate pieces array
            let pieces: string[][][] = [];

            if (typeof this.json.pieces === "string") {
                // Does it contain commas
                if (this.json.pieces.indexOf(",") >= 0) {
                    for (const row of this.json.pieces.split("\n")) {
                        let node: string[][];
                        if (row === "_") {
                            node = new Array(width * 2).fill([]) as string[][];
                        } else {
                            let cells = row.split(",");
                            cells = cells.map((x) => { if (x === "") {return "-"; } else {return x; } });
                            node = cells.map((x) => [x]);
                        }
                        pieces.push(node);
                    }
                } else {
                    for (const row of this.json.pieces.split("\n")) {
                        let node: string[][];
                        if (row === "_") {
                            node = new Array(width).fill([]) as string[][];
                        } else {
                            const cells = row.split("");
                            node = cells.map((x) => [x]);
                        }
                        pieces.push(node);
                    }
                }
            } else if ( (this.json.pieces instanceof Array) && (this.json.pieces[0] instanceof Array) && (this.json.pieces[0][0] instanceof Array) ) {
                pieces = this.json.pieces as string[][][];
            } else {
                throw new Error("Unrecognized `pieces` property.");
            }

            // Place the pieces according to the grid
            for (let row = 0; row < pieces.length; row++) {
                for (let col = 0; col < pieces[row].length; col++) {
                    for (const key of pieces[row][col]) {
                        if ( (key !== null) && (key !== "-") ) {
                            let point: IPoint = grid1[row][col];
                            if (col >= width) {
                                point = grid2[row][col - width];
                            }
                            const piece = SVG("#" + key) as Svg;
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
                            const use = group.use(piece);
                            const factor = (this.cellsize / sheetCellSize) * 0.85;
                            const newsize = sheetCellSize * factor;
                            const delta = this.cellsize - newsize;
                            const newx = point.x - (this.cellsize / 2) + (delta / 2);
                            const newy = point.y - (this.cellsize / 2) + (delta / 2);
                            use.dmove(newx, newy);
                            use.scale(factor, newx, newy);
                        }
                    }
                }
            }
        }

        for (const grid of [grid1, grid2]) {
            const tile = this.rootSvg.defs().rect(this.cellsize * 0.95, this.cellsize * 0.95).fill("#fff").opacity(0).id("_clickCatcher");
            const tiles = this.rootSvg.group().id("tiles");
            for (let row = 0; row < grid.length; row++) {
                for (let col = 0; col < grid[row].length; col++) {
                    const {x, y} = grid[row][col];
                    const t = tiles.use(tile).center(x, y);
                    if (this.options.boardClick !== undefined) {
                        t.click(() => this.options.boardClick!(row, col, ""));
                    }
                }
            }
        }

        // Occlude a board if requested
        if (occlude1) {
            const topleft: IPoint = {x: grid1[0][0].x - (cellsize / 2), y: grid1[0][0].y - (cellsize / 2)};
            const botright: IPoint = {x: grid1[6][6].x + (cellsize / 2), y: grid1[6][6].y + (cellsize / 2)};
            this.rootSvg.rect(botright.x - topleft.x, botright.y - topleft.y).move(topleft.x, topleft.y).fill("black").opacity(.85);
        }
        if (occlude2) {
            const topleft: IPoint = {x: grid2[0][0].x - (cellsize / 2), y: grid2[0][0].y - (cellsize / 2)};
            const botright: IPoint = {x: grid2[6][6].x + (cellsize / 2), y: grid2[6][6].y + (cellsize / 2)};
            this.rootSvg.rect(botright.x - topleft.x, botright.y - topleft.y).move(topleft.x, topleft.y).fill("black").opacity(.85);
        }

        // Finally, annotations
        if (this.options.showAnnotations) {
            const gridPoints: IPoint[][] = [...grid1];
            for (let i = 0; i < grid1.length; i++) {
                gridPoints[i].push(...grid2[i]);
            }
            this.annotateBoard(gridPoints);
        }
    }
}
