import { Svg } from "@svgdotjs/svg.js";
import { GridPoints } from "../grids/_base";
import { APRenderRep } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase } from "./_base";
import { usePieceAt } from "../common/plotting";

export interface IPiecesArea {
    type: "pieces";
    pieces: [string, ...string[]];
    label: string;
}

/**
 * This is the default renderer used for most games.
 *
 */
export class SowingPipsRenderer extends RendererBase {

    public static readonly rendererName: string = "sowing-pips";

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
            throw new Error(`This 'board' schema cannot be handled by the '${ SowingPipsRenderer.rendererName }' renderer.`);
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

            // generate pip glyphs for each unique pit size
            const sizes = new Set<string>(pieces.flat().flat());
            for (const key of sizes) {
                const num = parseInt(key, 10);
                if ( (isNaN(num)) || (num === 0) ) {
                    continue;
                }
                if (num > 30) {
                    throw new Error("This renderer can only display 30 stones in a single pit. Please switch to numeric view.");
                }
                const cellsize = 500;
                const r = (cellsize * 0.75) / 2;
                const innerSize = r * Math.sqrt(2);
                const tlxInner = (cellsize - innerSize) / 2;
                const tlyInner = (cellsize - innerSize) / 2;
                // const brxInner = tlxInner + innerSize;
                const bryInner = tlyInner + innerSize;
                const innerCell = innerSize / 4;
                const innerD = innerCell * 0.75;
                // console.log(`Cellsize: ${cellsize}, r: ${r}, innerSize: ${innerSize}, tlxInner: ${tlxInner}, tlyInner: ${tlyInner}, bryInner: ${bryInner}, innerCell: ${innerCell}, innerD: ${innerD}`);
                const nested = this.rootSvg.defs().nested().id(`_pips_${key}`);
                const symbol1 = nested.symbol();
                symbol1.circle(innerD).stroke({color: "#000", width: innerD * 0.15}).fill({color: "#fff"}).center(0,0);
                symbol1.viewbox(0 - (innerCell / 2), 0 - (innerCell / 2), innerCell, innerCell);
                const symbol2 = nested.symbol();
                symbol2.circle(innerD).stroke({color: "#000", width: innerD * 0.15}).fill({color: "#aaa"}).center(0,0);
                symbol2.viewbox(0 - (innerCell / 2), 0 - (innerCell / 2), innerCell, innerCell);
                const symbol3 = nested.symbol();
                symbol3.circle(innerD).stroke({color: "#000", width: innerD * 0.15}).fill({color: "#555"}).center(0,0);
                symbol3.viewbox(0 - (innerCell / 2), 0 - (innerCell / 2), innerCell, innerCell);
                const symbol4 = nested.symbol();
                symbol4.circle(innerD).stroke({color: "#000", width: innerD * 0.15}).fill({color: "#000"}).center(0,0);
                symbol4.viewbox(0 - (innerCell / 2), 0 - (innerCell / 2), innerCell, innerCell);
                for (let i = 0; i < num; i++) {
                    let symbol = symbol1;
                    let row: number; let col: number;
                    if (i < 16) {
                        row = Math.floor(i / 4);
                        col = i % 4;
                    } else if (i < 25) {
                        symbol = symbol2;
                        row = Math.floor((i - 16) / 3) + 0.5;
                        col = ((i - 16) % 3) + 0.5;
                    } else if (i < 29) {
                        symbol = symbol3;
                        row = Math.floor((i - 25) / 2) + 1;
                        col = ((i - 25) % 2) + 1;
                    } else {
                        symbol = symbol4;
                        row = 1.5;
                        col = 1.5;
                    }
                    nested.use(symbol).width(innerCell).height(innerCell).move(tlxInner + (innerCell * col), bryInner - (innerCell * (row + 1)));
                }
                nested.attr("data-cellsize", 500);

                let sheetCellSize = nested.viewbox().height;
                if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                    sheetCellSize = nested.attr("data-cellsize") as number;
                    if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                        throw new Error(`The glyph you requested (${key}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                    }
                }

                // const use = nested.use(got).height(cellsize).width(cellsize).x(-cellsize / 2).y(-cellsize / 2);

                // Scale it appropriately
                // scale(use, 0.75, 0, 0);
                // const size = 0.75 * cellsize;
                const size = cellsize;
                nested.viewbox(0, 0, size, size).size(size, size);
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

