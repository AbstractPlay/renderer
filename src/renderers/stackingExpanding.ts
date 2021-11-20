import { G as SVGG, SVG, Svg, Use as SVGUse } from "@svgdotjs/svg.js";
import { applyToPoint, compose, scale } from "transformation-matrix";
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
        const opts = this.optionsPrecheck(options);

        if (json.board === null) {
            throw new Error("This renderer requires that `board` be defined.");
        }

        // BOARD
        // Delegate to style-specific renderer
        let gridPoints: GridPoints;
        if (! ("style" in json.board)) {
            throw new Error(`This 'board' schema cannot be handled by the '${ this.name }' renderer.`);
        }
        switch (json.board.style) {
            case "squares-checkered":
            case "squares":
                gridPoints = this.squares(json, draw, opts);
                break;
            case "go":
                json.board.width = 19;
                json.board.height = 19;
            case "vertex":
            case "vertex-cross":
                gridPoints = this.vertex(json, draw, opts);
                break;
            case "snubsquare":
                gridPoints = this.snubSquare(json, draw, opts);
                break;
            case "hex-of-hex":
                gridPoints = this.hexOfHex(json, draw, opts);
                break;
            case "hex-of-tri":
                gridPoints = this.hexOfTri(json, draw, opts);
                break;
            case "hex-of-cir":
                gridPoints = this.hexOfCir(json, draw, opts);
                break;
            default:
                throw new Error(`The requested board style (${ json.board.style }) is not supported by the '${ this.name }' renderer.`);
        }

        // PIECES
        // Load all the pieces in the legend
        this.loadLegend(json, draw, opts);

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
                            const piece = SVG("#" + key);
                            if ( (piece === null) || (piece === undefined) ) {
                                throw new Error(`Could not find the requested piece (${key}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
                            }
                            const use = group.use(piece) as SVGG;
                            use.center(point.x, point.y);
                            const sheetCellSize = piece.attr("data-cellsize");
                            if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                                throw new Error(`The glyph you requested (${key}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                            }
                            use.scale((this.cellsize / sheetCellSize) * 0.85);
                        }
                    }
                }
            }
        }

        // Now add transparent tiles over each cell for the click handler
        const tile = draw.defs().rect(this.cellsize, this.cellsize).fill("#fff").opacity(0).id("_clickCatcher");
        const tiles = group.group().id("tiles");
        for (let row = 0; row < gridPoints.length; row++) {
            for (let col = 0; col < gridPoints[row].length; col++) {
                const {x, y} = gridPoints[row][col];
                const t = tiles.use(tile).center(x, y);
                if (opts.boardClick !== undefined) {
                    t.click(() => opts.boardClick!(row, col, ""));
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
                const used: SVGUse[] = [];
                const nested = draw.defs().group().id("_expansion").size(columnWidth, boardHeight);
                for (const p of (area.stack as string[]).reverse()) {
                    const piece = SVG("#" + p);
                    if ( (piece === null) || (piece === undefined) ) {
                        throw new Error(`Could not find the requested piece (${p}). Each piece in the stack *must* exist in the \`legend\`.`);
                    }
                    const sheetCellSize = piece.attr("data-cellsize");
                    if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                        throw new Error(`The glyph you requested (${p}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                    }
                    const use = nested.use(piece);
                    used.push(use);
                    // `use` places the object at 0,0. When you scale by the center, 0,0 moves. This transformation corects that.
                    const factor = (columnWidth / sheetCellSize);
                    const matrix = compose(scale(factor, factor, sheetCellSize / 2, sheetCellSize / 2));
                    const newpt = applyToPoint(matrix, {x: 0, y: 0});
                    use.dmove(newpt.x * -1, newpt.y * -1);
                    use.scale(factor * 0.95);
                }

                // Now go through each piece and shift them down
                let dy: number = 0;
                for (const piece of used) {
                    piece.dmove(0, dy);
                    dy += piece.height() as number;
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

        // Add key
        // Override a left-hand placement
        if ( ("key" in json) && (json.key !== undefined) && ("placement" in json.key) && (json.key.placement === "left") ) {
            json.key.placement = "right";
        }
        const keyImg = this.buildKey(json, draw);
        if (keyImg !== undefined) {
            const img = SVG("#_key");
            if (img === undefined) {
                throw new Error("Could not load the key image. This should never happen.");
            }
            let keyX: number;
            let keyY: number;
            let placement = "right";
            if ( ("key" in json) && (json.key !== undefined) && ("placement" in json.key) && (json.key.placement !== undefined) ) {
                placement = json.key.placement;
            }
            let position = "outside";
            if ( ("key" in json) && (json.key !== undefined) && ("textPosition" in json.key) && (json.key.textPosition !== undefined) ) {
                position = json.key.textPosition;
            }
            switch (placement) {
                case "right":
                    keyX = gridPoints[0][gridPoints[0].length - 1].x + (this.cellsize * 2);
                    keyY = gridPoints[0][0].y - this.cellsize;
                    break;
                case "top":
                    keyX = gridPoints[0][0].x - this.cellsize;
                    if (position === "outside") {
                        keyY = gridPoints[0][0].y - (this.cellsize * 1.5) - (keyImg.height() as number);
                    } else {
                        keyY = gridPoints[0][0].y - (this.cellsize * 2) - (keyImg.height() as number);
                    }
                    break;
                case "bottom":
                    keyX = gridPoints[0][0].x - this.cellsize;
                    if (position === "outside") {
                        keyY = gridPoints[gridPoints.length - 1][0].y + (this.cellsize * 1.5);
                    } else {
                        keyY = gridPoints[gridPoints.length - 1][0].y + (this.cellsize * 2);
                    }
                    break;
                default:
                    throw new Error("Unrecognized placement. This should never happen.");
            }
            draw.use(img).dmove(keyX, keyY);
        }

        // Annotations
        if (opts.showAnnotations) {
            this.annotateBoard(json, draw, gridPoints, opts);
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
                const nested = draw.defs().group().id(`_stash${iArea}`).size(areaWidth, areaHeight);
                for (let iStack = 0; iStack < area.stash.length; iStack++) {
                    const stack = area.stash[iStack];
                    const used: SVGUse[] = [];
                    for (const p of stack) {
                        const piece = SVG("#" + p);
                        if ( (piece === null) || (piece === undefined) ) {
                            throw new Error(`Could not find the requested piece (${p}). Each piece in the stack *must* exist in the \`legend\`.`);
                        }
                        const sheetCellSize = piece.attr("data-cellsize");
                        if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                            throw new Error(`The glyph you requested (${p}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                        }
                        const use = nested.use(piece);
                        used.push(use);
                        // `use` places the object at 0,0. When you scale by the center, 0,0 moves. This transformation corects that.
                        const factor = (cellsize / sheetCellSize);
                        const matrix = compose(scale(factor, factor, sheetCellSize / 2, sheetCellSize / 2));
                        const newpt = applyToPoint(matrix, {x: 0, y: 0});
                        use.dmove((newpt.x * -1) + (iStack * cellsize), (newpt.y * -1) + textHeight);
                        use.scale(factor * 0.95);
                    }
                    // Now go through each piece and shift them down
                    let dy: number = 0;
                    for (const piece of used) {
                        piece.dmove(0, dy);
                        dy -= offset;
                    }
                }

                // Add area label
                const txt = nested.text(area.label);
                txt.font("size", "50%").move(0, 0).fill("#000");

                // Now place the whole group below the board
                draw.use(nested).move(gridPoints[0][0].x - this.cellsize, placeY);
                placeY += nested.height() as number;
            }
        }

        // Rotate the board if requested
        if (opts.rotate > 0) {
            this.rotateBoard(draw);
        }
    }
}