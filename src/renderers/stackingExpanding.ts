import { G as SVGG, SVG, Svg, Use as SVGUse } from "@svgdotjs/svg.js";
import { applyToPoint, compose, scale } from "transformation-matrix";
import { GridPoints } from "../grids/_base";
import { APRenderRep } from "../schema";
import { IRendererOptionsIn, RendererBase } from "./_base";

export class StackingExpandingRenderer extends RendererBase {

    constructor() {
        super("stacking-expanding");
    }

    public render(json: APRenderRep, draw: Svg, options: IRendererOptionsIn): void {
        json = this.jsonPrechecks(json);
        const opts = this.optionsPrecheck(options);

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

        // Add expanded column, if requested
        if ( (json.areas !== undefined) && (Array.isArray(json.areas)) && (json.areas.length > 0) ) {
            const area = json.areas.find((x) => x.hasOwnProperty("stack") && x.stack !== undefined && Array.isArray(x.stack));
            if (area === undefined) {
                throw new Error("Malformed `areas` definition");
            }
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
                txt.move(0, 0).fill("#000");
            }

            // Now place the whole group to the left-hand side of the board
            draw.use(nested)
                .move(gridPoints[0][0].x - (this.cellsize * 1.5) - columnWidth, gridPoints[0][0].y - this.cellsize);
                // .center(gridPoints[0][0].x - this.cellsize - columnWidth, gridPoints[0][0].y - this.cellsize + (boardHeight / 2));
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
            switch (placement) {
                case "right":
                    keyX = gridPoints[0][gridPoints[0].length - 1].x + (this.cellsize * 2);
                    keyY = gridPoints[0][0].y - this.cellsize;
                    break;
                case "top":
                    keyX = gridPoints[0][0].x - this.cellsize;
                    keyY = gridPoints[0][0].y - (this.cellsize * 2) - (keyImg.height() as number);
                    break;
                case "bottom":
                    keyX = gridPoints[0][0].x - this.cellsize;
                    keyY = gridPoints[gridPoints.length - 1][0].y + (this.cellsize * 2);
                    break;
                default:
                    throw new Error("Unrecognized placement. This should never happen.");
            }
            draw.use(img).move(keyX, keyY);
        }

        // Finally, annotations
        if (opts.showAnnotations) {
            this.annotateBoard(json, draw, gridPoints);
        }

        // Rotate the board if requested
        if (opts.rotate > 0) {
            this.rotateBoard(draw);
        }
    }
}
