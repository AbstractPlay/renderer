import { Svg, G as SVGG } from "@svgdotjs/svg.js";
import { GridPoints, Poly } from "../grids/_base";
import { APRenderRep } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase } from "./_base";
import { matrixRectRot90, projectPoint, usePieceAt } from "../common/plotting";

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
        let polys: Poly[][]|undefined;
        if (! ("style" in this.json.board)) {
            throw new Error(`This 'board' schema cannot be handled by the '${ StackingOffsetRenderer.rendererName }' renderer.`);
        }

        // Load all the pieces in the legend (have to do this early so the glyphs are available for marking the board)
        this.loadLegend();

        switch (this.json.board.style) {
            case "squares-checkered":
            case "squares-beveled":
            case "squares":
                [gridPoints, polys] = this.squares();
                break;
            case "vertex":
            case "vertex-cross":
            case "vertex-fanorona":
                gridPoints = this.vertex();
                break;
            case "snubsquare":
                gridPoints = this.snubSquare();
                break;
            case "hex-of-hex":
                [gridPoints, polys] = this.hexOfHex();
                break;
            case "hex-of-tri":
                gridPoints = this.hexOfTri();
                break;
            case "hex-of-cir":
                [gridPoints, polys] = this.hexOfCir();
                break;
            case "hex-slanted":
                [gridPoints, polys] = this.hexSlanted();
                break;
            case "hex-odd-p":
            case "hex-even-p":
            case "hex-odd-f":
            case "hex-even-f":
                [gridPoints, polys] = this.rectOfHex();
                break;
            case "circular-cobweb":
                [gridPoints, polys] = this.cobweb();
                break;
            case "conhex-cells":
                [gridPoints, polys] = this.conhex();
                break;
            case "cairo-collinear":
                [gridPoints, polys] = this.cairoCollinear();
                break;
            case "cairo-catalan":
                [gridPoints, polys] = this.cairoCatalan();
                break;
            // Adding support for conical-hex* and pyramid-hex purely for the designer
            case "conical-hex":
            case "conical-hex-narrow":
                [gridPoints, polys] = this.conicalHex();
                break;
            case "pyramid-hex":
                [gridPoints, polys] = this.pyramidHex();
                break;
            default:
                throw new Error(`The requested board style (${ this.json.board.style }) is not supported by the '${ StackingOffsetRenderer.rendererName }' renderer.`);
        }

        // PIECES
        const board = this.rootSvg.findOne("#board") as SVGG;
        const group = board.group().id("pieces");
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

            /**
             * Place the pieces according to the grid.
             * This is done in a two-pass process so that stacks are rendered,
             * as well as we can, from the "top" to the "bottom" so lower stacks
             * overlap higher ones. So first generate a matrix of keys and coordinates,
             * then rotate that matrix as necessary and render from top to bottom.
            */
            const rotation = this.getRotation();
            let offsetPercent = 0.13;
            if ( ("stackOffset" in this.json.board) && (this.json.board.stackOffset !== undefined) ) {
                offsetPercent = this.json.board.stackOffset;
            }
            const offset = this.cellsize * offsetPercent;
            type Entries = {
                key: string;
                x: number;
                y: number;
                row: number;
                col: number;
                idx: number;
            }
            let pcs: Entries[][][] = [];
            for (let row = 0; row < pieces.length; row++) {
                const newrow: Entries[][] = [];
                for (let col = 0; col < pieces[row].length; col++) {
                    const entry: Entries[] = [];
                    for (let i = 0; i < pieces[row][col].length; i++) {
                        const key = pieces[row][col][i];
                        if ( (key !== null) && (key !== "-") ) {
                            const point = gridPoints[row][col];
                            const dist = offset * i;
                            const [offsetX, offsetY] = projectPoint(point.x, point.y, dist, rotation * -1);
                            entry.push({key, x: offsetX, y: offsetY, row, col, idx: i});
                        }
                    }
                    newrow.push(entry);
                }
                pcs.push(newrow);
            }
            for (let i = 0; i < Math.floor(rotation / 90); i++) {
                pcs = matrixRectRot90(pcs) as Entries[][][];
            }
            for (const row of pcs) {
                for (const col of row) {
                    for (const entry of col) {
                        // eslint-disable-next-line @typescript-eslint/no-shadow, no-shadow
                        const { key, x, y, row, col, idx } = entry;
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
                        const use = usePieceAt(group, piece, this.cellsize, x, y, 0.85);
                        if ( (this.options.boardClick !== undefined) && (! this.json.options?.includes("no-piece-click")) ) {
                            use.click((e : Event) => {this.options.boardClick!(row, col, idx.toString()); e.stopPropagation();});
                        } else {
                            use.attr({"pointer-events": "none"});
                        }
                    }
                }
            }
        }

        // annotations
        if (this.options.showAnnotations) {
            this.annotateBoard(gridPoints, polys);
        }

        // if there's a board backfill, it needs to be done before rotation
        const backfilled = this.backFill(polys, true);

        const box = this.rotateBoard();

        // `pieces` area, if present
        this.piecesArea(box);

        // button bar
        this.placeButtonBar(box);

        // key
        this.placeKey(box);

        if (!backfilled) {
            this.backFill(polys);
        }
    }
}
