import { Svg, Box as SVGBox } from "@svgdotjs/svg.js";
import { GridPoints, rectOfRects, IPoint, Poly } from "../grids/index.js";
import { APRenderRep, type Polypiece } from "../schemas/schema.js";
import { IRendererOptionsIn, RendererBase } from "./_base.js";
import { usesInlineGlyphRender } from "../common/inlineGlyphBoard.js";
import { usePieceAt } from "../common/plotting.js";
import { renderPolyominoAreas } from "./polyominoAreas.js";
import { x2uid } from "../common/glyph2uid.js";
import { squares } from "../boards/index.js";

/**
 * This renderer places polyomino pieces on a square grid.
 * Pieces can overlap each other and be composed of multiple colours.
 *
 */
export class PolyominoRenderer extends RendererBase {

    public static readonly rendererName: string = "polyomino";

    public render(json: APRenderRep, draw: Svg, options: IRendererOptionsIn): void {
        this.jsonPrechecks(json);
        if (this.json === undefined) {
            throw new Error("JSON prechecks fatally failed.");
        }
        this.optionsPrecheck(options);
        this.rootSvg = draw;

        // BOARD
        // Delegate to style-specific renderer
        if (usesInlineGlyphRender(this.json.board)) {
            return this.renderGlyph();
        }
        if (this.json.board === null) {
            throw new Error("Board is required.");
        }

        // Load all the pieces in the legend (have to do this early so the glyphs are available for marking the board)
        // Polymatrices are built into the base class
        // The legend is only used for `pieces` areas
        this.loadLegend();

        let gridPoints: GridPoints;
        // let origPoints: GridPoints;
        let boardFill: Poly|undefined;
        if (! ("style" in this.json.board)) {
            throw new Error(`This 'board' schema cannot be handled by the '${ PolyominoRenderer.rendererName }' renderer.`);
        }
        switch (this.json.board.style) {
            case "squares-beveled":
            case "squares-checkered":
            case "squares":
                // origPoints = this.squares();
                ({ boardFill } = squares(this));
                gridPoints = rectOfRects({gridHeight: (this.json.board.height as number) + 1, gridWidth: (this.json.board.width as number) + 1, cellSize: this.cellsize});
                gridPoints = gridPoints.map((row) => row.map((cell) => ({x: cell.x - (this.cellsize / 2), y: cell.y - (this.cellsize / 2)} as IPoint)));
                break;
            default:
                throw new Error(`The requested board style (${ this.json.board.style }) is not  supported by the multicell-square renderer.`);
        }

        // let baseStroke = 1;
        // if ( ("strokeWeight" in this.json.board) && (this.json.board.strokeWeight !== undefined) ) {
        //     baseStroke = this.json.board.strokeWeight;
        // }
        const cellsize = this.cellsize;

        // PIECES
        const board = this.rootSvg.findOne("#board") as import("@svgdotjs/svg.js").G;
        const group = board.group().id("pieces");
        if ( (this.json.pieces !== null) && (Array.isArray(this.json.pieces)) && (! Array.isArray(this.json.pieces[0])) ) {
            const pieces = this.json.pieces as Polypiece[];
            pieces.forEach(p => {
                if (p.z === undefined) {
                    p.z = 0;
                }
            });
            pieces.sort((a, b) => a.z! - b.z!);

            for (const piece of pieces) {
                const uid = x2uid(piece);
                // eslint-disable-next-line prefer-const
                let {row, col, matrix} = piece;
                const height = matrix.length;
                let width = 0;
                if (height > 0) {
                    width = matrix[0].length;
                }
                const {x: tlx, y: tly} = gridPoints[row][col];
                const realwidth = (width * cellsize);
                const realheight = (height * cellsize);

                // create nested SVG of the piece, with border
                const nested = this.rootSvg.defs().nested().id(`aprender-polyomino-${uid}`).viewbox(0, 0, realwidth, realheight);
                this.buildPoly(nested, matrix);

                // place it on the overall board
                const use = group.use(nested).width(realwidth).height(realheight).move(tlx, tly);
                if ( (piece.id !== undefined) && (this.options.boardClick !== undefined) ) {
                    use.click((e : Event) => {this.options.boardClick!(row, col, piece.id!); e.stopPropagation(); });
                }
            }
        }

        // annotations
        if (this.options.showAnnotations) {
            // for now, assuming this renderer will only need the 'outline' annotation
            // this.annotateBoard(origPoints);
            this.annotateBoard(gridPoints);
        }

        // if there's a board backfill, it needs to be done before rotation
        const backfilled = this.backFill(boardFill, true);

        const box = this.rotateBoard({ignoreRotation: true});

        const layoutBox = this.placeTrackAreas(box);

        // `pieces` area, if present
        this.piecesArea(layoutBox);

        // button bar
        this.placeButtonBar(layoutBox);

        // key
        this.placeKey(layoutBox);

        if (!backfilled) {
            this.backFill(boardFill);
        }
    }

    protected piecesArea(box: SVGBox): {newY: number|undefined; width: number|undefined} {
        return renderPolyominoAreas.call(this, box, { boardBottomExtra: this.cellsize, dominoTilesUnsupported: true });
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