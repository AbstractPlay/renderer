import { G as SVGG, SVG, Svg } from "@svgdotjs/svg.js";
import { GridPoints } from "../grids/_base";
import { APRenderRep } from "../schema";
import { IRendererOptionsIn, RendererBase } from "./_base";

export class StackingOffsetRenderer extends RendererBase {

    constructor() {
        super("stacking-offset");
    }

    public render(json: APRenderRep, draw: Svg, options: IRendererOptionsIn): void {
        json = this.jsonPrechecks(json);
        this.optionsPrecheck(options);

        if (json.board === null) {
            throw new Error("This renderer requires that `board` be defined.");
        }

        // BOARD
        // Delegate to style-specific renderer
        let gridPoints: GridPoints;
        if (! ("style" in json.board)) {
            throw new Error(`This 'board' schema cannot be handled by the '${ this.name }' renderer.`);
        }

        // Load all the pieces in the legend (have to do this early so the glyphs are available for marking the board)
        this.loadLegend(json, draw);

        switch (json.board.style) {
            case "squares-checkered":
            case "squares":
                gridPoints = this.squares(json, draw);
                break;
            case "go":
                json.board.width = 19;
                json.board.height = 19;
            case "vertex":
            case "vertex-cross":
                gridPoints = this.vertex(json, draw);
                break;
            case "snubsquare":
                gridPoints = this.snubSquare(json, draw);
                break;
            case "hex-of-hex":
                gridPoints = this.hexOfHex(json, draw);
                break;
            case "hex-of-tri":
                gridPoints = this.hexOfTri(json, draw);
                break;
            case "hex-of-cir":
                gridPoints = this.hexOfCir(json, draw);
                break;
            default:
                throw new Error(`The requested board style (${ json.board.style }) is not supported by the '${ this.name }' renderer.`);
        }

        // PIECES
        const group = draw.group().id("pieces");
        if (json.pieces !== null) {
            // Generate pieces array
            let pieces: string[][][] = new Array();

            if (typeof json.pieces === "string") {
                // Does it contain commas
                if (json.pieces.indexOf(",") >= 0) {
                    for (const row of json.pieces.split("\n")) {
                        let node: string[][] = [];
                        if (row === "_") {
                            node = new Array(json.board.width).fill([]);
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
            } else if ( (json.pieces instanceof Array) && (json.pieces[0] instanceof Array) && (json.pieces[0][0] instanceof Array) ) {
                pieces = json.pieces as string[][][];
            } else {
                throw new Error("Unrecognized `pieces` property.");
            }

            // Place the pieces according to the grid
            let offsetPercent = 0.13;
            if ( ("stackOffset" in json.board) && (json.board.stackOffset !== undefined) ) {
                offsetPercent = json.board.stackOffset;
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
                                const piece = SVG("#" + key);
                                if ( (piece === null) || (piece === undefined) ) {
                                    throw new Error(`Could not find the requested piece (${key}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
                                }
                                const use = group.use(piece) as SVGG;
                                use.center(point.x, point.y - (offset * i));
                                const sheetCellSize = piece.attr("data-cellsize");
                                if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                                    throw new Error(`The glyph you requested (${key}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                                }
                                use.scale((this.cellsize / sheetCellSize) * 0.85);
                                if (this.options.boardClick !== undefined) {
                                    use.click(() => this.options.boardClick!(row, col, i.toString()));
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
                                const piece = SVG("#" + key) as Svg;
                                if ( (piece === null) || (piece === undefined) ) {
                                    throw new Error(`Could not find the requested piece (${key}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
                                }
                                let sheetCellSize = piece.viewbox().h;
                                if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                                    sheetCellSize = piece.attr("data-cellsize");
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
                                    use.click(() => this.options.boardClick!(row, col, i.toString()));
                                }
                            }
                        }
                    }
                }
            }
        }

        // Finally, annotations
        if (this.options.showAnnotations) {
            this.annotateBoard(json, draw, gridPoints);
        }
    }
}
