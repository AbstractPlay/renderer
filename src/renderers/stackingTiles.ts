import { Svg, G as SVGG } from "@svgdotjs/svg.js";
import { GridPoints, Poly } from "../grids/_base";
import { APRenderRep } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase } from "./_base";

/**
 * The `stacking-tiles` renderer is used to show a side view of a stack of pieces. Currently only used in Focus.
 *
 */
export class StackingTilesRenderer extends RendererBase {

    public static readonly rendererName: string = "stacking-tiles";
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
            throw new Error(`This 'board' schema cannot be handled by the '${ StackingTilesRenderer.rendererName }' renderer.`);
        }
        /*
            This renderer needs a little more information than just the grid points themselves.

            `offsetY` determines the base of the first piece in the stack.
            `tileWidth` is the width of the stacking tiles.
            `tileHeight` is the height of the stacking tiles.
        */
        let maxStack = 8;
        if ("stackMax" in this.json.board) {
            maxStack = this.json.board.stackMax as number;
        }
        const effWidth: number = this.cellsize * 0.9;
        const offsetX: number = effWidth / 2;
        const offsetY: number = effWidth / 2;
        const tileWidth: number = effWidth;
        const tileHeight: number = Math.floor(effWidth / maxStack);
        switch (this.json.board.style) {
            case "squares-checkered":
            case "squares":
                [gridPoints, polys] = this.squares();
                break;
            // case "hex_of_hex":
            //     gridPoints = this.hexOfHex(json, draw, opts);
            //     offsetX = this.cellsize / 4;
            //     offsetY = (this.cellsize * Math.sqrt(3)) / 2;
            //     tileWidth = this.cellsize / 2;
            //     tileHeight = Math.floor((this.cellsize * Math.sqrt(3)) / 8);
            //     break;
            default:
                throw new Error(`The requested board style (${ this.json.board.style }) is not supported by the '${ StackingTilesRenderer.rendererName }' renderer.`);
        }

        // Now place the pieces
        const board = this.rootSvg.findOne("#board") as SVGG;
        const group = board.group().id("pieces");
        if (this.json.pieces !== null) {
            // Generate pieces array
            let pieces: string[][][] = [];

            if (typeof this.json.pieces === "string") {
                // Does it contain commas
                if (this.json.pieces.indexOf(",") >= 0) {
                    for (const row of this.json.pieces.split("\n")) {
                        let node: string[][];
                        if (row === "_") {
                            node = new Array(this.json.board.width).fill([]) as string[][];
                        } else {
                            let cells = row.split(",");
                            cells = cells.map((x) => { if (x === "") {return "-"; } else {return x; } });
                            node = cells.map((x) => [x]);
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
            for (let row = 0; row < pieces.length; row++) {
                for (let col = 0; col < pieces[row].length; col++) {
                    for (const key of pieces[row][col]) {
                        if ( (key !== null) && (key !== "-") ) {
                            let parts = key.split("");
                            if (parts.length > maxStack) {
                                parts = parts.slice(parts.length - maxStack);
                                parts[0] = "0";
                            }
                            const point = gridPoints[row][col];
                            for (let i = 0; i < parts.length; i++) {
                                const idx = parseInt(parts[i], 10);
                                if ( (idx === undefined) && (isNaN(idx)) ) {
                                    throw new Error(`The '${StackingTilesRenderer.rendererName}' renderer expects that each piece in the stack be a single digit between 1 and 9.`);
                                }
                                const x = point.x - offsetX;
                                const y = point.y + offsetY - (tileHeight * (i + 1));
                                // regular piece
                                if (idx > 0) {
                                    const color = this.options.colours[idx - 1];
                                    const tile = group.rect(tileWidth, tileHeight)
                                        .addClass(`aprender-tile-${idx}`)
                                        .move(x, y)
                                        .fill(color)
                                        .stroke({width: tileHeight * 0.2, color: this.options.colourContext.background});
                                    if (this.options.boardClick !== undefined) {
                                        tile.click((e: Event) => {this.options.boardClick!(row, col, (parts.length - i).toString()); e.stopPropagation();});
                                    }
                                // overflow piece (there should only be one)
                                } else {
                                    group.line(x, y + (tileHeight / 2), x + tileWidth, y + (tileHeight / 2))
                                        .addClass("aprender-tile-overflow")
                                        .fill(this.options.colourContext.strokes)
                                        .stroke({width: tileHeight, color: this.options.colourContext.strokes, dasharray: "4"});
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

        // if there's a board backfill, it needs to be done before rotation
        const backfilled = this.backFill(polys, true);

        const box = this.rotateBoard();

        // button bar
        this.placeButtonBar(box);

        // key
        this.placeKey(box);

        if (!backfilled) {
            this.backFill(polys);
        }
    }
}
