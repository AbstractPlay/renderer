import { Svg } from "@svgdotjs/svg.js";
import { GridPoints } from "../grids/_base";
import { APRenderRep } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase } from "./_base";

export interface IPiecesArea {
    type: "pieces";
    pieces: [string, ...string[]];
    label: string;
}

/**
 * The `stacking-offset` renderer creates stacks of pieces by offsetting them slightly to give a 3D look.
 *
 */
export class StackingOffsetRenderer extends RendererBase {

    public static readonly rendererName: string = "stacking-offset";
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

        if (this.json.board === null) {
            throw new Error("This renderer requires that `board` be defined.");
        }

        // BOARD
        // Delegate to style-specific renderer
        let gridPoints: GridPoints;
        if (! ("style" in this.json.board)) {
            throw new Error(`This 'board' schema cannot be handled by the '${ StackingOffsetRenderer.rendererName }' renderer.`);
        }

        // Load all the pieces in the legend (have to do this early so the glyphs are available for marking the board)
        this.loadLegend();

        switch (this.json.board.style) {
            case "squares-checkered":
            case "squares":
                gridPoints = this.squares();
                break;
            case "go":
                this.json.board.width = 19;
                this.json.board.height = 19;
            case "vertex":
            case "vertex-cross":
                gridPoints = this.vertex();
                break;
            case "snubsquare":
                gridPoints = this.snubSquare();
                break;
            case "hex-of-hex":
                gridPoints = this.hexOfHex();
                break;
            case "hex-of-tri":
                gridPoints = this.hexOfTri();
                break;
            case "hex-of-cir":
                gridPoints = this.hexOfCir();
                break;
            case "hex-odd-p":
            case "hex-even-p":
            case "hex-odd-f":
            case "hex-even-f":
                gridPoints = this.rectOfHex();
                break;
            case "circular-cobweb":
                gridPoints = this.cobweb();
                break;
            default:
                throw new Error(`The requested board style (${ this.json.board.style }) is not supported by the '${ StackingOffsetRenderer.rendererName }' renderer.`);
        }

        // PIECES
        const group = this.rootSvg.group().id("pieces");
        if (this.json.pieces !== null) {
            // Generate pieces array
            let pieces: string[][][] = [];

            if (typeof this.json.pieces === "string") {
                // Does it contain commas
                if (this.json.pieces.indexOf(",") >= 0) {
                    for (const row of this.json.pieces.split("\n")) {
                        let node: string[][] = [];
                        if (row === "_") {
                            node = new Array(this.json.board.width).fill([]) as string[][];
                        } else {
                            const cells = row.split(",");
                            for (const cell of cells) {
                                if (cell === "") {
                                    node.push([]);
                                } else {
                                    node.push([...cell]);
                                }
                            }
                        }
                        pieces.push(node);
                    }
                } else {
                    throw new Error("This renderer requires that you use the comma-delimited or array format of the `pieces` property.");
                }
            } else if ( (this.json.pieces instanceof Array) && (this.json.pieces[0] instanceof Array) && (this.json.pieces[0][0] instanceof Array) ) {
                pieces = this.json.pieces as string[][][];
            } else {
                throw new Error("Unrecognized `pieces` property.");
            }

            // Place the pieces according to the grid
            let offsetPercent = 0.13;
            if ( ("stackOffset" in this.json.board) && (this.json.board.stackOffset !== undefined) ) {
                offsetPercent = this.json.board.stackOffset;
            }
            const offset = this.cellsize * offsetPercent;
            // if the board is rotated, you have to place the pieces in reverse row order
            // for now the code is duplicated
            if (this.options.rotate === 180) {
                // for (let row = 0; row < pieces.length; row++) {
                for (let row = pieces.length - 1; row >= 0; row--) {
                    for (let col = 0; col < pieces[row].length; col++) {
                        for (let i = 0; i < pieces[row][col].length; i++) {
                            const key = pieces[row][col][i];
                            if ( (key !== null) && (key !== "-") ) {
                                const point = gridPoints[row][col];
                                const piece = this.rootSvg.findOne("#" + key) as Svg;
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
                                const newy = point.y - (this.cellsize / 2) + (delta / 2) - (offset * i);
                                use.dmove(newx, newy);
                                use.scale(factor, newx, newy);
                                if (this.options.boardClick !== undefined) {
                                    use.click((e : Event) => {this.options.boardClick!(row, col, i.toString()); e.stopPropagation();});
                                }
                            }
                        }
                    }
                }
            } else {
                for (let row = 0; row < pieces.length; row++) {
                    for (let col = 0; col < pieces[row].length; col++) {
                        for (let i = 0; i < pieces[row][col].length; i++) {
                            const key = pieces[row][col][i];
                            if ( (key !== null) && (key !== "-") ) {
                                const point = gridPoints[row][col];
                                const piece = this.rootSvg.findOne("#" + key) as Svg;
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
                                const newy = point.y - (this.cellsize / 2) + (delta / 2) - (offset * i);
                                use.dmove(newx, newy);
                                use.scale(factor, newx, newy);
                                if (this.options.boardClick !== undefined) {
                                    use.click((e : Event) => {this.options.boardClick!(row, col, i.toString()); e.stopPropagation();});
                                }
                            }
                        }
                    }
                }
            }
        }

        // annotations
        if (this.options.showAnnotations) {
            this.annotateBoard(gridPoints);
        }

        // `pieces` area, if present
        this.piecesArea(gridPoints);

        // button bar
        this.placeButtonBar(gridPoints);

        // key
        this.placeKey(gridPoints);

        this.backFill();
    }
}
