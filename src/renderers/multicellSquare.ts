import { Svg } from "@svgdotjs/svg.js";
import { GridPoints, rectOfRects, IPoint } from "../grids";
import { APRenderRep, type Multipiece } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase } from "./_base";
import { usePieceAt } from "../common/plotting";

export interface IPiecesArea {
    type: "pieces";
    pieces: [string, ...string[]];
    label: string;
}

/**
 * This renderer deforms pieces to fit into rectangular areas that can span
 * cells and overlap other pieces.
 *
 */
export class MulticellSquareRenderer extends RendererBase {

    public static readonly rendererName: string = "multicell-square";

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
        this.loadLegend({preserve: false});

        let gridPoints: GridPoints;
        let origPoints: GridPoints;
        if (! ("style" in this.json.board)) {
            throw new Error(`This 'board' schema cannot be handled by the '${ MulticellSquareRenderer.rendererName }' renderer.`);
        }
        switch (this.json.board.style) {
            case "squares-beveled":
            case "squares-checkered":
            case "squares":
                origPoints = this.squares();
                gridPoints = rectOfRects({gridHeight: (this.json.board.height as number) + 1, gridWidth: (this.json.board.width as number) + 1, cellSize: this.cellsize});
                gridPoints = gridPoints.map((row) => row.map((cell) => ({x: cell.x - (this.cellsize / 2), y: cell.y - (this.cellsize / 2)} as IPoint)));
                break;
            default:
                throw new Error(`The requested board style (${ this.json.board.style }) is not  supported by the multicell-square renderer.`);
        }

        // PIECES
        const group = this.rootSvg.group().id("pieces");
        if ( (this.json.pieces !== null) && (Array.isArray(this.json.pieces)) && (! Array.isArray(this.json.pieces[0])) ) {
            const pieces = this.json.pieces as Multipiece[];
            pieces.forEach(p => {
                if (p.z === undefined) {
                    p.z = 0;
                }
                if (p.width === undefined) {
                    p.width = 1;
                }
                if (p.height === undefined) {
                    p.height = 1;
                }
            });
            pieces.sort((a, b) => a.z! - b.z!);

            let cloned = [...gridPoints.map(lst => [...lst.map(pt => { return {...pt};})])];
            if (this.options.rotate === 180) {
                cloned = cloned.map((r) => r.reverse()).reverse();
            }
            for (const piece of pieces) {
                let {row, col} = piece;
                // adjust if rotated
                if (this.options.rotate === 180) {
                    row += piece.height || 0;
                    col += piece.width || 0;
                }
                const svg = this.rootSvg.findOne("#" + piece.glyph) as Svg;
                if ( (svg === null) || (svg === undefined) ) {
                    throw new Error(`Could not find the requested piece (${piece.glyph}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
                }
                let {x: tlx, y: tly} = cloned[row][col];
                const factor = 1.25;
                let realwidth = ((piece.width || 1) * this.cellsize);
                tlx += (realwidth * (1 - factor)) / 2;
                realwidth *= factor;
                let realheight = ((piece.height || 1) * this.cellsize);
                tly += (realheight * (1 - factor)) / 2;
                realheight *= factor;
                const right = tlx + realwidth;
                const bottom = tly + realheight;
                const cx = tlx + ((right - tlx) / 2);
                const cy = tly + ((bottom - tly) / 2);
                group.use(svg).width(realwidth).height(realheight).center(cx, cy);
                // if (this.options.boardClick !== undefined) {
                //     if ( ( (this.json.board.tileSpacing !== undefined) && (this.json.board.tileSpacing > 0) ) || ( (! this.json.board.style.startsWith("squares")) && (! this.json.board.style.startsWith("vertex")) ) ) {
                //         use.click((e : Event) => {this.options.boardClick!(row, col, key); e.stopPropagation(); });
                //     }
                // }
            }
        }

        // annotations
        if (this.options.showAnnotations) {
            this.annotateBoard(origPoints);
        }

        // rotate gridpoints if necessary
        let modGrid = [...gridPoints.map(lst => [...lst.map(pt => { return {...pt};})])];
        if (this.options.rotate === 180) {
            modGrid = modGrid.map((r) => r.reverse()).reverse();
        }

        // `pieces` area, if present
        this.piecesArea(modGrid);

        // button bar
        this.placeButtonBar(modGrid);

        // key
        this.placeKey(modGrid);

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

