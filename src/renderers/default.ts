import { SVG, Svg } from "@svgdotjs/svg.js";
import { GridPoints } from "../grids/_base";
import { APRenderRep } from "../schema";
import { IRendererOptionsIn, RendererBase } from "./_base";

export class DefaultRenderer extends RendererBase {

    public render(json: APRenderRep, draw: Svg, options: IRendererOptionsIn): void {
        json = this.jsonPrechecks(json);
        this.optionsPrecheck(options);

        // BOARD
        // Delegate to style-specific renderer
        if (json.board === null) {
            return this.renderGlyph(json, draw);
        }

        // Load all the pieces in the legend (have to do this first so the glyphs are available for marking the board)
        this.loadLegend(json, draw);

        let gridPoints: GridPoints;
        if (! ("style" in json.board)) {
            throw new Error(`This 'board' schema cannot be handled by the '${ this.name }' renderer.`);
        }
        switch (json.board.style) {
            case "squares-beveled":
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
            case "hex-odd-p":
            case "hex-even-p":
            case "hex-odd-f":
            case "hex-even-f":
                gridPoints = this.rectOfHex(json, draw);
                break;
            default:
                throw new Error(`The requested board style (${ json.board.style }) is not yet supported by the default renderer.`);
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
                        let node: string[][];
                        if (row === "_") {
                            node = new Array(json.board.width).fill([]);
                        } else {
                            let cells = row.split(",");
                            cells = cells.map((x) => { if (x === "") {return "-"; } else {return x; } });
                            node = cells.map((x) => [x]);
                        }
                        pieces.push(node);
                    }
                } else {
                    for (const row of json.pieces.split("\n")) {
                        let node: string[][];
                        if (row === "_") {
                            node = new Array(json.board.width).fill([]);
                        } else {
                            const cells = row.split("");
                            node = cells.map((x) => [x]);
                        }
                        pieces.push(node);
                    }
                }
            } else if ( (json.pieces instanceof Array) && (json.pieces[0] instanceof Array) && (json.pieces[0][0] instanceof Array) ) {
                pieces = json.pieces as string[][][];
            } else {
                throw new Error("Unrecognized `pieces` property.");
            }

            // Place the pieces according to the grid
            for (let row = 0; row < pieces.length; row++) {
                for (let col = 0; col < pieces[row].length; col++) {
                    for (const key of pieces[row][col]) {
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
                            const newy = point.y - (this.cellsize / 2) + (delta / 2);
                            use.dmove(newx, newy);
                            use.scale(factor, newx, newy);
                            if (this.options.boardClick !== undefined) {
                                if ( ( (json.board.tileSpacing !== undefined) && (json.board.tileSpacing > 0) ) || ( (! json.board.style.startsWith("squares")) && (! json.board.style.startsWith("vertex")) ) ) {
                                    use.click(() => this.options.boardClick!(row, col, key));
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

    private renderGlyph(json: APRenderRep, draw: Svg): void {
        // Load all the pieces in the legend
        this.loadLegend(json, draw);
        if (json.pieces === null) {
            throw new Error("There must be a piece given in the `pieces` property.");
        }
        const key = json.pieces;
        const piece = draw.findOne("#" + key) as Svg;
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
        draw.use(piece);
    }
}
