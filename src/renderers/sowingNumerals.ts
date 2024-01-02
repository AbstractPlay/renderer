import { Svg } from "@svgdotjs/svg.js";
import { GridPoints } from "../grids/_base";
import { APRenderRep } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase } from "./_base";
import { usePieceAt, scale } from "../common/plotting";

export interface IPiecesArea {
    type: "pieces";
    pieces: [string, ...string[]];
    label: string;
}

/**
 * This is the default renderer used for most games.
 *
 */
export class SowingNumeralsRenderer extends RendererBase {

    public static readonly rendererName: string = "sowing-numerals";

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
            throw new Error(`This 'board' schema cannot be handled by the '${ SowingNumeralsRenderer.rendererName }' renderer.`);
        }
        switch (this.json.board.style) {
            case "sowing":
                gridPoints = this.sowing();
                break;
            default:
                throw new Error(`The requested board style (${ this.json.board.style }) is not supported by this renderer.`);
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

            // generate numerical glyphs for each unique pit size
            const sizes = new Set<string>(pieces.flat().flat());
            for (const key of sizes) {
                if ( (isNaN(parseInt(key, 10))) || (parseInt(key, 10) === 0) ) {
                    continue;
                }
                const cellsize = 500;
                const nested = this.rootSvg.defs().nested().id(`_pips_${key}`).attr({ 'pointer-events': 'none' });
                const nestedGroup = nested.symbol().id(`_pips_numeral_${key}`);
                const fontsize = 17;
                const text = nestedGroup.text(key).font({
                    anchor: "start",
                    fill: "#000",
                    size: fontsize,
                });
                text.attr("data-playerfill", true);
                const temptext = this.rootSvg.text(key).font({
                    anchor: "start",
                    fill: "#000",
                    size: fontsize,
                });
                const squaresize = Math.max(temptext.bbox().height, temptext.bbox().width);
                nestedGroup.viewbox(temptext.bbox().x, temptext.bbox().y, temptext.bbox().width, temptext.bbox().height);
                nestedGroup.attr("data-cellsize", squaresize);
                temptext.remove();
                const got = nestedGroup;

                let sheetCellSize = got.viewbox().height;
                if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                    sheetCellSize = got.attr("data-cellsize") as number;
                    if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                        throw new Error(`The glyph you requested (${key}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                    }
                }

                const use = nested.use(got).height(cellsize).width(cellsize).x(-cellsize / 2).y(-cellsize / 2);

                // Scale it appropriately
                scale(use, 0.5, 0, 0);
                const size = 0.75 * cellsize;
                nested.viewbox(-size / 2, -size / 2, size, size).size(size, size);
            }

            // Place the pieces according to the grid
            for (let row = 0; row < pieces.length; row++) {
                for (let col = 0; col < pieces[row].length; col++) {
                    for (const key of pieces[row][col]) {
                        if ( (key !== null) && (key !== "-") && (key !== "0") ) {
                            const point = gridPoints[row][col];
                            const piece = this.rootSvg.findOne(`#_pips_${key}`) as Svg;
                            if ( (piece === null) || (piece === undefined) ) {
                                throw new Error(`Could not find the requested piece (${key}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
                            }
                            const factor = 1; // 0.85;
                            usePieceAt(group, piece, this.cellsize, point.x, point.y, factor);
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

