import { Svg, Use as SVGUse, G as SVGG } from "@svgdotjs/svg.js";
import { GridPoints, Poly } from "../grids/_base";
import { APRenderRep, AreaStackingExpanded } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase } from "./_base";
import { usePieceAt } from "../common/plotting";

interface ILocalStash {
    [k: string]: unknown;
    type: "localStash";
    label: string;
    stash: string[][];
}

/**
 * This is the `stacking-expanding` renderer that handles things like local stashes and the expanded stack column.
 *
 */
export class StackingExpandingRenderer extends RendererBase {

    public static readonly rendererName: string = "stacking-expanding";
    constructor() {
        super();
    }

    public render(json: APRenderRep, draw: Svg, options: IRendererOptionsIn): void {
        this.jsonPrechecks(json);
        if (this.json === undefined) {
            throw new Error("JSON prechecks fatally failed.");
        }
        this.optionsPrecheck(options);
        this.options.rotate = 0;
        this.rootSvg = draw;

        if (this.json.board === null) {
            // Load all the pieces in the legend
            this.loadLegend();

            if ( (this.json.areas !== undefined) && (Array.isArray(this.json.areas)) && (this.json.areas.length > 0) ) {
                const area = this.json.areas.find((x) => x.type === "expandedColumn") as AreaStackingExpanded;
                if (area !== undefined) {
                    // Create a group to store the column and place all the pieces at 0,0 within it
                    const columnWidth = this.cellsize * 1;
                    const used: [SVGUse, number][] = [];
                    const nested = this.rootSvg.group().id("_expansion").width(columnWidth);
                    for (const p of area.stack.reverse()) {
                        const piece = this.rootSvg.findOne("#" + p) as Svg;
                        if ( (piece === null) || (piece === undefined) ) {
                            throw new Error(`Could not find the requested piece (${p}). Each piece in the stack *must* exist in the \`legend\`.`);
                        }
                        const use = usePieceAt({svg: nested, piece, cellsize: columnWidth, x: columnWidth / 2, y: columnWidth / 2, scalingFactor: 0.95});
                        used.push([use, 500]);
                    }

                    // Now go through each piece and shift them down
                    let dy = 0;
                    for (const piece of used) {
                        piece[0].dmove(0, dy);
                        dy += piece[1];
                    }

                    // Add cell name
                    if ( ("cell" in area) && (area.cell !== undefined) ) {
                        const txt = nested.text(`Cell ${area.cell}`);
                        txt.font("size", "50%");
                        txt.move(0, (this.cellsize / 4) * -1).fill(this.options.colourContext.strokes);
                    }
                }
            } else {
                throw new Error("If `board` is null, then an `expandedColumn` area must be present.");
            }
        } else {
            // BOARD
            // Delegate to style-specific renderer
            let gridPoints: GridPoints;
            let polys: Poly[][]|undefined;
            if (! ("style" in this.json.board)) {
                throw new Error(`This 'board' schema cannot be handled by the '${ StackingExpandingRenderer.rendererName }' renderer.`);
            }
            switch (this.json.board.style) {
                case "squares-checkered":
                case "squares":
                    [gridPoints, polys] = this.squares();
                    break;
                case "vertex":
                case "vertex-cross":
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
                default:
                    throw new Error(`The requested board style (${ this.json.board.style }) is not supported by the '${ StackingExpandingRenderer.rendererName }' renderer.`);
            }

            // PIECES
            // Load all the pieces in the legend
            this.loadLegend();

            // Now place the pieces
            const board = this.rootSvg.findOne("#board") as SVGG;
            const group = board.group().id("pieces");
                if (this.json.pieces !== null) {
                // Generate pieces array
                let pieces: string[][][] = [];

                if ( (this.json.pieces instanceof Array) && (this.json.pieces[0] instanceof Array) && (this.json.pieces[0][0] instanceof Array) ) {
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
                                const piece = this.rootSvg.findOne("#" + key) as Svg;
                                if ( (piece === null) || (piece === undefined) ) {
                                    throw new Error(`Could not find the requested piece (${key}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
                                }
                                usePieceAt({svg: group, piece, cellsize: this.cellsize, x: point.x, y: point.y, scalingFactor: 0.85});
                            }
                        }
                    }
                }
            }

            // Now add transparent tiles over each cell for the click handler
            const tile = this.rootSvg.defs().symbol().viewbox(0, 0, this.cellsize, this.cellsize);
            tile.rect(this.cellsize, this.cellsize).fill("#fff").opacity(0);
            const tiles = group.group().id("tiles");
            for (let row = 0; row < gridPoints.length; row++) {
                for (let col = 0; col < gridPoints[row].length; col++) {
                    const {x, y} = gridPoints[row][col];
                    const t = tiles.use(tile).size(this.cellsize, this.cellsize).center(x, y);
                    if (this.options.boardHover !== undefined) {
                        t.mouseenter(() => this.options.boardHover!(row, col, ""));
                    }
                }
            }

            // Add expanded column, if requested
            if ( (this.json.areas !== undefined) && (Array.isArray(this.json.areas)) && (this.json.areas.length > 0) ) {
                const area = this.json.areas.find((x) => x.type === "expandedColumn") as AreaStackingExpanded;
                if (area !== undefined) {
                    // Create a group to store the column and place all the pieces at 0,0 within it
                    const boardHeight = gridPoints[gridPoints.length - 1][0].x - gridPoints[0][0].x + (this.cellsize * 2);
                    const columnWidth = this.cellsize * 1;
                    const used: [SVGUse, number][] = [];
                    const nested = this.rootSvg.defs().group().id("_expansion").size(columnWidth, boardHeight);
                    for (const p of area.stack.reverse()) {
                        const piece = this.rootSvg.findOne("#" + p) as Svg;
                        if ( (piece === null) || (piece === undefined) ) {
                            throw new Error(`Could not find the requested piece (${p}). Each piece in the stack *must* exist in the \`legend\`.`);
                        }
                        const use = usePieceAt({svg: nested, piece, cellsize: columnWidth, x: columnWidth / 2, y: columnWidth / 2, scalingFactor: 0.95});
                        used.push([use, columnWidth]);
                    }

                    // Now go through each piece and shift them down
                    let dy = 0;
                    for (const piece of used) {
                        piece[0].dmove(0, dy);
                        dy += piece[1];
                    }

                    // Add cell name
                    if ( ("cell" in area) && (area.cell !== undefined) ) {
                        const txt = nested.text(`Cell ${area.cell}`);
                        txt.font("size", "50%");
                        txt.move(0, (this.cellsize / 4) * -1).fill(this.options.colourContext.strokes);
                    }

                    // Now place the whole group to the left-hand side of the board
                    this.rootSvg.use(nested)
                        .move(gridPoints[0][0].x - (this.cellsize * 1.5) - columnWidth, gridPoints[0][0].y - this.cellsize);
                        // .center(gridPoints[0][0].x - this.cellsize - columnWidth, gridPoints[0][0].y - this.cellsize + (boardHeight / 2));
                }
            }

            // Annotations
            if (this.options.showAnnotations) {
                this.annotateBoard(gridPoints, polys);
            }

            // Look for local stashes
            // This code is optimized for pyramids
            if ( (this.json.areas !== undefined) && (Array.isArray(this.json.areas)) && (this.json.areas.length > 0) ) {
                const areas = this.json.areas.filter((x) => x.type === "localStash") as ILocalStash[];
                const boardBottom = gridPoints[gridPoints.length - 1][0].y + this.cellsize;
                let placeY = boardBottom + (this.cellsize / 2);
                for (const area of areas) {
                    const maxHeight = Math.max(...area.stash.map((s) => s.length)) - 1;
                    const textHeight = 10; // the allowance for the label
                    const cellsize = this.cellsize * 0.75;
                    const offset = 0.35 * cellsize;
                    for (let iStack = 0; iStack < area.stash.length; iStack++) {
                        const stack = area.stash[iStack];
                        for (let i = 0; i < stack.length; i++) {
                            const p = stack[i];
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
                            const newx = gridPoints[0][0].x - this.cellsize + iStack * cellsize + (cellsize / 2);
                            const newy = placeY + textHeight + (maxHeight - i) * offset + 0.15 * cellsize + (cellsize / 2);
                            const use = usePieceAt({svg: this.rootSvg, piece, cellsize, x: newx, y: newy});
                            if (this.options.boardClick !== undefined) {
                                use.click((e: Event) => {this.options.boardClick!(-1, -1, p); e.stopPropagation();});
                            }
                        }
                    }

                    // Add area label
                    const txt = this.rootSvg.text(area.label);
                    txt.font({size: textHeight, anchor: "start", fill: this.options.colourContext.strokes})
                        .attr("alignment-baseline", "hanging")
                        .attr("dominant-baseline", "hanging")
                        .move(gridPoints[0][0].x - this.cellsize, placeY);

                    const areaHeight = textHeight + cellsize + maxHeight * offset;
                    placeY += areaHeight + (this.cellsize * 0.5);
                }
            }

            const box = this.rotateBoard({ignoreRotation: true});

            // button bar (override a left-hand placement)
            this.placeButtonBar(box, "right");

            // key (override a left-hand placement)
            this.placeKey(box, "right");
        }
    }
}
