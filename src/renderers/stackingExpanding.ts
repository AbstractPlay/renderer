import { SVG, Svg, Use as SVGUse } from "@svgdotjs/svg.js";
import { GridPoints } from "../grids/_base";
import { APRenderRep } from "../schema";
import { IRendererOptionsIn, RendererBase } from "./_base";

interface ILocalStash {
    [k: string]: unknown;
    type: "localStash";
    label: string;
    stash: string[][];
}

export class StackingExpandingRenderer extends RendererBase {

    constructor() {
        super("stacking-expanding");
    }

    public render(json: APRenderRep, draw: Svg, options: IRendererOptionsIn): void {
        json = this.jsonPrechecks(json);
        this.optionsPrecheck(options);
        this.options.rotate = 0;

        if (json.board === null) {
            // Load all the pieces in the legend
            this.loadLegend(json, draw);

            if ( (json.areas !== undefined) && (Array.isArray(json.areas)) && (json.areas.length > 0) ) {
                const area = json.areas.find((x) => x.type === "expandedColumn");
                if (area !== undefined) {
                    // Create a group to store the column and place all the pieces at 0,0 within it
                    const columnWidth = this.cellsize * 1;
                    const used: [SVGUse, number][] = [];
                    const nested = draw.group().id("_expansion").width(columnWidth);
                    for (const p of (area.stack as string[]).reverse()) {
                        const piece = SVG("#" + p) as Svg;
                        if ( (piece === null) || (piece === undefined) ) {
                            throw new Error(`Could not find the requested piece (${p}). Each piece in the stack *must* exist in the \`legend\`.`);
                        }
                        let sheetCellSize = piece.viewbox().h;
                        if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                            sheetCellSize = piece.attr("data-cellsize");
                            if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                                throw new Error(`The glyph you requested (${p}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                            }
                        }
                        const use = nested.use(piece);
                        used.push([use, piece.viewbox().h]);
                        const factor = (columnWidth / sheetCellSize) * 0.95;
                        use.scale(factor, 0, 0);
                    }

                    // Now go through each piece and shift them down
                    let dy: number = 0;
                    for (const piece of used) {
                        piece[0].dmove(0, dy);
                        dy += piece[1];
                    }

                    // Add cell name
                    if ( ("cell" in area) && (area.cell !== undefined) ) {
                        const txt = nested.text(`Cell ${area.cell}`);
                        txt.font("size", "50%");
                        txt.move(0, (this.cellsize / 4) * -1).fill("#000");
                    }
                }
            } else {
                throw new Error("If `board` is null, then an `expandedColumn` area must be present.");
            }
        } else {
            // BOARD
            // Delegate to style-specific renderer
            let gridPoints: GridPoints;
            if (! ("style" in json.board)) {
                throw new Error(`This 'board' schema cannot be handled by the '${ this.name }' renderer.`);
            }
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
            // Load all the pieces in the legend
            this.loadLegend(json, draw);

            // Now place the pieces
            const group = draw.group().id("pieces");
            if (json.pieces !== null) {
                // Generate pieces array
                let pieces: string[][][] = new Array();

                if ( (json.pieces instanceof Array) && (json.pieces[0] instanceof Array) && (json.pieces[0][0] instanceof Array) ) {
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
                            }
                        }
                    }
                }
            }

            // Now add transparent tiles over each cell for the click handler
            const tile = draw.defs().symbol().viewbox(0, 0, this.cellsize, this.cellsize);
            tile.rect(this.cellsize, this.cellsize).fill("#fff").opacity(0);
            const tiles = group.group().id("tiles");
            for (let row = 0; row < gridPoints.length; row++) {
                for (let col = 0; col < gridPoints[row].length; col++) {
                    const {x, y} = gridPoints[row][col];
                    const t = tiles.use(tile).size(this.cellsize, this.cellsize).center(x, y);
                    if (this.options.boardHover !== undefined) {
                        t.mousemove(() => this.options.boardHover!(row, col, ""));
                    }
                }
            }

            // Add expanded column, if requested
            if ( (json.areas !== undefined) && (Array.isArray(json.areas)) && (json.areas.length > 0) ) {
                const area = json.areas.find((x) => x.type === "expandedColumn");
                if (area !== undefined) {
                    // Create a group to store the column and place all the pieces at 0,0 within it
                    const boardHeight = gridPoints[gridPoints.length - 1][0].x - gridPoints[0][0].x + (this.cellsize * 2);
                    const columnWidth = this.cellsize * 1;
                    const used: [SVGUse, number][] = [];
                    const nested = draw.defs().group().id("_expansion").size(columnWidth, boardHeight);
                    for (const p of (area.stack as string[]).reverse()) {
                        const piece = SVG("#" + p) as Svg;
                        if ( (piece === null) || (piece === undefined) ) {
                            throw new Error(`Could not find the requested piece (${p}). Each piece in the stack *must* exist in the \`legend\`.`);
                        }
                        let sheetCellSize = piece.viewbox().h;
                        if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                            sheetCellSize = piece.attr("data-cellsize");
                            if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                                throw new Error(`The glyph you requested (${p}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                            }
                        }
                        const use = nested.use(piece);
                        used.push([use, piece.viewbox().h]);
                        const factor = (columnWidth / sheetCellSize) * 0.95;
                        use.scale(factor, 0, 0);
                        // // `use` places the object at 0,0. When you scale by the center, 0,0 moves. This transformation corects that.
                        // const factor = (columnWidth / sheetCellSize);
                        // const matrix = compose(scale(factor, factor, sheetCellSize / 2, sheetCellSize / 2));
                        // const newpt = applyToPoint(matrix, {x: 0, y: 0});
                        // use.dmove(newpt.x * -1, newpt.y * -1);
                        // use.scale(factor * 0.95);
                    }

                    // Now go through each piece and shift them down
                    let dy: number = 0;
                    for (const piece of used) {
                        piece[0].dmove(0, dy);
                        dy += piece[1];
                    }

                    // Add cell name
                    if ( ("cell" in area) && (area.cell !== undefined) ) {
                        const txt = nested.text(`Cell ${area.cell}`);
                        txt.font("size", "50%");
                        txt.move(0, (this.cellsize / 4) * -1).fill("#000");
                    }

                    // Now place the whole group to the left-hand side of the board
                    draw.use(nested)
                        .move(gridPoints[0][0].x - (this.cellsize * 1.5) - columnWidth, gridPoints[0][0].y - this.cellsize);
                        // .center(gridPoints[0][0].x - this.cellsize - columnWidth, gridPoints[0][0].y - this.cellsize + (boardHeight / 2));
                }
            }

            // Annotations
            if (this.options.showAnnotations) {
                this.annotateBoard(json, draw, gridPoints);
            }

            // Look for local stashes
            // This code is optimized for pyramids
            if ( (json.areas !== undefined) && (Array.isArray(json.areas)) && (json.areas.length > 0) ) {
                const areas = json.areas.filter((x) => x.type === "localStash") as ILocalStash[];
                const boardBottom = gridPoints[gridPoints.length - 1][0].y + this.cellsize;
                let placeY = boardBottom + (this.cellsize / 2);
                for (let iArea = 0; iArea < areas.length; iArea++) {
                    const area = areas[iArea];
                    const numStacks = area.stash.length;
                    const maxHeight = Math.max(...area.stash.map((s) => s.length));
                    const textHeight = 10; // the allowance for the label
                    const cellsize = this.cellsize * 0.75;
                    const offset = cellsize * 3.5;
                    const areaWidth = cellsize * numStacks;
                    const areaHeight = textHeight + cellsize + (offset * (maxHeight - 1));
                    const nested = draw.defs().nested().id(`_stash${iArea}`).size(areaWidth, areaHeight);
                    for (let iStack = 0; iStack < area.stash.length; iStack++) {
                        const stack = area.stash[iStack];
                        const used: [SVGUse, number][] = [];
                        for (const p of stack) {
                            const piece = SVG("#" + p) as Svg;
                            if ( (piece === null) || (piece === undefined) ) {
                                throw new Error(`Could not find the requested piece (${p}). Each piece in the stack *must* exist in the \`legend\`.`);
                            }
                            let sheetCellSize = piece.viewbox().h;
                            if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                                sheetCellSize = piece.attr("data-cellsize");
                                if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                                    throw new Error(`The glyph you requested (${p}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                                }
                            }
                            const use = nested.use(piece);
                            if (this.options.boardClick !== undefined) {
                                use.click(() => this.options.boardClick!(-1, -1, p));
                            }
                            used.push([use, piece.viewbox().h]);
                            const factor = (cellsize / sheetCellSize);
                            const newx = iStack * cellsize;
                            const newy = textHeight;
                            use.dmove(newx, newy);
                            use.scale(factor, newx, newy);
                        }
                        // Now go through each piece and shift them down
                        let dy: number = 0;
                        for (const piece of used) {
                            piece[0].dmove(0, dy);
                            dy -= offset;
                        }
                    }

                    // Add area label
                    const txt = nested.text(area.label);
                    txt.font({size: textHeight, anchor: "start", fill: "#000"})
                        .attr("alignment-baseline", "hanging")
                        .attr("dominant-baseline", "hanging")
                        .move(0, 0);

                    // Now place the whole group below the board
                    draw.use(nested).move(gridPoints[0][0].x - this.cellsize, placeY);
                    placeY += nested.height() as number;
                }
            }
        }
    }
}
