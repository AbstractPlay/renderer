import { Svg, G as SVGG } from "@svgdotjs/svg.js";
import { GridPoints, IPoint, Poly } from "../grids/_base";
import { APRenderRep } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase } from "./_base";
import { centroid, projectPoint, rotatePoint, usePieceAt } from "../common/plotting";

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
        let pcGrid: GridPoints|undefined;
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
            case "squares-diamonds":
                [gridPoints, polys] = this.squaresDiamonds();
                break;
            case "vertex":
            case "vertex-cross":
            case "vertex-fanorona":
                gridPoints = this.vertex();
                break;
            case "snubsquare":
                gridPoints = this.snubSquare();
                break;
            case "onyx":
                gridPoints = this.onyx();
                break;
            case "snubsquare-cells":
                [gridPoints, polys] = this.snubSquareCells();
                break;
            case "pentagonal":
            case "pentagonal-bluestone":
                gridPoints = this.pentagonal();
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
            case "circular-wheel":
                [gridPoints, polys] = this.wheel();
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
            case "circular-moon":
                this.cellsize = 15;
                [gridPoints, polys] = this.moon();
                break;
            case "sowing-round":
                gridPoints = this.sowingRound();
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
            const ctr = centroid(gridPoints.flat().flat())!;
            type Entry = {
                key: string;
                x: number;
                y: number;
                rotx: number;
                roty: number;
                row: number;
                col: number;
                idx: number;
            }
            const pcs: Entry[][] = [];
            for (let row = 0; row < pieces.length; row++) {
                for (let col = 0; col < pieces[row].length; col++) {
                    const entry: Entry[] = []
                    for (let i = 0; i < pieces[row][col].length; i++) {
                        const key = pieces[row][col][i];
                        if ( (key !== null) && (key !== "-") ) {
                            let point: IPoint;
                            if (pcGrid !== undefined) {
                                point = pcGrid[row][col];
                            } else {
                                point = gridPoints[row][col];
                            }
                            const dist = offset * i;
                            const [offsetX, offsetY] = projectPoint(point.x, point.y, dist, rotation * -1);
                            const rot = rotatePoint({x: offsetX, y: offsetY}, rotation, ctr);
                            entry.push({key, x: offsetX, y: offsetY, row, col, idx: i, rotx: rot.x, roty: rot.y});
                        }
                    }
                    if (entry.length > 0) {
                        pcs.push(entry);
                    }
                }
            }
            // sort the cells top to bottom, left to right, based on first entry
            pcs.sort((a,b) => {
                const a0 = a[0];
                const b0 = b[0];
                if (a0.roty === b0.roty) {
                    return a0.rotx - b0.rotx;
                } else {
                    return a0.roty - b0.roty;
                }
            });
            for (const cell of pcs) {
                for (const entry of cell) {
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
                    const use = usePieceAt({svg: group, piece, cellsize: this.cellsize, x, y, scalingFactor: 0.85});
                    if ( (this.options.boardClick !== undefined) && (! this.json.options?.includes("no-piece-click")) ) {
                        use.click((e : Event) => {this.options.boardClick!(row, col, idx.toString()); e.stopPropagation();});
                    } else {
                        use.attr({"pointer-events": "none"});
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

        // compassRose
        this.placeCompass(box);

        if (!backfilled) {
            this.backFill(polys);
        }
    }
}
