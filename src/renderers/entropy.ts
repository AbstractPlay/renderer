import { Svg } from "@svgdotjs/svg.js";
import { createGridlineLayers, getBoardFill } from "../boards";
import { rectOfRects } from "../grids";
import { IPoint } from "../grids/_base";
import { APRenderRep } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase } from "./_base";
import { usePieceAt } from "../common/plotting";
import { labelDisplayText } from "../common/renderLabel";

/**
 * This is the Entropy-specific renderer that handles the side-by-side rendering and optional occlusion.
 *
 */
export class EntropyRenderer extends RendererBase {

    public static readonly rendererName: string = "entropy";

    constructor() {
        super();
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
            throw new Error(`This 'board' schema cannot be handled by the '${ EntropyRenderer.rendererName }' renderer.`);
        }

        let size = 7;
        if ("size" in this.json.board) {
            size = this.json.board.size as number;
        }
        let label1 = "Player 1: Order";
        let label2 = "Player 2: Order";
        let occlude1 = false;
        let occlude2 = false;
        if ( ("boardOne" in this.json.board) && (this.json.board.boardOne !== undefined) ) {
            if ( ("label" in this.json.board.boardOne) && (this.json.board.boardOne.label !== undefined) ) {
                label1 = labelDisplayText(this.json.board.boardOne.label);
            }
            if ( ("occluded" in this.json.board.boardOne) && (this.json.board.boardOne.occluded !== undefined) ) {
                occlude1 = this.json.board.boardOne.occluded;
            }
        }
        if ( ("boardTwo" in this.json.board) && (this.json.board.boardTwo !== undefined) ) {
            if ( ("label" in this.json.board.boardTwo) && (this.json.board.boardTwo.label !== undefined) ) {
                label2 = labelDisplayText(this.json.board.boardTwo.label);
            }
            if ( ("occluded" in this.json.board.boardTwo) && (this.json.board.boardTwo.occluded !== undefined) ) {
                occlude2 = this.json.board.boardTwo.occluded;
            }
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
        const labelColour = this.options.colourContext.labels;
        const labelOpacity = 1;

        const backFillDef = ("backFill" in this.json.board)
            && this.json.board.backFill !== undefined
            && this.json.board.backFill !== null
            ? this.json.board.backFill as { type?: "full" | "board" }
            : undefined;
        const backFillIsFull = backFillDef?.type === "full";
        const [cellFill, cellOpacity] = getBoardFill(this, this.options.colourContext.background);
        const drawBoardFills = !backFillIsFull && cellFill !== undefined;

        const width = size;
        const height = size;
        const boardOffset = cellsize * (size+1);
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
            const half = Math.floor(size / 2);
            if (this.json.board.orientation === "vertical") {
                titlePoint = {x: grid[0][0].x - (cellsize * 1.5), y: grid[half][0].y};
            } else {
                titlePoint = {x: grid[0][half].x, y: grid[0][0].y - (cellsize * 1.5)};
            }

            const board = this.rootSvg.group().id(boardid);
            const layers = createGridlineLayers(board);

            if (drawBoardFills) {
                const x0 = grid[0][0].x - (cellsize / 2);
                const y0 = grid[0][0].y - (cellsize / 2);
                const fillW = grid[0][width - 1].x + (cellsize / 2) - x0;
                const fillH = grid[height - 1][0].y + (cellsize / 2) - y0;
                layers.fill.rect(fillW, fillH)
                    .move(x0, y0)
                    .fill({color: cellFill ?? this.options.colourContext.background, opacity: cellOpacity})
                    .stroke("none");
            }

            // Add board labels
            const labels = board.group().id("labels");
            const colLabels = this.getLabels(undefined, width);
            // Columns (letters)
            for (let col = 0; col < width; col++) {
                const pointTop = {x: grid[0][col].x, y: grid[0][col].y - cellsize};
                const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + cellsize};
                labels.text(colLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
                // Skip top labels for board two if vertical
                if ( (grid !== grid2) || (this.json.board.orientation !== "vertical") ) {
                    labels.text(colLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
                }
            }

            // Rows (numbers)
            for (let row = 0; row < height; row++) {
                const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
                const pointR = {x: grid[row][width - 1].x + cellsize, y: grid[row][width - 1].y};
                labels.text(`${height - row}`).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
                // Skip left-hand labels for board two if horizontal
                if ( (grid !== grid2) || (this.json.board.orientation !== "horizontal") ) {
                    labels.text(`${height - row}`).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
                }
            }

            // Titles
            const title = labels.text(boardlabel).fill(labelColour).opacity(labelOpacity).font({weight: "bold"}).center(titlePoint.x, titlePoint.y);
            if (this.json.board.orientation === "vertical") {
                title.rotate(-90, titlePoint.x, titlePoint.y);
            }

            // Draw grid lines
            const strokeAttrs = {width: baseStroke, color: baseColour, opacity: baseOpacity};
            // Horizontal, top of each row, then bottom line after loop
            for (let row = 0; row < height; row++) {
                const x1 = grid[row][0].x - (cellsize / 2);
                const y1 = grid[row][0].y - (cellsize / 2);
                const x2 = grid[row][width - 1].x + (cellsize / 2);
                const y2 = grid[row][width - 1].y - (cellsize / 2);
                layers.strokes.line(x1, y1, x2, y2).stroke(strokeAttrs);
            }
            let lastx1 = grid[height - 1][0].x - (cellsize / 2);
            let lasty1 = grid[height - 1][0].y + (cellsize / 2);
            let lastx2 = grid[height - 1][width - 1].x + (cellsize / 2);
            let lasty2 = grid[height - 1][width - 1].y + (cellsize / 2);
            layers.strokes.line(lastx1, lasty1, lastx2, lasty2).stroke(strokeAttrs);

            // Vertical, left of each column, then right line after loop
            for (let col = 0; col < width; col++) {
                const x1 = grid[0][col].x - (cellsize / 2);
                const y1 = grid[0][col].y - (cellsize / 2);
                const x2 = grid[height - 1][col].x - (cellsize / 2);
                const y2 = grid[height - 1][col].y + (cellsize / 2);
                layers.strokes.line(x1, y1, x2, y2).stroke(strokeAttrs);
            }
            lastx1 = grid[0][width - 1].x + (cellsize / 2);
            lasty1 = grid[0][width - 1].y - (cellsize / 2);
            lastx2 = grid[height - 1][width - 1].x + (cellsize / 2);
            lasty2 = grid[height - 1][width - 1].y + (cellsize / 2);
            layers.strokes.line(lastx1, lasty1, lastx2, lasty2).stroke(strokeAttrs);
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
                            const piece = this.rootSvg.findOne("#" + key) as Svg;
                            if ( (piece === null) || (piece === undefined) ) {
                                throw new Error(`Could not find the requested piece (${key}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
                            }
                            usePieceAt({svg: group, piece, cellsize: this.cellsize, x: point.x, y: point.y, scalingFactor: 0.85});
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
                    const t = tiles.use(tile).center(x - (0.95 * this.cellsize / 2), y - (0.95 * this.cellsize / 2));
                    if (this.options.boardClick !== undefined) {
                        t.click(() => this.options.boardClick!(row, col, ""));
                    }
                }
            }
        }

        // Occlude a board if requested (after pieces so the veil covers tokens too)
        if (occlude1) {
            const topleft: IPoint = {x: grid1[0][0].x - (cellsize / 2), y: grid1[0][0].y - (cellsize / 2)};
            const botright: IPoint = {x: grid1[size - 1][size - 1].x + (cellsize / 2), y: grid1[size - 1][size - 1].y + (cellsize / 2)};
            this.rootSvg.rect(botright.x - topleft.x, botright.y - topleft.y)
                .move(topleft.x, topleft.y)
                .fill("black")
                .opacity(.25)
                .addClass("aprender-occlusion")
                .attr({ "pointer-events": "none" });
        }
        if (occlude2) {
            const topleft: IPoint = {x: grid2[0][0].x - (cellsize / 2), y: grid2[0][0].y - (cellsize / 2)};
            const botright: IPoint = {x: grid2[size - 1][size - 1].x + (cellsize / 2), y: grid2[size - 1][size - 1].y + (cellsize / 2)};
            this.rootSvg.rect(botright.x - topleft.x, botright.y - topleft.y)
                .move(topleft.x, topleft.y)
                .fill("black")
                .opacity(.25)
                .addClass("aprender-occlusion")
                .attr({ "pointer-events": "none" });
        }

        // Finally, annotations
        if (backFillIsFull) {
            this.backFill();
        }

        if (this.options.showAnnotations) {
            const gridPoints: IPoint[][] = [...grid1];
            for (let i = 0; i < grid1.length; i++) {
                gridPoints[i].push(...grid2[i]);
            }
            this.annotateBoard(gridPoints);
        }
    }
}
