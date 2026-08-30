import { Svg, G as SVGG } from "@svgdotjs/svg.js";
import { IPolyPolygon } from "../grids/_base.js";
import { APRenderRep } from "../schemas/schema.js";
import { peripheralReferenceSides } from "../references/helpers.js";
import { IRendererOptionsIn, RendererBase} from "./_base.js";
import { usePieceAt } from "../common/plotting.js";

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

        if (! ("style" in this.json.board)) {
            throw new Error(`This 'board' schema cannot be handled by the '${ DefaultRenderer.rendererName }' renderer.`);
        }
        const { grid: gridPoints, polys, boardFill } = this.dispatchBoardRender();

        if (this.json.board !== null && "reference" in this.json.board && this.json.board.reference !== undefined) {
            const ref = this.json.board.reference;
            if (ref.layout === "sidebar") {
                const peripheral = peripheralReferenceSides(ref);
                if (peripheral.length > 0) {
                    this.placeBoardReference(polys, { sides: peripheral });
                }
            } else {
                this.placeBoardReference(polys);
            }
        }

        // PIECES
        const board = this.rootSvg.findOne("#board") as SVGG;
        const group = board.group().id("pieces");
        if (this.json.pieces !== null) {
            const boardWidth = ("width" in this.json.board && this.json.board.width !== undefined)
                ? this.json.board.width
                : 0;
            const pieces = this.parseBoardPieces(this.json.pieces, boardWidth);
            this.placeBoardGridPieces(gridPoints, pieces, group, this.json.board.style, polys);
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
        const bottomRefBox = this.placeBoardReference(polys, { sides: ["bottom"], layoutBox: box });
        let layoutBox = bottomRefBox ?? box;

        layoutBox = this.placeTrackAreas(layoutBox);

        // `pieces` area, if present
        this.piecesArea(layoutBox);

        // button bar
        this.placeButtonBar(layoutBox);

        // key
        this.placeKey(layoutBox);

        // scrollBar
        this.placeScroll(layoutBox);

        // compassRose
        this.placeCompass(layoutBox);

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
