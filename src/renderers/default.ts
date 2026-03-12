import { Svg, G as SVGG } from "@svgdotjs/svg.js";
import { GridPoints, IPoint, IPolyPolygon, Poly } from "../grids/_base";
import { APRenderRep } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase} from "./_base";
import { usePieceAt } from "../common/plotting";
import { cairoCatalan, cairoCollinear, cobweb, conhex, conicalHex, dvgc, hexOfCir, hexOfHex, hexOfTri, hexOfTriF, hexSlanted, moon, onyx, pentagonal, pyramidHex, rectOfHex, rectOfTri, snubSquare, snubSquareCells, sowing, squares, squaresDiamonds, squaresStacked, stackingTriangles, vertex, wheel } from "../boards";

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
        let pcGrid: GridPoints|undefined;
        let polys: Poly[][]|undefined;
        let boardFill: Poly|undefined;
        if (! ("style" in this.json.board)) {
            throw new Error(`This 'board' schema cannot be handled by the '${ DefaultRenderer.rendererName }' renderer.`);
        }
        switch (this.json.board.style) {
            case "squares-beveled":
            case "squares-checkered":
            case "squares":
            case "pegboard":
                ({ grid: gridPoints, polys, boardFill } = squares(this));
                break;
            case "squares-diamonds":
                ({ grid: gridPoints, polys, boardFill } = squaresDiamonds(this));
                break;
            case "squares-stacked":
                ({ grid: gridPoints, boardFill } = squaresStacked(this));
                break;
            case "vertex":
            case "vertex-cross":
            case "vertex-fanorona":
                ({ grid: gridPoints, boardFill } = vertex(this));
                break;
            case "snubsquare":
                ({ grid: gridPoints, boardFill } = snubSquare(this));
                break;
            case "onyx":
                ({ grid: gridPoints, boardFill } = onyx(this));
                break;
            case "snubsquare-cells":
                ({ grid: gridPoints, polys, boardFill } = snubSquareCells(this));
                break;
            case "pentagonal":
            case "pentagonal-bluestone":
                ({ grid: gridPoints, boardFill } = pentagonal(this));
                break;
            case "hex-of-hex":
                ({ grid: gridPoints, polys, boardFill } = hexOfHex(this));
                break;
            case "hex-of-tri":
                ({ grid: gridPoints, boardFill } = hexOfTri(this));
                break;
            case "hex-of-tri-f":
                ({ grid: gridPoints, polys, boardFill } = hexOfTriF(this));
                break;
            case "hex-of-cir":
                ({ grid: gridPoints, polys, boardFill } = hexOfCir(this));
                break;
            case "rect-of-tri":
                ({ grid: gridPoints, boardFill } = rectOfTri(this));
                break;
            // case "rect-of-tri-f":
            //     [gridPoints, polys] = rectOfTriF();
            //     break;
            case "hex-slanted":
                ({ grid: gridPoints, polys, boardFill } = hexSlanted(this));
                break;
            case "hex-odd-p":
            case "hex-even-p":
            case "hex-odd-f":
            case "hex-even-f":
                ({ grid: gridPoints, polys, boardFill } = rectOfHex(this));
                break;
            case "triangles-stacked": {
                ({ grid: gridPoints, polys, boardFill } = stackingTriangles(this));
                break;
            }
            case "circular-cobweb":
                ({ grid: gridPoints, polys, boardFill } = cobweb(this));
                break;
            case "circular-wheel":
                ({ grid: gridPoints, polys, boardFill } = wheel(this));
                break;
            case "sowing":
                ({ grid: gridPoints, boardFill } = sowing(this));
                break;
            case "conhex-cells":
                ({ grid: gridPoints, polys, boardFill } = conhex(this));
                break;
            case "cairo-collinear":
                ({ grid: gridPoints, polys, boardFill } = cairoCollinear(this));
                break;
            case "cairo-catalan":
                ({ grid: gridPoints, polys, boardFill } = cairoCatalan(this));
                break;
            case "conical-hex":
            case "conical-hex-narrow":
                ({ grid: gridPoints, polys, boardFill } = conicalHex(this));
                break;
            case "pyramid-hex":
                ({ grid: gridPoints, polys, boardFill } = pyramidHex(this));
                break;
            case "dvgc":
            case "dvgc-checkered":
                ({ grid: gridPoints, polys, boardFill } = dvgc(this));
                break;
            case "circular-moon":
                this.cellsize = 15;
                ({ grid: gridPoints, polys, boardFill } = moon(this));
                break;
            default:
                throw new Error(`The requested board style (${ this.json.board.style }) is not yet supported by the default renderer.`);
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
                            let point: IPoint|undefined;
                            // first check if pcGrid was provided
                            if (pcGrid !== undefined) {
                                point = pcGrid[row][col];
                            } else {
                                // handle pieces beyond the grid boundaries
                                if (row >= gridPoints.length || col >= gridPoints[row].length) {
                                    if (this.json.board.style === "squares-stacked") {
                                        point = this.getStackedPoint(gridPoints, col, row);
                                        if (point === undefined) {
                                            continue;
                                        }
                                    } else if (this.json.board.style === "triangles-stacked" && polys !== undefined) {
                                        point = this.getTriStackedPoint(gridPoints, col, row, polys);
                                        if (point === undefined) {
                                            continue;
                                        }
                                    } else {
                                        continue;
                                    }
                                } else {
                                    point = gridPoints[row][col];
                                }
                                // if (point === undefined) {
                                //     continue;
                                // }
                            }

                            const piece = this.rootSvg.findOne("#" + key) as Svg;
                            if ( (piece === null) || (piece === undefined) ) {
                                throw new Error(`Could not find the requested piece (${key}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
                            }
                            const factor = 0.85;
                            const use = usePieceAt({svg: group, piece, cellsize: this.cellsize, x: point.x, y: point.y, scalingFactor: factor});
                            // if (options.rotate && this.json.options && this.json.options.includes('rotate-pieces'))
                            //     rotate(use, options.rotate, point.x, point.y);
                            if ( (this.options.boardClick !== undefined) && ( (this.json.options === undefined) || (! this.json.options.includes("no-piece-click")) ) ) {
                                // if ( ( (this.json.board.tileSpacing !== undefined) && (this.json.board.tileSpacing > 0) ) || ( (! this.json.board.style.startsWith("squares")) && (! this.json.board.style.startsWith("vertex")) ) ) {
                                if (this.json.board.style !== "squares-stacked") {
                                    use.click((e : Event) => {this.options.boardClick!(row, col, key); e.stopPropagation(); });
                                } else {
                                    use.attr({"pointer-events": "none"});
                                }
                            } else {
                                use.attr({"pointer-events": "none"});
                            }
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
        const backfilled = this.backFill(boardFill, true);

        // if there are reserves areas, those also need to be placed before rotation
        if (this.json.board.style.startsWith("dvgc")) {
            const allPoints = (polys!.flat().flat() as IPolyPolygon[]).map(p => p.points).flat();
            const xMin = Math.min(...allPoints.map(pt => pt.x));
            const xMax = Math.max(...allPoints.map(pt => pt.x));
            const yMin = Math.min(...allPoints.map(pt => pt.y));
            const yMax = Math.max(...allPoints.map(pt => pt.y));
            this.reservesArea({
                bottomN: yMin - (this.cellsize / 2),
                topS: yMax + (this.cellsize / 2),
                xLeft: xMin,
                xRight: xMax,
            });
        }

        const box = this.rotateBoard();

        // `pieces` area, if present
        this.piecesArea(box);

        // button bar
        this.placeButtonBar(box);

        // key
        this.placeKey(box);

        // scrollBar
        this.placeScroll(box);

        // compassRose
        this.placeCompass(box);

        if (!backfilled) {
            this.backFill(boardFill);
        }
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
        usePieceAt({svg: this.rootSvg, piece, cellsize: this.cellsize, x: this.cellsize / 2, y: this.cellsize / 2, scalingFactor: 0.9});
    }
}
