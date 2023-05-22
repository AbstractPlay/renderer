import { Svg, Use as SVGUse } from "@svgdotjs/svg.js";
import { GridPoints } from "../grids/_base";
import { APRenderRep } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase } from "./_base";

export interface IPiecesArea {
    type: "pieces";
    pieces: [string, ...string[]];
    label: string;
}

/**
 * This is the default renderer used for most games.
 *
 */
export class DefaultRenderer extends RendererBase {

    public static readonly rendererName: string = "default";

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

        let gridPoints: GridPoints;
        if (! ("style" in this.json.board)) {
            throw new Error(`This 'board' schema cannot be handled by the '${ DefaultRenderer.rendererName }' renderer.`);
        }
        switch (this.json.board.style) {
            case "squares-beveled":
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
            default:
                throw new Error(`The requested board style (${ this.json.board.style }) is not yet supported by the default renderer.`);
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
                    for (const row of this.json.pieces.split("\n")) {
                        let node: string[][];
                        if (row === "_") {
                            node = new Array(this.json.board.width).fill([]) as string[][];
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
                            const newy = point.y - (this.cellsize / 2) + (delta / 2);
                            use.dmove(newx, newy);
                            use.scale(factor, newx, newy);
                            if (options.rotate && this.json.options && this.json.options.includes('rotate-pieces'))
                                use.rotate(options.rotate);
                            if (this.options.boardClick !== undefined) {
                                if ( ( (this.json.board.tileSpacing !== undefined) && (this.json.board.tileSpacing > 0) ) || ( (! this.json.board.style.startsWith("squares")) && (! this.json.board.style.startsWith("vertex")) ) ) {
                                    use.click((e : Event) => {this.options.boardClick!(row, col, key); e.stopPropagation(); });
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
        if ( (this.json !== undefined) && (this.json.areas !== undefined) && (Array.isArray(this.json.areas)) && (this.json.areas.length > 0) ) {
            const areas = this.json.areas.filter((x) => x.type === "pieces") as IPiecesArea[];
            const boardBottom = gridPoints[gridPoints.length - 1][0].y + this.cellsize;
            // Width in number of cells, taking the maximum board width
            const boardWidth = Math.max(...gridPoints.map(r => r.length));
            let placeY = boardBottom + (this.cellsize / 2);
            for (let iArea = 0; iArea < areas.length; iArea++) {
                const area = areas[iArea];
                const numPieces = area.pieces.length;
                const numRows = Math.ceil(numPieces / boardWidth);
                const textHeight = 10; // the allowance for the label
                const cellsize = this.cellsize * 0.75;
                const areaWidth = cellsize * boardWidth;
                const areaHeight = (textHeight * 2) + (cellsize * numRows);
                const nested = this.rootSvg.defs().nested().id(`_pieces${iArea}`).size(areaWidth+2, areaHeight+2).viewbox(-1, -1, areaWidth+2, areaHeight+2);
                for (let iPiece = 0; iPiece < area.pieces.length; iPiece++) {
                    const used: [SVGUse, number][] = [];
                    const p = area.pieces[iPiece];
                    const row = Math.floor(iPiece / boardWidth);
                    const col = iPiece % boardWidth;
                    const piece = this.rootSvg.findOne("#" + p) as Svg;
                    if ( (piece === null) || (piece === undefined) ) {
                        throw new Error(`Could not find the requested piece (${p}). Each piece in the stack *must* exist in the \`legend\`.`);
                    }
                    let sheetCellSize = piece.viewbox().h;
                    if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                        sheetCellSize = piece.attr("data-cellsize") as number;
                        if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                            throw new Error(`The glyph you requested (${p}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                        }
                    }
                    const use = nested.use(piece);
                    if (this.options.boardClick !== undefined) {
                        use.click((e: Event) => {this.options.boardClick!(-1, -1, p); e.stopPropagation();});
                    }
                    used.push([use, piece.viewbox().h]);
                    const factor = (cellsize / sheetCellSize);
                    const newx = col * cellsize;
                    const newy = (textHeight * 2) + (row * cellsize);
                    use.dmove(newx, newy);
                    use.scale(factor, newx, newy);
                }

                // Add area label
                const tmptxt = this.rootSvg.text(area.label).font({size: textHeight, anchor: "start", fill: "#000"});
                const txtWidth = tmptxt.bbox().w;
                tmptxt.remove();
                nested.width(Math.max(areaWidth, txtWidth));
                const txt = nested.text(area.label);
                txt.font({size: textHeight, anchor: "start", fill: "#000"})
                    .attr("alignment-baseline", "hanging")
                    .attr("dominant-baseline", "hanging")
                    .move(0, 0);

                // Now place the whole group below the board
                const placed = this.rootSvg.use(nested);
                placed.move(gridPoints[0][0].x, placeY);
                placeY += placed.bbox().height + (this.cellsize * 0.5);
            }
        }

        // button bar
        this.placeButtonBar(gridPoints);

        // key
        this.placeKey(gridPoints);
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
        let sheetCellSize = piece.viewbox().h;
        if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
            sheetCellSize = piece.attr("data-cellsize") as number;
            if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                throw new Error(`The glyph you requested (${key}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
            }
        }
        this.rootSvg.use(piece);
    }
}

